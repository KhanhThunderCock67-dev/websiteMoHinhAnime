const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Set environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';

const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateToken } = require('../utils/jwt');

let server;
let baseUrl;
let adminToken;
let customerToken;
let testCategory;

test.before(async () => {
  // Wait for mongoose connection if not yet connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hobby_ecommerce');
  }

  // Start test server on dynamic/separate port
  await new Promise((resolve) => {
    server = app.listen(5099, '127.0.0.1', () => {
      baseUrl = 'http://127.0.0.1:5099';
      resolve();
    });
  });

  // Create admin user for tests
  await User.deleteMany({ email: /test.*@example\.com/ });
  const admin = await User.create({
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken = generateToken(admin._id, admin.role);

  // Create regular customer user for tests
  const customer = await User.create({
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    password: 'password123',
    role: 'customer',
  });
  customerToken = generateToken(customer._id, customer.role);

  // Ensure a test category exists
  testCategory = await Category.findOne();
  if (!testCategory) {
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Category for testing',
    });
  }
});

test.after(async () => {
  // Clean up test users & test products
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Product.deleteMany({ name: /Test Product/ });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  setTimeout(() => process.exit(0), 100);
});


test('1. Authorization - Reject unauthenticated upload request', async () => {
  const formData = new FormData();
  formData.append('image', new Blob(['fake content'], { type: 'image/jpeg' }), 'test.jpg');

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /no access token provided/i);
});

test('2. Authorization - Reject customer (non-admin) upload request with 403 Forbidden', async () => {
  const formData = new FormData();
  formData.append('image', new Blob(['fake content'], { type: 'image/jpeg' }), 'test.jpg');

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /not authorized/i);
});

test('3. Validation - Reject upload when no file is attached', async () => {
  const formData = new FormData();

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /No image file uploaded/i);
});

test('4. Validation - Reject invalid file type (.txt file)', async () => {
  const formData = new FormData();
  formData.append(
    'image',
    new Blob(['hello world text file'], { type: 'text/plain' }),
    'document.txt'
  );

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Invalid file type/i);
});

test('5. Security - Reject fake image with spoofed extension and invalid magic bytes', async () => {
  // A file named 'fake.jpg' but with plain text bytes (not FF D8 FF)
  const fakeBytes = Buffer.from('NOT_A_REAL_JPEG_IMAGE_HEADER_123456');
  const formData = new FormData();
  formData.append(
    'image',
    new Blob([fakeBytes], { type: 'image/jpeg' }),
    'fake.jpg'
  );

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Signature does not match/i);
});

test('6. Validation - Reject oversized file exceeding 5MB limit', async () => {
  // Create a 5.5 MB buffer
  const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);
  largeBuffer[0] = 0xff;
  largeBuffer[1] = 0xd8;
  largeBuffer[2] = 0xff;

  const formData = new FormData();
  formData.append(
    'image',
    new Blob([largeBuffer], { type: 'image/jpeg' }),
    'oversized.jpg'
  );

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /exceeds maximum limit/i);
});

test('7. Upload & Persistence - Successfully upload genuine JPEG image and verify static access', async () => {
  // Valid minimal JPEG binary buffer
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0xff, 0xd9,
  ]);

  const formData = new FormData();
  formData.append(
    'image',
    new Blob([jpegHeader], { type: 'image/jpeg' }),
    'test-figure.jpg'
  );

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 200);
  const result = await res.json();
  assert.strictEqual(result.success, true);
  assert.ok(result.data.url.startsWith('/uploads/'));
  assert.ok(result.data.filename.endsWith('.jpg'));

  // Test static persistence access via GET /uploads/<filename>
  const staticRes = await fetch(`${baseUrl}${result.data.url}`);
  assert.strictEqual(staticRes.status, 200);
  const staticBuffer = Buffer.from(await staticRes.arrayBuffer());
  assert.deepStrictEqual(staticBuffer, jpegHeader);
});

test('8. Upload & Persistence - Successfully upload genuine PNG image', async () => {
  // Valid minimal PNG binary header: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  ]);

  const formData = new FormData();
  formData.append(
    'image',
    new Blob([pngHeader], { type: 'image/png' }),
    'test-banner.png'
  );

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  assert.strictEqual(res.status, 200);
  const result = await res.json();
  assert.strictEqual(result.success, true);
  assert.ok(result.data.url.startsWith('/uploads/'));
  assert.ok(result.data.filename.endsWith('.png'));
});

test('9. Product Lifecycle - Create product with uploaded image reference and retrieve it', async () => {
  // 1. Upload a genuine JPEG image
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0xff, 0xd9,
  ]);
  const formData = new FormData();
  formData.append('image', new Blob([jpegHeader], { type: 'image/jpeg' }), 'warhammer.jpg');

  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const uploadJson = await uploadRes.json();
  const uploadedImageUrl = uploadJson.data.url;

  // 2. Create product using the uploaded image URL
  const productPayload = {
    name: 'Test Product - Space Marine Vanguard',
    brand: 'Games Workshop',
    category: testCategory._id.toString(),
    subCategory: 'Warhammer 40k',
    price: 65,
    discountPrice: 0,
    stockCount: 15,
    images: [uploadedImageUrl],
    description: 'Elite frontline squad of vanguard space marines.',
  };

  const createRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(productPayload),
  });

  assert.strictEqual(createRes.status, 201);
  const createJson = await createRes.json();
  const createdProduct = createJson.data.product;
  assert.strictEqual(createdProduct.images[0], uploadedImageUrl);

  // 3. Edit product without changing image (image retention test)
  const updatePayload = {
    name: 'Test Product - Space Marine Vanguard Updated',
    price: 70,
    images: createdProduct.images, // retains existing image
  };

  const updateRes = await fetch(`${baseUrl}/api/products/${createdProduct._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(updatePayload),
  });

  assert.strictEqual(updateRes.status, 200);
  const updateJson = await updateRes.json();
  assert.strictEqual(updateJson.data.product.images[0], uploadedImageUrl);
  assert.strictEqual(updateJson.data.product.price, 70);

  // 4. Edit product by replacing the image with a new upload
  const newPngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const newFormData = new FormData();
  newFormData.append('image', new Blob([newPngHeader], { type: 'image/png' }), 'replacement.png');

  const replaceUploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: newFormData,
  });
  const replaceUploadJson = await replaceUploadRes.json();
  const replacedImageUrl = replaceUploadJson.data.url;

  const replaceRes = await fetch(`${baseUrl}/api/products/${createdProduct._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ images: [replacedImageUrl] }),
  });

  assert.strictEqual(replaceRes.status, 200);
  const replaceJson = await replaceRes.json();
  assert.strictEqual(replaceJson.data.product.images[0], replacedImageUrl);
});

test('10. Legacy Compatibility - Products with external image URLs remain compatible', async () => {
  const legacyUrl = 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80';
  const productPayload = {
    name: 'Test Product - Legacy Anime Scale Figure',
    brand: 'Good Smile Company',
    category: testCategory._id.toString(),
    subCategory: 'Anime Figures',
    price: 180,
    discountPrice: 0,
    stockCount: 5,
    images: [legacyUrl],
    description: 'Classic 1/7 scale anime figure from archival catalog.',
  };

  const createRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(productPayload),
  });

  assert.strictEqual(createRes.status, 201);
  const createJson = await createRes.json();
  assert.strictEqual(createJson.data.product.images[0], legacyUrl);

  // Retrieve via GET /api/products/:id
  const getRes = await fetch(`${baseUrl}/api/products/${createJson.data.product._id}`);
  assert.strictEqual(getRes.status, 200);
  const getJson = await getRes.json();
  assert.strictEqual(getJson.data.product.images[0], legacyUrl);
});

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const mongoose = require('mongoose');

// Set environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5098';

const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { generateToken } = require('../utils/jwt');

let server;
let baseUrl;
let adminUser;
let adminToken;
let customerUser;
let customerToken;
let secondCustomer;
let secondCustomerToken;
let testProduct;
let testOrder;

// Helper to make JSON HTTP requests
const jsonRequest = ({ method, path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqBody = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          let parsedJson;
          try {
            parsedJson = JSON.parse(responseData);
          } catch (e) {
            parsedJson = responseData;
          }
          resolve({ status: res.statusCode, data: parsedJson });
        });
      }
    );

    req.on('error', reject);
    if (reqBody) {
      req.write(reqBody);
    }
    req.end();
  });
};

test.before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hobby_ecommerce');
  }

  baseUrl = 'http://127.0.0.1:5098';

  // Setup test users with isolated domain conforming to User model regex
  await User.deleteMany({ email: /@rev-system\.net$/ });

  adminUser = await User.create({
    name: 'Rev Admin',
    email: 'admin@rev-system.net',
    password: 'password123',
    role: 'admin',
  });
  adminToken = generateToken(adminUser._id, adminUser.role);

  customerUser = await User.create({
    name: 'Rev Customer 1',
    email: 'customer1@rev-system.net',
    password: 'password123',
    role: 'customer',
  });
  customerToken = generateToken(customerUser._id, customerUser.role);

  secondCustomer = await User.create({
    name: 'Rev Customer 2',
    email: 'customer2@rev-system.net',
    password: 'password123',
    role: 'customer',
  });
  secondCustomerToken = generateToken(secondCustomer._id, secondCustomer.role);

  // Setup category & product
  let cat = await Category.findOne({ slug: 'anime-figures' });
  if (!cat) {
    cat = await Category.create({
      name: 'Anime Figures Test',
      slug: 'anime-figures',
      description: 'Anime test category',
    });
  }

  testProduct = await Product.create({
    name: 'Test Figure Asuka 1/7 Scale',
    slug: `test-figure-asuka-${Date.now()}`,
    sku: `TEST-FIG-${Date.now()}`,
    category: cat._id,
    categorySlug: 'anime-figures',
    subCategory: 'Scale 1/7 & 1/4',
    brand: 'Alter',
    price: 180,
    stockCount: 10,
    description: 'Detailed test figure',
    rating: 0,
    numReviews: 0,
  });

  // Setup completed order for customerUser so customer has Verified Purchase
  testOrder = await Order.create({
    user: customerUser._id,
    orderItems: [
      {
        product: testProduct._id,
        name: testProduct.name,
        image: '',
        price: testProduct.price,
        quantity: 1,
        sku: testProduct.sku,
      },
    ],
    shippingAddress: {
      fullName: 'Rev Customer 1',
      phone: '0123456789',
      street: '123 Anime St',
      city: 'Tokyo',
      state: 'Kanto',
      postalCode: '10001',
      country: 'Japan',
    },
    paymentMethod: 'Credit Card',
    itemsPrice: 180,
    shippingPrice: 10,
    taxPrice: 15,
    totalPrice: 205,
    orderStatus: 'completed',
    isDelivered: true,
  });
});

test.after(async () => {
  if (testProduct) {
    await Review.deleteMany({ product: testProduct._id });
    await Product.findByIdAndDelete(testProduct._id);
  }
  if (testOrder) {
    await Order.findByIdAndDelete(testOrder._id);
  }
  await User.deleteMany({ email: /@rev-system\.net$/ });
  setTimeout(() => process.exit(0), 100);
});

test('1. Security & Auth - Reject unauthenticated review submission', async () => {
  const res = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    body: {
      productId: testProduct._id.toString(),
      rating: 5,
      comment: 'Anonymous try',
    },
  });

  assert.strictEqual(res.status, 401);
});

test('2. Validation - Reject invalid rating outside 1 to 5 stars', async () => {
  const res = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      productId: testProduct._id.toString(),
      rating: 6,
      comment: 'Invalid rating',
    },
  });

  assert.strictEqual(res.status, 400);
});

test('3. Review Submission - Customer creates review with criteria and Verified Purchase is auto-detected', async () => {
  const res = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      productId: testProduct._id.toString(),
      rating: 5,
      comment: 'Figure cực kỳ sắc sảo, sơn bóng mượt không tì vết!',
      criteria: [
        { name: 'Detail Quality', rating: 5 },
        { name: 'Paint Quality', rating: 5 },
        { name: 'Material Quality', rating: 4 },
      ],
    },
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.data.isVerifiedPurchase, true, 'Should detect verified purchase from completed order');
  assert.strictEqual(res.data.data.rating, 5);
  assert.strictEqual(res.data.data.criteria.length, 3);

  // Check product rating synchronization
  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.rating, 5);
  assert.strictEqual(updatedProduct.numReviews, 1);
});

test('4. Idempotency / 1 Review Per User - Updating existing review when submitting again', async () => {
  const res = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      productId: testProduct._id.toString(),
      rating: 4,
      comment: 'Updated review: tuyệt vời sau 1 tháng trưng bày!',
      criteria: [
        { name: 'Detail Quality', rating: 4 },
        { name: 'Paint Quality', rating: 5 },
      ],
    },
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.rating, 4);

  // Still only 1 review for this product
  const count = await Review.countDocuments({ product: testProduct._id });
  assert.strictEqual(count, 1);

  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.rating, 4);
  assert.strictEqual(updatedProduct.numReviews, 1);
});

test('5. Second Review - Another customer without order creates unverified review', async () => {
  const res = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    headers: { Authorization: `Bearer ${secondCustomerToken}` },
    body: {
      productId: testProduct._id.toString(),
      rating: 5,
      comment: 'Chưa mua trên web nhưng đã thấy hàng thật ở triển lãm, đẹp lắm!',
    },
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.isVerifiedPurchase, false, 'Non-buyer should NOT be verified');

  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.numReviews, 2);
  // Average of 4 and 5 is 4.5
  assert.strictEqual(updatedProduct.rating, 4.5);
});

test('6. Helpful Voting - Prevent voting on own review', async () => {
  const review = await Review.findOne({ user: customerUser._id, product: testProduct._id });

  const res = await jsonRequest({
    method: 'POST',
    path: `/api/reviews/${review._id}/vote`,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  assert.strictEqual(res.status, 400);
  assert.match(res.data.message, /cannot vote on your own review/i);
});

test('7. Helpful Voting - Another user toggles helpful vote (increment & decrement)', async () => {
  const review = await Review.findOne({ user: customerUser._id, product: testProduct._id });

  // First vote -> toggles ON
  const vote1 = await jsonRequest({
    method: 'POST',
    path: `/api/reviews/${review._id}/vote`,
    headers: { Authorization: `Bearer ${secondCustomerToken}` },
  });

  assert.strictEqual(vote1.status, 200);
  assert.strictEqual(vote1.data.data.hasVoted, true);
  assert.strictEqual(vote1.data.data.helpfulCount, 1);

  // Second vote from same user -> toggles OFF
  const vote2 = await jsonRequest({
    method: 'POST',
    path: `/api/reviews/${review._id}/vote`,
    headers: { Authorization: `Bearer ${secondCustomerToken}` },
  });

  assert.strictEqual(vote2.status, 200);
  assert.strictEqual(vote2.data.data.hasVoted, false);
  assert.strictEqual(vote2.data.data.helpfulCount, 0);
});

test('8. Storefront Query - Get reviews with stats, distribution, and criteria averages', async () => {
  const res = await jsonRequest({
    method: 'GET',
    path: `/api/reviews/product/${testProduct._id}`,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.reviews.length, 2);
  assert.strictEqual(res.data.data.stats.totalReviews, 2);
  assert.strictEqual(res.data.data.stats.averageRating, 4.5);
  assert.strictEqual(res.data.data.stats.verifiedCount, 1);
  assert.strictEqual(res.data.data.stats.distribution[4], 1);
  assert.strictEqual(res.data.data.stats.distribution[5], 1);
  assert.ok(res.data.data.categoryCriteria.length > 0);
  assert.ok(res.data.data.userReview !== null, 'Should return current user review');
});

test('9. Admin Moderation - Moderate review status (Hide) and verify exclusion from public rating', async () => {
  const secondReview = await Review.findOne({ user: secondCustomer._id, product: testProduct._id });

  // Admin hides the 5-star review
  const hideRes = await jsonRequest({
    method: 'PATCH',
    path: `/api/reviews/admin/${secondReview._id}/status`,
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'hidden' },
  });

  assert.strictEqual(hideRes.status, 200);
  assert.strictEqual(hideRes.data.data.status, 'hidden');

  // Verify that the product's public rating drops back to 4.0 (only 1 active review remains)
  const productAfterHide = await Product.findById(testProduct._id);
  assert.strictEqual(productAfterHide.numReviews, 1);
  assert.strictEqual(productAfterHide.rating, 4);

  // Verify storefront query excludes hidden review
  const storefrontRes = await jsonRequest({
    method: 'GET',
    path: `/api/reviews/product/${testProduct._id}`,
  });
  assert.strictEqual(storefrontRes.data.data.reviews.length, 1);
});

test('10. Admin Moderation - Admin unhides review and rating is restored', async () => {
  const secondReview = await Review.findOne({ user: secondCustomer._id, product: testProduct._id });

  const unhideRes = await jsonRequest({
    method: 'PATCH',
    path: `/api/reviews/admin/${secondReview._id}/status`,
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'active' },
  });

  assert.strictEqual(unhideRes.status, 200);

  const productAfterUnhide = await Product.findById(testProduct._id);
  assert.strictEqual(productAfterUnhide.numReviews, 2);
  assert.strictEqual(productAfterUnhide.rating, 4.5);
});

test('11. Catalog Rating Filter - Products filter by minRating', async () => {
  // Filter minRating=4 (our testProduct is 4.5, so it should be included)
  const filter4 = await jsonRequest({
    method: 'GET',
    path: `/api/products?minRating=4&category=anime-figures`,
  });

  assert.strictEqual(filter4.status, 200);
  const found = filter4.data.data.products.some((p) => p._id.toString() === testProduct._id.toString());
  assert.strictEqual(found, true);

  // Filter minRating=5 (our testProduct is 4.5, so it should be excluded)
  const filter5 = await jsonRequest({
    method: 'GET',
    path: `/api/products?minRating=5&category=anime-figures`,
  });

  assert.strictEqual(filter5.status, 200);
  const foundIn5 = filter5.data.data.products.some((p) => p._id.toString() === testProduct._id.toString());
  assert.strictEqual(foundIn5, false);
});

test('12. Deletion - Owner deletes own review and product stats update', async () => {
  const review = await Review.findOne({ user: customerUser._id, product: testProduct._id });

  const delRes = await jsonRequest({
    method: 'DELETE',
    path: `/api/reviews/${review._id}`,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  assert.strictEqual(delRes.status, 200);

  const updatedProduct = await Product.findById(testProduct._id);
  assert.strictEqual(updatedProduct.numReviews, 1);
  assert.strictEqual(updatedProduct.rating, 5); // Only the 5-star review remains
});

test('13. Review Dedicated Photos Folder - Upload to /uploads/reviews/, attach to review, and clean up upon deletion', async () => {
  // 1. Create a genuine PNG buffer
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  ]);

  const formData = new FormData();
  formData.append(
    'images',
    new Blob([pngHeader], { type: 'image/png' }),
    'user-photo.png'
  );

  // Authenticated customer uploads review image
  const uploadRes = await fetch(`${baseUrl}/api/upload/review-images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
    body: formData,
  });

  assert.strictEqual(uploadRes.status, 200);
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadJson.success, true);
  assert.ok(Array.isArray(uploadJson.data.urls));
  const uploadedUrl = uploadJson.data.urls[0];

  // Must be in dedicated /uploads/reviews/ subfolder!
  assert.ok(
    uploadedUrl.startsWith('/uploads/reviews/'),
    `Expected URL to start with /uploads/reviews/, got: ${uploadedUrl}`
  );

  const physicalPath = path.join(__dirname, '..', uploadedUrl);
  assert.ok(fs.existsSync(physicalPath), 'Image file must physically exist in server/uploads/reviews/');

  // Customer creates a review with this photo
  const postRes = await jsonRequest({
    method: 'POST',
    path: '/api/reviews',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      productId: testProduct._id.toString(),
      rating: 5,
      comment: 'Review with real photo in dedicated reviews folder!',
      images: [uploadedUrl],
    },
  });

  assert.strictEqual(postRes.status, 201);
  const createdReview = postRes.data.data;
  assert.strictEqual(createdReview.images[0], uploadedUrl);

  // Delete review and verify cleanup
  const delRes = await jsonRequest({
    method: 'DELETE',
    path: `/api/reviews/${createdReview._id}`,
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  assert.strictEqual(delRes.status, 200);
  assert.strictEqual(
    fs.existsSync(physicalPath),
    false,
    'Review photo in /uploads/reviews/ must be deleted when review is deleted'
  );
});


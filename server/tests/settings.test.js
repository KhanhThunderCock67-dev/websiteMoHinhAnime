const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.PORT = '5098';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_hobby_vault_2026';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hobby_ecommerce';

const app = require('../server');
const User = require('../models/User');
const Setting = require('../models/Setting');

let server;
let adminToken;
let customerToken;
const BASE_URL = 'http://localhost:5098';

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(5098, () => resolve());
  });

  const adminUser = await User.findOne({ email: 'admin@hobbyvault.com' });
  if (adminUser) {
    adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  const customerUser = await User.findOne({ email: 'customer@hobbyvault.com' });
  if (customerUser) {
    customerToken = jwt.sign({ id: customerUser._id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  setTimeout(() => process.exit(0), 100);
});


test('1. Public access - Fetch settings without authentication', async () => {
  const res = await httpRequest({
    hostname: 'localhost',
    port: 5098,
    path: '/api/settings',
    method: 'GET',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.settings);
  assert.ok(typeof res.body.data.settings.usdToVndRate === 'number');
  assert.ok(res.body.data.settings.usdToVndRate > 0);
});

test('2. Authorization - Reject unauthenticated update to settings', async () => {
  const payload = JSON.stringify({ usdToVndRate: 25000 });
  const res = await httpRequest(
    {
      hostname: 'localhost',
      port: 5098,
      path: '/api/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    payload
  );

  assert.equal(res.statusCode, 401);
});

test('3. Authorization - Reject customer (non-admin) update to settings', async () => {
  const payload = JSON.stringify({ usdToVndRate: 25000 });
  const res = await httpRequest(
    {
      hostname: 'localhost',
      port: 5098,
      path: '/api/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${customerToken}`,
      },
    },
    payload
  );

  assert.equal(res.statusCode, 403);
});

test('4. Admin - Successfully update exchange rate and localization preferences', async () => {
  const payload = JSON.stringify({
    usdToVndRate: 25500,
    defaultCurrency: 'VND',
    defaultLanguage: 'vi',
  });

  const res = await httpRequest(
    {
      hostname: 'localhost',
      port: 5098,
      path: '/api/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${adminToken}`,
      },
    },
    payload
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.settings.usdToVndRate, 25500);
  assert.equal(res.body.data.settings.defaultCurrency, 'VND');
  assert.equal(res.body.data.settings.defaultLanguage, 'vi');
});

test('5. Validation - Reject invalid negative or zero exchange rate', async () => {
  const payload = JSON.stringify({ usdToVndRate: -100 });
  const res = await httpRequest(
    {
      hostname: 'localhost',
      port: 5098,
      path: '/api/settings',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${adminToken}`,
      },
    },
    payload
  );

  assert.equal(res.statusCode, 400);
});

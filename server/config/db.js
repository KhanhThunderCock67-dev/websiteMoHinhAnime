const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      'mongodb://127.0.0.1:27017/hobby_ecommerce';

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Please ensure MongoDB service is active or check MONGODB_URI / MONGO_URL in your environment variables`);
    // Do not crash during initial scaffolding so devs can examine API routes or configure Atlas URI
  }
};

module.exports = connectDB;

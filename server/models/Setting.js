const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'system',
    },
    usdToVndRate: {
      type: Number,
      required: true,
      default: 25400,
      min: [1, 'Exchange rate must be positive'],
    },
    defaultCurrency: {
      type: String,
      enum: ['USD', 'VND'],
      default: 'USD',
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'vi'],
      default: 'en',
    },
    enableEnglish: {
      type: Boolean,
      default: true,
    },
    enableVietnamese: {
      type: Boolean,
      default: true,
    },
    lastRateUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);

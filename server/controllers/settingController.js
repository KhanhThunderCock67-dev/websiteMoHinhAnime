const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper to get or initialize default system settings
 */
const getOrCreateDefaultSettings = async () => {
  let settings = await Setting.findOne({ key: 'system' });
  if (!settings) {
    settings = await Setting.create({
      key: 'system',
      usdToVndRate: 25400,
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      enableEnglish: true,
      enableVietnamese: true,
      lastRateUpdate: new Date(),
    });
  }
  return settings;
};

/**
 * @desc    Get system settings (rate, default currency, default language)
 * @route   GET /api/settings
 * @access  Public
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateDefaultSettings();

  res.json({
    success: true,
    data: { settings },
  });
});

/**
 * @desc    Update system settings (Admin)
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = asyncHandler(async (req, res) => {
  const {
    usdToVndRate,
    defaultCurrency,
    defaultLanguage,
    enableEnglish,
    enableVietnamese,
  } = req.body;

  let settings = await getOrCreateDefaultSettings();

  if (usdToVndRate !== undefined) {
    const rateNumber = Number(usdToVndRate);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      throw new ApiError(400, 'Exchange rate must be a valid positive number');
    }
    if (rateNumber !== settings.usdToVndRate) {
      settings.lastRateUpdate = new Date();
    }
    settings.usdToVndRate = rateNumber;
  }

  if (defaultCurrency !== undefined) {
    if (!['USD', 'VND'].includes(defaultCurrency)) {
      throw new ApiError(400, "Default currency must be 'USD' or 'VND'");
    }
    settings.defaultCurrency = defaultCurrency;
  }

  if (defaultLanguage !== undefined) {
    if (!['en', 'vi'].includes(defaultLanguage)) {
      throw new ApiError(400, "Default language must be 'en' or 'vi'");
    }
    settings.defaultLanguage = defaultLanguage;
  }

  if (enableEnglish !== undefined) {
    settings.enableEnglish = Boolean(enableEnglish);
  }

  if (enableVietnamese !== undefined) {
    settings.enableVietnamese = Boolean(enableVietnamese);
  }

  await settings.save();

  res.json({
    success: true,
    message: 'System settings updated successfully',
    data: { settings },
  });
});

module.exports = {
  getSettings,
  updateSettings,
};

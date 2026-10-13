const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public route to read current exchange rate and defaults
router.get('/', getSettings);

// Admin route to configure exchange rate and default settings
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;

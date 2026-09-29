const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

// Rate limiting setup with resilient fallback
let chatLimiter;
try {
  const rateLimit = require('express-rate-limit');
  chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 30, // limit each IP to 30 chat requests per minute
    message: {
      success: false,
      message: 'Hệ thống nhận thấy quá nhiều tin nhắn liên tục. Vui lòng chờ 1 phút trước khi tiếp tục.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
} catch (err) {
  // Built-in memory fallback if express-rate-limit package is not yet installed
  const rateMap = new Map();
  chatLimiter = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const record = rateMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }
    rateMap.set(ip, record);

    if (record.count > 30) {
      return res.status(429).json({
        success: false,
        message: 'Bạn thao tác quá nhanh. Vui lòng chờ 1 phút để tiếp tục trò chuyện.',
      });
    }
    next();
  };
}

// POST /api/chat
router.post('/', chatLimiter, handleChat);

module.exports = router;

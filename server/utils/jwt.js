const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a user
 * @param {string} userId - Mongo ObjectId of user
 * @param {string} role - Role of user ('customer' | 'admin')
 * @returns {string} Signed JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = { generateToken };

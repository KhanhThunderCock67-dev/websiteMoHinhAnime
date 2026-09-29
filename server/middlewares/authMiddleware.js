const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes: Validates JWT token from Authorization Bearer header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no access token provided');
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Token is invalid or has expired');
  }
});

/**
 * Authorize roles: Checks if user's role matches any allowed roles
 * @param  {...string} roles - e.g. 'admin', 'customer'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };

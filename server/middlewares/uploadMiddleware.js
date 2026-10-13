const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure dedicated reviews uploads subfolder exists
const reviewUploadsDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(reviewUploadsDir)) {
  fs.mkdirSync(reviewUploadsDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Configure secure disk storage for general / product uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${Date.now()}-${randomHex}${ext}`;
    cb(null, safeFilename);
  },
});

// Configure separate secure disk storage specifically for user review photos
const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reviewUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `review-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeFilename);
  },
});

// Preliminary MIME & extension filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        `Invalid file type. Only JPEG, PNG, and WebP images are allowed.`
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

const uploadReview = multer({
  storage: reviewStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Middleware wrapper to handle Multer upload errors cleanly with ApiError
 */
const handleMulterUpload = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, 'File size exceeds maximum limit of 5MB'));
          }
          return next(new ApiError(400, `Upload error: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
};

/**
 * Middleware wrapper to handle Multer multiple uploads (up to maxCount) for customer reviews into /uploads/reviews/
 */
const handleMulterReviewUploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const uploadArray = uploadReview.array(fieldName, maxCount);
    uploadArray(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, 'File size exceeds maximum limit of 5MB'));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(400, `You can upload at most ${maxCount} images`));
          }
          return next(new ApiError(400, `Upload error: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
};

/**
 * Middleware wrapper to handle single review upload into /uploads/reviews/
 */
const handleMulterReviewUpload = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadSingle = uploadReview.single(fieldName);
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, 'File size exceeds maximum limit of 5MB'));
          }
          return next(new ApiError(400, `Upload error: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
};

const handleMulterUploadMultiple = handleMulterReviewUploadMultiple;

module.exports = {
  upload,
  uploadReview,
  handleMulterUpload,
  handleMulterReviewUpload,
  handleMulterUploadMultiple,
  handleMulterReviewUploadMultiple,
  uploadsDir,
  reviewUploadsDir,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};

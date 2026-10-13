const fs = require('fs');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Validates file signature (magic numbers) to ensure real image content
 * @param {string} filePath - Absolute path to the uploaded file
 * @returns {boolean}
 */
const verifyImageSignature = (filePath) => {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG signature: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    // WebP signature: 'RIFF' at 0..3 and 'WEBP' at 8..11
    const isWebp =
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    return isJpeg || isPng || isWebp;
  } catch (error) {
    return false;
  }
};

/**
 * @desc    Upload single image
 * @route   POST /api/upload
 * @access  Private/Admin
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file uploaded');
  }

  // Deep validation: verify magic numbers/signatures
  const isValidSignature = verifyImageSignature(req.file.path);
  if (!isValidSignature) {
    // Remove the malicious or invalid file immediately
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.error('Failed to unlink rejected file:', e);
    }

    throw new ApiError(400, 'Invalid file content: Signature does not match a valid JPEG, PNG, or WebP image');
  }

  // Build the relative URL that can be accessed via proxy or static route
  const isReview = req.file.destination && req.file.destination.replace(/\\/g, '/').includes('reviews');
  const fileUrl = isReview ? `/uploads/reviews/${req.file.filename}` : `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

/**
 * @desc    Upload multiple images (up to 5) for reviews
 * @route   POST /api/upload/review-images
 * @access  Private (Authenticated users)
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No image files uploaded');
  }

  if (req.files.length > 5) {
    // Cleanup any uploaded files
    req.files.forEach((f) => {
      try {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      } catch (e) {}
    });
    throw new ApiError(400, 'Cannot upload more than 5 images');
  }

  const validUrls = [];
  for (const file of req.files) {
    const isValid = verifyImageSignature(file.path);
    if (!isValid) {
      // Unlink all uploaded files on any validation error
      req.files.forEach((f) => {
        try {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {}
      });
      throw new ApiError(400, 'Invalid file content: Signature does not match a valid JPEG, PNG, or WebP image');
    }
    const isReview = file.destination && file.destination.replace(/\\/g, '/').includes('reviews');
    const relativeUrl = isReview ? `/uploads/reviews/${file.filename}` : `/uploads/${file.filename}`;
    validUrls.push(relativeUrl);
  }

  res.status(200).json({
    success: true,
    message: `${validUrls.length} image(s) uploaded successfully`,
    data: {
      urls: validUrls,
    },
  });
});

module.exports = {
  uploadImage,
  uploadMultipleImages,
  verifyImageSignature,
};

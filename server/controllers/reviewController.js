const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getCriteriaForCategory } = require('../utils/reviewCriteria');

/**
 * Helper to cleanup local uploaded images when a review is deleted
 */
const cleanupUploadedImages = (images = []) => {
  images.forEach((imgUrl) => {
    if (typeof imgUrl === 'string' && imgUrl.startsWith('/uploads/')) {
      const relPath = imgUrl.replace(/^\/uploads\//, '');
      const filePath = path.join(__dirname, '../uploads', relPath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to unlink review image:', err);
      }
    }
  });
};

/**
 * @desc    Get all public active reviews and aggregate statistics for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public (Optional auth for checking user's own vote & review)
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    page = 1,
    limit = 10,
    rating,
    hasImages,
    isVerified,
    sortBy = 'newest',
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Base filter for public display: must be active
  const filter = {
    product: new mongoose.Types.ObjectId(productId),
    status: 'active',
  };

  // Specific rating filter (1 to 5)
  if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
    filter.rating = Number(rating);
  }

  // Filter for reviews with photos
  if (hasImages === 'true') {
    filter['images.0'] = { $exists: true };
  }

  // Filter for verified purchases only
  if (isVerified === 'true') {
    filter.isVerifiedPurchase = true;
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === 'oldest') sort = { createdAt: 1 };
  if (sortBy === 'highest') sort = { rating: -1, createdAt: -1 };
  if (sortBy === 'lowest') sort = { rating: 1, createdAt: -1 };
  if (sortBy === 'helpful') sort = { helpfulCount: -1, createdAt: -1 };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Execute review query and total count in parallel
  const [reviews, totalMatching] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Aggregate statistics across ALL active reviews of this product
  const statsAggregate = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'active',
      },
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$rating' },
              verifiedCount: {
                $sum: { $cond: [{ $eq: ['$isVerifiedPurchase', true] }, 1, 0] },
              },
              withImagesCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $isArray: '$images' },
                        { $gt: [{ $size: '$images' }, 0] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
        ],
        criteriaBreakdown: [
          { $unwind: '$criteria' },
          {
            $group: {
              _id: '$criteria.name',
              avgRating: { $avg: '$criteria.rating' },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const overview = statsAggregate[0]?.overview[0] || {
    totalReviews: 0,
    averageRating: 0,
    verifiedCount: 0,
    withImagesCount: 0,
  };

  // Build clean 5 to 1 star distribution map
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  (statsAggregate[0]?.distribution || []).forEach((item) => {
    if (distribution[item._id] !== undefined) {
      distribution[item._id] = item.count;
    }
  });

  // Build clean criteria averages map
  const criteriaAverages = {};
  (statsAggregate[0]?.criteriaBreakdown || []).forEach((c) => {
    criteriaAverages[c._id] = {
      avgRating: Math.round(c.avgRating * 10) / 10,
      count: c.count,
    };
  });

  // If user is authenticated, check which reviews they voted helpful on, and find their own review
  let userReview = null;
  const currentUserId = req.user ? req.user._id.toString() : null;

  if (currentUserId) {
    const rawUserReview = await Review.findOne({
      product: productId,
      user: currentUserId,
    })
      .populate('user', 'name avatar')
      .lean();
    userReview = rawUserReview;
  }

  // Format reviews with hasVoted flag
  const formattedReviews = reviews.map((rev) => {
    const hasVoted = currentUserId
      ? (rev.votes || []).some((v) => v.user.toString() === currentUserId)
      : false;
    const isOwnReview = currentUserId
      ? rev.user?._id?.toString() === currentUserId
      : false;

    // Do not leak entire votes array to frontend
    const { votes, ...rest } = rev;
    return {
      ...rest,
      hasVoted,
      isOwnReview,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      reviews: formattedReviews,
      stats: {
        totalReviews: overview.totalReviews,
        averageRating: overview.totalReviews > 0 ? Math.round(overview.averageRating * 10) / 10 : 0,
        verifiedCount: overview.verifiedCount,
        withImagesCount: overview.withImagesCount,
        distribution,
        criteriaAverages,
      },
      categoryCriteria: getCriteriaForCategory(product.categorySlug),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMatching,
        pages: Math.ceil(totalMatching / limitNum) || 1,
      },
      userReview,
    },
  });
});

/**
 * @desc    Create or update a customer review
 * @route   POST /api/reviews
 * @access  Private (Authenticated Customer/Admin)
 */
const createOrUpdateReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, images = [], criteria = [] } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Valid Product ID is required');
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new ApiError(400, 'Overall rating must be between 1 and 5 stars');
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    throw new ApiError(400, 'Review comment is required');
  }

  if (comment.trim().length > 2000) {
    throw new ApiError(400, 'Review comment cannot exceed 2000 characters');
  }

  if (!Array.isArray(images) || images.length > 5) {
    throw new ApiError(400, 'You can upload at most 5 images');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Format and validate optional criteria
  const formattedCriteria = [];
  if (Array.isArray(criteria)) {
    for (const c of criteria) {
      if (c && c.name && c.rating && c.rating >= 1 && c.rating <= 5) {
        formattedCriteria.push({
          name: String(c.name).trim(),
          rating: Number(c.rating),
        });
      }
    }
  }

  // VERIFIED PURCHASE CHECK: Strictly verified against completed or delivered orders on backend
  const completedOrder = await Order.findOne({
    user: req.user._id,
    'orderItems.product': product._id,
    $or: [{ orderStatus: 'completed' }, { isDelivered: true }],
  });

  const isVerifiedPurchase = !!completedOrder;
  const orderId = completedOrder ? completedOrder._id : null;

  // Check if user already reviewed this product
  let review = await Review.findOne({
    product: product._id,
    user: req.user._id,
  });

  const isNewReview = !review;

  if (review) {
    // Update existing review
    review.rating = numRating;
    review.comment = comment.trim();
    review.images = images.slice(0, 5);
    review.criteria = formattedCriteria;
    review.isVerifiedPurchase = isVerifiedPurchase;
    review.order = orderId;
    review.status = 'active'; // Reactivate if it was previously hidden
    await review.save();
  } else {
    // Create new review
    review = await Review.create({
      user: req.user._id,
      product: product._id,
      order: orderId,
      rating: numRating,
      comment: comment.trim(),
      images: images.slice(0, 5),
      criteria: formattedCriteria,
      isVerifiedPurchase,
      status: 'active',
    });
  }

  // Recalculate average rating on product
  await Review.calculateAverageRating(product._id);

  // Return populated review
  const populated = await Review.findById(review._id).populate('user', 'name avatar');

  res.status(isNewReview ? 201 : 200).json({
    success: true,
    message: isNewReview ? 'Review submitted successfully' : 'Review updated successfully',
    data: populated,
  });
});

/**
 * @desc    Update own review by ID
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner only)
 */
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment, images, criteria } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid review ID');
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  // Only the review author can modify content
  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this review');
  }

  if (rating !== undefined) {
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new ApiError(400, 'Overall rating must be between 1 and 5 stars');
    }
    review.rating = numRating;
  }

  if (comment !== undefined) {
    if (typeof comment !== 'string' || comment.trim().length === 0) {
      throw new ApiError(400, 'Review comment cannot be empty');
    }
    if (comment.trim().length > 2000) {
      throw new ApiError(400, 'Review comment cannot exceed 2000 characters');
    }
    review.comment = comment.trim();
  }

  if (images !== undefined) {
    if (!Array.isArray(images) || images.length > 5) {
      throw new ApiError(400, 'You can upload at most 5 images');
    }
    review.images = images.slice(0, 5);
  }

  if (criteria !== undefined && Array.isArray(criteria)) {
    const formattedCriteria = [];
    for (const c of criteria) {
      if (c && c.name && c.rating && c.rating >= 1 && c.rating <= 5) {
        formattedCriteria.push({
          name: String(c.name).trim(),
          rating: Number(c.rating),
        });
      }
    }
    review.criteria = formattedCriteria;
  }

  // Re-verify verified purchase status
  const completedOrder = await Order.findOne({
    user: req.user._id,
    'orderItems.product': review.product,
    $or: [{ orderStatus: 'completed' }, { isDelivered: true }],
  });
  review.isVerifiedPurchase = !!completedOrder;
  if (completedOrder) review.order = completedOrder._id;

  await review.save();

  // Recalculate average rating on product
  await Review.calculateAverageRating(review.product);

  const populated = await Review.findById(review._id).populate('user', 'name avatar');

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: populated,
  });
});

/**
 * @desc    Delete own review (Customer) or delete review (Admin)
 * @route   DELETE /api/reviews/:id
 * @access  Private (Owner or Admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid review ID');
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to delete this review');
  }

  const productId = review.product;

  // Cleanup images
  cleanupUploadedImages(review.images);

  await Review.findByIdAndDelete(id);

  // Recalculate average rating on product
  await Review.calculateAverageRating(productId);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

/**
 * @desc    Toggle helpful vote on a review
 * @route   POST /api/reviews/:id/vote
 * @access  Private (Authenticated users, cannot vote on own review)
 */
const toggleHelpfulVote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid review ID');
  }

  const review = await Review.findById(id);
  if (!review || review.status === 'hidden') {
    throw new ApiError(404, 'Review not found');
  }

  // Prevent author from voting on their own review
  if (review.user.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot vote on your own review');
  }

  const userIdStr = req.user._id.toString();
  const existingIndex = review.votes.findIndex(
    (v) => v.user.toString() === userIdStr
  );

  let hasVoted = false;

  if (existingIndex > -1) {
    // Already voted -> toggle off
    review.votes.splice(existingIndex, 1);
    hasVoted = false;
  } else {
    // Not voted yet -> add vote
    review.votes.push({
      user: req.user._id,
      voteType: 'helpful',
    });
    hasVoted = true;
  }

  review.helpfulCount = review.votes.length;
  await review.save();

  res.status(200).json({
    success: true,
    data: {
      hasVoted,
      helpfulCount: review.helpfulCount,
    },
  });
});

/**
 * @desc    Admin: Get all reviews with advanced filters, search, and category statistics
 * @route   GET /api/reviews/admin
 * @access  Private/Admin
 */
const getAdminReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    search = '',
    rating,
    category,
    status,
    isVerified,
    sortBy = 'newest',
  } = req.query;

  const filter = {};

  // Rating filter
  if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
    filter.rating = Number(rating);
  }

  // Status filter ('active' or 'hidden')
  if (status && ['active', 'hidden'].includes(status)) {
    filter.status = status;
  }

  // Verified purchase filter
  if (isVerified === 'true') filter.isVerifiedPurchase = true;
  if (isVerified === 'false') filter.isVerifiedPurchase = false;

  // Category filter
  if (category) {
    let categoryProductIds = [];
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryProductIds = await Product.find({ category }).distinct('_id');
    } else {
      categoryProductIds = await Product.find({ categorySlug: category.toLowerCase() }).distinct('_id');
    }
    filter.product = { $in: categoryProductIds };
  }

  // Keyword search across comment, user name/email, product name
  if (search && search.trim() !== '') {
    const cleanSearch = search.trim();
    const regex = new RegExp(cleanSearch, 'i');

    const [matchingUsers, matchingProducts] = await Promise.all([
      mongoose.model('User').find({
        $or: [{ name: regex }, { email: regex }],
      }).distinct('_id'),
      Product.find({ name: regex }).distinct('_id'),
    ]);

    const orConditions = [
      { comment: regex },
      { user: { $in: matchingUsers } },
      { product: { $in: matchingProducts } },
    ];

    if (filter.product) {
      filter.$and = [{ product: filter.product }, { $or: orConditions }];
      delete filter.product;
    } else {
      filter.$or = orConditions;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === 'oldest') sort = { createdAt: 1 };
  if (sortBy === 'highest') sort = { rating: -1 };
  if (sortBy === 'lowest') sort = { rating: 1 };
  if (sortBy === 'helpful') sort = { helpfulCount: -1 };

  const [reviews, totalMatching] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email avatar role')
      .populate('product', 'name slug images category categorySlug price')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Overall Global Admin Analytics
  const [globalCounts, categoryBreakdown] = await Promise.all([
    Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          hidden: { $sum: { $cond: [{ $eq: ['$status', 'hidden'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$isVerifiedPurchase', true] }, 1, 0] } },
          avgRating: {
            $avg: { $cond: [{ $eq: ['$status', 'active'] }, '$rating', null] },
          },
        },
      },
    ]),
    Review.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'prod',
        },
      },
      { $unwind: '$prod' },
      {
        $group: {
          _id: '$prod.categorySlug',
          totalReviews: { $sum: 1 },
          avgRating: {
            $avg: { $cond: [{ $eq: ['$status', 'active'] }, '$rating', null] },
          },
        },
      },
    ]),
  ]);

  const globalStats = globalCounts[0] || {
    total: 0,
    active: 0,
    hidden: 0,
    verified: 0,
    avgRating: 0,
  };

  const categoriesStatsMap = {};
  categoryBreakdown.forEach((cat) => {
    if (cat._id) {
      categoriesStatsMap[cat._id] = {
        totalReviews: cat.totalReviews,
        avgRating: cat.avgRating ? Math.round(cat.avgRating * 10) / 10 : 0,
      };
    }
  });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      stats: {
        total: globalStats.total,
        active: globalStats.active,
        hidden: globalStats.hidden,
        verified: globalStats.verified,
        averageRating: globalStats.avgRating ? Math.round(globalStats.avgRating * 10) / 10 : 0,
        categoryStats: categoriesStatsMap,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMatching,
        pages: Math.ceil(totalMatching / limitNum) || 1,
      },
    },
  });
});

/**
 * @desc    Admin: Moderate review status (Hide or Unhide)
 * @route   PATCH /api/reviews/admin/:id/status
 * @access  Private/Admin
 */
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'hidden'].includes(status)) {
    throw new ApiError(400, "Status must be either 'active' or 'hidden'");
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  review.status = status;
  await review.save();

  // Recalculate average rating for product (hidden reviews are excluded)
  await Review.calculateAverageRating(review.product);

  const updatedReview = await Review.findById(id)
    .populate('user', 'name email avatar')
    .populate('product', 'name slug images rating numReviews');

  res.status(200).json({
    success: true,
    message: `Review status changed to ${status}`,
    data: updatedReview,
  });
});

module.exports = {
  getProductReviews,
  createOrUpdateReview,
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  getAdminReviews,
  updateReviewStatus,
};

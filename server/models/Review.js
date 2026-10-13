const mongoose = require('mongoose');

const reviewCriteriaSubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { _id: true }
);

const reviewVoteSubSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voteType: {
      type: String,
      enum: ['helpful'],
      default: 'helpful',
    },
  },
  { _id: true, timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must be associated with a product'],
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Overall rating is required (1-5 stars)'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'hidden'],
      default: 'active',
      index: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length <= 5;
        },
        message: 'Cannot upload more than 5 images per review',
      },
    },
    criteria: [reviewCriteriaSubSchema],
    votes: [reviewVoteSubSchema],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// One active or historical review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Optimized compound indexes for storefront and admin sorting
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, status: 1, rating: -1 });
reviewSchema.index({ product: 1, status: 1, helpfulCount: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

/**
 * Static method to recalculate Product rating and numReviews based on ACTIVE reviews
 * Hidden reviews are strictly excluded.
 */
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'active',
      },
    },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Product = mongoose.model('Product');

  if (stats.length > 0) {
    const rawAvg = stats[0].avgRating;
    const roundedRating = Math.round(rawAvg * 10) / 10; // Round to 1 decimal place, e.g. 4.8
    await Product.findByIdAndUpdate(productId, {
      rating: roundedRating,
      numReviews: stats[0].numReviews,
    });
  } else {
    // If no active reviews remain
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);

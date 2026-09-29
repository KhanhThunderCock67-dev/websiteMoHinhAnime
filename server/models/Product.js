const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [180, 'Product name cannot exceed 180 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    categorySlug: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    subCategory: {
      type: String,
      required: [true, 'Subcategory is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand or publisher is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          if (value === 0 || value === null || value === undefined) {
            return true;
          }
          if (value < 0) {
            return false;
          }

          // In document validation (save, create), `this` is the document instance
          let regularPrice = this.price;

          // In update queries (findByIdAndUpdate, updateOne, etc.), `this` is the Query object
          if (regularPrice === undefined && typeof this.getUpdate === 'function') {
            const update = this.getUpdate();
            if (update) {
              if (update.price !== undefined) {
                regularPrice = update.price;
              } else if (update.$set && update.$set.price !== undefined) {
                regularPrice = update.$set.price;
              }
            }
          }

          // If regularPrice is available, ensure discountPrice is strictly less than price
          if (regularPrice !== undefined && regularPrice !== null) {
            return Number(value) < Number(regularPrice);
          }

          return true;
        },
        message: 'Discount price must be less than the regular price',
      },
    },
    stockCount: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock count cannot be negative'],
      default: 0,
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'Product must have at least one image',
      },
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    // Domain-specific flexible attributes
    attributes: {
      // Warhammer
      faction: {
        type: String,
        enum: ['Imperium', 'Chaos', 'Xenos', 'Neutral', ''],
        default: '',
        index: true,
      },
      gameSystem: {
        type: String,
        default: '',
      },
      miniatureCount: {
        type: Number,
        default: 1,
      },
      // Anime figures
      scale: {
        type: String,
        enum: ['1/4 Scale', '1/6 Scale', '1/7 Scale', '1/8 Scale', 'Nendoroid', 'Pop Up Parade', 'Action Figure', 'Non-Scale', ''],
        default: '',
        index: true,
      },
      character: {
        type: String,
        default: '',
      },
      series: {
        type: String,
        default: '',
      },
      material: {
        type: String,
        default: 'PVC & ABS',
      },
      // Boardgames
      minPlayers: {
        type: Number,
        default: 1,
      },
      maxPlayers: {
        type: Number,
        default: 4,
      },
      playtimeMin: {
        type: Number,
        default: 60,
      },
      complexity: {
        type: String,
        enum: ['Light', 'Medium', 'Heavy', 'Expert', ''],
        default: '',
      },
      language: {
        type: String,
        default: 'English',
      },
    },
    isPreOrder: {
      type: Boolean,
      default: false,
      index: true,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  'attributes.character': 'text',
  'attributes.series': 'text',
});

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get products with search, multi-attribute filtering, sorting & pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    subCategory,
    brand,
    faction,
    scale,
    complexity,
    players,
    minPrice,
    maxPrice,
    inStock,
    isPreOrder,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const query = {};

  // 1. Keyword search (regex fallback for flexible partial matching)
  if (keyword && keyword.trim() !== '') {
    const cleanKeyword = keyword.trim();
    query.$or = [
      { name: { $regex: cleanKeyword, $options: 'i' } },
      { description: { $regex: cleanKeyword, $options: 'i' } },
      { brand: { $regex: cleanKeyword, $options: 'i' } },
      { 'attributes.character': { $regex: cleanKeyword, $options: 'i' } },
      { 'attributes.series': { $regex: cleanKeyword, $options: 'i' } },
    ];
  }

  // 2. Category filter (by slug or ObjectId)
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    } else {
      query.categorySlug = category.toLowerCase();
    }
  }

  // 3. SubCategory filter
  if (subCategory) {
    query.subCategory = subCategory;
  }

  // 4. Brand filter
  if (brand) {
    query.brand = brand;
  }

  // 5. Warhammer Domain: Faction filter
  if (faction) {
    query['attributes.faction'] = faction;
  }

  // 6. Anime Figures Domain: Scale filter
  if (scale) {
    query['attributes.scale'] = scale;
  }

  // 7. Boardgames Domain: Complexity filter
  if (complexity) {
    query['attributes.complexity'] = complexity;
  }

  // 8. Boardgames Domain: Player count
  if (players) {
    const playerCount = parseInt(players, 10);
    if (!isNaN(playerCount)) {
      query['attributes.minPlayers'] = { $lte: playerCount };
      query['attributes.maxPlayers'] = { $gte: playerCount };
    }
  }

  // 9. Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined && !isNaN(Number(minPrice))) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
      query.price.$lte = Number(maxPrice);
    }
  }

  // 10. Stock status
  if (inStock === 'true' || inStock === true) {
    query.stockCount = { $gt: 0 };
  }

  // 11. Pre-Order status
  if (isPreOrder !== undefined && isPreOrder !== '') {
    query.isPreOrder = isPreOrder === 'true' || isPreOrder === true;
  }

  // Sorting
  let sortOption = { createdAt: -1 }; // default newest
  if (sort === 'price-asc') {
    sortOption = { price: 1 };
  } else if (sort === 'price-desc') {
    sortOption = { price: -1 };
  } else if (sort === 'best-selling') {
    sortOption = { soldCount: -1 };
  } else if (sort === 'rating') {
    sortOption = { rating: -1 };
  } else if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total,
      },
    },
  });
});

/**
 * @desc    Get featured products for homepage
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true })
    .populate('category', 'name slug')
    .limit(8);

  res.json({
    success: true,
    data: { products },
  });
});

/**
 * @desc    Get low stock products (Admin)
 * @route   GET /api/products/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || 5;
  const products = await Product.find({ stockCount: { $lte: threshold } })
    .populate('category', 'name slug')
    .sort({ stockCount: 1 });

  res.json({
    success: true,
    count: products.length,
    data: { products },
  });
});

/**
 * @desc    Get single product by slug or ObjectId
 * @route   GET /api/products/:identifier
 * @access  Public
 */
const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  let product;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier).populate('category', 'name slug');
  }

  if (!product) {
    product = await Product.findOne({ slug: identifier }).populate('category', 'name slug');
  }

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Fetch related products from same category
  const relatedProducts = await Product.find({
    category: product.category._id || product.category,
    _id: { $ne: product._id },
  })
    .limit(4)
    .select('name slug price discountPrice images brand stockCount attributes isPreOrder');

  res.json({
    success: true,
    data: {
      product,
      relatedProducts,
    },
  });
});

/**
 * @desc    Create new product (Admin)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  // Verify category exists
  if (productData.category) {
    const cat = await Category.findById(productData.category);
    if (!cat) {
      throw new ApiError(400, 'Invalid category specified');
    }
    productData.categorySlug = cat.slug;
  }

  // Generate slug if not provided
  if (!productData.slug && productData.name) {
    productData.slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
  }

  // Auto SKU if missing
  if (!productData.sku) {
    productData.sku = 'HOBBY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

/**
 * @desc    Update product (Admin)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  if (productData.category) {
    const cat = await Category.findById(productData.category);
    if (cat) {
      productData.categorySlug = cat.slug;
    }
  }

  // Validate discount price relationship with regular price
  if (productData.discountPrice !== undefined && Number(productData.discountPrice) > 0) {
    let regularPrice = productData.price !== undefined ? Number(productData.price) : null;
    if (regularPrice === null) {
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct) {
        regularPrice = existingProduct.price;
      }
    }
    if (regularPrice !== null && Number(productData.discountPrice) >= regularPrice) {
      throw new ApiError(400, 'Discount price must be less than the regular price');
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, productData, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

/**
 * @desc    Delete product (Admin)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getLowStockProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
};

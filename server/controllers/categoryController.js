const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({
    success: true,
    count: categories.length,
    data: { categories },
  });
});

/**
 * @desc    Get single category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug.toLowerCase() });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({
    success: true,
    data: { category },
  });
});

/**
 * @desc    Create a category (Admin)
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, icon, image, subCategories } = req.body;

  const existingSlug = await Category.findOne({
    slug: slug ? slug.toLowerCase() : name.toLowerCase().replace(/\s+/g, '-'),
  });
  if (existingSlug) {
    throw new ApiError(400, 'Category with this slug already exists');
  }

  const category = await Category.create({
    name,
    slug: slug ? slug.toLowerCase() : name.toLowerCase().replace(/\s+/g, '-'),
    description,
    icon,
    image,
    subCategories: subCategories || [],
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category },
  });
});

/**
 * @desc    Update category (Admin)
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category },
  });
});

/**
 * @desc    Delete category (Admin)
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};

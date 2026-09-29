const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockCount sku isPreOrder attributes',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Filter out any items where product was deleted
  cart.items = cart.items.filter((item) => item.product != null);

  res.json({
    success: true,
    data: { cart },
  });
});

/**
 * @desc    Add item to cart or update quantity
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  if (existingItemIndex > -1) {
    const totalQty = cart.items[existingItemIndex].quantity + requestedQty;
    if (totalQty > product.stockCount) {
      throw new ApiError(
        400,
        `Cannot add more items. Only ${product.stockCount} in stock for ${product.name}`
      );
    }
    cart.items[existingItemIndex].quantity = totalQty;
    cart.items[existingItemIndex].price = effectivePrice;
  } else {
    if (requestedQty > product.stockCount) {
      throw new ApiError(
        400,
        `Cannot add ${requestedQty} items. Only ${product.stockCount} in stock`
      );
    }
    cart.items.push({
      product: productId,
      quantity: requestedQty,
      price: effectivePrice,
    });
  }

  await cart.save();

  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockCount sku isPreOrder attributes',
  });

  res.json({
    success: true,
    message: 'Item added to cart',
    data: { cart },
  });
});

/**
 * @desc    Update item quantity in cart
 * @route   PUT /api/cart/items/:itemId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const newQty = parseInt(quantity, 10);
  if (isNaN(newQty) || newQty < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Item not found in cart');
  }

  const product = await Product.findById(item.product);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (newQty > product.stockCount) {
    throw new ApiError(
      400,
      `Requested quantity (${newQty}) exceeds available stock (${product.stockCount})`
    );
  }

  item.quantity = newQty;
  item.price = product.discountPrice > 0 ? product.discountPrice : product.price;

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockCount sku isPreOrder attributes',
  });

  res.json({
    success: true,
    message: 'Cart updated',
    data: { cart: populatedCart },
  });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockCount sku isPreOrder attributes',
  });

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: { cart: populatedCart },
  });
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({
    success: true,
    message: 'Cart cleared',
    data: { cart: { items: [] } },
  });
});

/**
 * @desc    Merge guest cart items into user's persistent cart
 * @route   POST /api/cart/sync
 * @access  Private
 */
const syncGuestCart = asyncHandler(async (req, res) => {
  const { guestItems = [] } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  for (const guestItem of guestItems) {
    const product = await Product.findById(guestItem.productId || guestItem.product?._id);
    if (!product || product.stockCount <= 0) continue;

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString()
    );

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    const requestedQty = Math.max(1, guestItem.quantity || 1);

    if (existingIndex > -1) {
      const combinedQty = Math.min(product.stockCount, cart.items[existingIndex].quantity + requestedQty);
      cart.items[existingIndex].quantity = combinedQty;
      cart.items[existingIndex].price = price;
    } else {
      const allowedQty = Math.min(product.stockCount, requestedQty);
      cart.items.push({
        product: product._id,
        quantity: allowedQty,
        price,
      });
    }
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockCount sku isPreOrder attributes',
  });

  res.json({
    success: true,
    message: 'Cart synchronized successfully',
    data: { cart: populatedCart },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncGuestCart,
};

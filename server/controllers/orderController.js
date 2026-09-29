const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create new order with stock verification & decrement
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod = 'Credit Card',
    itemsPrice,
    shippingPrice = 0,
    taxPrice = 0,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    throw new ApiError(400, 'No order items specified');
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.fullName) {
    throw new ApiError(400, 'Please provide a complete shipping address');
  }

  // 1. Verify stock for all items before placing order
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new ApiError(404, `Product not found for item: ${item.name}`);
    }
    if (product.stockCount < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Available: ${product.stockCount}, requested: ${item.quantity}`
      );
    }
  }

  // 2. Decrement stock atomically and increment soldCount
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stockCount: -item.quantity, soldCount: item.quantity },
    });
  }

  // 3. Create the order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    orderStatus: 'pending',
    statusTimeline: [
      {
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed by customer',
      },
    ],
    isPaid: paymentMethod === 'Credit Card' || paymentMethod === 'PayPal',
    paidAt: paymentMethod === 'Credit Card' || paymentMethod === 'PayPal' ? new Date() : null,
  });

  // 4. Clear user's active cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});

/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: orders.length,
    data: { orders },
  });
});

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Ensure only the buyer or an admin can access
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  res.json({
    success: true,
    data: { order },
  });
});

/**
 * @desc    Get all orders (Admin) with status filter & pagination
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) {
    query.orderStatus = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    data: {
      orders,
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
 * @desc    Update order status pipeline (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid order status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = status;

  // Append to timeline
  order.statusTimeline.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated from ${previousStatus} to ${status} by admin`,
  });

  // If order is completed
  if (status === 'completed') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  // If order was cancelled and wasn't cancelled before, restore product stock
  if (status === 'cancelled' && previousStatus !== 'cancelled') {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockCount: item.quantity, soldCount: -item.quantity },
      });
    }
  }

  // If un-cancelling a cancelled order, re-decrement stock
  if (previousStatus === 'cancelled' && status !== 'cancelled') {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockCount: -item.quantity, soldCount: item.quantity },
      });
    }
  }

  await order.save();

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: { order },
  });
});

/**
 * @desc    Get sales analytics & inventory metrics (Admin)
 * @route   GET /api/orders/analytics
 * @access  Private/Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const lowStockCount = await Product.countDocuments({ stockCount: { $lte: 5 } });

  // Revenue calculation
  const completedOrPaidOrders = await Order.find({
    $or: [{ orderStatus: 'completed' }, { isPaid: true }],
  });
  const totalRevenue = completedOrPaidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

  // Status breakdown
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  // Recent 5 orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalProducts,
        lowStockCount,
      },
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentOrders,
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getAnalytics,
};

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { categoriesData, usersData, productsData } = require('./seedData');

const seedDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      'mongodb://127.0.0.1:27017/hobby_ecommerce';
    console.log(`[Seeder] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seeder] Cleaning existing database collections...');
    await Promise.all([
      Category.deleteMany(),
      User.deleteMany(),
      Product.deleteMany(),
      Cart.deleteMany(),
      Order.deleteMany(),
      Review.deleteMany(),
    ]);

    console.log('[Seeder] Inserting categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    console.log('[Seeder] Inserting users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    console.log('[Seeder] Inserting products with domain attributes...');
    const preparedProducts = productsData.map((prod) => ({
      ...prod,
      category: categoryMap[prod.categorySlug],
    }));
    const createdProducts = await Product.insertMany(preparedProducts);

    console.log('[Seeder] Creating sample order and initial cart...');
    const customer = createdUsers.find((u) => u.role === 'customer');
    const firstProduct = createdProducts[0];
    const secondProduct = createdProducts[4]; // Space Marines

    // Initial order for customer
    const customerOrder = await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: firstProduct._id,
          name: firstProduct.name,
          image: firstProduct.images?.[0] || '',
          price: firstProduct.discountPrice || firstProduct.price,
          quantity: 1,
          sku: firstProduct.sku,
        },
      ],
      shippingAddress: customer.shippingAddress,
      paymentMethod: 'Credit Card',
      itemsPrice: firstProduct.discountPrice || firstProduct.price,
      shippingPrice: 9.99,
      taxPrice: 18.40,
      totalPrice: (firstProduct.discountPrice || firstProduct.price) + 9.99 + 18.40,
      orderStatus: 'completed',
      isDelivered: true,
      deliveredAt: new Date(Date.now() - 3600 * 1000 * 12),
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 3600 * 1000 * 72),
          note: 'Order placed by customer',
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 3600 * 1000 * 48),
          note: 'Payment received and warehouse verified item',
        },
        {
          status: 'shipping',
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
          note: 'Package handed over to express courier',
        },
        {
          status: 'completed',
          timestamp: new Date(Date.now() - 3600 * 1000 * 12),
          note: 'Delivered securely to customer address',
        },
      ],
      isPaid: true,
      paidAt: new Date(Date.now() - 3600 * 1000 * 72),
    });

    console.log('[Seeder] Creating realistic initial reviews with domain criteria...');
    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const boardGameProduct = createdProducts.find((p) => p.categorySlug === 'board-games');

    // 1. Anime review for firstProduct by customer (Verified Purchase!)
    await Review.create({
      user: customer._id,
      product: firstProduct._id,
      order: customerOrder._id,
      rating: 5,
      comment: 'Tuyệt tác mô hình! Từng nếp gấp áo và chi tiết tóc đều được hoàn thiện cực kỳ sắc nét. Nước sơn không một vết lem, bao bì đóng hộp chuẩn hãng từ Nhật Bản.',
      isVerifiedPurchase: true,
      status: 'active',
      helpfulCount: 4,
      criteria: [
        { name: 'Detail Quality', rating: 5 },
        { name: 'Paint Quality', rating: 5 },
        { name: 'Material Quality', rating: 5 },
        { name: 'Packaging', rating: 5 },
        { name: 'Overall Satisfaction', rating: 5 },
      ],
      votes: [
        { user: adminUser._id, voteType: 'helpful' },
      ],
    });

    // 2. Warhammer review for secondProduct by admin
    await Review.create({
      user: adminUser._id,
      product: secondProduct._id,
      rating: 5,
      comment: 'Hộp miniature nguyên seal Citadel, các vỉ sprue sắc sảo không ba-via, đầy đủ decal và sách hướng dẫn lắp ráp. Tình trạng hộp hoàn hảo cho dân sưu tầm.',
      isVerifiedPurchase: false,
      status: 'active',
      helpfulCount: 2,
      criteria: [
        { name: 'Miniature Detail', rating: 5 },
        { name: 'Component Quality', rating: 5 },
        { name: 'Box Condition', rating: 5 },
        { name: 'Completeness', rating: 5 },
        { name: 'Overall Satisfaction', rating: 5 },
      ],
    });

    // 3. Board Game review by customer
    if (boardGameProduct) {
      await Review.create({
        user: customer._id,
        product: boardGameProduct._id,
        rating: 5,
        comment: 'Chất lượng thành phần gỗ và thẻ bài dày dặn, artwork tuyệt đẹp, luật chơi viết chi tiết kèm ví dụ minh họa rất dễ hiểu.',
        isVerifiedPurchase: false,
        status: 'active',
        helpfulCount: 1,
        criteria: [
          { name: 'Component Quality', rating: 5 },
          { name: 'Artwork & Design', rating: 5 },
          { name: 'Rulebook Quality', rating: 5 },
          { name: 'Packaging', rating: 5 },
          { name: 'Overall Satisfaction', rating: 5 },
        ],
      });
    }

    // Synchronize all product ratings with active reviews
    for (const prod of createdProducts) {
      await Review.calculateAverageRating(prod._id);
    }

    // Initial cart for customer
    await Cart.create({
      user: customer._id,
      items: [
        {
          product: secondProduct._id,
          quantity: 1,
          price: secondProduct.discountPrice || secondProduct.price,
        },
      ],
    });

    console.log('---------------------------------------------------------');
    console.log(' DATABASE SEEDED SUCCESSFULLY!');
    console.log(`- ${createdCategories.length} Categories created`);
    console.log(`- ${createdUsers.length} Users created`);
    console.log(`   Admin:    admin@hobbyvault.com / Admin@123456`);
    console.log(`   Customer: customer@hobbyvault.com / Customer@123456`);
    console.log(`- ${createdProducts.length} Products created (Anime, 40k, Boardgames)`);
    console.log('---------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDB();

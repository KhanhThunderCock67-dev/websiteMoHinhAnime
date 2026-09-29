require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
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
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: firstProduct._id,
          name: firstProduct.name,
          image: firstProduct.images[0],
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
      orderStatus: 'confirmed',
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 3600 * 1000 * 48),
          note: 'Order placed by customer',
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
          note: 'Payment received and warehouse verified item',
        },
      ],
      isPaid: true,
      paidAt: new Date(Date.now() - 3600 * 1000 * 48),
    });

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

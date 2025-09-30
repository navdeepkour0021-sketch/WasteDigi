import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Inventory from './models/Inventory.js';
import Waste from './models/Waste.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wastewise');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Inventory.deleteMany();
    await Waste.deleteMany();

    // Create sample user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Demo@123', salt);

    // Create additional demo users with different roles
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    const regularUser = await User.create({
      name: 'Manager User',
      email: 'manager@gmail.com',
      password: hashedPassword,
      role: 'manager'
    });

    const basicUser = await User.create({
      name: 'Basic User',
      email: 'user@gmail.com',
      password: hashedPassword,
      role: 'user'
    });

    console.log('Created demo users with roles');

    // Sample inventory items
    const inventoryItems = [
      {
        name: 'Fresh Tomatoes',
        quantity: 15,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        category: 'vegetables',
        user: user._id
      },
      {
        name: 'Chicken Breast',
        quantity: 8,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day (expiring soon!)
        category: 'meat',
        user: user._id
      },
      {
        name: 'Fresh Milk',
        quantity: 10,
        unit: 'l',
        expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        category: 'dairy',
        user: user._id
      },
      {
        name: 'Lettuce',
        quantity: 5,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        category: 'vegetables',
        user: user._id
      },
      {
        name: 'Ground Beef',
        quantity: 12,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        category: 'meat',
        user: user._id
      },
      {
        name: 'Bananas',
        quantity: 20,
        unit: 'pcs',
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        category: 'fruits',
        user: user._id
      },
      {
        name: 'Rice',
        quantity: 25,
        unit: 'kg',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        category: 'grains',
        user: user._id
      },
      {
        name: 'Olive Oil',
        quantity: 3,
        unit: 'l',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        category: 'other',
        user: user._id
      }
    ];

    const createdInventory = await Inventory.insertMany(inventoryItems);
    console.log(`Created ${createdInventory.length} inventory items`);

    // Sample waste log entries
    const wasteLogs = [
      {
        itemName: 'Expired Lettuce',
        quantity: 2,
        unit: 'kg',
        reason: 'expired',
        notes: 'Found wilted and brown leaves',
        user: user._id
      },
      {
        itemName: 'Spoiled Milk',
        quantity: 1,
        unit: 'l',
        reason: 'spoiled',
        notes: 'Sour smell detected during morning check',
        user: user._id
      },
      {
        itemName: 'Damaged Tomatoes',
        quantity: 3,
        unit: 'kg',
        reason: 'damaged',
        notes: 'Damaged during delivery',
        user: user._id
      },
      {
        itemName: 'Excess Bread',
        quantity: 10,
        unit: 'pcs',
        reason: 'overstock',
        notes: 'Daily bread order was too high',
        user: user._id
      }
    ];

    const createdWasteLogs = await Waste.insertMany(wasteLogs);
    console.log(`Created ${createdWasteLogs.length} waste log entries`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('Email: admin@gmail.com');
    console.log('Password: Demo@123');
    console.log('Email: manager@gmail.com');
    console.log('Password: Demo@123');
    console.log('Email: user@gmail.com');
    console.log('Password: Demo@123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
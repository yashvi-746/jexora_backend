const mongoose = require("mongoose");
const User = require("./src/models/User");
const Category = require("./src/models/Category");
const Product = require("./src/models/Product");
const Inventory = require("./src/models/Inventory");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function seedAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Clear Data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    try {
      await mongoose.connection.collection('inventories').drop();
    } catch (e) {
      // ignore error if collection doesn't exist
    }
    await Inventory.deleteMany({});
    console.log("Cleared existing data.");

    // 2. Seed User
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "Admin"
    });
    console.log("User seeded.");

    // 3. Seed Categories
    const cat1 = await Category.create({ name: "Electronics", description: "Gadgets and tech" });
    const cat2 = await Category.create({ name: "Furniture", description: "Home and office items" });
    console.log("Categories seeded.");

    // 4. Seed Products
    const products = [
      { name: "iPhone 15", description: "Latest Apple smartphone", categoryId: cat1._id, price: 999 },
      { name: "Mesh Chair", description: "Ergonomic office chair", categoryId: cat2._id, price: 250 }
    ];

    for (const p of products) {
      const product = await Product.create(p);
      await Inventory.create({
        productId: product._id,
        quantity: 100
      });
      console.log(`Product & Inventory seeded: ${product.name}`);
    }

    console.log("Full seeding complete! 🚀");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedAll();

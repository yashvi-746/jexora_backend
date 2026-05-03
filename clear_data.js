const mongoose = require("mongoose");
const Category = require("./src/models/Category");
const Product = require("./src/models/Product");
require("dotenv").config();

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for clearing data...");

    const prodResult = await Product.deleteMany({});
    console.log(`Deleted ${prodResult.deletedCount} products.`);

    const catResult = await Category.deleteMany({});
    console.log(`Deleted ${catResult.deletedCount} categories.`);

    process.exit(0);
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  }
}

clearData();

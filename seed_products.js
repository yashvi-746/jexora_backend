const mongoose = require("mongoose");
const Product = require("./src/models/Product");
require("dotenv").config();

const products = [
  { name: 'Premium Smartphone', description: 'Latest flagship smartphone with advanced features and sleek design', categoryId: '69d3f4a202321e494aff9773', units: 'pcs', basePrice: 999 },
  { name: 'MacBook Pro', description: 'Powerful laptop for professionals and creatives', categoryId: '69d3f4a202321e494aff9773', units: 'pcs', basePrice: 1999 },
  { name: 'Wireless Earphones', description: 'Premium sound quality with noise cancellation', categoryId: '69d3f4a202321e494aff9773', units: 'pcs', basePrice: 199 }
];


async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");
    
    // Optional: Clear existing products
    // await Product.deleteMany({});
    
    for (const p of products) {
      try {
        await Product.create(p);
        console.log(`Created: ${p.name}`);
      } catch (err) {
        if (err.name === "ValidationError") {
          console.error(`Failed to create ${p.name}:`, JSON.stringify(err.errors, null, 2));
        } else {
          console.error(`Failed to create ${p.name}:`, err.message);
        }
      }
    }
    
    console.log("Seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();


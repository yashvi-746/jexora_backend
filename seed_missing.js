const mongoose = require("mongoose");
const User = require("./src/models/User");
const Supplier = require("./src/models/Supplier");
const Category = require("./src/models/Category");
const Product = require("./src/models/Product");
const RFQ = require("./src/models/rfq");
const RFQItem = require("./src/models/rfqItems");
const PurchaseOrder = require("./src/models/PurchaseOrder");
require("dotenv").config();

async function seedMissingData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding missing data...");

    // 1. Seed a Supplier User
    const supplierUser = await User.findOneAndUpdate(
      { email: "supplier@example.com" },
      { name: "Global Tech Supplies", password: "hashedPassword123", role: "Supplier" },
      { upsert: true, new: true }
    );
    console.log("Supplier user ensured.");

    // 2. Seed a Supplier Profile
    const supplierProfile = await Supplier.findOneAndUpdate(
      { userId: supplierUser._id },
      { 
        companyName: "Global Tech Supplies Ltd.", 
        contactPersonName: "Alice Smith", 
        phone: "+1234567890", 
        address: "123 Tech Blvd" 
      },
      { upsert: true, new: true }
    );
    console.log("Supplier profile ensured.");

    // 3. Ensure we have at least one product
    let product = await Product.findOne();
    if (!product) {
      console.log("No product found, creating a dummy product...");
      const cat = await Category.findOne() || await Category.create({ name: "General" });
      product = await Product.create({ name: "Dummy Product", description: "Demo", categoryId: cat._id, price: 100 });
    }

    // 4. Seed an RFQ
    const rfqCount = await RFQ.countDocuments();
    if (rfqCount === 0) {
      const rfq = await RFQ.create({
        rfqNumber: "RFQ-0001",
        title: "Initial Stock Request",
        notes: "Please provide best pricing.",
        suppliers: [supplierUser._id],
        status: "draft"
      });

      await RFQItem.create({
        rfqId: rfq._id,
        productId: product._id,
        quantity: 50,
        unitPrice: product.price
      });
      console.log("Dummy RFQ created.");
    }

    console.log("Seeding complete! You should now see data in the UI.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedMissingData();

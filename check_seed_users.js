const mongoose = require("mongoose");
const User = require("./src/models/User");
require("dotenv").config();

async function checkAndSeedUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const userCount = await User.countDocuments();
    console.log(`Current user count: ${userCount}`);

    if (userCount === 0) {
      console.log("Seeding a default user...");
      const newUser = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123", // Note: In a real app this should be hashed, but for simplicity here...
        role: "Admin"
      });
      await newUser.save();
      console.log("Default user seeded.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAndSeedUser();

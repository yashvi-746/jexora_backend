const mongoose = require("mongoose");
const User = require("./src/models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = "shahyashvi@gmail.com";
    const password = "password123";

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: "Yashvi Shah",
        email: email,
        password: password,
        role: "Admin"
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      console.log(`Created user ${email} with password ${password}`);
    } else {
      console.log(`User ${email} already exists. Updating password to ${password}`);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
createUser();

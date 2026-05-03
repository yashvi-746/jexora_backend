const mongoose = require("mongoose");
const User = require("./src/models/User");
require("dotenv").config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, "name email role");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
checkUsers();

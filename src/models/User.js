const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Staff", "Supplier"],
      default: "Manager",
    },
    documents: [
      {
        fileName: String,
        filePath: String,
      },
    ],
  },
  { timestamps: true }, // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);


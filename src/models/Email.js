const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Email", emailSchema);

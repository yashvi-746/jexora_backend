const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],  // IN = stock received/added, OUT = stock used/removed
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      default: "Manual Adjustment",
    },
    note: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String, // optional: PO number or RFQ reference
      trim: true,
    },
    performedBy: {
      type: String, // user name or email for quick display
      trim: true,
    },
    stockBefore: {
      type: Number,
      default: 0,
    },
    stockAfter: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);

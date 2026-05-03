const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: false, // For backward compatibility
    },
    quantity: { type: Number, default: 0, min: 0 },
    minStocks: { type: Number, default: 10, min: 0 },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

inventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);

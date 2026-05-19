const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true },
    fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StockTransfer", stockTransferSchema);

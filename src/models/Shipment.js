const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "In Transit", "Out for Delivery", "Delivered", "Delayed", "Cancelled"],
      default: "Pending",
    },
    origin: { type: String, trim: true },
    destination: { type: String, trim: true },
    driver: { type: String, trim: true },
    vehicle: { type: String, trim: true },
    // GPS location checkpoints
    locationLog: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        label: { type: String, trim: true },
        note: { type: String, trim: true },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);

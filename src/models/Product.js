const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    units: { type: String, default: "pcs" },
    price: { type: Number, required: true, min: 0 }, // Selling Price
    costPrice: { type: Number, default: 0, min: 0 }, // Purchase Price
    barcode: { type: String, unique: true, sparse: true },
    
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);

const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true,
    },
    companyName: { type: String, required: true, trim: true },
    contactPersonName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", supplierSchema);




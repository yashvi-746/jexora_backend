const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
    {
    notes : {
        type: String,
    },
    purchaseNumber: {
        type: String,
        required: true,
        //unique: true,
    },
    rfqId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "RFQ",
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["draft", "rejected", "approved", "pending"],
        default: "draft",
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        },
    items: [
        {
            productId: {    
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
            },
            unit: {    
                type: String,
            },
            Price: {   
                type: Number,
            },
            total: {
                type: Number,
            },
        },
    ],
    expectedDeliveryDate: { type: Date },
    deliveryDate: { type: Date },
    
    },
{ timestamps: true },
    );

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
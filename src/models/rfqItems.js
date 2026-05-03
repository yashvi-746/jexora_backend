const mongoose = require("mongoose");

const rfqitemSchema = new mongoose.Schema(
    {   
        rfqId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RFQ", 
            required: true,
        },
        productId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            type: mongoose.Schema.Types.ObjectId,
            
        },  
        quantity: {
            type: Number,
            required: true,
        },
        unitPrice: {    
            type: Number,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);
module.exports = mongoose.model("RFQItem", rfqitemSchema);
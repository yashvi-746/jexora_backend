const mongoose = require("mongoose");


const quoteSchema = new mongoose.Schema(
    {   
        rfqId: {
            type: mongoose.Schema.Types.ObjectId,   
            ref: "RFQ"},
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"},
            items: [
                {
                    rfqItemId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "RFQItem",
                    },
                    Price: {
                        type: Number,
                    },
                },
            ],
            notes : {
                type: String,
            },
            attachements: { 
                type: String,
            },
             status: {
                type: String,
                enum : ["pending", "submitted"],
                default: "pending",
            },
        },
        { timestamps: true },
    );
module.exports = mongoose.model("Quote", quoteSchema);
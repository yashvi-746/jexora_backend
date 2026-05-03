const mongoose = require("mongoose");

const rfqSchema = new mongoose.Schema(  
    {
        rfqNumber: { type: String, required: true },
    
    title: { type: String, required: true },
    notes: { type: String },
    suppliers : [
        {type: mongoose.Schema.Types.ObjectId, ref: "User"}
    ],
    status: {
        type: String,
        required: true,
        enum: ["draft", "published", "closed"],
        default: "draft",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
},
    { timestamps: true },

    
);
module.exports = mongoose.model("RFQ", rfqSchema);
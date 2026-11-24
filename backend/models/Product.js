const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0
        },
        imageUrl: {
            type: String,
            default: ""
        },
        images: {
            type: [String],
            default: []
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        retailerName: {
            type: String,
            default: "ARPIARES Curated",
            trim: true
        },
        retailerProductUrl: {
            type: String,
            default: "",
            trim: true
        },
        lastPriceCheckedAt: {
            type: Date,
            default: Date.now
        },
        currency: {
            type: String,
            default: "INR"
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

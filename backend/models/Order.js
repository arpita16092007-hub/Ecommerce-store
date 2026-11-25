const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        items: { type: [orderItemSchema], required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        deliveryAddress: { type: String, required: true, trim: true },
        shippingDetails: {
            fullName: { type: String, default: "" },
            phone: { type: String, default: "" },
            addressLine: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },
        paymentMethod: { type: String, enum: ["UPI", "Card", "NetBanking", "COD"], default: "COD" },
        checkoutFeedback: { type: String, default: "", trim: true },
        rating: { type: Number, min: 1, max: 5, default: null },
        reviewComment: { type: String, default: "", trim: true },
        orderStatus: { type: String, enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
        paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

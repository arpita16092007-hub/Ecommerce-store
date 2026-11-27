const mongoose = require("mongoose");

const customerFeedbackSchema = new mongoose.Schema(
    {
        sessionId: { type: String, default: "" },
        customerName: { type: String, default: "Guest Shopper", trim: true },
        customerEmail: { type: String, default: "", trim: true },
        orderId: { type: String, default: "", trim: true },
        productName: { type: String, default: "", trim: true },
        category: {
            type: String,
            enum: ["Product", "Website", "Delivery", "Support", "Suggestion", "Other"],
            default: "Website"
        },
        rating: { type: Number, min: 1, max: 5, default: 5 },
        headline: { type: String, default: "", trim: true },
        recommend: { type: Boolean, default: true },
        comment: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CustomerFeedback", customerFeedbackSchema);

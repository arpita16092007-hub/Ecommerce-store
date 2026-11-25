const mongoose = require("mongoose");

const customerFeedbackSchema = new mongoose.Schema(
    {
        sessionId: { type: String, default: "" },
        customerName: { type: String, default: "Guest Shopper" },
        customerEmail: { type: String, default: "" },
        category: {
            type: String,
            enum: ["Product", "Website", "Delivery", "Support", "Other"],
            default: "Website"
        },
        rating: { type: Number, min: 1, max: 5, default: 5 },
        comment: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CustomerFeedback", customerFeedbackSchema);

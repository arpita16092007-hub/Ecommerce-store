const mongoose = require("mongoose");

const unansweredQuestionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true
        },
        customerName: {
            type: String,
            default: "Guest Shopper"
        },
        question: {
            type: String,
            required: true,
            trim: true
        },
        bestScore: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["Open", "Resolved"],
            default: "Open"
        },
        adminReply: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("UnansweredQuestion", unansweredQuestionSchema);

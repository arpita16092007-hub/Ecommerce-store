const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant", "admin"],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        confidence: {
            type: Number,
            default: null
        },
        escalated: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        customerName: {
            type: String,
            default: "Guest Shopper"
        },
        customerEmail: {
            type: String,
            default: ""
        },
        needsHuman: {
            type: Boolean,
            default: false
        },
        messages: {
            type: [chatMessageSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);

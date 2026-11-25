const express = require("express");
const FaqDocument = require("../models/FaqDocument");
const ChatSession = require("../models/ChatSession");
const UnansweredQuestion = require("../models/UnansweredQuestion");
const CustomerFeedback = require("../models/CustomerFeedback");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    CONFIDENCE_THRESHOLD,
    chunkText,
    embedText,
    retrieveTopMatches,
    generateGroundedReply
} = require("../utils/geminiSupport");

const router = express.Router();

router.post("/faq", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content || !String(title).trim() || !String(content).trim()) {
            return res.status(400).json({ message: "Title and FAQ/document content are required" });
        }
        const chunks = chunkText(String(title).trim(), String(content).trim());
        const savedDocs = [];
        for (const chunk of chunks) {
            const embedding = await embedText(chunk.title + "\n" + chunk.content);
            const doc = await FaqDocument.create({
                title: chunk.title,
                content: chunk.content,
                embedding,
                createdBy: req.user.userId
            });
            savedDocs.push({ _id: doc._id, title: doc.title, content: doc.content });
        }
        return res.status(201).json({
            message: "Added " + savedDocs.length + " knowledge base entry(s)",
            entries: savedDocs
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to upload FAQ document" });
    }
});

router.get("/faq", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const faqs = await FaqDocument.find({}, { embedding: 0 }).sort({ createdAt: -1 });
        return res.status(200).json({ faqs });
    } catch (error) {
        return res.status(500).json({ message: "Error loading FAQs" });
    }
});

router.delete("/faq/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await FaqDocument.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "FAQ entry deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting FAQ entry" });
    }
});

router.post("/chat", async (req, res) => {
    try {
        const { sessionId, message, customerName, customerEmail } = req.body;
        if (!sessionId || !message || !String(message).trim()) {
            return res.status(400).json({ message: "sessionId and message are required" });
        }
        const cleanMsg = String(message).trim();
        let session = await ChatSession.findOne({ sessionId: String(sessionId) });
        if (!session) {
            session = new ChatSession({
                sessionId: String(sessionId),
                customerName: customerName || "Guest Shopper",
                customerEmail: customerEmail || "",
                messages: []
            });
        } else {
            if (customerName) session.customerName = customerName;
            if (customerEmail) session.customerEmail = customerEmail;
        }

        const prevUserTurn = [...session.messages].reverse().find(m => m.role === "user");
        const retrievalQuery = prevUserTurn && cleanMsg.split(/\s+/).length <= 7
            ? prevUserTurn.text + " — " + cleanMsg
            : cleanMsg;

        const allFaqs = await FaqDocument.find({});
        let bestScore = 0;
        let topMatches = [];

        if (allFaqs.length > 0) {
            const queryEmbedding = await embedText(retrievalQuery);
            topMatches = retrieveTopMatches(queryEmbedding, allFaqs, 3);
            bestScore = topMatches.at(0)?.score || 0;
        }

        session.messages.push({ role: "user", text: cleanMsg });

        let botReply = "";
        let escalated = false;

        if (allFaqs.length === 0 || bestScore < CONFIDENCE_THRESHOLD) {
            escalated = true;
        } else {
            const relevantMatches = topMatches.filter(m => m.score >= CONFIDENCE_THRESHOLD - 0.08);
            const rawReply = await generateGroundedReply({
                question: cleanMsg,
                matchedChunks: relevantMatches,
                history: session.messages.slice(0, -1)
            });

            if (!rawReply || rawReply.includes("ESCALATE_TO_HUMAN")) {
                escalated = true;
            } else {
                botReply = rawReply;
            }
        }

        if (escalated) {
            botReply =
                "I'm not 100% certain about that from our current store guide, so I've forwarded your question to our human support team. An ARPIARES specialist will review and follow up shortly!";
            session.needsHuman = true;

            await UnansweredQuestion.create({
                sessionId: session.sessionId,
                customerName: session.customerName,
                question: cleanMsg,
                bestScore: Number(bestScore.toFixed(3))
            });
        }

        session.messages.push({
            role: "assistant",
            text: botReply,
            confidence: Number(bestScore.toFixed(3)),
            escalated
        });
        await session.save();

        return res.status(200).json({
            reply: botReply,
            confidence: Number(bestScore.toFixed(3)),
            escalated,
            messages: session.messages
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Support bot error" });
    }
});

router.get("/chat/:sessionId", async (req, res) => {
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
        return res.status(200).json({ messages: session ? session.messages : [] });
    } catch (error) {
        return res.status(500).json({ message: "Error loading chat session" });
    }
});

router.post("/chat/feedback", async (req, res) => {
    try {
        const { sessionId, messageIndex, feedback } = req.body;
        if (!sessionId || !["up", "down"].includes(feedback)) {
            return res.status(400).json({ message: "Valid sessionId and feedback required" });
        }
        const session = await ChatSession.findOne({ sessionId: String(sessionId) });
        if (!session || !session.messages[messageIndex]) {
            return res.status(404).json({ message: "Chat message not found" });
        }
        session.messages[messageIndex].feedback = feedback;
        if (feedback === "down") {
            session.needsHuman = true;
        }
        await session.save();
        return res.status(200).json({
            message: feedback === "up" ? "Glad that helped!" : "Flagged for human review",
            messages: session.messages
        });
    } catch (error) {
        return res.status(500).json({ message: "Error saving chat feedback" });
    }
});

router.get("/admin/overview", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [sessions, unanswered, feedbacks] = await Promise.all([
            ChatSession.find({}).sort({ updatedAt: -1 }).limit(50),
            UnansweredQuestion.find({}).sort({ status: 1, createdAt: -1 }),
            CustomerFeedback.find({}).sort({ createdAt: -1 }).limit(50)
        ]);
        return res.status(200).json({ sessions, unanswered, feedbacks });
    } catch (error) {
        return res.status(500).json({ message: "Error loading support overview" });
    }
});

router.post("/admin/resolve/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { adminReply, addToFaq } = req.body;
        if (!adminReply || !String(adminReply).trim()) {
            return res.status(400).json({ message: "Reply text is required" });
        }
        const item = await UnansweredQuestion.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Question not found" });
        }
        item.status = "Resolved";
        item.adminReply = String(adminReply).trim();
        await item.save();

        await ChatSession.findOneAndUpdate(
            { sessionId: item.sessionId },
            {
                $set: { needsHuman: false },
                $push: {
                    messages: {
                        role: "admin",
                        text: "Human Support Specialist: " + item.adminReply,
                        timestamp: new Date()
                    }
                }
            }
        );

        if (addToFaq) {
            const embedding = await embedText(item.question + "\n" + item.adminReply);
            await FaqDocument.create({
                title: item.question,
                content: item.adminReply,
                embedding,
                createdBy: req.user.userId
            });
        }

        return res.status(200).json({
message: addToFaq ? "Replied and added to FAQ knowledge base!" : "Reply sent to customer chat!"
});
} catch (error) {
return res.status(500).json({ message: error.message || "Error resolving question" });
}
});
router.post("/feedback", async (req, res) => {
    try {
        const { sessionId = "", customerName = "Guest Shopper", customerEmail = "", category = "Website", rating = 5, comment } = req.body;
        if (!comment || !String(comment).trim()) {
            return res.status(400).json({ message: "Please write your feedback or review before submitting" });
        }
        const saved = await CustomerFeedback.create({
            sessionId: String(sessionId),
            customerName: String(customerName || "Guest Shopper").trim(),
            customerEmail: String(customerEmail || "").trim(),
            category: ["Product", "Website", "Delivery", "Support", "Other"].includes(category) ? category : "Website",
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            comment: String(comment).trim()
        });
        return res.status(201).json({ message: "Thank you for sharing your review with ARPIARES! ✨", feedback: saved });
    } catch (error) {
        return res.status(500).json({ message: "Could not save feedback" });
    }
});

module.exports = router;

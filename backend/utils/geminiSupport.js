const CONFIDENCE_THRESHOLD = 0.68;

function getApiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is missing in environment variables");
    }
    return key;
}

function chunkText(title, rawText) {
    const cleaned = String(rawText || "").replace(/\r\n/g, "\n").trim();
    if (!cleaned) return [];

    const paragraphs = cleaned.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const chunks = [];
    let current = "";

    for (const para of paragraphs) {
        if ((current + "\n" + para).length > 650 && current) {
            chunks.push({ title, content: current.trim() });
            current = para;
        } else {
            current = current ? `${current}\n${para}` : para;
        }
    }
    if (current.trim()) {
        chunks.push({ title, content: current.trim() });
    }
    return chunks;
}

async function embedText(text) {
    const apiKey = getApiKey();
    const models = ["text-embedding-004", "gemini-embedding-001"];

    let lastError = null;
    for (const model of models) {
        const url = `https://googleapis.com{model}:embedContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: {
                    parts: [{ text: String(text).slice(0, 4000) }]
                }
            })
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(data?.embedding?.values)) {
            return data.embedding.values;
        }
        lastError = new Error(data?.error?.message || `Embedding failed on ${model}`);
    }
    throw lastError;
}

function cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || !vecA.length) {
        return 0;
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

function retrieveTopMatches(queryEmbedding, faqDocs, topK = 3) {
    const scored = faqDocs.map(doc => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}

async function generateGroundedReply({ question, matchedChunks, history }) {
    const apiKey = getApiKey();
    const contextBlock = matchedChunks
        .map((m, idx) => `[Source ${idx + 1}: ${m.doc.title}]\n${m.doc.content}`)
        .join("\n\n");

    const recentHistory = (history || [])
        .slice(-6)
        .map(m => `${m.role === "user" ? "Customer" : "Support Agent"}: ${m.text}`)
        .join("\n");

    const systemInstruction =
        "You are the official ARPIARES Customer Support Assistant. " +
        "Answer the customer's question using ONLY the verified FAQ knowledge base provided below. " +
        "Do NOT invent policies, prices, phone numbers, or facts outside the provided context. " +
        "If the context does not clearly answer the question, reply with the exact token: ESCALATE_TO_HUMAN. " +
        "Keep answers polite, concise (2-4 sentences), and clear.";

    const prompt =
        `VERIFIED KNOWLEDGE BASE:\n${contextBlock}\n\n` +
        (recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n\n` : "") +
        `CUSTOMER QUESTION:\n${question}`;

    const url = `https://googleapis.com{encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300
            }
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error?.message || "Gemini chat generation failed");
    }

    const replyText = data?.candidates?.at(0)?.content?.parts?.at(0)?.text?.trim() || "";
    return replyText;
}

module.exports = {
    CONFIDENCE_THRESHOLD,
    chunkText,
    embedText,
    retrieveTopMatches,
    generateGroundedReply
};

(function () {
const SESSION_KEY = "arpiares_chat_session";
function getSessionId() {
let id = localStorage.getItem(SESSION_KEY);
if (!id) {
id = "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
localStorage.setItem(SESSION_KEY, id);
}
return id;
}
function resetSessionId() {
const id = "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
localStorage.setItem(SESSION_KEY, id);
return id;
}
function escapeChatHTML(value) {
return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, "&quot;");
}
function renderMessages(messages) {
const body = document.getElementById("chat-widget-messages");
if (!body) return;
const welcomeCard =
'' +
'✨ Welcome to ARPIARES Support! Ask me anything about delivery, returns, payments, or product care.' +
'' +
'🚚 Delivery time' +
'🔄 Returns' +
'💳 Payments' +
'' +
'';
if (!messages || !messages.length) {
body.innerHTML = welcomeCard;
return;
}
body.innerHTML = welcomeCard + messages.map((m, idx) => {
const roleClass = m.role === "user" ? "user" : (m.role === "admin" ? "admin" : "bot");
let badge = "";
let feedbackBar = "";
let closingNote = "";
if (m.role === "assistant") {
if (m.escalated) {
badge = 'Escalated to Human Support';
} else if (typeof m.confidence === "number" && m.confidence > 0) {
badge = 'FAQ Match · ' + Math.round(m.confidence * 100) + '%';
}
const upActive = m.feedback === "up" ? "active" : "";
const downActive = m.feedback === "down" ? "active" : "";
feedbackBar = '' +
'Helpful?' +
'👍' +
'👎' +
'';
closingNote = '✨ Thank you for shopping with ARPIARES! Let me know if you need anything else 🛍️💛';
} else if (m.role === "admin") {
badge = 'Human Agent Reply';
closingNote = '🌿 Warm regards, ARPIARES Care Team ✨';
}
return '' +
badge +
'' + escapeChatHTML(m.text) + '' +
closingNote +
feedbackBar +
'';
}).join("");
body.scrollTop = body.scrollHeight;
}
async function loadChatHistory() {
try {
const data = await apiRequest("/api/support/chat/" + encodeURIComponent(getSessionId()));
renderMessages(data.messages || []);
} catch {
renderMessages([]);
}
}
async function sendChatMessage(text) {
const input = document.getElementById("chat-widget-input");
const sendBtn = document.getElementById("chat-widget-send");
const body = document.getElementById("chat-widget-messages");
const user = typeof getUser === "function" ? getUser() : null;
if (input) input.value = "";
if (sendBtn) sendBtn.disabled = true;
body.insertAdjacentHTML(
"beforeend",
'' + escapeChatHTML(text) + '' +
'Checking ARPIARES knowledge base… ✨'
);
body.scrollTop = body.scrollHeight;
try {
const data = await apiRequest("/api/support/chat", {
method: "POST",
body: JSON.stringify({
sessionId: getSessionId(),
message: text,
customerName: user?.name || "Guest Shopper",
customerEmail: user?.email || ""
})
});
renderMessages(data.messages || []);
} catch (err) {
document.getElementById("chat-typing")?.remove();
body.insertAdjacentHTML(
"beforeend",
'Notice' + escapeChatHTML(err.message) + ''
);
} finally {
if (sendBtn) sendBtn.disabled = false;
input?.focus();
}
}
document.addEventListener("DOMContentLoaded", () => {
const toggleBtn = document.getElementById("chat-widget-toggle");
const headerBtn = document.getElementById("header-support-btn");
const drawer = document.getElementById("chat-widget-drawer");
const closeBtn = document.getElementById("chat-widget-close");
const newChatBtn = document.getElementById("chat-widget-new");
const form = document.getElementById("chat-widget-form");
const input = document.getElementById("chat-widget-input");
if (!toggleBtn || !drawer || !form) return;
async function openDrawer() {
drawer.classList.add("open");
drawer.setAttribute("aria-hidden", "false");
await loadChatHistory();
input?.focus();
}
toggleBtn.addEventListener("click", async () => {
if (drawer.classList.contains("open")) {
drawer.classList.remove("open");
drawer.setAttribute("aria-hidden", "true");
} else {
await openDrawer();
}
});
headerBtn?.addEventListener("click", openDrawer);
closeBtn?.addEventListener("click", () => {
drawer.classList.remove("open");
drawer.setAttribute("aria-hidden", "true");
});
newChatBtn?.addEventListener("click", () => {
resetSessionId();
renderMessages([]);
input?.focus();
});
form.addEventListener("submit", async e => {
e.preventDefault();
const text = input.value.trim();
if (!text) return;
await sendChatMessage(text);
});
document.addEventListener("click", async e => {
const chip = e.target.closest("[data-quick-ask]");
if (chip) {
await sendChatMessage(chip.dataset.quickAsk);
}
const fbBtn = e.target.closest("[data-chat-fb]");
if (fbBtn) {
try {
const data = await apiRequest("/api/support/chat/feedback", {
method: "POST",
body: JSON.stringify({
sessionId: getSessionId(),
messageIndex: Number(fbBtn.dataset.msgIdx),
feedback: fbBtn.dataset.chatFb
})
});
renderMessages(data.messages || []);
} catch {}
}
});
});
})();

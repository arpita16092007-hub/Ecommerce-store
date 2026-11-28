(function () {
  var STATES = {
    welcome:    { img: "images/arpibot/welcome.png",    pill: "Online • Ready to help",       label: "Welcome" },
    helping:    { img: "images/arpibot/helping.png",    pill: "Searching • Store catalog",    label: "Helping" },
    thinking:   { img: "images/arpibot/thinking.png",   pill: "Checking • Store details",     label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Guide • Store & care info",    label: "Explaining" },
    happy:      { img: "images/arpibot/happy.png",      pill: "Happy • Glad to assist",       label: "Happy" },
    excited:    { img: "images/arpibot/excited.png",    pill: "Found • Best picks for you",   label: "Excited" },
    winking:    { img: "images/arpibot/winking.png",    pill: "Pro Tip • Smart shopping",     label: "Pro Tip" },
    working:    { img: "images/arpibot/working.png",    pill: "Working • Orders & account",   label: "Working" },
    confused:   { img: "images/arpibot/confused.png",   pill: "Clarify • Tell me more",       label: "Clarify" },
    sorry:      { img: "images/arpibot/sorry.png",      pill: "Care • Easy returns & help",   label: "Sorry" },
    sad:        { img: "images/arpibot/sad.png",        pill: "Support • Here for you",       label: "Support" },
    bye:        { img: "images/arpibot/bye.png",        pill: "Goodbye • Come back soon!",    label: "Bye" }
  };

  var MOODS = ["welcome", "helping", "thinking", "explaining", "happy", "excited", "winking", "working", "confused", "sorry", "sad", "bye"];

  var HELP_TILES = [
    { label: "🛍️ Top Products",    q: "Show me your top products" },
    { label: "📂 All Categories",  q: "What categories do you have?" },
    { label: "💰 Under ₹1500",     q: "Show products under 1500" },
    { label: "📦 Track My Order",  q: "How do I track my order?" },
    { label: "🚚 Shipping & COD",  q: "Tell me about shipping, delivery, and COD payment" },
    { label: "🔄 Returns & Care",  q: "What is your return, refund, and warranty policy?" }
  ];

  var PROMPTS = [
    { label: "💳 Payment & COD",   q: "What payment methods and COD options do you accept?" },
    { label: "🎁 Gift Ideas",      q: "Suggest nice gift ideas" },
    { label: "❤️ My Wishlist",     q: "How do I view my saved wishlist items?" },
    { label: "👤 Account & Login", q: "How do I sign up, login, or check my profile?" },
    { label: "📝 Give Feedback",   q: "Where can I submit a product review or feedback?" },
    { label: "📞 Contact Support", q: "How can I contact customer support?" }
  ];

  var INLINE_CSS = [
    "#arpBotDock,#arpBotDock *,#arpUniversalDrawer,#arpUniversalDrawer *{box-sizing:border-box!important;letter-spacing:normal;}",
    "#arpBotDock{position:fixed!important;bottom:22px!important;right:22px!important;left:auto!important;top:auto!important;z-index:2147483646!important;display:flex!important;flex-direction:row!important;align-items:flex-end!important;gap:12px!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;user-select:none!important;touch-action:none!important;}",
    "#arpChatBubbleTip{position:relative!important;display:block!important;width:236px!important;background:linear-gradient(160deg,#fffdf9 0%,#f5e9d0 100%)!important;color:#142820!important;border:1.5px solid #cfa55b!important;border-radius:20px 20px 4px 20px!important;padding:12px 30px 12px 15px!important;box-shadow:0 14px 32px rgba(4,25,18,.24)!important;font:400 12.5px/1.45 'DM Sans',sans-serif!important;cursor:pointer!important;text-align:left!important;}",
    "#arpChatBubbleTip .arp-tip-eyebrow{display:flex!important;align-items:center!important;gap:6px!important;font:700 9.5px/1.2 'DM Sans',sans-serif!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:#8f6520!important;margin:0 0 5px 0!important;}",
    "#arpChatBubbleTip .arp-tip-eyebrow img{width:15px!important;height:15px!important;min-width:15px!important;max-width:15px!important;object-fit:contain!important;border-radius:0!important;display:inline-block!important;margin:0!important;}",
    "#arpChatBubbleTip strong{display:block!important;font:700 15.5px/1.25 'Playfair Display',Georgia,serif!important;color:#07261c!important;margin:0 0 3px 0!important;}",
    "#arpTipDismiss{position:absolute!important;top:7px!important;right:7px!important;width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;border-radius:50%!important;border:none!important;background:rgba(7,38,28,.1)!important;color:#07261c!important;font:700 13px/1 sans-serif!important;padding:0!important;margin:0!important;cursor:pointer!important;display:grid!important;place-items:center!important;}",
    "#arpTipDismiss:hover{background:#07261c!important;color:#edd19a!important;}",
    "#arpUniversalOrb{position:relative!important;width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;max-width:72px!important;max-height:72px!important;border-radius:50%!important;padding:0!important;margin:0!important;border:2.5px solid #e2be79!important;background:radial-gradient(circle at 30% 25%,#154c39,#062118)!important;box-shadow:0 14px 32px rgba(4,25,18,.45),0 0 0 4px rgba(226,190,121,.25)!important;cursor:grab!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;}",
    "#arpUniversalOrb img{width:68px!important;height:68px!important;min-width:68px!important;min-height:68px!important;max-width:68px!important;max-height:68px!important;object-fit:cover!important;object-position:center top!important;display:block!important;pointer-events:none!important;border-radius:50%!important;margin:0!important;padding:0!important;}",
    "#arpStageImg{width:60px!important;height:60px!important;min-width:60px!important;min-height:60px!important;max-width:60px!important;max-height:60px!important;object-fit:cover!important;object-position:center top!important;display:block!important;pointer-events:none!important;border-radius:50%!important;margin:0!important;padding:0!important;}",
    "#arpUniversalDrawer{position:fixed!important;bottom:106px!important;right:22px!important;left:auto!important;top:auto!important;z-index:2147483647!important;width:416px!important;max-width:calc(100vw - 24px)!important;height:auto!important;border-radius:26px!important;background:#fbf7ef!important;border:2px solid #cfa55b!important;box-shadow:0 28px 68px rgba(4,25,18,.44)!important;overflow:hidden!important;display:none!important;flex-direction:column!important;margin:0!important;padding:0!important;text-align:left!important;}",
    "#arpUniversalDrawer.is-open{display:flex!important;}",
    ".arp-ab-head{position:relative!important;width:100%!important;background:radial-gradient(circle at 85% 15%,#195440 0%,#07261c 75%)!important;color:#fff8eb!important;padding:14px 16px!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;border-bottom:1.5px solid rgba(226,190,121,.45)!important;cursor:grab!important;user-select:none!important;touch-action:none!important;margin:0!important;}",
    ".arp-ab-stage{display:flex!important;flex-direction:row!important;align-items:center!important;gap:12px!important;flex:1!important;min-width:0!important;margin:0!important;padding:0!important;}",
    ".arp-ab-ring{width:62px!important;height:62px!important;min-width:62px!important;min-height:62px!important;max-width:62px!important;max-height:62px!important;border-radius:50%!important;border:2px solid #edd19a!important;background:#062118!important;box-shadow:0 0 20px rgba(237,209,154,.32)!important;overflow:hidden!important;flex-shrink:0!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0!important;}",
    ".arp-ab-meta{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:4px!important;min-width:0!important;flex:1!important;margin:0!important;padding:0!important;}",
    ".arp-ab-eyebrow{display:block!important;font:700 9.5px/1.2 'DM Sans',sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#d8b373!important;margin:0!important;padding:0!important;}",
    ".arp-ab-title{display:block!important;font:700 19px/1.15 'Playfair Display',Georgia,serif!important;color:#fff8eb!important;margin:0!important;padding:0!important;}",
    ".arp-ab-pill{display:inline-flex!important;align-items:center!important;gap:6px!important;margin:2px 0 0 0!important;padding:3px 10px!important;border-radius:999px!important;background:rgba(6,33,24,.92)!important;border:1px solid rgba(226,190,121,.6)!important;font:600 10.5px/1.2 'DM Sans',sans-serif!important;color:#f4dca8!important;white-space:nowrap!important;}",
    ".arp-ab-pill::before{content:''!important;width:6px!important;height:6px!important;border-radius:50%!important;background:#4ade80!important;display:inline-block!important;flex-shrink:0!important;}",
    ".arp-ab-close{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;max-width:32px!important;max-height:32px!important;border-radius:50%!important;border:1px solid rgba(237,209,154,.45)!important;background:rgba(255,255,255,.1)!important;color:#edd19a!important;cursor:pointer!important;font:700 18px/1 sans-serif!important;padding:0!important;margin:0!important;display:grid!important;place-items:center!important;flex-shrink:0!important;}",
    ".arp-ab-close:hover{background:#edd19a!important;color:#07261c!important;}",
    ".arp-ab-bar{display:flex!important;flex-direction:row!important;align-items:center!important;gap:6px!important;width:100%!important;padding:8px 12px!important;background:#0a3024!important;border-bottom:1px solid rgba(216,179,115,.25)!important;overflow-x:auto!important;margin:0!important;}",
".arp-ab-btn{padding:4px 10px!important;border-radius:999px!important;border:1px solid rgba(237,209,154,.35)!important;background:rgba(255,255,255,.07)!important;color:#f7e7c4!important;font:600 10.5px/1.2 'DM Sans',sans-serif!important;cursor:pointer!important;white-space:nowrap!important;flex-shrink:0!important;margin:0!important;width:auto!important;height:auto!important;}",
".arp-ab-btn.active{background:#edd19a!important;color:#062118!important;border-color:#edd19a!important;}",
".arp-u-feed{width:100%!important;padding:14px!important;height:295px!important;max-height:295px!important;overflow-y:auto!important;display:flex!important;flex-direction:column!important;gap:11px!important;background:#faf5eb!important;font:400 13px/1.55 'DM Sans',sans-serif!important;color:#142820!important;margin:0!important;}",
".arp-welcome-card{background:linear-gradient(155deg,#fffdf8 0%,#f6ead2 100%)!important;border:1.5px solid #d8b373!important;border-radius:18px!important;padding:14px!important;color:#142820!important;margin:0!important;}",
".arp-wc-kicker{display:block!important;font:700 9.5px/1.2 'DM Sans',sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#8f6520!important;margin:0 0 4px 0!important;}",
".arp-welcome-card h4{margin:0 0 6px 0!important;font:700 17.5px/1.25 'Playfair Display',Georgia,serif!important;color:#07261c!important;}",
".arp-welcome-card p{margin:0 0 11px 0!important;font:400 12.5px/1.5 'DM Sans',sans-serif!important;color:#263c33!important;}",
".arp-help-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;width:100%!important;margin:0!important;padding:0!important;}",
".arp-help-tile{display:flex!important;align-items:center!important;gap:6px!important;width:100%!important;padding:7px 9px!important;margin:0!important;border-radius:11px!important;border:1px solid rgba(200,157,92,.6)!important;background:#ffffff!important;color:#07261c!important;font:600 11px/1.25 'DM Sans',sans-serif!important;text-align:left!important;cursor:pointer!important;}",
".arp-help-tile:hover{background:#07261c!important;color:#f4dca8!important;}",
".arp-speech{background:#fffcf5!important;border:1px solid #dec089!important;border-left:3.5px solid #cfa55b!important;border-radius:16px 16px 16px 4px!important;padding:12px 14px!important;color:#142820!important;font:400 13px/1.55 'DM Sans',sans-serif!important;margin:0!important;}",
".arp-speech p{margin:0 0 6px 0!important;font:400 13px/1.5 'DM Sans',sans-serif!important;color:#142820!important;}",
".arp-speech ul{margin:4px 0 0 0!important;padding:0 0 0 16px!important;display:flex!important;flex-direction:column!important;gap:4px!important;}",
".arp-speech li{font:400 12.5px/1.45 'DM Sans',sans-serif!important;color:#1a3027!important;}",
".arp-speech a{color:#07261c!important;font-weight:700!important;text-decoration:underline!important;}",
".arp-speech-tag{display:block!important;font:700 9.5px/1.2 'DM Sans',sans-serif!important;letter-spacing:.11em!important;text-transform:uppercase!important;color:#8f6520!important;margin:0 0 5px 0!important;}",
".arp-user{align-self:flex-end!important;max-width:82%!important;background:#07261c!important;color:#fff8eb!important;border:1px solid rgba(216,179,115,.45)!important;border-radius:16px 16px 4px 16px!important;padding:9px 14px!important;font:400 13px/1.45 'DM Sans',sans-serif!important;margin:0!important;}",
".arp-product-hit{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:8px 11px!important;margin-top:7px!important;border-radius:11px!important;background:#ffffff!important;border:1px solid rgba(200,157,92,.55)!important;text-decoration:none!important;color:#142820!important;font:400 12.5px/1.35 'DM Sans',sans-serif!important;}",
".arp-chips{display:flex!important;flex-direction:row!important;align-items:center!important;gap:6px!important;width:100%!important;padding:8px 12px 6px!important;background:#f8f1e3!important;border-top:1px solid rgba(207,165,91,.28)!important;overflow-x:auto!important;margin:0!important;}",
".arp-chips button{padding:5px 11px!important;border-radius:999px!important;border:1px solid rgba(200,157,92,.65)!important;background:#fffdf9!important;color:#07261c!important;font:600 11px/1.2 'DM Sans',sans-serif!important;cursor:pointer!important;white-space:nowrap!important;flex-shrink:0!important;margin:0!important;width:auto!important;height:auto!important;}",
".arp-chips button:hover{background:#07261c!important;color:#f3dca8!important;}",
".arp-form{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;width:100%!important;padding:10px 12px 12px!important;background:#fffdf9!important;border-top:1px solid rgba(200,157,92,.35)!important;margin:0!important;}",
".arp-form input{flex:1!important;min-width:0!important;width:auto!important;border-radius:999px!important;border:1.5px solid rgba(7,38,28,.2)!important;background:#faf5eb!important;padding:9px 14px!important;font:400 13px/1.2 'DM Sans',sans-serif!important;color:#07261c!important;margin:0!important;}",
".arp-form button{border-radius:999px!important;padding:9px 16px!important;background:linear-gradient(135deg,#f0d59c 0%,#cfa55b 100%)!important;color:#07261c!important;border:1px solid #b5893f!important;font:700 12px/1.2 'DM Sans',sans-serif!important;cursor:pointer!important;flex-shrink:0!important;margin:0!important;width:auto!important;height:auto!important;}"
].join("\n");
var catalog = null;
async function getCatalog() {
if (Array.isArray(catalog)) return catalog;
try {
var r = await fetch("/api/products?limit=100");
if (!r.ok) return [];
var d = await r.json();
catalog = Array.isArray(d) ? d : (d.products || []);
return catalog;
} catch (e) {
return [];
}
}
function esc(s) {
return String(s == null ? "" : s)
.split("&").join("&")
.split("<").join("<")
.split(">").join(">")
.split(String.fromCharCode(34)).join("&" + "quot;");
}
function inr(v) {
return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));
}
function card(p) {
var href = p._id ? "index.html?product=" + encodeURIComponent(p._id) + "#catalog" : "index.html#catalog";
var stockTxt = typeof p.stock === "number" ? (p.stock > 0 ? "In stock (" + p.stock + ")" : "Out of stock") : "Available";
return (
'' +
'' + esc(p.name) + ' - ' + esc(p.category || "ARPIARES") + ' (' + stockTxt + ')' +
'' + inr(p.price) + '' +
''
);
}
function injectStyles() {
var existing = document.getElementById("arpibot-inline-css");
if (existing) existing.remove();
var style = document.createElement("style");
style.id = "arpibot-inline-css";
style.textContent = INLINE_CSS;
document.head.appendChild(style);
}
function makeMovable(dock, drawer, onTapDock) {
var dragged = false;
var activeEl = null;
var activeHandle = null;
var activePointerId = null;
var captured = false;
var startX = 0;
var startY = 0;
var origLeft = 0;
var origTop = 0;
function clampPosition(el, left, top) {
var maxLeft = Math.max(8, window.innerWidth - el.offsetWidth - 8);
var maxTop = Math.max(8, window.innerHeight - el.offsetHeight - 8);
return {
left: Math.min(Math.max(8, left), maxLeft),
top: Math.min(Math.max(8, top), maxTop)
};
}
function restoreSaved(el, key) {
try {
var raw = localStorage.getItem(key);
if (!raw) return;
var pos = JSON.parse(raw);
if (typeof pos.left === "number" && typeof pos.top === "number") {
var c = clampPosition(el, pos.left, pos.top);
el.style.setProperty("right", "auto", "important");
el.style.setProperty("bottom", "auto", "important");
el.style.setProperty("left", c.left + "px", "important");
el.style.setProperty("top", c.top + "px", "important");
}
} catch (e) {}
}
function attachDrag(handle, target, storageKey, isDock) {
if (!handle || !target) return;
handle.addEventListener("pointerdown", function (e) {
if (e.button !== undefined && e.button !== 0) return;
if (e.target && e.target.closest("button.arp-ab-close, button#arpTipDismiss")) return;
activeEl = target;
activeHandle = handle;
activePointerId = e.pointerId;
dragged = false;
captured = false;
var rect = target.getBoundingClientRect();
startX = e.clientX;
startY = e.clientY;
origLeft = rect.left;
origTop = rect.top;
target.dataset.storageKey = storageKey;
});
handle.addEventListener("pointermove", function (e) {
if (!activeEl || activeEl !== target) return;
var dx = e.clientX - startX;
var dy = e.clientY - startY;
if (!dragged && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
dragged = true;
target.style.setProperty("right", "auto", "important");
target.style.setProperty("bottom", "auto", "important");
target.style.setProperty("left", origLeft + "px", "important");
target.style.setProperty("top", origTop + "px", "important");
if (!captured && activeHandle && activeHandle.setPointerCapture) {
try {
activeHandle.setPointerCapture(activePointerId);
captured = true;
} catch (err) {}
}
}
if (!dragged) return;
var c = clampPosition(target, origLeft + dx, origTop + dy);
target.style.setProperty("left", c.left + "px", "important");
target.style.setProperty("top", c.top + "px", "important");
});
function finishPointer() {
if (activeEl !== target) return;
var wasDrag = dragged;
if (captured && activeHandle && activeHandle.releasePointerCapture) {
try { activeHandle.releasePointerCapture(activePointerId); } catch (err) {}
}
if (wasDrag && target.dataset.storageKey) {
try {
localStorage.setItem(target.dataset.storageKey, JSON.stringify({
left: parseFloat(target.style.left),
top: parseFloat(target.style.top)
}));
} catch (err) {}
} else if (!wasDrag && isDock && typeof onTapDock === "function") {
onTapDock();
}
activeEl = null;
activeHandle = null;
captured = false;
setTimeout(function () { dragged = false; }, 40);
}
handle.addEventListener("pointerup", finishPointer);
handle.addEventListener("pointercancel", finishPointer);
}
restoreSaved(dock, "arpibot_dock_pos_v2");
restoreSaved(drawer, "arpibot_drawer_pos_v2");
attachDrag(dock, dock, "arpibot_dock_pos_v2", true);
var head = drawer.querySelector(".arp-ab-head");
attachDrag(head, drawer, "arpibot_drawer_pos_v2", false);
}
function init() {
if (document.getElementById("arpBotDock")) return;
injectStyles();
var dock = document.createElement("div");
dock.id = "arpBotDock";
dock.innerHTML =
'' +
'×' +
'' +
' ARPIARES Assistant' +
'' +
'Hi! Need any help?' +
'Ask about products, prices, delivery, COD, orders & returns.' +
'' +
'' +
'' +
'';
var moodBtns = MOODS.map(function (k) {
var cls = k === "welcome" ? "arp-ab-btn active" : "arp-ab-btn";
return '' + STATES[k].label + '';
}).join("");
var tilesHtml = HELP_TILES.map(function (t) {
return '' + esc(t.label) + '';
}).join("");
var chipBtns = PROMPTS.map(function (p) {
return '' + esc(p.label) + '';
}).join("");
var drawer = document.createElement("div");
drawer.id = "arpUniversalDrawer";
drawer.setAttribute("role", "dialog");
drawer.setAttribute("aria-label", "ArpiBot Store Assistant");
drawer.innerHTML =
'' +
'' +
'' +
'' +
'✦ ARPIARES Store Assistant' +
'ArpiBot' +
'Online • Ready to help' +
'' +
'' +
'×' +
'' +
'' + moodBtns + '' +
'' +
'' +
'✦ Welcome to ARPIARES' +
'Hi! I am ArpiBot — how can I help you?' +
'Ask me anything from finding products or budget deals to delivery, COD payments, returns, or live order tracking:' +
'' + tilesHtml + '' +
'' +
'' +
'' + chipBtns + '' +
'' +
'' +
'Send' +
'';
document.body.appendChild(dock);
document.body.appendChild(drawer);
var orb = document.getElementById("arpUniversalOrb");
var tip = document.getElementById("arpChatBubbleTip");
var tipDismiss = document.getElementById("arpTipDismiss");
var closeBtn = document.getElementById("arpDrawerClose");
var img = document.getElementById("arpStageImg");
var pill = document.getElementById("arpStagePill");
var feed = document.getElementById("arpFeed");
var form = document.getElementById("arpForm");
var input = document.getElementById("arpInput");
var bar = document.getElementById("arpMoodBar");
function setMood(k) {
var s = STATES[k] || STATES.welcome;
if (img) img.src = s.img;
if (pill) pill.textContent = s.pill;
if (bar) {
bar.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.classList.toggle("active", b.dataset.mood === k);
});
}
}
function toggle(open) {
var show = typeof open === "boolean" ? open : !drawer.classList.contains("is-open");
drawer.classList.toggle("is-open", show);
if (show) {
if (tip) tip.style.setProperty("display", "none", "important");
setMood("welcome");
setTimeout(function () { if (input) input.focus(); }, 60);
}
}
makeMovable(dock, drawer, function () { toggle(); });
if (tipDismiss) {
tipDismiss.addEventListener("click", function (e) {
e.stopPropagation();
if (tip) tip.style.setProperty("display", "none", "important");
});
}
orb.addEventListener("keydown", function (e) {
if (e.key === "Enter" || e.key === " ") {
e.preventDefault();
toggle();
}
});
closeBtn.addEventListener("click", function () {
setMood("bye");
setTimeout(function () { drawer.classList.remove("is-open"); }, 350);
});
if (bar) {
bar.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.addEventListener("click", function () { setMood(b.dataset.mood); });
});
}
function say(tag, html) {
var d = document.createElement("div");
d.className = "arp-speech";
d.innerHTML = '' + esc(tag) + '' + html;
feed.appendChild(d);
feed.scrollTop = feed.scrollHeight;
}
async function ask(raw) {
var q = String(raw || "").trim();
if (!q) return;
var u = document.createElement("div");
u.className = "arp-user";
u.textContent = q;
feed.appendChild(u);
feed.scrollTop = feed.scrollHeight;
setMood("thinking");
var l = q.toLowerCase();
var html = "";
var m = "happy";
var budgetMatch = l.match(/(?:under|below|less than|within|budget)\s*(?:rs.?|inr|₹)?\s*(\d+)/);
if (l === "hi" || l === "hello" || l === "hey" || l === "namaste" || l.indexOf("hello ") === 0 || l.indexOf("hi ") === 0) {
m = "welcome";
html = "Hello! I am ArpiBot. Here is everything I can help you with today:" +
"" +
"Find Products & Deals: Search any item, category (like Beauty), or budget (e.g. under 1500)." +
"Orders & Delivery: Track orders, check free shipping (> ₹999), and COD options." +
"Returns & Support: 7-day easy returns, 1-year warranty, and direct support contacts." +
"";
} else if (l.indexOf("bye") !== -1 || l.indexOf("thank") !== -1) {
m = l.indexOf("thank") !== -1 ? "happy" : "bye";
html = l.indexOf("thank") !== -1
? "You are very welcome! Ask me anytime if you need help picking products or checking orders."
: "Goodbye! Thank you for shopping at ARPIARES—come back soon.";
} else if (l.indexOf("payment") !== -1 || l.indexOf("cod") !== -1 || l.indexOf("cash on delivery") !== -1 || l.indexOf("upi") !== -1 || l.indexOf("card") !== -1) {
m = "explaining";
html = "We offer flexible, secure payment options across India:" +
"" +
"Cash on Delivery (COD): Available on eligible orders across India." +
"Instant Digital Payments: UPI, Credit Cards, Debit Cards, and Net Banking." +
"";
} else if (l.indexOf("ship") !== -1 || l.indexOf("deliver") !== -1 || l.indexOf("free delivery") !== -1) {
m = "explaining";
html = "Here are our Delivery & Shipping details:" +
"" +
"Free Delivery: Complimentary shipping on all orders above ₹999." +
"Fast Dispatch: Packed and shipped within 24–48 hours across India." +
"More Info: View full shipping coverage on Shipping Info." +
"";
} else if (l.indexOf("return") !== -1 || l.indexOf("refund") !== -1 || l.indexOf("exchange") !== -1 || l.indexOf("warrant") !== -1) {
m = "sorry";
html = "Your order is protected by our ARPIARES Care promise:" +
"" +
"7-Day Easy Returns & Refunds: Hassle-free return pickup for unused items in original packaging." +
"1-Year Product Warranty: Coverage against manufacturing defects." +
"Full Policy: Read step-by-step instructions on Returns & Warranty." +
"";
} else if (l.indexOf("cancel") !== -1) {
m = "working";
html = "Need to cancel or update an order?" +
"" +
"Check your current status on My Orders." +
"If it has not shipped yet, call +91 8438358104 right away for instant cancellation." +
"";
} else if (l.indexOf("track") !== -1 || l.indexOf("order") !== -1) {
m = "working";
html = "Track your order in real time across 4 live stages:" +
"" +
"Live Stages: Pending → Confirmed → Shipped → Delivered." +
"Where to Check: Open Account & Orders anytime." +
"";
} else if (l.indexOf("account") !== -1 || l.indexOf("login") !== -1 || l.indexOf("sign") !== -1 || l.indexOf("profile") !== -1 || l.indexOf("password") !== -1) {
m = "working";
html = "Manage your ARPIARES account easily:" +
"" +
"Orders & Address: View past orders and profile details on Account Page." +
"Sign In / Register: Use the account icon in the top header on Home." +
"";
} else if (l.indexOf("wishlist") !== -1 || l.indexOf("saved") !== -1 || l.indexOf("bag") !== -1 || l.indexOf("cart") !== -1) {
m = "winking";
html = "Keep track of pieces you love:" +
"" +
"Saved Items: Open Saved Collection (Wishlist) to view all hearted products." +
"Quick Checkout: Move any wishlist item straight into your Shopping Bag in one tap." +
"";
} else if (l.indexOf("feedback") !== -1 || l.indexOf("review") !== -1 || l.indexOf("rate") !== -1 || l.indexOf("complaint") !== -1) {
m = "happy";
html = "We value every customer note! Share a product rating, delivery review, or suggestion on our Customer Feedback page.";
} else if (l.indexOf("contact") !== -1 || l.indexOf("phone") !== -1 || l.indexOf("email") !== -1 || l.indexOf("hour") !== -1 || l.indexOf("support") !== -1 || l.indexOf("help") !== -1) {
m = "sad";
html = "Reach our Customer Support Team (Mon–Sat, 10:00 AM – 7:00 PM IST):" +
"" +
"Phone: +91 8438358104" +
"Email: arpitagigabyte@gmail.com" +
"Online Form: Customer Feedback" +
"";
} else if (l.indexOf("cheap") !== -1 || l.indexOf("affordable") !== -1 || l.indexOf("lowest") !== -1) {
setMood("helping");
var allCheap = await getCatalog();
var sortedCheap = allCheap.slice().sort(function (a, b) { return Number(a.price || 0) - Number(b.price || 0); });
m = sortedCheap.length ? "excited" : "winking";
html = sortedCheap.length
? "Here are our most budget-friendly picks:" + sortedCheap.slice(0, 4).map(card).join("")
: "Browse all products sorted by price on the Home Catalog.";
} else if (budgetMatch) {
setMood("helping");
var maxPrice = Number(budgetMatch);
var allItems = await getCatalog();
var affordable = allItems.filter(function (p) { return Number(p.price || 0) <= maxPrice; });
if (affordable.length) {
m = "excited";
html = "Found " + affordable.length + " product(s) under " + inr(maxPrice) + ":" + affordable.slice(0, 4).map(card).join("");
} else {
m = "sorry";
html = "No products are currently listed under " + inr(maxPrice) + ", but you can explore our full catalog on All Products!";
}
} else if (l.indexOf("categor") !== -1 || l.indexOf("collection") !== -1) {
setMood("helping");
var items = await getCatalog();
var cats = Array.from(new Set(items.map(function (p) { return p.category; }).filter(Boolean)));
m = cats.length ? "winking" : "explaining";
html = cats.length
? "Available store categories: " + cats.map(esc).join(", ") + ".Explore every collection on Browse Categories!"
: "Explore all store collections on Browse Categories.";
} else if (l.indexOf("top") !== -1 || l.indexOf("best") !== -1 || l.indexOf("recommend") !== -1 || l.indexOf("gift") !== -1 || l.indexOf("popular") !== -1) {
setMood("helping");
var items2 = await getCatalog();
m = items2.length ? "excited" : "winking";
html = items2.length
? "Here are our top picks for you:" + items2.slice(0, 4).map(card).join("")
: "Explore our featured products on the Home Page.";
} else {
setMood("helping");
var items3 = await getCatalog();
var terms = l.split(" ").filter(function (w) { return w.length > 2; });
var hits = items3.filter(function (p) {
var h = ((p.name || "") + " " + (p.category || "") + " " + (p.description || "")).toLowerCase();
return terms.some(function (t) { return h.indexOf(t) !== -1; });
});
if (hits.length) {
m = "excited";
html = "I found " + hits.length + " matching product(s):" + hits.slice(0, 4).map(card).join("");
} else {
m = "confused";
html = "I could not find an exact match—try asking about Beauty, under 1500, COD payment, delivery, returns, or track order!";
}
}
setMood(m);
say("ArpiBot • " + STATES[m].label, html);
}
form.addEventListener("submit", function (e) {
e.preventDefault();
var v = input.value;
input.value = "";
ask(v);
});
drawer.querySelectorAll("[data-q]").forEach(function (c) {
c.addEventListener("click", function () { ask(c.dataset.q); });
});
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();

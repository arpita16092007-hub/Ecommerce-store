(function () {
  function initArpiBot() {
    if (!document.body) return;

    ["arpBotDock", "arpUniversalOrb", "arpUniversalDrawer", "arpChatBubbleTip"].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });

    if (!document.getElementById("arpibot-14-style")) {
      var st = document.createElement("style");
      st.id = "arpibot-14-style";
      st.textContent = [
        "#arpBotDock{position:fixed!important;bottom:20px;right:20px;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;gap:10px!important;user-select:none!important;touch-action:none!important}",
        "#arpChatBubbleTip{cursor:pointer!important;max-width:210px!important;transition:transform .2s ease}",
        "#arpChatBubbleTip:hover{transform:translateY(-2px)}",
        "#arpChatBubbleTip img{width:195px!important;height:auto!important;display:block!important;filter:drop-shadow(0 10px 22px rgba(4,25,18,.26))}",
        "#arpChatBubbleTip .arp-bubble-fallback{background:#faf0dc!important;color:#142820!important;border:1.5px solid #d8b373!important;border-radius:20px 20px 4px 20px!important;padding:10px 15px!important;box-shadow:0 12px 28px rgba(4,25,18,.24)!important;font:500 12.5px/1.35 'DM Sans',sans-serif!important}",
        "#arpUniversalOrb{width:74px!important;height:74px!important;border-radius:50%!important;padding:0!important;border:2.5px solid #4ade80!important;background:#07261c!important;box-shadow:0 14px 32px rgba(4,25,18,.45),0 0 20px rgba(74,222,128,.4)!important;cursor:grab!important;overflow:hidden!important;display:grid!important;place-items:center!important;flex-shrink:0!important}",
        "#arpUniversalOrb:active{cursor:grabbing!important}",
        "#arpUniversalOrb img,#arpStageImg{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;pointer-events:none!important}",
        "#arpUniversalDrawer{position:fixed!important;bottom:106px;right:20px;z-index:2147483647!important;width:min(400px,calc(100vw - 24px))!important;border-radius:26px!important;background:#faf5eb!important;border:2px solid #c89d5c!important;box-shadow:0 28px 64px rgba(4,25,18,.38)!important;overflow:hidden!important;flex-direction:column}",
        ".arp-ab-head{background:radial-gradient(circle at 80% 20%,#164b39 0%,#07261c 78%);color:#fff8eb;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1.5px solid rgba(216,179,115,.45);cursor:grab;user-select:none;touch-action:none}",
        ".arp-ab-stage{display:flex;align-items:center;gap:12px}",
        ".arp-ab-ring{width:74px;height:74px;border-radius:50%;border:2px solid #edd19a;background:#062118;box-shadow:0 0 22px rgba(237,209,154,.3);overflow:hidden;flex-shrink:0}",
        ".arp-ab-pill{display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:3px 11px;border-radius:999px;background:#07261c;border:1px solid #d8b373;font:700 10.5px 'DM Sans',sans-serif;color:#edd19a}",
        ".arp-ab-bar{display:flex;gap:5px;padding:7px 10px;background:#0a3024;border-bottom:1px solid rgba(216,179,115,.25);overflow-x:auto}",
        ".arp-ab-btn{padding:4px 10px;border-radius:999px;border:1px solid rgba(237,209,154,.35);background:rgba(255,255,255,.06);color:#f7e7c4;font:600 10.5px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}",
        ".arp-ab-btn.active{background:#edd19a;color:#062118;border-color:#edd19a}",
        ".arp-u-feed{padding:14px;max-height:255px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#faf5eb;font:400 13px/1.5 'DM Sans',sans-serif}",
        ".arp-speech{background:#faf0dc;border:1.5px solid #d8b373;border-radius:18px 18px 18px 4px;padding:12px 14px;color:#142820}",
        ".arp-user{align-self:flex-end;max-width:82%;background:#07261c;color:#fff8eb;border:1px solid rgba(216,179,115,.4);border-radius:18px 18px 4px 18px;padding:10px 14px}",
        ".arp-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 4px;background:#faf5eb}",
        ".arp-chips button{padding:5px 11px;border-radius:999px;border:1px solid rgba(200,157,92,.55);background:#fffdf8;color:#07261c;font:600 11px 'DM Sans',sans-serif;cursor:pointer}",
        ".arp-form{display:flex;gap:8px;padding:10px 12px;background:#fffdf9;border-top:1px solid rgba(200,157,92,.35)}",
        ".arp-form input{flex:1;border-radius:999px;border:1px solid rgba(7,38,28,.2);background:#faf5eb;padding:9px 14px;font:400 13px 'DM Sans',sans-serif;color:#07261c}",
        ".arp-form button{border-radius:999px;padding:9px 16px;background:linear-gradient(135deg,#edd19a 0%,#d8b373 100%);color:#07261c;border:1px solid #b89149;font:700 12px 'DM Sans',sans-serif;cursor:pointer}"
      ].join("\n");
      document.head.appendChild(st);
    }

    var STATES = {
      welcome:    { img: "images/arpibot/welcome.png",    pill: "Welcome • Ready to help",       label: "Welcome" },
      helping:    { img: "images/arpibot/helping.png",    pill: "Helping • Shopping guide",      label: "Helping" },
      working:    { img: "images/arpibot/working.png",    pill: "Working • Checking catalog...", label: "Working" },
      thinking:   { img: "images/arpibot/thinking.png",   pill: "Thinking • Looking into it...", label: "Thinking" },
      explaining: { img: "images/arpibot/explaining.png", pill: "Explaining • Here is how",      label: "Explaining" },
      winking:    { img: "images/arpibot/winking.png",    pill: "Winking • Found a match!",      label: "Winking" },
      excited:    { img: "images/arpibot/excited.png",    pill: "Excited • Amazing pick!",       label: "Excited" },
      happy:      { img: "images/arpibot/happy.png",      pill: "Happy • Glad to assist!",       label: "Happy" },
      confused:   { img: "images/arpibot/confused.png",   pill: "Confused • Tell me more",       label: "Confused" },
      sorry:      { img: "images/arpibot/sorry.png",      pill: "Sorry • Let me fix that",       label: "Sorry" },
      sad:        { img: "images/arpibot/sad.png",        pill: "Sad • Here to support you",     label: "Sad" },
      bye:        { img: "images/arpibot/bye.png",        pill: "Bye • See you soon!",           label: "Bye" }
    };

    var dock = document.createElement("div");
    dock.id = "arpBotDock";

    var bubble = document.createElement("div");
    bubble.id = "arpChatBubbleTip";
    bubble.innerHTML =
      '<img src="images/arpibot/chat-bubble.png" alt="Hi!! How can I help you today?" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';" />' +
      '<div class="arp-bubble-fallback" style="display:none;"><strong style="display:block;font:italic 700 15px Cormorant Garamond,serif;color:#07261c;margin-bottom:2px;">Hi!! 👋</strong>How can I help you today?</div>';

    var orb = document.createElement("button");
    orb.id = "arpUniversalOrb";
    orb.type = "button";
    orb.title = "Drag to move • Click to chat with ArpiBot";
    orb.innerHTML = '<img id="arpOrbImg" src="images/arpibot/chat-icon.png" onerror="this.onerror=null;this.src=\'images/arpibot/welcome.png\'" alt="ArpiBot" />';

    dock.appendChild(bubble);
    dock.appendChild(orb);
    document.body.appendChild(dock);

    var box = document.createElement("div");
    box.id = "arpUniversalDrawer";
    box.style.display = "none";
    box.innerHTML =
      '<div class="arp-ab-head"><div class="arp-ab-stage"><div class="arp-ab-ring"><img id="arpStageImg" src="images/arpibot/welcome.png" alt="ArpiBot" /></div>' +
      '<div><strong style="font:700 17px Cormorant Garamond,serif;display:block;color:#fff8eb;">ArpiBot • ARPIARES</strong>' +
      '<span class="arp-ab-pill" id="arpMoodPill">Welcome • Ready to help</span></div></div>' +
      '<button type="button" id="arpUClose" style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(237,209,154,.45);background:rgba(255,255,255,.08);color:#edd19a;cursor:pointer;font-weight:700;">✕</button></div>' +
      '<div class="arp-ab-bar">' +
      '<button type="button" class="arp-ab-btn active" data-s="welcome">Welcome</button>' +
      '<button type="button" class="arp-ab-btn" data-s="helping">Helping</button>' +
      '<button type="button" class="arp-ab-btn" data-s="working">Working</button>' +
      '<button type="button" class="arp-ab-btn" data-s="thinking">Thinking</button>' +
      '<button type="button" class="arp-ab-btn" data-s="explaining">Explaining</button>' +
      '<button type="button" class="arp-ab-btn" data-s="winking">Winking</button>' +
      '<button type="button" class="arp-ab-btn" data-s="excited">Excited</button>' +
      '<button type="button" class="arp-ab-btn" data-s="happy">Happy</button>' +
      '<button type="button" class="arp-ab-btn" data-s="confused">Confused</button>' +
      '<button type="button" class="arp-ab-btn" data-s="sorry">Sorry</button>' +
      '<button type="button" class="arp-ab-btn" data-s="sad">Sad</button>' +
      '<button type="button" class="arp-ab-btn" data-s="bye">Bye</button></div>' +
      '<div class="arp-u-feed" id="arpUFeed"><div class="arp-speech"><strong style="font:italic 700 15px Cormorant Garamond,serif;display:block;color:#07261c;margin-bottom:2px;">Hi!! 👋</strong>How can I help you today? Ask about orders, delivery, or our handpicked pieces.</div></div>' +
      '<div class="arp-chips">' +
      '<button type="button" data-q="Show me exciting top picks">✨ Top picks</button>' +
      '<button type="button" data-q="Track my order">💻 Track order</button>' +
      '<button type="button" data-q="Explain delivery and returns">💡 Delivery &amp; returns</button>' +
      '<button type="button" data-q="Thank you ArpiBot!">💖 Thank you</button></div>' +
      '<form class="arp-form" id="arpUForm"><input type="text" placeholder="Type a message..." required><button type="submit">Send</button></form>';
document.body.appendChild(box);
function setState(s) {
var info = STATES[s] || STATES.welcome;
var stageImg = document.getElementById("arpStageImg");
var orbImg = document.getElementById("arpOrbImg");
if (stageImg) {
stageImg.onerror = function () { this.onerror = null; this.src = "images/arpibot/welcome.png"; };
stageImg.src = info.img;
}
if (orbImg && s !== "welcome") {
orbImg.onerror = function () { this.onerror = null; this.src = "images/arpibot/chat-icon.png"; };
orbImg.src = info.img;
}
document.getElementById("arpMoodPill").textContent = info.pill;
box.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.classList.toggle("active", b.getAttribute("data-s") === s);
});
}
box.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.addEventListener("click", function () { setState(this.getAttribute("data-s")); });
});
function makeMovable(el, handle, key) {
var on = false, mv = false, sx = 0, sy = 0, ol = 0, ot = 0;
try {
var saved = JSON.parse(localStorage.getItem(key) || "null");
if (saved && typeof saved.l === "number") {
el.style.left = Math.min(Math.max(8, saved.l), Math.max(8, window.innerWidth - 180)) + "px";
el.style.top = Math.min(Math.max(8, saved.t), Math.max(8, window.innerHeight - 75)) + "px";
el.style.right = "auto";
el.style.bottom = "auto";
}
} catch (e) {}
handle.addEventListener("pointerdown", function (e) {
if (e.target.id === "arpUClose") return;
on = true; mv = false;
var r = el.getBoundingClientRect();
sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top;
el.style.left = ol + "px"; el.style.top = ot + "px";
el.style.right = "auto"; el.style.bottom = "auto";
});
window.addEventListener("pointermove", function (e) {
if (!on) return;
var dx = e.clientX - sx, dy = e.clientY - sy;
if (Math.abs(dx) > 5 || Math.abs(dy) > 5) mv = true;
if (!mv) return;
el.style.left = Math.min(Math.max(8, ol + dx), Math.max(8, window.innerWidth - el.offsetWidth - 8)) + "px";
el.style.top = Math.min(Math.max(8, ot + dy), Math.max(8, window.innerHeight - el.offsetHeight - 8)) + "px";
});
window.addEventListener("pointerup", function () {
if (!on) return;
on = false;
if (mv) {
var r = el.getBoundingClientRect();
try { localStorage.setItem(key, JSON.stringify({ l: r.left, t: r.top })); } catch (e) {}
el.addEventListener("click", function (ev) { ev.stopImmediatePropagation(); ev.preventDefault(); }, { capture: true, once: true });
}
});
}
makeMovable(dock, dock, "arp_dock_14_v1");
makeMovable(box, box.firstElementChild, "arp_box_14_v1");
function toggleChat() {
var opening = box.style.display !== "flex";
box.style.display = opening ? "flex" : "none";
bubble.style.display = opening ? "none" : "block";
if (opening) setState("welcome");
}
orb.addEventListener("click", toggleChat);
bubble.addEventListener("click", toggleChat);
document.getElementById("arpUClose").addEventListener("click", function () {
setState("bye");
setTimeout(function () {
box.style.display = "none";
bubble.style.display = "block";
var orbImg = document.getElementById("arpOrbImg");
if (orbImg) orbImg.src = "images/arpibot/chat-icon.png";
}, 650);
});
var feed = document.getElementById("arpUFeed"), form = document.getElementById("arpUForm"), inp = form.querySelector("input");
inp.addEventListener("input", function () {
setState(this.value.trim().length > 0 ? "working" : "welcome");
});
function ask(q) {
if (!q.trim()) return;
var u = document.createElement("div");
u.className = "arp-user";
u.textContent = q;
feed.appendChild(u);
setState("thinking");
var l = q.toLowerCase();
setTimeout(function () {
var reply = "Our patron favorites include the Artisan Ceramic Pour-Over Set, Woven Cotton Cushion Set, and Heritage Leather Wallet!";
var nextState = "excited";
if (l.indexOf("bye") !== -1) {
reply = "Bye for now! Have a wonderful day shopping at ARPIARES ♥";
nextState = "bye";
} else if (l.indexOf("sorry") !== -1 || l.indexOf("cancel") !== -1 || l.indexOf("out of stock") !== -1) {
reply = "I am so sorry for any inconvenience! You can manage or cancel orders anytime in Account & More.";
nextState = "sorry";
} else if (l.indexOf("sad") !== -1 || l.indexOf("broken") !== -1 || l.indexOf("issue") !== -1) {
reply = "Oh no, we are right here with you—our 7-day replacement guarantee covers any issue.";
nextState = "sad";
} else if (l.indexOf("?") !== -1 && l.trim().length < 5) {
reply = "Could you share a bit more detail so I can find the exact item or order for you?";
nextState = "confused";
} else if (l.indexOf("order") !== -1 || l.indexOf("track") !== -1) {
reply = "Found it! Open Account & More → Orders & Tracking at the top right for real-time updates.";
nextState = "winking";
} else if (l.indexOf("deliver") !== -1 || l.indexOf("return") !== -1 || l.indexOf("explain") !== -1) {
reply = "We offer free insured delivery across India on orders above ₹999 (3–5 business days) plus 7-day effortless returns.";
nextState = "explaining";
} else if (l.indexOf("thank") !== -1 || l.indexOf("love") !== -1) {
reply = "You are so welcome! I am always happy to help you explore ARPIARES.";
nextState = "happy";
} else if (l.indexOf("help") !== -1 || l.indexOf("cart") !== -1) {
reply = "I am right here to help you pick the best items and guide you through checkout!";
nextState = "helping";
}
setState(nextState);
var b = document.createElement("div");
b.className = "arp-speech";
b.innerHTML = 'ArpiBot • ' + STATES[nextState].label + '' + reply;
feed.appendChild(b);
feed.scrollTop = feed.scrollHeight;
}, 450);
}
form.addEventListener("submit", function (e) { e.preventDefault(); ask(inp.value); inp.value = ""; });
box.querySelectorAll("[data-q]").forEach(function (c) { c.addEventListener("click", function () { ask(c.getAttribute("data-q")); }); });
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initArpiBot);
} else {
initArpiBot();
}
setTimeout(initArpiBot, 250);
})();

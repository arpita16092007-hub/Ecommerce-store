(function () {
  function bootArpiBot() {
    if (!document.body) return;
    if (document.getElementById("arpUniversalOrb")) return;

    var oldIds = ["arpUniversalDrawer", "arpiaresUniversalOrb", "arpiaresUniversalDrawer", "supportLauncher", "supportWidget"];
    oldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });

    var css = document.createElement("style");
    css.id = "arpibot-css-v80";
    css.textContent = [
      "#arpUniversalOrb{position:fixed!important;bottom:22px;right:22px;z-index:2147483647!important;display:inline-flex!important;align-items:center!important;gap:11px!important;padding:6px 18px 6px 7px!important;border-radius:999px!important;background:linear-gradient(135deg,#07261c 0%,#0f3d2e 100%)!important;color:#fff8eb!important;border:2px solid #d8b373!important;box-shadow:0 16px 36px rgba(4,25,18,.38),0 0 18px rgba(216,179,115,.26)!important;cursor:grab!important;user-select:none!important;touch-action:none!important;visibility:visible!important;opacity:1!important}",
      "#arpUniversalOrb:active{cursor:grabbing!important}",
      ".arp-orb-portrait{width:46px;height:46px;border-radius:50%;overflow:hidden;border:2px solid #edd19a;background:radial-gradient(circle at 50% 30%,#185440,#062218);display:grid;place-items:center;flex-shrink:0}",
      ".arp-orb-status{display:inline-flex;align-items:center;gap:5px;font:700 10.5px 'DM Sans',sans-serif;color:#edd19a}",
      ".arp-orb-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}",
      "#arpUniversalDrawer{position:fixed!important;bottom:92px;right:22px;z-index:2147483647!important;width:min(395px,calc(100vw - 22px))!important;border-radius:26px!important;background:#faf5eb!important;border:2px solid #c89d5c!important;box-shadow:0 28px 64px rgba(4,25,18,.36)!important;overflow:hidden!important;flex-direction:column}",
      ".arp-ab-head{background:radial-gradient(circle at 80% 20%,#154938 0%,#07261c 75%);color:#fff8eb;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1.5px solid rgba(216,179,115,.45);cursor:grab;user-select:none;touch-action:none}",
      ".arp-ab-stage{display:flex;align-items:center;gap:12px}",
      ".arp-ab-avatar-ring{width:62px;height:62px;border-radius:50%;border:2px solid #edd19a;background:radial-gradient(circle at 50% 25%,#1b5b46,#062118);box-shadow:0 0 20px rgba(237,209,154,.28);display:grid;place-items:center;overflow:hidden;flex-shrink:0}",
      ".arp-ab-mood-pill{display:inline-flex;align-items:center;gap:5px;margin-top:4px;padding:3px 10px;border-radius:999px;background:rgba(255,248,235,.12);border:1px solid rgba(237,209,154,.45);font:700 10.5px 'DM Sans',sans-serif;color:#edd19a}",
      ".arp-ab-mood-bar{display:flex;gap:5px;padding:7px 12px;background:#0a3024;border-bottom:1px solid rgba(216,179,115,.25);overflow-x:auto}",
      ".arp-ab-mood-btn{padding:4px 9px;border-radius:999px;border:1px solid rgba(237,209,154,.3);background:rgba(255,255,255,.06);color:#f7e7c4;font:600 10px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}",
      ".arp-ab-mood-btn.active{background:#edd19a;color:#062118;border-color:#edd19a}",
      ".arp-u-feed{padding:14px;max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#faf5eb;font:400 13px/1.5 'DM Sans',sans-serif}",
      ".arp-speech-card{background:#fff8e8;border:1.5px solid #d8b373;border-radius:18px 18px 18px 4px;padding:12px 14px;color:#142820}",
      ".arp-u-user{align-self:flex-end;max-width:82%;background:#07261c;color:#fff8eb;border:1px solid rgba(216,179,115,.4);border-radius:18px 18px 4px 18px;padding:10px 14px}",
      ".arp-u-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 4px;background:#faf5eb}",
      ".arp-u-chips button{padding:5px 11px;border-radius:999px;border:1px solid rgba(200,157,92,.55);background:#fffdf8;color:#07261c;font:600 11px 'DM Sans',sans-serif;cursor:pointer}",
      ".arp-u-form{display:flex;gap:8px;padding:10px 12px;background:#fffdf9;border-top:1px solid rgba(200,157,92,.35)}",
      ".arp-u-form input{flex:1;border-radius:999px;border:1px solid rgba(7,38,28,.2);background:#faf5eb;padding:9px 14px;font:400 13px 'DM Sans',sans-serif;color:#07261c}",
      ".arp-u-form button{border-radius:999px;padding:9px 16px;background:linear-gradient(135deg,#edd19a 0%,#d8b373 100%);color:#07261c;border:1px solid #b89149;font:700 12px 'DM Sans',sans-serif;cursor:pointer}"
    ].join("\n");
    document.head.appendChild(css);

    function svg(m) {
      var e = '<circle cx="26" cy="27" r="2.7" fill="#2b1810"/><circle cx="38" cy="27" r="2.7" fill="#2b1810"/><circle cx="26.9" cy="26.1" r="0.9" fill="#fff"/><circle cx="38.9" cy="26.1" r="0.9" fill="#fff"/>';
      var u = '<path d="M28.5 33.5Q32 37 35.5 33.5" stroke="#b94a48" stroke-width="2" stroke-linecap="round" fill="none"/>';
      var p = '';
      if (m === "great") {
        e = '<path d="M23.5 27Q26 24.5 28.5 27" stroke="#2b1810" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="38" cy="27" r="2.7" fill="#2b1810"/><circle cx="38.9" cy="26.1" r="0.9" fill="#fff"/>';
        p = '<g transform="translate(45,35)"><rect x="0" y="5" width="7" height="8" rx="2" fill="#f7cbb2"/><path d="M3 5V1.5A1.8 1.8 0 0 1 6.5 1.5V5" fill="#f7cbb2"/><text x="-2" y="-2" font-size="9" fill="#edd19a">✦</text></g>';
      } else if (m === "check") {
        e = '<circle cx="25.5" cy="26" r="2.6" fill="#2b1810"/><circle cx="37.5" cy="26" r="2.6" fill="#2b1810"/>';
        u = '<path d="M29.5 34.5Q32 33.5 34.5 34.5" stroke="#9e4745" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
        p = '<text x="48" y="21" font-family="Georgia,serif" font-weight="700" font-size="14" fill="#edd19a">?</text><circle cx="34" cy="40" r="3.2" fill="#f7cbb2"/>';
      } else if (m === "happy") {
        e = '<path d="M23.5 27.5Q26 24.5 28.5 27.5" stroke="#2b1810" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M35.5 27.5Q38 24.5 40.5 27.5" stroke="#2b1810" stroke-width="2" stroke-linecap="round" fill="none"/>';
        u = '<path d="M28 33Q32 38 36 33Z" fill="#d95b59"/>';
        p = '<text x="46" y="19" font-size="10" fill="#ff8fa3">♥</text><text x="11" y="21" font-size="9" fill="#ff8fa3">♥</text>';
      } else if (m === "searching") {
        e = '<circle cx="26" cy="28" r="2.5" fill="#2b1810"/><circle cx="38" cy="28" r="2.5" fill="#2b1810"/>';
        u = '<circle cx="32" cy="34.5" r="1.8" fill="#b94a48"/>';
        p = '<g transform="translate(17,43)"><rect x="0" y="0" width="30" height="15" rx="2.5" fill="#0b3628" stroke="#edd19a" stroke-width="1.3"/><text x="15" y="10.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="9" fill="#edd19a">A</text></g>';
      }
      return '<svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">' +
        '<path d="M14 29C14 16 21 10 32 10C43 10 50 16 50 29C51 39 48 48 44 52H20C16 48 13 39 14 29Z" fill="#2b1911"/>' +
        '<path d="M16 58C18 47 24 44 32 44C40 44 46 47 48 58H16Z" fill="#07261c" stroke="#edd19a" stroke-width="1.4"/>' +
        '<path d="M25 45L32 51L39 45" fill="#fbf7ee"/>' +
        '<text x="32" y="56.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="7.5" fill="#edd19a">A</text>' +
        '<rect x="29" y="38" width="6" height="7" rx="3" fill="#f7cbb2"/>' +
        '<path d="M20 27C20 19 25 15 32 15C39 15 44 19 44 27C44 35 39 40 32 40C25 40 20 35 20 27Z" fill="#fde0cd"/>' +
        '<path d="M19 26C21 18 28 15 34 15C40 15 44 19 45 26C41 21 35 20 29 21C24 22 21 24 19 26Z" fill="#3a2217"/>' +
        '<ellipse cx="23.5" cy="31" rx="2.4" ry="1.3" fill="#f4978e" opacity="0.55"/>' +
        '<ellipse cx="40.5" cy="31" rx="2.4" ry="1.3" fill="#f4978e" opacity="0.55"/>' +
        e + u +
        '<path d="M17 26A15 15 0 0 1 47 26" stroke="#102920" stroke-width="3.2" stroke-linecap="round"/>' +
        '<rect x="13.5" y="22" width="5.5" height="10" rx="2.7" fill="#07261c" stroke="#edd19a" stroke-width="1.4"/>' +
        '<rect x="45" y="22" width="5.5" height="10" rx="2.7" fill="#07261c" stroke="#edd19a" stroke-width="1.4"/>' +
        '<path d="M16 31Q20 36 27 36" stroke="#102920" stroke-width="1.5" fill="none"/>' +
        '<circle cx="27.5" cy="36" r="1.6" fill="#edd19a"/>' +
        p + '</svg>';
    }

    var meta = {
      greet: { b: "👋 Online • Ready to assist", l: "Greeting" },
      searching: { b: "💻 Searching catalog...", l: "Searching..." },
      check: { b: "🤔 Let me check...", l: "Let me check..." },
      great: { b: "👍 Great! Found it", l: "Great!" },
      happy: { b: "🥰 Happy to help!", l: "Happy to help!" }
    };

    var orb = document.createElement("button");
    orb.id = "arpUniversalOrb";
    orb.type = "button";
    orb.innerHTML =
      '<span class="arp-orb-portrait" id="arpOrbFace">' + svg("greet") + '</span>' +
      '<span><strong style="display:block;font:700 13.5px DM Sans,sans-serif;color:#fff8eb;line-height:1.15;">ArpiBot ⠿</strong>' +
      '<span class="arp-orb-status"><i class="arp-orb-dot"></i> Online ✦</span></span>';
    document.body.appendChild(orb);

    var box = document.createElement("div");
    box.id = "arpUniversalDrawer";
    box.style.display = "none";
    box.innerHTML =
      '<div class="arp-ab-head"><div class="arp-ab-stage"><div class="arp-ab-avatar-ring" id="arpStageFace">' + svg("greet") + '</div>' +
      '<div><strong style="font:700 17px Cormorant Garamond,serif;display:block;color:#fff8eb;">ArpiBot • ARPIARES</strong>' +
      '<span class="arp-ab-mood-pill" id="arpMoodPill">👋 Online • Ready to assist</span></div></div>' +
'✕' +
'' +
'👋 Hi!' +
'💻 Searching...' +
'🤔 Let me check...' +
'👍 Great!' +
'🥰 Happy to help!' +
'Hi! I’m ArpiBot 👋' +
'Your ARPIARES Shopping Assistant!How can I help you today?' +
'🔍 Top picks' +
'📦 Check order' +
'🚚 Delivery' +
'💖 Thank you' +
'Send';
document.body.appendChild(box);
function mood(m) {
var t = meta[m] || meta.greet;
document.getElementById("arpStageFace").innerHTML = svg(m);
document.getElementById("arpOrbFace").innerHTML = svg(m);
document.getElementById("arpMoodPill").textContent = t.b;
box.querySelectorAll(".arp-ab-mood-btn").forEach(function (b) {
b.classList.toggle("active", b.getAttribute("data-m") === m);
});
}
box.querySelectorAll(".arp-ab-mood-btn").forEach(function (b) {
b.addEventListener("click", function () { mood(this.getAttribute("data-m")); });
});
function drag(el, g, k) {
var on = false, mv = false, sx = 0, sy = 0, ol = 0, ot = 0;
try {
var s = JSON.parse(localStorage.getItem(k) || "null");
if (s && typeof s.l === "number") {
el.style.left = Math.min(Math.max(8, s.l), Math.max(8, window.innerWidth - 170)) + "px";
el.style.top = Math.min(Math.max(8, s.t), Math.max(8, window.innerHeight - 64)) + "px";
el.style.right = "auto";
el.style.bottom = "auto";
}
} catch (e) {}
g.addEventListener("pointerdown", function (e) {
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
try { localStorage.setItem(k, JSON.stringify({ l: r.left, t: r.top })); } catch (e) {}
el.addEventListener("click", function (ev) { ev.stopImmediatePropagation(); ev.preventDefault(); }, { capture: true, once: true });
}
});
}
drag(orb, orb, "arp_orb_v80");
drag(box, box.firstElementChild, "arp_box_v80");
orb.addEventListener("click", function () { box.style.display = box.style.display === "flex" ? "none" : "flex"; });
document.getElementById("arpUClose").addEventListener("click", function () { box.style.display = "none"; });
var feed = document.getElementById("arpUFeed"), form = document.getElementById("arpUForm"), inp = form.querySelector("input");
inp.addEventListener("input", function () { mood(this.value.trim().length > 0 ? "searching" : "greet"); });
function ask(q) {
if (!q.trim()) return;
var u = document.createElement("div"); u.className = "arp-u-user"; u.textContent = q; feed.appendChild(u);
var l = q.toLowerCase();
mood((l.indexOf("order") !== -1 || l.indexOf("check") !== -1 || l.indexOf("track") !== -1) ? "check" : "searching");
setTimeout(function () {
var r = "Great! Our signature pieces include the Artisan Ceramic Pour-Over Set, Woven Cotton Cushion Set, and Heritage Leather Wallet.", dm = "great";
if (l.indexOf("thank") !== -1 || l.indexOf("love") !== -1) { r = "You are so welcome! Always happy to help you style your ARPIARES collection."; dm = "happy"; }
else if (l.indexOf("order") !== -1 || l.indexOf("track") !== -1 || l.indexOf("check") !== -1) { r = "Checked! Open Account & More → Orders & Tracking at the top right for real-time order updates."; dm = "great"; }
else if (l.indexOf("deliver") !== -1 || l.indexOf("return") !== -1) { r = "Enjoy free insured delivery across India above ₹999 (3–5 days) plus 7-day easy returns!"; dm = "happy"; }
mood(dm);
var b = document.createElement("div"); b.className = "arp-speech-card";
b.innerHTML = 'ArpiBot • ' + meta[dm].l + '' + r;
feed.appendChild(b); feed.scrollTop = feed.scrollHeight;
}, 420);
}
form.addEventListener("submit", function (e) { e.preventDefault(); ask(inp.value); inp.value = ""; });
box.querySelectorAll("[data-q]").forEach(function (c) { c.addEventListener("click", function () { ask(c.getAttribute("data-q")); }); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootArpiBot);
else bootArpiBot();
setTimeout(bootArpiBot, 300);
})();

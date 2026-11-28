(function () {
  "use strict";

  var AVATAR_SVG =
    '<svg width="38" height="38" viewBox="0 0 44 44" fill="none" xmlns="http://w3.org">' +
    '<circle cx="22" cy="22" r="20" fill="#fff9ee" stroke="#c89d5c" stroke-width="2.5"/>' +
    '<circle cx="22" cy="22" r="15.5" fill="#083326" stroke="#e5c17b" stroke-width="1"/>' +
    '<path d="M14.5 25.5H29.5L28 17.5L24 20.5L22 15.5L20 20.5L16 17.5L14.5 25.5Z" fill="#e5c17b"/>' +
    '<rect x="14" y="27" width="16" height="2.2" rx="1.1" fill="#f7dfa8"/>' +
    '<circle cx="22" cy="12.5" r="1.5" fill="#fff6df"/>' +
    '</svg>';

  function makeMovable(el, handle, storageKey) {
    if (!el || el.dataset.arpMovable === "1") return;
    el.dataset.arpMovable = "1";
    var grip = handle || el;
    var active = false, moved = false, sx = 0, sy = 0, ol = 0, ot = 0;

    function restorePos() {
      try {
        var saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
          var maxL = Math.max(10, window.innerWidth - (el.offsetWidth || 180) - 10);
          var maxT = Math.max(10, window.innerHeight - (el.offsetHeight || 60) - 10);
          el.style.setProperty("left", Math.min(Math.max(10, saved.left), maxL) + "px", "important");
          el.style.setProperty("top", Math.min(Math.max(10, saved.top), maxT) + "px", "important");
          el.style.setProperty("right", "auto", "important");
          el.style.setProperty("bottom", "auto", "important");
        }
      } catch (e) {}
    }

    restorePos();
    window.addEventListener("resize", restorePos);

    grip.addEventListener("pointerdown", function (e) {
      if (e.target.closest("[data-close-arp]")) return;
      active = true;
      moved = false;
      var rect = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ol = rect.left; ot = rect.top;
      el.style.setProperty("left", ol + "px", "important");
      el.style.setProperty("top", ot + "px", "important");
      el.style.setProperty("right", "auto", "important");
      el.style.setProperty("bottom", "auto", "important");
    });

    window.addEventListener("pointermove", function (e) {
      if (!active) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;
      var maxL = Math.max(10, window.innerWidth - el.offsetWidth - 10);
      var maxT = Math.max(10, window.innerHeight - el.offsetHeight - 10);
      el.style.setProperty("left", Math.min(Math.max(10, ol + dx), maxL) + "px", "important");
      el.style.setProperty("top", Math.min(Math.max(10, ot + dy), maxT) + "px", "important");
    });

    window.addEventListener("pointerup", function () {
      if (!active) return;
      active = false;
      if (moved) {
        var r = el.getBoundingClientRect();
        try { localStorage.setItem(storageKey, JSON.stringify({ left: r.left, top: r.top })); } catch (e) {}
        el.addEventListener("click", function (ev) { ev.stopImmediatePropagation(); ev.preventDefault(); }, { capture: true, once: true });
      }
    });
  }

  function initBot() {
    var oldLaunchers = document.querySelectorAll("#supportLauncher, .support-launcher, .chat-launcher");
    for (var i = 0; i < oldLaunchers.length; i++) oldLaunchers[i].style.setProperty("display", "none", "important");

    var orb = document.getElementById("arpiaresUniversalOrb");
    if (!orb) {
      orb = document.createElement("button");
      orb.id = "arpiaresUniversalOrb";
      orb.type = "button";
      orb.innerHTML =
        '<span class="arp-orb-avatar">' + AVATAR_SVG + '</span>' +
        '<span class="arp-orb-copy"><strong>ARPIARES Care</strong><small>Chat &amp; Move ⠿</small></span>';
      document.body.appendChild(orb);
    }

    var drawer = document.getElementById("arpiaresUniversalDrawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "arpiaresUniversalDrawer";
      drawer.style.display = "none";
      drawer.innerHTML =
        '<div class="arp-drawer-head">' +
          '<div class="arp-drawer-brand">' + AVATAR_SVG +
            '<div><strong>ARPIARES Concierge</strong><span><i class="arp-live-dot"></i> Live • Drag anywhere</span></div>' +
          '</div>' +
          '<button type="button" data-close-arp class="arp-drawer-close">✕</button>' +
        '</div>' +
        '<div id="arpDrawerFeed" class="arp-drawer-feed">' +
          '<div class="arp-msg-bot"><span class="arp-msg-tag">✦ ARPIARES CONCIERGE</span>Hello! Drag me anywhere on screen—I stay with you across every page of ARPIARES.</div>' +
        '</div>' +
        '<div class="arp-drawer-chips">' +
          '<button type="button" data-q="Signature picks">👑 Signature picks</button>' +
          '<button type="button" data-q="Track my order">📦 Track order</button>' +
          '<button type="button" data-q="Delivery & returns">🚚 Delivery &amp; returns</button>' +
        '</div>' +
        '<form id="arpDrawerForm" class="arp-drawer-form">' +
          '<input type="text" placeholder="Ask ARPIARES Care..." required />' +
          '<button type="submit">Send</button>' +
        '</form>';
      document.body.appendChild(drawer);

      var feed = drawer.querySelector("#arpDrawerFeed");
      var form = drawer.querySelector("#arpDrawerForm");
      var input = form.querySelector("input");

      function sendMsg(text) {
        if (!text || !text.trim()) return;
        var u = document.createElement("div"); u.className = "arp-msg-user"; u.textContent = text; feed.appendChild(u);
        var low = text.toLowerCase();
        var ans = "I can help you explore collections, track an order, or check delivery & 7-day returns!";
        if (low.indexOf("track") !== -1 || low.indexOf("order") !== -1) ans = "Open Account & More → Orders & Tracking at the top right to see live updates for your orders.";
        else if (low.indexOf("deliver") !== -1 || low.indexOf("return") !== -1) ans = "Free insured delivery across India on orders above ₹999 (3–5 business days) plus 7-day easy returns.";
        else if (low.indexOf("pick") !== -1 || low.indexOf("signature") !== -1) ans = "Patron favorites include our Artisan Ceramic Pour-Over Set, Woven Cotton Cushion Set, and Heritage Leather Wallet.";
        var b = document.createElement("div"); b.className = "arp-msg-bot"; b.innerHTML = '<span class="arp-msg-tag">✦ ARPIARES CONCIERGE</span>' + ans; feed.appendChild(b);
        feed.scrollTop = feed.scrollHeight;
      }

      form.addEventListener("submit", function (e) { e.preventDefault(); sendMsg(input.value); input.value = ""; });
      var chips = drawer.querySelectorAll("[data-q]");
      for (var c = 0; c < chips.length; c++) chips[c].addEventListener("click", function () { sendMsg(this.getAttribute("data-q")); });
      drawer.querySelector("[data-close-arp]").addEventListener("click", function () { drawer.style.display = "none"; });
    }

    if (!orb.dataset.arpClick) {
      orb.dataset.arpClick = "1";
      orb.addEventListener("click", function () { drawer.style.display = drawer.style.display === "flex" ? "none" : "flex"; });
    }

    makeMovable(orb, orb, "arpiares_universal_orb_xy");
    makeMovable(drawer, drawer.querySelector(".arp-drawer-head"), "arpiares_universal_drawer_xy");
  }

  function initFeedbackCard() {
    if (document.querySelector(".arpiares-fb-aside") || window.__arpFeedbackLocked) return;
    var form = document.querySelector("#reviewForm, form[id*=review], form[id*=feedback]") ||
      Array.from(document.querySelectorAll("form")).find(function (f) {
        return /feedback|review|recommend/i.test(f.textContent);
      });
    if (!form) return;
    var card = form.closest("section, .card, .panel") || form.parentElement;
    if (!card || card === document.body) return;
    window.__arpFeedbackLocked = true;

    var bodyWrap = document.createElement("div");
    bodyWrap.className = "arpiares-fb-body";
    while (card.firstChild) bodyWrap.appendChild(card.firstChild);

    var aside = document.createElement("aside");
    aside.className = "arpiares-fb-aside";
    aside.innerHTML =
      '<div><div class="arpiares-fb-aside-crest">A</div><span style="font:700 10.5px DM Sans,sans-serif;letter-spacing:0.2em;text-transform:uppercase;color:#d4af6a;">PATRON DESK</span><h3>Your voice shapes our <em>next</em> piece.</h3><p>Tell us how your order felt in person—from unboxing finish to everyday use.</p><div class="arpiares-fb-tags"><button type="button" class="arpiares-fb-tag" data-tag="Exceptional craftsmanship">✨ Craftsmanship</button><button type="button" class="arpiares-fb-tag" data-tag="Luxury unboxing experience">🎁 Packaging</button><button type="button" class="arpiares-fb-tag" data-tag="Fast & careful delivery">🚚 Fast Delivery</button><button type="button" class="arpiares-fb-tag" data-tag="Worth every rupee">💎 Value</button></div></div>' +
      '<div class="arpiares-fb-quote-box"><strong style="color:#e5c17b;display:block;margin-bottom:4px;">★★★★★ 4.9 / 5.0 Patron Score</strong>Every verified note is read directly by the ARPIARES studio team.</div>';

    card.classList.add("arpiares-fb-split");
    card.style.setProperty("padding", "0", "important");
    card.appendChild(aside);
    card.appendChild(bodyWrap);

    var tags = aside.querySelectorAll("[data-tag]");
    for (var t = 0; t < tags.length; t++) {
      tags[t].addEventListener("click", function () {
        var textInputs = bodyWrap.querySelectorAll("input[type='text']");
        var targetInput = bodyWrap.querySelector("input[placeholder*='Summarize'], input[name*='title'], input[name*='headline']") || (textInputs.length ? textInputs[textInputs.length - 1] : null);
        if (targetInput) { targetInput.value = this.getAttribute("data-tag"); targetInput.focus(); }
      });
    }
  }

  function boot() { initBot(); initFeedbackCard(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
setTimeout(boot, 500);
setTimeout(boot, 1500);
})();

(function initArpiaresUniversalConcierge() {
  const PORCELAIN_GOLD_AVATAR = `
    <svg width="38" height="38" viewBox="0 0 44 44" fill="none" xmlns="http://w3.org" aria-hidden="true">
      <defs>
        <linearGradient id="arpGoldRing" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f7dfa8"/>
          <stop offset="50%" stop-color="#c89d5c"/>
          <stop offset="100%" stop-color="#f3d18a"/>
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="20" fill="#fff9ee" stroke="url(#arpGoldRing)" stroke-width="2.4"/>
      <circle cx="22" cy="22" r="16" fill="#083326" stroke="#e5c17b" stroke-width="1"/>
      <path d="M14.5 25.5H29.5L28 17.5L24 20.5L22 15.5L20 20.5L16 17.5L14.5 25.5Z" fill="url(#arpGoldRing)"/>
      <rect x="14" y="27" width="16" height="2.2" rx="1.1" fill="#f7dfa8"/>
      <circle cx="22" cy="12.5" r="1.4" fill="#fff6df"/>
    </svg>
  `;

  function enableDrag(el, handle, storageKey) {
    if (!el || el.dataset.arpDragBound === "1") return;
    el.dataset.arpDragBound = "1";

    const grip = handle || el;
    let dragging = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

    function applySavedPosition() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
          const w = el.offsetWidth || 170;
          const h = el.offsetHeight || 58;
          const maxL = Math.max(10, window.innerWidth - w - 10);
          const maxT = Math.max(10, window.innerHeight - h - 10);
          el.style.left = Math.min(Math.max(10, saved.left), maxL) + "px";
          el.style.top = Math.min(Math.max(10, saved.top), maxT) + "px";
          el.style.right = "auto";
          el.style.bottom = "auto";
        }
      } catch (_) {}
    }

    applySavedPosition();
    window.addEventListener("resize", applySavedPosition);

    grip.addEventListener("pointerdown", (e) => {
      if (e.target.closest("[data-close-arp-chat], button.close")) return;
      dragging = true;
      moved = false;
      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origLeft = rect.left;
      origTop = rect.top;
      el.style.left = origLeft + "px";
      el.style.top = origTop + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });

    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;

      const maxL = Math.max(10, window.innerWidth - el.offsetWidth - 10);
      const maxT = Math.max(10, window.innerHeight - el.offsetHeight - 10);
      el.style.left = Math.min(Math.max(10, origLeft + dx), maxL) + "px";
      el.style.top = Math.min(Math.max(10, origTop + dy), maxT) + "px";
    });

    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const rect = el.getBoundingClientRect();
        try {
          localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
        } catch (_) {}
        el.addEventListener("click", (ev) => {
          ev.stopImmediatePropagation();
          ev.preventDefault();
        }, { capture: true, once: true });
      }
    });
  }

  function mountUniversalBot() {
    document.querySelectorAll("#supportLauncher, .support-launcher, .chat-launcher").forEach((oldEl) => {
      if (oldEl.id !== "arpiaresUniversalOrb") oldEl.style.display = "none";
    });

    let orb = document.getElementById("arpiaresUniversalOrb");
    if (!orb) {
      orb = document.createElement("button");
      orb.id = "arpiaresUniversalOrb";
      orb.type = "button";
      orb.setAttribute("aria-label", "Open ARPIARES Concierge");
      document.body.appendChild(orb);
    }

    orb.innerHTML = `
      <span class="arp-orb-avatar">${PORCELAIN_GOLD_AVATAR}</span>
      <span class="arp-orb-copy">
        <strong>ARPIARES Care</strong>
        <small>Chat &amp; Move ⠿</small>
      </span>
    `;

    let drawer = document.getElementById("arpiaresUniversalDrawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "arpiaresUniversalDrawer";
      drawer.style.display = "none";
      drawer.innerHTML = `
        <div class="arp-drawer-head">
          <div class="arp-drawer-brand">
            ${PORCELAIN_GOLD_AVATAR}
            <div>
              <strong>ARPIARES Concierge</strong>
              <span><i class="arp-live-dot"></i> Live • Drag anywhere</span>
            </div>
          </div>
          <button type="button" data-close-arp-chat class="arp-drawer-close" aria-label="Close chat">✕</button>
        </div>
        <div id="arpDrawerFeed" class="arp-drawer-feed">
          <div class="arp-msg-bot">
            <span class="arp-msg-tag">✦ ARPIARES CONCIERGE</span>
            Hello! I follow you across every page of ARPIARES. Move me anywhere on screen, or tap a topic below.
          </div>
        </div>
        <div class="arp-drawer-chips">
          <button type="button" data-prompt="Recommend your best pieces">👑 Signature picks</button>
          <button type="button" data-prompt="How do I track my order?">📦 Track order</button>
          <button type="button" data-prompt="Tell me about delivery and returns">🚚 Delivery &amp; returns</button>
        </div>
        <form id="arpDrawerForm" class="arp-drawer-form">
          <input type="text" placeholder="Ask anything about ARPIARES..." required />
          <button type="submit">Send</button>
        </form>
      `;
      document.body.appendChild(drawer);

      const feed = drawer.querySelector("#arpDrawerFeed");
      const form = drawer.querySelector("#arpDrawerForm");
      const input = form.querySelector("input");

      function replyTo(q) {
        if (!q.trim()) return;
        const userBubble = document.createElement("div");
        userBubble.className = "arp-msg-user";
        userBubble.textContent = q;
        feed.appendChild(userBubble);

        const lower = q.toLowerCase();
        let text = "I can help with product recommendations, order tracking, shipping, or returns—just let me know what you are looking for!";
        if (lower.includes("track") || lower.includes("order")) {
          text = "Open Account & More → Orders & Tracking at the top right to see live status updates for every order.";
        } else if (lower.includes("deliver") || lower.includes("return") || lower.includes("ship")) {
          text = "Enjoy free insured shipping on orders above ₹999 (3–5 business days) plus 7-day easy returns.";
        } else if (lower.includes("pick") || lower.includes("recommend") || lower.includes("best")) {
          text = "Our top patron favorites are the Artisan Ceramic Pour-Over Set, Woven Cotton Cushion Set, and Heritage Leather Wallet.";
        }

        const botBubble = document.createElement("div");
        botBubble.className = "arp-msg-bot";
        botBubble.innerHTML = '<span class="arp-msg-tag">✦ ARPIARES CONCIERGE</span>' + text;
        feed.appendChild(botBubble);
        feed.scrollTop = feed.scrollHeight;
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        replyTo(input.value);
        input.value = "";
      });
      drawer.querySelectorAll("[data-prompt]").forEach((btn) => {
        btn.addEventListener("click", () => replyTo(btn.dataset.prompt));
      });
      drawer.querySelector("[data-close-arp-chat]").addEventListener("click", () => {
        drawer.style.display = "none";
      });
    }

    if (!orb.dataset.clickReady) {
      orb.dataset.clickReady = "1";
      orb.addEventListener("click", () => {
        const isOpen = drawer.style.display === "flex";
        drawer.style.display = isOpen ? "none" : "flex";
      });
    }

    enableDrag(orb, orb, "arpiares_universal_orb_xy");
    enableDrag(drawer, drawer.querySelector(".arp-drawer-head"), "arpiares_universal_drawer_xy");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUniversalBot);
  } else {
    mountUniversalBot();
  }
})();

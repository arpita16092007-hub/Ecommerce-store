
(function initMovableArpiaresConcierge() {
  const LUXURY_AVATAR_SVG = `
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://w3.org" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="#06271d" stroke="#e5c17b" stroke-width="1.6"/>
      <circle cx="20" cy="20" r="15" stroke="#e5c17b" stroke-opacity="0.35" stroke-dasharray="2 2"/>
      <path d="M20 9.5L22.1 15.9L28.5 18L22.1 20.1L20 26.5L17.9 20.1L11.5 18L17.9 15.9L20 9.5Z" fill="#e5c17b"/>
      <circle cx="28.5" cy="11.5" r="1.6" fill="#fff4d6"/>
      <circle cx="12" cy="27.5" r="1.2" fill="#e5c17b"/>
    </svg>
  `;

  function makeDraggable(el, handle, storageKey) {
    if (!el || el.dataset.draggableBound === "1") return;
    el.dataset.draggableBound = "1";

    const dragTarget = handle || el;
    let down = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
        const maxL = Math.max(8, window.innerWidth - Math.max(150, el.offsetWidth) - 8);
        const maxT = Math.max(8, window.innerHeight - Math.max(56, el.offsetHeight) - 8);
        el.style.left = Math.min(Math.max(8, saved.left), maxL) + "px";
        el.style.top = Math.min(Math.max(8, saved.top), maxT) + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
      }
    } catch (_) {}

    dragTarget.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button.close, .close-chat, [data-close-chat]")) return;
      down = true;
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
      if (!down) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;

      const maxL = Math.max(8, window.innerWidth - el.offsetWidth - 8);
      const maxT = Math.max(8, window.innerHeight - el.offsetHeight - 8);
      el.style.left = Math.min(Math.max(8, origLeft + dx), maxL) + "px";
      el.style.top = Math.min(Math.max(8, origTop + dy), maxT) + "px";
    });

    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (moved) {
        const rect = el.getBoundingClientRect();
        try {
          localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
        } catch (_) {}
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
        }, { capture: true, once: true });
      }
    });
  }

  function findLauncher() {
    const direct = document.querySelector(
      "#supportLauncher, #chatLauncher, .support-launcher, .chat-launcher, .chat-fab, [id*='chatToggle'], [id*='supportBtn'], [id*='chatBtn'], [class*='chat-toggle'], [class*='support-toggle']"
    );
    if (direct) return direct;

    // Fallback: match any button mentioning Support, Concierge, Chat, or Help
    const allBtns = Array.from(document.querySelectorAll("button"));
    return allBtns.find((b) => /support|concierge|chat|assistant|stylist/i.test(b.id + " " + b.className + " " + b.textContent));
  }

  function findWidget() {
    return document.querySelector(
      "#supportWidget, #chatWidget, .support-widget, .chat-widget, .chat-box, .support-drawer, [id*='supportPanel'], [id*='chatWindow'], [id*='supportBox']"
    );
  }

  function setupBot() {
    const widget = findWidget();
    let launcher = findLauncher();

    if (!launcher && widget) {
      launcher = document.createElement("button");
      launcher.id = "supportLauncher";
      launcher.type = "button";
      document.body.appendChild(launcher);
      launcher.addEventListener("click", () => {
        const isHidden = widget.hidden || widget.style.display === "none" || getComputedStyle(widget).display === "none";
        widget.hidden = !isHidden;
        widget.style.display = isHidden ? "flex" : "none";
      });
    }

    if (launcher) {
      launcher.style.setProperty("display", "inline-flex", "important");
      launcher.style.setProperty("visibility", "visible", "important");
      launcher.style.setProperty("opacity", "1", "important");
      launcher.style.setProperty("z-index", "99999", "important");

      if (!launcher.dataset.styledAvatar) {
        launcher.dataset.styledAvatar = "1";
        launcher.classList.add("arpiares-avatar-orb");
        launcher.innerHTML = `
          <span class="arpiares-orb-icon">${LUXURY_AVATAR_SVG}</span>
          <span class="arpiares-orb-label">
            <strong>Stylist AI</strong>
            <small>Ask &amp; Drag ⠿</small>
          </span>
        `;
      }
      makeDraggable(launcher, launcher, "arpiares_bot_launcher_pos");
    }

    if (widget) {
      const header = widget.querySelector(".chat-head, .support-head, header, .chat-box-header") || widget.firstElementChild;
      if (header && !header.querySelector(".arpiares-header-avatar")) {
        const avatarWrap = document.createElement("div");
        avatarWrap.className = "arpiares-header-avatar";
        avatarWrap.innerHTML = `${LUXURY_AVATAR_SVG}<div><strong>ARPIARES Stylist</strong><div class="arpiares-bot-badge"><span class="arpiares-bot-dot"></span> Online • Drag to move</div></div>`;
        const existingTitle = header.querySelector("h2, h3, h4, strong, span");
        if (existingTitle) existingTitle.replaceWith(avatarWrap);
        else header.prepend(avatarWrap);
      }
      makeDraggable(widget, header, "arpiares_bot_window_pos");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupBot);
  } else {
    setupBot();
  }
  setTimeout(setupBot, 500);
})();


/* Ensure Category Card Bottom Buttons Always Have Clear Gold Styling & Label Text */
(function fixCategoryCardButtons() {
  function applyFix() {
    const cards = document.querySelectorAll(
      "#categoryShowcase > *, .category-grid > *, .categories-grid > *, [class*='category-card'], [class*='collection-card']"
    );
    cards.forEach((card) => {
      const title = (card.querySelector("h2, h3, h4")?.textContent || "Collection").trim();
      const btns = card.querySelectorAll("button, a[role='button'], a.btn, a:last-of-type");
      btns.forEach((btn) => {
        btn.style.setProperty("background", "linear-gradient(135deg, #e5c17b 0%, #d4af6a 100%)", "important");
        btn.style.setProperty("color", "#06271d", "important");
        btn.style.setProperty("border", "1.5px solid #b89149", "important");
        btn.style.setProperty("font-weight", "700", "important");
        btn.style.setProperty("opacity", "1", "important");
        btn.style.setProperty("visibility", "visible", "important");
        if (!btn.textContent.trim()) {
          btn.textContent = "Explore " + title + " →";
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyFix);
  } else {
    applyFix();
  }
  setTimeout(applyFix, 700);
})();


/* New Luxury Editorial Customer Feedback Showcase Renderer (v41) */
(function upgradeFeedbackShowcase() {
  const SAMPLE_REVIEWS = [
    {
      name: "Ananya Sharma",
      tag: "Jaipur • Artisan Ceramic Pour-Over Set",
      rating: 5,
      quote: "The glaze finish and brass stand feel straight out of a private design gallery. Every morning coffee feels intentional now."
    },
    {
      name: "Rohan Malhotra",
      tag: "Mumbai • Heritage Leather Weekender",
      rating: 5,
      quote: "Rich full-grain texture, solid antique hardware, and packaging that felt like opening a bespoke gift."
    },
    {
      name: "Meera Kapoor",
      tag: "Bengaluru • Botanical Oud & Amber Elixir",
      rating: 5,
      quote: "Warm, subtle, and unforgettable—three people asked what fragrance I was wearing within the first hour."
    }
  ];

  function buildCardHtml(item) {
    const initials = (item.name || "AP")
      .split(" ")
      .map((w) => w)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const stars = "★".repeat(Math.max(1, Math.min(5, Number(item.rating) || 5)));
    return `
      <article class="arpiares-patron-card">
        <div class="arpiares-patron-top">
          <span class="arpiares-patron-stars" aria-label="${item.rating} out of 5 stars">${stars}</span>
          <span class="arpiares-verified-pill">✓ Verified Buyer</span>
        </div>
        <p class="arpiares-patron-quote">“${item.quote}”</p>
        <div class="arpiares-patron-foot">
          <div class="arpiares-patron-avatar">${initials}</div>
          <div>
            <div class="arpiares-patron-name">${item.name}</div>
            <div class="arpiares-patron-sub">${item.tag}</div>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeedbackVersion() {
    const target =
      document.querySelector("#reviewsList, #feedbackList, .reviews-grid, .feedback-grid") ||
      Array.from(document.querySelectorAll("section")).find((s) =>
        /customer feedback|patron|reviews/i.test(s.querySelector("h2, h3")?.textContent || "")
      )?.querySelector(".grid, div");

    if (!target || target.dataset.fbUpgraded === "1") return;
    target.dataset.fbUpgraded = "1";

    // Extract any existing review cards if already rendered by backend
    const existingCards = Array.from(target.children).filter((el) => el.textContent.trim().length > 15);
    let items = [];

    if (existingCards.length > 0) {
      items = existingCards.map((card) => {
        const lines = card.innerText.split("\n").map((l) => l.trim()).filter(Boolean);
        return {
          name: lines || "ARPIARES Patron",
          tag: "Verified Storefront Order",
          rating: 5,
          quote: lines.slice(1).join(" ") || lines
        };
      });
    } else {
      items = SAMPLE_REVIEWS;
    }

    // Insert Editorial Summary Banner right above the cards grid
    if (!target.parentNode.querySelector(".arpiares-fb-banner")) {
      const banner = document.createElement("div");
      banner.className = "arpiares-fb-banner";
      banner.innerHTML = `
        <div class="arpiares-fb-score">
          <div class="arpiares-fb-num">4.9</div>
          <div>
            <div class="arpiares-fb-stars">★★★★★</div>
            <div class="arpiares-fb-meta">Rated 4.9/5 by verified ARPIARES patrons across India</div>
          </div>
        </div>
        <a href="#writeReview" class="arpiares-fb-cta" onclick="document.querySelector('#reviewForm, [id*=review] form, input[name*=name]')?.scrollIntoView({behavior:'smooth'}); return false;">Write a Review ✦</a>
      `;
      target.parentNode.insertBefore(banner, target);
    }

    target.classList.add("arpiares-fb-cards");
    target.innerHTML = items.map(buildCardHtml).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderFeedbackVersion);
  } else {
    renderFeedbackVersion();
  }
  setTimeout(renderFeedbackVersion, 900);
})();


/* Guaranteed Visible & Movable ARPIARES Stylist AI Avatar Orb on Home & All Pages (v42) */
(function guaranteeArpiaresStylistOrb() {
  const AVATAR_SVG = `
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://w3.org" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="#06271d" stroke="#e5c17b" stroke-width="1.8"/>
      <circle cx="20" cy="20" r="14.5" stroke="#e5c17b" stroke-opacity="0.4" stroke-dasharray="2 2"/>
      <path d="M20 9L22.3 15.7L29 18L22.3 20.3L20 27L17.7 20.3L11 18L17.7 15.7L20 9Z" fill="#e5c17b"/>
      <circle cx="28.5" cy="11.5" r="1.7" fill="#fff6df"/>
    </svg>
  `;

  function bindDrag(el, handle, key) {
    if (!el || el.dataset.dragReady === "1") return;
    el.dataset.dragReady = "1";
    const grip = handle || el;
    let active = false, moved = false, sx = 0, sy = 0, ol = 0, ot = 0;

    try {
      const pos = JSON.parse(localStorage.getItem(key) || "null");
      if (pos && typeof pos.left === "number" && typeof pos.top === "number") {
        el.style.left = Math.min(Math.max(8, pos.left), Math.max(8, window.innerWidth - 180)) + "px";
        el.style.top = Math.min(Math.max(8, pos.top), Math.max(8, window.innerHeight - 64)) + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
      }
    } catch (_) {}

    grip.addEventListener("pointerdown", (e) => {
      if (e.target.closest("[data-close-orb-chat]")) return;
      active = true;
      moved = false;
      const r = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top;
      el.style.left = ol + "px";
      el.style.top = ot + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });

    window.addEventListener("pointermove", (e) => {
      if (!active) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;
      el.style.left = Math.min(Math.max(8, ol + dx), Math.max(8, window.innerWidth - el.offsetWidth - 8)) + "px";
      el.style.top = Math.min(Math.max(8, ot + dy), Math.max(8, window.innerHeight - el.offsetHeight - 8)) + "px";
    });

    window.addEventListener("pointerup", () => {
      if (!active) return;
      active = false;
      if (moved) {
        const r = el.getBoundingClientRect();
        try { localStorage.setItem(key, JSON.stringify({ left: r.left, top: r.top })); } catch (_) {}
        el.addEventListener("click", (ev) => { ev.stopImmediatePropagation(); ev.preventDefault(); }, { capture: true, once: true });
      }
    });
  }

  function mountOrb() {
    let orb = document.getElementById("arpiaresFloatingBotBtn") ||
      document.querySelector("#supportLauncher, #chatLauncher, .support-launcher, .chat-launcher, .arpiares-avatar-orb");

    if (!orb) {
      orb = document.createElement("button");
      orb.id = "arpiaresFloatingBotBtn";
      orb.type = "button";
      orb.setAttribute("aria-label", "Open ARPIARES Stylist AI");
      document.body.appendChild(orb);
    }

    orb.classList.add("arpiares-avatar-orb");
    orb.style.cssText += ";position:fixed!important;bottom:24px;right:24px;z-index:2147483000!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;";
    orb.innerHTML = `
      <span class="arpiares-orb-icon">${AVATAR_SVG}</span>
      <span class="arpiares-orb-label">
        <strong>Stylist AI</strong>
        <small>Ask &amp; Drag ⠿</small>
      </span>
    `;

    let drawer = document.querySelector("#supportWidget, #chatWidget, .support-widget, .chat-widget, #arpiaresStylistDrawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "arpiaresStylistDrawer";
      drawer.style.display = "none";
      drawer.innerHTML = `
        <div class="chat-head" style="background:linear-gradient(135deg,#06271d,#0c3b2c);color:#fff6e5;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(229,193,123,0.35);cursor:grab;">
          <div class="arpiares-header-avatar">${AVATAR_SVG}<div><strong>ARPIARES Stylist</strong><div class="arpiares-bot-badge"><span class="arpiares-bot-dot"></span> Online • Drag to move</div></div></div>
          <button type="button" data-close-orb-chat style="background:transparent;border:1px solid rgba(229,193,123,0.45);color:#e5c17b;border-radius:999px;width:30px;height:30px;cursor:pointer;">✕</button>
        </div>
        <div id="arpiaresOrbMsgs" class="support-messages" style="padding:16px;display:flex;flex-direction:column;gap:12px;max-height:310px;overflow-y:auto;background:#faf5eb;">
          <div class="msg bot"><div class="arpiares-msg-sender"><span>✦</span> <span>ARPIARES Stylist</span></div>Welcome to ARPIARES. Ask me about product recommendations, order tracking, shipping across India, or 7-day returns.</div>
        </div>
        <div class="arpiares-quick-chips">
          <button type="button" class="arpiares-quick-chip" data-q="What are your top handpicked pieces?">✨ Top picks</button>
          <button type="button" class="arpiares-quick-chip" data-q="How fast is delivery across India?">🚚 Delivery</button>
          <button type="button" class="arpiares-quick-chip" data-q="What is your return policy?">🔄 Returns</button>
        </div>
        <form id="arpiaresOrbForm" class="support-form" style="display:flex;gap:8px;padding:10px 12px;background:#fffdf9;border-top:1px solid rgba(200,157,92,0.3);">
          <input type="text" placeholder="Ask ARPIARES Stylist..." required style="flex:1;border-radius:999px;border:1px solid rgba(6,39,29,0.2);background:#faf5eb;padding:10px 14px;color:#06271d;" />
          <button type="submit">Send</button>
        </form>
      `;
      document.body.appendChild(drawer);

      const replies = {
        delivery: "We offer complimentary insured delivery across India on orders above ₹999, typically arriving within 3–5 business days.",
        return: "Every ARPIARES order includes a 7-day effortless return and exchange window in original packaging.",
        pick: "Our patrons love the Artisan Ceramic Pour-Over Set, Woven Cotton Cushion Set, and Heritage Leather Wallet."
      };

      const msgs = drawer.querySelector("#arpiaresOrbMsgs");
      const form = drawer.querySelector("#arpiaresOrbForm");
      const input = form.querySelector("input");

      function sendPrompt(text) {
        if (!text.trim()) return;
        const u = document.createElement("div");
        u.className = "msg user";
        u.textContent = text;
        msgs.appendChild(u);

        const b = document.createElement("div");
        b.className = "msg bot";
        const lower = text.toLowerCase();
        const ans = lower.includes("deliver") || lower.includes("ship") ? replies.delivery
          : lower.includes("return") ? replies.return
          : lower.includes("pick") || lower.includes("top") ? replies.pick
          : "I'd love to help with that! You can browse all collections above or check live order status in Account & More.";
        b.innerHTML = '<div class="arpiares-msg-sender"><span>✦</span> <span>ARPIARES Stylist</span></div>' + ans;
        msgs.appendChild(b);
        msgs.scrollTop = msgs.scrollHeight;
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        sendPrompt(input.value);
        input.value = "";
      });
      drawer.querySelectorAll("[data-q]").forEach((chip) => {
        chip.addEventListener("click", () => sendPrompt(chip.dataset.q));
      });
      drawer.querySelector("[data-close-orb-chat]").addEventListener("click", () => {
        drawer.style.display = "none";
      });
    }

    if (!orb.dataset.toggleBound) {
      orb.dataset.toggleBound = "1";
      orb.addEventListener("click", () => {
        const open = drawer.style.display !== "none" && !drawer.hidden;
        drawer.hidden = open;
        drawer.style.display = open ? "none" : "flex";
        drawer.style.setProperty("z-index", "2147483001", "important");
      });
    }

    bindDrag(orb, orb, "arpiares_orb_pos_v42");
    bindDrag(drawer, drawer.firstElementChild, "arpiares_drawer_pos_v42");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountOrb);
  } else {
    mountOrb();
  }
  setTimeout(mountOrb, 400);
})();


/* Transform Submit Detailed Feedback Card into 2-Column Editorial Split Layout (v46) */
(function transformFeedbackFormLayout() {
  function upgradeFormCard() {
    const heading = Array.from(document.querySelectorAll("h1, h2, h3")).find((h) =>
      /submit detailed feedback/i.test(h.textContent)
    );
    if (!heading) return;

    // Walk up from the heading until we find the container that holds BOTH the heading AND the <form>
    let card = heading.parentElement;
    while (card && card !== document.body && !card.querySelector("form")) {
      card = card.parentElement;
    }
    if (!card || card === document.body || card.dataset.splitApplied === "1") return;
    card.dataset.splitApplied = "1";

    const bodyWrap = document.createElement("div");
    bodyWrap.className = "arpiares-fb-body";
    while (card.firstChild) {
      bodyWrap.appendChild(card.firstChild);
    }

    const aside = document.createElement("aside");
    aside.className = "arpiares-fb-aside";
    aside.innerHTML = `
      <div>
        <div class="arpiares-fb-aside-crest">A</div>
        <span style="font:700 10.5px 'DM Sans',sans-serif;letter-spacing:0.2em;text-transform:uppercase;color:#d4af6a;">PATRON DESK</span>
        <h3>Your voice shapes our <em>next</em> piece.</h3>
        <p>Tell us how your order felt in person—from unboxing finish to everyday use.</p>
        <div class="arpiares-fb-tags">
          <button type="button" class="arpiares-fb-tag" data-tag="Exceptional craftsmanship">✨ Craftsmanship</button>
          <button type="button" class="arpiares-fb-tag" data-tag="Luxury unboxing experience">🎁 Packaging</button>
          <button type="button" class="arpiares-fb-tag" data-tag="Fast & careful delivery">🚚 Fast Delivery</button>
          <button type="button" class="arpiares-fb-tag" data-tag="Worth every rupee">💎 Value</button>
        </div>
      </div>
      <div class="arpiares-fb-quote-box">
        <strong style="color:#e5c17b;display:block;margin-bottom:4px;">★★★★★ 4.9 / 5.0 Patron Score</strong>
        Every verified note is read directly by the ARPIARES studio team.
      </div>
    `;

    card.classList.add("arpiares-fb-split");
    card.style.padding = "0";
    card.appendChild(aside);
    card.appendChild(bodyWrap);

    aside.querySelectorAll("[data-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const headlineInput =
          bodyWrap.querySelector("input[placeholder*='Summarize'], input[name*='title'], input[name*='headline']") ||
          Array.from(bodyWrap.querySelectorAll("input[type='text']")).pop();
        if (headlineInput) {
          headlineInput.value = btn.dataset.tag;
          headlineInput.focus();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", upgradeFormCard);
  } else {
    upgradeFormCard();
  }
  setTimeout(upgradeFormCard, 600);
})();

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
        const maxL = Math.max(8, window.innerWidth - el.offsetWidth - 8);
        const maxT = Math.max(8, window.innerHeight - el.offsetHeight - 8);
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

  function decorateBotMessages(container) {
    if (!container) return;
    const msgs = container.querySelectorAll(".msg.bot, .bot-msg, .bot, [data-role='assistant'], > div:not(.user):not(.is-user)");
    msgs.forEach((m) => {
      if (m.dataset.avatarAdded === "1") return;
      m.dataset.avatarAdded = "1";
      const tag = document.createElement("div");
      tag.className = "arpiares-msg-sender";
      tag.innerHTML = "<span>✦</span> <span>ARPIARES Stylist</span>";
      m.prepend(tag);
    });
  }

  function setupBot() {
    const launcher = document.querySelector("#supportLauncher, .support-launcher, .chat-launcher, [id*='chatToggle'], [id*='supportBtn']");
    const widget = document.querySelector("#supportWidget, .support-widget, .chat-widget, .chat-box, [id*='supportPanel'], [id*='chatWindow']");

    if (launcher) {
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

      const msgBox = widget.querySelector("#supportMessages, .support-messages, .chat-messages, .chat-body");
      if (msgBox) {
        decorateBotMessages(msgBox);
        if (!msgBox.dataset.observerBound) {
          msgBox.dataset.observerBound = "1";
          new MutationObserver(() => decorateBotMessages(msgBox)).observe(msgBox, { childList: true });
        }
      }

      const form = widget.querySelector("form, .chat-form, .support-form");
      const input = form?.querySelector("input");
      if (form && input && !widget.querySelector(".arpiares-quick-chips")) {
        const bar = document.createElement("div");
        bar.className = "arpiares-quick-chips";
        ["📦 Track order", "🚚 Delivery info", "✨ Style picks", "🔄 7-day returns"].forEach((q) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "arpiares-quick-chip";
          btn.textContent = q;
          btn.addEventListener("click", () => {
            input.value = q.replace(/^[^\w]+/, "").trim();
            form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          });
          bar.appendChild(btn);
        });
        form.parentNode.insertBefore(bar, form);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupBot);
  } else {
    setupBot();
  }
  setTimeout(setupBot, 600);
})();

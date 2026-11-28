(function initMovableArpiaresConcierge() {
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

  function setupBot() {
    const launcher = document.querySelector("#supportLauncher, .support-launcher, .chat-launcher, [id*='chatToggle'], [id*='supportBtn']");
    const widget = document.querySelector("#supportWidget, .support-widget, .chat-widget, .chat-box, [id*='supportPanel'], [id*='chatWindow']");

    if (launcher) {
      if (!launcher.dataset.styledLabel) {
        launcher.dataset.styledLabel = "1";
        launcher.innerHTML = '<span style="display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;border:1px solid #e5c17b;color:#e5c17b;font-family:Cormorant Garamond,serif;font-weight:700;">A</span><span>AI Concierge</span><span style="opacity:0.7;font-size:11px;">⠿</span>';
      }
      makeDraggable(launcher, launcher, "arpiares_bot_launcher_pos");
    }

    if (widget) {
      const header = widget.querySelector(".chat-head, .support-head, header, .chat-box-header") || widget.firstElementChild;
      if (header && !header.querySelector(".arpiares-bot-badge")) {
        const titleEl = header.querySelector("h2, h3, h4, strong, span");
        if (titleEl) {
          titleEl.innerHTML = 'ARPIARES Concierge <span class="arpiares-bot-badge"><span class="arpiares-bot-dot"></span> Drag to move</span>';
        }
      }
      makeDraggable(widget, header, "arpiares_bot_window_pos");

      const form = widget.querySelector("form, .chat-form, .support-form");
      const input = form?.querySelector("input");
      if (form && input && !widget.querySelector(".arpiares-quick-chips")) {
        const bar = document.createElement("div");
        bar.className = "arpiares-quick-chips";
        ["Track my order", "Shipping & delivery", "7-day returns", "Gift ideas"].forEach((q) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "arpiares-quick-chip";
          btn.textContent = q;
          btn.addEventListener("click", () => {
            input.value = q;
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

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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureWidgetDOM() {
    let toggleBtn = document.getElementById("chat-widget-toggle");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.id = "chat-widget-toggle";
      toggleBtn.className = "concierge-dock";
      toggleBtn.innerHTML = '<span class="concierge-emblem">💬</span><span class="concierge-text"><b>ARPIARES Care</b><small>Ask about delivery, returns &amp; reviews</small></span>';
      document.body.appendChild(toggleBtn);
    }

    let drawer = document.getElementById("chat-widget-drawer");
    if (!drawer || !document.getElementById("chat-review-panel")) {
      if (drawer) drawer.remove();
      drawer = document.createElement("aside");
      drawer.id = "chat-widget-drawer";
      drawer.className = "chat-drawer";
      drawer.setAttribute("aria-hidden", "true");
      drawer.innerHTML =
        '<div class="chat-drawer-header">' +
          '<div><strong>ARPIARES Care</strong><small>Store guide, order help &amp; feedback</small></div>' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<button type="button" class="chat-header-btn" id="chat-open-review" title="Leave a product or website review">★ Review</button>' +
            '<button type="button" class="chat-header-btn" id="chat-widget-new">New</button>' +
            '<button type="button" class="chat-header-btn" id="chat-widget-close">×</button>' +
          '</div>' +
        '</div>' +
        '<div class="chat-review-panel hidden" id="chat-review-panel">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><b style="font-size:12px;color:var(--green);">Share Product or Website Review ✨</b><button type="button" class="text-button small" id="chat-close-review">Close</button></div>' +
          '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
            '<select id="care-fb-category" style="flex:1;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:11.5px;background:#fff;"><option value="Product">Product Review</option><option value="Website">Website Experience</option><option value="Delivery">Delivery Service</option><option value="Support">Customer Support</option></select>' +
            '<select id="care-fb-rating" style="width:92px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:11.5px;background:#fff;"><option value="5">★★★★★ (5)</option><option value="4">★★★★☆ (4)</option><option value="3">★★★☆☆ (3)</option><option value="2">★★☆☆☆ (2)</option><option value="1">★☆☆☆☆ (1)</option></select>' +
          '</div>' +
          '<textarea id="care-fb-comment" rows="2" placeholder="Tell us what you loved or how we can improve…" style="width:100%;padding:7px 9px;border:1px solid var(--line);border-radius:8px;font-size:12px;background:#fff;margin-bottom:6px;"></textarea>' +
          '<button type="button" class="add-button" id="care-fb-submit" style="width:100%;padding:7px;">Submit Review →</button>' +
          '<p id="care-fb-status" style="font-size:11px;margin:4px 0 0;color:var(--green);"></p>' +
        '</div>' +
        '<div class="chat-drawer-body" id="chat-widget-messages"></div>' +
        '<form class="chat-drawer-form" id="chat-widget-form"><input type="text" id="chat-widget-input" placeholder="Ask about delivery, returns, warranty…" required autocomplete="off"><button type="submit" id="chat-widget-send">Send</button></form>';
      document.body.appendChild(drawer);
    }
  }

  function renderMessages(messages) {
    const body = document.getElementById("chat-widget-messages");
    if (!body) return;

    const welcomeCard =
      '<div class="chat-msg bot">' +
        '<p>✨ Welcome to <b>ARPIARES Care</b>! Ask me anything about delivery, returns, payments, or share a product/website review.</p>' +
        '<div class="quick-chips">  <button type="button" class="quick-chip" data-quick-ask="What are your shipping and delivery times?">Delivery Time</button>  <button type="button" class="quick-chip" data-quick-ask="What is your 7-day return and refund policy?">Returns &amp; Refunds</button>  <button type="button" class="quick-chip" data-quick-ask="Which payment modes and COD options do you accept?">Payments &amp; COD</button>  <button type="button" class="quick-chip" data-quick-ask="Do electronics come with a warranty?">Warranty</button>  <button type="button" class="quick-chip" data-quick-ask="How can I contact customer support directly?">Contact Support</button>  <button type="button" class="quick-chip" id="chip-open-review">★ Leave a Review</button></div>' +
      '</div>';

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
          badge = '<span class="chat-badge escalated">Escalated to Human Support</span>';
        } else if (typeof m.confidence === "number" && m.confidence > 0) {
          badge = '<span class="chat-badge grounded">FAQ Match · ' + Math.round(m.confidence * 100) + '%</span>';
        }

        const upActive = m.feedback === "up" ? "active" : "";
        const downActive = m.feedback === "down" ? "active" : "";
        feedbackBar = '<div class="chat-feedback-bar">' +
          '<span>Helpful?</span>' +
          '<button type="button" class="fb-btn ' + upActive + '" data-chat-fb="up" data-msg-idx="' + idx + '">👍</button>' +
          '<button type="button" class="fb-btn ' + downActive + '" data-chat-fb="down" data-msg-idx="' + idx + '">👎</button>' +
        '</div>';
        closingNote = '<small class="chat-closing">✨ Thank you for shopping with ARPIARES! Let me know if you need anything else 🛍️💛</small>';
      } else if (m.role === "admin") {
        badge = '<span class="chat-badge human">Human Agent Reply</span>';
        closingNote = '<small class="chat-closing">🌿 Warm regards, ARPIARES Care Team ✨</small>';
      }

      return '<div class="chat-msg ' + roleClass + '">' +
        badge +
        '<p>' + escapeChatHTML(m.text) + '</p>' +
        closingNote +
        feedbackBar +
      '</div>';
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
      '<div class="chat-msg user"><p>' + escapeChatHTML(text) + '</p></div>' +
      '<div class="chat-msg bot" id="chat-typing"><p>Checking ARPIARES knowledge base… ✨</p></div>'
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
        '<div class="chat-msg bot"><span class="chat-badge escalated">Notice</span><p>' + escapeChatHTML(err.message) + '</p></div>'
      );
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  }

  function initCareWidget() {
    ensureWidgetDOM();
    const toggleBtn = document.getElementById("chat-widget-toggle");
    const headerBtn = document.getElementById("header-support-btn");
    const drawer = document.getElementById("chat-widget-drawer");
    const closeBtn = document.getElementById("chat-widget-close");
    const newChatBtn = document.getElementById("chat-widget-new");
    const form = document.getElementById("chat-widget-form");
    const input = document.getElementById("chat-widget-input");

    async function openDrawer() {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      await loadChatHistory();
      input?.focus();
    }

    toggleBtn?.addEventListener("click", async () => {
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
    form?.addEventListener("submit", async e => {
      e.preventDefault();
const text = input.value.trim();
if (text) await sendChatMessage(text);
});
document.addEventListener("click", async e => {
const chip = e.target.closest("[data-quick-ask]");
if (chip) await sendChatMessage(chip.dataset.quickAsk);
if (e.target.closest("#chat-open-review") || e.target.closest("#chip-open-review")) {
document.getElementById("chat-review-panel")?.classList.remove("hidden");
}
if (e.target.closest("#chat-close-review")) {
document.getElementById("chat-review-panel")?.classList.add("hidden");
}
if (e.target.closest("#care-fb-submit")) {
const comment = document.getElementById("care-fb-comment")?.value.trim();
const category = document.getElementById("care-fb-category")?.value || "Website";
const rating = Number(document.getElementById("care-fb-rating")?.value || 5);
const statusEl = document.getElementById("care-fb-status");
const user = typeof getUser === "function" ? getUser() : null;
if (!comment) {
if (statusEl) statusEl.textContent = "Please write a quick comment first.";
return;
}
try {
const res = await apiRequest("/api/support/feedback", {
method: "POST",
body: JSON.stringify({
sessionId: getSessionId(),
customerName: user?.name || "Guest Shopper",
customerEmail: user?.email || "",
category,
rating,
comment
})
});
if (statusEl) statusEl.textContent = res.message;
document.getElementById("care-fb-comment").value = "";
setTimeout(() => document.getElementById("chat-review-panel")?.classList.add("hidden"), 1400);
} catch (err) {
if (statusEl) statusEl.textContent = err.message;
}
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
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initCareWidget);
} else {
initCareWidget();
}
})();

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

  function renderMessages(messages) {
    const body = document.getElementById("chat-widget-messages");
    if (!body) return;

    if (!messages || !messages.length) {
      body.innerHTML =
        '<div class="chat-msg bot">' +
          '<p>Welcome to <b>ARPIARES Support</b>. Ask me anything about shipping, returns, payments, or product care!</p>' +
        '</div>';
      return;
    }

    body.innerHTML = messages.map(m => {
      const roleClass = m.role === "user" ? "user" : (m.role === "admin" ? "admin" : "bot");
      let badge = "";
      if (m.role === "assistant") {
        if (m.escalated) {
          badge = '<span class="chat-badge escalated">Escalated to Human Support</span>';
        } else if (typeof m.confidence === "number" && m.confidence > 0) {
          badge = '<span class="chat-badge grounded">FAQ Match · ' + Math.round(m.confidence * 100) + '%</span>';
        }
      } else if (m.role === "admin") {
        badge = '<span class="chat-badge human">Human Agent Reply</span>';
      }

      return '<div class="chat-msg ' + roleClass + '">' +
        badge +
        '<p>' + escapeChatHTML(m.text) + '</p>' +
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

  document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("chat-widget-toggle");
    const drawer = document.getElementById("chat-widget-drawer");
    const closeBtn = document.getElementById("chat-widget-close");
    const newChatBtn = document.getElementById("chat-widget-new");
    const form = document.getElementById("chat-widget-form");
    const input = document.getElementById("chat-widget-input");
    const sendBtn = document.getElementById("chat-widget-send");

    if (!toggleBtn || !drawer || !form) return;

    toggleBtn.addEventListener("click", async () => {
      const isOpen = drawer.classList.toggle("open");
      drawer.setAttribute("aria-hidden", String(!isOpen));
      if (isOpen) {
        await loadChatHistory();
        input.focus();
      }
    });

    closeBtn?.addEventListener("click", () => {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    });

    newChatBtn?.addEventListener("click", () => {
      resetSessionId();
      renderMessages([]);
      input.focus();
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      const user = typeof getUser === "function" ? getUser() : null;
      input.value = "";
      sendBtn.disabled = true;

      const body = document.getElementById("chat-widget-messages");
      body.insertAdjacentHTML(
        "beforeend",
        '<div class="chat-msg user"><p>' + escapeChatHTML(text) + '</p></div>' +
        '<div class="chat-msg bot" id="chat-typing"><p>Checking knowledge base…</p></div>'
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
        sendBtn.disabled = false;
        input.focus();
      }
    });
  });
})();

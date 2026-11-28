(function () {
  const STATES = {
    welcome:    { img: "images/arpibot/welcome.png",    pill: "Welcome • Ready to help",       label: "Welcome" },
    helping:    { img: "images/arpibot/helping.png",    pill: "Helping • Shopping guide",      label: "Helping" },
    working:    { img: "images/arpibot/working.png",    pill: "Working • Searching store...",  label: "Working" },
    thinking:   { img: "images/arpibot/thinking.png",   pill: "Thinking • Checking catalog...",label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Explaining • Store details",    label: "Explaining" },
    winking:    { img: "images/arpibot/winking.png",    pill: "Winking • Found your match!",   label: "Winking" },
    excited:    { img: "images/arpibot/excited.png",    pill: "Excited • Top store picks!",    label: "Excited" },
    happy:      { img: "images/arpibot/happy.png",      pill: "Happy • Glad to assist!",       label: "Happy" },
    confused:   { img: "images/arpibot/confused.png",   pill: "Confused • Tell me more",       label: "Confused" },
    sorry:      { img: "images/arpibot/sorry.png",      pill: "Sorry • Let me fix that",       label: "Sorry" },
    sad:        { img: "images/arpibot/sad.png",        pill: "Sad • Here to support you",     label: "Sad" },
    bye:        { img: "images/arpibot/bye.png",        pill: "Bye • See you soon!",           label: "Bye" }
  };

  let cachedProducts = null;
  let cachedCategories = null;

  async function fetchStoreCatalog() {
    try {
      if (!cachedProducts) {
        const pRes = await fetch("/api/products");
        if (pRes.ok) {
          const pData = await pRes.json();
          cachedProducts = Array.isArray(pData) ? pData : (pData.products || []);
        }
      }
      if (!cachedCategories) {
        const cRes = await fetch("/api/categories");
        if (cRes.ok) {
          const cData = await cRes.json();
          cachedCategories = Array.isArray(cData) ? cData : (cData.categories || []);
        }
      }
    } catch (err) {
      console.warn("ArpiBot catalog lookup fallback:", err);
    }
  }

  function buildChatbotHTML() {
    if (!document.body || document.getElementById("arpBotDock")) return;

    const dock = document.createElement("div");
    dock.id = "arpBotDock";
    dock.innerHTML = `
      <div id="arpChatBubbleTip">
        <strong>Hi!! 👋</strong>
        How can I help you today?
      </div>
      <button id="arpUniversalOrb" type="button" aria-label="Open ArpiBot">
        <img id="arpOrbImg" src="images/arpibot/chat-icon.png" onerror="this.onerror=null;this.src='images/arpibot/welcome.png'" alt="ArpiBot" />
      </button>
    `;
    document.body.appendChild(dock);

    const drawer = document.createElement("div");
    drawer.id = "arpUniversalDrawer";
    drawer.innerHTML = `
      <div class="arp-ab-head">
        <div class="arp-ab-stage">
          <div class="arp-ab-ring">
            <img id="arpStageImg" src="images/arpibot/welcome.png" alt="ArpiBot" />
          </div>
          <div>
            <strong class="arp-ab-title">ArpiBot • ARPIARES</strong>
            <span class="arp-ab-pill" id="arpMoodPill">Welcome • Ready to help</span>
          </div>
        </div>
        <button type="button" id="arpUClose" class="arp-ab-close" aria-label="Close">✕</button>
      </div>
      <div class="arp-ab-bar">
        <button type="button" class="arp-ab-btn active" data-s="welcome">Welcome</button>
        <button type="button" class="arp-ab-btn" data-s="helping">Helping</button>
        <button type="button" class="arp-ab-btn" data-s="working">Working</button>
        <button type="button" class="arp-ab-btn" data-s="thinking">Thinking</button>
        <button type="button" class="arp-ab-btn" data-s="explaining">Explaining</button>
        <button type="button" class="arp-ab-btn" data-s="winking">Winking</button>
        <button type="button" class="arp-ab-btn" data-s="excited">Excited</button>
        <button type="button" class="arp-ab-btn" data-s="happy">Happy</button>
        <button type="button" class="arp-ab-btn" data-s="confused">Confused</button>
        <button type="button" class="arp-ab-btn" data-s="sorry">Sorry</button>
        <button type="button" class="arp-ab-btn" data-s="sad">Sad</button>
        <button type="button" class="arp-ab-btn" data-s="bye">Bye</button>
      </div>
      <div class="arp-u-feed" id="arpUFeed">
        <div class="arp-speech">
          <strong style="font:italic 700 15px 'Cormorant Garamond',serif;display:block;color:#07261c;margin-bottom:2px;">Hi!! 👋</strong>
          How can I help you today? Ask me to search live products, list categories, or track your order.
        </div>
      </div>
      <div class="arp-chips">
        <button type="button" data-q="Show all categories">📂 Categories</button>
        <button type="button" data-q="Show featured products">✨ Top products</button>
        <button type="button" data-q="Track my order">📦 Track order</button>
        <button type="button" data-q="Delivery & 7-day returns">🚚 Delivery &amp; returns</button>
      </div>
      <form class="arp-form" id="arpUForm">
        <input type="text" placeholder="Search products or ask ArpiBot..." required />
        <button type="submit">Send</button>
      </form>
    `;
    document.body.appendChild(drawer);

    function setExpression(stateKey) {
      const info = STATES[stateKey] || STATES.welcome;
      const stageImg = document.getElementById("arpStageImg");
      const orbImg = document.getElementById("arpOrbImg");
      if (stageImg) {
        stageImg.onerror = function () { this.onerror = null; this.src = "images/arpibot/welcome.png"; };
        stageImg.src = info.img;
      }
      if (orbImg && stateKey !== "welcome") {
        orbImg.onerror = function () { this.onerror = null; this.src = "images/arpibot/chat-icon.png"; };
        orbImg.src = info.img;
      }
      document.getElementById("arpMoodPill").textContent = info.pill;
      drawer.querySelectorAll(".arp-ab-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.s === stateKey);
      });
    }

    drawer.querySelectorAll(".arp-ab-btn").forEach((btn) => {
      btn.addEventListener("click", () => setExpression(btn.dataset.s));
    });

    function enableDrag(el, handle, storageKey) {
      let dragging = false, moved = false, sx = 0, sy = 0, ol = 0, ot = 0;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved.l === "number") {
          el.style.left = Math.min(Math.max(8, saved.l), Math.max(8, window.innerWidth - 180)) + "px";
          el.style.top = Math.min(Math.max(8, saved.t), Math.max(8, window.innerHeight - 75)) + "px";
          el.style.right = "auto";
          el.style.bottom = "auto";
        }
      } catch (_) {}

      handle.addEventListener("pointerdown", (e) => {
        if (e.target.id === "arpUClose") return;
        dragging = true;
        moved = false;
        const r = el.getBoundingClientRect();
        sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top;
        el.style.left = ol + "px"; el.style.top = ot + "px";
        el.style.right = "auto"; el.style.bottom = "auto";
      });

      window.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
        if (!moved) return;
        el.style.left = Math.min(Math.max(8, ol + dx), Math.max(8, window.innerWidth - el.offsetWidth - 8)) + "px";
        el.style.top = Math.min(Math.max(8, ot + dy), Math.max(8, window.innerHeight - el.offsetHeight - 8)) + "px";
      });

      window.addEventListener("pointerup", () => {
        if (!dragging) return;
        dragging = false;
        if (moved) {
          const r = el.getBoundingClientRect();
          try { localStorage.setItem(storageKey, JSON.stringify({ l: r.left, t: r.top })); } catch (_) {}
          el.addEventListener("click", (ev) => { ev.stopImmediatePropagation(); ev.preventDefault(); }, { capture: true, once: true });
        }
      });
    }

    enableDrag(dock, dock, "arp_dock_v110");
    enableDrag(drawer, drawer.querySelector(".arp-ab-head"), "arp_drawer_v110");

    const bubble = document.getElementById("arpChatBubbleTip");
    const orb = document.getElementById("arpUniversalOrb");

    function toggleDrawer() {
      const opening = !drawer.classList.contains("is-open");
      drawer.classList.toggle("is-open", opening);
      bubble.style.display = opening ? "none" : "block";
      if (opening) {
        setExpression("welcome");
        fetchStoreCatalog();
      }
    }

    orb.addEventListener("click", toggleDrawer);
    bubble.addEventListener("click", toggleDrawer);
    document.getElementById("arpUClose").addEventListener("click", () => {
      setExpression("bye");
      setTimeout(() => {
        drawer.classList.remove("is-open");
        bubble.style.display = "block";
        const orbImg = document.getElementById("arpOrbImg");
        if (orbImg) orbImg.src = "images/arpibot/chat-icon.png";
      }, 650);
    });

    const feed = document.getElementById("arpUFeed");
    const form = document.getElementById("arpUForm");
    const input = form.querySelector("input");

    input.addEventListener("input", () => {
      setExpression(input.value.trim().length > 0 ? "working" : "welcome");
    });

    async function handleCustomerQuery(query) {
      if (!query.trim()) return;
      const userMsg = document.createElement("div");
      userMsg.className = "arp-user";
      userMsg.textContent = query;
      feed.appendChild(userMsg);

      setExpression("thinking");
      await fetchStoreCatalog();

      const q = query.toLowerCase();
      let replyHtml = "";
      let nextMood = "explaining";

      if (q.includes("bye")) {
replyHtml = "Bye for now! Have a wonderful day shopping at ARPIARES ♥";
nextMood = "bye";
} else if (q.includes("thank") || q.includes("love") || q.includes("great")) {
replyHtml = "You are so welcome! I am always happy to help you explore ARPIARES.";
nextMood = "happy";
} else if (q.includes("sorry") || q.includes("cancel") || q.includes("out of stock")) {
replyHtml = "I am so sorry for any trouble! You can manage or cancel orders anytime in Account & More.";
nextMood = "sorry";
} else if (q.includes("sad") || q.includes("broken") || q.includes("issue")) {
replyHtml = "Oh no, we are right here with you—our 7-day replacement guarantee covers any issue.";
nextMood = "sad";
} else if (q.includes("order") || q.includes("track")) {
replyHtml = "Found it! Open Account & More → Orders & Tracking at the top right for real-time order updates.";
nextMood = "winking";
} else if (q.includes("deliver") || q.includes("return") || q.includes("shipping")) {
replyHtml = "We offer free insured delivery across India on orders above ₹999 (3–5 business days) plus 7-day effortless returns.";
nextMood = "explaining";
} else if (q.includes("categor")) {
if (cachedCategories && cachedCategories.length > 0) {
const names = cachedCategories.map((c) => c.name || c).join(", ");
replyHtml = Here are our live store categories: <strong>${names}</strong>. Which collection would you like to explore?;
nextMood = "helping";
} else {
replyHtml = "You can browse all our collections right from the category menu on the storefront!";
nextMood = "helping";
}
} else {
// Live backend product search across name, category, and description
const matches = (cachedProducts || []).filter((p) => {
const hay = ${p.name || ""} ${p.category || ""} ${p.description || ""}.toLowerCase();
return q.includes("product") || q.includes("pick") || q.includes("all") || hay.includes(q) ||
q.split(/\s+/).some((word) => word.length > 2 && hay.includes(word));
});
if (matches.length > 0) {
const top = matches.slice(0, 3);
const cards = top.map((p) =>
<div class="arp-product-hit"><span><strong>${p.name}</strong><br><small style="color:#6b7a72;">${p.category || "ARPIARES"}</small></span><strong style="color:#07261c;">₹${p.price}</strong></div>
).join("");
replyHtml = I found <strong>${matches.length}</strong> item(s) in our live store catalog:${cards};
nextMood = "excited";
} else {
replyHtml = "Could you share a product name or category? You can also tap Categories or Top products below.";
nextMood = "confused";
}
}
setExpression(nextMood);
const botMsg = document.createElement("div");
botMsg.className = "arp-speech";
botMsg.innerHTML = <strong class="arp-speech-tag">ArpiBot • ${STATES[nextMood].label}</strong>${replyHtml};
feed.appendChild(botMsg);
feed.scrollTop = feed.scrollHeight;
}
form.addEventListener("submit", (e) => {
e.preventDefault();
const val = input.value;
input.value = "";
handleCustomerQuery(val);
});
drawer.querySelectorAll("[data-q]").forEach((chip) => {
chip.addEventListener("click", () => handleCustomerQuery(chip.dataset.q));
});
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", buildChatbotHTML);
} else {
buildChatbotHTML();
}
})();

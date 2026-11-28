(function () {
  const STATES = {
    welcome:    { img: "images/arpibot/welcome.png",    pill: "Welcome • Ready to help",     label: "Welcome" },
    helping:    { img: "images/arpibot/helping.png",    pill: "Helping • Searching catalog", label: "Helping" },
    thinking:   { img: "images/arpibot/thinking.png",   pill: "Thinking • Checking details", label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Explaining • Store guidance", label: "Explaining" },
    happy:      { img: "images/arpibot/happy.png",      pill: "Happy • Glad to assist",      label: "Happy" },
    excited:    { img: "images/arpibot/excited.png",    pill: "Excited • Great finds!",      label: "Excited" },
    winking:    { img: "images/arpibot/winking.png",    pill: "Pro Tip • Curated pick",      label: "Pro Tip" },
    working:    { img: "images/arpibot/working.png",    pill: "Working • Checking store",    label: "Working" },
    confused:   { img: "images/arpibot/confused.png",   pill: "Clarify • Tell me more",      label: "Clarify" },
    sorry:      { img: "images/arpibot/sorry.png",      pill: "Apologies • Let us fix that", label: "Sorry" },
    sad:        { img: "images/arpibot/sad.png",        pill: "Here for you • Support",      label: "Support" },
    bye:        { img: "images/arpibot/bye.png",        pill: "Goodbye • Come back soon!",   label: "Bye" }
  };

  const QUICK_PROMPTS = [
    { label: "Top products", q: "Show me your top products" },
    { label: "Categories",   q: "What categories do you have?" },
    { label: "Shipping",     q: "Tell me about shipping and delivery" },
    { label: "Returns",      q: "What is your return policy?" },
    { label: "Track order",  q: "How do I track my order?" }
  ];

  let cachedProducts = null;

  async function fetchCatalog() {
    if (Array.isArray(cachedProducts)) return cachedProducts;
    try {
      const res = await fetch("/api/products?limit=100");
      if (!res.ok) return [];
      const data = await res.json();
      cachedProducts = Array.isArray(data) ? data : (data.products || []);
      return cachedProducts;
    } catch {
      return [];
    }
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatINR(val) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  }

  function renderProductCard(p) {
    return (
      '<div class="arp-product-hit">' +
        '<span><strong>' + escapeHtml(p.name) + '</strong><br>' +
        '<small>' + escapeHtml(p.category || "ARPIARES") + '</small></span>' +
        '<strong>' + formatINR(p.price) + '</strong>' +
      '</div>'
    );
  }

  function buildChatbotHTML() {
    if (document.getElementById("arpibot-launcher")) return;

    const launcher = document.createElement("button");
    launcher.id = "arpibot-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open ArpiBot Concierge");
    launcher.innerHTML =
      '<img class="arp-launcher-avatar" src="images/arpibot/chat-icon.png" alt="ArpiBot" />' +
      '<span class="arp-launcher-badge">' +
        '<img src="images/arpibot/chat-bubble.png" alt="" />' +
        '<span>Ask ArpiBot</span>' +
      '</span>';

    const chipsHtml = QUICK_PROMPTS.map(function (p) {
      return '<button type="button" class="arp-chip" data-q="' + escapeHtml(p.q) + '">' + escapeHtml(p.label) + '</button>';
    }).join("");

    const drawer = document.createElement("aside");
    drawer.id = "arpibot-drawer";
    drawer.setAttribute("aria-label", "ArpiBot Luxury Concierge");
    drawer.innerHTML =
      '<div class="arp-header">' +
        '<div class="arp-avatar-stage">' +
          '<img id="arp-mascot-img" src="images/arpibot/welcome.png" alt="ArpiBot Mascot" />' +
        '</div>' +
        '<div class="arp-header-info">' +
          '<div class="arp-title-row">' +
            '<strong>ArpiBot</strong>' +
            '<span id="arp-mood-pill" class="arp-mood-pill">Welcome • Ready to help</span>' +
          '</div>' +
          '<p class="arp-subtitle">ARPIARES Personal Shopping &amp; Care Concierge</p>' +
        '</div>' +
        '<button id="arp-close-btn" class="arp-close-btn" type="button" aria-label="Close ArpiBot">&times;</button>' +
      '</div>' +
      '<div id="arp-feed" class="arp-feed">' +
        '<div class="arp-speech">' +
          '<strong class="arp-speech-tag">ArpiBot • Welcome</strong>' +
          'Welcome to <strong>ARPIARES</strong>! Ask me about products, categories, gifting, shipping, or your orders.' +
        '</div>' +
      '</div>' +
      '<div class="arp-chips">' + chipsHtml + '</div>' +
      '<form id="arp-form" class="arp-form">' +
        '<input id="arp-input" type="text" placeholder="Ask ArpiBot anything..." autocomplete="off" />' +
        '<button type="submit" class="arp-send-btn">Send</button>' +
      '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    const mascotImg = document.getElementById("arp-mascot-img");
    const moodPill = document.getElementById("arp-mood-pill");
    const feed = document.getElementById("arp-feed");
    const form = document.getElementById("arp-form");
    const input = document.getElementById("arp-input");
    const closeBtn = document.getElementById("arp-close-btn");

    function setExpression(moodKey) {
      const state = STATES[moodKey] || STATES.welcome;
      if (mascotImg) {
        mascotImg.src = state.img;
        mascotImg.classList.remove("arp-pop");
        void mascotImg.offsetWidth;
        mascotImg.classList.add("arp-pop");
      }
      if (moodPill) moodPill.textContent = state.pill;
    }

    function appendMessage(tag, html) {
      const msg = document.createElement("div");
      msg.className = "arp-speech";
      msg.innerHTML = '<strong class="arp-speech-tag">' + escapeHtml(tag) + '</strong>' + html;
      feed.appendChild(msg);
      feed.scrollTop = feed.scrollHeight;
    }

    launcher.addEventListener("click", function () {
      drawer.classList.toggle("open");
      if (drawer.classList.contains("open")) {
        setExpression("welcome");
        input.focus();
      }
    });

    closeBtn.addEventListener("click", function () {
      setExpression("bye");
      setTimeout(function () { drawer.classList.remove("open"); }, 420);
    });

    async function handleCustomerQuery(rawText) {
      const query = String(rawText || "").trim();
      if (!query) return;

      const userDiv = document.createElement("div");
      userDiv.className = "arp-user-msg";
      userDiv.textContent = query;
      feed.appendChild(userDiv);
      feed.scrollTop = feed.scrollHeight;

      setExpression("thinking");
      const lower = query.toLowerCase();
      let replyHtml = "";
      let nextMood = "happy";

      if (/\b(hi|hello|hey|namaste)\b/.test(lower)) {
        nextMood = "welcome";
        replyHtml = "Hello! I am <strong>ArpiBot</strong>. Tell me what style, gift, or category you are exploring today.";
      } else if (/\b(bye|goodbye|see ya|thanks|thank you)\b/.test(lower)) {
        nextMood = lower.includes("thank") ? "happy" : "bye";
        replyHtml = lower.includes("thank")
          ? "Always a pleasure! Let me know if you would like help picking another signature piece."
          : "Goodbye! Come back anytime to explore new arrivals at <strong>ARPIARES</strong>.";
      } else if (lower.includes("ship") || lower.includes("deliver")) {
        nextMood = "explaining";
        replyHtml = "We offer insured express dispatch across India within <strong>24–48 hours</strong>, with complimentary shipping on curated luxury orders.";
      } else if (lower.includes("return") || lower.includes("refund") || lower.includes("exchange")) {
        nextMood = "sorry";
        replyHtml = "Need an exchange or return? Every piece is covered by our <strong>14-day hassle-free return &amp; exchange</strong> guarantee in unused condition.";
      } else if (lower.includes("track") || lower.includes("order")) {
        nextMood = "working";
        replyHtml = 'You can view live order status anytime in your <a href="profile.html">Account &amp; Orders</a> page, or reach out via <a href="feedback.html">Patron Desk</a>.';
      } else if (lower.includes("categor")) {
        setExpression("helping");
        const products = await fetchCatalog();
        const cats = Array.from(new Set(products.map(function (p) { return p.category; }).filter(Boolean)));
        if (cats.length > 0) {
          nextMood = "winking";
          const names = cats.map(escapeHtml).join(", ");
          replyHtml = "Here are our live store categories: <strong>" + names + '</strong>. Explore them all on our <a href="categories.html">Categories page</a>!';
        } else {
          nextMood = "explaining";
          replyHtml = 'Browse all curated collections on our <a href="categories.html">Categories page</a>.';
        }
      } else if (lower.includes("top") || lower.includes("best") || lower.includes("recommend") || lower.includes("popular")) {
        setExpression("helping");
        const products = await fetchCatalog();
        if (products.length > 0) {
          nextMood = "excited";
          const cards = products.slice(0, 3).map(renderProductCard).join("");
          replyHtml = "Here are our standout pieces right now:" + cards;
        } else {
          nextMood = "winking";
          replyHtml = "Explore our featured collection right on the home page—handpicked for timeless everyday luxury.";
        }
      } else {
        setExpression("helping");
        const products = await fetchCatalog();
const terms = lower.split(/s+/).filter(function (w) { return w.length > 2; });
const matches = products.filter(function (p) {
const hay = ((p.name || "") + " " + (p.category || "") + " " + (p.description || "")).toLowerCase();
return terms.some(function (t) { return hay.includes(t); });
});
if (matches.length > 0) {
nextMood = "excited";
const cards = matches.slice(0, 3).map(renderProductCard).join("");
replyHtml = "I found " + matches.length + " matching item(s) in our catalog:" + cards;
} else {
nextMood = "confused";
replyHtml = "Could you share a product name or category? You can also tap Top products or Categories below.";
}
}
setExpression(nextMood);
appendMessage("ArpiBot • " + STATES[nextMood].label, replyHtml);
}
form.addEventListener("submit", function (e) {
e.preventDefault();
const val = input.value;
input.value = "";
handleCustomerQuery(val);
});
drawer.querySelectorAll("[data-q]").forEach(function (chip) {
chip.addEventListener("click", function () { handleCustomerQuery(chip.dataset.q); });
});
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", buildChatbotHTML);
} else {
buildChatbotHTML();
}
})();

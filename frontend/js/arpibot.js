(function () {
  var STATES = {
    welcome:    { img: "images/arpibot/welcome.png",    pill: "Online • Ready to help",      label: "Welcome" },
    helping:    { img: "images/arpibot/helping.png",    pill: "Searching • Store catalog",   label: "Helping" },
    thinking:   { img: "images/arpibot/thinking.png",   pill: "Checking • Store details",    label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Guide • Store policies",      label: "Explaining" },
    happy:      { img: "images/arpibot/happy.png",      pill: "Happy • Glad to assist",      label: "Happy" },
    excited:    { img: "images/arpibot/excited.png",    pill: "Found • Great picks for you", label: "Excited" },
    winking:    { img: "images/arpibot/winking.png",    pill: "Tip • Smart shopping pick",   label: "Pro Tip" },
    working:    { img: "images/arpibot/working.png",    pill: "Checking • Orders & account", label: "Working" },
    confused:   { img: "images/arpibot/confused.png",   pill: "Clarify • Tell me more",      label: "Clarify" },
    sorry:      { img: "images/arpibot/sorry.png",      pill: "Care • Easy returns & help",  label: "Sorry" },
    sad:        { img: "images/arpibot/sad.png",        pill: "Support • Here for you",      label: "Support" },
    bye:        { img: "images/arpibot/bye.png",        pill: "Goodbye • Come back soon!",   label: "Bye" }
  };

  var MOODS = ["welcome", "helping", "thinking", "explaining", "happy", "excited", "winking", "working", "confused", "sorry", "sad", "bye"];

  var HELP_TILES = [
    { label: "🛍️ Top Products",    q: "Show me your top products" },
    { label: "📂 All Categories",  q: "What categories do you have?" },
    { label: "💰 Under ₹1500",     q: "Show products under 1500" },
    { label: "📦 Track My Order",  q: "How do I track my order?" },
    { label: "🚚 Shipping & COD",  q: "Tell me about shipping, delivery, and COD payment" },
    { label: "🔄 Returns & Care",  q: "What is your return, refund, and warranty policy?" }
  ];

  var PROMPTS = [
    { label: "💳 Payment & COD",   q: "What payment methods and COD options do you accept?" },
    { label: "🎁 Gift Ideas",      q: "Suggest nice gift ideas" },
    { label: "❤️ My Wishlist",     q: "How do I view my saved wishlist items?" },
    { label: "👤 Account & Login", q: "How do I sign up, login, or check my profile?" },
    { label: "📝 Give Feedback",   q: "Where can I submit a product review or feedback?" },
    { label: "📞 Contact Support", q: "How can I contact customer support?" }
  ];

  var catalog = null;

  async function getCatalog() {
    if (Array.isArray(catalog)) return catalog;
    try {
      var r = await fetch("/api/products?limit=100");
      if (!r.ok) return [];
      var d = await r.json();
      catalog = Array.isArray(d) ? d : (d.products || []);
      return catalog;
    } catch (e) {
      return [];
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .split("&").join("&amp;")
      .split("<").join("&lt;")
      .split(">").join("&gt;")
      .split('"').join("&quot;");
  }

  function inr(v) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));
  }

  function card(p) {
    var href = p._id ? "index.html?product=" + encodeURIComponent(p._id) + "#catalog" : "index.html#catalog";
    var stockTxt = typeof p.stock === "number" ? (p.stock > 0 ? "In stock (" + p.stock + ")" : "Out of stock") : "Available";
    return (
      '<a class="arp-product-hit" href="' + href + '" style="text-decoration:none;color:inherit;">' +
        '<span><strong>' + esc(p.name) + '</strong><br>' +
        '<small style="color:#6b7a72;">' + esc(p.category || "ARPIARES") + ' · ' + stockTxt + '</small></span>' +
        '<strong style="color:#07261c;">' + inr(p.price) + '</strong>' +
      '</a>'
    );
  }

  function makeMovable(dock, drawer, onTapDock) {
    var dragged = false;
    var activeEl = null;
    var activeHandle = null;
    var activePointerId = null;
    var captured = false;
    var startX = 0;
    var startY = 0;
    var origLeft = 0;
    var origTop = 0;

    function clampPosition(el, left, top) {
      var maxLeft = Math.max(8, window.innerWidth - el.offsetWidth - 8);
      var maxTop = Math.max(8, window.innerHeight - el.offsetHeight - 8);
      return {
        left: Math.min(Math.max(8, left), maxLeft),
        top: Math.min(Math.max(8, top), maxTop)
      };
    }

    function restoreSaved(el, key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return;
        var pos = JSON.parse(raw);
        if (typeof pos.left === "number" && typeof pos.top === "number") {
          var c = clampPosition(el, pos.left, pos.top);
          el.style.right = "auto";
          el.style.bottom = "auto";
          el.style.left = c.left + "px";
          el.style.top = c.top + "px";
        }
      } catch (e) {}
    }

    function attachDrag(handle, target, storageKey, isDock) {
      if (!handle || !target) return;

      handle.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target && e.target.closest("button.arp-ab-close, button#arpTipDismiss")) return;
        activeEl = target;
        activeHandle = handle;
        activePointerId = e.pointerId;
        dragged = false;
        captured = false;
        var rect = target.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
        target.dataset.storageKey = storageKey;
      });

      handle.addEventListener("pointermove", function (e) {
        if (!activeEl || activeEl !== target) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (!dragged && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          dragged = true;
          target.style.right = "auto";
          target.style.bottom = "auto";
          target.style.left = origLeft + "px";
          target.style.top = origTop + "px";
          if (!captured && activeHandle && activeHandle.setPointerCapture) {
            try {
              activeHandle.setPointerCapture(activePointerId);
              captured = true;
            } catch (err) {}
          }
        }
        if (!dragged) return;
        var c = clampPosition(target, origLeft + dx, origTop + dy);
        target.style.left = c.left + "px";
        target.style.top = c.top + "px";
      });

      function finishPointer() {
        if (activeEl !== target) return;
        var wasDrag = dragged;
        if (captured && activeHandle && activeHandle.releasePointerCapture) {
          try { activeHandle.releasePointerCapture(activePointerId); } catch (err) {}
        }
        if (wasDrag && target.dataset.storageKey) {
          try {
            localStorage.setItem(target.dataset.storageKey, JSON.stringify({
              left: parseFloat(target.style.left),
              top: parseFloat(target.style.top)
            }));
          } catch (err) {}
        } else if (!wasDrag && isDock && typeof onTapDock === "function") {
          onTapDock();
        }
        activeEl = null;
        activeHandle = null;
        captured = false;
        setTimeout(function () { dragged = false; }, 40);
      }

      handle.addEventListener("pointerup", finishPointer);
      handle.addEventListener("pointercancel", finishPointer);
    }

    restoreSaved(dock, "arpibot_dock_pos");
    restoreSaved(drawer, "arpibot_drawer_pos");

    attachDrag(dock, dock, "arpibot_dock_pos", true);
    var head = drawer.querySelector(".arp-ab-head");
    attachDrag(head, drawer, "arpibot_drawer_pos", false);

    window.addEventListener("resize", function () {
      if (dock.style.left) {
        var c1 = clampPosition(dock, parseFloat(dock.style.left), parseFloat(dock.style.top));
        dock.style.left = c1.left + "px";
        dock.style.top = c1.top + "px";
      }
      if (drawer.style.left && drawer.classList.contains("is-open")) {
        var c2 = clampPosition(drawer, parseFloat(drawer.style.left), parseFloat(drawer.style.top));
        drawer.style.left = c2.left + "px";
        drawer.style.top = c2.top + "px";
      }
    });
  }

  function init() {
    if (document.getElementById("arpBotDock")) return;

    var dock = document.createElement("div");
    dock.id = "arpBotDock";
    dock.innerHTML =
      '<div id="arpChatBubbleTip">' +
        '<button id="arpTipDismiss" type="button" aria-label="Dismiss tip">&times;</button>' +
        '<span class="arp-tip-eyebrow">' +
          '<img src="images/arpibot/chat-bubble.png" alt="" style="width:14px;height:14px;object-fit:contain;" /> ARPIARES Assistant' +
        '</span>' +
        '<strong>Hi! Need any help?</strong>' +
        'Ask about products, prices, delivery, orders &amp; returns.' +
      '</div>' +
      '<button id="arpUniversalOrb" type="button" aria-label="Open ArpiBot">' +
        '<img src="images/arpibot/chat-icon.png" alt="ArpiBot" />' +
      '</button>';

    var moodBtns = MOODS.map(function (k) {
      var cls = k === "welcome" ? "arp-ab-btn active" : "arp-ab-btn";
      return '<button type="button" class="' + cls + '" data-mood="' + k + '">' + STATES[k].label + '</button>';
    }).join("");

    var tilesHtml = HELP_TILES.map(function (t) {
      return '<button type="button" class="arp-help-tile" data-q="' + esc(t.q) + '">' + esc(t.label) + '</button>';
    }).join("");

    var chipBtns = PROMPTS.map(function (p) {
      return '<button type="button" data-q="' + esc(p.q) + '">' + esc(p.label) + '</button>';
    }).join("");

    var drawer = document.createElement("aside");
    drawer.id = "arpUniversalDrawer";
    drawer.innerHTML =
      '<div class="arp-ab-head">' +
        '<div class="arp-ab-stage">' +
'' +
'' +
'✦ ARPIARES Store Assistant' +
'ArpiBot' +
'Online • Ready to help' +
'' +
'' +
'×' +
'' +
'' + moodBtns + '' +
'' +
'' +
'✦ Welcome to ARPIARES' +
'Hi! I am ArpiBot — how can I help you?' +
'From finding the right product or budget deal to checking delivery, payments, returns, or your order status—tap any topic below or type your question:' +
'' + tilesHtml + '' +
'' +
'' +
'' + chipBtns + '' +
'' +
'' +
'Send' +
'';
document.body.appendChild(dock);
document.body.appendChild(drawer);
var orb = document.getElementById("arpUniversalOrb");
var tip = document.getElementById("arpChatBubbleTip");
var tipDismiss = document.getElementById("arpTipDismiss");
var closeBtn = document.getElementById("arpDrawerClose");
var img = document.getElementById("arpStageImg");
var pill = document.getElementById("arpStagePill");
var feed = document.getElementById("arpFeed");
var form = document.getElementById("arpForm");
var input = document.getElementById("arpInput");
var bar = document.getElementById("arpMoodBar");
function setMood(k) {
var s = STATES[k] || STATES.welcome;
if (img) img.src = s.img;
if (pill) pill.textContent = s.pill;
if (bar) {
bar.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.classList.toggle("active", b.dataset.mood === k);
});
}
}
function toggle(open) {
var show = typeof open === "boolean" ? open : !drawer.classList.contains("is-open");
drawer.classList.toggle("is-open", show);
if (show) {
if (tip) tip.style.display = "none";
setMood("welcome");
setTimeout(function () { if (input) input.focus(); }, 60);
}
}
makeMovable(dock, drawer, function () { toggle(); });
if (tipDismiss) {
tipDismiss.addEventListener("click", function (e) {
e.stopPropagation();
if (tip) tip.style.display = "none";
});
}
orb.addEventListener("keydown", function (e) {
if (e.key === "Enter" || e.key === " ") {
e.preventDefault();
toggle();
}
});
closeBtn.addEventListener("click", function () {
setMood("bye");
setTimeout(function () { drawer.classList.remove("is-open"); }, 350);
});
if (bar) {
bar.querySelectorAll(".arp-ab-btn").forEach(function (b) {
b.addEventListener("click", function () { setMood(b.dataset.mood); });
});
}
function say(tag, html) {
var d = document.createElement("div");
d.className = "arp-speech";
d.innerHTML = '' + esc(tag) + '' + html;
feed.appendChild(d);
feed.scrollTop = feed.scrollHeight;
}
async function ask(raw) {
var q = String(raw || "").trim();
if (!q) return;
var u = document.createElement("div");
u.className = "arp-user";
u.textContent = q;
feed.appendChild(u);
feed.scrollTop = feed.scrollHeight;
setMood("thinking");
var l = q.toLowerCase();
var html = "";
var m = "happy";
var budgetMatch = l.match(/(?:under|below|less than|within|budget)\s*(?:rs.?|inr|₹)?\s*(\d+)/);
if (l === "hi" || l === "hello" || l === "hey" || l === "namaste" || l.indexOf("hello ") === 0 || l.indexOf("hi ") === 0) {
m = "welcome";
html = "Hello! I am ArpiBot. Ask me anything—from finding products or budget deals (e.g. under 1500) to delivery, COD, returns, or order tracking!";
} else if (l.indexOf("bye") !== -1 || l.indexOf("thank") !== -1) {
m = l.indexOf("thank") !== -1 ? "happy" : "bye";
html = l.indexOf("thank") !== -1
? "You are very welcome! Let me know if you need help with anything else."
: "Goodbye! Thanks for visiting ARPIARES—come back anytime.";
} else if (l.indexOf("payment") !== -1 || l.indexOf("cod") !== -1 || l.indexOf("cash on delivery") !== -1 || l.indexOf("upi") !== -1 || l.indexOf("card") !== -1) {
m = "explaining";
html = "We support UPI, Credit & Debit Cards, Net Banking, and Cash on Delivery (COD) across India. Just choose your preferred method at checkout!";
} else if (l.indexOf("ship") !== -1 || l.indexOf("deliver") !== -1 || l.indexOf("free delivery") !== -1) {
m = "explaining";
html = 'We offer FREE delivery on orders above ₹999 and fast dispatch within 24–48 hours across India. Full details are on Shipping Info.';
} else if (l.indexOf("return") !== -1 || l.indexOf("refund") !== -1 || l.indexOf("exchange") !== -1 || l.indexOf("warrant") !== -1) {
m = "sorry";
html = 'Every purchase is backed by our 7-day easy return & refund policy and a 1-year product warranty. Visit Returns & Warranty for step-by-step help.';
} else if (l.indexOf("cancel") !== -1) {
m = "working";
html = 'You can check your order status in My Orders. If your order has not shipped yet, contact us at +91 8438358104 for immediate cancellation help.';
} else if (l.indexOf("track") !== -1 || l.indexOf("order") !== -1) {
m = "working";
html = 'Check live order progress (Pending → Confirmed → Shipped → Delivered) anytime on your Account & Orders page.';
} else if (l.indexOf("account") !== -1 || l.indexOf("login") !== -1 || l.indexOf("sign") !== -1 || l.indexOf("profile") !== -1 || l.indexOf("password") !== -1) {
m = "working";
html = 'Manage your profile, saved address, and past orders on your Account Page, or use the Sign In button in the top header on Home.';
} else if (l.indexOf("wishlist") !== -1 || l.indexOf("saved") !== -1 || l.indexOf("bag") !== -1 || l.indexOf("cart") !== -1) {
m = "winking";
html = 'View your saved favorites in Saved Collection (Wishlist) and move items straight to your shopping bag anytime!';
} else if (l.indexOf("feedback") !== -1 || l.indexOf("review") !== -1 || l.indexOf("rate") !== -1 || l.indexOf("complaint") !== -1) {
m = "happy";
html = 'We would love to hear from you! Share your review or suggestion on our Customer Feedback page.';
} else if (l.indexOf("contact") !== -1 || l.indexOf("phone") !== -1 || l.indexOf("email") !== -1 || l.indexOf("hour") !== -1 || l.indexOf("support") !== -1 || l.indexOf("help") !== -1) {
m = "sad";
        html = "Our support team is available Mon-Sat (10 AM - 7 PM IST): +91 8438358104 or arpitagigabyte@gmail.com";
} else if (l.indexOf("cheap") !== -1 || l.indexOf("affordable") !== -1 || l.indexOf("lowest") !== -1) {
setMood("helping");
var allCheap = await getCatalog();
var sortedCheap = allCheap.slice().sort(function (a, b) { return Number(a.price || 0) - Number(b.price || 0); });
m = sortedCheap.length ? "excited" : "winking";
html = sortedCheap.length
? "Here are our most budget-friendly picks:" + sortedCheap.slice(0, 4).map(card).join("")
: 'Browse all products sorted by price on the Home Catalog.';
} else if (budgetMatch) {
setMood("helping");
var maxPrice = Number(budgetMatch);
var allItems = await getCatalog();
var affordable = allItems.filter(function (p) { return Number(p.price || 0) <= maxPrice; });
if (affordable.length) {
m = "excited";
html = "Found " + affordable.length + " product(s) under " + inr(maxPrice) + ":" + affordable.slice(0, 4).map(card).join("");
} else {
m = "sorry";
html = "No products are currently listed under " + inr(maxPrice) + ", but you can explore our full range on All Products!";
}
} else if (l.indexOf("categor") !== -1 || l.indexOf("collection") !== -1) {
setMood("helping");
var items = await getCatalog();
var cats = Array.from(new Set(items.map(function (p) { return p.category; }).filter(Boolean)));
m = cats.length ? "winking" : "explaining";
html = cats.length
? "Available store categories: " + cats.map(esc).join(", ") + '. Explore them all on Browse Categories!'
: 'Explore all store collections on Browse Categories.';
} else if (l.indexOf("top") !== -1 || l.indexOf("best") !== -1 || l.indexOf("recommend") !== -1 || l.indexOf("gift") !== -1 || l.indexOf("popular") !== -1) {
setMood("helping");
var items2 = await getCatalog();
m = items2.length ? "excited" : "winking";
html = items2.length
? "Here are our top picks for you:" + items2.slice(0, 4).map(card).join("")
: 'Explore our featured products on the Home Page.';
} else {
setMood("helping");
var items3 = await getCatalog();
var terms = l.split(" ").filter(function (w) { return w.length > 2; });
var hits = items3.filter(function (p) {
var h = ((p.name || "") + " " + (p.category || "") + " " + (p.description || "")).toLowerCase();
return terms.some(function (t) { return h.indexOf(t) !== -1; });
});
if (hits.length) {
m = "excited";
html = "I found " + hits.length + " matching product(s):" + hits.slice(0, 4).map(card).join("");
} else {
m = "confused";
html = 'I could not find an exact match for that—try asking about Beauty, under 1500, COD payment, delivery, returns, or track order!';
}
}
setMood(m);
say("ArpiBot • " + STATES[m].label, html);
}
form.addEventListener("submit", function (e) {
e.preventDefault();
var v = input.value;
input.value = "";
ask(v);
});
drawer.querySelectorAll("[data-q]").forEach(function (c) {
c.addEventListener("click", function () { ask(c.dataset.q); });
});
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();

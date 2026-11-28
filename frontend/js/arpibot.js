(function () {
  var STATES = {
    welcome:    { img: "images/arpibot/welcome.png",    pill: "Online - Atelier Concierge",   label: "Welcome" },
    helping:    { img: "images/arpibot/helping.png",    pill: "Curating - Searching catalog", label: "Helping" },
    thinking:   { img: "images/arpibot/thinking.png",   pill: "Checking - Atelier archive",   label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Guidance - Store & care",      label: "Explaining" },
    happy:      { img: "images/arpibot/happy.png",      pill: "Delighted - At your service",  label: "Happy" },
    excited:    { img: "images/arpibot/excited.png",    pill: "Curated - Standout pieces",    label: "Excited" },
    winking:    { img: "images/arpibot/winking.png",    pill: "Stylist Note - Insider pick",  label: "Pro Tip" },
    working:    { img: "images/arpibot/working.png",    pill: "Tracking - Order & bag desk",  label: "Working" },
    confused:   { img: "images/arpibot/confused.png",   pill: "Clarify - Tell me more",       label: "Clarify" },
    sorry:      { img: "images/arpibot/sorry.png",      pill: "Care - 14-day guarantee",      label: "Sorry" },
    sad:        { img: "images/arpibot/sad.png",        pill: "Patron Care - Here for you",   label: "Support" },
    bye:        { img: "images/arpibot/bye.png",        pill: "Farewell - Until next time",   label: "Bye" }
  };

  var MOODS = ["welcome", "helping", "thinking", "explaining", "happy", "excited", "winking", "working", "confused", "sorry", "sad", "bye"];

  var PROMPTS = [
    { label: "✦ Bestsellers",     q: "Show me your top products" },
    { label: "◈ Collections",     q: "What categories do you have?" },
    { label: "🎁 Gift Ideas",     q: "Suggest a luxury gift under 2000" },
    { label: "✧ Express Delivery",q: "Tell me about shipping and delivery" },
    { label: "↺ 14-Day Care",     q: "What is your return and warranty policy?" },
    { label: "⌖ Track Order",     q: "How do I track my order?" },
    { label: "☎ Contact & Hours", q: "How can I contact ARPIARES support?" }
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
    return (
      '<a class="arp-product-hit" href="' + href + '" style="text-decoration:none;color:inherit;">' +
        '<span><strong>' + esc(p.name) + '</strong><br>' +
        '<small style="color:#6b7a72;">' + esc(p.category || "ARPIARES") + ' · Tap to view →</small></span>' +
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

      function finishPointer(e) {
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
        '<span class="arp-tip-eyebrow" style="display:inline-flex;align-items:center;gap:5px;">' +
          '<img src="images/arpibot/chat-bubble.png" alt="" style="width:14px;height:14px;object-fit:contain;" /> Atelier Concierge' +
        '</span>' +
        '<strong>Tap to open ArpiBot</strong>' +
        'Personal shopping, gifts, tracking &amp; store care.' +
      '</div>' +
      '<button id="arpUniversalOrb" type="button" aria-label="Open ArpiBot">' +
        '<img src="images/arpibot/chat-icon.png" alt="ArpiBot" />' +
      '</button>';

    var moodBtns = MOODS.map(function (k) {
      var cls = k === "welcome" ? "arp-ab-btn active" : "arp-ab-btn";
      return '<button type="button" class="' + cls + '" data-mood="' + k + '">' + STATES[k].label + '</button>';
    }).join("");

    var chipBtns = PROMPTS.map(function (p) {
      return '<button type="button" data-q="' + esc(p.q) + '">' + esc(p.label) + '</button>';
    }).join("");

    var drawer = document.createElement("aside");
    drawer.id = "arpUniversalDrawer";
    drawer.innerHTML =
      '<div class="arp-ab-head">' +
        '<div class="arp-ab-stage">' +
          '<div class="arp-ab-ring"><img id="arpStageImg" src="images/arpibot/welcome.png" alt="ArpiBot" /></div>' +
          '<div>' +
            '<span class="arp-ab-eyebrow">✦ ARPIARES Private Client</span>' +
            '<span class="arp-ab-title">ArpiBot Concierge</span>' +
            '<span id="arpStagePill" class="arp-ab-pill">Online - Atelier Concierge</span>' +
          '</div>' +
        '</div>' +
        '<button id="arpDrawerClose" class="arp-ab-close" type="button" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="arp-ab-bar" id="arpMoodBar">' + moodBtns + '</div>' +
      '<div id="arpFeed" class="arp-u-feed">' +
        '<div class="arp-welcome-card">' +
'✦ Welcome to the Atelier' +
'How may I assist your visit today?' +
'I can help you find products, filter by budget, explore Beauty & curated collections, check your Wishlist & Orders, or answer delivery & return questions.' +
'' +
'' +
'' + chipBtns + '' +
'' +
'' +
'Ask' +
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
var budgetMatch = l.match(/(?:under|below|less than)\s*(?:rs.?|inr|₹)?\s*(\d+)/);
if (l === "hi" || l === "hello" || l === "hey" || l === "namaste" || l.indexOf("hello ") === 0 || l.indexOf("hi ") === 0) {
m = "welcome";
html = "Welcome to ARPIARES! Ask me for product picks, items under a budget (e.g. under 1500), categories, or order help.";
} else if (l.indexOf("bye") !== -1 || l.indexOf("thank") !== -1) {
m = l.indexOf("thank") !== -1 ? "happy" : "bye";
html = l.indexOf("thank") !== -1
? "Always a pleasure—let me know whenever you would like another curated recommendation!"
: "Farewell! The ARPIARES Atelier is always here whenever you return.";
} else if (l.indexOf("contact") !== -1 || l.indexOf("phone") !== -1 || l.indexOf("email") !== -1 || l.indexOf("hour") !== -1 || l.indexOf("support") !== -1) {
m = "sad";
html = 'Reach our Patron Care team Mon–Sat (10 AM – 7 PM IST) at +91 8438358104, arpitagigabyte@gmail.com, or via Customer Feedback.';
} else if (l.indexOf("wishlist") !== -1 || l.indexOf("saved") !== -1) {
m = "winking";
html = 'Your saved pieces are waiting in your Saved Collection (Wishlist)—you can move any item straight to your shopping bag there.';
} else if (l.indexOf("ship") !== -1 || l.indexOf("deliver") !== -1) {
m = "explaining";
html = 'Enjoy free insured delivery on orders above ₹999, dispatched within 24–48 hours across India. See full details on Shipping Care.';
} else if (l.indexOf("return") !== -1 || l.indexOf("refund") !== -1 || l.indexOf("exchange") !== -1 || l.indexOf("warrant") !== -1) {
m = "sorry";
html = 'Every ARPIARES order includes our 7-day easy return & refund policy plus a 1-year product warranty. Read more on ARPIARES Care.';
} else if (l.indexOf("track") !== -1 || l.indexOf("order") !== -1 || l.indexOf("account") !== -1) {
m = "working";
html = 'Track live order stages (Pending → Confirmed → Shipped → Delivered) anytime on your Account & Orders page.';
} else if (budgetMatch) {
setMood("helping");
var maxPrice = Number(budgetMatch);
var allItems = await getCatalog();
var affordable = allItems.filter(function (p) { return Number(p.price || 0) <= maxPrice; });
if (affordable.length) {
m = "excited";
html = "Here are curated ARPIARES pieces under " + inr(maxPrice) + ":" + affordable.slice(0, 4).map(card).join("");
} else {
m = "sorry";
html = "We do not currently have items under <strong>" + inr(maxPrice) + "</strong>, but explore our full collection on <a href='index.html#catalog'>All Products</a>!";
}
} else if (l.indexOf("categor") !== -1 || l.indexOf("collection") !== -1) {
setMood("helping");
var items = await getCatalog();
var cats = Array.from(new Set(items.map(function (p) { return p.category; }).filter(Boolean)));
m = cats.length ? "winking" : "explaining";
html = cats.length
? "Our live Atelier collections: " + cats.map(esc).join(", ") + '. Explore them all on Browse Categories!'
: 'Explore all curated collections on Browse Categories.';
} else if (l.indexOf("top") !== -1 || l.indexOf("best") !== -1 || l.indexOf("recommend") !== -1 || l.indexOf("gift") !== -1) {
setMood("helping");
var items2 = await getCatalog();
m = items2.length ? "excited" : "winking";
html = items2.length
? "Here are our standout Atelier picks right now:" + items2.slice(0, 4).map(card).join("")
: 'Explore our featured collection on the Home Gallery.';
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
html = "I found " + hits.length + " matching piece(s) in our Atelier:" + hits.slice(0, 4).map(card).join("");
} else {
m = "confused";
html = 'I could not find an exact match for that keyword—try searching a category like Beauty, a budget like under 2000, or tap a quick action below!';
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

(function () {
  var STATES = {
    welcome: { img: "images/arpibot/welcome.png", pill: "Online - Atelier Concierge", label: "Welcome" },
    helping: { img: "images/arpibot/helping.png", pill: "Curating - Searching catalog", label: "Helping" },
    thinking: { img: "images/arpibot/thinking.png", pill: "Checking - Atelier archive", label: "Thinking" },
    explaining: { img: "images/arpibot/explaining.png", pill: "Guidance - Store & care", label: "Explaining" },
    happy: { img: "images/arpibot/happy.png", pill: "Delighted - At your service", label: "Happy" },
    excited: { img: "images/arpibot/excited.png", pill: "Curated - Standout pieces", label: "Excited" },
    winking: { img: "images/arpibot/winking.png", pill: "Stylist Note - Insider pick", label: "Pro Tip" },
    working: { img: "images/arpibot/working.png", pill: "Tracking - Order desk", label: "Working" },
    confused: { img: "images/arpibot/confused.png", pill: "Clarify - Tell me more", label: "Clarify" },
    sorry: { img: "images/arpibot/sorry.png", pill: "Care - 14-day guarantee", label: "Sorry" },
    sad: { img: "images/arpibot/sad.png", pill: "Patron Care - Here for you", label: "Support" },
    bye: { img: "images/arpibot/bye.png", pill: "Farewell - Until next time", label: "Bye" }
  };

  var MOODS = ["welcome", "helping", "thinking", "explaining", "happy", "excited", "winking", "working", "confused", "sorry", "sad", "bye"];

  var PROMPTS = [
    { label: "✦ Bestsellers", q: "Show me your top products" },
    { label: "◈ Collections", q: "What categories do you have?" },
    { label: "✧ Express Delivery", q: "Tell me about shipping and delivery" },
    { label: "↺ 14-Day Care", q: "What is your return policy?" },
    { label: "⌖ Track Order", q: "How do I track my order?" }
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
    return '<div class="arp-product-hit"><span><strong>' + esc(p.name) + '</strong><br><small style="color:#6b7a72;">' + esc(p.category || "ARPIARES") + '</small></span><strong style="color:#07261c;">' + inr(p.price) + '</strong></div>';
  }

  function makeMovable(dock, drawer) {
    var dragged = false;
    var activeEl = null;
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

    function attachDrag(handle, target, storageKey) {
      if (!handle || !target) return;
      handle.addEventListener("pointerdown", function (e) {
        if (e.target && e.target.closest("button.arp-ab-close, button#arpTipDismiss")) return;
        activeEl = target;
        dragged = false;
        var rect = target.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
        target.style.right = "auto";
        target.style.bottom = "auto";
        target.style.left = origLeft + "px";
        target.style.top = origTop + "px";
        target.dataset.storageKey = storageKey;
        if (handle.setPointerCapture) {
          try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        }
      });

      handle.addEventListener("pointermove", function (e) {
        if (!activeEl || activeEl !== target) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          dragged = true;
        }
        if (!dragged) return;
        var c = clampPosition(target, origLeft + dx, origTop + dy);
        target.style.left = c.left + "px";
        target.style.top = c.top + "px";
      });

      handle.addEventListener("pointerup", function () {
        if (activeEl === target && dragged && target.dataset.storageKey) {
          try {
            localStorage.setItem(target.dataset.storageKey, JSON.stringify({
              left: parseFloat(target.style.left),
              top: parseFloat(target.style.top)
            }));
          } catch (e) {}
        }
        activeEl = null;
        setTimeout(function () { dragged = false; }, 30);
      });
    }

    restoreSaved(dock, "arpibot_dock_pos");
    restoreSaved(drawer, "arpibot_drawer_pos");

    attachDrag(dock, dock, "arpibot_dock_pos");
    var head = drawer.querySelector(".arp-ab-head");
    attachDrag(head, drawer, "arpibot_drawer_pos");

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

    return {
      wasDragged: function () { return dragged; }
    };
  }

  function init() {
    if (document.getElementById("arpBotDock")) return;

    var dock = document.createElement("div");
    dock.id = "arpBotDock";
    dock.innerHTML =
      '<div id="arpChatBubbleTip">' +
        '<button id="arpTipDismiss" type="button" aria-label="Dismiss tip">&times;</button>' +
        '<span class="arp-tip-eyebrow">✦ Atelier Concierge</span>' +
        '<strong>Your personal guide to ARPIARES</strong>' +
        'Curated picks, gifting &amp; live order care.' +
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
          '<span class="arp-wc-kicker">✦ Welcome to the Atelier</span>' +
          '<h4>Crafted around your taste.</h4>' +
          '<p>Step inside <strong>ARPIARES</strong>. Ask me to curate a signature piece, explore collections, or check your order status—or drag my header anywhere on screen.</p>' +
        '</div>' +
      '</div>' +
      '<div class="arp-chips">' + chipBtns + '</div>' +
      '<form id="arpForm" class="arp-form">' +
        '<input id="arpInput" type="text" placeholder="Ask for a piece, gift, or order update..." autocomplete="off" />' +
        '<button type="submit">Ask</button>' +
      '</form>';

    document.body.appendChild(dock);
    document.body.appendChild(drawer);

    var dragCtrl = makeMovable(dock, drawer);

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
if (dragCtrl.wasDragged()) return;
var show = typeof open === "boolean" ? open : !drawer.classList.contains("is-open");
drawer.classList.toggle("is-open", show);
if (show) {
if (tip) tip.style.display = "none";
setMood("welcome");
input.focus();
}
}
if (tipDismiss) {
tipDismiss.addEventListener("click", function (e) {
e.stopPropagation();
if (tip) tip.style.display = "none";
});
}
orb.addEventListener("click", function () { toggle(); });
if (tip) tip.addEventListener("click", function () { toggle(true); });
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
if (l === "hi" || l === "hello" || l === "hey" || l.indexOf("hello ") === 0 || l.indexOf("hi ") === 0) {
m = "welcome";
html = "Welcome to ARPIARES. Tell me what mood, room, or signature piece you are curating today.";
} else if (l.indexOf("bye") !== -1 || l.indexOf("thank") !== -1) {
m = l.indexOf("thank") !== -1 ? "happy" : "bye";
html = l.indexOf("thank") !== -1 ? "Always a pleasure—let me know whenever you would like another curated recommendation." : "Until next time. The ARPIARES Atelier is always open for you.";
} else if (l.indexOf("ship") !== -1 || l.indexOf("deliver") !== -1) {
m = "explaining";
html = "Every order receives insured express dispatch across India within 24–48 hours, wrapped in our signature presentation packaging.";
} else if (l.indexOf("return") !== -1 || l.indexOf("refund") !== -1 || l.indexOf("exchange") !== -1) {
m = "sorry";
html = "Peace of mind is built in—every piece is protected by our 14-day effortless return & exchange guarantee in unused condition.";
} else if (l.indexOf("track") !== -1 || l.indexOf("order") !== -1) {
m = "working";
html = 'Follow your parcel in real time inside Account & Orders, or message our Patron Desk.';
} else if (l.indexOf("categor") !== -1) {
setMood("helping");
var items = await getCatalog();
var cats = Array.from(new Set(items.map(function (p) { return p.category; }).filter(Boolean)));
m = cats.length ? "winking" : "explaining";
html = cats.length ? "Our current Atelier collections: " + cats.map(esc).join(", ") + '. Explore every piece on Browse Categories.' : 'Explore all curated collections on Browse Categories.';
} else if (l.indexOf("top") !== -1 || l.indexOf("best") !== -1 || l.indexOf("recommend") !== -1) {
setMood("helping");
var items2 = await getCatalog();
m = items2.length ? "excited" : "winking";
html = items2.length ? "Here are our most-coveted Atelier pieces right now:" + items2.slice(0, 3).map(card).join("") : "Explore our featured selection right on the home gallery.";
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
html = "I curated " + hits.length + " matching piece(s) from our collection:" + hits.slice(0, 3).map(card).join("");
} else {
m = "confused";
html = "Tell me a style, material, or product name—or tap ✦ Bestsellers or ◈ Collections below.";
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

const byId = id => document.getElementById(id);

const escapeHTML = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

let savedAddressesCache = [];

function buildFullOrderCard(o) {
  const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
  const isCancelled = o.orderStatus === "Cancelled";
  const isDelivered = o.orderStatus === "Delivered";
  const currentIdx = steps.indexOf(o.orderStatus);
  const statusClass = "status-pill " + String(o.orderStatus || "pending").toLowerCase();

  const trackerHTML = isCancelled
    ? '<div class="order-cancelled">✕ This order was cancelled</div>'
    : '<div class="order-tracker">' +
        steps.map((step, idx) => {
          const done = idx <= currentIdx;
          return '<div class="tracker-step ' + (done ? "done" : "") + '">' +
            '<div class="tracker-bar"></div>' +
            '<span>' + step + '</span>' +
          '</div>';
        }).join("") +
      '</div>';

  let ratingHTML = "";
  const isCustomer = getUser()?.role === "customer";
  if (isDelivered && isCustomer) {
    if (o.rating) {
      const stars = "★".repeat(o.rating) + "☆".repeat(5 - o.rating);
      ratingHTML = '<div class="rated-box">' +
        '<strong>Your Rating: <span class="gold-stars">' + stars + '</span> (' + o.rating + '/5)</strong>' +
        (o.reviewComment ? '<p>"' + escapeHTML(o.reviewComment) + '"</p>' : "") +
      '</div>';
    } else {
      const starBtns = Array.from({ length: 5 }, (_, i) => i + 1).map(n =>
        '<button type="button" class="star-btn active" data-star-order="' + o._id + '" data-star-val="' + n + '">★</button>'
      ).join("");
      ratingHTML = '<div class="rate-box">' +
        '<p class="rate-title">✨ Delivered! Rate your order experience:</p>' +
        '<div class="star-picker">' + starBtns + '<span class="star-score-label" id="rating-label-' + o._id + '">5 / 5</span></div>' +
        '<input type="hidden" id="rating-val-' + o._id + '" value="5">' +
        '<input type="text" id="rating-note-' + o._id + '" placeholder="Share a quick review (optional)…">' +
        '<button type="button" class="add-button" data-submit-rating="' + o._id + '">Submit Rating ★</button>' +
      '</div>';
    }
  }

  const itemsText = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");
  const orderCode = escapeHTML(String(o._id).slice(-6).toUpperCase());
  const orderDate = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const payBadge = escapeHTML(o.paymentMethod || "COD") + " · " + escapeHTML(o.paymentStatus || "Pending");
  const feedbackLine = o.checkoutFeedback
    ? '<p class="order-address" style="margin-top:-8px;"><span>Order Note:</span> ' + escapeHTML(o.checkoutFeedback) + '</p>'
    : "";

  return '<div class="order-card" id="order-card-' + o._id + '">' +
    '<div class="order-card-top">' +
      '<div>' +
        '<span class="order-id">Order #' + orderCode + '</span>' +
        '<span class="' + statusClass + '">' + escapeHTML(o.orderStatus) + '</span>' +
      '</div>' +
      '<strong class="order-total">' + money(o.totalAmount) + '</strong>' +
    '</div>' +
    '<p class="order-meta">Placed on ' + orderDate + ' · Payment: <b>' + payBadge + '</b></p>' +
    '<p class="order-items">' + itemsText + '</p>' +
    '<p class="order-address"><span>Deliver to:</span> ' + escapeHTML(o.deliveryAddress || "N/A") + '</p>' +
    feedbackLine +
    trackerHTML +
    ratingHTML +
  '</div>';
}

async function loadUserDashboard() {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = "index.html";
    return;
  }

  byId("profile-greeting").textContent = "Welcome, " + user.name;
  byId("profile-hero-card").innerHTML =
    '<div class="profile-summary-card" style="margin-bottom:0;">' +
      '<div class="profile-avatar">' + escapeHTML(user.name.trim().charAt(0).toUpperCase()) + '</div>' +
      '<div style="flex:1;min-width:200px;">' +
        '<h3 style="margin:0;font:700 20px \'Playfair Display\',serif;">' + escapeHTML(user.name) + '</h3>' +
        '<p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Email: <b>' + escapeHTML(user.email) + '</b> · Account Type: <b>' + escapeHTML((user.role || "customer").toUpperCase()) + '</b></p>' +
      '</div>' +
      '<a href="index.html#catalog" class="gold-button" style="text-decoration:none;">Continue Shopping →</a>' +
    '</div>';

  try {
    const data = await apiRequest("/api/orders/my-orders");
    const orders = data.orders || [];

    const activeCount = orders.filter(o => ["Pending", "Confirmed", "Shipped"].includes(o.orderStatus)).length;
    const deliveredCount = orders.filter(o => o.orderStatus === "Delivered").length;
    const totalSpent = orders.filter(o => o.orderStatus !== "Cancelled").reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    byId("u-stat-orders").textContent = orders.length;
    byId("u-stat-active").textContent = activeCount;
    byId("u-stat-delivered").textContent = deliveredCount;
    byId("u-stat-spent").textContent = money(totalSpent);

    // 1. Quick jump list (clicking redirects smoothly to that exact order card below)
    byId("quick-orders-list").innerHTML = orders.length
      ? orders.map(o => {
          const code = escapeHTML(String(o._id).slice(-6).toUpperCase());
          const dt = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const stClass = "status-pill " + String(o.orderStatus || "pending").toLowerCase();
          const summary = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");
          return '<button type="button" class="saved-addr-row" style="width:100%;text-align:left;cursor:pointer;" data-jump-order="' + o._id + '">' +
            '<span><b>Order #' + code + '</b> · ' + dt + ' · ' + summary + '</span>' +
            '<span><span class="' + stClass + '">' + escapeHTML(o.orderStatus) + '</span> <b style="margin-left:8px;color:var(--green);">' + money(o.totalAmount) + ' →</b></span>' +
          '</button>';
        }).join("")
      : '<p class="muted small">You have not placed any orders yet.</p>';

    // 2. Full detailed orders list
    byId("user-all-orders").innerHTML = orders.length
      ? orders.map(buildFullOrderCard).join("")
      : '<p class="muted">No orders yet. Explore the ARPIARES collection to place your first order!</p>';

    // 3. Saved unique addresses
    savedAddressesCache = [];
    const seen = new Set();
    for (const o of orders) {
      const addr = String(o.deliveryAddress || "").trim();
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        savedAddressesCache.push({ formatted: addr, details: o.shippingDetails || null });
      }
    }

    byId("user-saved-addresses").innerHTML = savedAddressesCache.length
      ? savedAddressesCache.map((a, idx) =>
          '<div class="saved-addr-row">' +
            '<span>📍 ' + escapeHTML(a.formatted) + '</span>' +
            '<button type="button" class="add-button" data-order-with-addr="' + idx + '">Shop &amp; Use Address →</button>' +
          '</div>'
        ).join("")
      : '<p class="muted small">No saved delivery addresses yet.</p>';

    // 4. Rated orders & reviews
    const ratedOrders = orders.filter(o => Number(o.rating) >= 1);
    byId("user-reviews-list").innerHTML = ratedOrders.length
      ? ratedOrders.map(o => {
          const stars = "★".repeat(o.rating) + "☆".repeat(5 - o.rating);
          const code = escapeHTML(String(o._id).slice(-6).toUpperCase());
          const items = o.items.map(i => escapeHTML(i.name)).join(", ");
          return '<div class="rated-box">' +
            '<strong>Order #' + code + ' (' + items + ') — <span class="gold-stars">' + stars + '</span> (' + o.rating + '/5)</strong>' +
            (o.reviewComment ? '<p>"' + escapeHTML(o.reviewComment) + '"</p>' : '<p>No written comment</p>') +
          '</div>';
        }).join("")
      : '<p class="muted small">No ratings submitted yet. Once an order is delivered, you can rate it above!</p>';
  } catch (err) {
    byId("profile-notice").textContent = err.message;
  }
}

document.addEventListener("click", async e => {
  const jumpBtn = e.target.closest("[data-jump-order]");
  if (jumpBtn) {
    const targetCard = byId("order-card-" + jumpBtn.dataset.jumpOrder);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      targetCard.style.outline = "2px solid #c89d5c";
      targetCard.style.background = "#fff8eb";
      setTimeout(() => {
        targetCard.style.outline = "";
        targetCard.style.background = "";
      }, 2200);
    }
  }

  const useAddr = e.target.closest("[data-order-with-addr]");
  if (useAddr) {
    const chosen = savedAddressesCache[Number(useAddr.dataset.orderWithAddr)];
    if (chosen) {
      localStorage.setItem("arpiares_selected_address", JSON.stringify(chosen));
    }
    window.location.href = "index.html#catalog";
  }

  const starBtn = e.target.closest("[data-star-order]");
  if (starBtn) {
    const orderId = starBtn.dataset.starOrder;
    const val = Number(starBtn.dataset.starVal);
    const hidden = byId("rating-val-" + orderId);
    if (hidden) hidden.value = val;
    document.querySelectorAll('[data-star-order="' + orderId + '"]').forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.starVal) <= val);
    });
    const lbl = byId("rating-label-" + orderId);
    if (lbl) lbl.textContent = val + " / 5";
  }

  const submitRate = e.target.closest("[data-submit-rating]");
  if (submitRate) {
    const orderId = submitRate.dataset.submitRating;
    const rating = Number(byId("rating-val-" + orderId)?.value || 5);
    const reviewComment = byId("rating-note-" + orderId)?.value.trim() || "";
    try {
const data = await apiRequest("/api/orders/" + orderId + "/rate", {
method: "PUT",
body: JSON.stringify({ rating, reviewComment })
});
byId("profile-notice").textContent = data.message;
await loadUserDashboard();
} catch (err) {
byId("profile-notice").textContent = err.message;
}
}
if (e.target.closest("#refresh-user-orders")) {
await loadUserDashboard();
byId("profile-notice").textContent = "Orders refreshed.";
}
if (e.target.closest("#profile-page-logout")) {
localStorage.removeItem("arpiares_token");
localStorage.removeItem("arpiares_user");
window.location.href = "index.html";
}
});
loadUserDashboard();


/* Authoritative Account Sidebar Switcher & Gold Glow */
(function initAccountSidebarSwitcher() {
  function setup() {
    const sidebar = document.querySelector(".account-sidebar, .admin-sidebar");
    const main = document.querySelector(".account-main, .admin-main, main");
    if (!sidebar || !main) return;

    const panels = Array.from(main.querySelectorAll("section, .admin-card, .account-card, [data-panel]")).filter(
      (el) => !el.classList.contains("admin-kpis")
    );

    const keywordsByTab = {
      profile: ["profile", "overview", "arpita", "account detail"],
      orders: ["order", "tracking"],
      addresses: ["address", "shipping", "saved"],
      reviews: ["rating", "review"]
    };

    function activate(tab) {
      Array.from(sidebar.querySelectorAll(".admin-nav")).forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === tab);
      });
      const keys = keywordsByTab[tab] || [tab];
      const matched = panels.filter((p) => {
        const idAttr = (p.id || p.dataset.panel || p.dataset.tab || "").toLowerCase();
        const heading = (p.querySelector("h1, h2, h3")?.textContent || "").toLowerCase();
        return keys.some((k) => idAttr.includes(k) || heading.includes(k));
      });
      if (matched.length > 0) {
        panels.forEach((p) => {
          const show = matched.includes(p);
          p.style.display = show ? "" : "none";
          p.hidden = !show;
        });
      }
    }

    sidebar.addEventListener("click", (e) => {
      const btn = e.target.closest(".admin-nav");
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      activate(btn.dataset.tab);
    }, true);

    const initial = sidebar.querySelector(".admin-nav.active")?.dataset.tab || "profile";
    activate(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();

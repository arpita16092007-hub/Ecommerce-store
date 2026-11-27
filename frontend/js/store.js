function getWishlistKey() {
  const user = getUser();
  return "arpiares_saved_" + (user?._id || user?.email || "guest");
}
function getSavedIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(getWishlistKey()) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}
function toggleSavedProduct(productId) {
  const id = String(productId);
  const current = getSavedIds();
  const exists = current.includes(id);
  const next = exists ? current.filter(x => x !== id) : [...current, id];
  localStorage.setItem(getWishlistKey(), JSON.stringify(next));
  refreshWishlistUI();
  showNotice(exists ? "Removed from your Saved Collection." : "❖ Saved to your Curated Collection!");
}
function refreshWishlistUI() {
  const saved = getSavedIds();
  const countEl = byId("wishlist-count");
  if (countEl) countEl.textContent = saved.length;
  document.querySelectorAll("[data-save-id]").forEach(btn => {
    const isSaved = saved.includes(String(btn.dataset.saveId));
    btn.classList.toggle("saved", isSaved);
    btn.title = isSaved ? "Saved in collection" : "Save to collection";
  });
}
function openNavDrawer() {
  byId("nav-slide-drawer")?.classList.add("open");
  byId("nav-drawer-backdrop")?.classList.add("open");
}
function closeNavDrawer() {
  byId("nav-slide-drawer")?.classList.remove("open");
  byId("nav-drawer-backdrop")?.classList.remove("open");
}
document.addEventListener("click", e => {
  if (e.target.closest("#open-menu-drawer")) openNavDrawer();
  if (e.target.closest("#close-menu-drawer") || e.target.id === "nav-drawer-backdrop") closeNavDrawer();
  if (e.target.closest("#nav-slide-drawer .drawer-item-btn")) closeNavDrawer();
});
let allProducts = [];
let allCategories = [];
let selectedCategory = "";
let authMode = "login";

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const byId = id => document.getElementById(id);

const escapeHTML = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function showNotice(message, isError = false) {
  const el = byId("notice");
  if (el) {
    el.textContent = message;
    el.style.color = isError ? "#a3442f" : "#31533e";
  }
}

function openModal(id) {
  byId(id)?.classList.add("open");
  byId(id)?.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  byId(id)?.classList.remove("open");
  byId(id)?.setAttribute("aria-hidden", "true");
}

async function loadStore() {
  try {
    const [productData, categoryData] = await Promise.all([
      apiRequest("/api/products?limit=100"),
      apiRequest("/api/categories")
    ]);
    allProducts = productData.products || [];
    allCategories = categoryData.categories || [];
    renderCategories();
    const initialCatParam = new URLSearchParams(window.location.search).get("category");
    if (initialCatParam) {
      selectedCategory = String(initialCatParam);
      renderCategories();
      renderProducts(allProducts.filter(p => String(p.categoryId?._id || p.categoryId || "") === selectedCategory));
    } else {
      renderProducts(allProducts);
    }
    renderHeroSpotlight();
    startHeroAutoplay();
  } catch (error) {
    byId("product-grid").innerHTML = '<div class="loading-card">Couldn\'t load products. ' + escapeHTML(error.message) + '</div>';
    showNotice("Backend connection failed. Refresh this page once the server is ready.", true);
  }
}

function renderCategories() {
  const list = byId("category-list");
  list.innerHTML = allCategories.map(c =>
    '<button class="category-link" data-category="' + escapeHTML(c._id) + '">◇ <span>' + escapeHTML(c.name) + '</span></button>'
  ).join("");
  document.querySelectorAll("[data-category]").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.category === selectedCategory)
  );
}

function renderProducts(products) {
  const grid = byId("product-grid");
  if (!products.length) {
    grid.innerHTML = '<div class="loading-card">No products found. Try another search or category.</div>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const primaryImg = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
    const safeSrc = String(primaryImg).replace(/"/g, "&quot;");
    const image = safeSrc
      ? '<img src="' + safeSrc + '" alt="' + escapeHTML(p.name) + '" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<span class="product-placeholder">A</span>';
    const desc = escapeHTML((p.description || "").slice(0, 85)) + ((p.description || "").length > 85 ? "…" : "");
    return '<article class="product-card">' +
      '<div class="product-image" data-view="' + p._id + '">' + image + '<button type="button" class="curate-save-btn ' + (getSavedIds().includes(String(p._id)) ? "saved" : "") + '" data-save-id="' + p._id + '" aria-label="Save product" title="Save to collection">❖</button><span class="image-badge">' + escapeHTML(p.name) + '</span></div>' +
      '<div class="product-info">' +
        '<h3 data-view="' + p._id + '">' + escapeHTML(p.name) + '</h3>' +
        '<p>' + desc + '</p>' +
        '<div class="product-bottom">' +
          '<span class="price">' + money(p.price) + '</span>' +
          '<button class="add-button" data-add="' + p._id + '" ' + (p.stock < 1 ? "disabled" : "") + '>' + (p.stock < 1 ? "OUT OF STOCK" : "＋ ADD TO BAG") + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join("");
}

async function refreshCartCount() {
  if (!getToken()) {
    byId("cart-count").textContent = "0";
    return;
  }
  try {
    const cart = await apiRequest("/api/cart");
    const count = (cart.items || []).reduce((n, item) => n + Number(item.quantity || 0), 0);
    byId("cart-count").textContent = count;
  } catch {
    byId("cart-count").textContent = "0";
  }
}

function logoutUser() {
  localStorage.removeItem("arpiares_token");
  localStorage.removeItem("arpiares_user");
  updateAccountUI();
  refreshWishlistUI();
  refreshCartCount();
refreshWishlistUI();
  closeModal("profile-modal");
  closeModal("orders-modal");
  closeModal("cart-modal");
  showNotice("You have signed out safely.");
}

async function openProfile() {
  const user = getUser();
  const savedRaw = localStorage.getItem("arpiares_selected_address");
  if (savedRaw) {
    try {
      const item = JSON.parse(savedRaw);
      if (item?.details) {
        if (byId("ship-name")) byId("ship-name").value = item.details.fullName || "";
        if (byId("ship-phone")) byId("ship-phone").value = item.details.phone || "";
        if (byId("ship-address")) byId("ship-address").value = item.details.addressLine || item.formatted;
        if (byId("ship-city")) byId("ship-city").value = item.details.city || "";
        if (byId("ship-state")) byId("ship-state").value = item.details.state || "";
        if (byId("ship-pincode")) byId("ship-pincode").value = item.details.pincode || "";
      } else if (item?.formatted && byId("ship-address")) {
        byId("ship-address").value = item.formatted;
      }
    } catch {}
    localStorage.removeItem("arpiares_selected_address");
  }
  if (!getToken() || !user) {
    openAuth("login");
    return;
  }
  openModal("profile-modal");
  const box = byId("profile-content");
  box.innerHTML = '<p class="muted">Loading your profile, saved addresses, and orders…</p>';
  try {
    const data = await apiRequest("/api/orders/my-orders");
    const orders = data.orders || [];
    const totalSpent = orders.filter(o => o.orderStatus !== "Cancelled").reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const uniqueAddresses = [];
    const seen = new Set();
    for (const o of orders) {
      const addr = String(o.deliveryAddress || "").trim();
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        uniqueAddresses.push({ formatted: addr, details: o.shippingDetails || null });
      }
    }
    window.__savedAddresses = uniqueAddresses;
    const addressesHTML = uniqueAddresses.length
      ? uniqueAddresses.map((a, idx) =>
          '<div class="saved-addr-row"><span>📍 ' + escapeHTML(a.formatted) + '</span><button type="button" class="add-button" style="padding:5px 10px;font-size:11px;" data-use-addr="' + idx + '">Use at Checkout</button></div>'
        ).join("")
      : '<p class="muted small">No previous delivery addresses saved yet.</p>';
    const ordersSummaryHTML = orders.length
      ? orders.map(o => {
          const code = escapeHTML(String(o._id).slice(-6).toUpperCase());
          const dt = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const items = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");
          const stClass = "status-pill " + String(o.orderStatus || "pending").toLowerCase();
          return '<div class="order-card"><div class="order-card-top"><div><span class="order-id">Order #' + code + '</span><span class="' + stClass + '">' + escapeHTML(o.orderStatus) + '</span></div><strong class="order-total">' + money(o.totalAmount) + '</strong></div><p class="order-meta">Placed on ' + dt + ' · Payment: <b>' + escapeHTML(o.paymentMethod || "COD") + '</b></p><p class="order-items">' + items + '</p></div>';
        }).join("")
      : '<p class="muted small">No orders placed yet.</p>';
    box.innerHTML =
      '<div class="profile-summary-card"><div class="profile-avatar">' + escapeHTML(user.name.trim().charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:180px;"><h3 style="margin:0;font:700 18px \'Playfair Display\',serif;">' + escapeHTML(user.name) + '</h3><p style="margin:2px 0 6px;font-size:12.5px;color:var(--muted);">' + escapeHTML(user.email) + ' · <b>' + escapeHTML((user.role || "customer").toUpperCase()) + '</b></p><div class="profile-stats"><span>📦 <b>' + orders.length + '</b> Orders</span><span>💳 <b>' + money(totalSpent) + '</b> Total Spent</span><span>📍 <b>' + uniqueAddresses.length + '</b> Saved Addresses</span></div></div></div>' +
      '<h3 class="profile-section-title">Saved Previous Addresses</h3><div style="display:grid;gap:8px;margin-bottom:18px;">' + addressesHTML + '</div>' +
      '<h3 class="profile-section-title">Recent Orders &amp; Status</h3><div style="display:grid;gap:12px;">' + ordersSummaryHTML + '</div>';
  } catch (err) {
    box.innerHTML = '<p class="muted">' + escapeHTML(err.message) + '</p>';
  }
}

function updateAccountUI() {
  const user = getUser();
  byId("account-label").textContent = user ? user.name.trim().split(/\s+/).at(0) : "Sign in / Sign up";
  const logoutBtn = byId("header-logout-btn");
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !user);
  const userLink = byId("user-nav-link");
  if (userLink) userLink.classList.toggle("hidden", !user);
  const adminLink = byId("admin-nav-link");
  if (adminLink) {
    adminLink.classList.toggle("hidden", !user || user.role !== "admin");
  }
}

async function addToCart(productId) {
  if (!getToken()) {
    openAuth("login");
    byId("auth-message").textContent = "Please sign in before adding items to your cart.";
    return;
  }
  try {
    await apiRequest("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 })
    });
    showNotice("Added to your shopping bag.");
    await refreshCartCount();
  } catch (e) {
    showNotice(e.message, true);
  }
}

async function updateCartQuantity(productId, newQuantity) {
  byId("cart-message").textContent = "";
  try {
    if (newQuantity <= 0) {
      await apiRequest("/api/cart/item/" + productId, { method: "DELETE" });
    } else {
      await apiRequest("/api/cart/item/" + productId, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQuantity })
      });
    }
    await refreshCartCount();
    await openCart();
  } catch (err) {
    byId("cart-message").textContent = err.message;
  }
}

async function openCart() {
  openModal("cart-modal");
  const form = byId("checkout-form");
  if (byId("cart-message")) byId("cart-message").textContent = "";
  if (!getToken()) {
    byId("cart-items").innerHTML = '<p class="muted">Please sign in to view your cart.</p>';
    byId("cart-subtotal").textContent = money(0);
    if (form) form.classList.add("hidden");
    return;
  }
  const user = getUser();
  const savedRaw = localStorage.getItem("arpiares_selected_address");
  if (savedRaw) {
    try {
      const item = JSON.parse(savedRaw);
      if (item?.details) {
        if (byId("ship-name")) byId("ship-name").value = item.details.fullName || "";
        if (byId("ship-phone")) byId("ship-phone").value = item.details.phone || "";
        if (byId("ship-address")) byId("ship-address").value = item.details.addressLine || item.formatted;
        if (byId("ship-city")) byId("ship-city").value = item.details.city || "";
        if (byId("ship-state")) byId("ship-state").value = item.details.state || "";
        if (byId("ship-pincode")) byId("ship-pincode").value = item.details.pincode || "";
      } else if (item?.formatted && byId("ship-address")) {
        byId("ship-address").value = item.formatted;
      }
    } catch {}
    localStorage.removeItem("arpiares_selected_address");
  }
  if (user && byId("ship-name") && !byId("ship-name").value) {
    byId("ship-name").value = user.name || "";
  }
  try {
    const data = await apiRequest("/api/cart");
    const items = data.items || [];
    if (form) form.classList.toggle("hidden", items.length === 0);
    byId("cart-items").innerHTML = items.length
      ? items.map(item =>
        '<div class="cart-row">' +
          '<div>' +
            '<b>' + escapeHTML(item.productName) + '</b>' +
            '<small>' + money(item.price) + ' each</small>' +
            '<div style="display:inline-flex;align-items:center;gap:8px;margin-top:6px;">' +
              '<button type="button" class="add-button" style="padding:3px 10px;" data-qty-id="' + item.productId + '" data-qty-next="' + (item.quantity - 1) + '">−</button>' +
              '<span style="font-weight:700;min-width:18px;text-align:center;">' + item.quantity + '</span>' +
              '<button type="button" class="add-button" style="padding:3px 10px;" data-qty-id="' + item.productId + '" data-qty-next="' + (item.quantity + 1) + '">＋</button>' +
            '</div>' +
          '</div>' +
          '<strong style="text-align:right;">' +
            money(item.itemTotal) + '<br>' +
            '<button type="button" class="text-button small" data-remove="' + item.productId + '">Remove all</button>' +
          '</strong>' +
        '</div>').join("")
      : '<p class="muted">Your bag is empty. Explore the collection to add something you love.</p>';
    byId("cart-subtotal").textContent = money(data.subtotal);
  } catch (e) {
    byId("cart-items").textContent = e.message;
  }
}


function openAuth(mode = "login") {
  authMode = mode;
  byId("auth-title").textContent = mode === "login" ? "Welcome back." : "Create your account.";
  byId("auth-subtitle").textContent = mode === "login" ? "Sign in to continue your journey." : "Join ARPIARES and discover something extraordinary.";
  byId("name-field").classList.toggle("hidden", mode === "login");
  byId("auth-name").required = mode === "signup";
  byId("auth-password").autocomplete = mode === "login" ? "current-password" : "new-password";
  byId("auth-submit").textContent = mode === "login" ? "LOGIN →" : "CREATE ACCOUNT →";
  byId("auth-switch-line").innerHTML = mode === "login"
    ? 'Don\'t have an account? <button class="text-button" id="switch-auth">Create account</button>'
    : 'Already registered? <button class="text-button" id="switch-auth">Sign in</button>';
  byId("auth-message").textContent = "";
  openModal("auth-modal");
}

async function showProduct(id) {
  try {
    const p = await apiRequest("/api/products/" + id);
    const gallery = Array.isArray(p.images) && p.images.length
      ? p.images
      : (p.imageUrl ? [p.imageUrl] : []);
    const mainSrc = String(gallery.at(0) || "").replace(/"/g, "&quot;");

    const thumbsHTML = gallery.length > 1
      ? '<div class="detail-thumbs">' + gallery.map((src, idx) => {
          const clean = String(src).replace(/"/g, "&quot;");
          return '<button type="button" class="thumb-btn ' + (idx === 0 ? "active" : "") + '" data-thumb="' + clean + '">' +
            '<img src="' + clean + '" alt="' + escapeHTML(p.name) + ' angle ' + (idx + 1) + '">' +
          '</button>';
        }).join("") + '</div>'
      : "";

    byId("product-detail").innerHTML = '<div class="detail-layout">' +
      '<div>' +
        '<div class="detail-image">' + (mainSrc ? '<img id="detail-main-img" src="' + mainSrc + '" alt="' + escapeHTML(p.name) + '">' : '<span class="product-placeholder">A</span>') + '</div>' +
        thumbsHTML +
      '</div>' +
      '<div>' +
        '<p class="eyebrow">ARPIARES COLLECTION</p>' +
        '<h2>' + escapeHTML(p.name) + '</h2>' +
        '<p class="price">' + money(p.price) + '</p>' +
        '<p>' + escapeHTML(p.description) + '</p>' +
        '<p class="small">Availability: ' + (Number(p.stock) > 0 ? p.stock + " in stock" : "Out of stock") + '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="primary-button" style="flex:1;" data-add="' + p._id + '" ' + (p.stock < 1 ? "disabled" : "") + '>ADD TO BAG →</button><button type="button" class="curate-modal-btn ' + (getSavedIds().includes(String(p._id)) ? "saved" : "") + '" data-save-id="' + p._id + '">❖ Save</button></div>' +
      '</div>' +
    '</div>';
    openModal("product-modal");
  } catch (e) {
    showNotice(e.message, true);
  }
}

document.addEventListener("click", async e => {
  const close = e.target.closest("[data-close]");
  if (close) closeModal(close.dataset.close);
  if (e.target.classList.contains("overlay")) closeModal(e.target.id);

  const thumb = e.target.closest("[data-thumb]");
  if (thumb) {
    const mainImg = byId("detail-main-img");
    if (mainImg) mainImg.src = thumb.dataset.thumb;
    document.querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("active"));
    thumb.classList.add("active");
  }

  const category = e.target.closest("[data-category]");
  if (category) {
    selectedCategory = String(category.dataset.category || "");
    document.querySelectorAll("[data-category]").forEach(b =>
      b.classList.toggle("active", String(b.dataset.category || "") === selectedCategory)
    );
    const filtered = selectedCategory
      ? allProducts.filter(p => String(p.categoryId?._id || p.categoryId || "") === selectedCategory)
      : allProducts;
    renderProducts(filtered);
    closeNavDrawer();
  }
const add = e.target.closest("[data-add]");
if (add) await addToCart(add.dataset.add);
const saveBtn = e.target.closest("[data-save-id]");
  if (saveBtn) { e.stopPropagation(); toggleSavedProduct(saveBtn.dataset.saveId); return; }
  const view = e.target.closest("[data-view]");
if (view) await showProduct(view.dataset.view);
if (e.target.closest("#open-auth")) { if (getToken() && getUser()) { window.location.href = "profile.html"; return; } else openAuth("login"); }
  if (e.target.closest("#header-logout-btn") || e.target.closest("#profile-logout-btn")) logoutUser();
  const useAddrBtn = e.target.closest("[data-use-addr]");
  if (useAddrBtn) {
    const item = (window.__savedAddresses || [])[Number(useAddrBtn.dataset.useAddr)];
    closeModal("profile-modal");
    await openCart();
    if (item?.details) {
      if (byId("ship-name")) byId("ship-name").value = item.details.fullName || "";
      if (byId("ship-phone")) byId("ship-phone").value = item.details.phone || "";
      if (byId("ship-address")) byId("ship-address").value = item.details.addressLine || item.formatted;
      if (byId("ship-city")) byId("ship-city").value = item.details.city || "";
      if (byId("ship-state")) byId("ship-state").value = item.details.state || "";
      if (byId("ship-pincode")) byId("ship-pincode").value = item.details.pincode || "";
    } else if (item?.formatted && byId("ship-address")) {
      byId("ship-address").value = item.formatted;
    }
  }
if (e.target.closest("#open-cart")) await openCart();
if (e.target.closest("#switch-auth")) openAuth(authMode === "login" ? "signup" : "login");
const qtyBtn = e.target.closest("[data-qty-id]");
if (qtyBtn) {
await updateCartQuantity(qtyBtn.dataset.qtyId, Number(qtyBtn.dataset.qtyNext));
}
const rm = e.target.closest("[data-remove]");
if (rm) {
await updateCartQuantity(rm.dataset.remove, 0);
}
if (e.target.closest("#open-orders")) await openOrders();
if (e.target.closest("#wishlist-shortcut")) showNotice("Wishlist is a visual placeholder; a wishlist API is not yet available.");
const starBtn = e.target.closest("[data-star-order]");
if (starBtn) {
const orderId = starBtn.dataset.starOrder;
const val = Number(starBtn.dataset.starVal);
const hidden = byId("rating-val-" + orderId);
if (hidden) hidden.value = val;
document.querySelectorAll('[data-star-order="' + orderId + '"]').forEach(btn => {
btn.classList.toggle("active", Number(btn.dataset.starVal) <= val);
});
}
const submitRate = e.target.closest("[data-submit-rating]");
if (submitRate) {
const orderId = submitRate.dataset.submitRating;
const rating = Number(byId("rating-val-" + orderId)?.value || 5);
const reviewComment = byId("rating-note-" + orderId)?.value.trim() || "";
try {
await apiRequest("/api/orders/" + orderId + "/rate", {
method: "PUT",
body: JSON.stringify({ rating, reviewComment })
});
await openOrders();
} catch (err) {
alert(err.message);
}
}
});
async function openOrders() {
  openModal("orders-modal");
  const box = byId("orders-list");
  if (!getToken()) {
    box.innerHTML = '<p class="muted">Please sign in to track your orders.</p>';
    return;
  }
  box.innerHTML = '<p class="muted">Loading your order history…</p>';
  try {
    const data = await apiRequest("/api/orders/my-orders");
    const orders = data.orders || [];
    const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
    const isCustomer = getUser()?.role === "customer";
    if (!orders.length) {
      box.innerHTML = '<p class="muted">You have no orders yet.</p>';
      return;
    }
    box.innerHTML = orders.map(o => {
      const isCancelled = o.orderStatus === "Cancelled";
      const isDelivered = o.orderStatus === "Delivered";
      const currentIdx = steps.indexOf(o.orderStatus);
      const statusClass = "status-pill " + String(o.orderStatus || "pending").toLowerCase();
      const trackerHTML = isCancelled
        ? '<div class="order-cancelled">✕ This order was cancelled</div>'
        : '<div class="order-tracker">' + steps.map((step, idx) => {
            const done = idx <= currentIdx;
            return '<div class="tracker-step ' + (done ? "done" : "") + '"><div class="tracker-bar"></div><span>' + step + '</span></div>';
          }).join("") + '</div>';
      let ratingHTML = "";
      if (isDelivered && isCustomer) {
        if (o.rating) {
          const stars = "★".repeat(o.rating) + "☆".repeat(5 - o.rating);
          ratingHTML = '<div class="rated-box"><strong>Your Rating: <span class="gold-stars">' + stars + '</span> (' + o.rating + '/5)</strong>' + (o.reviewComment ? '<p>"' + escapeHTML(o.reviewComment) + '"</p>' : "") + '</div>';
        } else {
          const starBtns = Array.from({ length: 5 }, (_, i) => i + 1).map(n =>
            '<button type="button" class="star-btn active" data-star-order="' + o._id + '" data-star-val="' + n + '">★</button>'
          ).join("");
          ratingHTML = '<div class="rate-box"><p class="rate-title">✨ Delivered! Rate your order experience:</p><div class="star-picker">' + starBtns + '<span class="star-score-label" id="rating-label-' + o._id + '">5 / 5</span></div><input type="hidden" id="rating-val-' + o._id + '" value="5"><input type="text" id="rating-note-' + o._id + '" placeholder="Share a quick review (optional)…"><button type="button" class="add-button" data-submit-rating="' + o._id + '">Submit Rating ★</button></div>';
        }
      }
      const itemsText = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");
      const orderCode = escapeHTML(String(o._id).slice(-6).toUpperCase());
      const orderDate = new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const payBadge = escapeHTML(o.paymentMethod || "COD") + " · " + escapeHTML(o.paymentStatus || "Pending");
      return '<div class="order-card">' +
        '<div class="order-card-top"><div><span class="order-id">Order #' + orderCode + '</span><span class="' + statusClass + '">' + escapeHTML(o.orderStatus) + '</span></div><strong class="order-total">' + money(o.totalAmount) + '</strong></div>' +
        '<p class="order-meta">Placed on ' + orderDate + ' · Payment: <b>' + payBadge + '</b></p>' +
        '<p class="order-items">' + itemsText + '</p>' +
        '<p class="order-address"><span>Deliver to:</span> ' + escapeHTML(o.deliveryAddress || "N/A") + '</p>' +
        trackerHTML +
        ratingHTML +
        '<div style="margin-top:10px;text-align:right;"><a href="profile.html#orders-section" class="text-button small" style="text-decoration:none;">View in User Dashboard →</a></div>' +
      '</div>';
    }).join("");
  } catch (err) {
    box.innerHTML = '<p class="muted">' + escapeHTML(err.message) + '</p>';
  }
}


byId("search-form").addEventListener("submit", e => {
e.preventDefault();
const q = byId("search-input").value.trim().toLowerCase();
const base = selectedCategory ? allProducts.filter(p => (p.categoryId?._id || p.categoryId) === selectedCategory) : allProducts;
renderProducts(base.filter(p => (p.name + " " + p.description).toLowerCase().includes(q)));
});
byId("sort-select").addEventListener("change", e => {
const sorted = [...allProducts];
if (e.target.value === "price-low") sorted.sort((a, b) => a.price - b.price);
if (e.target.value === "price-high") sorted.sort((a, b) => b.price - a.price);
renderProducts(selectedCategory ? sorted.filter(p => (p.categoryId?._id || p.categoryId) === selectedCategory) : sorted);
});
byId("auth-form").addEventListener("submit", async e => {
e.preventDefault();
const message = byId("auth-message");
message.textContent = "Please wait…";
const body = { email: byId("auth-email").value.trim(), password: byId("auth-password").value };
if (authMode === "signup") body.name = byId("auth-name").value.trim();
try {
const data = await apiRequest(authMode === "signup" ? "/api/auth/signup" : "/api/auth/login", { method: "POST", body: JSON.stringify(body) });
if (authMode === "signup") {
message.textContent = "Account created. Please sign in.";
openAuth("login");
byId("auth-email").value = body.email;
} else {
localStorage.setItem("arpiares_token", data.token);
localStorage.setItem("arpiares_user", JSON.stringify(data.user));
updateAccountUI();
closeModal("auth-modal");
await refreshCartCount();
showNotice("Welcome, " + data.user.name + "!");
}
} catch (err) {
message.textContent = err.message;
}
});
byId("checkout-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!getToken()) {
    byId("cart-message").textContent = "Please sign in first.";
    return;
  }
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  byId("cart-message").textContent = "Placing your order…";
  const shippingDetails = {
    fullName: byId("ship-name").value.trim(),
    phone: byId("ship-phone").value.trim(),
    addressLine: byId("ship-address").value.trim(),
    city: byId("ship-city").value.trim(),
    state: byId("ship-state").value.trim(),
    pincode: byId("ship-pincode").value.trim()
  };
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "COD";
  const checkoutFeedback = byId("checkout-feedback").value.trim();
  try {
    const data = await apiRequest("/api/orders/checkout", {
      method: "POST",
      body: JSON.stringify({ shippingDetails, paymentMethod, checkoutFeedback })
    });
    const order = data.order || {};
    const orderCode = escapeHTML(String(order._id || "").slice(-6).toUpperCase());
    e.target.reset();
    e.target.classList.add("hidden");
    await refreshCartCount();
    byId("cart-subtotal").textContent = money(0);
    byId("cart-items").innerHTML =
      '<div class="order-receipt-card">' +
        '<p class="eyebrow" style="color:#1d5438;">✓ ORDER CONFIRMED</p>' +
        '<h3 style="margin:4px 0 8px;font:700 20px \'Playfair Display\',serif;color:var(--green);">Thank you for your order! 🎉</h3>' +
        '<p style="font-size:13px;margin:0 0 6px;"><b>Order ID:</b> #' + orderCode + ' · <b>Total:</b> ' + money(order.totalAmount) + '</p>' +
        '<p style="font-size:12.5px;margin:0 0 6px;"><b>Payment Mode:</b> ' + escapeHTML(order.paymentMethod || paymentMethod) + ' (' + escapeHTML(order.paymentStatus || "Pending") + ')</p>' +
        '<p style="font-size:12px;color:var(--muted);margin:0 0 14px;"><b>Deliver to:</b> ' + escapeHTML(order.deliveryAddress || "") + '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<a href="profile.html#orders-section" class="primary-button" style="text-decoration:none;text-align:center;flex:1;">TRACK IN USER DASHBOARD →</a>' +
        '</div>' +
      '</div>';
    await loadStore();
  } catch (err) {
    byId("cart-message").textContent = err.message;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});
updateAccountUI();
loadStore();
refreshCartCount();

let heroIndex = 0;
let heroTimer = null;

function renderHeroSpotlight() {
  const card = byId("hero-spotlight-card");
  const dotsBox = byId("hero-dots");
  if (!card || !allProducts.length) return;
  const featured = allProducts.slice(0, 5);
  if (heroIndex >= featured.length) heroIndex = 0;
  if (heroIndex < 0) heroIndex = featured.length - 1;
  const p = featured[heroIndex];
  const imgSrc = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
  const safeImg = String(imgSrc).replace(/"/g, "&quot;");
  const catName = escapeHTML(p.categoryId?.name || "Featured Pick");
  card.classList.remove("spotlight-animate-in");
  void card.offsetWidth;
  card.classList.add("spotlight-animate-in");
  card.innerHTML =
    '<span class="spotlight-tag">✦ ' + catName + '</span>' +
    '<div class="spotlight-img-wrap" data-view="' + p._id + '">' +
      (safeImg ? '<img src="' + safeImg + '" alt="' + escapeHTML(p.name) + '">' : '<div class="hero-product">A</div>') +
    '</div>' +
    '<div class="spotlight-meta">' +
      '<div><strong data-view="' + p._id + '" style="cursor:pointer;">' + escapeHTML(p.name) + '</strong><span>' + money(p.price) + '</span></div>' +
      '<button type="button" class="spotlight-add-btn" data-add="' + p._id + '" ' + (p.stock < 1 ? "disabled" : "") + '>' + (p.stock < 1 ? "Sold Out" : "+ Add") + '</button>' +
    '</div>';
  if (dotsBox) {
    dotsBox.innerHTML = featured.map((_, idx) =>
      '<button type="button" class="hero-dot ' + (idx === heroIndex ? "active" : "") + '" data-hero-dot="' + idx + '" aria-label="Slide ' + (idx + 1) + '"></button>'
    ).join("");
  }
}

function startHeroAutoplay() {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (allProducts.length > 1) {
      heroIndex = (heroIndex + 1) % Math.min(5, allProducts.length);
      renderHeroSpotlight();
    }
  }, 4000);
}

document.addEventListener("click", e => {
  if (e.target.closest("#hero-open-explore")) openNavDrawer();
  if (e.target.closest("#hero-prev")) { heroIndex--; renderHeroSpotlight(); startHeroAutoplay(); }
  if (e.target.closest("#hero-next")) { heroIndex++; renderHeroSpotlight(); startHeroAutoplay(); }
  const dot = e.target.closest("[data-hero-dot]");
  if (dot) { heroIndex = Number(dot.dataset.heroDot); renderHeroSpotlight(); startHeroAutoplay(); }
});


document.addEventListener("mousemove", e => {
  const card = byId("hero-spotlight-card");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) {
    card.style.transform = "";
    return;
  }
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = "perspective(700px) rotateY(" + (x * 8).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg) translateY(-4px)";
});


function initHeroTypewriter() {
  const wordEl = byId("hero-type-word");
  const quoteEl = byId("hero-witty-quote");
  if (!wordEl || !quoteEl) return;
  const slides = [
    { word: "extraordinary.", quote: "Because ordinary never made anyone smile when the delivery bell rang." },
    { word: "unforgettable.", quote: "Curated pieces so good, guests ask where you found them before saying hello." },
    { word: "effortless luxury.", quote: "Small everyday upgrades that quietly turn a regular Tuesday into a celebration." },
    { word: "soulful craft.", quote: "Made to outlive trends, spark joy on your shelf, and steal your heart." }
  ];
  let slideIdx = 0;
  let charIdx = slides[0].word.length;
  let deleting = false;
  function tick() {
    const current = slides[slideIdx];
    if (!deleting) {
      charIdx++;
      wordEl.textContent = current.word.slice(0, charIdx);
      if (charIdx >= current.word.length) {
        deleting = true;
        setTimeout(tick, 2400);
        return;
      }
      setTimeout(tick, 75);
    } else {
      charIdx--;
      wordEl.textContent = current.word.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        slideIdx = (slideIdx + 1) % slides.length;
        quoteEl.classList.remove("quote-fade-in");
        void quoteEl.offsetWidth;
        quoteEl.textContent = slides[slideIdx].quote;
        quoteEl.classList.add("quote-fade-in");
        setTimeout(tick, 320);
        return;
      }
      setTimeout(tick, 42);
    }
  }
  setTimeout(() => { deleting = true; tick(); }, 2600);
}
initHeroTypewriter();


function initWelcomeSplash() {
  const splash = byId("arp-welcome-splash");
  if (!splash) return;
  if (sessionStorage.getItem("arpiares_entered") === "1" || window.location.hash || window.location.search) {
    splash.remove();
    return;
  }
  document.body.style.overflow = "hidden";
  byId("enter-arpiares-btn")?.addEventListener("click", () => {
    sessionStorage.setItem("arpiares_entered", "1");
    splash.classList.add("fade-out");
    document.body.style.overflow = "";
    setTimeout(() => splash.remove(), 650);
  });
}
initWelcomeSplash();

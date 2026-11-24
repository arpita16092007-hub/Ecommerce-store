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
    renderProducts(allProducts);
  } catch (error) {
    byId("product-grid").innerHTML = "<div class=\"loading-card\">Couldn't load products. " + escapeHTML(error.message) + "<br><br>Check that your backend is running on port 5050.</div>";
    showNotice("Backend connection failed. Start your backend and refresh this page.", true);
  }
}

function renderCategories() {
  const list = byId("category-list");
  list.innerHTML = allCategories.map(c =>
    "<button class=\"category-link\" data-category=\"" + escapeHTML(c._id) + "\">◇ <span>" + escapeHTML(c.name) + "</span></button>"
  ).join("");
  document.querySelectorAll("[data-category]").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.category === selectedCategory)
  );
}

function renderProducts(products) {
  const grid = byId("product-grid");
  if (!products.length) {
    grid.innerHTML = "<div class=\"loading-card\">No products found. Try another search or category.</div>";
    return;
  }
  grid.innerHTML = products.map(p => {
    const primaryImg = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
    const safeSrc = String(primaryImg).replace(/"/g, "&quot;");
    const image = safeSrc
      ? "<img src=\"" + safeSrc + "\" alt=\"" + escapeHTML(p.name) + "\" loading=\"lazy\" onerror=\"this.onerror=null;this.parentElement.innerHTML='<span class=\\x27product-placeholder\\x27>A</span>'\">"
      : "<span class=\"product-placeholder\">A</span>";
    const desc = escapeHTML((p.description || "").slice(0, 85)) + ((p.description || "").length > 85 ? "…" : "");
    return "<article class=\"product-card\">" +
      "<div class=\"product-image\" data-view=\"" + p._id + "\">" + image + "<span class=\"image-badge\">" + escapeHTML(p.name) + "</span></div>" +
      "<div class=\"product-info\">" +
        "<h3 data-view=\"" + p._id + "\">" + escapeHTML(p.name) + "</h3>" +
        "<p>" + desc + "</p>" +
        "<div class=\"product-bottom\">" +
          "<span class=\"price\">" + money(p.price) + "</span>" +
          "<button class=\"add-button\" data-add=\"" + p._id + "\" " + (p.stock < 1 ? "disabled" : "") + ">" + (p.stock < 1 ? "OUT OF STOCK" : "＋ ADD TO BAG") + "</button>" +
        "</div>" +
      "</div>" +
    "</article>";
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

function updateAccountUI() {
  const user = getUser();
  byId("account-label").textContent = user ? user.name.trim().split(/\s+/).at(0) : "Sign in";
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
  if (!getToken()) {
    byId("cart-items").innerHTML = "<p class=\"muted\">Please sign in to view your cart.</p>";
    byId("cart-subtotal").textContent = money(0);
    return;
  }
  try {
    const data = await apiRequest("/api/cart");
    const items = data.items || [];
    byId("cart-items").innerHTML = items.length
      ? items.map(item =>
        "<div class=\"cart-row\">" +
          "<div>" +
            "<b>" + escapeHTML(item.productName) + "</b>" +
            "<small>" + money(item.price) + " each</small>" +
            "<div style=\"display:inline-flex;align-items:center;gap:8px;margin-top:6px;\">" +
              "<button type=\"button\" class=\"add-button\" style=\"padding:3px 10px;\" data-qty-id=\"" + item.productId + "\" data-qty-next=\"" + (item.quantity - 1) + "\">−</button>" +
              "<span style=\"font-weight:700;min-width:18px;text-align:center;\">" + item.quantity + "</span>" +
              "<button type=\"button\" class=\"add-button\" style=\"padding:3px 10px;\" data-qty-id=\"" + item.productId + "\" data-qty-next=\"" + (item.quantity + 1) + "\">＋</button>" +
            "</div>" +
          "</div>" +
          "<strong style=\"text-align:right;\">" +
            money(item.itemTotal) + "<br>" +
            "<button type=\"button\" class=\"text-button small\" data-remove=\"" + item.productId + "\">Remove all</button>" +
          "</strong>" +
        "</div>").join("")
      : "<p class=\"muted\">Your bag is empty. Explore the collection to add something you love.</p>";
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
    ? "Don't have an account? <button class=\"text-button\" id=\"switch-auth\">Create account</button>"
    : "Already registered? <button class=\"text-button\" id=\"switch-auth\">Sign in</button>";
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
      ? "<div class=\"detail-thumbs\">" + gallery.map((src, idx) => {
          const clean = String(src).replace(/"/g, "&quot;");
          return "<button type=\"button\" class=\"thumb-btn " + (idx === 0 ? "active" : "") + "\" data-thumb=\"" + clean + "\">" +
            "<img src=\"" + clean + "\" alt=\"" + escapeHTML(p.name) + " angle " + (idx + 1) + "\">" +
          "</button>";
        }).join("") + "</div>"
      : "";

    byId("product-detail").innerHTML = "<div class=\"detail-layout\">" +
      "<div>" +
        "<div class=\"detail-image\">" + (mainSrc ? "<img id=\"detail-main-img\" src=\"" + mainSrc + "\" alt=\"" + escapeHTML(p.name) + "\">" : "<span class=\"product-placeholder\">A</span>") + "</div>" +
        thumbsHTML +
      "</div>" +
      "<div>" +
        "<p class=\"eyebrow\">ARPIARES COLLECTION</p>" +
        "<h2>" + escapeHTML(p.name) + "</h2>" +
        "<p class=\"price\">" + money(p.price) + "</p>" +
        "<p>" + escapeHTML(p.description) + "</p>" +
        "<p class=\"small\">Availability: " + (Number(p.stock) > 0 ? p.stock + " in stock" : "Out of stock") + "</p>" +
        "<button class=\"primary-button\" data-add=\"" + p._id + "\" " + (p.stock < 1 ? "disabled" : "") + ">ADD TO BAG →</button>" +
      "</div>" +
    "</div>";
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
selectedCategory = category.dataset.category;
document.querySelectorAll("[data-category]").forEach(b => b.classList.toggle("active", b.dataset.category === selectedCategory));
const filtered = selectedCategory ? allProducts.filter(p => (p.categoryId?._id || p.categoryId) === selectedCategory) : allProducts;
renderProducts(filtered);
}
const add = e.target.closest("[data-add]");
if (add) await addToCart(add.dataset.add);
const view = e.target.closest("[data-view]");
if (view) await showProduct(view.dataset.view);
if (e.target.closest("#open-auth")) openAuth("login");
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
});
async function openOrders() {
  openModal("orders-modal");
  const box = byId("orders-list");
  if (!getToken()) {
    box.innerHTML = '<p class="muted">Please sign in to track your orders.</p>';
    return;
  }
  try {
    const data = await apiRequest("/api/orders/my-orders");
    const orders = data.orders || [];
    const steps = ["Pending", "Processing", "Shipped", "Delivered"];

    box.innerHTML = orders.length
      ? orders.map(o => {
          const isCancelled = o.orderStatus === "Cancelled";
          const currentIdx = steps.indexOf(o.orderStatus);
          const trackerHTML = isCancelled
            ? '<div style="margin-top:8px;padding:6px 10px;border-radius:8px;background:#fdecea;color:#a3442f;font-size:11px;font-weight:700;">✕ Order Cancelled</div>'
            : '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:10px;">' +
                steps.map((step, idx) => {
                  const done = idx <= currentIdx;
                  return '<div style="text-align:center;">' +
                    '<div style="height:5px;border-radius:4px;background:' + (done ? "#06271d" : "#e7d8c2") + ';margin-bottom:4px;"></div>' +
                    '<span style="font-size:10px;font-weight:' + (done ? "700" : "500") + ';color:' + (done ? "#06271d" : "#7d8178") + ';">' + step + '</span>' +
                  '</div>';
                }).join("") +
              '</div>';

          const itemsText = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");
          const orderCode = escapeHTML(String(o._id).slice(-6).toUpperCase());
          const orderDate = new Date(o.createdAt).toLocaleDateString("en-IN");

          return '<div class="cart-row" style="display:block;padding:14px 0;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
              '<b>Order #' + orderCode + '</b>' +
              '<strong>' + money(o.totalAmount) + '</strong>' +
            '</div>' +
            '<small>' + orderDate + ' · Status: <b>' + escapeHTML(o.orderStatus) + '</b></small>' +
            '<small>' + itemsText + '</small>' +
            '<small>Deliver to: ' + escapeHTML(o.deliveryAddress || "N/A") + '</small>' +
            trackerHTML +
          '</div>';
        }).join("")
      : '<p class="muted">You have no orders yet.</p>';
  } catch (err) {
    box.textContent = err.message;
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
  e.preventEvent();
  if (!getToken()) {
    byId("cart-message").textContent = "Please sign in first.";
    return;
  }
  try {
    const data = await apiRequest("/api/orders/checkout", {
      method: "POST",
      body: JSON.stringify({ deliveryAddress: byId("delivery-address").value.trim() })
    });
    byId("cart-message").textContent = data.message + ". Your order has been placed.";
    byId("delivery-address").value = "";
    await refreshCartCount();
    byId("cart-items").innerHTML = "<p class=\"muted\">Your order was placed successfully. Your bag is now empty.</p>";
    byId("cart-subtotal").textContent = money(0);
    await loadStore();
  } catch (err) {
    byId("cart-message").textContent = err.message;
  }
});
updateAccountUI();
loadStore();
refreshCartCount();

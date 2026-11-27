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

function getWishlistKey() {
  const user = typeof getUser === "function" ? getUser() : null;
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

function setSavedIds(ids) {
  localStorage.setItem(getWishlistKey(), JSON.stringify([...new Set(ids.map(String))]));
}

async function renderWishlistPage() {
  const grid = byId("wishlist-grid");
  const clearBtn = byId("clear-wishlist-btn");
  const savedIds = getSavedIds();

  if (!savedIds.length) {
    clearBtn?.classList.add("hidden");
    grid.innerHTML =
      '<div class="loading-card" style="padding:36px;">' +
        '<div style="font-size:34px;color:#c89d5c;margin-bottom:8px;">❖</div>' +
        '<h3 style="margin:0 0 6px;font:700 20px \'Playfair Display\',serif;">Your saved collection is empty</h3>' +
        '<p class="muted" style="margin:0 0 16px;">Tap the <b>❖</b> emblem on any product card in the store to curate your favorites here.</p>' +
        '<a href="index.html#catalog" class="gold-button" style="text-decoration:none;">EXPLORE COLLECTION →</a>' +
      '</div>';
    return;
  }

  try {
    const data = await apiRequest("/api/products?limit=100");
    const allProducts = data.products || [];
    const savedProducts = allProducts.filter(p => savedIds.includes(String(p._id)));

    if (!savedProducts.length) {
      setSavedIds([]);
      renderWishlistPage();
      return;
    }

    clearBtn?.classList.remove("hidden");
    grid.innerHTML = savedProducts.map(p => {
      const primaryImg = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
      const safeSrc = String(primaryImg).replace(/"/g, "&quot;");
      const catName = escapeHTML(p.categoryId?.name || "ARPIARES Collection");
      const inStock = Number(p.stock) > 0;

      return '<article class="wish-detail-card">' +
        '<div class="wish-card-media">' +
          (safeSrc ? '<img src="' + safeSrc + '" alt="' + escapeHTML(p.name) + '">' : '<span class="product-placeholder">A</span>') +
          '<span class="wish-cat-tag">❖ ' + catName + '</span>' +
        '</div>' +
        '<div class="wish-card-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
            '<h3>' + escapeHTML(p.name) + '</h3>' +
            '<strong class="price">' + money(p.price) + '</strong>' +
          '</div>' +
          '<p class="wish-desc">' + escapeHTML(p.description || "") + '</p>' +
          '<p class="small" style="margin:0 0 12px;color:' + (inStock ? "#1d5438" : "#a3442f") + ';font-weight:600;">' +
            (inStock ? "✓ In Stock (" + p.stock + " available)" : "✕ Currently Out of Stock") +
          '</p>' +
          '<div class="wish-actions">' +
            '<button type="button" class="primary-button" style="flex:1;" data-wish-bag="' + p._id + '" ' + (!inStock ? "disabled" : "") + '>' +
              (inStock ? "＋ MOVE TO BAG" : "OUT OF STOCK") +
            '</button>' +
            '<button type="button" class="logout-pill" data-wish-remove="' + p._id + '">Remove ✕</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  } catch (err) {
    byId("wish-notice").textContent = err.message;
  }
}

document.addEventListener("click", async e => {
  const rmBtn = e.target.closest("[data-wish-remove]");
  if (rmBtn) {
    const id = String(rmBtn.dataset.wishRemove);
    setSavedIds(getSavedIds().filter(item => item !== id));
    byId("wish-notice").textContent = "Removed from your saved collection.";
    await renderWishlistPage();
  }

  const bagBtn = e.target.closest("[data-wish-bag]");
  if (bagBtn) {
    if (!getToken()) {
      byId("wish-notice").textContent = "Please sign in on the storefront before adding items to your bag.";
      return;
    }
    try {
      await apiRequest("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId: bagBtn.dataset.wishBag, quantity: 1 })
      });
      byId("wish-notice").textContent = "✓ Moved to your shopping bag!";
    } catch (err) {
      byId("wish-notice").textContent = err.message;
    }
  }

  if (e.target.closest("#clear-wishlist-btn")) {
    setSavedIds([]);
    byId("wish-notice").textContent = "Saved collection cleared.";
    await renderWishlistPage();
  }
});

renderWishlistPage();

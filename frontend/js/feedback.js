const byId = id => document.getElementById(id);

const escapeHTML = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function initFeedbackPage() {
  const user = typeof getUser === "function" ? getUser() : null;
  if (user) {
    if (byId("fb-name")) byId("fb-name").value = user.name || "";
    if (byId("fb-email")) byId("fb-email").value = user.email || "";
  }

  // Load products for optional product dropdown
  try {
    const pData = await apiRequest("/api/products?limit=100");
    const select = byId("fb-product-select");
    if (select && Array.isArray(pData.products)) {
      select.innerHTML =
        '<option value="">— General / Not specific to one product —</option>' +
        pData.products.map(p => '<option value="' + escapeHTML(p.name) + '">' + escapeHTML(p.name) + '</option>').join("");
    }
  } catch {}

  await loadCommunityFeedback();
}

async function loadCommunityFeedback() {
  const list = byId("community-feedback-list");
  if (!list) return;
  try {
    const data = await apiRequest("/api/support/feedback");
    const items = data.feedbacks || [];
    if (!items.length) {
      list.innerHTML = '<p class="muted">No community reviews yet. Be the first to share your experience!</p>';
      return;
    }
    list.innerHTML = items.map(f => {
      const stars = "★".repeat(f.rating || 5) + "☆".repeat(5 - (f.rating || 5));
      const dt = new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return '<div class="order-card">' +
        '<div class="order-card-top">' +
          '<div>' +
            '<span class="order-id">' + escapeHTML(f.customerName || "Shopper") + '</span>' +
            '<span class="status-pill confirmed">' + escapeHTML(f.category || "Review") + '</span>' +
          '</div>' +
          '<span class="gold-stars">' + stars + '</span>' +
        '</div>' +
        (f.headline ? '<p class="order-items" style="margin-bottom:4px;">' + escapeHTML(f.headline) + '</p>' : '') +
        (f.productName ? '<p class="order-meta">Product: <b>' + escapeHTML(f.productName) + '</b></p>' : '') +
        '<p class="order-address" style="color:#161614;margin-bottom:8px;">' + escapeHTML(f.comment) + '</p>' +
        '<p class="order-meta" style="margin:0;">' + dt + (f.recommend ? ' · <b style="color:#1d5438;">✓ Recommends ARPIARES</b>' : '') + '</p>' +
      '</div>';
    }).join("");
  } catch (err) {
    list.innerHTML = '<p class="muted">' + escapeHTML(err.message) + '</p>';
  }
}

document.addEventListener("click", e => {
  const starBtn = e.target.closest("[data-fb-star]");
  if (starBtn) {
    const val = Number(starBtn.dataset.fbStar);
    byId("fb-rating").value = val;
    byId("fb-star-label").textContent = val + " / 5";
    document.querySelectorAll("[data-fb-star]").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.fbStar) <= val);
    });
  }
});

byId("full-feedback-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const msg = byId("fb-form-message");
  msg.textContent = "Submitting your feedback…";
  try {
    const payload = {
      sessionId: localStorage.getItem("arpiares_chat_session") || "",
      customerName: byId("fb-name").value.trim(),
      customerEmail: byId("fb-email").value.trim(),
      category: byId("fb-category").value,
      orderId: byId("fb-order-id").value.trim(),
      productName: byId("fb-product-select").value,
      rating: Number(byId("fb-rating").value || 5),
      headline: byId("fb-headline").value.trim(),
      comment: byId("fb-comment").value.trim(),
      recommend: document.querySelector('input[name="fbRecommend"]:checked')?.value !== "no"
    };
    const data = await apiRequest("/api/support/feedback", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    msg.textContent = data.message;
    byId("fb-headline").value = "";
    byId("fb-comment").value = "";
    await loadCommunityFeedback();
  } catch (err) {
    msg.textContent = err.message;
  }
});

initFeedbackPage();

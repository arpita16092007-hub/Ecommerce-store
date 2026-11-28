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

let adminProducts = [];
let adminCategories = [];
let adminOrders = [];
let stagedImages = [];

function checkAdminAccess() {
  const user = getUser();
  if (!getToken() || !user || user.role !== "admin") {
    byId("admin-message").textContent = "This account is not an admin. Admin-only actions are disabled.";
    byId("admin-message").style.color = "#a3442f";
    document.querySelectorAll("#product-form button, #category-form button, #faq-form button, #refresh-orders-btn, #refresh-support-btn").forEach(btn => {
      btn.disabled = true;
    });
    return false;
  }
  return true;
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image file"));
      img.onload = () => {
        const maxSide = 900;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const box = byId("admin-image-preview");
  if (!stagedImages.length) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = stagedImages.map((src, idx) => {
    const clean = String(src).replace(/"/g, "&quot;");
    return '<div style="position:relative;width:68px;height:68px;border:1px solid #d6b77e;border-radius:10px;background:#fff;padding:4px;">' +
      '<img src="' + clean + '" alt="Preview ' + (idx + 1) + '" style="width:100%;height:100%;object-fit:contain;">' +
      '<button type="button" data-remove-preview="' + idx + '" title="Remove photo" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:0;background:#a3442f;color:#fff;font-size:12px;cursor:pointer;line-height:1;">×</button>' +
    '</div>';
  }).join("");
}

function resetProductForm() {
  const form = byId("product-form");
  form.reset();
  byId("edit-product-id").value = "";
  stagedImages = [];
  renderImagePreviews();
  byId("product-form-heading").textContent = "Add a product";
  byId("product-submit-btn").textContent = "ADD PRODUCT →";
  byId("cancel-edit-btn").classList.add("hidden");
}

function startEditProduct(productId) {
  const p = adminProducts.find(item => item._id === productId);
  if (!p) return;

  const form = byId("product-form");
  byId("edit-product-id").value = p._id;
  form.elements.name.value = p.name || "";
  form.elements.price.value = p.price ?? "";
  form.elements.stock.value = p.stock ?? "";
  form.elements.categoryId.value = p.categoryId?._id || p.categoryId || "";
  form.elements.description.value = p.description || "";
  form.elements.imageUrl.value = "";

  stagedImages = Array.isArray(p.images) && p.images.length
    ? [...p.images]
    : (p.imageUrl ? [p.imageUrl] : []);
  renderImagePreviews();

  byId("product-form-heading").textContent = "Edit product: " + p.name;
  byId("product-submit-btn").textContent = "SAVE CHANGES →";
  byId("cancel-edit-btn").classList.remove("hidden");
  byId("product-section").scrollIntoView({ behavior: "smooth" });
}

function renderAdminOrders() {
  const ordersBox = byId("admin-orders-list");
  if (!ordersBox) return;

  const statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
  ordersBox.innerHTML = adminOrders.length
    ? adminOrders.map(o => {
        const customerName = o.userId?.name || "Customer";
        const customerEmail = o.userId?.email || "";
        const isDelivered = o.orderStatus === "Delivered";
        const orderCode = escapeHTML(String(o._id).slice(-6).toUpperCase());
        const orderDate = new Date(o.createdAt).toLocaleDateString("en-IN");
        const itemsSummary = o.items.map(i => escapeHTML(i.name) + " × " + Number(i.quantity)).join(", ");

        const optionsHTML = statuses.map(st =>
          '<option value="' + st + '" ' + (o.orderStatus === st ? "selected" : "") + '>' + st + '</option>'
        ).join("");

        return '<div class="admin-product-row" style="flex-wrap:wrap;gap:12px;">' +
          '<div style="flex:1;min-width:220px;">' +
            '<b>Order #' + orderCode + ' — ' + money(o.totalAmount) + '</b>' +
            '<small>' + escapeHTML(customerName) + ' (' + escapeHTML(customerEmail) + ') · ' + orderDate + '</small>' +
            '<small>Items: ' + itemsSummary + '</small>' +
            '<small>Address: ' + escapeHTML(o.deliveryAddress || "") + '</small>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<select data-order-status="' + o._id + '" style="padding:8px 10px;border:1px solid #e7d8c2;border-radius:10px;background:#fffaf2;font:600 12px \'DM Sans\';">' +
              optionsHTML +
            '</select>' +
            '<button type="button" class="add-button" data-mark-delivered="' + o._id + '" ' + (isDelivered ? 'disabled style="opacity:0.6;"' : '') + '>' +
              (isDelivered ? "✓ Delivered" : "Mark Delivered") +
            '</button>' +
          '</div>' +
        '</div>';
      }).join("")
    : '<p class="muted">No customer orders placed yet.</p>';
}

async function loadSupportAdmin() {
  if (!getToken() || getUser()?.role !== "admin") return;
  try {
    const [faqData, overview] = await Promise.all([
      apiRequest("/api/support/faq"),
      apiRequest("/api/support/admin/overview")
    ]);

    const faqs = faqData.faqs || [];
    const unanswered = overview.unanswered || [];
    const sessions = overview.sessions || [];

    if (byId("stat-faqs")) byId("stat-faqs").textContent = faqs.length;

    if (byId("admin-unanswered-list")) {
      byId("admin-unanswered-list").innerHTML = unanswered.length
        ? unanswered.map(q => {
            const isOpen = q.status === "Open";
            return '<div class="admin-product-row" style="display:block;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;">' +
                '<b>' + escapeHTML(q.question) + '</b>' +
                '<span class="status-pill ' + (isOpen ? "cancelled" : "delivered") + '">' + escapeHTML(q.status) + ' · Score ' + q.bestScore + '</span>' +
              '</div>' +
              '<small>Asked by ' + escapeHTML(q.customerName || "Guest") + ' · ' + new Date(q.createdAt).toLocaleString("en-IN") + '</small>' +
              (isOpen
                ? '<div style="display:grid;gap:8px;margin-top:10px;">' +
                    '<input type="text" id="reply-input-' + q._id + '" placeholder="Type human support reply…">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
                      '<label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;">' +
                        '<input type="checkbox" id="add-faq-' + q._id + '" checked style="width:auto;"> Also add Q&amp;A to FAQ knowledge base' +
                      '</label>' +
                      '<button type="button" class="add-button" data-resolve-question="' + q._id + '">Send Reply →</button>' +
                    '</div>' +
                  '</div>'
                : '<p style="font-size:12px;color:#06271d;margin:8px 0 0;"><b>Agent Reply:</b> ' + escapeHTML(q.adminReply) + '</p>') +
            '</div>';
          }).join("")
        : '<p class="muted">No unanswered questions right now.</p>';
    }

    if (byId("admin-chats-list")) {
      byId("admin-chats-list").innerHTML = sessions.length
        ? sessions.map(s => {
            const msgsHTML = (s.messages || []).map(m =>
              '<div style="font-size:12px;padding:4px 0;border-bottom:1px dotted #e7d8c2;">' +
                '<b>' + (m.role === "user" ? "Customer" : (m.role === "admin" ? "Human Agent" : "AI Bot")) + ':</b> ' +
                escapeHTML(m.text) +
              '</div>'
            ).join("");
            return '<details class="admin-product-row" style="display:block;">' +
              '<summary style="cursor:pointer;font-weight:600;">' +
                escapeHTML(s.customerName || "Guest") + ' · ' + (s.messages || []).length + ' messages' +
                (s.needsHuman ? ' <span style="color:#a3442f;">(Needs Human)</span>' : '') +
              '</summary>' +
              '<div style="margin-top:10px;padding-left:10px;">' + msgsHTML + '</div>' +
            '</details>';
          }).join("")
        : '<p class="muted">No customer chat sessions recorded yet.</p>';
    }

    if (byId("admin-faq-list")) {
      byId("admin-faq-list").innerHTML = faqs.length
        ? faqs.map(f =>
            '<div class="admin-product-row">' +
              '<div><b>' + escapeHTML(f.title) + '</b><small>' + escapeHTML(f.content.slice(0, 140)) + (f.content.length > 140 ? "…" : "") + '</small></div>' +
              '<button type="button" class="text-button" data-delete-faq="' + escapeHTML(f._id) + '" style="color:#a3442f;">Delete</button>' +
            '</div>'
          ).join("")
        : '<p class="muted">Knowledge base is empty. Upload your store FAQs above.</p>';
    }
  } catch (err) {
    byId("admin-message").textContent = err.message;
  }
}

async function loadAdmin() {
  try {
    const [productData, categoryData] = await Promise.all([
      apiRequest("/api/products?limit=100"),
      apiRequest("/api/categories")
    ]);

    adminProducts = productData.products || [];
    adminCategories = categoryData.categories || [];

    byId("stat-products").textContent = adminProducts.length;
    byId("stat-categories").textContent = adminCategories.length;
    byId("stat-stock").textContent = adminProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);

    const select = byId("admin-category-select");
    const currentCat = select.value;
    select.innerHTML = '<option value="">Choose category</option>' +
      adminCategories.map(c => '<option value="' + escapeHTML(c._id) + '">' + escapeHTML(c.name) + '</option>').join("");
    if (currentCat) select.value = currentCat;

    byId("admin-category-list").innerHTML = adminCategories.map(c =>
      '<span class="category-chip">' + escapeHTML(c.name) + '</span>'
    ).join("");

    byId("admin-product-list").innerHTML = adminProducts.map(p => {
      const thumb = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
      const cleanThumb = String(thumb).replace(/"/g, "&quot;");
      const imgTag = cleanThumb
        ? '<img src="' + cleanThumb + '" alt="' + escapeHTML(p.name) + '" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">'
        : '<span class="brand-mark" style="display:flex;width:56px;height:56px;align-items:center;justify-content:center;">A</span>';
      const angleCount = Array.isArray(p.images) && p.images.length > 1 ? " · " + p.images.length + " photos" : "";

      return '<div class="admin-product-row">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' +
          imgTag +
          '<div><b>' + escapeHTML(p.name) + '</b><small>' +
            escapeHTML(p.categoryId?.name || "Uncategorized") + " · " + money(p.price) + " · Stock: " + p.stock + angleCount +
          '</small></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="text-button" data-edit-product="' + escapeHTML(p._id) + '">Edit</button>' +
          '<button type="button" class="text-button" data-delete-product="' + escapeHTML(p._id) + '" style="color:#a3442f;">Delete</button>' +
        '</div>' +
      '</div>';
    }).join("");

    if (getToken() && getUser()?.role === "admin") {
      const orderData = await apiRequest("/api/orders");
      adminOrders = orderData.orders || [];
      renderAdminOrders();
      await loadSupportAdmin();
    }
  } catch (err) {
    byId("admin-message").textContent = err.message;
  }
}
byId("faq-file-input")?.addEventListener("change", async e => {
const file = e.target.files?.[0];
if (!file) return;
const text = await file.text();
byId("faq-content-input").value = text;
const titleInput = byId("faq-form")?.elements?.title;
if (titleInput && !titleInput.value.trim()) {
titleInput.value = file.name.replace(/.[^.]+$/, "");
}
});
byId("faq-form")?.addEventListener("submit", async e => {
e.preventDefault();
const fd = new FormData(e.target);
byId("admin-message").textContent = "Generating Gemini embeddings and indexing FAQ…";
try {
const data = await apiRequest("/api/support/faq", {
method: "POST",
body: JSON.stringify({
title: fd.get("title"),
content: fd.get("content")
})
});
e.target.reset();
byId("admin-message").textContent = data.message;
await loadSupportAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
});
byId("product-file-input").addEventListener("change", async e => {
const files = Array.from(e.target.files || []);
if (!files.length) return;
byId("admin-message").textContent = "Processing selected photos…";
try {
for (const file of files) {
const compressed = await compressImageFile(file);
stagedImages.push(compressed);
}
renderImagePreviews();
byId("admin-message").textContent = files.length + " photo(s) ready.";
} catch (err) {
byId("admin-message").textContent = err.message;
}
e.target.value = "";
});
byId("product-form").addEventListener("submit", async e => {
e.preventDefault();
const fd = new FormData(e.target);
const editId = String(fd.get("productId") || "").trim();
const typedUrls = String(fd.get("imageUrl") || "")
.split(",")
.map(s => s.trim())
.filter(Boolean);
const combinedImages = [...stagedImages, ...typedUrls];
const payload = {
name: fd.get("name"),
price: Number(fd.get("price")),
stock: Number(fd.get("stock")),
categoryId: fd.get("categoryId"),
description: fd.get("description"),
imageUrl: combinedImages.at(0) || "",
images: combinedImages
};
try {
if (editId) {
await apiRequest("/api/products/" + editId, {
method: "PUT",
body: JSON.stringify(payload)
});
byId("admin-message").textContent = "Product updated successfully.";
} else {
await apiRequest("/api/products", {
method: "POST",
body: JSON.stringify(payload)
});
byId("admin-message").textContent = "Product added successfully.";
}
resetProductForm();
await loadAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
});
byId("category-form").addEventListener("submit", async e => {
e.preventDefault();
const fd = new FormData(e.target);
try {
await apiRequest("/api/categories", {
method: "POST",
body: JSON.stringify({
name: fd.get("name"),
description: fd.get("description")
})
});
e.target.reset();
byId("admin-message").textContent = "Category added.";
await loadAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
});
document.addEventListener("change", async e => {
const statusSelect = e.target.closest("[data-order-status]");
if (statusSelect) {
try {
const data = await apiRequest("/api/orders/" + statusSelect.dataset.orderStatus + "/status", {
method: "PUT",
body: JSON.stringify({ orderStatus: statusSelect.value })
});
byId("admin-message").textContent = data.message;
await loadAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
}
});
document.addEventListener("click", async e => {
const rmPreview = e.target.closest("[data-remove-preview]");
if (rmPreview) {
stagedImages.splice(Number(rmPreview.dataset.removePreview), 1);
renderImagePreviews();
}
const editBtn = e.target.closest("[data-edit-product]");
if (editBtn) {
startEditProduct(editBtn.dataset.editProduct);
}
if (e.target.closest("#cancel-edit-btn")) {
resetProductForm();
byId("admin-message").textContent = "";
}
const delBtn = e.target.closest("[data-delete-product]");
if (delBtn) {
try {
await apiRequest("/api/products/" + delBtn.dataset.deleteProduct, { method: "DELETE" });
byId("admin-message").textContent = "Product removed.";
await loadAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
}
const deliveredBtn = e.target.closest("[data-mark-delivered]");
if (deliveredBtn) {
try {
const data = await apiRequest("/api/orders/" + deliveredBtn.dataset.markDelivered + "/status", {
method: "PUT",
body: JSON.stringify({ orderStatus: "Delivered" })
});
byId("admin-message").textContent = data.message;
await loadAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
}
const resolveBtn = e.target.closest("[data-resolve-question]");
if (resolveBtn) {
const qId = resolveBtn.dataset.resolveQuestion;
const replyVal = byId("reply-input-" + qId)?.value.trim();
const addToFaq = Boolean(byId("add-faq-" + qId)?.checked);
if (!replyVal) {
byId("admin-message").textContent = "Please enter a reply first.";
return;
}
try {
const data = await apiRequest("/api/support/admin/resolve/" + qId, {
method: "POST",
body: JSON.stringify({ adminReply: replyVal, addToFaq })
});
byId("admin-message").textContent = data.message;
await loadSupportAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
}
const delFaqBtn = e.target.closest("[data-delete-faq]");
if (delFaqBtn) {
try {
await apiRequest("/api/support/faq/" + delFaqBtn.dataset.deleteFaq, { method: "DELETE" });
byId("admin-message").textContent = "FAQ entry removed.";
await loadSupportAdmin();
} catch (err) {
byId("admin-message").textContent = err.message;
}
}
if (e.target.closest("#refresh-orders-btn")) {
await loadAdmin();
byId("admin-message").textContent = "Orders refreshed.";
}
if (e.target.closest("#refresh-support-btn")) {
await loadSupportAdmin();
byId("admin-message").textContent = "Support logs refreshed.";
}
if (e.target.closest("#admin-logout")) {
localStorage.removeItem("arpiares_token");
localStorage.removeItem("arpiares_user");
window.location.href = "index.html";
}
});
checkAdminAccess();
loadAdmin();






/* Authoritative Admin Sidebar Panel Switcher & Active Glow */
(function initAdminSidebarSwitcher() {
  function bindSidebar() {
    const sidebar = document.querySelector(".admin-sidebar");
    const main = document.querySelector(".admin-main");
    if (!sidebar || !main) return;

    const allCards = Array.from(main.children).filter(
      (el) => el.matches("section, .admin-card, .admin-panel") && !el.classList.contains("admin-kpis")
    );

    const keywordsByTab = {
      orders: ["order", "customer order"],
      support: ["support", "faq", "ai care", "inquiry", "message"],
      products: ["product", "catalog", "inventory", "add new product"],
      categories: ["categor", "collection"]
    };

    function activateTab(tab) {
      const buttons = Array.from(sidebar.querySelectorAll(".admin-nav"));
      buttons.forEach((b) => {
        const isMatch = b.dataset.tab === tab;
        b.classList.toggle("active", isMatch);
        b.setAttribute("aria-selected", isMatch ? "true" : "false");
      });

      const keys = keywordsByTab[tab] || [tab];
      const matched = allCards.filter((card) => {
        const attr = (card.dataset.panel || card.dataset.tab || card.id || "").toLowerCase();
        const heading = (card.querySelector("h1, h2, h3")?.textContent || "").toLowerCase();
        return keys.some((k) => attr.includes(k) || heading.includes(k));
      });

      if (matched.length > 0) {
        allCards.forEach((card) => {
          const show = matched.includes(card);
          card.style.display = show ? "" : "none";
          card.hidden = !show;
        });
      }
    }

    // Event delegation on sidebar so clicking icon, text, or button always triggers glow + switch
    sidebar.addEventListener("click", (e) => {
      const btn = e.target.closest(".admin-nav");
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      activateTab(btn.dataset.tab);
    }, true);

    const initialBtn = sidebar.querySelector(".admin-nav.active") || sidebar.querySelector(".admin-nav");
    if (initialBtn) activateTab(initialBtn.dataset.tab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSidebar);
  } else {
    bindSidebar();
  }
})();

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
let stagedImages = [];

function checkAdminAccess() {
  const user = getUser();
  if (!getToken() || !user || user.role !== "admin") {
    byId("admin-message").textContent = "This account is not an admin. Admin-only actions are disabled.";
    byId("admin-message").style.color = "#a3442f";
    document.querySelectorAll("#product-form button, #category-form button").forEach(btn => {
      btn.disabled = true;
    });
    return false;
  }
  return true;
}

// Resize & compress phone/Mac photos cleanly for fast upload
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
    return `<div style="position:relative;width:68px;height:68px;border:1px solid #d6b77e;border-radius:10px;background:#fff;padding:4px;">
      <img src="${clean}" alt="Preview ${idx + 1}" style="width:100%;height:100%;object-fit:contain;">
      <button type="button" data-remove-preview="${idx}" title="Remove photo" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:0;background:#a3442f;color:#fff;font-size:12px;cursor:pointer;line-height:1;">×</button>
    </div>`;
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

  byId("product-form-heading").textContent = `Edit product: ${p.name}`;
  byId("product-submit-btn").textContent = "SAVE CHANGES →";
  byId("cancel-edit-btn").classList.remove("hidden");
  byId("product-section").scrollIntoView({ behavior: "smooth" });
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
      adminCategories.map(c => `<option value="${escapeHTML(c._id)}">${escapeHTML(c.name)}</option>`).join("");
    if (currentCat) select.value = currentCat;

    byId("admin-category-list").innerHTML = adminCategories.map(c =>
      `<span class="category-chip">${escapeHTML(c.name)}</span>`
    ).join("");

    byId("admin-product-list").innerHTML = adminProducts.map(p => {
      const thumb = (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "";
      const cleanThumb = String(thumb).replace(/"/g, "&quot;");
      const imgTag = cleanThumb
        ? `<img src="${cleanThumb}" alt="${escapeHTML(p.name)}" style="width:48px;height:48px;object-fit:contain;background:#fff;border:1px solid #e7d8c2;border-radius:8px;padding:3px;">`
        : `<div style="width:48px;height:48px;border-radius:8px;background:#e9dcc7;display:grid;place-items:center;font-weight:700;">A</div>`;
      const angleCount = Array.isArray(p.images) && p.images.length > 1 ? ` · ${p.images.length} photos` : "";
      return `<div class="admin-product-row">
        <div style="display:flex;align-items:center;gap:12px;">
          ${imgTag}
          <div>
            <b>${escapeHTML(p.name)}</b>
            <small>${escapeHTML(p.categoryId?.name || "Uncategorized")} · ${money(p.price)} · Stock: ${p.stock}${angleCount}</small>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
          <button type="button" class="add-button" style="padding:7px 13px;" data-edit-product="${p._id}">Edit</button>
          <button type="button" class="text-button" style="color:#a3442f;" data-delete-product="${p._id}">Delete</button>
        </div>
      </div>`;
    }).join("");
  } catch (err) {
    byId("admin-message").textContent = err.message;
  }
}

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
    byId("admin-message").textContent = `${files.length} photo(s) ready.`;
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
      await apiRequest(`/api/products/${editId}`, {
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
      await apiRequest(`/api/products/${delBtn.dataset.deleteProduct}`, { method: "DELETE" });
      byId("admin-message").textContent = "Product removed.";
      await loadAdmin();
    } catch (err) {
      byId("admin-message").textContent = err.message;
    }
  }

  if (e.target.closest("#admin-logout")) {
    localStorage.removeItem("arpiares_token");
    localStorage.removeItem("arpiares_user");
    window.location.href = "index.html";
  }
});

checkAdminAccess();
loadAdmin();

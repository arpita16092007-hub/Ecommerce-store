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

const CARD_THEMES = [
  { bg: "linear-gradient(145deg, #06271d 0%, #104535 100%)", text: "#fff4df", accent: "#e5c17b", icon: "✦" },
  { bg: "linear-gradient(145deg, #f5e8d3 0%, #e7d1ae 100%)", text: "#161614", accent: "#06271d", icon: "◈" },
  { bg: "linear-gradient(145deg, #2b1d14 0%, #4a3122 100%)", text: "#fff4df", accent: "#e5c17b", icon: "✧" },
  { bg: "linear-gradient(145deg, #1b312a 0%, #2b4d42 100%)", text: "#fff4df", accent: "#f2d19b", icon: "❖" },
  { bg: "linear-gradient(145deg, #efe2cc 0%, #dfcaa6 100%)", text: "#161614", accent: "#7c4d1e", icon: "✺" }
];

function setupRevealObserver() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal-card").forEach(el => observer.observe(el));
}

async function loadUniqueCategories() {
  const grid = byId("unique-cat-grid");
  try {
    const [catData, prodData] = await Promise.all([
      apiRequest("/api/categories"),
      apiRequest("/api/products?limit=100")
    ]);
    const categories = catData.categories || [];
    const products = prodData.products || [];

    if (!categories.length) {
      grid.innerHTML = '<div class="loading-card">No categories available yet.</div>';
      return;
    }

    grid.innerHTML = categories.map((cat, idx) => {
      const theme = CARD_THEMES[idx % CARD_THEMES.length];
      const catProducts = products.filter(p => String(p.categoryId?._id || p.categoryId || "") === String(cat._id));
      const previewImgs = catProducts
        .map(p => (Array.isArray(p.images) && p.images.at(0)) || p.imageUrl || "")
        .filter(Boolean)
        .slice(0, 3);

      const minPrice = catProducts.length
        ? Math.min(...catProducts.map(p => Number(p.price || 0)))
        : 0;

      const thumbsHTML = previewImgs.length
        ? '<div class="cat-preview-strip">' +
            previewImgs.map(src =>
              '<div class="cat-mini-thumb"><img src="' + String(src).replace(/"/g, "&quot;") + '" alt="' + escapeHTML(cat.name) + '"></div>'
            ).join("") +
          '</div>'
        : '<div class="cat-empty-art">' + theme.icon + '</div>';

      const desc = escapeHTML(cat.description || ("Explore our handpicked " + cat.name + " selection."));

      return '<article class="unique-cat-card reveal-card" style="background:' + theme.bg + ';color:' + theme.text + ';animation-delay:' + (idx * 90) + 'ms;">' +
        '<div class="cat-card-header">' +
          '<span class="cat-badge-pill" style="border-color:' + theme.accent + ';color:' + theme.accent + ';">' + theme.icon + ' ' + catProducts.length + ' ITEMS</span>' +
          (minPrice > 0 ? '<span class="cat-price-tag" style="color:' + theme.accent + ';">From ' + money(minPrice) + '</span>' : '') +
        '</div>' +
        '<h2>' + escapeHTML(cat.name) + '</h2>' +
        '<p class="cat-card-desc">' + desc + '</p>' +
        thumbsHTML +
        '<a class="cat-explore-cta" href="index.html?category=' + encodeURIComponent(cat._id) + '#catalog" style="background:' + theme.accent + ';color:#06271d;">' +
          'Explore ' + escapeHTML(cat.name) + ' →' +
        '</a>' +
      '</article>';
    }).join("");

    setupRevealObserver();
  } catch (err) {
    byId("cat-page-notice").textContent = err.message;
  }
}

loadUniqueCategories();

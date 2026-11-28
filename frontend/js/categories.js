var byId = function (id) { return document.getElementById(id); };

var escapeHTML = function (value) {
  return String(value == null ? "" : value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
};

var money = function (value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
};

var CARD_THEMES = [
  { bg: "linear-gradient(145deg, #06271d 0%, #104535 100%)", text: "#fff4df", accent: "#e5c17b", btnText: "#06271d", icon: "✦" },
  { bg: "linear-gradient(145deg, #f5e8d3 0%, #e7d1ae 100%)", text: "#161614", accent: "#06271d", btnText: "#fff4df", icon: "◈" },
  { bg: "linear-gradient(145deg, #2b1d14 0%, #4a3122 100%)", text: "#fff4df", accent: "#e5c17b", btnText: "#06271d", icon: "✧" },
  { bg: "linear-gradient(145deg, #1b312a 0%, #2b4d42 100%)", text: "#fff4df", accent: "#f2d19b", btnText: "#06271d", icon: "❖" },
  { bg: "linear-gradient(145deg, #efe2cc 0%, #dfcaa6 100%)", text: "#161614", accent: "#7c4d1e", btnText: "#fff4df", icon: "✺" }
];

function setupRevealObserver() {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal-card").forEach(function (el) { observer.observe(el); });
}

async function loadUniqueCategories() {
  var grid = byId("unique-cat-grid");
  try {
    var results = await Promise.all([
      apiRequest("/api/categories"),
      apiRequest("/api/products?limit=100")
    ]);
    var categories = results[0].categories || [];
    var products = results[1].products || [];

    if (!categories.length) {
      grid.innerHTML = '<div class="loading-card">No categories available yet.</div>';
      return;
    }

    grid.innerHTML = categories.map(function (cat, idx) {
      var theme = CARD_THEMES[idx % CARD_THEMES.length];
      var isBeauty = String(cat.name || "").toLowerCase().indexOf("beauty") !== -1;

      var catProducts = products.filter(function (p) {
        return String((p.categoryId && p.categoryId._id) || p.categoryId || "") === String(cat._id);
      });

      var previewImgs = catProducts
        .map(function (p) { return (Array.isArray(p.images) && p.images[0]) || p.imageUrl || ""; })
        .filter(Boolean)
        .slice(0, 3);

      var minPrice = catProducts.length
        ? Math.min.apply(null, catProducts.map(function (p) { return Number(p.price || 0); }))
        : 0;

      var thumbsHTML = previewImgs.length
        ? '<div class="cat-preview-strip">' +
            previewImgs.map(function (src) {
              return '<div class="cat-mini-thumb"><img src="' + String(src).split('"').join("&quot;") + '" alt="' + escapeHTML(cat.name) + '"></div>';
            }).join("") +
          '</div>'
        : '<div class="cat-empty-art">' + theme.icon + '</div>';

      var desc = escapeHTML(cat.description || ("Explore our handpicked " + cat.name + " selection."));

      var ctaStyle = isBeauty
        ? "background:linear-gradient(135deg, #8e3b58 0%, #69233c 100%);color:#fff8eb;border:1px solid #d98aa4;box-shadow:0 8px 20px rgba(105,35,60,0.28);"
        : "background:" + theme.accent + ";color:" + theme.btnText + ";";

      var ctaLabel = isBeauty
        ? "✦ Discover Beauty Rituals →"
        : "Explore " + escapeHTML(cat.name) + " →";

      return '<article class="unique-cat-card reveal-card" style="background:' + theme.bg + ';color:' + theme.text + ';animation-delay:' + (idx * 90) + 'ms;">' +
        '<div class="cat-card-header">' +
          '<span class="cat-badge-pill" style="border-color:' + theme.accent + ';color:' + theme.accent + ';">' + theme.icon + ' ' + catProducts.length + ' ITEMS</span>' +
          (minPrice > 0 ? '<span class="cat-price-tag" style="color:' + theme.accent + ';">From ' + money(minPrice) + '</span>' : '') +
        '</div>' +
        '<h2>' + escapeHTML(cat.name) + '</h2>' +
        '<p class="cat-card-desc">' + desc + '</p>' +
        thumbsHTML +
        '<a class="cat-explore-cta" href="index.html?category=' + encodeURIComponent(cat._id) + '#catalog" style="' + ctaStyle + '">' +
          ctaLabel +
        '</a>' +
      '</article>';
    }).join("");

    setupRevealObserver();
  } catch (err) {
    byId("cat-page-notice").textContent = err.message;
  }
}

loadUniqueCategories();

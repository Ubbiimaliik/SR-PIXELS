/* ============================================================
   SR PIXELS — PRODUCTS PAGE JAVASCRIPT
   ============================================================ */

// Global State
let productPageContent = {};
let dynamicProducts = [];
let enquiryList = JSON.parse(sessionStorage.getItem('enquiryList')) || [];

document.addEventListener("DOMContentLoaded", async () => {
  // Fetch dynamic content and products
  await fetchDynamicData();

  // ---- HAMBURGER MENU ----
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // ---- FILTER BUTTONS ----
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.filter);
    });
  });

  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // ---- ENQUIRY LIST WIDGET & PANEL LOGIC ----
  const widget = document.getElementById("enquiry-widget");
  const panel = document.getElementById("enquiry-panel");
  const overlay = document.getElementById("enquiry-panel-overlay");
  const closeBtn = document.getElementById("enquiry-close-btn");
  const proceedBtn = document.getElementById("proceed-enquiry-btn");

  if (widget) {
    widget.addEventListener("click", () => {
      panel.classList.add("active");
      overlay.classList.add("active");
    });
  }

  if (closeBtn && overlay) {
    const closePanel = () => {
      panel.classList.remove("active");
      overlay.classList.remove("active");
    };
    closeBtn.addEventListener("click", closePanel);
    overlay.addEventListener("click", closePanel);
  }

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (enquiryList.length === 0) return;
      sessionStorage.setItem('enquiryList', JSON.stringify(enquiryList));
      window.location.href = "index.html#enquiry";
    });
  }

  // Initialize badge and panel
  updateEnquiryUI();
});

async function fetchDynamicData() {
  try {
    const timestamp = new Date().getTime();

    // Fetch Products
    const prodRes = await fetch(`https://sr-pixels-kle9.onrender.com/api/products?t=${timestamp}`);
    if (prodRes.ok) {
      dynamicProducts = await prodRes.json();
      renderProducts("all");
    }

    // Fetch Page Content
    const contentRes = await fetch(`https://sr-pixels-kle9.onrender.com/api/products-content?t=${timestamp}`);
    if (contentRes.ok) {
      productPageContent = await contentRes.json();
      applyProductContent();
    }
  } catch (e) {
    console.error("Error fetching dynamic products data:", e);
  }
}

function applyProductContent() {
  const c = productPageContent;
  if (!c) return;
  const timestamp = new Date().getTime();

  const heroTitle = document.querySelector(".products-hero-title");
  if (heroTitle && c.heroTitle) heroTitle.innerHTML = c.heroTitle;

  const heroSub = document.querySelector(".products-hero-sub");
  if (heroSub && c.heroSub) heroSub.textContent = c.heroSub;

  const featuredTitle = document.querySelector(".featured-section .section-title");
  if (featuredTitle && c.featuredTitle) featuredTitle.textContent = c.featuredTitle;

  const featLargeTitle = document.querySelector(".featured-large .featured-card-title");
  if (featLargeTitle && c.featuredLargeTitle) featLargeTitle.textContent = c.featuredLargeTitle;

  const featLargeDesc = document.querySelector(".featured-large .featured-card-desc");
  if (featLargeDesc && c.featuredLargeDesc) featLargeDesc.textContent = c.featuredLargeDesc;

  // Images
  const largeImg = document.querySelector(".featured-large .featured-img-wrapper img");
  if (largeImg) {
    // Only update if not already set by this script or handle error
    const src = `https://sr-pixels-kle9.onrender.com/api/content-images/featuredLarge?t=${timestamp}`;
    largeImg.src = src;
  }

  // Small Card 1
  const smallCards = document.querySelectorAll(".featured-small");
  if (smallCards[0]) {
    const t = smallCards[0].querySelector(".featured-card-title");
    const d = smallCards[0].querySelector(".featured-card-desc");
    const img = smallCards[0].querySelector(".featured-img-wrapper img");
    if (t && c.featuredSmall1Title) t.textContent = c.featuredSmall1Title;
    if (d && c.featuredSmall1Tag) d.textContent = c.featuredSmall1Tag;
    if (img) img.src = `https://sr-pixels-kle9.onrender.com/api/content-images/featuredSmall1?t=${timestamp}`;
  }
  // Small Card 2
  if (smallCards[1]) {
    const t = smallCards[1].querySelector(".featured-card-title");
    const d = smallCards[1].querySelector(".featured-card-desc");
    const img = smallCards[1].querySelector(".featured-img-wrapper img");
    if (t && c.featuredSmall2Title) t.textContent = c.featuredSmall2Title;
    if (d && c.featuredSmall2Tag) d.textContent = c.featuredSmall2Tag;
    if (img) img.src = `https://sr-pixels-kle9.onrender.com/api/content-images/featuredSmall2?t=${timestamp}`;
  }

  const collectionTitle = document.querySelector(".collection-title");
  if (collectionTitle && c.collectionTitle) collectionTitle.textContent = c.collectionTitle;

  const collectionDesc = document.querySelector(".collection-desc");
  if (collectionDesc && c.collectionDesc) collectionDesc.textContent = c.collectionDesc;

  const catalogTitle = document.querySelector(".products-catalog-section .section-title");
  if (catalogTitle && c.catalogTitle) catalogTitle.textContent = c.catalogTitle;

  const ctaTitle = document.querySelector(".cta-title");
  if (ctaTitle && c.ctaTitle) ctaTitle.textContent = c.ctaTitle;

  const ctaDesc = document.querySelector(".cta-desc");
  if (ctaDesc && c.ctaDesc) ctaDesc.textContent = c.ctaDesc;
}

function renderProducts(filter) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const filtered = filter === "all"
    ? dynamicProducts
    : dynamicProducts.filter(p => p.category === filter);

  grid.innerHTML = "";

  filtered.forEach((product, i) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.id = product._id;
    card.style.animationDelay = `${i * 0.07}s`;

    const imgSrc = `https://sr-pixels-kle9.onrender.com/api/products/${product._id}/image`;

    card.innerHTML = `
      <div class="product-card-img">
        ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
        <img src="${imgSrc}" alt="${product.title}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${product.title}</h3>
        <p class="product-card-desc">${product.desc}</p>
        <div class="product-card-footer">
          <button class="product-card-enquire" onclick="addToEnquiryList('${product._id}')">+ Add to Enquiry List</button>
          <span class="product-card-category">${product.category}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

window.addToEnquiryList = function (productId) {
  const product = dynamicProducts.find(p => p._id === productId);
  if (!product) return;

  if (!enquiryList.find(p => p._id === productId)) {
    enquiryList.push(product);
    sessionStorage.setItem('enquiryList', JSON.stringify(enquiryList));
    updateEnquiryUI();

    // Minimal light effect
    const card = document.getElementById(productId);
    if (card) {
      const btn = card.querySelector(".product-card-enquire");
      const widget = document.getElementById("enquiry-widget");

      card.classList.add("item-added");
      if (btn) {
        btn.classList.add("added");
        btn.textContent = "✓ Added to List";
      }
      if (widget) {
        widget.classList.add("pulse");
        setTimeout(() => widget.classList.remove("pulse"), 500);
      }

      setTimeout(() => {
        card.classList.remove("item-added");
        if (btn) {
          btn.classList.remove("added");
          btn.textContent = "+ Add to Enquiry List";
        }
      }, 2000);
    }
  }
};

window.removeFromEnquiryList = function (productId) {
  enquiryList = enquiryList.filter(p => p._id !== productId);
  sessionStorage.setItem('enquiryList', JSON.stringify(enquiryList));
  updateEnquiryUI();
};

function updateEnquiryUI() {
  const badge = document.getElementById("enquiry-badge");
  const body = document.getElementById("enquiry-panel-body");

  if (badge) badge.textContent = enquiryList.length;

  if (body) {
    if (enquiryList.length === 0) {
      body.innerHTML = '<p class="enquiry-empty-msg">Your list is empty. Add products to enquire about them.</p>';
    } else {
      body.innerHTML = enquiryList.map(item => `
        <div class="enquiry-item">
          <img src="https://sr-pixels-kle9.onrender.com/api/products/${item._id}/image" alt="${item.title}" class="enquiry-item-img" />
          <div class="enquiry-item-info">
            <div class="enquiry-item-title">${item.title}</div>
            <div class="enquiry-item-cat">${item.category}</div>
          </div>
          <button class="enquiry-item-remove" onclick="removeFromEnquiryList('${item._id}')">&times;</button>
        </div>
      `).join('');
    }
  }
}

// Global function for footer filter links
window.filterByCategory = function (category) {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(b => {
    b.classList.remove("active");
    if (b.dataset.filter === category) b.classList.add("active");
  });
  renderProducts(category);
}

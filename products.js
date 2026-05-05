/* ============================================================
   SR PIXELS — PRODUCTS PAGE JAVASCRIPT
   ============================================================ */

// Product Data
const PRODUCTS = [
  {
    id: "prod-brochures",
    title: "Corporate Brochures",
    desc: "High-end corporate portfolios and brochures on premium coated stock paper.",
    category: "printing",
    image: "img/brochures.png",
    badge: "Popular"
  },
  {
    id: "prod-letterheads",
    title: "Letterheads",
    desc: "Official business stationery on premium quality bond paper with customizable layouts.",
    category: "printing",
    image: "img/letterheads.png",
    badge: null
  },
  {
    id: "prod-envelopes",
    title: "Envelopes",
    desc: "Custom printed envelopes built for professional corporate correspondence.",
    category: "printing",
    image: "img/envelopes.png",
    badge: null
  },
  {
    id: "prod-folders",
    title: "Presentation Folders",
    desc: "Professional document organization with customized branded folder designs.",
    category: "printing",
    image: "img/presentation-folders.png",
    badge: null
  },
  {
    id: "prod-business-cards",
    title: "Business Cards",
    desc: "Premium visiting cards with embossing, foiling, and specialty finishes available.",
    category: "branding",
    image: "img/business-cards.png",
    badge: "Best Seller"
  },
  {
    id: "prod-led-signs",
    title: "LED Sign Boards",
    desc: "Custom illuminated signage for storefronts, offices, and corporate events.",
    category: "advertising",
    image: "img/led-signs.png",
    badge: "Premium"
  },
  {
    id: "prod-banners",
    title: "Banner Displays",
    desc: "Roll-up banners, flex banners, and standee displays for events and exhibitions.",
    category: "events",
    image: "img/banner-displays.png",
    badge: null
  },
  {
    id: "prod-id-cards",
    title: "ID Cards & Badges",
    desc: "Professional employee ID cards, access badges, and lanyards with custom branding.",
    category: "branding",
    image: "img/business-cards.png",
    badge: null
  },
  {
    id: "prod-stickers",
    title: "Stickers & Labels",
    desc: "Custom die-cut stickers, product labels, and packaging decals in any shape or size.",
    category: "printing",
    image: "img/brochures.png",
    badge: null
  },
  {
    id: "prod-posters",
    title: "Posters & Flyers",
    desc: "High-resolution posters and promotional flyers for campaigns and event marketing.",
    category: "advertising",
    image: "img/banner-displays.png",
    badge: null
  },
  {
    id: "prod-backdrop",
    title: "Event Backdrops",
    desc: "Custom printed event backdrops, stage designs, and photo booth walls.",
    category: "events",
    image: "img/led-signs.png",
    badge: null
  },
  {
    id: "prod-packaging",
    title: "Custom Packaging",
    desc: "Branded packaging boxes, bags, and containers designed to elevate product presentation.",
    category: "branding",
    image: "img/envelopes.png",
    badge: "New"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  // ---- ENQUIRY LIST STATE ----
  let enquiryList = JSON.parse(sessionStorage.getItem('enquiryList')) || [];

  // ---- HAMBURGER MENU ----
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // ---- SET FEATURED IMAGES ----
  const featCardsImg = document.getElementById("feat-cards-img");
  const featSignsImg = document.getElementById("feat-signs-img");
  const featBannersImg = document.getElementById("feat-banners-img");

  if (featCardsImg) featCardsImg.src = "img/business-cards.png";
  if (featSignsImg) featSignsImg.src = "img/led-signs.png";
  if (featBannersImg) featBannersImg.src = "img/banner-displays.png";

  // ---- RENDER PRODUCTS ----
  renderProducts("all");

  // ---- FILTER BUTTONS ----
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.filter);
    });
  });

  // ---- ANIMATE STATS ON SCROLL ----
  const statsBar = document.querySelector(".products-stats-bar");
  if (statsBar) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(statsBar);
  }

  // ---- SCROLL-REVEAL ANIMATIONS ----
  const revealElements = document.querySelectorAll('.featured-card, .collection-inner, .cta-box');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    revealObserver.observe(el);
  });

  // Add revealed class styles
  const style = document.createElement('style');
  style.innerHTML = `
    .revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);

  // ---- SMOOTH SCROLL ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
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

  // Expose function for dynamic product cards
  window.addToEnquiryList = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    // Check if already in list to avoid duplicates
    if (!enquiryList.find(p => p.id === productId)) {
      enquiryList.push(product);
      sessionStorage.setItem('enquiryList', JSON.stringify(enquiryList));
      updateEnquiryUI();
      
      // Optional: open panel on add
      if (panel && overlay) {
        panel.classList.add("active");
        overlay.classList.add("active");
      }
    }
  };

  window.removeFromEnquiryList = function(productId) {
    enquiryList = enquiryList.filter(p => p.id !== productId);
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
            <img src="${item.image}" alt="${item.title}" class="enquiry-item-img" />
            <div class="enquiry-item-info">
              <div class="enquiry-item-title">${item.title}</div>
              <div class="enquiry-item-cat">${item.category}</div>
            </div>
            <button class="enquiry-item-remove" onclick="removeFromEnquiryList('${item.id}')">&times;</button>
          </div>
        `).join('');
      }
    }
  }
});

function renderProducts(filter) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const filtered = filter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  grid.innerHTML = "";

  filtered.forEach((product, i) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.id = product.id;
    card.style.animationDelay = `${i * 0.07}s`;

    card.innerHTML = `
      <div class="product-card-img">
        ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
        <img src="${product.image}" alt="${product.title}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${product.title}</h3>
        <p class="product-card-desc">${product.desc}</p>
        <div class="product-card-footer">
          <button class="product-card-enquire" onclick="addToEnquiryList('${product.id}')">+ Add to Enquiry List</button>
          <span class="product-card-category">${product.category}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function animateStats() {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current);
    }, 16);
  });
}

// Global function for footer filter links
function filterByCategory(category) {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(b => {
    b.classList.remove("active");
    if (b.dataset.filter === category) b.classList.add("active");
  });
  renderProducts(category);
}

/* ============================================================
   SR PIXELS — PRODUCTS ADMIN JAVASCRIPT
   ============================================================ */

let productContentData = {};

function showNotification(message, type = 'success') {
  let container = document.getElementById('custom-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-notification-container';
    document.body.appendChild(container);
  }

  const notif = document.createElement('div');
  notif.className = `custom-notification ${type}`;
  notif.innerHTML = `
    <div class="notif-corner tl"></div>
    <div class="notif-corner tr"></div>
    <div class="notif-corner bl"></div>
    <div class="notif-corner br"></div>
    <div class="notification-close" onclick="this.parentElement.remove()">×</div>
    <div class="notification-content">
      <div class="notification-header">${type.toUpperCase()} STATUS</div>
      <div class="notification-msg">${message}</div>
    </div>
  `;

  container.appendChild(notif);
  setTimeout(() => notif.classList.add('active'), 10);

  setTimeout(() => {
    notif.classList.remove('active');
    setTimeout(() => notif.remove(), 400);
  }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("adminToken");
  if (token) {
    showAdminMain();
  } else {
    showAuth();
  }

  const form = document.getElementById("product-content-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveProductContent();
    });
  }
});

function showAuth() {
  document.getElementById("auth-container").style.display = "block";
  document.getElementById("admin-main").style.display = "none";
}

function showAdminMain() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("admin-main").style.display = "block";
  document.getElementById("logout-btn").style.display = "block";
  fetchProductContent();
  fetchProducts();
}

function toggleAuthMode() {
  const loginBox = document.getElementById("login-form-box");
  const signupBox = document.getElementById("signup-form-box");
  if (loginBox.style.display === "none") {
    loginBox.style.display = "block";
    signupBox.style.display = "none";
  } else {
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  }
}

async function login() {
  const u = document.getElementById("login-username").value;
  const p = document.getElementById("login-password").value;
  if(!u || !p) return showNotification("Enter credentials", "warning");
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (res.ok) {
      sessionStorage.setItem("adminToken", data.token);
      showAdminMain();
      showNotification("LOGIN SUCCESSFUL: Admin access granted", "success");
    } else showNotification(data.error || "Login failed", "error");
  } catch (e) { showNotification("System error", "error"); }
}

async function signup() {
  const u = document.getElementById("signup-username").value;
  const p = document.getElementById("signup-password").value;
  if(!u || !p) return showNotification("Enter credentials", "warning");
  try {
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (res.ok) {
      showNotification("ACCOUNT CREATED: Admin access granted", "success");
      toggleAuthMode();
    } else showNotification(data.error || "Signup failed", "error");
  } catch (e) { showNotification("Signup failed", "error"); }
}

function logout() {
  sessionStorage.removeItem("adminToken");
  window.location.reload();
}

function getAuthHeaders() {
  return {
    "Authorization": `Bearer ${sessionStorage.getItem("adminToken")}`,
    "Content-Type": "application/json"
  };
}

async function fetchProductContent() {
  try {
    const res = await fetch("http://localhost:3000/api/products-content");
    const data = await res.json();
    if (data) {
      productContentData = data;
      document.getElementById("heroTitle").value = data.heroTitle || "";
      document.getElementById("heroSub").value = data.heroSub || "";
      document.getElementById("featuredTitle").value = data.featuredTitle || "";
      document.getElementById("featuredLargeTitle").value = data.featuredLargeTitle || "";
      document.getElementById("featuredLargeDesc").value = data.featuredLargeDesc || "";
      document.getElementById("featuredSmall1Title").value = data.featuredSmall1Title || "";
      document.getElementById("featuredSmall1Tag").value = data.featuredSmall1Tag || "";
      document.getElementById("featuredSmall2Title").value = data.featuredSmall2Title || "";
      document.getElementById("featuredSmall2Tag").value = data.featuredSmall2Tag || "";
      document.getElementById("collectionTitle").value = data.collectionTitle || "";
      document.getElementById("collectionDesc").value = data.collectionDesc || "";
      document.getElementById("catalogTitle").value = data.catalogTitle || "";
      document.getElementById("ctaTitle").value = data.ctaTitle || "";
      document.getElementById("ctaDesc").value = data.ctaDesc || "";
    }
  } catch (e) { console.error("Failed to fetch product content"); }
}

async function saveProductContent() {
  const data = {
    heroTitle: document.getElementById("heroTitle").value,
    heroSub: document.getElementById("heroSub").value,
    featuredTitle: document.getElementById("featuredTitle").value,
    featuredLargeTitle: document.getElementById("featuredLargeTitle").value,
    featuredLargeDesc: document.getElementById("featuredLargeDesc").value,
    featuredSmall1Title: document.getElementById("featuredSmall1Title").value,
    featuredSmall1Tag: document.getElementById("featuredSmall1Tag").value,
    featuredSmall2Title: document.getElementById("featuredSmall2Title").value,
    featuredSmall2Tag: document.getElementById("featuredSmall2Tag").value,
    collectionTitle: document.getElementById("collectionTitle").value,
    collectionDesc: document.getElementById("collectionDesc").value,
    catalogTitle: document.getElementById("catalogTitle").value,
    ctaTitle: document.getElementById("ctaTitle").value,
    ctaDesc: document.getElementById("ctaDesc").value
  };

  try {
    // 1. Save text content
    const res = await fetch("http://localhost:3000/api/products-content", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ data })
    });

    if (!res.ok) throw new Error("Failed to save text content");

    // 2. Upload images if selected
    const imageFields = [
      { id: "featuredLargeImg", key: "featuredLarge" },
      { id: "featuredSmall1Img", key: "featuredSmall1" },
      { id: "featuredSmall2Img", key: "featuredSmall2" }
    ];

    for (const field of imageFields) {
      const fileInput = document.getElementById(field.id);
      if (fileInput && fileInput.files[0]) {
        const formData = new FormData();
        formData.append("image", fileInput.files[0]);
        const imgRes = await fetch(`http://localhost:3000/api/content-images/${field.key}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${sessionStorage.getItem("adminToken")}` },
          body: formData
        });
        if (!imgRes.ok) throw new Error(`Failed to upload image: ${field.key}`);
      }
    }

    showNotification("MISSION ACCOMPLISHED: Database and visual assets updated successfully!", "success");
    
    // Refresh previews
    setTimeout(() => {
      const timestamp = new Date().getTime();
      const previews = ["prev-large", "prev-small1", "prev-small2"];
      previews.forEach(id => {
        const img = document.getElementById(id).querySelector("img");
        if(img) img.src = img.src.split('?')[0] + '?t=' + timestamp;
      });
    }, 500);

  } catch (e) { 
    console.error(e);
    showNotification("SYSTEM FAULT: " + e.message, "error"); 
  }
}

async function fetchProducts() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    const products = await res.json();
    const grid = document.getElementById("product-list-admin");
    grid.innerHTML = "";
    products.forEach(p => {
      grid.innerHTML += `
        <div class="product-item">
          <button class="remove-btn" onclick="deleteProduct('${p._id}')">DELETE</button>
          <img src="http://localhost:3000/api/products/${p._id}/image" alt="${p.title}">
          ${p.badge ? `<span class="badge-tag">${p.badge}</span>` : ""}
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          <div style="font-size: 10px; color: var(--cyan); font-weight: 800; text-transform: uppercase;">Category: ${p.category}</div>
        </div>
      `;
    });
  } catch (e) { console.error("Failed to fetch products"); }
}

async function addProduct() {
  const title = document.getElementById("newProdTitle").value;
  const desc = document.getElementById("newProdDesc").value;
  const cat = document.getElementById("newProdCat").value;
  const badge = document.getElementById("newProdBadge").value;
  const fileInput = document.getElementById("newProdImage");
  const file = fileInput.files[0];

  if (!title || !desc || !file) return showNotification("Title, description and image are required", "warning");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("desc", desc);
  formData.append("category", cat);
  formData.append("badge", badge);
  formData.append("image", file);

  try {
    const res = await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: { "Authorization": `Bearer ${sessionStorage.getItem("adminToken")}` },
      body: formData
    });
    if (res.ok) {
      showNotification("PRODUCT ADDED!", "success");
      document.getElementById("newProdTitle").value = "";
      document.getElementById("newProdDesc").value = "";
      document.getElementById("newProdBadge").value = "";
      fileInput.value = "";
      fetchProducts();
    } else showNotification("UPLOAD FAILED: Failed to add product", "error");
  } catch (e) { showNotification("SYSTEM FAULT: Error adding product", "error"); }
}

async function deleteProduct(id) {
  if (!confirm("Permanently delete this product?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${sessionStorage.getItem("adminToken")}` }
    });
    if (res.ok) {
      showNotification("PRODUCT DELETED", "success");
      fetchProducts();
    } else showNotification("DELETE FAILED", "error");
  } catch (e) { showNotification("SYSTEM FAULT: Error deleting product", "error"); }
}

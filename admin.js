let adminSessionToken = null; // In-memory session, lost on refresh
let contentData = {
  services: [],
  reviews: []
};
let currentFolderId = null;

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
  checkAuth();
});

function checkAuth() {
  if(adminSessionToken) {
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("admin-main").style.display = "block";
    document.getElementById("logout-btn").style.display = "block";
    fetchContent();
    fetchFolders();
  } else {
    document.getElementById("auth-container").style.display = "block";
    document.getElementById("admin-main").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
  }
}

function toggleAuthMode() {
  const loginBox = document.getElementById("login-form-box");
  const signupBox = document.getElementById("signup-form-box");
  if(loginBox.style.display === "none") {
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
    const res = await fetch("https://sr-pixels-kle9.onrender.com/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if(res.ok) {
      adminSessionToken = data.token; // Store in memory
      checkAuth();
      showNotification("LOGIN SUCCESSFUL: Admin access granted", "success");
    } else showNotification(data.error || "Login failed", "error");
  } catch(e) { console.error(e); showNotification("System error", "error"); }
}

async function signup() {
  const u = document.getElementById("signup-username").value;
  const p = document.getElementById("signup-password").value;
  if(!u || !p) return showNotification("Enter credentials", "warning");
  try {
    const res = await fetch("https://sr-pixels-kle9.onrender.com/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if(res.ok) {
      showNotification("ACCOUNT CREATED: Admin access granted", "success");
      toggleAuthMode();
    } else showNotification(data.error || "Signup failed", "error");
  } catch(e) { console.error(e); showNotification("System error", "error"); }
}

function logout() {
  adminSessionToken = null;
  checkAuth();
}

function getAuthHeaders(contentType = "application/json") {
  const headers = { "Authorization": `Bearer ${adminSessionToken}` };
  if(contentType) headers["Content-Type"] = contentType;
  return headers;
}

async function fetchContent() {
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`https://sr-pixels-kle9.onrender.com/api/content?t=${timestamp}`);
    const data = await res.json();
    if(data && Object.keys(data).length > 0) {
      contentData = data;
      if(!contentData.services) contentData.services = [];
      if(!contentData.reviews) contentData.reviews = [];
    }
    populateForm();
  } catch (err) {
    console.error("Failed to fetch content", err);
  }
}

function renderServices() {
  const container = document.getElementById("services-container");
  container.innerHTML = "";
  contentData.services.forEach((svc, index) => {
    container.innerHTML += `
      <div class="dynamic-item">
        <button type="button" class="remove-btn" onclick="removeService(${index})">X REMOVE</button>
        <h4 class="admin-subtitle" style="font-size: 1rem; color: #fff;">Service ${index + 1}</h4>
        <div class="form-group"><label class="form-label">ID (e.g. svc-print)</label><input type="text" class="form-input svc-id" value="${svc.id || ''}"></div>
        <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input svc-title" value="${svc.title || ''}"></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea svc-desc">${svc.desc || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Button Text</label><input type="text" class="form-input svc-btn" value="${svc.btnText || ''}"></div>
      </div>
    `;
  });
}

function renderReviews() {
  const container = document.getElementById("reviews-container");
  container.innerHTML = "";
  contentData.reviews.forEach((rev, index) => {
    container.innerHTML += `
      <div class="dynamic-item">
        <button type="button" class="remove-btn" onclick="removeReview(${index})">X REMOVE</button>
        <h4 class="admin-subtitle" style="font-size: 1rem; color: #fff;">Review ${index + 1}</h4>
        <div class="form-group"><label class="form-label">Stars</label><input type="text" class="form-input rev-stars" value="${rev.stars || '★★★★★'}"></div>
        <div class="form-group"><label class="form-label">Text</label><textarea class="form-input form-textarea rev-text">${rev.text || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Author</label><input type="text" class="form-input rev-author" value="${rev.author || ''}"></div>
      </div>
    `;
  });
}

function renderOfficeDetails() {
  const categories = ['names', 'phones', 'locations', 'emails'];
  categories.forEach(cat => {
    const container = document.getElementById(`office-${cat}-container`);
    if(!container) return;
    container.innerHTML = "";
    
    // Initialize if missing
    if(!contentData[cat]) {
      // Migration from officeInfoList if it existed
      if(contentData.officeInfoList && contentData.officeInfoList.length > 0) {
        contentData.names = contentData.officeInfoList.map(i => i.name).filter(Boolean);
        contentData.phones = contentData.officeInfoList.map(i => i.phone).filter(Boolean);
        contentData.locations = contentData.officeInfoList.map(i => i.location).filter(Boolean);
        contentData.emails = contentData.officeInfoList.map(i => i.email).filter(Boolean);
      } else {
        contentData[cat] = [];
      }
    }

    contentData[cat].forEach((val, index) => {
      container.innerHTML += `
        <div class="dynamic-item-compact" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
          <input type="text" class="form-input oi-${cat.slice(0,-1)}" value="${val || ''}" style="flex: 1;" oninput="syncArraysFromDOM()">
          <button type="button" onclick="removeOfficeDetail('${cat}', ${index})" style="background: #ff0055; color: #fff; border: none; padding: 6px 12px; cursor: pointer; font-weight: bold; font-size: 12px; border-radius: 4px;">REMOVE</button>
        </div>
      `;
    });
  });
}

function addOfficeDetail(cat) {
  syncArraysFromDOM();
  if(!contentData[cat]) contentData[cat] = [];
  contentData[cat].push("");
  renderOfficeDetails();
}

function removeOfficeDetail(cat, index) {
  syncArraysFromDOM();
  contentData[cat].splice(index, 1);
  renderOfficeDetails();
}

function populateForm() {
  document.getElementById("tickerText").value = contentData.tickerText || "";
  document.getElementById("servicesBannerTitle").value = contentData.servicesBannerTitle || "";
  document.getElementById("servicesBannerSub").value = contentData.servicesBannerSub || "";
  
  renderServices();

  document.getElementById("portfolioSub").value = contentData.portfolioSub || "";

  document.getElementById("reviewsSub").value = contentData.reviewsSub || "";

  renderReviews();

  document.getElementById("contactSub").value = contentData.contactSub || "";

  renderOfficeDetails();

  document.getElementById("directProtocolTitle").value = contentData.directProtocolTitle || "";
  document.getElementById("directProtocolDesc").value = contentData.directProtocolDesc || "";
  document.getElementById("directProtocolBtn").value = contentData.directProtocolBtn || "";
}

function syncArraysFromDOM() {
  // Sync Services
  const svcItems = document.querySelectorAll("#services-container .dynamic-item");
  contentData.services = [];
  svcItems.forEach(item => {
    contentData.services.push({
      id: item.querySelector(".svc-id").value,
      title: item.querySelector(".svc-title").value,
      desc: item.querySelector(".svc-desc").value,
      btnText: item.querySelector(".svc-btn").value
    });
  });

  // Sync Reviews
  const revItems = document.querySelectorAll("#reviews-container .dynamic-item");
  contentData.reviews = [];
  revItems.forEach(item => {
    contentData.reviews.push({
      stars: item.querySelector(".rev-stars").value,
      text: item.querySelector(".rev-text").value,
      author: item.querySelector(".rev-author").value
    });
  });

  // Sync Office Details
  const categories = ['names', 'phones', 'locations', 'emails'];
  categories.forEach(cat => {
    const inputs = document.querySelectorAll(`.oi-${cat.slice(0,-1)}`);
    // Filter out empty strings to prevent blank entries
    contentData[cat] = Array.from(inputs)
      .map(i => i.value.trim())
      .filter(val => val !== "");
  });
}

function addService() {
  syncArraysFromDOM();
  contentData.services.push({ id: "", title: "", desc: "", btnText: "LEARN MORE" });
  renderServices();
}

function removeService(index) {
  if(confirm("Remove this service?")) {
    syncArraysFromDOM();
    contentData.services.splice(index, 1);
    renderServices();
  }
}

function addReview() {
  syncArraysFromDOM();
  contentData.reviews.push({ stars: "★★★★★", text: "", author: "" });
  renderReviews();
}

function removeReview(index) {
  if(confirm("Remove this review?")) {
    syncArraysFromDOM();
    contentData.reviews.splice(index, 1);
    renderReviews();
  }
}

document.getElementById("admin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  syncArraysFromDOM();

  // Update scalar values
  contentData.tickerText = document.getElementById("tickerText").value;
  contentData.servicesBannerTitle = document.getElementById("servicesBannerTitle").value;
  contentData.servicesBannerSub = document.getElementById("servicesBannerSub").value;

  contentData.portfolioSub = document.getElementById("portfolioSub").value;

  contentData.reviewsSub = document.getElementById("reviewsSub").value;

  contentData.contactSub = document.getElementById("contactSub").value;

  contentData.contactSub = document.getElementById("contactSub").value;

  contentData.directProtocolTitle = document.getElementById("directProtocolTitle").value;
  contentData.directProtocolDesc = document.getElementById("directProtocolDesc").value;
  contentData.directProtocolBtn = document.getElementById("directProtocolBtn").value;

  try {
    const res = await fetch("https://sr-pixels-kle9.onrender.com/api/content", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ data: contentData })
    });
    if(res.ok) {
      showNotification("MISSION ACCOMPLISHED: Database updated successfully!", "success");
    } else {
      showNotification("TRANSMISSION ERROR: Failed to save changes.", "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("SYSTEM FAULT: Error saving changes.", "error");
  }
});

// --- PORTFOLIO FOLDER MANAGEMENT ---

async function fetchFolders() {
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`https://sr-pixels-kle9.onrender.com/api/folders?t=${timestamp}`);
    const folders = await res.json();
    const grid = document.getElementById("folder-grid-admin");
    grid.innerHTML = "";
    folders.forEach(folder => {
      grid.innerHTML += `
        <div class="portfolio-item" style="cursor: pointer;" onclick="enterFolder('${folder._id}', '${folder.name}')">
          <div style="font-size: 3rem; color: var(--theme-1); margin-bottom: 10px;">📁</div>
          <p>${folder.name}</p>
          <button type="button" class="btn-primary" style="background: #ff0055; border-color: #ff0055; font-size: 10px; padding: 4px 8px;" onclick="event.stopPropagation(); deleteFolder('${folder._id}')">DELETE</button>
        </div>
      `;
    });
  } catch(err) {
    console.error("Failed to fetch folders", err);
  }
}

async function createFolder() {
  const name = document.getElementById("newFolderName").value.trim();
  if(!name) return showNotification("Enter folder name", "warning");
  try {
    const res = await fetch("https://sr-pixels-kle9.onrender.com/api/folders", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    if(res.ok) {
      showNotification("FOLDER CREATED", "success");
      document.getElementById("newFolderName").value = "";
      fetchFolders();
    } else {
      const data = await res.json();
      showNotification(data.error || "Failed to create folder", "error");
    }
  } catch(err) {
    console.error(err);
    showNotification("System error", "error");
  }
}

async function deleteFolder(id) {
  if(!confirm("Delete this folder and ALL images inside?")) return;
  try {
    const res = await fetch(`https://sr-pixels-kle9.onrender.com/api/folders/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(null)
    });
    if(res.ok) {
      showNotification("FOLDER DELETED", "success");
      fetchFolders();
    } else {
      showNotification("Delete failed", "error");
    }
  } catch(err) {
    console.error(err);
    showNotification("System error", "error");
  }
}

function enterFolder(id, name) {
  currentFolderId = id;
  document.getElementById("current-folder-name").innerText = name;
  document.getElementById("folder-view").style.display = "none";
  document.getElementById("image-view").style.display = "block";
  document.getElementById("portfolio-manager-title").innerText = `Folder: ${name}`;
  fetchImages();
}

function showFolderView() {
  currentFolderId = null;
  document.getElementById("folder-view").style.display = "block";
  document.getElementById("image-view").style.display = "none";
  document.getElementById("portfolio-manager-title").innerText = "Portfolio Folders";
  fetchFolders();
}

async function fetchImages() {
  if(!currentFolderId) return;
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`https://sr-pixels-kle9.onrender.com/api/portfolio?folderId=${currentFolderId}&t=${timestamp}`);
    const images = await res.json();
    const grid = document.getElementById("image-grid-admin");
    grid.innerHTML = "";
    images.forEach(img => {
      grid.innerHTML += `
        <div class="portfolio-item">
          <img src="https://sr-pixels-kle9.onrender.com/api/portfolio/${img._id}/image?t=${new Date().getTime()}" alt="${img.name}" />
          <p>${img.name}</p>
          <button type="button" class="btn-primary" style="background: #ff0055; border-color: #ff0055;" onclick="deleteImage('${img._id}')">DELETE</button>
        </div>
      `;
    });
  } catch(err) {
    console.error("Failed to fetch images", err);
  }
}

async function uploadImage() {
  const name = document.getElementById("newImageName").value;
  const fileInput = document.getElementById("newImageFile");
  const file = fileInput.files[0];

  if(!name || !file) {
    showNotification("Please provide both name and image file.", "warning");
    return;
  }

  if(!currentFolderId) {
    showNotification("No folder selected.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("image", file);
  formData.append("folderId", currentFolderId);

  try {
    const res = await fetch("https://sr-pixels-kle9.onrender.com/api/portfolio", {
      method: "POST",
      headers: getAuthHeaders(null),
      body: formData
    });
    if(res.ok) {
      showNotification("ASSET UPLOADED!", "success");
      document.getElementById("newImageName").value = "";
      fileInput.value = "";
      fetchImages();
    } else {
      showNotification("UPLOAD FAILED.", "error");
    }
  } catch(err) {
    console.error(err);
    showNotification("SYSTEM FAULT: Error uploading image.", "error");
  }
}

async function deleteImage(id) {
  if(!confirm("Are you sure you want to permanently delete this visual asset?")) return;
  try {
    const res = await fetch(`https://sr-pixels-kle9.onrender.com/api/portfolio/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(null)
    });
    if(res.ok) {
      showNotification("ASSET DELETED!", "success");
      fetchImages();
    } else {
      showNotification("DELETE FAILED.", "error");
    }
  } catch(err) {
    console.error(err);
    showNotification("SYSTEM FAULT: Error deleting image.", "error");
  }
}

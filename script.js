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

function handleEmailClick(email, e) {
  if (e) e.preventDefault();
  const mailtoUrl = `mailto:${email}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=Inquiry&body=Hello,`;
  
  let blurred = false;
  const onBlur = () => { blurred = true; };
  window.addEventListener('blur', onBlur);
  
  // Attempt to trigger the system's mail handler
  const tempLink = document.createElement('a');
  tempLink.href = mailtoUrl;
  tempLink.style.display = 'none';
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  
  // If the window doesn't blur or hide within 1.2s, open Gmail
  setTimeout(() => {
    window.removeEventListener('blur', onBlur);
    if (!blurred && !document.hidden) {
      showNotification("Mail app not responding. Redirecting to Gmail Web...", "warning");
      setTimeout(() => {
        window.open(gmailUrl, "_blank");
      }, 500);
    }
  }, 1200);
}

document.addEventListener("DOMContentLoaded", async () => {
  // ---- SPLASH SCREEN SEQUENCE ----
  const splash = document.getElementById("splash-screen");
  const splashLogo = document.getElementById("splash-logo");
  const splashTagline = document.getElementById("splash-tagline");
  const heroContent = document.querySelector(".hero-content");
  const heroFooter = document.querySelector(".hero-footer");

  // Lock scroll during splash
  document.body.style.overflow = "hidden";

  // Phase 1: logo animates in via CSS (2.1s total)
  // Phase 2 at 2.5s: logo exits up
  setTimeout(() => {
    if(splashLogo) splashLogo.classList.add("splash-logo-exit");
    // Phase 3 at 2.8s: tagline fades in
    setTimeout(() => {
      if(splashTagline) splashTagline.classList.add("splash-tagline-show");
      // Phase 4 at 4.0s: whole splash fades out
      setTimeout(() => {
        if(splash) splash.classList.add("splash-exit");
        // Phase 5 at 4.8s: remove splash, unlock scroll, reveal hero
        setTimeout(() => {
          if(splash) splash.style.display = "none";
          document.body.style.overflow = "";
          if(heroContent) {
            heroContent.classList.remove("hero-hidden");
            heroContent.classList.add("hero-reveal");
          }
          setTimeout(() => {
            if(heroFooter) {
              heroFooter.classList.remove("hero-hidden");
              heroFooter.classList.add("hero-reveal");
            }
          }, 300);
          // Start scramble after hero is revealed
          startScramble();
        }, 800);
      }, 1200);
    }, 300);
  }, 2500);

  function startScramble() {
    const scrambleEl = document.querySelector('.scramble-text');
    if(!scrambleEl) return;
    const words = ["DESIGN.", "BUILD.", "INVENT.", "DEPLOY.", "CLICK."];
    let wordIndex = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

    function scramble() {
      const targetWord = words[wordIndex];
      let iterations = 0;

      const interval = setInterval(() => {
        scrambleEl.innerText = targetWord.split("").map((letter, index) => {
          if(index < iterations) return targetWord[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("");

        iterations += 1/3;

        if(iterations >= targetWord.length) {
          clearInterval(interval);
          scrambleEl.innerText = targetWord;
          const pauseTime = (targetWord === "CLICK.") ? 3000 : 800;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(scramble, pauseTime);
        }
      }, 40);
    }
    scramble();
  }

  // Navigation & UI basics
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  
  // Navbar scroll visibility
  window.addEventListener("scroll", () => {
    if (window.scrollY > 150) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  if(hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if(target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Contact Form Logic
  const enquiryForm = document.getElementById("enquiry-form");
  const svcBtns = document.querySelectorAll(".svc-btn");
  const serviceVal = document.getElementById("service-val");

  if(svcBtns.length > 0 && serviceVal) {
    svcBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        svcBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        serviceVal.value = btn.innerText;
      });
    });
    // Set initial service val
    const activeBtn = document.querySelector(".svc-btn.active");
    if(activeBtn) serviceVal.value = activeBtn.innerText;
  }

  if(enquiryForm) {
    enquiryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const phone = enquiryForm.dataset.whatsapp;
      if(!phone) {
        showNotification("Contact number not configured yet. Please try again later.", "error");
        return;
      }
      
      const brief = document.getElementById("project-brief").value;
      const svc = serviceVal ? serviceVal.value : "";
      
      if(!brief) {
        showNotification("Please enter a message.", "error");
        return;
      }

      const text = `Hi! I'm interested in: ${svc}\n\nMessage:\n${brief}`;
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      
      window.open(waUrl, "_blank");
      
      // Show success
      const formSuccess = document.getElementById("form-success");
      const formHeader = document.querySelector(".form-header-row");
      if(formSuccess) {
        enquiryForm.style.display = "none";
        if(formHeader) formHeader.style.display = "none";
        formSuccess.style.display = "flex";
      }
    });
  }

  // Fetch dynamic content
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`http://localhost:3000/api/content?t=${timestamp}`);
    if(res.ok) {
      const data = await res.json();
      applyContent(data);
    }
  } catch (err) {
    console.error("Error fetching content:", err);
  }

  // Fetch dynamic portfolio images
  try {
    const timestamp = new Date().getTime();
    const res = await fetch(`http://localhost:3000/api/portfolio?t=${timestamp}`);
    if(res.ok) {
      const images = await res.json();
      renderPortfolio(images);
    }
  } catch (err) {
    console.error("Error fetching images:", err);
  }
});

function applyContent(data) {
  if(!data || Object.keys(data).length === 0) return;

  // Ticker
  if(data.tickerText) {
    const ticker = document.querySelector(".ticker-content");
    if(ticker) {
      // Add two spans for seamless scrolling (animation translates -50%)
      ticker.innerHTML = `<span>${data.tickerText}</span><span>${data.tickerText}</span>`;
      
      // Calculate duration to maintain a constant scroll speed
      // More text = slower (higher duration), less text = faster (lower duration)
      const charCount = data.tickerText.length;
      const duration = Math.max(8, charCount / 8); // ~8 characters per second, min 8s
      ticker.style.animationDuration = `${duration}s`;
    }
  }

  // Services
  if(data.servicesBannerTitle) {
    const bannerTitle = document.querySelector(".banner-title");
    if(bannerTitle) bannerTitle.innerText = data.servicesBannerTitle;
  }
  if(data.servicesBannerSub) {
    const bannerSub = document.querySelector(".banner-sub");
    if(bannerSub) bannerSub.innerText = data.servicesBannerSub;
  }

  // Services Cards
  if(data.services && data.services.length > 0) {
    const grid = document.getElementById("services-grid");
    if(grid) {
      grid.innerHTML = "";
      const icons = [
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>',
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="0" ry="0"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
      ];

      data.services.forEach((svc, i) => {
        const themeIndex = (i % 5) + 1;
        const iconSvg = icons[i % icons.length];
        grid.innerHTML += `
          <div class="service-card" id="${svc.id || 'svc-' + i}" style="--theme: var(--theme-${themeIndex}); --theme-glow: var(--theme-${themeIndex}-glow);">
            <div class="card-corner tl"></div>
            <div class="card-corner tr"></div>
            <div class="card-corner bl"></div>
            <div class="card-corner br"></div>
            <div class="card-icon">
              ${iconSvg}
            </div>
            <h3 class="card-title">${svc.title}</h3>
            <p class="card-desc">${svc.desc}</p>
            <button class="btn-themed card-btn" onclick="document.querySelector('#enquiry').scrollIntoView({behavior: 'smooth'})">${svc.btnText || 'LEARN MORE'}</button>
          </div>
        `;
      });
    }
  }

  // Portfolio
  if(data.portfolioSub) {
    const portSub = document.querySelector("#portfolio .section-sub");
    if(portSub) portSub.innerText = data.portfolioSub;
  }

  // Reviews
  if(data.reviewsSub) {
    const revSub = document.querySelector("#reviews .section-sub");
    if(revSub) revSub.innerText = data.reviewsSub;
  }

  // Marquee
  if(data.reviews && data.reviews.length > 0) {
    const marquee = document.querySelector(".reviews-marquee");
    if(marquee) {
      marquee.innerHTML = "";
      // Add two sets for seamless scrolling
      for(let i=0; i<2; i++) {
        data.reviews.forEach(rev => {
          marquee.innerHTML += `
            <div class="review-card">
              <div class="card-corner tl"></div><div class="card-corner tr"></div><div class="card-corner bl"></div><div class="card-corner br"></div>
              <div class="review-stars">${rev.stars}</div>
              <p class="review-text">${rev.text}</p>
              <div class="review-author">${rev.author}</div>
            </div>
          `;
        });
      }
      // Speed relative to amount of reviews
      const reviewCount = data.reviews.length;
      const duration = Math.max(10, reviewCount * 5); // ~5s per review
      marquee.style.animationDuration = `${duration}s`;
    }
  }

  // Contact
  if(data.contactSub) {
    const conSub = document.querySelector("#enquiry .section-sub");
    if(conSub) conSub.innerText = data.contactSub;
  }

  // HQ Terminal
  const listContainer = document.getElementById("office-info-list");
  if(listContainer) {
    listContainer.innerHTML = "";
    
    const categories = [
      { label: 'NAMES', data: data.names, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#849495" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
      { label: 'PHONES', data: data.phones, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#849495" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' },
      { label: 'LOCATION', data: data.locations, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#849495" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
      { label: 'EMAIL', data: data.emails, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#849495" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' }
    ];

    categories.forEach(cat => {
      if(cat.data && cat.data.length > 0) {
        listContainer.innerHTML += `
          <li class="terminal-item" style="align-items: flex-start; margin-bottom: 25px;">
            <div style="margin-top: 2px;">${cat.icon}</div>
            <div style="flex: 1; margin-left: 12px;">
              <div class="ti-label" style="margin-bottom: 8px; font-size: 12px; color: #fff; letter-spacing: 1px;">${cat.label}:</div>
              ${cat.data.map(val => {
                let displayVal = val;
                if (cat.label === 'LOCATION') {
                  displayVal = `<a href="https://www.google.com/maps/search/${encodeURIComponent(val)}" target="_blank" style="color: inherit; text-decoration: underline; text-decoration-color: rgba(0, 234, 255, 0.4);">${val}</a>`;
                } else if (cat.label === 'EMAIL') {
                  displayVal = `<a href="#" onclick="handleEmailClick('${val}', event)" style="color: inherit; text-decoration: underline; text-decoration-color: rgba(0, 234, 255, 0.4);">${val}</a>`;
                }
                return `<div class="ti-val" style="margin-bottom: 6px; padding-left: 10px; border-left: 2px solid rgba(0, 234, 255, 0.15); line-height: 1.4;">${displayVal}</div>`;
              }).join('')}
            </div>
          </li>
        `;
      }
    });

    // Store first phone for contact form WhatsApp redirection
    const form = document.getElementById("enquiry-form");
    if (form && data.phones && data.phones.length > 0) {
      form.dataset.whatsapp = data.phones[0];
    }

    // Update first email for Email Us button
    const emailBtn = document.getElementById("email-btn");
    if(emailBtn && data.emails && data.emails.length > 0) {
      emailBtn.onclick = (e) => handleEmailClick(data.emails[0], e);
      emailBtn.removeAttribute("target");
    }
  }

  // Direct Protocol
  if(data.directProtocolTitle) {
    const dpTitle = document.querySelector(".dp-title");
    if(dpTitle) dpTitle.innerText = data.directProtocolTitle;
  }
  if(data.directProtocolDesc) {
    const dpDesc = document.querySelector(".dp-desc");
    if(dpDesc) dpDesc.innerText = data.directProtocolDesc;
  }
  if(data.directProtocolBtn) {
    const dpBtn = document.getElementById("email-btn");
    if(dpBtn) {
      const svg = dpBtn.querySelector("svg");
      dpBtn.innerHTML = "";
      if(svg) dpBtn.appendChild(svg);
      dpBtn.appendChild(document.createTextNode(" " + data.directProtocolBtn));
    }
  }
  

}

function renderPortfolio(images) {
  const grid = document.getElementById("project-grid");
  if(!grid) return;
  
  // Create some basic CSS for grid if missing
  if(!document.getElementById("dynamic-port-style")) {
    const style = document.createElement("style");
    style.id = "dynamic-port-style";
    style.innerHTML = `
      #project-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 30px;
        padding: 20px 0;
      }
      .port-item {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        border: 1px solid #00eaff;
        cursor: pointer;
      }
      .port-item img {
        width: 100%;
        height: 250px;
        object-fit: cover;
        display: block;
        transition: transform 0.4s ease;
      }
      .port-item:hover img {
        transform: scale(1.1);
      }
      .port-overlay {
        position: absolute;
        bottom: -100%;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.85);
        color: #00eaff;
        padding: 8px 12px;
        text-align: center;
        transition: bottom 0.4s ease;
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 1px;
        border-top: 1px solid #00eaff;
      }
      .port-item:hover .port-overlay {
        bottom: 0;
      }
      #lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      #lightbox-overlay.active {
        opacity: 1;
        pointer-events: all;
      }
      #lightbox-img {
        max-width: 90%;
        max-height: 90%;
        border: 2px solid #00eaff;
        box-shadow: 0 0 20px rgba(0, 234, 255, 0.5);
        border-radius: 8px;
      }
      #lightbox-close {
        position: absolute;
        top: 20px;
        right: 30px;
        color: #00eaff;
        font-size: 40px;
        cursor: pointer;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup lightbox container
  if (!document.getElementById("lightbox-overlay")) {
    const lightbox = document.createElement("div");
    lightbox.id = "lightbox-overlay";
    lightbox.innerHTML = `
      <div id="lightbox-close">&times;</div>
      <img id="lightbox-img" src="" alt="Full Size">
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });
  }

  // Expose lightbox function globally for onclick
  window.openLightbox = function(src) {
    const overlay = document.getElementById("lightbox-overlay");
    const img = document.getElementById("lightbox-img");
    img.src = src;
    overlay.classList.add("active");
  };

  grid.innerHTML = "";
  if(images.length === 0) {
    grid.innerHTML = "<p style='color: #849495;'>No portfolio images available.</p>";
    return;
  }
  
  images.forEach(img => {
    const src = `http://localhost:3000/api/portfolio/${img._id}/image?t=${new Date().getTime()}`;
    grid.innerHTML += `
      <div class="port-item" onclick="openLightbox('${src}')">
        <img src="${src}" alt="${img.name}" />
        <div class="port-overlay">${img.name}</div>
      </div>
    `;
  });
}

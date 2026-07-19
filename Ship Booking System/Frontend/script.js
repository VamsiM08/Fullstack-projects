/* ==========================================================================
   SHIP BOOKING SYSTEM - MULTI-THEME ENGINE & REST API HELPERS
   ========================================================================== */

const API_BASE = "http://127.0.0.1:8000";

// Multi-Theme Manager
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('ocean_selected_theme', themeName);
  
  // Highlight active dot
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.toggle('active', dot.getAttribute('data-theme-name') === themeName);
  });
}

function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('ocean_selected_theme') || 'deep-night';
  setTheme(savedTheme);

  const authContainer = document.getElementById('nav-auth-container');
  if (authContainer) {
    let themePill = document.getElementById('navbar-theme-pill');
    if (!themePill) {
      themePill = document.createElement('div');
      themePill.id = 'navbar-theme-pill';
      themePill.className = 'theme-switcher-box';
      themePill.innerHTML = `
        <div class="theme-dot theme-dot-night" data-theme-name="deep-night" title="Ocean Deep Night" onclick="setTheme('deep-night')"></div>
        <div class="theme-dot theme-dot-sunset" data-theme-name="sunset" title="Golden Sunset Horizon" onclick="setTheme('sunset')"></div>
        <div class="theme-dot theme-dot-caribbean" data-theme-name="caribbean" title="Emerald Caribbean" onclick="setTheme('caribbean')"></div>
        <div class="theme-dot theme-dot-sapphire" data-theme-name="sapphire" title="Royal Cyber Sapphire" onclick="setTheme('sapphire')"></div>
      `;
      authContainer.parentNode.insertBefore(themePill, authContainer);
    }
  }
}

// Background Particle Canvas
function initParticleCanvas() {
  if (document.getElementById('particle-canvas')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.5,
    dy: (Math.random() - 0.5) * 0.5,
    o: Math.random() * 0.5 + 0.2
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed; bottom:2rem; right:2rem; z-index:99999; display:flex; flex-direction:column; gap:10px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--bg-panel);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border-glow);
    color: #FFF;
    padding: 14px 22px;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    min-width: 280px;
    font-size: 0.92rem;
    font-weight: 600;
  `;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// User Session
function getCurrentUser() {
  const user = localStorage.getItem('ship_system_user');
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  if (user) localStorage.setItem('ship_system_user', JSON.stringify(user));
  else localStorage.removeItem('ship_system_user');
}

function updateNavigation() {
  const user = getCurrentUser();
  const authNav = document.getElementById('nav-auth-container');
  if (!authNav) return;

  if (user) {
    authNav.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="color:var(--primary-accent); font-weight:700; font-size:0.9rem;">
          ⚓ ${user.full_name || 'User'} (${user.role || 'Passenger'})
        </span>
        ${user.role === 'Admin' 
          ? `<a href="admin_dashboard.html" class="btn btn-gold btn-sm">Admin Portal</a>`
          : `<a href="passenger_dashboard.html" class="btn btn-glass btn-sm">Dashboard</a>`
        }
        <button onclick="logout()" class="btn btn-danger btn-sm">Logout</button>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <a href="login.html" class="btn btn-glass btn-sm">Sign In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

function logout() {
  localStorage.removeItem('ship_system_user');
  showToast("Logged out successfully", "info");
  setTimeout(() => window.location.href = "index.html", 500);
}

// REST API Helper
async function apiFetch(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API Error at ${endpoint}:`, err.message);
    throw err;
  }
}

// SVG Bar Chart Generator
function renderBarChart(containerId, dataPoints, labelKey, valueKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxVal = Math.max(...dataPoints.map(d => d[valueKey] || 1), 100);
  const bars = dataPoints.map(d => {
    const heightPct = Math.round(((d[valueKey] || 0) / maxVal) * 100);
    return `
      <div style="display:flex; flex-direction:column; align-items:center; flex:1; height:100%; justify-content:flex-end; gap:6px;">
        <span style="font-size:0.75rem; color:var(--primary-accent); font-weight:700;">${d[valueKey]}</span>
        <div style="width:70%; max-width:32px; height:${Math.max(heightPct, 12)}%; background:var(--btn-gradient); border-radius:6px 6px 0 0; transition:all 0.5s ease;"></div>
        <span style="font-size:0.75rem; color:var(--text-secondary);">${d[labelKey]}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div style="display:flex; height:100%; align-items:flex-end; gap:12px; padding-top:1.5rem;">${bars}</div>`;
}

// CSV Exporter
function exportTableToCSV(tableId, filename = 'export.csv') {
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length - 1; j++) {
      row.push('"' + cols[j].innerText.replace(/"/g, '""').replace(/\n/g, ' ') + '"');
    }
    csv.push(row.join(','));
  }

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

// Global Init
document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initParticleCanvas();
  updateNavigation();
});

/* ==========================================
   ISLAND BOOKING SYSTEM - VANILLA JS ENGINE
   Fetch API Calls, Interactive UI, Booking Flow, Dashboards
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initToast();
  initPageSpecifics();
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color: ${type === 'success' ? '#10B981' : '#FF6B6B'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s reverse forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ==========================================
// NAVBAR & MOBILE MENU
// ==========================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '100%';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'rgba(255, 255, 255, 0.95)';
      navLinks.style.padding = '1.5rem';
      navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    });
  }
}

// ==========================================
// REST API FETCH HELPERS
// ==========================================
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    showToast(error.message, 'error');
    throw error;
  }
}

// ==========================================
// PAGE ROUTER & INITIALIZERS
// ==========================================
function initPageSpecifics() {
  const path = window.location.pathname;

  if (path === '/' || path.includes('index.html')) {
    loadHomePageData();
    initSearchForm();
  } else if (path.includes('islands.html') || path.includes('islands-page')) {
    loadIslandsPage();
  } else if (path.includes('packages.html') || path.includes('packages-page')) {
    loadPackagesPage();
  } else if (path.includes('booking.html') || path.includes('booking-page')) {
    initBookingPage();
  } else if (path.includes('payment.html') || path.includes('payment-page')) {
    initPaymentPage();
  } else if (path.includes('customer_dashboard.html') || path.includes('customer-dashboard')) {
    loadCustomerDashboard();
  } else if (path.includes('admin_dashboard.html') || path.includes('admin-dashboard')) {
    loadAdminDashboard();
  }
}

// ==========================================
// HOME PAGE ENGINE
// ==========================================
async function loadHomePageData() {
  const featuredGrid = document.getElementById('featured-islands-grid');
  const packagesGrid = document.getElementById('popular-packages-grid');

  if (featuredGrid) {
    try {
      const res = await apiFetch('/islands/');
      const islands = res.data.slice(0, 3);
      featuredGrid.innerHTML = islands.map(renderIslandCard).join('');
    } catch (e) {
      featuredGrid.innerHTML = '<p class="text-center">Unable to load islands. Please try again.</p>';
    }
  }

  if (packagesGrid) {
    try {
      const res = await apiFetch('/packages/');
      const packages = res.data.slice(0, 3);
      packagesGrid.innerHTML = packages.map(renderPackageCard).join('');
    } catch (e) {
      packagesGrid.innerHTML = '<p class="text-center">Unable to load packages.</p>';
    }
  }
}

function initSearchForm() {
  const searchForm = document.getElementById('home-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dest = document.getElementById('search-destination').value;
      const date = document.getElementById('search-date').value;
      const guests = document.getElementById('search-guests').value;
      window.location.href = `islands.html?query=${encodeURIComponent(dest)}&guests=${guests}&date=${date}`;
    });
  }
}

// ==========================================
// ISLANDS PAGE ENGINE
// ==========================================
let allIslandsData = [];

async function loadIslandsPage() {
  const grid = document.getElementById('islands-catalog-grid');
  const searchInput = document.getElementById('filter-search');
  const climateFilter = document.getElementById('filter-climate');

  if (!grid) return;

  try {
    const res = await apiFetch('/islands/');
    allIslandsData = res.data;

    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (query && searchInput) {
      searchInput.value = query;
    }

    filterAndRenderIslands();

    if (searchInput) searchInput.addEventListener('input', filterAndRenderIslands);
    if (climateFilter) climateFilter.addEventListener('change', filterAndRenderIslands);

  } catch (e) {
    grid.innerHTML = '<p>Failed to load tropical islands catalog.</p>';
  }
}

function filterAndRenderIslands() {
  const grid = document.getElementById('islands-catalog-grid');
  const searchVal = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const climateVal = document.getElementById('filter-climate')?.value || 'all';

  const filtered = allIslandsData.filter(island => {
    const matchesSearch = island.name.toLowerCase().includes(searchVal) || island.country.toLowerCase().includes(searchVal);
    const matchesClimate = climateVal === 'all' || island.climate.toLowerCase().includes(climateVal.toLowerCase());
    return matchesSearch && matchesClimate;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
      <i class="fas fa-umbrella-beach" style="font-size: 3rem; color: #0077B6; margin-bottom: 1rem;"></i>
      <h3>No tropical islands match your criteria</h3>
      <p style="color: #6C757D;">Try clearing search filters or searching for another destination.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderIslandCard).join('');
}

function renderIslandCard(island) {
  const isFav = isFavorite(island.id);
  return `
    <div class="island-card">
      <img src="${island.image_url}" alt="${island.name}" loading="lazy" />
      <button class="island-badge" onclick="toggleFavorite(${island.id}, this)" style="border:none; cursor:pointer;">
        <i class="${isFav ? 'fas' : 'far'} fa-heart" style="color: ${isFav ? '#FF6B6B' : '#0A192F'}"></i> ${island.rating}
      </button>
      <div class="island-card-overlay">
        <h3 class="island-title">${island.name}</h3>
        <p class="island-country"><i class="fas fa-map-marker-alt"></i> ${island.country}</p>
        <div class="island-details">
          <span><i class="fas fa-sun"></i> ${island.climate}</span>
          <span><i class="fas fa-calendar-alt"></i> Best: ${island.best_season}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="island-price">$${island.price_per_night} <span>/ night</span></div>
          <button class="btn btn-primary btn-sm" onclick="quickBookIsland(${island.id}, '${island.name}')">Explore <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// PACKAGES PAGE ENGINE
// ==========================================
let allPackagesData = [];

async function loadPackagesPage() {
  const grid = document.getElementById('packages-catalog-grid');
  const searchInput = document.getElementById('package-search');

  if (!grid) return;

  try {
    const res = await apiFetch('/packages/');
    allPackagesData = res.data;
    renderPackages(allPackagesData);

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const val = searchInput.value.toLowerCase();
        const filtered = allPackagesData.filter(p => p.title.toLowerCase().includes(val) || p.island_name.toLowerCase().includes(val));
        renderPackages(filtered);
      });
    }
  } catch (e) {
    grid.innerHTML = '<p>Failed to load vacation packages.</p>';
  }
}

function renderPackages(list) {
  const grid = document.getElementById('packages-catalog-grid');
  if (list.length === 0) {
    grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No packages found.</p>';
    return;
  }
  grid.innerHTML = list.map(renderPackageCard).join('');
}

function renderPackageCard(pkg) {
  return `
    <div class="package-card">
      <div class="package-img-wrap">
        <img src="${pkg.image_url}" alt="${pkg.title}" loading="lazy" />
        ${pkg.discount_percent > 0 ? `<div class="discount-tag">${pkg.discount_percent}% OFF</div>` : ''}
      </div>
      <div class="package-content">
        <h3 class="package-title">${pkg.title}</h3>
        <div class="package-meta">
          <span><i class="fas fa-island-tropical" style="color:#0077B6;"></i> ${pkg.island_name}, ${pkg.island_country}</span>
          <span><i class="fas fa-clock" style="color:#0077B6;"></i> ${pkg.duration_days} Days</span>
        </div>
        <div class="package-services">
          ${pkg.services.map(s => `<span class="service-pill"><i class="fas fa-check"></i> ${s}</span>`).join('')}
        </div>
        <div class="package-footer">
          <div>
            <div style="font-size:0.8rem; color:#6C757D; text-decoration:line-through;">$${pkg.price}</div>
            <div style="font-size:1.4rem; font-weight:800; color:#0077B6;">$${pkg.discounted_price}</div>
          </div>
          <button class="btn btn-coral btn-sm" onclick="selectAndBookPackage(${pkg.id})">Book Now <i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `;
}

function selectAndBookPackage(packageId) {
  localStorage.setItem('selected_package_id', packageId);
  window.location.href = 'booking.html';
}

function quickBookIsland(islandId, islandName) {
  // Find package or redirect to booking
  localStorage.setItem('selected_island_id', islandId);
  window.location.href = `packages.html?island=${islandId}`;
}

// ==========================================
// WISHLIST FAVORITES
// ==========================================
function getFavorites() {
  return JSON.parse(localStorage.getItem('island_favs') || '[]');
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id, btnElement) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(i => i !== id);
    showToast('Removed from favorites', 'error');
  } else {
    favs.push(id);
    showToast('Saved to wishlist!', 'success');
  }
  localStorage.setItem('island_favs', JSON.stringify(favs));
  
  if (btnElement) {
    const icon = btnElement.querySelector('i');
    if (icon) {
      const isFav = favs.includes(id);
      icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
      icon.style.color = isFav ? '#FF6B6B' : '#0A192F';
    }
  }
}

// ==========================================
// MULTI STEP BOOKING WIZARD
// ==========================================
let bookingState = {
  packageId: null,
  packageData: null,
  checkIn: '',
  checkOut: '',
  guests: 2,
  customerName: 'Alexander Wright',
  customerEmail: 'alex.wright@luxuryescapes.com',
  customerPhone: '+1 415-890-2134',
  totalPrice: 0
};

async function initBookingPage() {
  const selectedPkgId = localStorage.getItem('selected_package_id') || 1;
  try {
    const pkgs = await apiFetch('/packages/');
    const selectedPkg = pkgs.data.find(p => p.id == selectedPkgId) || pkgs.data[0];
    bookingState.packageId = selectedPkg.id;
    bookingState.packageData = selectedPkg;
    bookingState.totalPrice = selectedPkg.discounted_price;

    renderBookingSummary();
  } catch (e) {
    showToast('Error initializing booking package', 'error');
  }

  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const checkIn = document.getElementById('book-checkin').value;
      const checkOut = document.getElementById('book-checkout').value;
      const guests = document.getElementById('book-guests').value;
      const name = document.getElementById('book-name').value;
      const email = document.getElementById('book-email').value;

      if (!checkIn || !checkOut) {
        showToast('Please select valid travel dates', 'error');
        return;
      }

      // First check or create customer
      try {
        const custRes = await apiFetch('/customers/');
        let cust = custRes.data.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (!cust) {
          const newCustRes = await apiFetch('/customers/add/', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone: '+1 555-0199', membership: 'Gold' })
          });
          cust = newCustRes.data;
        }

        // Save active booking details to localStorage for payment checkout page
        const checkoutData = {
          customer_id: cust.id,
          package_id: bookingState.packageId,
          package_title: bookingState.packageData.title,
          island_name: bookingState.packageData.island_name,
          check_in: checkIn,
          check_out: checkOut,
          guests: parseInt(guests),
          total_price: bookingState.totalPrice
        };
        localStorage.setItem('active_checkout', JSON.stringify(checkoutData));
        window.location.href = 'payment.html';

      } catch (e) {
        showToast('Booking submission failed. Please try again.', 'error');
      }
    });
  }
}

function renderBookingSummary() {
  const titleEl = document.getElementById('summary-pkg-title');
  const priceEl = document.getElementById('summary-pkg-price');
  const imgEl = document.getElementById('summary-pkg-img');

  if (titleEl && bookingState.packageData) {
    titleEl.textContent = bookingState.packageData.title;
    priceEl.textContent = `$${bookingState.totalPrice}`;
    if (imgEl) imgEl.src = bookingState.packageData.image_url;
  }
}

// ==========================================
// PAYMENT PAGE ENGINE
// ==========================================
async function initPaymentPage() {
  const checkoutData = JSON.parse(localStorage.getItem('active_checkout') || '{}');
  const orderSummaryContainer = document.getElementById('payment-order-summary');
  const amountToPayEl = document.getElementById('pay-total-amount');

  if (orderSummaryContainer && checkoutData.package_title) {
    orderSummaryContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
        <span>Package:</span>
        <strong>${checkoutData.package_title}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
        <span>Destination:</span>
        <strong>${checkoutData.island_name}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
        <span>Guests:</span>
        <strong>${checkoutData.guests} Guests</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
        <span>Dates:</span>
        <strong>${checkoutData.check_in} to ${checkoutData.check_out}</strong>
      </div>
      <hr style="margin: 1rem 0; border-color: rgba(0,0,0,0.1);" />
      <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:800; color:#0077B6;">
        <span>Total Amount:</span>
        <span>$${checkoutData.total_price}</span>
      </div>
    `;
    if (amountToPayEl) amountToPayEl.textContent = `$${checkoutData.total_price}`;
  }

  const payForm = document.getElementById('payment-form');
  if (payForm) {
    payForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const method = document.querySelector('input[name="payment_method"]:checked')?.value || 'Visa Signature';

      try {
        // 1. Create Booking in Django Backend
        const bookingRes = await apiFetch('/bookings/add/', {
          method: 'POST',
          body: JSON.stringify({
            customer_id: checkoutData.customer_id || 1,
            package_id: checkoutData.package_id || 1,
            check_in: checkoutData.check_in || '2026-08-01',
            check_out: checkoutData.check_out || '2026-08-07',
            guests: checkoutData.guests || 2,
            total_price: checkoutData.total_price || 4249.15,
            status: 'Confirmed'
          })
        });

        const createdBooking = bookingRes.data;

        // 2. Create Payment Record in Django Backend
        const paymentRes = await apiFetch('/payments/add/', {
          method: 'POST',
          body: JSON.stringify({
            booking_id: createdBooking.id,
            amount: createdBooking.total_price,
            payment_method: method,
            transaction_id: `TXN-${Date.now()}-${createdBooking.id}`,
            status: 'Success'
          })
        });

        // 3. Show Success Modal
        const successModal = document.getElementById('payment-success-modal');
        if (successModal) {
          document.getElementById('txn-modal-id').textContent = paymentRes.data.transaction_id;
          successModal.classList.add('active');
        } else {
          showToast('Payment completed successfully!', 'success');
          setTimeout(() => window.location.href = 'customer_dashboard.html', 1500);
        }

      } catch (err) {
        showToast('Payment failed: ' + err.message, 'error');
      }
    });
  }
}

// ==========================================
// CUSTOMER DASHBOARD
// ==========================================
async function loadCustomerDashboard() {
  const bookingsContainer = document.getElementById('customer-bookings-list');
  const paymentsContainer = document.getElementById('customer-payments-list');

  try {
    const bookingsRes = await apiFetch('/bookings/');
    const paymentsRes = await apiFetch('/payments/');

    if (bookingsContainer) {
      if (bookingsRes.data.length === 0) {
        bookingsContainer.innerHTML = '<p>No bookings found.</p>';
      } else {
        bookingsContainer.innerHTML = bookingsRes.data.map(b => `
          <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div>
              <div style="font-size:0.8rem; font-weight:700; color:#0077B6;">BOOKING #${b.id}</div>
              <h3 style="font-size:1.2rem; margin:0.2rem 0;">${b.package_title}</h3>
              <p style="font-size:0.9rem; color:#6C757D;"><i class="fas fa-map-marker-alt"></i> ${b.island_name}, ${b.island_country} &bull; ${b.check_in} to ${b.check_out}</p>
            </div>
            <div style="text-align:right;">
              <span class="badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${b.status}</span>
              <div style="font-size:1.3rem; font-weight:800; color:#0A192F; margin-top:0.4rem;">$${b.total_price}</div>
            </div>
          </div>
        `).join('');
      }
    }

    if (paymentsContainer) {
      paymentsContainer.innerHTML = paymentsRes.data.map(p => `
        <tr>
          <td>#${p.id}</td>
          <td>${p.transaction_id}</td>
          <td>${p.package_title}</td>
          <td>${p.payment_method}</td>
          <td>$${p.amount}</td>
          <td><span class="badge badge-success">${p.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Customer dashboard error:', e);
  }
}

// ==========================================
// ADMIN DASHBOARD & MODAL CRUD OPERATIONS
// ==========================================
async function loadAdminDashboard() {
  refreshAdminCounts();
  showAdminTab('islands');
}

async function refreshAdminCounts() {
  try {
    const islands = await apiFetch('/islands/');
    const packages = await apiFetch('/packages/');
    const bookings = await apiFetch('/bookings/');
    const customers = await apiFetch('/customers/');
    const payments = await apiFetch('/payments/');

    document.getElementById('count-islands').textContent = islands.data.length;
    document.getElementById('count-packages').textContent = packages.data.length;
    document.getElementById('count-bookings').textContent = bookings.data.length;
    document.getElementById('count-customers').textContent = customers.data.length;

    // Calculate total revenue
    const totalRev = payments.data.reduce((acc, p) => acc + p.amount, 0);
    document.getElementById('count-revenue').textContent = `$${totalRev.toLocaleString()}`;
  } catch (e) {
    console.error('Admin count error:', e);
  }
}

async function showAdminTab(tabName) {
  const contentArea = document.getElementById('admin-tab-content');
  if (!contentArea) return;

  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-tab="${tabName}"]`);
  if (activeLink) activeLink.classList.add('active');

  contentArea.innerHTML = '<div style="padding:4rem; text-align:center;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#0077B6;"></i><p style="margin-top:1rem;">Loading management table...</p></div>';

  if (tabName === 'islands') {
    const res = await apiFetch('/islands/');
    contentArea.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2><i class="fas fa-island-tropical" style="color:#0077B6;"></i> Island Management</h2>
        <button class="btn btn-primary btn-sm" onclick="openAddIslandModal()"><i class="fas fa-plus"></i> Add New Island</button>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th><th>Island</th><th>Country</th><th>Climate</th><th>Season</th><th>Price/Night</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(i => `
              <tr>
                <td>#${i.id}</td>
                <td><strong>${i.name}</strong></td>
                <td>${i.country}</td>
                <td>${i.climate}</td>
                <td>${i.best_season}</td>
                <td>$${i.price_per_night}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="deleteIslandAdmin(${i.id})"><i class="fas fa-trash" style="color:#FF6B6B;"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tabName === 'packages') {
    const res = await apiFetch('/packages/');
    contentArea.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2><i class="fas fa-box-open" style="color:#0077B6;"></i> Package Management</h2>
        <button class="btn btn-primary btn-sm" onclick="openAddPackageModal()"><i class="fas fa-plus"></i> Add Package</button>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th><th>Package Title</th><th>Island</th><th>Duration</th><th>Price</th><th>Discount</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(p => `
              <tr>
                <td>#${p.id}</td>
                <td><strong>${p.title}</strong></td>
                <td>${p.island_name}</td>
                <td>${p.duration_days} Days</td>
                <td>$${p.price}</td>
                <td>${p.discount_percent}%</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="deletePackageAdmin(${p.id})"><i class="fas fa-trash" style="color:#FF6B6B;"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tabName === 'bookings') {
    const res = await apiFetch('/bookings/');
    contentArea.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2><i class="fas fa-calendar-check" style="color:#0077B6;"></i> Booking Management</h2>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Package</th><th>Check In</th><th>Check Out</th><th>Price</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(b => `
              <tr>
                <td>#${b.id}</td>
                <td>${b.customer_name}</td>
                <td>${b.package_title}</td>
                <td>${b.check_in}</td>
                <td>${b.check_out}</td>
                <td>$${b.total_price}</td>
                <td><span class="badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${b.status}</span></td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="deleteBookingAdmin(${b.id})"><i class="fas fa-trash" style="color:#FF6B6B;"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tabName === 'customers') {
    const res = await apiFetch('/customers/');
    contentArea.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2><i class="fas fa-users" style="color:#0077B6;"></i> Customer Directory</h2>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Membership</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(c => `
              <tr>
                <td>#${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td><span class="badge badge-success">${c.membership}</span></td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="deleteCustomerAdmin(${c.id})"><i class="fas fa-trash" style="color:#FF6B6B;"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tabName === 'payments') {
    const res = await apiFetch('/payments/');
    contentArea.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2><i class="fas fa-receipt" style="color:#0077B6;"></i> Payment Ledger</h2>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th><th>Txn ID</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(p => `
              <tr>
                <td>#${p.id}</td>
                <td><code>${p.transaction_id}</code></td>
                <td>${p.customer_name}</td>
                <td>${p.payment_method}</td>
                <td>$${p.amount}</td>
                <td><span class="badge badge-success">${p.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

async function deleteIslandAdmin(id) {
  if (confirm('Are you sure you want to delete this island?')) {
    await apiFetch(`/islands/delete/${id}/`, { method: 'DELETE' });
    showToast('Island deleted', 'success');
    showAdminTab('islands');
    refreshAdminCounts();
  }
}

async function deletePackageAdmin(id) {
  if (confirm('Are you sure you want to delete this package?')) {
    await apiFetch(`/packages/delete/${id}/`, { method: 'DELETE' });
    showToast('Package deleted', 'success');
    showAdminTab('packages');
    refreshAdminCounts();
  }
}

async function deleteBookingAdmin(id) {
  if (confirm('Cancel and delete this booking?')) {
    await apiFetch(`/bookings/delete/${id}/`, { method: 'DELETE' });
    showToast('Booking deleted', 'success');
    showAdminTab('bookings');
    refreshAdminCounts();
  }
}

async function deleteCustomerAdmin(id) {
  if (confirm('Delete customer profile?')) {
    await apiFetch(`/customers/delete/${id}/`, { method: 'DELETE' });
    showToast('Customer deleted', 'success');
    showAdminTab('customers');
    refreshAdminCounts();
  }
}

function openAddIslandModal() {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  document.getElementById('admin-modal-title').textContent = 'Add New Tropical Island';
  document.getElementById('admin-modal-body').innerHTML = `
    <form id="add-island-form">
      <div class="form-group">
        <label class="form-label">Island Name</label>
        <input type="text" class="form-control" id="m-island-name" required placeholder="e.g. Kokomo Private Island" />
      </div>
      <div class="form-group">
        <label class="form-label">Country / Region</label>
        <input type="text" class="form-control" id="m-island-country" required placeholder="e.g. Fiji" />
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Climate</label>
          <input type="text" class="form-control" id="m-island-climate" value="Tropical Monsoonal" />
        </div>
        <div class="form-group">
          <label class="form-label">Best Season</label>
          <input type="text" class="form-control" id="m-island-season" value="May - Oct" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Price per Night ($)</label>
          <input type="number" class="form-control" id="m-island-price" value="750" />
        </div>
        <div class="form-group">
          <label class="form-label">Rating</label>
          <input type="number" step="0.1" class="form-control" id="m-island-rating" value="4.9" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Image URL (Unsplash)</label>
        <input type="url" class="form-control" id="m-island-image" value="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="m-island-desc" rows="3">Ultra luxury private island retreat with crystal lagoons.</textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Create Island Record</button>
    </form>
  `;
  modal.classList.add('active');

  document.getElementById('add-island-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await apiFetch('/islands/add/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('m-island-name').value,
        country: document.getElementById('m-island-country').value,
        climate: document.getElementById('m-island-climate').value,
        best_season: document.getElementById('m-island-season').value,
        price_per_night: parseFloat(document.getElementById('m-island-price').value),
        rating: parseFloat(document.getElementById('m-island-rating').value),
        image_url: document.getElementById('m-island-image').value,
        description: document.getElementById('m-island-desc').value,
        is_featured: true
      })
    });
    modal.classList.remove('active');
    showToast('Island added successfully!', 'success');
    showAdminTab('islands');
    refreshAdminCounts();
  });
}

function closeModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.remove('active');
}

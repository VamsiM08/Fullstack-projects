/* ==========================================================================
   Railway Reservation System - Complete Frontend JavaScript Engine
   ========================================================================== */

const API_BASE = 'http://127.0.0.1:8000';

// Global Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Session State
function getCurrentUser() {
  const userStr = localStorage.getItem('railway_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(userData, role = 'passenger') {
  localStorage.setItem('railway_user', JSON.stringify({ ...userData, role }));
}

function logout() {
  localStorage.removeItem('railway_user');
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 800);
}

function updateNavbar() {
  const user = getCurrentUser();
  const userArea = document.getElementById('nav-user-area');
  if (!userArea) return;

  if (user) {
    const dashboardLink = user.role === 'admin' ? 'admin_dashboard.html' : 'passenger_dashboard.html';
    userArea.innerHTML = `
      <div class="user-badge" style="gap: 1rem;">
        <span>👤 ${user.full_name || user.email} <strong style="color: var(--primary-cyan);">(${user.role.toUpperCase()})</strong></span>
        <a href="${dashboardLink}" class="nav-link" style="padding: 0.2rem 0.6rem;">Dashboard</a>
        <button onclick="logout()" class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Logout</button>
      </div>
    `;
  } else {
    userArea.innerHTML = `
      <a href="login.html" class="nav-link">Login</a>
      <a href="register.html" class="btn btn-primary" style="padding: 0.5rem 1rem;">Register</a>
    `;
  }
}

// Fetch API Universal Wrapper
async function apiRequest(endpoint, method = 'GET', data = null) {
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
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || `HTTP error! Status: ${res.status}`);
    }
    return result;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Global modal helper
function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

// ==========================================
// PAGE INITIALIZERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  
  const path = window.location.pathname.split('/').pop();

  if (path === 'index.html' || path === '') {
    initHomePage();
  } else if (path === 'trains.html') {
    initTrainsPage();
  } else if (path === 'train_details.html') {
    initTrainDetailsPage();
  } else if (path === 'booking.html') {
    initBookingPage();
  } else if (path === 'payment.html') {
    initPaymentPage();
  } else if (path === 'booking_history.html') {
    initBookingHistoryPage();
  } else if (path === 'passenger_dashboard.html') {
    initPassengerDashboardPage();
  } else if (path === 'admin_dashboard.html') {
    initAdminDashboardPage();
  } else if (path === 'login.html') {
    initLoginPage();
  } else if (path === 'register.html') {
    initRegisterPage();
  }
});

// ------------------------------------------
// 1. HOME PAGE
// ------------------------------------------
async function initHomePage() {
  const searchForm = document.getElementById('home-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const source = document.getElementById('search-source').value;
      const dest = document.getElementById('search-destination').value;
      const date = document.getElementById('search-date').value;
      window.location.href = `trains.html?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`;
    });
  }

  // Load Popular Routes & Schedules
  try {
    const schedules = await apiRequest('/schedules/');
    const container = document.getElementById('popular-schedules-list');
    if (container && Array.isArray(schedules)) {
      container.innerHTML = schedules.slice(0, 4).map(s => `
        <div class="card glass-panel">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-confirmed">⚡ Superfast</span>
              <strong style="color: var(--primary-cyan); font-size: 1.1rem;">₹${s.fare}</strong>
            </div>
            <h3 class="card-title">${s.train_name}</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
              📍 ${s.source} ➔ 📍 ${s.destination}
            </p>
            <div style="font-size: 0.85rem; color: var(--text-dim); display: flex; gap: 1rem;">
              <span>🕒 Dep: ${s.departure_time}</span>
              <span>🕒 Arr: ${s.arrival_time}</span>
            </div>
          </div>
          <div style="margin-top: 1.5rem;">
            <a href="trains.html?source=${encodeURIComponent(s.source)}&destination=${encodeURIComponent(s.destination)}" class="btn btn-primary" style="width: 100%;">View Availability</a>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error("Failed to load schedules", e);
  }
}

// ------------------------------------------
// 2. TRAIN SEARCH & LIST PAGE
// ------------------------------------------
let allFetchedTrains = [];
let allFetchedSchedules = [];

async function initTrainsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const src = urlParams.get('source') || '';
  const dest = urlParams.get('destination') || '';
  const date = urlParams.get('date') || '';

  if (document.getElementById('filter-source')) document.getElementById('filter-source').value = src;
  if (document.getElementById('filter-destination')) document.getElementById('filter-destination').value = dest;
  if (document.getElementById('filter-date')) document.getElementById('filter-date').value = date;

  await loadTrainsData();

  // Filters listener
  ['filter-source', 'filter-destination', 'filter-type', 'filter-max-fare'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyTrainFilters);
  });
}

async function loadTrainsData() {
  try {
    const [trains, schedules, bookings] = await Promise.all([
      apiRequest('/trains/'),
      apiRequest('/schedules/'),
      apiRequest('/bookings/')
    ]);

    allFetchedTrains = trains;
    allFetchedSchedules = schedules;
    window.allBookings = bookings; // Store for live availability computation

    applyTrainFilters();
  } catch (err) {
    showToast('Failed to load trains data', 'error');
  }
}

function applyTrainFilters() {
  const src = (document.getElementById('filter-source')?.value || '').toLowerCase();
  const dest = (document.getElementById('filter-destination')?.value || '').toLowerCase();
  const type = (document.getElementById('filter-type')?.value || '').toLowerCase();
  const maxFare = parseFloat(document.getElementById('filter-max-fare')?.value || 99999);

  const container = document.getElementById('trains-results-container');
  if (!container) return;

  // Match trains with schedules
  let filtered = allFetchedSchedules.filter(sch => {
    const matchSrc = !src || sch.source.toLowerCase().includes(src);
    const matchDest = !dest || sch.destination.toLowerCase().includes(dest);
    const matchFare = sch.fare <= maxFare;
    
    // find train type
    const trainObj = allFetchedTrains.find(t => t.train_name.toLowerCase() === sch.train_name.toLowerCase());
    const matchType = !type || (trainObj && trainObj.train_type.toLowerCase() === type);

    return matchSrc && matchDest && matchFare && matchType;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 3rem; text-align: center; grid-column: 1 / -1;">
        <h3>No Trains Found</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try modifying your search criteria or destination.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(sch => {
    const trainObj = allFetchedTrains.find(t => t.train_name.toLowerCase() === sch.train_name.toLowerCase()) || { total_seats: 500, train_number: 'N/A', train_type: 'Express' };
    
    // Live availability computation
    const confirmedCount = (window.allBookings || []).filter(b => b.train_name === sch.train_name && b.booking_status === 'Confirmed').length;
    const availableSeats = Math.max(0, trainObj.total_seats - confirmedCount);

    return `
      <div class="glass-panel card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="badge badge-confirmed">${trainObj.train_type}</span>
              <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">#${trainObj.train_number}</span>
            </div>
            <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-cyan);">₹${sch.fare}</span>
          </div>

          <h3 class="card-title">${sch.train_name}</h3>

          <div style="display: flex; justify-content: space-between; margin: 1.25rem 0; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 700; font-size: 1.1rem;">${sch.departure_time}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${sch.source}</div>
            </div>
            <div style="text-align: center; color: var(--text-dim); font-size: 0.8rem; align-self: center;">
              ➔
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 1.1rem;">${sch.arrival_time}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${sch.destination}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 1rem;">
            <span>Date: <strong>${sch.departure_date}</strong></span>
            <span style="color: ${availableSeats > 20 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}; font-weight: 700;">
              🟢 ${availableSeats} Seats Available
            </span>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <a href="train_details.html?schedule_id=${sch.schedule_id}" class="btn btn-secondary" style="flex: 1;">Details</a>
          <a href="booking.html?schedule_id=${sch.schedule_id}" class="btn btn-primary" style="flex: 1;">Book Now</a>
        </div>
      </div>
    `;
  }).join('');
}

// ------------------------------------------
// 3. TRAIN DETAILS PAGE
// ------------------------------------------
async function initTrainDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const sid = urlParams.get('schedule_id');
  if (!sid) return;

  try {
    const res = await apiRequest(`/schedules/${sid}/`);
    const sch = res.data;
    const trains = await apiRequest('/trains/');
    const trainObj = trains.find(t => t.train_name.toLowerCase() === sch.train_name.toLowerCase()) || {};

    document.getElementById('detail-train-name').innerText = sch.train_name;
    document.getElementById('detail-train-number').innerText = trainObj.train_number || '20678';
    document.getElementById('detail-source').innerText = sch.source;
    document.getElementById('detail-destination').innerText = sch.destination;
    document.getElementById('detail-dep-time').innerText = sch.departure_time;
    document.getElementById('detail-arr-time').innerText = sch.arrival_time;
    document.getElementById('detail-dep-date').innerText = sch.departure_date;
    document.getElementById('detail-fare').innerText = `₹${sch.fare}`;
    document.getElementById('detail-book-btn').href = `booking.html?schedule_id=${sch.schedule_id}`;
  } catch (err) {
    showToast('Failed to load train details', 'error');
  }
}

// ------------------------------------------
// 4. TICKET BOOKING PAGE
// ------------------------------------------
let selectedSeat = 'C5-18';
let currentSchedule = null;

async function initBookingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const sid = urlParams.get('schedule_id') || '301';

  const user = getCurrentUser();
  if (user && document.getElementById('book-passenger-name')) {
    document.getElementById('book-passenger-name').value = user.full_name || '';
  }

  try {
    const res = await apiRequest(`/schedules/${sid}/`);
    currentSchedule = res.data;

    document.getElementById('book-train-name').innerText = currentSchedule.train_name;
    document.getElementById('book-route').innerText = `${currentSchedule.source} ➔ ${currentSchedule.destination}`;
    document.getElementById('book-date').innerText = currentSchedule.departure_date;
    document.getElementById('book-fare-display').innerText = `₹${currentSchedule.fare}`;

    generateSeatGrid();
    
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
  } catch (err) {
    showToast('Error loading schedule for booking', 'error');
  }
}

function generateSeatGrid() {
  const grid = document.getElementById('seat-grid');
  if (!grid) return;

  const bookedSeats = ['C5-02', 'C5-08', 'C5-12', 'C5-15'];
  let html = '';
  for (let i = 1; i <= 24; i++) {
    const seatNo = `C5-${i < 10 ? '0' + i : i}`;
    const isBooked = bookedSeats.includes(seatNo);
    const isSelected = seatNo === selectedSeat;

    html += `
      <button type="button" 
        class="seat-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}" 
        ${isBooked ? 'disabled' : ''} 
        onclick="selectSeat('${seatNo}')">
        ${i}
      </button>
    `;
  }
  grid.innerHTML = html;
  if (document.getElementById('book-seat-number')) {
    document.getElementById('book-seat-number').value = selectedSeat;
  }
}

function selectSeat(seatNo) {
  selectedSeat = seatNo;
  generateSeatGrid();
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const user = getCurrentUser();
  const passengerName = document.getElementById('book-passenger-name').value || (user ? user.full_name : 'Rahul Sharma');
  const coachType = document.getElementById('book-coach-type').value;

  const bookingData = {
    booking_id: Math.floor(100 + Math.random() * 900),
    passenger_name: passengerName,
    train_name: currentSchedule ? currentSchedule.train_name : "Vande Bharat Express",
    journey_date: currentSchedule ? currentSchedule.departure_date : "2026-08-15",
    source: currentSchedule ? currentSchedule.source : "Chennai",
    destination: currentSchedule ? currentSchedule.destination : "Bangalore",
    coach_type: coachType,
    seat_number: selectedSeat,
    total_fare: currentSchedule ? currentSchedule.fare : 1200,
    booking_status: "Confirmed"
  };

  try {
    const res = await apiRequest('/bookings/add/', 'POST', bookingData);
    showToast('Ticket reserved successfully! Proceeding to payment...', 'success');
    sessionStorage.setItem('pending_booking', JSON.stringify(res.data));
    setTimeout(() => {
      window.location.href = `payment.html?booking_id=${res.data.booking_id}`;
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Failed to reserve ticket', 'error');
  }
}

// ------------------------------------------
// 5. PAYMENT PAGE
// ------------------------------------------
let pendingBookingData = null;

async function initPaymentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const bid = urlParams.get('booking_id');

  if (bid) {
    try {
      const res = await apiRequest(`/bookings/${bid}/`);
      pendingBookingData = res.data;
    } catch (e) {
      console.warn("Could not fetch booking from API, checking session");
    }
  }

  if (!pendingBookingData) {
    const sess = sessionStorage.getItem('pending_booking');
    if (sess) pendingBookingData = JSON.parse(sess);
  }

  if (pendingBookingData) {
    document.getElementById('pay-booking-id').innerText = `#${pendingBookingData.booking_id}`;
    document.getElementById('pay-passenger-name').innerText = pendingBookingData.passenger_name;
    document.getElementById('pay-train-name').innerText = pendingBookingData.train_name;
    document.getElementById('pay-amount').innerText = `₹${pendingBookingData.total_fare}`;
  }

  const payForm = document.getElementById('payment-form');
  if (payForm) {
    payForm.addEventListener('submit', handlePaymentSubmit);
  }
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const method = document.getElementById('payment-method').value;

  const paymentData = {
    payment_id: Math.floor(500 + Math.random() * 900),
    booking_id: pendingBookingData ? pendingBookingData.booking_id : 401,
    passenger_name: pendingBookingData ? pendingBookingData.passenger_name : "Rahul Sharma",
    amount: pendingBookingData ? pendingBookingData.total_fare : 1200,
    payment_method: method,
    payment_status: "Success",
    transaction_id: "TXN" + Math.floor(100000000 + Math.random() * 900000000),
    payment_date: new Date().toISOString().split('T')[0]
  };

  try {
    await apiRequest('/payments/add/', 'POST', paymentData);
    showToast('Payment successful! Ticket confirmed.', 'success');
    sessionStorage.removeItem('pending_booking');
    setTimeout(() => {
      window.location.href = 'booking_history.html';
    }, 1200);
  } catch (err) {
    showToast(err.message || 'Payment failed', 'error');
  }
}

// ------------------------------------------
// 6. BOOKING HISTORY & PNR PAGE
// ------------------------------------------
async function initBookingHistoryPage() {
  await loadBookingHistory();

  const pnrSearchBtn = document.getElementById('pnr-search-btn');
  if (pnrSearchBtn) {
    pnrSearchBtn.addEventListener('click', () => {
      const pnrInput = document.getElementById('pnr-input').value.trim();
      if (!pnrInput) return showToast('Please enter a Booking ID or PNR', 'error');
      searchPNR(pnrInput);
    });
  }
}

async function loadBookingHistory() {
  const container = document.getElementById('history-bookings-list');
  if (!container) return;

  try {
    const user = getCurrentUser();
    let bookings = await apiRequest('/bookings/');
    
    // Filter by current passenger if logged in as passenger
    if (user && user.role === 'passenger' && user.full_name) {
      bookings = bookings.filter(b => b.passenger_name.toLowerCase().includes(user.full_name.toLowerCase()));
    }

    if (bookings.length === 0) {
      container.innerHTML = `<div class="glass-panel" style="padding: 2rem; text-align: center;">No booking records found.</div>`;
      return;
    }

    container.innerHTML = bookings.map(b => `
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <span class="badge badge-${b.booking_status.toLowerCase()}">${b.booking_status}</span>
            <strong style="margin-left: 0.5rem; font-size: 1.1rem;">PNR / Booking #${b.booking_id}</strong>
          </div>
          <strong style="color: var(--primary-cyan); font-size: 1.2rem;">₹${b.total_fare}</strong>
        </div>

        <div class="form-row" style="margin: 1rem 0; font-size: 0.95rem;">
          <div>👤 Passenger: <strong>${b.passenger_name}</strong></div>
          <div>🚆 Train: <strong>${b.train_name}</strong></div>
          <div>📅 Date: <strong>${b.journey_date}</strong></div>
          <div>💺 Coach & Seat: <strong>${b.coach_type} (${b.seat_number})</strong></div>
          <div>📍 Route: <strong>${b.source} ➔ ${b.destination}</strong></div>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem;">
          <button onclick="downloadTicketPDF(${b.booking_id})" class="btn btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">📄 Print / PDF Ticket</button>
          ${b.booking_status !== 'Cancelled' ? `<button onclick="cancelBooking(${b.booking_id})" class="btn btn-danger" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">Cancel Ticket</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Error loading booking history', 'error');
  }
}

async function searchPNR(pnr) {
  try {
    const res = await apiRequest(`/bookings/${pnr}/`);
    const b = res.data;
    openModal('pnr-modal');
    document.getElementById('pnr-modal-body').innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span class="badge badge-${b.booking_status.toLowerCase()}" style="font-size: 1rem; padding: 0.5rem 1rem;">Status: ${b.booking_status}</span>
      </div>
      <div class="form-row" style="gap: 1rem;">
        <div><strong>Booking ID:</strong> #${b.booking_id}</div>
        <div><strong>Passenger:</strong> ${b.passenger_name}</div>
        <div><strong>Train:</strong> ${b.train_name}</div>
        <div><strong>Journey Date:</strong> ${b.journey_date}</div>
        <div><strong>Seat:</strong> ${b.coach_type} - ${b.seat_number}</div>
        <div><strong>Fare:</strong> ₹${b.total_fare}</div>
      </div>
    `;
  } catch (err) {
    showToast('Invalid PNR or Booking ID', 'error');
  }
}

async function cancelBooking(bid) {
  if (!confirm('Are you sure you want to cancel this ticket?')) return;
  try {
    await apiRequest(`/bookings/update/${bid}/`, 'PUT', { booking_status: 'Cancelled' });
    showToast('Booking cancelled successfully', 'success');
    loadBookingHistory();
  } catch (err) {
    showToast('Failed to cancel booking', 'error');
  }
}

async function downloadTicketPDF(bid) {
  try {
    const res = await apiRequest(`/bookings/${bid}/`);
    const b = res.data;

    const ticketWindow = window.open('', '_blank');
    ticketWindow.document.write(`
      <html>
      <head>
        <title>E-Ticket #${b.booking_id}</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; color: #111; }
          .ticket-box { border: 2px solid #00f2fe; border-radius: 12px; padding: 2rem; max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
          .status { background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <div class="ticket-box">
          <div class="header">
            <h2>🚆 Indian Railways E-Ticket</h2>
            <span class="status">${b.booking_status}</span>
          </div>
          <div class="row">
            <div><strong>PNR / Booking ID:</strong> #${b.booking_id}</div>
            <div><strong>Date:</strong> ${b.journey_date}</div>
          </div>
          <div class="row">
            <div><strong>Passenger:</strong> ${b.passenger_name}</div>
            <div><strong>Train:</strong> ${b.train_name}</div>
          </div>
          <div class="row">
            <div><strong>Route:</strong> ${b.source} ➔ ${b.destination}</div>
            <div><strong>Seat:</strong> ${b.coach_type} (${b.seat_number})</div>
          </div>
          <div class="row" style="border-top: 1px solid #eee; pt: 1rem;">
            <h3>Total Paid: ₹${b.total_fare}</h3>
          </div>
          <button onclick="window.print()" style="padding: 0.75rem 1.5rem; background: #00f2fe; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print E-Ticket</button>
        </div>
      </body>
      </html>
    `);
  } catch (e) {
    showToast('Failed to generate ticket PDF', 'error');
  }
}

// ------------------------------------------
// 7. PASSENGER DASHBOARD
// ------------------------------------------
async function initPassengerDashboardPage() {
  const user = getCurrentUser();
  if (user && document.getElementById('dash-user-name')) {
    document.getElementById('dash-user-name').innerText = user.full_name || 'Passenger';
  }

  try {
    const [bookings, payments] = await Promise.all([
      apiRequest('/bookings/'),
      apiRequest('/payments/')
    ]);

    const userBookings = user && user.full_name ? bookings.filter(b => b.passenger_name.toLowerCase().includes(user.full_name.toLowerCase())) : bookings;
    const userPayments = user && user.full_name ? payments.filter(p => p.passenger_name.toLowerCase().includes(user.full_name.toLowerCase())) : payments;

    document.getElementById('dash-total-bookings').innerText = userBookings.length;
    document.getElementById('dash-upcoming-trips').innerText = userBookings.filter(b => b.booking_status === 'Confirmed').length;
    document.getElementById('dash-cancelled-trips').innerText = userBookings.filter(b => b.booking_status === 'Cancelled').length;
    
    const totalSpend = userPayments.reduce((acc, p) => acc + p.amount, 0);
    document.getElementById('dash-total-spend').innerText = `₹${totalSpend}`;

    const paymentsTbody = document.getElementById('passenger-payments-tbody');
    if (paymentsTbody) {
      paymentsTbody.innerHTML = userPayments.map(p => `
        <tr>
          <td>#${p.payment_id}</td>
          <td>#${p.booking_id}</td>
          <td>₹${p.amount}</td>
          <td>${p.payment_method}</td>
          <td><code>${p.transaction_id}</code></td>
          <td><span class="badge badge-success">${p.payment_status}</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {
    showToast('Error loading dashboard stats', 'error');
  }
}

// ------------------------------------------
// 8. ADMIN DASHBOARD PAGE & CRUD MODALS
// ------------------------------------------
async function initAdminDashboardPage() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Admin access required. Please login as admin.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    return;
  }

  await loadAdminStats();
  await loadAdminPassengers();
  await loadAdminTrains();
  await loadAdminSchedules();
  await loadAdminBookings();
  await loadAdminPayments();
}

async function loadAdminStats() {
  try {
    const stats = await apiRequest('/stats/');
    if (document.getElementById('admin-stat-passengers')) document.getElementById('admin-stat-passengers').innerText = stats.total_passengers;
    if (document.getElementById('admin-stat-trains')) document.getElementById('admin-stat-trains').innerText = stats.total_trains;
    if (document.getElementById('admin-stat-schedules')) document.getElementById('admin-stat-schedules').innerText = stats.total_schedules;
    if (document.getElementById('admin-stat-bookings')) document.getElementById('admin-stat-bookings').innerText = stats.total_bookings;
    if (document.getElementById('admin-stat-revenue')) document.getElementById('admin-stat-revenue').innerText = `₹${stats.total_revenue}`;
  } catch (e) {}
}

// Admin Tab Switcher
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));
  
  const content = document.getElementById(`tab-${tabName}`);
  const btn = document.getElementById(`btn-tab-${tabName}`);
  if (content) content.style.display = 'block';
  if (btn) btn.classList.add('active');
}

// --- Passengers CRUD ---
async function loadAdminPassengers() {
  const tbody = document.getElementById('admin-passengers-tbody');
  if (!tbody) return;
  try {
    const data = await apiRequest('/passengers/');
    tbody.innerHTML = data.map(p => `
      <tr>
        <td>#${p.passenger_id}</td>
        <td>${p.full_name}</td>
        <td>${p.email}</td>
        <td>${p.phone}</td>
        <td>${p.gender} (${p.age})</td>
        <td>
          <button onclick="deletePassenger(${p.passenger_id})" class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function deletePassenger(pid) {
  if (!confirm('Delete passenger?')) return;
  try {
    await apiRequest(`/passengers/delete/${pid}/`, 'DELETE');
    showToast('Passenger deleted', 'success');
    loadAdminPassengers();
    loadAdminStats();
  } catch (e) { showToast('Delete failed', 'error'); }
}

// --- Trains CRUD ---
async function loadAdminTrains() {
  const tbody = document.getElementById('admin-trains-tbody');
  if (!tbody) return;
  try {
    const data = await apiRequest('/trains/');
    tbody.innerHTML = data.map(t => `
      <tr>
        <td>#${t.train_id}</td>
        <td>${t.train_name}</td>
        <td>${t.train_number}</td>
        <td><span class="badge badge-confirmed">${t.train_type}</span></td>
        <td>${t.total_seats}</td>
        <td>${t.source} ➔ ${t.destination}</td>
        <td>
          <button onclick="deleteTrain(${t.train_id})" class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function handleAddTrainSubmit(e) {
  e.preventDefault();
  const trainData = {
    train_id: parseInt(document.getElementById('add-train-id').value) || Math.floor(200 + Math.random() * 900),
    train_name: document.getElementById('add-train-name').value,
    train_number: document.getElementById('add-train-number').value,
    train_type: document.getElementById('add-train-type').value,
    total_seats: parseInt(document.getElementById('add-train-seats').value),
    source: document.getElementById('add-train-source').value,
    destination: document.getElementById('add-train-dest').value
  };

  try {
    await apiRequest('/trains/add/', 'POST', trainData);
    showToast('Train added successfully', 'success');
    closeModal('modal-add-train');
    loadAdminTrains();
    loadAdminStats();
  } catch (err) {
    showToast('Failed to add train', 'error');
  }
}

async function deleteTrain(tid) {
  if (!confirm('Delete train?')) return;
  try {
    await apiRequest(`/trains/delete/${tid}/`, 'DELETE');
    showToast('Train deleted', 'success');
    loadAdminTrains();
    loadAdminStats();
  } catch (e) { showToast('Delete failed', 'error'); }
}

// --- Schedules CRUD ---
async function loadAdminSchedules() {
  const tbody = document.getElementById('admin-schedules-tbody');
  if (!tbody) return;
  try {
    const data = await apiRequest('/schedules/');
    tbody.innerHTML = data.map(s => `
      <tr>
        <td>#${s.schedule_id}</td>
        <td>${s.train_name}</td>
        <td>${s.source} ➔ ${s.destination}</td>
        <td>${s.departure_date} (${s.departure_time})</td>
        <td>${s.arrival_date} (${s.arrival_time})</td>
        <td><strong>₹${s.fare}</strong></td>
        <td>
          <button onclick="deleteSchedule(${s.schedule_id})" class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function handleAddScheduleSubmit(e) {
  e.preventDefault();
  const data = {
    schedule_id: parseInt(document.getElementById('add-sch-id').value) || Math.floor(300 + Math.random() * 900),
    train_name: document.getElementById('add-sch-train').value,
    source: document.getElementById('add-sch-source').value,
    destination: document.getElementById('add-sch-dest').value,
    departure_date: document.getElementById('add-sch-dep-date').value,
    departure_time: document.getElementById('add-sch-dep-time').value,
    arrival_date: document.getElementById('add-sch-arr-date').value,
    arrival_time: document.getElementById('add-sch-arr-time').value,
    fare: parseFloat(document.getElementById('add-sch-fare').value)
  };

  try {
    await apiRequest('/schedules/add/', 'POST', data);
    showToast('Schedule added successfully', 'success');
    closeModal('modal-add-schedule');
    loadAdminSchedules();
    loadAdminStats();
  } catch (err) {
    showToast('Failed to add schedule', 'error');
  }
}

async function deleteSchedule(sid) {
  if (!confirm('Delete schedule?')) return;
  try {
    await apiRequest(`/schedules/delete/${sid}/`, 'DELETE');
    showToast('Schedule deleted', 'success');
    loadAdminSchedules();
    loadAdminStats();
  } catch (e) { showToast('Delete failed', 'error'); }
}

// --- Bookings & Payments Admin Lists ---
async function loadAdminBookings() {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;
  try {
    const data = await apiRequest('/bookings/');
    tbody.innerHTML = data.map(b => `
      <tr>
        <td>#${b.booking_id}</td>
        <td>${b.passenger_name}</td>
        <td>${b.train_name}</td>
        <td>${b.journey_date}</td>
        <td>${b.coach_type} (${b.seat_number})</td>
        <td><span class="badge badge-${b.booking_status.toLowerCase()}">${b.booking_status}</span></td>
        <td>
          <button onclick="cancelBooking(${b.booking_id})" class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Cancel</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function loadAdminPayments() {
  const tbody = document.getElementById('admin-payments-tbody');
  if (!tbody) return;
  try {
    const data = await apiRequest('/payments/');
    tbody.innerHTML = data.map(p => `
      <tr>
        <td>#${p.payment_id}</td>
        <td>#${p.booking_id}</td>
        <td>${p.passenger_name}</td>
        <td>₹${p.amount}</td>
        <td>${p.payment_method}</td>
        <td><code>${p.transaction_id}</code></td>
        <td><span class="badge badge-success">${p.payment_status}</span></td>
      </tr>
    `).join('');
  } catch (e) {}
}

// ------------------------------------------
// 9. LOGIN & REGISTER PAGES
// ------------------------------------------
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const role = document.getElementById('login-role').value;

      try {
        const res = await apiRequest('/login/', 'POST', { email, password, role });
        showToast(res.message, 'success');
        setCurrentUser(res.user, res.role);
        setTimeout(() => {
          if (res.role === 'admin') {
            window.location.href = 'admin_dashboard.html';
          } else {
            window.location.href = 'passenger_dashboard.html';
          }
        }, 1000);
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
      }
    });
  }
}

function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pData = {
        passenger_id: parseInt(document.getElementById('reg-id').value) || Math.floor(100 + Math.random() * 900),
        full_name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        gender: document.getElementById('reg-gender').value,
        age: parseInt(document.getElementById('reg-age').value),
        address: document.getElementById('reg-address').value,
        password: document.getElementById('reg-password').value
      };

      try {
        const res = await apiRequest('/passengers/add/', 'POST', pData);
        showToast('Registration successful! Logging in...', 'success');
        setCurrentUser(res.data, 'passenger');
        setTimeout(() => {
          window.location.href = 'passenger_dashboard.html';
        }, 1000);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    });
  }
}

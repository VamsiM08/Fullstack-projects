/* ==========================================================================
   EVENTHUB - CENTRAL FRONTEND SCRIPT (Fetch API & Application Engine)
   ========================================================================== */

const API_BASE_URL = 'http://127.0.0.1:8000';

// Storage Helper
const Storage = {
    getUser: () => JSON.parse(localStorage.getItem('eventhub_user') || 'null'),
    setUser: (user) => localStorage.setItem('eventhub_user', JSON.stringify(user)),
    clearUser: () => localStorage.removeItem('eventhub_user'),
    getDraftBooking: () => JSON.parse(localStorage.getItem('eventhub_draft_booking') || 'null'),
    setDraftBooking: (data) => localStorage.setItem('eventhub_draft_booking', JSON.stringify(data)),
    clearDraftBooking: () => localStorage.removeItem('eventhub_draft_booking')
};

// API Fetch Engine
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const resData = await response.json();
        if (!response.ok) {
            throw new Error(resData.error || resData.message || `HTTP error! status: ${response.status}`);
        }
        return resData;
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        throw err;
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${type === 'success' 
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' 
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'}
        </svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Render Global Navigation Bar
function renderNavbar() {
    const navContainer = document.getElementById('navbarContainer');
    if (!navContainer) return;

    const currentUser = Storage.getUser();
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    let userNavHTML = '';
    if (currentUser) {
        let dashboardLink = 'user_dashboard.html';
        if (currentUser.role === 'organizer') dashboardLink = 'organizer_dashboard.html';
        if (currentUser.role === 'admin') dashboardLink = 'admin_dashboard.html';

        userNavHTML = `
            <div class="nav-user">
                <a href="${dashboardLink}" class="nav-link ${currentPath === dashboardLink ? 'active' : ''}">
                    👤 ${currentUser.full_name} (${currentUser.role.toUpperCase()})
                </a>
                <a href="booking_history.html" class="nav-link ${currentPath === 'booking_history.html' ? 'active' : ''}">
                    🎟️ My Tickets
                </a>
                <button onclick="handleLogout()" class="btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">Logout</button>
            </div>
        `;
    } else {
        userNavHTML = `
            <div class="nav-user">
                <a href="login.html" class="nav-link ${currentPath === 'login.html' ? 'active' : ''}">Login</a>
                <a href="register.html" class="btn-primary" style="padding: 0.45rem 1.1rem; font-size: 0.9rem;">Register</a>
            </div>
        `;
    }

    navContainer.innerHTML = `
        <nav class="navbar">
            <a href="index.html" class="nav-brand">
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>EventHub</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html" class="nav-link ${currentPath === 'index.html' ? 'active' : ''}">Home</a></li>
                <li><a href="events.html" class="nav-link ${currentPath === 'events.html' ? 'active' : ''}">Explore Events</a></li>
                ${currentUser ? `<li><a href="booking_history.html" class="nav-link ${currentPath === 'booking_history.html' ? 'active' : ''}">Bookings</a></li>` : ''}
            </ul>
            ${userNavHTML}
        </nav>
    `;
}

function handleLogout() {
    Storage.clearUser();
    Storage.clearDraftBooking();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

// Generate SVG QR Code (Bonus Feature)
function generateSVGQRCode(text) {
    const encoded = encodeURIComponent(text);
    return `
        <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
            <rect width="140" height="140" fill="#ffffff" />
            <path d="M10 10h40v40H10zM60 10h20v20H60zM90 10h40v40H90zM20 20v20h20V20zM100 20v20h20V20z" fill="#0f172a" />
            <path d="M10 90h40v40H10zM20 100v20h20v-20zM60 50h20v20H60zM90 60h20v20H90zM60 90h30v20H60zM100 90h30v40h-30zM60 120h20v10H60z" fill="#0f172a" />
            <circle cx="70" cy="70" r="8" fill="#6366f1" />
        </svg>
    `;
}

// Global Modal Control
function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
}

// Auto Initialize Navbar on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
});

const API_BASE = "http://127.0.0.1:8000";

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
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// User Session Management
function getLoggedInUser() {
    const user = localStorage.getItem("delivery_customer");
    return user ? JSON.parse(user) : null;
}

function loginUser(customerData) {
    localStorage.setItem("delivery_customer", JSON.stringify(customerData));
    showToast(`Welcome back, ${customerData.full_name}!`, 'success');
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

function logoutUser() {
    localStorage.removeItem("delivery_customer");
    showToast("Logged out successfully.", 'success');
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

// API Utilities
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set headers
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (options.body && typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`Fetch API Error on ${endpoint}:`, error);
        throw error;
    }
}

// Dynamic Header Navigation
function renderHeader() {
    const headerElement = document.getElementById("global-header");
    if (!headerElement) return;

    const user = getLoggedInUser();
    const currentPath = window.location.pathname.split("/").pop();

    let navHTML = `
        <div class="navbar">
            <a href="index.html" class="logo-container">
                <span class="logo-icon">🍔</span>
                <span class="logo-text">GourmetGO</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html" class="nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a></li>
                <li><a href="restaurants.html" class="nav-link ${currentPath === 'restaurants.html' ? 'active' : ''}">Restaurants</a></li>
    `;

    if (user) {
        navHTML += `
                <li><a href="orders.html" class="nav-link ${currentPath === 'orders.html' ? 'active' : ''}">My Orders</a></li>
                <li>
                    <a href="cart.html" class="nav-link cart-link ${currentPath === 'cart.html' ? 'active' : ''}">
                        🛒 Cart <span class="cart-badge" id="nav-cart-count">0</span>
                    </a>
                </li>
                <li>
                    <div class="nav-profile">
                        <span class="profile-name">👤 ${user.full_name}</span>
                        <span class="logout-icon" title="Logout" onclick="logoutUser()">🔑</span>
                    </div>
                </li>
        `;
    } else {
        navHTML += `
                <li><a href="login.html" class="nav-link ${currentPath === 'login.html' ? 'active' : ''}">Login</a></li>
                <li><a href="register.html" class="nav-btn">Register</a></li>
        `;
    }

    // Always provide access to the dashboard for testing convenience
    navHTML += `
                <li><a href="dashboard.html" class="nav-link ${currentPath === 'dashboard.html' ? 'active' : ''}" style="border: 1px dashed var(--primary); border-radius:8px; padding: 0.3rem 0.6rem;">Admin</a></li>
            </ul>
        </div>
    `;

    headerElement.innerHTML = navHTML;
    
    // Update cart badge dynamically
    if (user) {
        updateCartBadgeCount(user.full_name);
    }
}

// Update the Cart count in navigation badge
async function updateCartBadgeCount(customerName) {
    try {
        const cartItems = await fetchAPI(`/cart/?customer_name=${encodeURIComponent(customerName)}`);
        const badge = document.getElementById("nav-cart-count");
        if (badge) {
            const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            badge.textContent = count;
        }
    } catch (err) {
        console.error("Error updating cart badge:", err);
    }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
});

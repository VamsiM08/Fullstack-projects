// Common API Configuration
const API_BASE = "http://127.0.0.1:8000/api";

// JWT and User details Storage
function saveSession(token, user) {
    localStorage.setItem("booking_jwt", token);
    localStorage.setItem("booking_user", JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem("booking_jwt");
    localStorage.removeItem("booking_user");
}

function getJWT() {
    return localStorage.getItem("booking_jwt");
}

function getCurrentUser() {
    const user = localStorage.getItem("booking_user");
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return getJWT() !== null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Global Headers Setup for APIs
async function apiRequest(endpoint, method = "GET", body = null) {
    const headers = {
        "Content-Type": "application/json"
    };
    
    const token = getJWT();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
        config.body = JSON.stringify(body);
    }

    try {
        const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}/${endpoint}`;
        const response = await fetch(url, config);
        
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            clearSession();
            showToast("Session expired. Please log in again.", "danger");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
            return null;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }
        return data;
    } catch (err) {
        console.error("API Request Error:", err);
        showToast(err.message, "danger");
        throw err;
    }
}

// Toast Notifications Helper
function showToast(message, type = "info") {
    // Check if toast element exists, if not create it
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    // Set styling based on type
    toast.style.display = "flex";
    toast.className = "toast show";
    
    let iconClass = "fa-info-circle";
    let iconColor = "#3B82F6";
    if (type === "success") {
        iconClass = "fa-check-circle";
        iconColor = "#10B981";
    } else if (type === "danger") {
        iconClass = "fa-exclamation-circle";
        iconColor = "#EF4444";
    } else if (type === "warning") {
        iconClass = "fa-exclamation-triangle";
        iconColor = "#F59E0B";
    }

    toast.innerHTML = `
        <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 1.25rem;"></i>
        <span>${message}</span>
    `;

    // Clear previous timeouts if click triggers multiple
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.style.display = "none";
        }, 400);
    }, 3500);
}

// Load FontAwesome icons script
(function loadFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
})();

// Helper to extract Query Parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Dynamic Navigation Header builder
function renderHeader() {
    const header = document.querySelector("header");
    if (!header) return;

    const user = getCurrentUser();
    let navLinksHtml = `
        <li><a href="index.html" class="${window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') ? 'active' : ''}">Home</a></li>
    `;

    if (user) {
        if (user.role === 'admin') {
            navLinksHtml += `<li><a href="admin.html" class="${window.location.pathname.endsWith('admin.html') ? 'active' : ''}">Admin Portal</a></li>`;
        }
        navLinksHtml += `
            <li><a href="profile.html" class="${window.location.pathname.endsWith('profile.html') ? 'active' : ''}">My Bookings</a></li>
            <li><a href="#" id="nav-logout-btn" class="btn-secondary" style="padding: 0.4rem 1rem;">Logout</a></li>
        `;
    } else {
        navLinksHtml += `
            <li><a href="login.html" class="btn-primary" style="padding: 0.5rem 1.2rem; display: inline-block;">Login / Register</a></li>
        `;
    }

    header.innerHTML = `
        <a href="index.html" class="logo"><i class="fas fa-ticket-alt" style="margin-right: 0.5rem;"></i>CinePass</a>
        <ul class="nav-links">
            ${navLinksHtml}
        </ul>
    `;

    // Hook logout handler
    const logoutBtn = document.getElementById("nav-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearSession();
            showToast("Logged out successfully", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        });
    }
}

// Execute common loads on startup
document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
});

// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const API_BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupNavbarAuth();
    setupMobileMenu();
    initGlobalCounters();
    
    // Automatically hide loading screen if present
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, 300);
    }
});

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '💡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ==========================================================================
// THEME MANAGER (DARK / LIGHT)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode Enabled`, 'info');
        });
    }
}

// ==========================================================================
// AUTH STATE MANAGEMENT (SESSION STORAGE)
// ==========================================================================
function saveSession(userData, role) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userEmail', userData.email);
    
    // Save relevant display names and IDs
    if (role === 'customer') {
        sessionStorage.setItem('userId', userData.id || userData.customer_id);
        sessionStorage.setItem('userName', userData.full_name);
        sessionStorage.setItem('customerId', userData.customer_id);
    } else if (role === 'driver') {
        sessionStorage.setItem('userId', userData.id || userData.driver_id);
        sessionStorage.setItem('userName', userData.driver_name);
        sessionStorage.setItem('driverId', userData.driver_id);
    } else if (role === 'admin') {
        sessionStorage.setItem('userId', 'ADMIN');
        sessionStorage.setItem('userName', userData.full_name);
    }
}

function getSession() {
    return {
        isLoggedIn: sessionStorage.getItem('isLoggedIn') === 'true',
        role: sessionStorage.getItem('userRole'),
        email: sessionStorage.getItem('userEmail'),
        userId: sessionStorage.getItem('userId'),
        userName: sessionStorage.getItem('userName'),
        customerId: sessionStorage.getItem('customerId'),
        driverId: sessionStorage.getItem('driverId')
    };
}

function clearSession() {
    sessionStorage.clear();
    showToast("Logged out successfully.", "info");
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

function setupNavbarAuth() {
    const session = getSession();
    
    // Toggle items based on logged in status
    const guestLinks = document.querySelectorAll('.guest-only');
    const authLinks = document.querySelectorAll('.auth-only');
    const customerLinks = document.querySelectorAll('.customer-only');
    const driverLinks = document.querySelectorAll('.driver-only');
    const adminLinks = document.querySelectorAll('.admin-only');
    
    if (session.isLoggedIn) {
        guestLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        authLinks.forEach(el => el.style.removeProperty('display'));
        
        // Show role specific links
        if (session.role === 'customer') {
            customerLinks.forEach(el => el.style.removeProperty('display'));
            driverLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
            adminLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        } else if (session.role === 'driver') {
            customerLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
            driverLinks.forEach(el => el.style.removeProperty('display'));
            adminLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        } else if (session.role === 'admin') {
            customerLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
            driverLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
            adminLinks.forEach(el => el.style.removeProperty('display'));
        }
        
        // Update user display names
        const userNamePlaceholder = document.getElementById('navbar-user-name');
        if (userNamePlaceholder) {
            userNamePlaceholder.innerText = session.userName;
        }
    } else {
        guestLinks.forEach(el => el.style.removeProperty('display'));
        authLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        customerLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        driverLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
        adminLinks.forEach(el => el.style.setProperty('display', 'none', 'important'));
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links-container');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = 'var(--navbar-bg)';
            navLinks.style.padding = '1.5rem';
            navLinks.style.gap = '1rem';
        });
    }
}

// ==========================================================================
// COUNTER ANIMATIONS (INDEX PAGE)
// ==========================================================================
function initGlobalCounters() {
    const counters = document.querySelectorAll('.counter-anim');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const speed = 100; // Alter speed here
        const updateCount = () => {
            const count = +counter.innerText;
            const inc = target / speed;
            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });
}

// ==========================================================================
// FORM VALIDATIONS
// ==========================================================================
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    // Basic phone validation (digits and optional plus symbol)
    const re = /^\+?[0-9]{10,14}$/;
    return re.test(phone);
}

// ==========================================================================
// API FETCH HELPERS
// ==========================================================================
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            // DRF returns errors in objects or lists. Convert to friendly formats.
            let errMsg = data.error || "An error occurred.";
            if (typeof data === 'object' && !data.error) {
                const keys = Object.keys(data);
                if (keys.length > 0) {
                    const firstVal = data[keys[0]];
                    errMsg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
                }
            }
            throw new Error(errMsg);
        }
        return data;
    } catch (err) {
        showToast(err.message, "error");
        throw err;
    }
}

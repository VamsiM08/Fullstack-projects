// --- API CONFIGURATION ---
const API_BASE = 'http://127.0.0.1:8000';

// --- UTILITY: TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'toastFadeIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- UTILITY: FETCH API WRAPPER ---
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    const config = {
        ...options,
        headers
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

// --- USER SESSION STATE ---
const Session = {
    getUser() {
        const userStr = localStorage.getItem('bus_passenger_user');
        return userStr ? JSON.parse(userStr) : null;
    },
    setUser(user) {
        localStorage.setItem('bus_passenger_user', JSON.stringify(user));
    },
    isAdmin() {
        const user = this.getUser();
        return user && user.email === 'admin@bus.com';
    },
    logout() {
        localStorage.removeItem('bus_passenger_user');
        showToast('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    },
    checkAuth(requireAdmin = false) {
        const user = this.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        if (requireAdmin && !this.isAdmin()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};

// --- DYNAMIC NAVBAR RENDERER ---
function renderNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    
    const user = Session.getUser();
    const isAdmin = Session.isAdmin();
    
    let linksHtml = `
        <li><a href="index.html" class="nav-link ${isActivePage('index.html') ? 'active' : ''}">Home</a></li>
        <li><a href="buses.html" class="nav-link ${isActivePage('buses.html') ? 'active' : ''}">Search Buses</a></li>
    `;
    
    if (user) {
        if (isAdmin) {
            linksHtml += `
                <li><a href="admin_dashboard.html" class="nav-link ${isActivePage('admin_dashboard.html') ? 'active' : ''}">Admin Panel</a></li>
            `;
        } else {
            linksHtml += `
                <li><a href="passenger_dashboard.html" class="nav-link ${isActivePage('passenger_dashboard.html') ? 'active' : ''}">Dashboard</a></li>
                <li><a href="history.html" class="nav-link ${isActivePage('history.html') ? 'active' : ''}">My Bookings</a></li>
            `;
        }
    }
    
    let authHtml = '';
    if (user) {
        authHtml = `
            <span style="font-size: 0.9rem; color: var(--primary); font-weight: 600;">
                <i class="fas fa-user-circle"></i> Hi, ${user.full_name.split(' ')[0]}
            </span>
            <button onclick="Session.logout()" class="nav-btn nav-btn-outline">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    } else {
        authHtml = `
            <a href="login.html" class="nav-btn nav-btn-outline">Login</a>
            <a href="register.html" class="nav-btn nav-btn-primary">Register</a>
        `;
    }
    
    container.innerHTML = `
        <div class="nav-container">
            <a href="index.html" class="nav-logo">
                <i class="fas fa-bus-alt"></i>
                <span>Antigravity Bus</span>
            </a>
            <ul class="nav-links">
                ${linksHtml}
            </ul>
            <div class="nav-auth">
                ${authHtml}
            </div>
        </div>
    `;
}

function isActivePage(filename) {
    return window.location.pathname.endsWith(filename);
}

// --- DYNAMIC SEARCH & HOME FLOW ---
function initHomePage() {
    renderNavbar();
    
    const searchForm = document.getElementById('home-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const source = document.getElementById('source').value;
            const destination = document.getElementById('destination').value;
            const date = document.getElementById('journey_date').value;
            
            if (!source || !destination || !date) {
                showToast('Please fill all search inputs', 'error');
                return;
            }
            
            window.location.href = `buses.html?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
        });
    }
    
    // Set minimum date to today
    const dateInput = document.getElementById('journey_date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
    
    renderPopularRoutes();
}

async function renderPopularRoutes() {
    const grid = document.getElementById('popular-routes-grid');
    if (!grid) return;
    
    try {
        const routes = await apiFetch('/routes/');
        // Limit to 3 popular routes
        const displayRoutes = routes.slice(0, 3);
        
        if (displayRoutes.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No routes available at the moment.</div>';
            return;
        }
        
        grid.innerHTML = displayRoutes.map(r => `
            <div class="route-card" onclick="selectRoute('${r.source}', '${r.destination}')">
                <div class="route-card-header">
                    <div class="route-cities">
                        <span>${r.source}</span>
                        <i class="fas fa-arrow-right"></i>
                        <span>${r.destination}</span>
                    </div>
                    <div class="route-price">₹${r.fare}</div>
                </div>
                <div class="route-details">
                    <span><i class="fas fa-bus"></i> ${r.bus_name}</span>
                    <span><i class="far fa-clock"></i> Departs: ${r.departure_time}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent);">Failed to load routes.</div>`;
    }
}

function selectRoute(source, destination) {
    const searchForm = document.getElementById('home-search-form');
    if (searchForm) {
        document.getElementById('source').value = source;
        document.getElementById('destination').value = destination;
        document.getElementById('journey_date').focus();
        showToast(`Selected route: ${source} to ${destination}. Please select journey date.`);
    } else {
        const today = new Date().toISOString().split('T')[0];
        window.location.href = `buses.html?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${today}`;
    }
}

// --- PASSENGER REGISTRATION / LOGIN ---
function initAuthPages() {
    renderNavbar();
    
    // Registration handling
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('reg_name').value.trim();
            const email = document.getElementById('reg_email').value.trim();
            const phone = document.getElementById('reg_phone').value.trim();
            const gender = document.getElementById('reg_gender').value;
            const address = document.getElementById('reg_address').value.trim();
            const password = document.getElementById('reg_password').value;
            
            if (!fullName || !email || !phone || !gender || !address || !password) {
                showToast('Please fill out all fields', 'error');
                return;
            }
            
            try {
                const response = await apiFetch('/passengers/add/', {
                    method: 'POST',
                    body: {
                        full_name: fullName,
                        email,
                        phone,
                        gender,
                        address,
                        password
                    }
                });
                showToast('Registration successful! Please login.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
    
    // Login handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login_email').value.trim();
            const password = document.getElementById('login_password').value;
            
            if (!email || !password) {
                showToast('Please fill out all fields', 'error');
                return;
            }
            
            // Handle Admin Login bypass
            if (email === 'admin@bus.com' && password === 'admin123') {
                Session.setUser({
                    passenger_id: 999,
                    full_name: 'System Administrator',
                    email: 'admin@bus.com'
                });
                showToast('Admin logged in successfully!');
                setTimeout(() => {
                    window.location.href = 'admin_dashboard.html';
                }, 800);
                return;
            }
            
            try {
                const passengers = await apiFetch(`/passengers/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                if (passengers && passengers.length > 0) {
                    Session.setUser(passengers[0]);
                    showToast('Login successful!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 800);
                } else {
                    showToast('Invalid email or password', 'error');
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}

// --- BUS SEARCH AND FILTERS ---
let allRoutes = [];
let allBuses = [];
let filteredRoutes = [];
let searchParams = { source: '', destination: '', date: '' };

async function initBusesPage() {
    renderNavbar();
    
    const params = new URLSearchParams(window.location.search);
    searchParams.source = params.get('source') || '';
    searchParams.destination = params.get('destination') || '';
    searchParams.date = params.get('date') || '';
    
    // Prefill form inputs if available
    const srcInput = document.getElementById('search_source');
    const destInput = document.getElementById('search_destination');
    const dateInput = document.getElementById('search_date');
    
    if (srcInput) srcInput.value = searchParams.source;
    if (destInput) destInput.value = searchParams.destination;
    if (dateInput) {
        dateInput.value = searchParams.date;
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
    
    // Bind search form submit
    const searchForm = document.getElementById('buses-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const source = srcInput.value.trim();
            const destination = destInput.value.trim();
            const date = dateInput.value;
            
            if (!source || !destination || !date) {
                showToast('Please fill all search inputs', 'error');
                return;
            }
            
            window.location.href = `buses.html?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
        });
    }
    
    // Setup filter listeners
    setupFilters();
    
    // Load data
    await loadBusesAndRoutes();
}

async function loadBusesAndRoutes() {
    const listContainer = document.getElementById('bus-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Fetch matching routes
        let routeUrl = '/routes/';
        if (searchParams.source && searchParams.destination) {
            routeUrl += `?source=${encodeURIComponent(searchParams.source)}&destination=${encodeURIComponent(searchParams.destination)}`;
        }
        allRoutes = await apiFetch(routeUrl);
        
        // Fetch all buses to link bus details (type, operator, seats)
        allBuses = await apiFetch('/buses/');
        
        applyFiltersAndRender();
    } catch (err) {
        listContainer.innerHTML = `<div style="text-align:center; color:var(--accent);">Failed to load buses data: ${err.message}</div>`;
    }
}

function setupFilters() {
    // Price range slider
    const priceSlider = document.getElementById('price-range');
    const priceValLabel = document.getElementById('price-val');
    if (priceSlider && priceValLabel) {
        priceSlider.addEventListener('input', (e) => {
            priceValLabel.textContent = `₹${e.target.value}`;
            applyFiltersAndRender();
        });
    }
    
    // Checkboxes and selects
    const filters = ['filter-ac-sleeper', 'filter-non-ac-sleeper', 'filter-ac-seater', 'filter-non-ac-seater', 'filter-luxury', 'sort-by'];
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', applyFiltersAndRender);
        }
    });
    
    // Time slots
    const timeButtons = document.querySelectorAll('.time-slot-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            applyFiltersAndRender();
        });
    });
}

function applyFiltersAndRender() {
    const listContainer = document.getElementById('bus-list-container');
    if (!listContainer) return;
    
    // 1. Get filter inputs
    const priceSlider = document.getElementById('price-range');
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 3000;
    
    const types = [];
    if (document.getElementById('filter-ac-sleeper')?.checked) types.push('AC Sleeper');
    if (document.getElementById('filter-non-ac-sleeper')?.checked) types.push('Non-AC Sleeper');
    if (document.getElementById('filter-ac-seater')?.checked) types.push('AC Seater');
    if (document.getElementById('filter-non-ac-seater')?.checked) types.push('Non-AC Seater');
    if (document.getElementById('filter-luxury')?.checked) types.push('Luxury');
    
    const selectedTimeSlots = [];
    document.querySelectorAll('.time-slot-btn.active').forEach(btn => {
        selectedTimeSlots.push(btn.dataset.time); // morning, afternoon, evening, night
    });
    
    // 2. Filter routes
    let results = allRoutes.map(route => {
        // Find matching bus
        const bus = allBuses.find(b => b.bus_name.toLowerCase() === route.bus_name.toLowerCase());
        return {
            ...route,
            bus_type: bus ? bus.bus_type : 'AC Seater',
            total_seats: bus ? bus.total_seats : 40,
            operator_name: bus ? bus.operator_name : route.bus_name,
            bus_number: bus ? bus.bus_number : 'TS09AB9999'
        };
    });
    
    // Apply Price filter
    results = results.filter(r => r.fare <= maxPrice);
    
    // Apply Bus Type filter
    if (types.length > 0) {
        results = results.filter(r => types.includes(r.bus_type));
    }
    
    // Apply Departure Time filter
    if (selectedTimeSlots.length > 0) {
        results = results.filter(r => {
            const hour = parseInt(r.departure_time.split(':')[0]);
            if (selectedTimeSlots.includes('morning') && hour >= 6 && hour < 12) return true;
            if (selectedTimeSlots.includes('afternoon') && hour >= 12 && hour < 17) return true;
            if (selectedTimeSlots.includes('evening') && hour >= 17 && hour < 21) return true;
            if (selectedTimeSlots.includes('night') && (hour >= 21 || hour < 6)) return true;
            return false;
        });
    }
    
    // 3. Sort results
    const sortBy = document.getElementById('sort-by')?.value;
    if (sortBy === 'price-low') {
        results.sort((a, b) => a.fare - b.fare);
    } else if (sortBy === 'price-high') {
        results.sort((a, b) => b.fare - a.fare);
    } else if (sortBy === 'time-early') {
        results.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }
    
    // 4. Render
    if (results.length === 0) {
        listContainer.innerHTML = `
            <div class="glass-panel" style="text-align: center; padding: 3rem;">
                <i class="fas fa-bus-alt" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <h3>No Buses Found</h3>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">Try adjusting your search criteria or filters.</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = results.map(r => `
        <div class="bus-card">
            <div class="bus-card-main">
                <div class="bus-info">
                    <div class="bus-name-badge">
                        <h3>${r.bus_name}</h3>
                        <span class="bus-badge">${r.bus_type}</span>
                    </div>
                    <div class="bus-operator">Operator: ${r.operator_name} | Number: ${r.bus_number}</div>
                </div>
                
                <div class="bus-schedule-grid">
                    <div>
                        <div class="schedule-time">${r.departure_time}</div>
                        <div class="schedule-city">${r.source}</div>
                    </div>
                    <div class="schedule-duration">
                        <span>Duration</span>
                        <div class="duration-line"></div>
                        <span>Approx. 9 hrs</span>
                    </div>
                    <div>
                        <div class="schedule-time">${r.arrival_time}</div>
                        <div class="schedule-city">${r.destination}</div>
                    </div>
                </div>
                
                <div class="bus-pricing-action">
                    <div class="bus-fare">₹${r.fare}</div>
                    <div class="bus-seats-left">Seats Left: ${r.total_seats}</div>
                    <button onclick="bookBus(${r.route_id}, '${searchParams.date}')" class="btn-book">Book Now</button>
                </div>
            </div>
        </div>
    `).join('');
}

function bookBus(routeId, date) {
    if (!Session.getUser()) {
        showToast('Please login to book tickets', 'error');
        setTimeout(() => {
            window.location.href = `login.html`;
        }, 1000);
        return;
    }
    if (!date) {
        showToast('Please enter a journey date', 'error');
        return;
    }
    window.location.href = `booking.html?route_id=${routeId}&date=${date}`;
}

// --- BOOKING SCREEN WITH SEAT SELECTION ---
let selectedSeats = [];
let routeDetail = null;
let occupiedSeats = [];

async function initBookingPage() {
    if (!Session.checkAuth()) return;
    renderNavbar();
    
    const params = new URLSearchParams(window.location.search);
    const routeId = params.get('route_id');
    const date = params.get('date');
    
    if (!routeId || !date) {
        showToast('Missing booking details', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Fetch route details
        routeDetail = await apiFetch(`/routes/update/${routeId}/`); // Wait, our update endpoint responds with the route on GET if we adjust or we can just fetch all routes and find the ID!
    } catch (err) {
        // If route detail GET directly doesn't work, fetch all and search
        try {
            const routes = await apiFetch('/routes/');
            routeDetail = routes.find(r => r.route_id === parseInt(routeId));
        } catch (innerErr) {
            showToast('Failed to load route detail', 'error');
            return;
        }
    }
    
    if (!routeDetail) {
        showToast('Route details not found', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    // Fetch occupied seats for this bus and date
    try {
        const bookings = await apiFetch(`/bookings/?bus_name=${encodeURIComponent(routeDetail.bus_name)}&journey_date=${encodeURIComponent(date)}`);
        occupiedSeats = bookings
            .filter(b => b.booking_status !== 'Cancelled')
            .map(b => b.seat_number);
    } catch (err) {
        console.warn('Could not fetch existing bookings, setting empty.', err);
        occupiedSeats = [];
    }
    
    renderBookingSidebar(date);
    renderSeatLayout();
}

function renderBookingSidebar(date) {
    const container = document.getElementById('booking-summary-container');
    if (!container) return;
    
    const totalFare = selectedSeats.length * routeDetail.fare;
    
    // Fill passenger details prefill
    const user = Session.getUser();
    const nameInput = document.getElementById('pass_name');
    const emailInput = document.getElementById('pass_email');
    if (nameInput) nameInput.value = user.full_name;
    if (emailInput) emailInput.value = user.email;
    
    container.innerHTML = `
        <h3>Ticket Summary</h3>
        <div class="summary-list">
            <div class="summary-item">
                <span class="summary-label">Bus Name</span>
                <span class="summary-val">${routeDetail.bus_name}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Route</span>
                <span class="summary-val">${routeDetail.source} <i class="fas fa-arrow-right" style="font-size:0.8rem"></i> ${routeDetail.destination}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Departure</span>
                <span class="summary-val">${routeDetail.departure_time}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Journey Date</span>
                <span class="summary-val">${date}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Selected Seats</span>
                <span class="summary-val">${selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Fare per Seat</span>
                <span class="summary-val">₹${routeDetail.fare}</span>
            </div>
            <div class="summary-total">
                <span>Total Amount</span>
                <span class="summary-val">₹${totalFare}</span>
            </div>
        </div>
        
        <button onclick="proceedToPayment('${date}')" class="btn-checkout" ${selectedSeats.length === 0 ? 'disabled' : ''}>
            Proceed to Payment <i class="fas fa-credit-card"></i>
        </button>
    `;
}

function renderSeatLayout() {
    const layout = document.getElementById('seats-grid-layout');
    if (!layout) return;
    
    layout.innerHTML = '';
    
    // Generate 40 seats: A1..A10, B1..B10, C1..C10, D1..D10
    // Rows: A, B (Left Side of Aisle), Aisle, C, D (Right Side of Aisle)
    const rows = ['A', 'B', 'C', 'D'];
    
    for (let r = 0; r < 4; r++) {
        for (let num = 1; num <= 10; num++) {
            const seatLabel = `${rows[r]}${num}`;
            const isOccupied = occupiedSeats.includes(seatLabel);
            const isSelected = selectedSeats.includes(seatLabel);
            
            const seatDiv = document.createElement('div');
            seatDiv.className = `seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`;
            seatDiv.textContent = seatLabel;
            
            if (!isOccupied) {
                seatDiv.addEventListener('click', () => toggleSeat(seatLabel));
            }
            
            layout.appendChild(seatDiv);
        }
    }
}

function toggleSeat(seatLabel) {
    const index = selectedSeats.indexOf(seatLabel);
    if (index > -1) {
        selectedSeats.splice(index, 1);
    } else {
        // Limit max seats booking at once to 6
        if (selectedSeats.length >= 6) {
            showToast('You can select a maximum of 6 seats', 'error');
            return;
        }
        selectedSeats.push(seatLabel);
    }
    
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    
    renderSeatLayout();
    renderBookingSidebar(date);
}

function proceedToPayment(date) {
    if (selectedSeats.length === 0) {
        showToast('Please select at least one seat', 'error');
        return;
    }
    
    const nameInput = document.getElementById('pass_name').value.trim();
    if (!nameInput) {
        showToast('Please enter passenger name', 'error');
        return;
    }
    
    // Store checkout session details in sessionStorage
    const checkoutData = {
        passenger_name: nameInput,
        route_id: routeDetail.route_id,
        bus_name: routeDetail.bus_name,
        source: routeDetail.source,
        destination: routeDetail.destination,
        journey_date: date,
        seats: selectedSeats,
        ticket_price: routeDetail.fare,
        total_fare: selectedSeats.length * routeDetail.fare
    };
    
    sessionStorage.setItem('bus_checkout_data', JSON.stringify(checkoutData));
    window.location.href = 'payment.html';
}

// --- PAYMENT SCREEN ---
let checkoutData = null;
let selectedPaymentMethod = '';

function initPaymentPage() {
    if (!Session.checkAuth()) return;
    renderNavbar();
    
    checkoutData = JSON.parse(sessionStorage.getItem('bus_checkout_data'));
    if (!checkoutData) {
        showToast('No transaction details found', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    renderPaymentSummary();
    setupPaymentMethods();
}

function renderPaymentSummary() {
    const list = document.getElementById('payment-summary-list');
    const totalFareSpan = document.getElementById('payment-total-fare');
    if (!list || !totalFareSpan) return;
    
    list.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Passenger Name</span>
            <span class="summary-val">${checkoutData.passenger_name}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Bus</span>
            <span class="summary-val">${checkoutData.bus_name}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Route</span>
            <span class="summary-val">${checkoutData.source} <i class="fas fa-arrow-right" style="font-size:0.8rem"></i> ${checkoutData.destination}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Journey Date</span>
            <span class="summary-val">${checkoutData.journey_date}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Selected Seats</span>
            <span class="summary-val">${checkoutData.seats.join(', ')}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Seat Quantity</span>
            <span class="summary-val">${checkoutData.seats.length}</span>
        </div>
    `;
    
    totalFareSpan.textContent = `₹${checkoutData.total_fare}`;
}

function setupPaymentMethods() {
    const cards = document.querySelectorAll('.payment-method-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPaymentMethod = card.dataset.method;
            
            // Enable confirm button
            const confirmBtn = document.getElementById('confirm-payment-btn');
            if (confirmBtn) confirmBtn.disabled = false;
        });
    });
    
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', submitBookingAndPayment);
    }
}

async function submitBookingAndPayment() {
    if (!selectedPaymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    
    try {
        const txnId = 'TXN' + Math.floor(100000000 + Math.random() * 900000000);
        
        // Loop over each selected seat and create separate booking records
        // As defined in standard passenger ticket bookings
        const bookingIds = [];
        
        for (const seat of checkoutData.seats) {
            const bookingResponse = await apiFetch('/bookings/add/', {
                method: 'POST',
                body: {
                    passenger_name: checkoutData.passenger_name,
                    bus_name: checkoutData.bus_name,
                    source: checkoutData.source,
                    destination: checkoutData.destination,
                    journey_date: checkoutData.journey_date,
                    seat_number: seat,
                    ticket_price: checkoutData.ticket_price,
                    booking_status: 'Confirmed'
                }
            });
            bookingIds.push(bookingResponse.booking_id);
        }
        
        // Create payment record linking to the primary booking ID (first seat)
        await apiFetch('/payments/add/', {
            method: 'POST',
            body: {
                booking_id: bookingIds[0],
                passenger_name: checkoutData.passenger_name,
                amount: checkoutData.total_fare,
                payment_method: selectedPaymentMethod,
                payment_status: 'Success',
                transaction_id: txnId
            }
        });
        
        // Clear checkout session
        sessionStorage.removeItem('bus_checkout_data');
        
        showToast('Booking & Payment completed successfully!');
        setTimeout(() => {
            window.location.href = 'history.html';
        }, 1200);
        
    } catch (err) {
        showToast(`Failed to complete reservation: ${err.message}`, 'error');
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

// --- BOOKING HISTORY & TICKET PDF DOWNLOAD ---
async function initHistoryPage() {
    if (!Session.checkAuth()) return;
    renderNavbar();
    
    await loadBookingHistory();
}

async function loadBookingHistory() {
    const container = document.getElementById('history-table-body');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="8" style="text-align:center"><div class="spinner"></div></td></tr>';
    
    const user = Session.getUser();
    
    try {
        // Fetch bookings for this passenger
        const bookings = await apiFetch(`/bookings/?passenger_name=${encodeURIComponent(user.full_name)}`);
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding: 2rem;">
                        <i class="far fa-folder-open" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
                        <p>No bookings found in your journey history.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort descending by booking_id
        bookings.sort((a, b) => b.booking_id - a.booking_id);
        
        // Get all payments to show payment statuses
        const payments = await apiFetch('/payments/');
        
        container.innerHTML = bookings.map(b => {
            // Match payment
            const pay = payments.find(p => p.booking_id === b.booking_id);
            const payStatus = pay ? pay.payment_status : 'Pending';
            
            let actionHtml = '';
            if (b.booking_status === 'Confirmed') {
                actionHtml = `
                    <button onclick="downloadTicketPdf(${b.booking_id})" class="btn-action">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button onclick="cancelBooking(${b.booking_id})" class="btn-action btn-action-cancel">
                        Cancel
                    </button>
                `;
            } else {
                actionHtml = `<span style="font-size:0.85rem; color:var(--text-muted)">N/A</span>`;
            }
            
            return `
                <tr>
                    <td>#${b.booking_id}</td>
                    <td><strong>${b.bus_name}</strong></td>
                    <td>${b.source} <i class="fas fa-arrow-right" style="font-size:0.75rem; margin:0 4px"></i> ${b.destination}</td>
                    <td>${b.journey_date}</td>
                    <td><span class="badge" style="background:#1e293b; border:1px solid var(--border-color)">${b.seat_number}</span></td>
                    <td>₹${b.ticket_price}</td>
                    <td><span class="badge badge-${b.booking_status.toLowerCase()}">${b.booking_status}</span></td>
                    <td><span class="badge badge-${payStatus.toLowerCase()}">${payStatus}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--accent);">Failed to load bookings: ${err.message}</td></tr>`;
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? (A full refund will be processed)')) return;
    
    try {
        // Fetch the booking details
        const booking = await apiFetch(`/bookings/`);
        const item = booking.find(b => b.booking_id === bookingId);
        if (!item) throw new Error('Booking not found');
        
        // Update booking status to Cancelled
        item.booking_status = 'Cancelled';
        await apiFetch(`/bookings/update/${bookingId}/`, {
            method: 'PUT',
            body: item
        });
        
        // Update payment status to Refunded
        const payments = await apiFetch('/payments/');
        const pay = payments.find(p => p.booking_id === bookingId);
        if (pay) {
            pay.payment_status = 'Refunded';
            await apiFetch(`/payments/update/${pay.payment_id}/`, {
                method: 'PUT',
                body: pay
            });
        }
        
        showToast('Ticket cancelled and refund processed successfully!');
        await loadBookingHistory();
    } catch (err) {
        showToast(`Cancellation failed: ${err.message}`, 'error');
    }
}

// Generate PDF Boarding Pass dynamically
async function downloadTicketPdf(bookingId) {
    try {
        const bookings = await apiFetch('/bookings/');
        const b = bookings.find(item => item.booking_id === bookingId);
        if (!b) {
            showToast('Booking record not found', 'error');
            return;
        }
        
        // Load jsPDF library dynamically if not present
        if (typeof window.jspdf === 'undefined') {
            showToast('Loading PDF engine...');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85, 200] // boarding pass dimensions
        });
        
        // Styled Boarding Pass PDF
        // Colors
        doc.setFillColor(11, 15, 25); // main header BG
        doc.rect(0, 0, 200, 20, 'F');
        
        // Header Logo Text
        doc.setTextColor(20, 184, 166); // Teal
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ANTIGRAVITY BUS BOARDING PASS', 10, 13);
        
        // Boarding Badge
        doc.setFillColor(20, 184, 166);
        doc.rect(160, 5, 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('CONFIRMED', 167, 10.5);
        
        // Ticket Main Details
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Passenger Name
        doc.text('PASSENGER NAME', 10, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(b.passenger_name.toUpperCase(), 10, 38);
        
        // Bus Operator / Details
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('BUS SERVICE', 80, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(b.bus_name.toUpperCase(), 80, 38);
        
        // Seat
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('SEAT NO.', 150, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241); // Indigo seat
        doc.text(b.seat_number, 150, 38);
        
        // Row 2: Route Source/Dest
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('ROUTE', 10, 52);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`${b.source.toUpperCase()} TO ${b.destination.toUpperCase()}`, 10, 58);
        
        // Journey Date
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('JOURNEY DATE', 80, 52);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(b.journey_date, 80, 58);
        
        // Price
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('FARE', 150, 52);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`INR ${b.ticket_price}`, 150, 58);
        
        // Barcode lines
        doc.setDrawColor(180, 180, 180);
        doc.line(10, 68, 190, 68);
        
        // Simple mock barcode
        doc.setFillColor(0, 0, 0);
        let barcodeX = 50;
        for (let i = 0; i < 30; i++) {
            const w = (i % 3 === 0) ? 1.5 : 0.6;
            doc.rect(barcodeX, 71, w, 8, 'F');
            barcodeX += w + 0.8;
        }
        
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.text(`TICKET-ID: AG-${b.booking_id}-${b.seat_number}`, 80, 82);
        
        // Download
        doc.save(`Ticket_AG_${b.booking_id}_${b.seat_number}.pdf`);
        showToast('Ticket PDF downloaded!');
        
    } catch (err) {
        showToast(`PDF generation failed: ${err.message}`, 'error');
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// --- PASSENGER DASHBOARD ---
async function initPassengerDashboard() {
    if (!Session.checkAuth()) return;
    renderNavbar();
    
    const user = Session.getUser();
    
    // Set profile info
    const nameEl = document.getElementById('dash-profile-name');
    const emailEl = document.getElementById('dash-profile-email');
    if (nameEl) nameEl.textContent = user.full_name;
    if (emailEl) emailEl.textContent = user.email;
    
    // Fill profile update inputs
    const pName = document.getElementById('prof_name');
    const pEmail = document.getElementById('prof_email');
    const pPhone = document.getElementById('prof_phone');
    const pGender = document.getElementById('prof_gender');
    const pAddress = document.getElementById('prof_address');
    const pPass = document.getElementById('prof_password');
    
    if (pName) pName.value = user.full_name;
    if (pEmail) {
        pEmail.value = user.email;
        pEmail.disabled = true; // Email unique, can't easily change
    }
    if (pPhone) pPhone.value = user.phone || '';
    if (pGender) pGender.value = user.gender || 'Male';
    if (pAddress) pAddress.value = user.address || '';
    if (pPass) pPass.value = user.password || '';
    
    // Bind profile form submit
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updated = {
                full_name: pName.value.trim(),
                email: user.email,
                phone: pPhone.value.trim(),
                gender: pGender.value,
                address: pAddress.value.trim(),
                password: pPass.value
            };
            
            try {
                await apiFetch(`/passengers/update/${user.passenger_id}/`, {
                    method: 'PUT',
                    body: updated
                });
                
                // Update local storage user state
                const newSession = { ...user, ...updated };
                Session.setUser(newSession);
                
                if (nameEl) nameEl.textContent = updated.full_name;
                showToast('Profile updated successfully!');
            } catch (err) {
                showToast(`Update failed: ${err.message}`, 'error');
            }
        });
    }
    
    await loadDashboardStatsAndRecent();
}

async function loadDashboardStatsAndRecent() {
    const user = Session.getUser();
    
    try {
        const bookings = await apiFetch(`/bookings/?passenger_name=${encodeURIComponent(user.full_name)}`);
        
        const totalBookings = bookings.length;
        let upcomingTrips = 0;
        let completedTrips = 0;
        let cancelledTickets = 0;
        
        const today = new Date().toISOString().split('T')[0];
        
        bookings.forEach(b => {
            if (b.booking_status === 'Cancelled') {
                cancelledTickets++;
            } else {
                if (b.journey_date >= today) {
                    upcomingTrips++;
                } else {
                    completedTrips++;
                }
            }
        });
        
        // Update elements
        const totalEl = document.getElementById('stat-total-bookings');
        const upcomingEl = document.getElementById('stat-upcoming');
        const completedEl = document.getElementById('stat-completed');
        const cancelledEl = document.getElementById('stat-cancelled');
        
        if (totalEl) totalEl.textContent = totalBookings;
        if (upcomingEl) upcomingEl.textContent = upcomingTrips;
        if (completedEl) completedEl.textContent = completedTrips;
        if (cancelledEl) cancelledEl.textContent = cancelledTickets;
        
        // Render recent bookings
        const recentContainer = document.getElementById('dashboard-recent-bookings');
        if (recentContainer) {
            if (bookings.length === 0) {
                recentContainer.innerHTML = '<tr><td colspan="6" style="text-align:center">No trips booked yet. Let\'s travel!</td></tr>';
                return;
            }
            
            // Limit to top 5 recent
            const recent = bookings.slice(0, 5);
            recentContainer.innerHTML = recent.map(b => `
                <tr>
                    <td>#${b.booking_id}</td>
                    <td>${b.bus_name}</td>
                    <td>${b.source} <i class="fas fa-arrow-right" style="font-size:0.75rem; margin:0 4px"></i> ${b.destination}</td>
                    <td>${b.journey_date}</td>
                    <td><span class="badge" style="background:#1e293b">${b.seat_number}</span></td>
                    <td><span class="badge badge-${b.booking_status.toLowerCase()}">${b.booking_status}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        showToast('Failed to calculate dashboard statistics', 'error');
    }
}

// --- ADMIN DASHBOARD AND CRUD PANEL ---
let activeAdminTab = 'passengers';

async function initAdminDashboard() {
    if (!Session.checkAuth(true)) return;
    renderNavbar();
    
    // Bind tab clicks
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAdminTab = tab.dataset.tab;
            
            loadAdminData();
        });
    });
    
    await loadAdminData();
}

async function loadAdminData() {
    const tableHeader = document.getElementById('admin-table-header');
    const tableBody = document.getElementById('admin-table-body');
    const addBtnText = document.getElementById('add-btn-text');
    
    if (!tableHeader || !tableBody || !addBtnText) return;
    
    tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center"><div class="spinner"></div></td></tr>';
    
    try {
        if (activeAdminTab === 'passengers') {
            addBtnText.textContent = 'Add Passenger';
            tableHeader.innerHTML = `
                <th>Passenger ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Address</th>
                <th>Actions</th>
            `;
            const data = await apiFetch('/passengers/');
            tableBody.innerHTML = data.map(p => `
                <tr>
                    <td>#${p.passenger_id}</td>
                    <td><strong>${p.full_name}</strong></td>
                    <td>${p.email}</td>
                    <td>${p.phone}</td>
                    <td>${p.gender}</td>
                    <td>${p.address}</td>
                    <td>
                        <button onclick="editPassenger(${p.passenger_id})" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="deletePassenger(${p.passenger_id})" class="btn-action btn-action-cancel"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
        } else if (activeAdminTab === 'buses') {
            addBtnText.textContent = 'Add Bus';
            tableHeader.innerHTML = `
                <th>Bus ID</th>
                <th>Bus Name</th>
                <th>Bus Number</th>
                <th>Bus Type</th>
                <th>Total Seats</th>
                <th>Operator</th>
                <th>Actions</th>
            `;
            const data = await apiFetch('/buses/');
            tableBody.innerHTML = data.map(b => `
                <tr>
                    <td>#${b.bus_id}</td>
                    <td><strong>${b.bus_name}</strong></td>
                    <td>${b.bus_number}</td>
                    <td>${b.bus_type}</td>
                    <td>${b.total_seats}</td>
                    <td>${b.operator_name}</td>
                    <td>
                        <button onclick="editBus(${b.bus_id})" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteBus(${b.bus_id})" class="btn-action btn-action-cancel"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
        } else if (activeAdminTab === 'routes') {
            addBtnText.textContent = 'Add Route';
            tableHeader.innerHTML = `
                <th>Route ID</th>
                <th>Bus Name</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Fare</th>
                <th>Actions</th>
            `;
            const data = await apiFetch('/routes/');
            tableBody.innerHTML = data.map(r => `
                <tr>
                    <td>#${r.route_id}</td>
                    <td><strong>${r.bus_name}</strong></td>
                    <td>${r.source}</td>
                    <td>${r.destination}</td>
                    <td>${r.departure_time}</td>
                    <td>${r.arrival_time}</td>
                    <td>₹${r.fare}</td>
                    <td>
                        <button onclick="editRoute(${r.route_id})" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteRoute(${r.route_id})" class="btn-action btn-action-cancel"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
        } else if (activeAdminTab === 'bookings') {
            addBtnText.textContent = 'Add Booking';
            tableHeader.innerHTML = `
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Bus</th>
                <th>Route</th>
                <th>Journey Date</th>
                <th>Seat</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
            `;
            const data = await apiFetch('/bookings/');
            tableBody.innerHTML = data.map(b => `
                <tr>
                    <td>#${b.booking_id}</td>
                    <td><strong>${b.passenger_name}</strong></td>
                    <td>${b.bus_name}</td>
                    <td>${b.source} <i class="fas fa-arrow-right" style="font-size:0.75rem"></i> ${b.destination}</td>
                    <td>${b.journey_date}</td>
                    <td><span class="badge" style="background:#1e293b">${b.seat_number}</span></td>
                    <td>₹${b.ticket_price}</td>
                    <td><span class="badge badge-${b.booking_status.toLowerCase()}">${b.booking_status}</span></td>
                    <td>
                        <button onclick="editBooking(${b.booking_id})" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteBooking(${b.booking_id})" class="btn-action btn-action-cancel"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
        } else if (activeAdminTab === 'payments') {
            addBtnText.textContent = 'Add Payment';
            tableHeader.innerHTML = `
                <th>Payment ID</th>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Actions</th>
            `;
            const data = await apiFetch('/payments/');
            tableBody.innerHTML = data.map(p => `
                <tr>
                    <td>#${p.payment_id}</td>
                    <td>#${p.booking_id}</td>
                    <td><strong>${p.passenger_name}</strong></td>
                    <td>₹${p.amount}</td>
                    <td>${p.payment_method}</td>
                    <td><span class="badge badge-${p.payment_status.toLowerCase()}">${p.payment_status}</span></td>
                    <td><code>${p.transaction_id}</code></td>
                    <td>
                        <button onclick="editPayment(${p.payment_id})" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="deletePayment(${p.payment_id})" class="btn-action btn-action-cancel"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--accent);">Failed to fetch data: ${err.message}</td></tr>`;
    }
}

// --- ADMIN FORM MODAL TRIGGERS ---
function openAdminAddModal() {
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    if (!modal || !title || !body) return;
    
    title.textContent = `Create New ${activeAdminTab.slice(0, -1).toUpperCase()}`;
    body.innerHTML = getAdminFormHtml(activeAdminTab);
    
    modal.style.display = 'flex';
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.style.display = 'none';
}

// Get HTML Template for creation/edition forms
function getAdminFormHtml(type, prefill = null) {
    if (type === 'passengers') {
        return `
            <form id="admin-crud-form">
                <input type="hidden" id="entity_id" value="${prefill ? prefill.passenger_id : ''}">
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Full Name</label>
                    <input type="text" id="val_name" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.full_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Email</label>
                    <input type="email" id="val_email" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.email : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Phone</label>
                    <input type="text" id="val_phone" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.phone : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Gender</label>
                    <select id="val_gender" class="form-input" style="padding-left:1rem">
                        <option value="Male" ${prefill && prefill.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${prefill && prefill.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${prefill && prefill.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Address</label>
                    <input type="text" id="val_address" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.address : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Password</label>
                    <input type="password" id="val_password" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.password : ''}" required>
                </div>
            </form>
        `;
    } else if (type === 'buses') {
        return `
            <form id="admin-crud-form">
                <input type="hidden" id="entity_id" value="${prefill ? prefill.bus_id : ''}">
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Bus Name</label>
                    <input type="text" id="val_bus_name" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.bus_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Bus Number</label>
                    <input type="text" id="val_bus_number" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.bus_number : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Bus Type</label>
                    <select id="val_bus_type" class="form-input" style="padding-left:1rem">
                        <option value="AC Sleeper" ${prefill && prefill.bus_type === 'AC Sleeper' ? 'selected' : ''}>AC Sleeper</option>
                        <option value="Non-AC Sleeper" ${prefill && prefill.bus_type === 'Non-AC Sleeper' ? 'selected' : ''}>Non-AC Sleeper</option>
                        <option value="AC Seater" ${prefill && prefill.bus_type === 'AC Seater' ? 'selected' : ''}>AC Seater</option>
                        <option value="Non-AC Seater" ${prefill && prefill.bus_type === 'Non-AC Seater' ? 'selected' : ''}>Non-AC Seater</option>
                        <option value="Luxury" ${prefill && prefill.bus_type === 'Luxury' ? 'selected' : ''}>Luxury</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Total Seats</label>
                    <input type="number" id="val_seats" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.total_seats : 40}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Operator Name</label>
                    <input type="text" id="val_operator" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.operator_name : ''}" required>
                </div>
            </form>
        `;
    } else if (type === 'routes') {
        return `
            <form id="admin-crud-form">
                <input type="hidden" id="entity_id" value="${prefill ? prefill.route_id : ''}">
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Bus Name</label>
                    <input type="text" id="val_route_bus" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.bus_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Source</label>
                    <input type="text" id="val_route_source" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.source : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Destination</label>
                    <input type="text" id="val_route_dest" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.destination : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Departure Time (HH:MM)</label>
                    <input type="text" id="val_route_dep" class="form-input" style="padding-left:1rem" placeholder="e.g. 21:00" value="${prefill ? prefill.departure_time : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Arrival Time (HH:MM)</label>
                    <input type="text" id="val_route_arr" class="form-input" style="padding-left:1rem" placeholder="e.g. 06:00" value="${prefill ? prefill.arrival_time : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Fare (INR)</label>
                    <input type="number" id="val_route_fare" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.fare : ''}" required>
                </div>
            </form>
        `;
    } else if (type === 'bookings') {
        return `
            <form id="admin-crud-form">
                <input type="hidden" id="entity_id" value="${prefill ? prefill.booking_id : ''}">
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Passenger Name</label>
                    <input type="text" id="val_bk_pass" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.passenger_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Bus Name</label>
                    <input type="text" id="val_bk_bus" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.bus_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Source</label>
                    <input type="text" id="val_bk_src" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.source : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Destination</label>
                    <input type="text" id="val_bk_dest" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.destination : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Journey Date (YYYY-MM-DD)</label>
                    <input type="date" id="val_bk_date" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.journey_date : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Seat Number</label>
                    <input type="text" id="val_bk_seat" class="form-input" style="padding-left:1rem" placeholder="e.g. A12" value="${prefill ? prefill.seat_number : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Ticket Price</label>
                    <input type="number" id="val_bk_price" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.ticket_price : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Booking Status</label>
                    <select id="val_bk_status" class="form-input" style="padding-left:1rem">
                        <option value="Confirmed" ${prefill && prefill.booking_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Cancelled" ${prefill && prefill.booking_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        <option value="Pending" ${prefill && prefill.booking_status === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
            </form>
        `;
    } else if (type === 'payments') {
        return `
            <form id="admin-crud-form">
                <input type="hidden" id="entity_id" value="${prefill ? prefill.payment_id : ''}">
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Booking ID</label>
                    <input type="number" id="val_pm_bkid" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.booking_id : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Passenger Name</label>
                    <input type="text" id="val_pm_pass" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.passenger_name : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Amount (INR)</label>
                    <input type="number" id="val_pm_amount" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.amount : ''}" required>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Payment Method</label>
                    <select id="val_pm_method" class="form-input" style="padding-left:1rem">
                        <option value="UPI" ${prefill && prefill.payment_method === 'UPI' ? 'selected' : ''}>UPI</option>
                        <option value="Credit Card" ${prefill && prefill.payment_method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                        <option value="Debit Card" ${prefill && prefill.payment_method === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                        <option value="Net Banking" ${prefill && prefill.payment_method === 'Net Banking' ? 'selected' : ''}>Net Banking</option>
                        <option value="Wallet" ${prefill && prefill.payment_method === 'Wallet' ? 'selected' : ''}>Wallet</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Payment Status</label>
                    <select id="val_pm_status" class="form-input" style="padding-left:1rem">
                        <option value="Success" ${prefill && prefill.payment_status === 'Success' ? 'selected' : ''}>Success</option>
                        <option value="Pending" ${prefill && prefill.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Failed" ${prefill && prefill.payment_status === 'Failed' ? 'selected' : ''}>Failed</option>
                        <option value="Refunded" ${prefill && prefill.payment_status === 'Refunded' ? 'selected' : ''}>Refunded</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:1rem">
                    <label>Transaction ID</label>
                    <input type="text" id="val_pm_txnid" class="form-input" style="padding-left:1rem" value="${prefill ? prefill.transaction_id : ''}" required>
                </div>
            </form>
        `;
    }
}

// Submit Admin modal form details (handles both insert and update)
async function submitAdminForm() {
    const form = document.getElementById('admin-crud-form');
    if (!form) return;
    
    if (!form.reportValidity()) return;
    
    const idVal = document.getElementById('entity_id').value;
    const isEdit = idVal !== '';
    
    let payload = {};
    let endpoint = '';
    
    if (activeAdminTab === 'passengers') {
        payload = {
            full_name: document.getElementById('val_name').value.trim(),
            email: document.getElementById('val_email').value.trim(),
            phone: document.getElementById('val_phone').value.trim(),
            gender: document.getElementById('val_gender').value,
            address: document.getElementById('val_address').value.trim(),
            password: document.getElementById('val_password').value
        };
        endpoint = isEdit ? `/passengers/update/${idVal}/` : '/passengers/add/';
    } else if (activeAdminTab === 'buses') {
        payload = {
            bus_name: document.getElementById('val_bus_name').value.trim(),
            bus_number: document.getElementById('val_bus_number').value.trim(),
            bus_type: document.getElementById('val_bus_type').value,
            total_seats: parseInt(document.getElementById('val_seats').value),
            operator_name: document.getElementById('val_operator').value.trim()
        };
        endpoint = isEdit ? `/buses/update/${idVal}/` : '/buses/add/';
    } else if (activeAdminTab === 'routes') {
        payload = {
            bus_name: document.getElementById('val_route_bus').value.trim(),
            source: document.getElementById('val_route_source').value.trim(),
            destination: document.getElementById('val_route_dest').value.trim(),
            departure_time: document.getElementById('val_route_dep').value.trim(),
            arrival_time: document.getElementById('val_route_arr').value.trim(),
            fare: parseFloat(document.getElementById('val_route_fare').value)
        };
        endpoint = isEdit ? `/routes/update/${idVal}/` : '/routes/add/';
    } else if (activeAdminTab === 'bookings') {
        payload = {
            passenger_name: document.getElementById('val_bk_pass').value.trim(),
            bus_name: document.getElementById('val_bk_bus').value.trim(),
            source: document.getElementById('val_bk_src').value.trim(),
            destination: document.getElementById('val_bk_dest').value.trim(),
            journey_date: document.getElementById('val_bk_date').value,
            seat_number: document.getElementById('val_bk_seat').value.trim(),
            ticket_price: parseFloat(document.getElementById('val_bk_price').value),
            booking_status: document.getElementById('val_bk_status').value
        };
        endpoint = isEdit ? `/bookings/update/${idVal}/` : '/bookings/add/';
    } else if (activeAdminTab === 'payments') {
        payload = {
            booking_id: parseInt(document.getElementById('val_pm_bkid').value),
            passenger_name: document.getElementById('val_pm_pass').value.trim(),
            amount: parseFloat(document.getElementById('val_pm_amount').value),
            payment_method: document.getElementById('val_pm_method').value,
            payment_status: document.getElementById('val_pm_status').value,
            transaction_id: document.getElementById('val_pm_txnid').value.trim()
        };
        endpoint = isEdit ? `/payments/update/${idVal}/` : '/payments/add/';
    }
    
    try {
        await apiFetch(endpoint, {
            method: isEdit ? 'PUT' : 'POST',
            body: payload
        });
        
        showToast(`${activeAdminTab.slice(0, -1)} ${isEdit ? 'updated' : 'added'} successfully!`);
        closeAdminModal();
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- ADMIN EDIT ACTIONS ---
async function editPassenger(id) {
    const list = await apiFetch('/passengers/');
    const item = list.find(p => p.passenger_id === id);
    if (!item) return;
    
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    title.textContent = 'Edit Passenger';
    body.innerHTML = getAdminFormHtml('passengers', item);
    modal.style.display = 'flex';
}

async function editBus(id) {
    const list = await apiFetch('/buses/');
    const item = list.find(b => b.bus_id === id);
    if (!item) return;
    
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    title.textContent = 'Edit Bus';
    body.innerHTML = getAdminFormHtml('buses', item);
    modal.style.display = 'flex';
}

async function editRoute(id) {
    const list = await apiFetch('/routes/');
    const item = list.find(r => r.route_id === id);
    if (!item) return;
    
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    title.textContent = 'Edit Route';
    body.innerHTML = getAdminFormHtml('routes', item);
    modal.style.display = 'flex';
}

async function editBooking(id) {
    const list = await apiFetch('/bookings/');
    const item = list.find(b => b.booking_id === id);
    if (!item) return;
    
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    title.textContent = 'Edit Booking';
    body.innerHTML = getAdminFormHtml('bookings', item);
    modal.style.display = 'flex';
}

async function editPayment(id) {
    const list = await apiFetch('/payments/');
    const item = list.find(p => p.payment_id === id);
    if (!item) return;
    
    const modal = document.getElementById('admin-modal');
    const title = document.getElementById('admin-modal-title');
    const body = document.getElementById('admin-modal-body');
    
    title.textContent = 'Edit Payment';
    body.innerHTML = getAdminFormHtml('payments', item);
    modal.style.display = 'flex';
}

// --- ADMIN DELETE ACTIONS ---
async function deletePassenger(id) {
    if (!confirm('Are you sure you want to delete this passenger?')) return;
    try {
        await apiFetch(`/passengers/delete/${id}/`, { method: 'DELETE' });
        showToast('Passenger deleted successfully');
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteBus(id) {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    try {
        await apiFetch(`/buses/delete/${id}/`, { method: 'DELETE' });
        showToast('Bus deleted successfully');
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteRoute(id) {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
        await apiFetch(`/routes/delete/${id}/`, { method: 'DELETE' });
        showToast('Route deleted successfully');
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
        await apiFetch(`/bookings/delete/${id}/`, { method: 'DELETE' });
        showToast('Booking deleted successfully');
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deletePayment(id) {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
        await apiFetch(`/payments/delete/${id}/`, { method: 'DELETE' });
        showToast('Payment deleted successfully');
        await loadAdminData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

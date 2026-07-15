const API_BASE = 'http://127.0.0.1:8000';

// --- FETCH HELPER ---
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set default headers for JSON
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error);
        throw error;
    }
}

// --- AUTH & ROLE SESSION HELPERS ---
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function getRestaurantOwner() {
    const ownerStr = localStorage.getItem('restaurantOwner');
    return ownerStr ? JSON.parse(ownerStr) : null;
}

function isAdminLoggedIn() {
    return localStorage.getItem('admin') === 'true';
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('restaurantOwner');
    localStorage.removeItem('admin');
    localStorage.removeItem('selectedRestaurant');
    showToast("Logged out successfully");
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// --- GLOBAL TOAST NOTIFICATION ---
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
        <span style="font-weight: 500;">${message}</span>
        <button style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:18px;margin-left:15px;line-height:1;" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- DYNAMIC HEADER / NAVIGATION ---
async function initHeader() {
    const headerEl = document.getElementById('main-header');
    if (!headerEl) return;
    
    const user = getCurrentUser();
    const owner = getRestaurantOwner();
    const admin = isAdminLoggedIn();
    
    let authNavHtml = '';
    
    if (user) {
        authNavHtml = `
            <button class="cart-icon-btn" onclick="window.location.href='cart.html'">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-badge" id="cart-badge" style="display:none;">0</span>
            </button>
            <div class="user-profile-nav" onclick="window.location.href='customer_dashboard.html'">
                <div class="user-avatar">${user.full_name.charAt(0)}</div>
                <span class="nav-link" style="color:white;cursor:pointer;">${user.full_name}</span>
            </div>
            <a href="#" class="nav-link" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
    } else if (owner) {
        authNavHtml = `
            <div class="user-profile-nav" onclick="window.location.href='restaurant_dashboard.html'">
                <div class="user-avatar"><i class="fas fa-utensils"></i></div>
                <span class="nav-link" style="color:white;cursor:pointer;">${owner.restaurant_name}</span>
            </div>
            <a href="#" class="nav-link" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
    } else if (admin) {
        authNavHtml = `
            <div class="user-profile-nav" onclick="window.location.href='admin_dashboard.html'">
                <div class="user-avatar"><i class="fas fa-user-shield"></i></div>
                <span class="nav-link" style="color:white;cursor:pointer;">Admin Panel</span>
            </div>
            <a href="#" class="nav-link" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
    } else {
        authNavHtml = `
            <a href="login.html" class="nav-link"><i class="fas fa-sign-in-alt"></i> Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `;
    }

    // Get current filename to highlight active tab
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);

    headerEl.innerHTML = `
        <div class="container nav-container">
            <a href="index.html" class="logo"><i class="fas fa-hamburger"></i> Food<span>Express</span></a>
            <ul class="nav-menu">
                <li><a href="index.html" class="nav-link ${page === 'index.html' || page === '' ? 'active' : ''}">Home</a></li>
                <li><a href="restaurants.html" class="nav-link ${page === 'restaurants.html' ? 'active' : ''}">Restaurants</a></li>
                ${user ? `<li><a href="orders.html" class="nav-link ${page === 'orders.html' ? 'active' : ''}">My Orders</a></li>` : ''}
                ${user ? `<li><a href="customer_dashboard.html" class="nav-link ${page === 'customer_dashboard.html' ? 'active' : ''}">Dashboard</a></li>` : ''}
                ${owner ? `<li><a href="restaurant_dashboard.html" class="nav-link ${page === 'restaurant_dashboard.html' ? 'active' : ''}">Owner Panel</a></li>` : ''}
                ${admin ? `<li><a href="admin_dashboard.html" class="nav-link ${page === 'admin_dashboard.html' ? 'active' : ''}">Admin Control</a></li>` : ''}
            </ul>
            <div class="nav-actions">
                ${authNavHtml}
            </div>
        </div>
    `;
    
    // Load FontAwesome dynamically if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(link);
    }
    
    // Initialize the cart badge count
    if (user) {
        updateCartBadge();
    }
}

async function updateCartBadge() {
    const user = getCurrentUser();
    const badge = document.getElementById('cart-badge');
    if (!user || !badge) return;
    try {
        const cartItems = await apiFetch(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
        const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    } catch (e) {
        console.error("Cart badge update error:", e);
    }
}


// ==========================================
// PAGE SPECIFIC INITIALIZERS
// ==========================================

// --- 1. HOME PAGE ---
async function initHomePage() {
    const featuredGrid = document.getElementById('featured-restaurants-grid');
    const popularGrid = document.getElementById('popular-foods-grid');
    const homeSearch = document.getElementById('home-search-input');
    
    // Category chips filter
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterFoodsByCategory(chip.dataset.category);
        });
    });

    try {
        // Fetch Featured Restaurants (displaying top 3)
        const restaurants = await apiFetch('/restaurants/');
        if (featuredGrid) {
            featuredGrid.innerHTML = '';
            if (restaurants.length === 0) {
                featuredGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No restaurants found.</div>`;
            } else {
                // Sort by rating desc
                const featured = [...restaurants].sort((a,b) => b.rating - a.rating).slice(0, 3);
                featured.forEach(rest => {
                    featuredGrid.appendChild(createRestaurantCard(rest));
                });
            }
        }

        // Fetch Popular Foods (displaying first 4 available foods)
        const foods = await apiFetch('/foods/');
        window.allFoodsList = foods; // save list globally for category filters
        if (popularGrid) {
            renderFoods(foods.slice(0, 4), popularGrid);
        }
    } catch (e) {
        showToast("Error loading home page content", "error");
    }

    if (homeSearch) {
        homeSearch.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const query = homeSearch.value.trim();
                localStorage.setItem('restaurantSearchQuery', query);
                window.location.href = 'restaurants.html';
            }
        });
    }
}

function filterFoodsByCategory(category) {
    const popularGrid = document.getElementById('popular-foods-grid');
    if (!popularGrid || !window.allFoodsList) return;
    
    let filtered = window.allFoodsList;
    if (category !== 'All') {
        filtered = window.allFoodsList.filter(f => f.category.toLowerCase().includes(category.toLowerCase()));
    }
    renderFoods(filtered.slice(0, 4), popularGrid);
}

function createRestaurantCard(rest) {
    const card = document.createElement('div');
    card.className = 'glass-card';
    
    // Choose beautiful image based on cuisine
    let imgUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'; // Default restaurant
    if (rest.cuisine.toLowerCase().includes('south indian')) imgUrl = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500';
    else if (rest.cuisine.toLowerCase().includes('american') || rest.cuisine.toLowerCase().includes('burger')) imgUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500';
    else if (rest.cuisine.toLowerCase().includes('italian') || rest.cuisine.toLowerCase().includes('pizza')) imgUrl = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500';
    else if (rest.cuisine.toLowerCase().includes('mughlai') || rest.cuisine.toLowerCase().includes('biryani')) imgUrl = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500';
    else if (rest.cuisine.toLowerCase().includes('dessert') || rest.cuisine.toLowerCase().includes('sweet')) imgUrl = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500';

    card.innerHTML = `
        <div class="card-img-wrapper">
            <img src="${imgUrl}" alt="${rest.restaurant_name}">
            <div class="card-rating-badge">
                <i class="fas fa-star"></i> ${rest.rating}
            </div>
        </div>
        <div class="card-content">
            <div class="card-tag">${rest.cuisine}</div>
            <h3 class="card-title">${rest.restaurant_name}</h3>
            <p class="card-desc"><i class="fas fa-map-marker-alt" style="color:var(--primary);margin-right:6px;"></i> ${rest.location}</p>
            <div class="card-footer">
                <span class="card-price"><span style="font-size:12px;">Contact:</span> ${rest.contact}</span>
                <button class="btn btn-primary btn-sm view-menu-btn">View Menu</button>
            </div>
        </div>
    `;
    
    card.querySelector('.view-menu-btn').addEventListener('click', () => {
        localStorage.setItem('selectedRestaurant', rest.restaurant_name);
        window.location.href = 'menu.html';
    });
    
    return card;
}

function renderFoods(foods, container) {
    container.innerHTML = '';
    if (foods.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No foods available in this category.</div>`;
        return;
    }
    foods.forEach(food => {
        const card = document.createElement('div');
        card.className = 'glass-card';
        
        const availabilityClass = food.availability === 'Available' ? 'success' : 'danger';
        const isOutOfStock = food.availability !== 'Available';
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${food.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500'}" alt="${food.food_name}">
                <div class="card-rating-badge" style="background:#09090b; color:white;">
                    ${food.category}
                </div>
            </div>
            <div class="card-content">
                <div class="card-tag" style="display:flex;justify-content:between;align-items:center;">
                    <span>${food.restaurant_name}</span>
                    <span class="status-pill ${availabilityClass}" style="font-size:9px;margin-left:auto;">${food.availability}</span>
                </div>
                <h3 class="card-title">${food.food_name}</h3>
                <p class="card-desc">Savor our premium fresh ${food.food_name} crafted with the finest ingredients.</p>
                <div class="card-footer">
                    <span class="card-price">₹${food.price}</span>
                    <button class="btn btn-primary btn-sm add-cart-btn" ${isOutOfStock ? 'disabled style="background:var(--border);cursor:not-allowed;"' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        card.querySelector('.add-cart-btn').addEventListener('click', () => handleAddToCart(food));
        container.appendChild(card);
    });
}

async function handleAddToCart(food) {
    const user = getCurrentUser();
    if (!user) {
        showToast("Please log in as a customer to add items to your cart", "warning");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    try {
        await apiFetch('/cart/add/', {
            method: 'POST',
            body: {
                customer_name: user.full_name,
                food_name: food.food_name,
                quantity: 1,
                price: food.price
            }
        });
        showToast(`${food.food_name} added to cart!`);
        updateCartBadge();
    } catch (e) {
        showToast("Could not add item to cart", "error");
    }
}


// --- 2. LOGIN PAGE ---
function initLoginPage() {
    const form = document.getElementById('login-form');
    const roleBtns = document.querySelectorAll('.role-btn');
    const customerFields = document.getElementById('customer-login-fields');
    const restaurantFields = document.getElementById('restaurant-login-fields');
    const adminFields = document.getElementById('admin-login-fields');
    
    let activeRole = 'customer';

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeRole = btn.dataset.role;
            
            // Toggle form fields visibility
            customerFields.style.display = activeRole === 'customer' ? 'block' : 'none';
            restaurantFields.style.display = activeRole === 'restaurant' ? 'block' : 'none';
            adminFields.style.display = activeRole === 'admin' ? 'block' : 'none';
        });
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (activeRole === 'customer') {
                const email = document.getElementById('cust-email').value.trim();
                const password = document.getElementById('cust-password').value.trim();
                if (!email || !password) return showToast("Fields cannot be empty", "error");
                
                try {
                    const matched = await apiFetch(`/customers/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
                    if (matched && matched.length > 0) {
                        localStorage.setItem('user', JSON.stringify(matched[0]));
                        localStorage.removeItem('restaurantOwner');
                        localStorage.removeItem('admin');
                        showToast(`Welcome back, ${matched[0].full_name}!`);
                        setTimeout(() => window.location.href = 'index.html', 1000);
                    } else {
                        showToast("Invalid credentials", "error");
                    }
                } catch (err) {
                    showToast("Login request failed", "error");
                }
            } else if (activeRole === 'restaurant') {
                const restName = document.getElementById('rest-login-name').value.trim();
                const ownerName = document.getElementById('rest-owner-name').value.trim();
                if (!restName || !ownerName) return showToast("Fields cannot be empty", "error");
                
                try {
                    const list = await apiFetch('/restaurants/');
                    const found = list.find(r => r.restaurant_name.toLowerCase() === restName.toLowerCase() && r.owner_name.toLowerCase() === ownerName.toLowerCase());
                    if (found) {
                        localStorage.setItem('restaurantOwner', JSON.stringify(found));
                        localStorage.removeItem('user');
                        localStorage.removeItem('admin');
                        showToast(`Welcome back, Owner of ${found.restaurant_name}!`);
                        setTimeout(() => window.location.href = 'restaurant_dashboard.html', 1000);
                    } else {
                        showToast("Restaurant owner credentials mismatch", "error");
                    }
                } catch (err) {
                    showToast("Restaurant owner login failed", "error");
                }
            } else if (activeRole === 'admin') {
                const user = document.getElementById('admin-username').value.trim();
                const pass = document.getElementById('admin-password').value.trim();
                
                if (user === 'admin' && pass === 'admin') {
                    localStorage.setItem('admin', 'true');
                    localStorage.removeItem('user');
                    localStorage.removeItem('restaurantOwner');
                    showToast("Admin access authorized");
                    setTimeout(() => window.location.href = 'admin_dashboard.html', 1000);
                } else {
                    showToast("Invalid Admin username/password", "error");
                }
            }
        });
    }
}


// --- 3. REGISTER PAGE ---
function initRegisterPage() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const address = document.getElementById('reg-address').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            
            if (!fullName || !email || !phone || !address || !password) {
                return showToast("All registration fields are required", "error");
            }
            
            try {
                await apiFetch('/customers/add/', {
                    method: 'POST',
                    body: { full_name: fullName, email, phone, address, password }
                });
                showToast("Registration successful! Please log in.");
                setTimeout(() => window.location.href = 'login.html', 1200);
            } catch (err) {
                showToast(err.message || "Registration failed", "error");
            }
        });
    }
}


// --- 4. RESTAURANTS PAGE ---
async function initRestaurantsPage() {
    const grid = document.getElementById('restaurants-grid');
    const searchInput = document.getElementById('restaurants-search');
    const filterCuisine = document.getElementById('filter-cuisine');
    
    let allRestaurants = [];

    // Check if query is set from home search
    const homeQuery = localStorage.getItem('restaurantSearchQuery');
    if (homeQuery) {
        searchInput.value = homeQuery;
        localStorage.removeItem('restaurantSearchQuery');
    }

    async function loadRestaurants() {
        try {
            allRestaurants = await apiFetch('/restaurants/');
            render();
        } catch (e) {
            showToast("Failed to fetch restaurants", "error");
        }
    }

    function render() {
        if (!grid) return;
        const search = searchInput.value.toLowerCase();
        const cuisine = filterCuisine.value;
        
        let filtered = allRestaurants;
        
        if (search) {
            filtered = filtered.filter(r => 
                r.restaurant_name.toLowerCase().includes(search) || 
                r.location.toLowerCase().includes(search)
            );
        }
        
        if (cuisine !== 'All') {
            filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
        }
        
        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No restaurants match your filters.</div>`;
            return;
        }
        
        filtered.forEach(rest => {
            grid.appendChild(createRestaurantCard(rest));
        });
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (filterCuisine) filterCuisine.addEventListener('change', render);

    await loadRestaurants();
}


// --- 5. FOOD MENU PAGE ---
async function initMenuPage() {
    const restaurantName = localStorage.getItem('selectedRestaurant');
    if (!restaurantName) {
        showToast("No restaurant selected", "warning");
        setTimeout(() => window.location.href = 'restaurants.html', 1000);
        return;
    }
    
    const titleEl = document.getElementById('menu-restaurant-title');
    const descEl = document.getElementById('menu-restaurant-desc');
    const menuGrid = document.getElementById('menu-foods-grid');
    
    if (titleEl) titleEl.innerText = restaurantName;

    try {
        // Fetch restaurant details to show description/cuisine
        const rests = await apiFetch('/restaurants/');
        const currentRest = rests.find(r => r.restaurant_name === restaurantName);
        if (currentRest && descEl) {
            descEl.innerHTML = `<span class="badge-cuisine">${currentRest.cuisine}</span> &bull; <i class="fas fa-star" style="color:#ffb800"></i> ${currentRest.rating} &bull; <i class="fas fa-map-marker-alt"></i> ${currentRest.location}`;
        }
        
        // Fetch menu foods
        const foods = await apiFetch(`/foods/?restaurant_name=${encodeURIComponent(restaurantName)}`);
        window.allFoodsList = foods; // save list globally for category filters
        
        // Category filtering setup
        const chips = document.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                filterMenuFoods(chip.dataset.category);
            });
        });

        if (menuGrid) {
            renderFoods(foods, menuGrid);
        }
    } catch (e) {
        showToast("Error loading food items", "error");
    }
}

function filterMenuFoods(category) {
    const menuGrid = document.getElementById('menu-foods-grid');
    if (!menuGrid || !window.allFoodsList) return;
    
    let filtered = window.allFoodsList;
    if (category !== 'All') {
        filtered = window.allFoodsList.filter(f => f.category.toLowerCase().includes(category.toLowerCase()));
    }
    renderFoods(filtered, menuGrid);
}


// --- 6. SHOPPING CART PAGE ---
async function initCartPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const cartWrapper = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const grandEl = document.getElementById('cart-grandtotal');
    
    async function loadCart() {
        try {
            const items = await apiFetch(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
            render(items);
        } catch (e) {
            showToast("Failed to fetch cart items", "error");
        }
    }
    
    function render(items) {
        if (!cartWrapper) return;
        cartWrapper.innerHTML = '';
        
        if (items.length === 0) {
            cartWrapper.innerHTML = `
                <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                    <i class="fas fa-shopping-basket" style="font-size: 50px; margin-bottom: 16px; color: var(--border);"></i>
                    <p>Your cart is empty. Let's add some delicious meals!</p>
                    <a href="restaurants.html" class="btn btn-primary" style="margin-top: 20px;">Browse Restaurants</a>
                </div>
            `;
            updateTotals(0);
            return;
        }
        
        let subtotal = 0;
        
        items.forEach(item => {
            subtotal += item.total_price;
            
            const el = document.createElement('div');
            el.className = 'cart-item-card';
            el.innerHTML = `
                <img class="cart-item-img" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500" alt="${item.food_name}">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.food_name}</h3>
                    <div class="cart-item-sub">Price: ₹${item.price}</div>
                </div>
                <div class="cart-qty-control">
                    <button class="qty-btn dec-btn">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn inc-btn">+</button>
                </div>
                <div class="cart-item-total">₹${item.total_price}</div>
                <button class="btn btn-danger btn-sm delete-btn" style="padding:10px;"><i class="fas fa-trash-alt"></i></button>
            `;
            
            // Decrement
            el.querySelector('.dec-btn').addEventListener('click', () => {
                if (item.quantity > 1) {
                    updateQty(item.cart_id, item.quantity - 1, item.price);
                } else {
                    deleteItem(item.cart_id);
                }
            });
            
            // Increment
            el.querySelector('.inc-btn').addEventListener('click', () => {
                updateQty(item.cart_id, item.quantity + 1, item.price);
            });
            
            // Delete
            el.querySelector('.delete-btn').addEventListener('click', () => {
                deleteItem(item.cart_id);
            });
            
            cartWrapper.appendChild(el);
        });
        
        updateTotals(subtotal);
    }
    
    function updateTotals(subtotal) {
        if (!totalEl) return;
        const tax = subtotal > 0 ? 30 : 0; // Flat delivery/tax charge
        const grand = subtotal + tax;
        
        totalEl.innerText = `₹${subtotal}`;
        if (taxEl) taxEl.innerText = `₹${tax}`;
        if (grandEl) grandEl.innerText = `₹${grand}`;
        
        localStorage.setItem('cartSubtotal', subtotal);
        localStorage.setItem('cartGrand', grand);
    }
    
    async function updateQty(id, newQty, price) {
        try {
            await apiFetch(`/cart/update/${id}/`, {
                method: 'PUT',
                body: {
                    quantity: newQty,
                    total_price: newQty * price
                }
            });
            loadCart();
            updateCartBadge();
        } catch (e) {
            showToast("Failed to update quantity", "error");
        }
    }
    
    async function deleteItem(id) {
        try {
            await apiFetch(`/cart/delete/${id}/`, { method: 'DELETE' });
            showToast("Item removed from cart");
            loadCart();
            updateCartBadge();
        } catch (e) {
            showToast("Failed to delete item", "error");
        }
    }
    
    await loadCart();
}


// --- 7. CHECKOUT PAGE ---
async function initCheckoutPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const summaryWrapper = document.getElementById('checkout-summary-list');
    const grandEl = document.getElementById('checkout-grand-total');
    const addressInput = document.getElementById('checkout-address');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (addressInput) addressInput.value = user.address;

    try {
        const items = await apiFetch(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
        
        if (items.length === 0) {
            showToast("Your cart is empty. Cannot checkout.", "warning");
            setTimeout(() => window.location.href = 'index.html', 1500);
            return;
        }
        
        if (summaryWrapper) {
            summaryWrapper.innerHTML = '';
            let subtotal = 0;
            items.forEach(item => {
                subtotal += item.total_price;
                const el = document.createElement('div');
                el.style.display = 'flex';
                el.style.justifyContent = 'space-between';
                el.style.marginBottom = '10px';
                el.innerHTML = `
                    <span style="color:var(--text-muted);">${item.food_name} x ${item.quantity}</span>
                    <span style="font-weight:600;color:white;">₹${item.total_price}</span>
                `;
                summaryWrapper.appendChild(el);
            });
            
            const grandTotal = subtotal + 30; // 30 is delivery charge
            if (grandEl) grandEl.innerText = `₹${grandTotal}`;
            
            // Handle Place Order
            if (checkoutForm) {
                checkoutForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const paymentMethod = document.getElementById('checkout-payment-method').value;
                    const address = addressInput.value.trim();
                    
                    if (!address) {
                        return showToast("Delivery address is required", "error");
                    }
                    
                    // Update user's address in DB if it changed
                    if (address !== user.address) {
                        try {
                            const updatedUser = await apiFetch(`/customers/update/${user.customer_id}/`, {
                                method: 'PUT',
                                body: { ...user, address }
                            });
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        } catch (err) {
                            console.error("Failed to update user address:", err);
                        }
                    }
                    
                    // We assume the restaurant is from the first cart item's food restaurant.
                    // Let's resolve the restaurant name:
                    let restaurantName = "Spicy Kitchen";
                    try {
                        const allFoods = await apiFetch('/foods/');
                        const firstCartFood = allFoods.find(f => f.food_name.toLowerCase() === items[0].food_name.toLowerCase());
                        if (firstCartFood) {
                            restaurantName = firstCartFood.restaurant_name;
                        }
                    } catch(err) {
                        console.error("Could not fetch food info for restaurant resolve", err);
                    }
                    
                    const today = new Date().toISOString().split('T')[0];
                    const orderData = {
                        customer_name: user.full_name,
                        restaurant_name: restaurantName,
                        order_date: today,
                        total_amount: grandTotal,
                        payment_method: paymentMethod,
                        payment_status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
                        order_status: 'Order Placed'
                    };
                    
                    try {
                        await apiFetch('/orders/add/', {
                            method: 'POST',
                            body: orderData
                        });
                        
                        showToast("Order placed successfully!", "success");
                        updateCartBadge();
                        setTimeout(() => window.location.href = 'orders.html', 1500);
                    } catch (err) {
                        showToast("Failed to place order", "error");
                    }
                });
            }
        }
    } catch(e) {
        showToast("Error loading checkout details", "error");
    }
}


// --- 8. ORDERS PAGE ---
async function initOrdersPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const activeSection = document.getElementById('active-orders-list');
    const pastSection = document.getElementById('past-orders-list');

    async function loadOrders() {
        try {
            const allOrders = await apiFetch(`/orders/?customer_name=${encodeURIComponent(user.full_name)}`);
            render(allOrders);
        } catch(e) {
            showToast("Failed to load orders", "error");
        }
    }

    function render(orders) {
        if (!activeSection || !pastSection) return;
        activeSection.innerHTML = '';
        pastSection.innerHTML = '';
        
        // Sort orders by ID desc
        orders.sort((a,b) => b.order_id - a.order_id);
        
        const activeOrders = orders.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled');
        const pastOrders = orders.filter(o => o.order_status === 'Delivered' || o.order_status === 'Cancelled');
        
        if (activeOrders.length === 0) {
            activeSection.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">No active orders at the moment.</div>`;
        } else {
            activeOrders.forEach(order => {
                activeSection.appendChild(createOrderCard(order, true));
            });
        }
        
        if (pastOrders.length === 0) {
            pastSection.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">No previous orders.</div>`;
        } else {
            pastOrders.forEach(order => {
                pastSection.appendChild(createOrderCard(order, false));
            });
        }
    }

    function createOrderCard(order, isActive) {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.padding = '24px';
        card.style.marginBottom = '20px';
        
        let statusClass = 'info';
        if (order.order_status === 'Delivered') statusClass = 'success';
        if (order.order_status === 'Cancelled') statusClass = 'danger';
        if (order.order_status === 'Preparing') statusClass = 'warning';
        
        const payStatusClass = order.payment_status === 'Paid' ? 'success' : (order.payment_status === 'Failed' ? 'danger' : 'warning');
        
        let timelineHtml = '';
        if (isActive) {
            const steps = ['Order Placed', 'Preparing', 'Out for Delivery', 'Delivered'];
            const currentIndex = steps.indexOf(order.order_status);
            const progressPercent = currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0;
            
            timelineHtml = `
                <div class="timeline">
                    <div class="timeline-progress" style="width: ${progressPercent}%;"></div>
                    ${steps.map((step, idx) => {
                        let stepClass = '';
                        let icon = 'fa-check';
                        if (idx < currentIndex) stepClass = 'completed';
                        else if (idx === currentIndex) {
                            stepClass = 'active';
                            if (step === 'Order Placed') icon = 'fa-receipt';
                            else if (step === 'Preparing') icon = 'fa-fire';
                            else if (step === 'Out for Delivery') icon = 'fa-shipping-fast';
                            else icon = 'fa-pizza-slice';
                        }
                        return `
                            <div class="timeline-step ${stepClass}">
                                <div class="step-icon"><i class="fas ${icon}"></i></div>
                                <span class="step-label">${step}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;margin-bottom:15px;">
                <div>
                    <h3 style="font-size:18px;">Order #${order.order_id}</h3>
                    <span style="font-size:13px;color:var(--text-muted);"><i class="fas fa-calendar-alt"></i> Date: ${order.order_date}</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <span class="status-pill status-pill-pay ${payStatusClass}">Payment: ${order.payment_status}</span>
                    <span class="status-pill ${statusClass}">${order.order_status}</span>
                </div>
            </div>
            <div style="margin: 15px 0; color:var(--text-muted); font-size:15px;">
                <p><strong>Restaurant:</strong> ${order.restaurant_name}</p>
                <p><strong>Total Bill:</strong> <span style="color:white;font-weight:700;">₹${order.total_amount}</span> via ${order.payment_method}</p>
            </div>
            ${timelineHtml}
            ${isActive && order.order_status === 'Order Placed' ? `
                <div style="text-align:right;margin-top:15px;">
                    <button class="btn btn-danger btn-sm cancel-order-btn">Cancel Order</button>
                </div>
            ` : ''}
        `;
        
        if (isActive && order.order_status === 'Order Placed') {
            card.querySelector('.cancel-order-btn').addEventListener('click', async () => {
                if (confirm("Are you sure you want to cancel this order?")) {
                    try {
                        await apiFetch(`/orders/update/${order.order_id}/`, {
                            method: 'PUT',
                            body: { ...order, order_status: 'Cancelled' }
                        });
                        showToast("Order cancelled successfully");
                        loadOrders();
                    } catch(err) {
                        showToast("Failed to cancel order", "error");
                    }
                }
            });
        }
        
        return card;
    }
    
    await loadOrders();
}


// --- 9. CUSTOMER DASHBOARD ---
async function initCustomerDashboardPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Fill Profile Forms
    const nameInput = document.getElementById('dash-name');
    const emailInput = document.getElementById('dash-email');
    const phoneInput = document.getElementById('dash-phone');
    const addressInput = document.getElementById('dash-address');
    const passwordInput = document.getElementById('dash-password');
    const form = document.getElementById('profile-form');
    
    if (nameInput) nameInput.value = user.full_name;
    if (emailInput) emailInput.value = user.email;
    if (phoneInput) phoneInput.value = user.phone;
    if (addressInput) addressInput.value = user.address;
    if (passwordInput) passwordInput.value = user.password;
    
    // Stats elements
    const totalOrdersEl = document.getElementById('stat-total-orders');
    const activeOrdersEl = document.getElementById('stat-active-orders');
    const deliveredOrdersEl = document.getElementById('stat-delivered-orders');

    async function loadStats() {
        try {
            const orders = await apiFetch(`/orders/?customer_name=${encodeURIComponent(user.full_name)}`);
            const total = orders.length;
            const active = orders.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length;
            const delivered = orders.filter(o => o.order_status === 'Delivered').length;
            
            if (totalOrdersEl) totalOrdersEl.innerText = total;
            if (activeOrdersEl) activeOrdersEl.innerText = active;
            if (deliveredOrdersEl) deliveredOrdersEl.innerText = delivered;
        } catch(e) {
            console.error("Stats fetching failed", e);
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                full_name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim(),
                password: passwordInput.value.trim()
            };
            
            try {
                const updated = await apiFetch(`/customers/update/${user.customer_id}/`, {
                    method: 'PUT',
                    body
                });
                localStorage.setItem('user', JSON.stringify(updated));
                showToast("Profile updated successfully!");
                initHeader(); // refresh name in navbar
            } catch(err) {
                showToast("Profile update failed", "error");
            }
        });
    }

    await loadStats();
}


// --- 10. RESTAURANT OWNER DASHBOARD ---
async function initRestaurantDashboardPage() {
    const owner = getRestaurantOwner();
    if (!owner) {
        window.location.href = 'login.html';
        return;
    }
    
    // Details
    const restNameEl = document.getElementById('owner-rest-name');
    const restOwnerEl = document.getElementById('owner-name');
    const restCuisineEl = document.getElementById('owner-cuisine');
    const restLocationEl = document.getElementById('owner-location');
    if (restNameEl) restNameEl.innerText = owner.restaurant_name;
    if (restOwnerEl) restOwnerEl.innerText = `Owner: ${owner.owner_name}`;
    if (restCuisineEl) restCuisineEl.innerText = `Cuisine: ${owner.cuisine}`;
    if (restLocationEl) restLocationEl.innerText = `Location: ${owner.location}`;
    
    // Stats
    const totalFoodsEl = document.getElementById('stat-rest-foods');
    const pendingOrdersEl = document.getElementById('stat-rest-pending');
    const completedOrdersEl = document.getElementById('stat-rest-completed');
    
    // Grids / Tables
    const foodsTable = document.getElementById('rest-foods-table-body');
    const ordersTable = document.getElementById('rest-orders-table-body');
    
    // Forms
    const addFoodForm = document.getElementById('owner-food-form');
    
    async function loadDashboard() {
        try {
            // Fetch food items
            const allFoods = await apiFetch(`/foods/?restaurant_name=${encodeURIComponent(owner.restaurant_name)}`);
            // Fetch orders
            const allOrders = await apiFetch(`/orders/?restaurant_name=${encodeURIComponent(owner.restaurant_name)}`);
            
            // Statistics
            if (totalFoodsEl) totalFoodsEl.innerText = allFoods.length;
            if (pendingOrdersEl) pendingOrdersEl.innerText = allOrders.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length;
            if (completedOrdersEl) completedOrdersEl.innerText = allOrders.filter(o => o.order_status === 'Delivered').length;
            
            renderFoods(allFoods);
            renderOrders(allOrders);
        } catch(e) {
            showToast("Failed to fetch dashboard data", "error");
        }
    }

    function renderFoods(foods) {
        if (!foodsTable) return;
        foodsTable.innerHTML = '';
        if (foods.length === 0) {
            foodsTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No foods added yet.</td></tr>`;
            return;
        }
        foods.forEach(food => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${food.food_id}</td>
                <td><strong>${food.food_name}</strong></td>
                <td>${food.category}</td>
                <td>₹${food.price}</td>
                <td><span class="status-pill ${food.availability === 'Available' ? 'success' : 'danger'}">${food.availability}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm edit-food-btn" style="margin-right:5px;">Edit</button>
                    <button class="btn btn-danger btn-sm delete-food-btn">Delete</button>
                </td>
            `;
            
            // Edit Food
            tr.querySelector('.edit-food-btn').addEventListener('click', () => openEditFoodModal(food));
            
            // Delete Food
            tr.querySelector('.delete-food-btn').addEventListener('click', async () => {
                if (confirm(`Delete "${food.food_name}" from menu?`)) {
                    try {
                        await apiFetch(`/foods/delete/${food.food_id}/`, { method: 'DELETE' });
                        showToast("Food item deleted successfully");
                        loadDashboard();
                    } catch(err) {
                        showToast("Deletion failed", "error");
                    }
                }
            });
            
            foodsTable.appendChild(tr);
        });
    }

    function renderOrders(orders) {
        if (!ordersTable) return;
        ordersTable.innerHTML = '';
        
        // Sort by ID desc
        orders.sort((a,b) => b.order_id - a.order_id);
        
        if (orders.length === 0) {
            ordersTable.innerHTML = `<tr><td colspan="7" style="text-align:center;">No orders placed.</td></tr>`;
            return;
        }
        
        orders.forEach(ord => {
            const tr = document.createElement('tr');
            
            let statusClass = 'info';
            if (ord.order_status === 'Delivered') statusClass = 'success';
            if (ord.order_status === 'Cancelled') statusClass = 'danger';
            if (ord.order_status === 'Preparing') statusClass = 'warning';
            
            const payStatusClass = ord.payment_status === 'Paid' ? 'success' : (ord.payment_status === 'Failed' ? 'danger' : 'warning');
            
            tr.innerHTML = `
                <td>#${ord.order_id}</td>
                <td><strong>${ord.customer_name}</strong></td>
                <td>${ord.order_date}</td>
                <td>₹${ord.total_amount}</td>
                <td>
                    <select class="order-pay-select" style="background:#18181b;color:white;border:1px solid var(--border);border-radius:6px;padding:4px;">
                        <option value="Pending" ${ord.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Paid" ${ord.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Failed" ${ord.payment_status === 'Failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </td>
                <td>
                    <select class="order-status-select" style="background:#18181b;color:white;border:1px solid var(--border);border-radius:6px;padding:4px;">
                        <option value="Order Placed" ${ord.order_status === 'Order Placed' ? 'selected' : ''}>Placed</option>
                        <option value="Preparing" ${ord.order_status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="Out for Delivery" ${ord.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="Delivered" ${ord.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${ord.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm update-order-btn">Update</button>
                </td>
            `;
            
            // Handle Update click
            tr.querySelector('.update-order-btn').addEventListener('click', async () => {
                const paySel = tr.querySelector('.order-pay-select').value;
                const statusSel = tr.querySelector('.order-status-select').value;
                
                try {
                    await apiFetch(`/orders/update/${ord.order_id}/`, {
                        method: 'PUT',
                        body: {
                            ...ord,
                            payment_status: paySel,
                            order_status: statusSel
                        }
                    });
                    showToast(`Order #${ord.order_id} updated successfully!`);
                    loadDashboard();
                } catch(e) {
                    showToast("Order status update failed", "error");
                }
            });
            
            ordersTable.appendChild(tr);
        });
    }

    // Modal Control for Foods
    const modal = document.getElementById('food-modal');
    const modalTitle = document.getElementById('modal-food-title');
    const foodIdInput = document.getElementById('food-id-input');
    const foodNameInput = document.getElementById('food-name-input');
    const foodCategoryInput = document.getElementById('food-category-input');
    const foodPriceInput = document.getElementById('food-price-input');
    const foodAvailInput = document.getElementById('food-availability-input');
    const foodImgInput = document.getElementById('food-img-input');
    const closeModalBtn = document.getElementById('close-food-modal');
    const addFoodBtn = document.getElementById('add-food-trigger-btn');
    
    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', () => {
            modalTitle.innerText = "Add Menu Food Item";
            foodIdInput.value = "";
            foodNameInput.value = "";
            foodCategoryInput.value = "Main Course";
            foodPriceInput.value = "";
            foodAvailInput.value = "Available";
            foodImgInput.value = "";
            modal.classList.add('active');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    
    function openEditFoodModal(food) {
        modalTitle.innerText = "Edit Menu Food Item";
        foodIdInput.value = food.food_id;
        foodNameInput.value = food.food_name;
        foodCategoryInput.value = food.category;
        foodPriceInput.value = food.price;
        foodAvailInput.value = food.availability;
        foodImgInput.value = food.image_url || '';
        modal.classList.add('active');
    }
    
    if (addFoodForm) {
        addFoodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = foodIdInput.value;
            const body = {
                food_name: foodNameInput.value.trim(),
                restaurant_name: owner.restaurant_name,
                category: foodCategoryInput.value,
                price: parseFloat(foodPriceInput.value),
                availability: foodAvailInput.value,
                image_url: foodImgInput.value.trim() || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500'
            };
            
            try {
                if (id) {
                    // Update
                    await apiFetch(`/foods/update/${id}/`, {
                        method: 'PUT',
                        body
                    });
                    showToast("Food item updated!");
                } else {
                    // Create
                    await apiFetch('/foods/add/', {
                        method: 'POST',
                        body
                    });
                    showToast("Food item added to menu!");
                }
                modal.classList.remove('active');
                loadDashboard();
            } catch(err) {
                showToast("Request failed", "error");
            }
        });
    }

    await loadDashboard();
}


// --- 11. ADMIN MASTER DASHBOARD ---
async function initAdminDashboardPage() {
    if (!isAdminLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Tab selectors
    const tabs = document.querySelectorAll('.admin-tab-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    let currentTab = 'customers';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');
            
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            document.getElementById(`admin-section-${currentTab}`).style.display = 'block';
            loadTable(currentTab);
        });
    });

    // Universal Modal controls
    const modal = document.getElementById('admin-modal');
    const modalTitle = document.getElementById('admin-modal-title');
    const formContainer = document.getElementById('admin-form-container');
    const closeModalBtn = document.getElementById('close-admin-modal');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    // Trigger button selectors
    const addBtns = {
        customers: document.getElementById('admin-add-customer-btn'),
        restaurants: document.getElementById('admin-add-restaurant-btn'),
        foods: document.getElementById('admin-add-food-btn'),
        cart: document.getElementById('admin-add-cart-btn'),
        orders: document.getElementById('admin-add-order-btn')
    };

    // Map each Add button to trigger modal open
    Object.keys(addBtns).forEach(key => {
        if (addBtns[key]) {
            addBtns[key].addEventListener('click', () => openAdminAddModal(key));
        }
    });

    async function loadTable(tab) {
        const bodyEl = document.getElementById(`admin-${tab}-table-body`);
        if (!bodyEl) return;
        
        bodyEl.innerHTML = `<tr><td colspan="10" style="text-align:center;">Loading...</td></tr>`;
        
        try {
            let data = [];
            if (tab === 'customers') data = await apiFetch('/customers/');
            else if (tab === 'restaurants') data = await apiFetch('/restaurants/');
            else if (tab === 'foods') data = await apiFetch('/foods/');
            else if (tab === 'cart') data = await apiFetch('/cart/');
            else if (tab === 'orders') data = await apiFetch('/orders/');
            
            // Sort keys by primary key desc for view fresh additions
            if (tab === 'customers') data.sort((a,b) => b.customer_id - a.customer_id);
            else if (tab === 'restaurants') data.sort((a,b) => b.restaurant_id - a.restaurant_id);
            else if (tab === 'foods') data.sort((a,b) => b.food_id - a.food_id);
            else if (tab === 'cart') data.sort((a,b) => b.cart_id - a.cart_id);
            else if (tab === 'orders') data.sort((a,b) => b.order_id - a.order_id);

            bodyEl.innerHTML = '';
            if (data.length === 0) {
                bodyEl.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);">No records found.</td></tr>`;
                return;
            }
            
            data.forEach(row => {
                const tr = document.createElement('tr');
                let colsHtml = '';
                let id = null;
                
                if (tab === 'customers') {
                    id = row.customer_id;
                    colsHtml = `
                        <td>${row.customer_id}</td>
                        <td><strong>${row.full_name}</strong></td>
                        <td>${row.email}</td>
                        <td>${row.phone}</td>
                        <td>${row.address}</td>
                        <td><code>${row.password}</code></td>
                    `;
                } else if (tab === 'restaurants') {
                    id = row.restaurant_id;
                    colsHtml = `
                        <td>${row.restaurant_id}</td>
                        <td><strong>${row.restaurant_name}</strong></td>
                        <td>${row.owner_name}</td>
                        <td>${row.cuisine}</td>
                        <td>${row.location}</td>
                        <td>${row.contact}</td>
                        <td><i class="fas fa-star" style="color:#ffb800"></i> ${row.rating}</td>
                    `;
                } else if (tab === 'foods') {
                    id = row.food_id;
                    colsHtml = `
                        <td>${row.food_id}</td>
                        <td><strong>${row.food_name}</strong></td>
                        <td>${row.restaurant_name}</td>
                        <td>${row.category}</td>
                        <td>₹${row.price}</td>
                        <td><span class="status-pill ${row.availability === 'Available' ? 'success' : 'danger'}">${row.availability}</span></td>
                    `;
                } else if (tab === 'cart') {
                    id = row.cart_id;
                    colsHtml = `
                        <td>${row.cart_id}</td>
                        <td>${row.customer_name}</td>
                        <td><strong>${row.food_name}</strong></td>
                        <td>${row.quantity}</td>
                        <td>₹${row.price}</td>
                        <td><strong>₹${row.total_price}</strong></td>
                    `;
                } else if (tab === 'orders') {
                    id = row.order_id;
                    const payClass = row.payment_status === 'Paid' ? 'success' : (row.payment_status === 'Failed' ? 'danger' : 'warning');
                    const ordClass = row.order_status === 'Delivered' ? 'success' : (row.order_status === 'Cancelled' ? 'danger' : 'warning');
                    colsHtml = `
                        <td>#${row.order_id}</td>
                        <td>${row.customer_name}</td>
                        <td>${row.restaurant_name}</td>
                        <td>${row.order_date}</td>
                        <td><strong>₹${row.total_amount}</strong></td>
                        <td>${row.payment_method}</td>
                        <td><span class="status-pill ${payClass}">${row.payment_status}</span></td>
                        <td><span class="status-pill ${ordClass}">${row.order_status}</span></td>
                    `;
                }
                
                tr.innerHTML = `
                    ${colsHtml}
                    <td>
                        <button class="btn btn-outline btn-sm edit-btn" style="margin-right:5px;padding:4px 8px;"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm delete-btn" style="padding:4px 8px;"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                tr.querySelector('.edit-btn').addEventListener('click', () => openAdminEditModal(tab, row));
                tr.querySelector('.delete-btn').addEventListener('click', () => deleteAdminRecord(tab, id));
                
                bodyEl.appendChild(tr);
            });
        } catch (e) {
            bodyEl.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--error);">Failed to fetch data.</td></tr>`;
        }
    }

    async function deleteAdminRecord(tab, id) {
        if (!confirm(`Are you sure you want to delete this record (${id})?`)) return;
        try {
            let endpoint = '';
            if (tab === 'customers') endpoint = `/customers/delete/${id}/`;
            else if (tab === 'restaurants') endpoint = `/restaurants/delete/${id}/`;
            else if (tab === 'foods') endpoint = `/foods/delete/${id}/`;
            else if (tab === 'cart') endpoint = `/cart/delete/${id}/`;
            else if (tab === 'orders') endpoint = `/orders/delete/${id}/`;
            
            await apiFetch(endpoint, { method: 'DELETE' });
            showToast("Record deleted successfully!");
            loadTable(tab);
        } catch (err) {
            showToast("Failed to delete record", "error");
        }
    }

    function openAdminAddModal(tab) {
        modalTitle.innerText = `Add New ${tab.substring(0, tab.length - (tab.endsWith('s') ? 1 : 0))}`;
        buildAdminForm(tab, null);
        modal.classList.add('active');
    }

    function openAdminEditModal(tab, row) {
        modalTitle.innerText = `Edit ${tab.substring(0, tab.length - (tab.endsWith('s') ? 1 : 0))}`;
        buildAdminForm(tab, row);
        modal.classList.add('active');
    }

    function buildAdminForm(tab, data) {
        formContainer.innerHTML = '';
        const form = document.createElement('form');
        
        let fieldsHtml = '';
        
        if (tab === 'customers') {
            fieldsHtml = `
                <input type="hidden" name="customer_id" value="${data ? data.customer_id : ''}">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" name="full_name" value="${data ? data.full_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${data ? data.email : ''}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" name="phone" value="${data ? data.phone : ''}" required>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" name="address" value="${data ? data.address : ''}" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="text" name="password" value="${data ? data.password : ''}" required>
                </div>
            `;
        } else if (tab === 'restaurants') {
            fieldsHtml = `
                <input type="hidden" name="restaurant_id" value="${data ? data.restaurant_id : ''}">
                <div class="form-group">
                    <label>Restaurant Name</label>
                    <input type="text" name="restaurant_name" value="${data ? data.restaurant_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Owner Name</label>
                    <input type="text" name="owner_name" value="${data ? data.owner_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Cuisine Type</label>
                    <input type="text" name="cuisine" value="${data ? data.cuisine : ''}" required>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value="${data ? data.location : ''}" required>
                </div>
                <div class="form-group">
                    <label>Contact Number</label>
                    <input type="text" name="contact" value="${data ? data.contact : ''}" required>
                </div>
                <div class="form-group">
                    <label>Rating (0.0 to 5.0)</label>
                    <input type="number" step="0.1" min="0" max="5" name="rating" value="${data ? data.rating : '4.0'}" required>
                </div>
            `;
        } else if (tab === 'foods') {
            fieldsHtml = `
                <input type="hidden" name="food_id" value="${data ? data.food_id : ''}">
                <div class="form-group">
                    <label>Food Name</label>
                    <input type="text" name="food_name" value="${data ? data.food_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Restaurant Name</label>
                    <input type="text" name="restaurant_name" value="${data ? data.restaurant_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" name="category" value="${data ? data.category : 'Main Course'}" required>
                </div>
                <div class="form-group">
                    <label>Price (₹)</label>
                    <input type="number" step="0.01" name="price" value="${data ? data.price : ''}" required>
                </div>
                <div class="form-group">
                    <label>Availability</label>
                    <select name="availability">
                        <option value="Available" ${data && data.availability === 'Available' ? 'selected' : ''}>Available</option>
                        <option value="Out of Stock" ${data && data.availability === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Food Image URL</label>
                    <input type="text" name="image_url" value="${data ? data.image_url : ''}" placeholder="Leave blank for default placeholder">
                </div>
            `;
        } else if (tab === 'cart') {
            fieldsHtml = `
                <input type="hidden" name="cart_id" value="${data ? data.cart_id : ''}">
                <div class="form-group">
                    <label>Customer Name</label>
                    <input type="text" name="customer_name" value="${data ? data.customer_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Food Name</label>
                    <input type="text" name="food_name" value="${data ? data.food_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" min="1" name="quantity" value="${data ? data.quantity : '1'}" required>
                </div>
                <div class="form-group">
                    <label>Price (₹)</label>
                    <input type="number" step="0.01" name="price" value="${data ? data.price : ''}" required>
                </div>
            `;
        } else if (tab === 'orders') {
            fieldsHtml = `
                <input type="hidden" name="order_id" value="${data ? data.order_id : ''}">
                <div class="form-group">
                    <label>Customer Name</label>
                    <input type="text" name="customer_name" value="${data ? data.customer_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Restaurant Name</label>
                    <input type="text" name="restaurant_name" value="${data ? data.restaurant_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Order Date</label>
                    <input type="date" name="order_date" value="${data ? data.order_date : new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Total Amount (₹)</label>
                    <input type="number" step="0.01" name="total_amount" value="${data ? data.total_amount : ''}" required>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="payment_method">
                        <option value="UPI" ${data && data.payment_method === 'UPI' ? 'selected' : ''}>UPI</option>
                        <option value="Credit Card" ${data && data.payment_method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                        <option value="Debit Card" ${data && data.payment_method === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                        <option value="Cash on Delivery" ${data && data.payment_method === 'Cash on Delivery' ? 'selected' : ''}>Cash on Delivery</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payment Status</label>
                    <select name="payment_status">
                        <option value="Pending" ${data && data.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Paid" ${data && data.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Failed" ${data && data.payment_status === 'Failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Order Status</label>
                    <select name="order_status">
                        <option value="Order Placed" ${data && data.order_status === 'Order Placed' ? 'selected' : ''}>Order Placed</option>
                        <option value="Preparing" ${data && data.order_status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="Out for Delivery" ${data && data.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="Delivered" ${data && data.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${data && data.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            `;
        }
        
        form.innerHTML = `
            ${fieldsHtml}
            <div style="display:flex;gap:12px;margin-top:24px;">
                <button type="button" class="btn btn-secondary" style="flex:1;" onclick="document.getElementById('admin-modal').classList.remove('active')">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex:1;">Submit</button>
            </div>
        `;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const body = {};
            formData.forEach((value, key) => {
                body[key] = value;
            });
            
            const pk = body[`${tab.substring(0, tab.length - (tab.endsWith('s') ? 1 : 0))}_id` || 'id'];
            delete body[`${tab.substring(0, tab.length - (tab.endsWith('s') ? 1 : 0))}_id` || 'id'];
            
            try {
                let endpoint = '';
                let method = 'POST';
                if (pk) {
                    // Update
                    method = 'PUT';
                    if (tab === 'customers') endpoint = `/customers/update/${pk}/`;
                    else if (tab === 'restaurants') endpoint = `/restaurants/update/${pk}/`;
                    else if (tab === 'foods') endpoint = `/foods/update/${pk}/`;
                    else if (tab === 'cart') endpoint = `/cart/update/${pk}/`;
                    else if (tab === 'orders') endpoint = `/orders/update/${pk}/`;
                } else {
                    // Create
                    if (tab === 'customers') endpoint = '/customers/add/';
                    else if (tab === 'restaurants') endpoint = '/restaurants/add/';
                    else if (tab === 'foods') endpoint = '/foods/add/';
                    else if (tab === 'cart') endpoint = '/cart/add/';
                    else if (tab === 'orders') endpoint = '/orders/add/';
                }
                
                await apiFetch(endpoint, {
                    method,
                    body
                });
                
                showToast("Data submitted successfully!");
                modal.classList.remove('active');
                loadTable(tab);
            } catch (err) {
                showToast(err.message || "Failed to submit data", "error");
            }
        });
        
        formContainer.appendChild(form);
    }

    // Default start
    loadTable(currentTab);
}

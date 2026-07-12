const API_BASE = 'http://127.0.0.1:8080';

// --- SESSION / USER MANAGEMENT ---
function getCurrentUser() {
    const userStr = localStorage.getItem('fs_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('fs_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('fs_user');
    }
}

function logout() {
    setCurrentUser(null);
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function checkLogin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

function checkAdmin() {
    const user = checkLogin();
    if (!user.is_admin) {
        showToast('Access denied: Admins only', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return null;
    }
    return user;
}

// --- NOTIFICATION HELPERS ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- FETCH CLIENT WRAPPER ---
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API Request Failure [${method} ${endpoint}]:`, error);
        showToast(error.message || 'Server connection failed', 'error');
        throw error;
    }
}

// --- DYNAMIC FASHION ILLUSTRATION SVG ---
function getProductSvg(color, category) {
    const mainColor = color || '#d4af37';
    const cat = (category || '').toLowerCase();
    
    let path = '';
    if (cat.includes('men')) {
        // T-Shirt / Shirt representation
        path = `<path d="M10 22 L20 12 L30 17 L30 30 L40 25 L45 35 L35 40 L35 85 L15 85 L15 40 L5 35 L10 25 L20 30 L20 12 Z" fill="${mainColor}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>`;
    } else if (cat.includes('women') || cat.includes('dress')) {
        // Dress representation
        path = `<path d="M20 15 C20 10 30 10 30 15 L32 30 L42 85 L8 85 L18 30 Z" fill="${mainColor}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>`;
    } else if (cat.includes('foot') || cat.includes('shoe') || cat.includes('sneaker')) {
        // Sneaker representation
        path = `<path d="M8 55 L22 40 C28 35 38 35 42 42 L42 68 C42 72 38 75 32 75 L8 75 C4 75 4 70 4 65 Z" fill="${mainColor}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="15" cy="55" r="2" fill="#fff"/>
                <circle cx="22" cy="50" r="2" fill="#fff"/>
                <circle cx="29" cy="48" r="2" fill="#fff"/>`;
    } else if (cat.includes('access') || cat.includes('watch') || cat.includes('bag')) {
        // Fashion Bag / Accessory
        path = `<rect x="12" y="30" width="26" height="40" rx="4" fill="${mainColor}" stroke="#ffffff" stroke-width="1.5"/>
                <path d="M18 30 V20 C18 15 32 15 32 20 V30" fill="none" stroke="#ffffff" stroke-width="1.8"/>
                <circle cx="25" cy="50" r="4" fill="#ffffff" opacity="0.8"/>`;
    } else {
        // Generic Product Box / Hanger
        path = `<path d="M12 25 L25 15 L38 25 L38 75 L12 75 Z" fill="${mainColor}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M25 15 V5 C25 2 20 2 20 5" fill="none" stroke="#ffffff" stroke-width="1.5"/>`;
    }
    
    return `
        <svg viewBox="0 0 50 100" class="product-image-vector" style="width: 100%; height: 100%; max-height: 180px;">
            <g transform="translate(0, 5)">
                ${path}
            </g>
        </svg>
    `;
}

// --- GLOBAL NAVBAR UPDATE ---
async function updateNavbar() {
    const user = getCurrentUser();
    const loginLink = document.getElementById('nav-login-link');
    const registerLink = document.getElementById('nav-register-link');
    const profileContainer = document.getElementById('nav-profile-container');
    const adminLink = document.getElementById('nav-admin-link');
    
    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileContainer) {
            profileContainer.style.display = 'flex';
            profileContainer.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">${user.full_name.charAt(0).toUpperCase()}</div>
                    <span>${user.full_name}</span>
                    <button onclick="logout()" class="nav-btn" title="Logout" style="margin-left:8px;"><i class="fas fa-sign-out-alt"></i></button>
                </div>
            `;
        }
        if (adminLink) {
            adminLink.style.display = user.is_admin ? 'inline-block' : 'none';
        }
        
        // Load cart items count
        try {
            const items = await apiRequest(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
            const badge = document.getElementById('nav-cart-badge');
            if (badge) {
                const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
                badge.innerText = totalQty;
                badge.style.display = totalQty > 0 ? 'flex' : 'none';
            }
        } catch (e) {
            console.error('Failed to load cart badge:', e);
        }
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (profileContainer) profileContainer.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        const badge = document.getElementById('nav-cart-badge');
        if (badge) badge.style.display = 'none';
    }
}

// --- SHOPPING CART ADD HELPER ---
async function addToCart(productName, price) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please log in to add products to your cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    try {
        await apiRequest('/cart/add/', 'POST', {
            customer_name: user.full_name,
            product_name: productName,
            quantity: 1,
            price: price
        });
        showToast(`Added ${productName} to cart`, 'success');
        updateNavbar();
    } catch (err) {
        showToast('Failed to add product to cart', 'error');
    }
}

// --- DOM READY ROUTING CONTROLLER ---
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    
    // 1. LOGIN PAGE SCRIPT
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await apiRequest('/customers/login/', 'POST', { email, password });
                setCurrentUser(response.customer);
                showToast(`Welcome back, ${response.customer.full_name}!`, 'success');
                setTimeout(() => {
                    if (response.customer.is_admin) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            } catch (err) {
                // Toast already shown by apiRequest
            }
        });
    }
    
    // 2. REGISTRATION PAGE SCRIPT
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const address = document.getElementById('reg-address').value;
            const city = document.getElementById('reg-city').value;
            const password = document.getElementById('reg-password').value;
            
            try {
                await apiRequest('/customers/add/', 'POST', {
                    full_name, email, phone, address, city, password
                });
                showToast('Registration successful! Please log in.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (err) {
                // Error shown by apiRequest
            }
        });
    }
    
    // 3. HOME PAGE (INDEX)
    const featuredProducts = document.getElementById('featured-products');
    if (featuredProducts) {
        // Initialize Banner Slider
        initHeroSlider();
        
        // Fetch and display featured products (first 4 items)
        loadFeaturedProducts();
    }
    
    // 4. PRODUCTS CATALOG PAGE
    const productsGridPage = document.getElementById('products-grid-page');
    if (productsGridPage) {
        loadCatalogPage();
    }
    
    // 5. SHOPPING CART PAGE
    const cartPageContent = document.getElementById('cart-page-content');
    if (cartPageContent) {
        loadCartPage();
    }
    
    // 6. CHECKOUT PAGE
    const checkoutPageContent = document.getElementById('checkout-page-content');
    if (checkoutPageContent) {
        loadCheckoutPage();
    }
    
    // 7. ORDERS HISTORY PAGE
    const ordersPageContent = document.getElementById('orders-page-content');
    if (ordersPageContent) {
        loadOrdersPage();
    }
    
    // 8. ADMIN DASHBOARD PAGE
    const adminDashboardPage = document.getElementById('admin-dashboard-page');
    if (adminDashboardPage) {
        loadAdminDashboard();
    }
});

// ==========================================
//   PAGE SPECIFIC CONTROLLERS IMPLEMENTATION
// ==========================================

// --- HERO SLIDER ---
function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    // Generate dots
    slides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => showSlide(idx));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.slider-dot');
    
    function showSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = index;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    // Auto Rotation
    setInterval(() => {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }, 5000);
}

// --- HOME PRODUCTS ---
async function loadFeaturedProducts() {
    const grid = document.getElementById('featured-products');
    try {
        const products = await apiRequest('/products/');
        grid.innerHTML = '';
        
        // Show up to 4 items on home page
        const itemsToShow = products.slice(0, 4);
        
        if (itemsToShow.length === 0) {
            grid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 40px; color: var(--text-muted);">No products available.</div>';
            return;
        }
        
        itemsToShow.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card glass-panel';
            card.innerHTML = `
                <div class="product-image-container">
                    <div class="product-image-gradient"></div>
                    ${getProductSvg(prod.color, prod.category)}
                    ${prod.stock <= 5 ? `<span class="product-badge">Low Stock (${prod.stock})</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-meta">
                        <span>${prod.category}</span>
                        <span>${prod.brand}</span>
                    </div>
                    <h3 class="product-title">${prod.product_name}</h3>
                    <div class="product-footer">
                        <span class="product-price">₹${prod.price.toLocaleString()}</span>
                        <button onclick="addToCart('${prod.product_name.replace(/'/g, "\\'")}', ${prod.price})" class="product-btn" title="Add to Cart">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--error);">Error loading featured products</p>';
    }
}

// --- PRODUCTS CATALOG PAGE ---
async function loadCatalogPage() {
    const grid = document.getElementById('products-grid-page');
    const categoriesFilterList = document.getElementById('categories-filter-list');
    const searchInput = document.getElementById('catalog-search-input');
    const searchBtn = document.getElementById('catalog-search-btn');
    
    let activeCategory = '';
    let searchQuery = '';
    
    // Load category list into sidebar
    try {
        const categories = await apiRequest('/categories/');
        categoriesFilterList.innerHTML = `
            <li class="filter-item active" data-cat="">
                <div class="filter-checkbox"></div>
                <span>All Categories</span>
            </li>
        `;
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'filter-item';
            li.setAttribute('data-cat', cat.category_name);
            li.innerHTML = `
                <div class="filter-checkbox"></div>
                <span>${cat.category_name}</span>
            `;
            categoriesFilterList.appendChild(li);
        });
        
        // Add events to sidebar filters
        const items = categoriesFilterList.querySelectorAll('.filter-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                activeCategory = item.getAttribute('data-cat');
                fetchAndRenderProducts();
            });
        });
    } catch (e) {
        console.error('Failed to load categories', e);
    }
    
    // Fetch and render function
    async function fetchAndRenderProducts() {
        grid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
        
        let endpoint = '/products/';
        const params = [];
        if (activeCategory) params.push(`category=${encodeURIComponent(activeCategory)}`);
        if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
        
        if (params.length > 0) {
            endpoint += `?${params.join('&')}`;
        }
        
        try {
            const products = await apiRequest(endpoint);
            grid.innerHTML = '';
            
            if (products.length === 0) {
                grid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 40px; color: var(--text-muted);">No products match your filters.</div>';
                return;
            }
            
            products.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card glass-panel';
                card.innerHTML = `
                    <div class="product-image-container">
                        <div class="product-image-gradient"></div>
                        ${getProductSvg(prod.color, prod.category)}
                        ${prod.stock === 0 ? '<span class="product-badge" style="background-color: var(--error);">Out of Stock</span>' : (prod.stock <= 5 ? `<span class="product-badge">Low Stock (${prod.stock})</span>` : '')}
                    </div>
                    <div class="product-info">
                        <div class="product-meta">
                            <span>${prod.category}</span>
                            <span>${prod.brand} (Size: ${prod.size})</span>
                        </div>
                        <h3 class="product-title">${prod.product_name}</h3>
                        <div class="product-footer">
                            <span class="product-price">₹${prod.price.toLocaleString()}</span>
                            ${prod.stock > 0 ? `
                                <button onclick="addToCart('${prod.product_name.replace(/'/g, "\\'")}', ${prod.price})" class="product-btn" title="Add to Cart">
                                    <i class="fas fa-shopping-bag"></i>
                                </button>
                            ` : `<button class="product-btn" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-ban"></i></button>`}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (e) {
            grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--error);">Failed to load products list</p>';
        }
    }
    
    // Search elements
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value;
            fetchAndRenderProducts();
        });
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value;
                fetchAndRenderProducts();
            }
        });
    }
    
    // Initial fetch
    fetchAndRenderProducts();
}

// --- SHOPPING CART PAGE ---
async function loadCartPage() {
    const user = checkLogin();
    if (!user) return;
    
    const itemsList = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    
    async function fetchCart() {
        try {
            const items = await apiRequest(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
            itemsList.innerHTML = '';
            
            if (items.length === 0) {
                itemsList.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--text-muted);">Your shopping cart is empty.</div>';
                subtotalEl.innerText = '₹0';
                totalEl.innerText = '₹0';
                if (checkoutBtn) checkoutBtn.style.display = 'none';
                return;
            }
            
            if (checkoutBtn) checkoutBtn.style.display = 'block';
            let subtotal = 0;
            
            items.forEach(item => {
                subtotal += item.total_price;
                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = `
                    <div class="cart-item-img-container">
                        ${getProductSvg(null, 'Men')} <!-- static illustration handle -->
                    </div>
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${item.product_name}</h4>
                        <div class="cart-item-details">Unit Price: ₹${item.price.toLocaleString()}</div>
                    </div>
                    <div class="cart-item-qty">
                        <div class="qty-btn dec" onclick="changeQuantity(${item.cart_id}, ${item.quantity - 1}, ${item.price})">-</div>
                        <div class="qty-val">${item.quantity}</div>
                        <div class="qty-btn inc" onclick="changeQuantity(${item.cart_id}, ${item.quantity + 1}, ${item.price})">+</div>
                    </div>
                    <div class="cart-item-price">₹${item.total_price.toLocaleString()}</div>
                    <div class="cart-item-remove" onclick="removeCartItem(${item.cart_id})" title="Remove"><i class="fas fa-trash"></i></div>
                `;
                itemsList.appendChild(row);
            });
            
            subtotalEl.innerText = `₹${subtotal.toLocaleString()}`;
            totalEl.innerText = `₹${subtotal.toLocaleString()}`;
            
            // Save subtotal for checkout page
            localStorage.setItem('fs_checkout_amount', subtotal);
        } catch (e) {
            itemsList.innerHTML = '<p class="text-center" style="color: var(--error);">Error retrieving cart items</p>';
        }
    }
    
    // Bind global helpers
    window.changeQuantity = async (cartId, newQty, price) => {
        if (newQty <= 0) {
            await removeCartItem(cartId);
            return;
        }
        try {
            await apiRequest(`/cart/update/${cartId}/`, 'PUT', { quantity: newQty, price: price });
            fetchCart();
            updateNavbar();
        } catch (e) {}
    };
    
    window.removeCartItem = async (cartId) => {
        try {
            await apiRequest(`/cart/delete/${cartId}/`, 'DELETE');
            showToast('Item removed', 'success');
            fetchCart();
            updateNavbar();
        } catch (e) {}
    };
    
    fetchCart();
}

// --- CHECKOUT PAGE ---
function loadCheckoutPage() {
    const user = checkLogin();
    if (!user) return;
    
    const checkoutAmount = localStorage.getItem('fs_checkout_amount') || 0;
    document.getElementById('checkout-subtotal').innerText = `₹${parseInt(checkoutAmount).toLocaleString()}`;
    document.getElementById('checkout-total').innerText = `₹${parseInt(checkoutAmount).toLocaleString()}`;
    
    // Pre-fill user info
    document.getElementById('check-address').value = user.address;
    document.getElementById('check-city').value = user.city;
    
    // Payment selection
    const paymentCards = document.querySelectorAll('.payment-card');
    let selectedMethod = 'UPI'; // default
    
    paymentCards.forEach(card => {
        card.addEventListener('click', () => {
            paymentCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedMethod = card.getAttribute('data-method');
        });
    });
    
    // Place order button
    const placeOrderBtn = document.getElementById('place-order-btn');
    placeOrderBtn.addEventListener('click', async () => {
        const address = document.getElementById('check-address').value;
        const city = document.getElementById('check-city').value;
        
        if (!address || !city) {
            showToast('Please fill out delivery address details', 'warning');
            return;
        }
        
        const orderDate = new Date().toISOString().split('T')[0];
        
        try {
            await apiRequest('/orders/add/', 'POST', {
                customer_name: user.full_name,
                order_date: orderDate,
                total_amount: checkoutAmount,
                payment_method: selectedMethod,
                payment_status: selectedMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
                delivery_status: 'Processing'
            });
            
            showToast('Order placed successfully!', 'success');
            localStorage.removeItem('fs_checkout_amount');
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        } catch (e) {}
    });
}

// --- ORDERS HISTORY PAGE ---
async function loadOrdersPage() {
    const user = checkLogin();
    if (!user) return;
    
    const list = document.getElementById('orders-list');
    try {
        const orders = await apiRequest(`/orders/?customer_name=${encodeURIComponent(user.full_name)}`);
        list.innerHTML = '';
        
        if (orders.length === 0) {
            list.innerHTML = '<div class="text-center glass-panel" style="padding: 48px; color: var(--text-muted);">You have not placed any orders yet.</div>';
            return;
        }
        
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card glass-panel';
            card.innerHTML = `
                <div class="order-card-header">
                    <div class="order-info-group">
                        <div class="order-info-item">
                            <div class="order-info-label">Order ID</div>
                            <div class="order-info-value">#${order.order_id}</div>
                        </div>
                        <div class="order-info-item">
                            <div class="order-info-label">Date Placed</div>
                            <div class="order-info-value">${order.order_date}</div>
                        </div>
                        <div class="order-info-item">
                            <div class="order-info-label">Payment Method</div>
                            <div class="order-info-value">${order.payment_method}</div>
                        </div>
                        <div class="order-info-item">
                            <div class="order-info-label">Total Amount</div>
                            <div class="order-info-value" style="color:var(--accent)">₹${order.total_amount.toLocaleString()}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap: 8px; align-items:center;">
                        <span class="status-badge ${order.payment_status.toLowerCase()}">${order.payment_status}</span>
                        <span class="status-badge ${order.delivery_status.toLowerCase().replace(/ /g, '-')}">${order.delivery_status}</span>
                    </div>
                </div>
                <div style="font-size:14px; color: var(--text-secondary);">
                    <i class="fas fa-shipping-fast" style="margin-right:8px; color: var(--accent);"></i>
                    Your shipment is currently in <strong>${order.delivery_status}</strong> status.
                </div>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        list.innerHTML = '<p class="text-center" style="color:var(--error);">Failed to load order history</p>';
    }
}

// ==========================================
//       ADMIN DASHBOARD MANAGEMENT
// ==========================================
async function loadAdminDashboard() {
    const user = checkAdmin();
    if (!user) return;
    
    const menuItems = document.querySelectorAll('.dashboard-menu-item');
    const contentTitle = document.getElementById('dashboard-section-title');
    const addBtnContainer = document.getElementById('dashboard-add-btn-container');
    const tableHeaderRow = document.getElementById('table-header-row');
    const tableBody = document.getElementById('table-body');
    
    // Keep track of active section
    let activeSection = 'products'; // default
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeSection = item.getAttribute('data-section');
            renderDashboardSection();
        });
    });
    
    // Reusable Modal Actions
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    
    function openModal(title, contentHtml) {
        modalTitle.innerText = title;
        modalBody.innerHTML = contentHtml;
        modalBackdrop.classList.add('active');
    }
    
    function closeModal() {
        modalBackdrop.classList.remove('active');
    }
    
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });
    
    // Core Render Router
    async function renderDashboardSection() {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center"><i class="fas fa-spinner fa-spin fa-lg"></i> Loading data...</td></tr>';
        
        if (activeSection === 'products') {
            contentTitle.innerText = 'Product Inventory';
            addBtnContainer.innerHTML = '<button class="btn-primary" id="btn-add-product"><i class="fas fa-plus"></i> Add Product</button>';
            
            tableHeaderRow.innerHTML = `
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
            `;
            
            document.getElementById('btn-add-product').addEventListener('click', () => triggerProductModal());
            
            try {
                const products = await apiRequest('/products/');
                tableBody.innerHTML = '';
                
                if (products.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:var(--text-muted)">No products found.</td></tr>';
                    return;
                }
                
                products.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${p.product_id}</td>
                        <td style="font-weight:600;">${p.product_name}</td>
                        <td>${p.category}</td>
                        <td>${p.brand}</td>
                        <td>${p.size}</td>
                        <td class="accent-text">₹${p.price.toLocaleString()}</td>
                        <td>${p.stock}</td>
                        <td>
                            <div class="action-btns">
                                <span class="action-btn" onclick="triggerProductModal(${p.product_id})" title="Edit"><i class="fas fa-edit"></i></span>
                                <span class="action-btn delete" onclick="deleteProductItem(${p.product_id})" title="Delete"><i class="fas fa-trash-alt"></i></span>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } catch (e) {}
            
        } else if (activeSection === 'categories') {
            contentTitle.innerText = 'Product Categories';
            addBtnContainer.innerHTML = '<button class="btn-primary" id="btn-add-category"><i class="fas fa-plus"></i> Add Category</button>';
            
            tableHeaderRow.innerHTML = `
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Actions</th>
            `;
            
            document.getElementById('btn-add-category').addEventListener('click', () => triggerCategoryModal());
            
            try {
                const categories = await apiRequest('/categories/');
                tableBody.innerHTML = '';
                
                if (categories.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--text-muted)">No categories found.</td></tr>';
                    return;
                }
                
                categories.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${c.category_id}</td>
                        <td style="font-weight:600;">${c.category_name}</td>
                        <td>${c.description}</td>
                        <td>
                            <div class="action-btns">
                                <span class="action-btn" onclick="triggerCategoryModal(${c.category_id})" title="Edit"><i class="fas fa-edit"></i></span>
                                <span class="action-btn delete" onclick="deleteCategoryItem(${c.category_id})" title="Delete"><i class="fas fa-trash-alt"></i></span>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } catch (e) {}
            
        } else if (activeSection === 'customers') {
            contentTitle.innerText = 'Customer Accounts';
            addBtnContainer.innerHTML = '<button class="btn-primary" id="btn-add-customer"><i class="fas fa-plus"></i> Add Customer</button>';
            
            tableHeaderRow.innerHTML = `
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>City</th>
                <th>Actions</th>
            `;
            
            document.getElementById('btn-add-customer').addEventListener('click', () => triggerCustomerModal());
            
            try {
                const customers = await apiRequest('/customers/');
                tableBody.innerHTML = '';
                
                if (customers.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:var(--text-muted)">No customers found.</td></tr>';
                    return;
                }
                
                customers.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${c.customer_id}</td>
                        <td style="font-weight:600;">${c.full_name}</td>
                        <td>${c.email}</td>
                        <td>${c.phone}</td>
                        <td>${c.address}</td>
                        <td>${c.city}</td>
                        <td>
                            <div class="action-btns">
                                <span class="action-btn" onclick="triggerCustomerModal(${c.customer_id})" title="Edit"><i class="fas fa-edit"></i></span>
                                <span class="action-btn delete" onclick="deleteCustomerItem(${c.customer_id})" title="Delete"><i class="fas fa-trash-alt"></i></span>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } catch (e) {}
            
        } else if (activeSection === 'orders') {
            contentTitle.innerText = 'Customer Orders';
            addBtnContainer.innerHTML = ''; // Orders are placed by clients, admin only updates status.
            
            tableHeaderRow.innerHTML = `
                <th>ID</th>
                <th>Customer Name</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Delivery Status</th>
                <th>Actions</th>
            `;
            
            try {
                const orders = await apiRequest('/orders/');
                tableBody.innerHTML = '';
                
                if (orders.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:var(--text-muted)">No orders placed yet.</td></tr>';
                    return;
                }
                
                orders.forEach(o => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${o.order_id}</td>
                        <td style="font-weight:600;">${o.customer_name}</td>
                        <td>${o.order_date}</td>
                        <td class="accent-text">₹${o.total_amount.toLocaleString()}</td>
                        <td>${o.payment_method}</td>
                        <td>
                            <select class="form-input" style="padding:6px; font-size:12px; width:110px;" onchange="updateOrderStatus(${o.order_id}, 'payment_status', this.value)">
                                <option value="Pending" ${o.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Paid" ${o.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Failed" ${o.payment_status === 'Failed' ? 'selected' : ''}>Failed</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-input" style="padding:6px; font-size:12px; width:140px;" onchange="updateOrderStatus(${o.order_id}, 'delivery_status', this.value)">
                                <option value="Processing" ${o.delivery_status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${o.delivery_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Out for Delivery" ${o.delivery_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                <option value="Delivered" ${o.delivery_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${o.delivery_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>
                            <div class="action-btns">
                                <span class="action-btn delete" onclick="deleteOrderItem(${o.order_id})" title="Delete"><i class="fas fa-trash-alt"></i></span>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            } catch (e) {}
        }
    }
    
    // --- DIALOG MODALS HANDLERS ---
    
    // 1. PRODUCT MODAL
    window.triggerProductModal = async (productId = null) => {
        let title = 'Add New Product';
        let prod = { product_name: '', category: '', brand: '', size: 'M', color: '', price: '', stock: '', image_url: 'product.jpg' };
        
        if (productId) {
            title = 'Edit Product Details';
            try {
                const allProds = await apiRequest('/products/');
                prod = allProds.find(p => p.product_id === productId);
            } catch (e) {
                return;
            }
        }
        
        let categoriesOptions = '';
        try {
            const categories = await apiRequest('/categories/');
            categories.forEach(cat => {
                categoriesOptions += `<option value="${cat.category_name}" ${prod.category === cat.category_name ? 'selected' : ''}>${cat.category_name}</option>`;
            });
        } catch (e) {}
        
        const formHtml = `
            <form id="modal-product-form">
                <div class="form-group">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-input" id="m-prod-name" value="${prod.product_name}" required>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-input" id="m-prod-cat" required>
                            <option value="">Select Category</option>
                            ${categoriesOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Brand</label>
                        <input type="text" class="form-input" id="m-prod-brand" value="${prod.brand}" required>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Size</label>
                        <select class="form-input" id="m-prod-size" required>
                            <option value="S" ${prod.size === 'S' ? 'selected' : ''}>S</option>
                            <option value="M" ${prod.size === 'M' ? 'selected' : ''}>M</option>
                            <option value="L" ${prod.size === 'L' ? 'selected' : ''}>L</option>
                            <option value="XL" ${prod.size === 'XL' ? 'selected' : ''}>XL</option>
                            <option value="One Size" ${prod.size === 'One Size' ? 'selected' : ''}>One Size</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color (Hex/Text)</label>
                        <input type="text" class="form-input" id="m-prod-color" placeholder="e.g. #0000ff or Blue" value="${prod.color}" required>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Price (INR)</label>
                        <input type="number" class="form-input" id="m-prod-price" value="${prod.price}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stock Quantity</label>
                        <input type="number" class="form-input" id="m-prod-stock" value="${prod.stock}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Image URL / Filename</label>
                    <input type="text" class="form-input" id="m-prod-img" value="${prod.image_url}" required>
                </div>
                <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">Save Product</button>
            </form>
        `;
        
        openModal(title, formHtml);
        
        document.getElementById('modal-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                product_name: document.getElementById('m-prod-name').value,
                category: document.getElementById('m-prod-cat').value,
                brand: document.getElementById('m-prod-brand').value,
                size: document.getElementById('m-prod-size').value,
                color: document.getElementById('m-prod-color').value,
                price: parseFloat(document.getElementById('m-prod-price').value),
                stock: parseInt(document.getElementById('m-prod-stock').value),
                image_url: document.getElementById('m-prod-img').value
            };
            
            try {
                if (productId) {
                    await apiRequest(`/products/update/${productId}/`, 'PUT', body);
                    showToast('Product updated successfully', 'success');
                } else {
                    await apiRequest('/products/add/', 'POST', body);
                    showToast('Product added successfully', 'success');
                }
                closeModal();
                renderDashboardSection();
            } catch (err) {}
        });
    };
    
    window.deleteProductItem = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await apiRequest(`/products/delete/${id}/`, 'DELETE');
            showToast('Product deleted', 'success');
            renderDashboardSection();
        } catch (e) {}
    };
    
    // 2. CATEGORY MODAL
    window.triggerCategoryModal = async (categoryId = null) => {
        let title = 'Add New Category';
        let cat = { category_name: '', description: '' };
        
        if (categoryId) {
            title = 'Edit Category Details';
            try {
                const allCats = await apiRequest('/categories/');
                cat = allCats.find(c => c.category_id === categoryId);
            } catch (e) {
                return;
            }
        }
        
        const formHtml = `
            <form id="modal-category-form">
                <div class="form-group">
                    <label class="form-label">Category Name</label>
                    <input type="text" class="form-input" id="m-cat-name" value="${cat.category_name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input" id="m-cat-desc" style="height:100px; resize:none;" required>${cat.description}</textarea>
                </div>
                <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">Save Category</button>
            </form>
        `;
        
        openModal(title, formHtml);
        
        document.getElementById('modal-category-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                category_name: document.getElementById('m-cat-name').value,
                description: document.getElementById('m-cat-desc').value
            };
            
            try {
                if (categoryId) {
                    await apiRequest(`/categories/update/${categoryId}/`, 'PUT', body);
                    showToast('Category updated successfully', 'success');
                } else {
                    await apiRequest('/categories/add/', 'POST', body);
                    showToast('Category added successfully', 'success');
                }
                closeModal();
                renderDashboardSection();
            } catch (err) {}
        });
    };
    
    window.deleteCategoryItem = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await apiRequest(`/categories/delete/${id}/`, 'DELETE');
            showToast('Category deleted', 'success');
            renderDashboardSection();
        } catch (e) {}
    };
    
    // 3. CUSTOMER MODAL
    window.triggerCustomerModal = async (customerId = null) => {
        let title = 'Add New Customer';
        let cust = { full_name: '', email: '', phone: '', address: '', city: '' };
        
        if (customerId) {
            title = 'Edit Customer Profile';
            try {
                const allCusts = await apiRequest('/customers/');
                cust = allCusts.find(c => c.customer_id === customerId);
            } catch (e) {
                return;
            }
        }
        
        const formHtml = `
            <form id="modal-customer-form">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="m-cust-name" value="${cust.full_name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-input" id="m-cust-email" value="${cust.email}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="text" class="form-input" id="m-cust-phone" value="${cust.phone}" required>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-input" id="m-cust-addr" value="${cust.address}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" class="form-input" id="m-cust-city" value="${cust.city}" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">Save Customer</button>
            </form>
        `;
        
        openModal(title, formHtml);
        
        document.getElementById('modal-customer-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                full_name: document.getElementById('m-cust-name').value,
                email: document.getElementById('m-cust-email').value,
                phone: document.getElementById('m-cust-phone').value,
                address: document.getElementById('m-cust-addr').value,
                city: document.getElementById('m-cust-city').value
            };
            
            try {
                if (customerId) {
                    await apiRequest(`/customers/update/${customerId}/`, 'PUT', body);
                    showToast('Customer profile updated', 'success');
                } else {
                    body.password = 'password123'; // Default for admin additions
                    await apiRequest('/customers/add/', 'POST', body);
                    showToast('Customer created successfully', 'success');
                }
                closeModal();
                renderDashboardSection();
            } catch (err) {}
        });
    };
    
    window.deleteCustomerItem = async (id) => {
        if (!confirm('Are you sure you want to delete this customer account?')) return;
        try {
            await apiRequest(`/customers/delete/${id}/`, 'DELETE');
            showToast('Customer account removed', 'success');
            renderDashboardSection();
        } catch (e) {}
    };
    
    // 4. ORDER MANAGEMENT HELPERS
    window.updateOrderStatus = async (orderId, field, value) => {
        try {
            // Get current order data first
            const allOrders = await apiRequest('/orders/');
            const order = allOrders.find(o => o.order_id === orderId);
            
            if (!order) return;
            
            // Update selected field
            order[field] = value;
            
            await apiRequest(`/orders/update/${orderId}/`, 'PUT', order);
            showToast('Order status updated successfully', 'success');
            renderDashboardSection();
        } catch (e) {}
    };
    
    window.deleteOrderItem = async (id) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            await apiRequest(`/orders/delete/${id}/`, 'DELETE');
            showToast('Order deleted', 'success');
            renderDashboardSection();
        } catch (e) {}
    };
    
    // Load initial section
    renderDashboardSection();
}

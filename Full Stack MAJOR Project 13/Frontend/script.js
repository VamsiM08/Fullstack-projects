const API_URL = 'http://localhost:8000';

// --- Toast Helper ---
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
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:transparent;border:none;color:inherit;cursor:pointer;margin-left:1rem;" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// --- Fetch API Wrapper ---
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errText = `API error: ${response.status}`;
            try {
                const errData = await response.json();
                errText = errData.error || JSON.stringify(errData) || errText;
            } catch (e) {}
            throw new Error(errText);
        }
        return await response.json();
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// --- Authentication & User state ---
function getCurrentUser() {
    const userStr = localStorage.getItem('ecommerce_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('ecommerce_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('ecommerce_user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function isAdmin() {
    const user = getCurrentUser();
    return user && (user.email === 'admin@ecommerce.com' || user.email === 'admin' || user.full_name === 'Administrator');
}

// --- Navbar Sync ---
async function syncNavbar() {
    const user = getCurrentUser();
    const navRight = document.getElementById('nav-right');
    const navLinks = document.getElementById('nav-links');
    
    if (!navRight) return;
    
    // Default links
    let linksHtml = `
        <li><a href="index.html" id="link-home">Home</a></li>
        <li><a href="products.html" id="link-products">Products</a></li>
    `;
    
    if (user) {
        linksHtml += `
            <li><a href="orders.html" id="link-orders">My Orders</a></li>
            <li><a href="dashboard.html" id="link-dashboard">Dashboard</a></li>
        `;
        
        navLinks.innerHTML = linksHtml;
        
        // Fetch cart badge count
        let cartCount = 0;
        try {
            const cartItems = await apiCall(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
            cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        } catch (e) {}
        
        navRight.innerHTML = `
            <a href="cart.html" class="cart-icon-wrapper">
                🛒
                <span id="cart-badge">${cartCount}</span>
            </a>
            <div class="user-tag" onclick="window.location.href='dashboard.html'">
                👤 <span>${user.full_name}</span>
            </div>
            <button class="logout-btn" onclick="logout()">Logout</button>
        `;
    } else {
        linksHtml += `
            <li><a href="login.html" id="link-login">Login</a></li>
            <li><a href="register.html" id="link-register">Register</a></li>
        `;
        navLinks.innerHTML = linksHtml;
        navRight.innerHTML = `
            <a href="login.html" class="cta-btn" style="padding: 0.5rem 1.5rem; font-size:0.9rem;">Sign In</a>
        `;
    }
    
    // Highlight active link
    const page = window.location.pathname.split("/").pop();
    const linkId = page ? `link-${page.replace('.html', '')}` : 'link-home';
    const activeLink = document.getElementById(linkId);
    if (activeLink) activeLink.classList.add('active');
}

// --- Cart Actions ---
async function addToCart(productName, price) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    try {
        const cartItems = await apiCall(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
        const existing = cartItems.find(item => item.product_name === productName);
        
        if (existing) {
            // Update quantity
            const newQty = existing.quantity + 1;
            await apiCall(`/cart/update/${existing.cart_id}/`, 'PUT', {
                quantity: newQty,
                total_price: newQty * price
            });
            showToast(`Updated quantity of ${productName} in cart`, 'success');
        } else {
            // Add new cart item
            await apiCall('/cart/add/', 'POST', {
                customer_name: user.full_name,
                product_name: productName,
                quantity: 1,
                price: price,
                total_price: price
            });
            showToast(`Added ${productName} to cart`, 'success');
        }
        syncNavbar();
    } catch (e) {
        console.error(e);
    }
}

// --- Wishlist Management (Bonus) ---
function getWishlist() {
    const user = getCurrentUser();
    if (!user) return [];
    const list = localStorage.getItem(`wishlist_${user.email}`);
    return list ? JSON.parse(list) : [];
}

function toggleWishlist(productId, productName) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to manage wishlist', 'warning');
        return false;
    }
    
    let wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === productId);
    let added = false;
    
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast(`Removed ${productName} from Wishlist`, 'info');
    } else {
        wishlist.push({ id: productId, name: productName });
        showToast(`Added ${productName} to Wishlist`, 'success');
        added = true;
    }
    
    localStorage.setItem(`wishlist_${user.email}`, JSON.stringify(wishlist));
    return added;
}

// --- Product Reviews Helper ---
function getProductReviews(productId) {
    const key = `reviews_${productId}`;
    const reviews = localStorage.getItem(key);
    return reviews ? JSON.parse(reviews) : [
        { reviewer: 'Neha R.', rating: 5, comment: 'Amazing product! Value for money.' },
        { reviewer: 'Amit S.', rating: 4, comment: 'Great quality, but shipping took 3 days.' }
    ];
}

function addProductReview(productId, review) {
    const key = `reviews_${productId}`;
    const reviews = getProductReviews(productId);
    reviews.unshift(review);
    localStorage.setItem(key, JSON.stringify(reviews));
    showToast('Review submitted successfully!', 'success');
}

// --- Load Home Page Data ---
async function loadHomePage() {
    try {
        const categories = await apiCall('/categories/');
        const products = await apiCall('/products/');
        
        // Render categories
        const catGrid = document.getElementById('categories-grid');
        if (catGrid) {
            catGrid.innerHTML = '';
            categories.forEach(cat => {
                const card = document.createElement('div');
                card.className = 'category-card';
                card.onclick = () => { window.location.href = `products.html?category=${encodeURIComponent(cat.category_name)}`; };
                card.innerHTML = `
                    <h3>${cat.category_name}</h3>
                    <p>${cat.description}</p>
                `;
                catGrid.appendChild(card);
            });
        }
        
        // Render top 3 featured products
        const prodGrid = document.getElementById('featured-products-grid');
        if (prodGrid) {
            prodGrid.innerHTML = '';
            products.slice(0, 3).forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                const wishlist = getWishlist();
                const isStarred = wishlist.some(item => item.id === prod.product_id);
                
                card.innerHTML = `
                    <div class="product-image-container">
                        <img src="${prod.image_url}" alt="${prod.product_name}">
                        <span class="product-badge">${prod.category}</span>
                        <button class="wishlist-btn ${isStarred ? 'active' : ''}" onclick="event.stopPropagation(); handleWishlistToggle(this, ${prod.product_id}, '${prod.product_name}')">♥</button>
                    </div>
                    <div class="product-details">
                        <span class="product-category">${prod.brand}</span>
                        <h3 class="product-title">${prod.product_name}</h3>
                        <p class="product-brand" style="margin-bottom:0.5rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${prod.description}</p>
                        <div class="product-price-row">
                            <span class="product-price">₹${prod.price.toLocaleString()}</span>
                            <button class="add-to-cart-btn" onclick="addToCart('${prod.product_name}', ${prod.price})">Add to Cart</button>
                        </div>
                    </div>
                `;
                card.onclick = () => showProductDetailsModal(prod);
                prodGrid.appendChild(card);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

// --- Load Products Page Data ---
async function loadProductsPage() {
    const params = new URLSearchParams(window.location.search);
    const catFilter = params.get('category');
    
    try {
        const categories = await apiCall('/categories/');
        const select = document.getElementById('filter-category');
        
        // Populate category dropdown
        if (select) {
            select.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.category_name;
                opt.textContent = cat.category_name;
                if (catFilter && catFilter.toLowerCase() === cat.category_name.toLowerCase()) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        }
        
        // Initial Fetch
        await fetchAndRenderProducts();
        
        // Set up filters listeners
        if (select) select.addEventListener('change', fetchAndRenderProducts);
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.addEventListener('input', debounce(fetchAndRenderProducts, 300));
        
        const priceSelect = document.getElementById('filter-price');
        if (priceSelect) priceSelect.addEventListener('change', fetchAndRenderProducts);
        
    } catch (e) {
        console.error(e);
    }
}

async function fetchAndRenderProducts() {
    const searchInput = document.getElementById('search-input');
    const searchVal = searchInput ? searchInput.value : '';
    
    const catSelect = document.getElementById('filter-category');
    const catVal = catSelect ? catSelect.value : '';
    
    const priceSelect = document.getElementById('filter-price');
    const priceVal = priceSelect ? priceSelect.value : '';
    
    let query = `?search=${encodeURIComponent(searchVal)}`;
    if (catVal) query += `&category=${encodeURIComponent(catVal)}`;
    
    if (priceVal) {
        const [min, max] = priceVal.split('-');
        if (min) query += `&min_price=${min}`;
        if (max) query += `&max_price=${max}`;
    }
    
    try {
        const products = await apiCall(`/products/${query}`);
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: var(--text-muted);">No products found matching your criteria.</div>';
            return;
        }
        
        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            const wishlist = getWishlist();
            const isStarred = wishlist.some(item => item.id === prod.product_id);
            
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${prod.image_url}" alt="${prod.product_name}">
                    <span class="product-badge">${prod.category}</span>
                    <button class="wishlist-btn ${isStarred ? 'active' : ''}" onclick="event.stopPropagation(); handleWishlistToggle(this, ${prod.product_id}, '${prod.product_name}')">♥</button>
                </div>
                <div class="product-details">
                    <span class="product-category">${prod.brand}</span>
                    <h3 class="product-title">${prod.product_name}</h3>
                    <p class="product-brand" style="margin-bottom:0.5rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${prod.description}</p>
                    <div class="product-price-row">
                        <span class="product-price">₹${prod.price.toLocaleString()}</span>
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${prod.product_name}', ${prod.price})">Add to Cart</button>
                    </div>
                </div>
            `;
            card.onclick = () => showProductDetailsModal(prod);
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

function handleWishlistToggle(btn, id, name) {
    const added = toggleWishlist(id, name);
    if (added) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// --- Product Details Modal & Review (Bonus) ---
function showProductDetailsModal(prod) {
    let overlay = document.getElementById('details-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'details-modal';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    
    const reviews = getProductReviews(prod.product_id);
    let reviewsHtml = '';
    reviews.forEach(r => {
        let stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        reviewsHtml += `
            <div class="review-item">
                <div class="review-header">
                    <strong>${r.reviewer}</strong>
                    <span class="stars">${stars}</span>
                </div>
                <p style="font-size:0.9rem; color:var(--text-muted);">${r.comment}</p>
            </div>
        `;
    });
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <button class="modal-close-btn" onclick="closeDetailsModal()">×</button>
            <div class="product-detail-modal-layout">
                <div>
                    <img src="${prod.image_url}" style="width:100%; border-radius:12px; object-fit:cover; max-height: 250px;">
                    <h2 style="margin-top:1rem;">${prod.product_name}</h2>
                    <p style="color:var(--secondary); text-transform:uppercase; font-size:0.8rem; font-weight:700; margin-top:0.3rem;">${prod.brand} • ${prod.category}</p>
                    <p style="margin: 1rem 0; color:var(--text-muted); font-size:0.95rem;">${prod.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--glass-border);">
                        <span style="font-size:1.8rem; font-weight:800;">₹${prod.price.toLocaleString()}</span>
                        <button class="cta-btn" onclick="addToCart('${prod.product_name}', ${prod.price}); closeDetailsModal();">Add to Cart</button>
                    </div>
                </div>
                <div>
                    <h3>Reviews & Ratings</h3>
                    <div class="modal-reviews-section" style="max-height:220px; overflow-y:auto; margin-bottom:1rem;">
                        ${reviewsHtml || '<p style="color:var(--text-muted); font-size:0.9rem;">No reviews yet. Be the first!</p>'}
                    </div>
                    <form id="add-review-form" onsubmit="event.preventDefault(); submitReview(${prod.product_id})">
                        <h4 style="margin-bottom:0.5rem;">Add a Review</h4>
                        <div class="form-group" style="margin-bottom:0.8rem;">
                            <select id="review-rating" required style="padding:0.5rem;">
                                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                <option value="3">⭐⭐⭐ (3/5)</option>
                                <option value="2">⭐⭐ (2/5)</option>
                                <option value="1">⭐ (1/5)</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0.8rem;">
                            <textarea id="review-comment" placeholder="Write your feedback..." required style="height:60px; padding:0.5rem;"></textarea>
                        </div>
                        <button type="submit" class="add-record-btn" style="width:100%; padding:0.5rem;">Submit Review</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    overlay.classList.add('open');
}

function closeDetailsModal() {
    const modal = document.getElementById('details-modal');
    if (modal) modal.classList.remove('open');
}

function submitReview(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to post a review', 'warning');
        return;
    }
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value;
    
    addProductReview(productId, {
        reviewer: user.full_name,
        rating,
        comment
    });
    
    // Refresh modal
    closeDetailsModal();
}

// --- Load Cart Page Data ---
async function loadCartPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const cartItems = await apiCall(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
        const cartContainer = document.getElementById('cart-items-list');
        const summaryContainer = document.getElementById('cart-summary-box');
        
        if (!cartContainer) return;
        
        cartContainer.innerHTML = '';
        if (cartItems.length === 0) {
            cartContainer.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);">Your shopping cart is empty!</div>';
            if (summaryContainer) summaryContainer.style.display = 'none';
            return;
        }
        
        if (summaryContainer) summaryContainer.style.display = 'block';
        
        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.total_price;
            
            // Look up mock image for the items
            let mockImg = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300";
            if (item.product_name.includes("Samsung")) mockImg = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300";
            else if (item.product_name.includes("iPhone")) mockImg = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300";
            else if (item.product_name.includes("Sony")) mockImg = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300";
            else if (item.product_name.includes("Jacket")) mockImg = "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300";
            else if (item.product_name.includes("Vase")) mockImg = "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=300";

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <img src="${mockImg}" class="cart-item-img">
                <div class="cart-item-info">
                    <h3>${item.product_name}</h3>
                    <p>Price: ₹${item.price.toLocaleString()}</p>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateCartQty(${item.cart_id}, ${item.quantity - 1}, ${item.price})">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.cart_id}, ${item.quantity + 1}, ${item.price})">+</button>
                </div>
                <div style="font-weight:700; min-width:80px; text-align:right;">₹${item.total_price.toLocaleString()}</div>
                <button class="cart-item-remove" onclick="removeCartItem(${item.cart_id})">🗑</button>
            `;
            cartContainer.appendChild(row);
        });
        
        // Render Summary
        const deliveryCharge = subtotal > 1500 ? 0 : 99;
        const total = subtotal + deliveryCharge;
        
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <h3 style="margin-bottom:1.5rem;">Price Details</h3>
                <div class="summary-row">
                    <span>Bag Total</span>
                    <span>₹${subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charges</span>
                    <span>${deliveryCharge === 0 ? '<span style="color:var(--success)">FREE</span>' : '₹' + deliveryCharge}</span>
                </div>
                <div class="summary-row total">
                    <span>Amount Payable</span>
                    <span>₹${total.toLocaleString()}</span>
                </div>
                <button class="form-submit-btn" onclick="window.location.href='checkout.html'">Proceed to Checkout</button>
            `;
        }
    } catch (e) {
        console.error(e);
    }
}

async function updateCartQty(cartId, newQty, price) {
    if (newQty < 1) {
        await removeCartItem(cartId);
        return;
    }
    try {
        await apiCall(`/cart/update/${cartId}/`, 'PUT', {
            quantity: newQty,
            total_price: newQty * price
        });
        loadCartPage();
        syncNavbar();
    } catch (e) {}
}

async function removeCartItem(cartId) {
    try {
        await apiCall(`/cart/delete/${cartId}/`, 'DELETE');
        showToast('Item removed from cart', 'info');
        loadCartPage();
        syncNavbar();
    } catch (e) {}
}

// --- Load Checkout Page Data ---
async function loadCheckoutPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const cartItems = await apiCall(`/cart/?customer_name=${encodeURIComponent(user.full_name)}`);
        if (cartItems.length === 0) {
            showToast('No items in cart to checkout', 'warning');
            window.location.href = 'products.html';
            return;
        }
        
        // Auto fill address
        const addrField = document.getElementById('checkout-address');
        if (addrField) addrField.value = user.address || '';
        
        // Render order summary list
        const summaryList = document.getElementById('checkout-summary-list');
        if (summaryList) {
            summaryList.innerHTML = '';
            let subtotal = 0;
            cartItems.forEach(item => {
                subtotal += item.total_price;
                const li = document.createElement('div');
                li.className = 'summary-row';
                li.style.marginBottom = '0.5rem';
                li.innerHTML = `
                    <span>${item.product_name} (x${item.quantity})</span>
                    <span>₹${item.total_price.toLocaleString()}</span>
                `;
                summaryList.appendChild(li);
            });
            
            const deliveryCharge = subtotal > 1500 ? 0 : 99;
            const total = subtotal + deliveryCharge;
            
            document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
            document.getElementById('checkout-delivery').innerHTML = deliveryCharge === 0 ? '<span style="color:var(--success)">FREE</span>' : `₹${deliveryCharge}`;
            document.getElementById('checkout-total').textContent = `₹${total.toLocaleString()}`;
            
            // Form Submit handler
            const form = document.getElementById('checkout-form');
            if (form) {
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    await placeOrder(cartItems, total);
                };
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function placeOrder(cartItems, totalAmount) {
    const user = getCurrentUser();
    const address = document.getElementById('checkout-address').value;
    const paymentMethod = document.getElementById('checkout-payment-method').value;
    
    try {
        // Create order
        const orderData = {
            customer_name: user.full_name,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
            delivery_status: 'Processing'
        };
        
        await apiCall('/orders/add/', 'POST', orderData);
        
        // Update user address in database if it changed
        if (address !== user.address) {
            await apiCall(`/customers/update/${user.customer_id}/`, 'PUT', { address });
            user.address = address;
            setCurrentUser(user);
        }
        
        // Delete items from database cart
        for (let item of cartItems) {
            await apiCall(`/cart/delete/${item.cart_id}/`, 'DELETE');
        }
        
        showToast('Order placed successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 1500);
    } catch (e) {
        console.error(e);
    }
}

// --- Load Orders Page ---
async function loadOrdersPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const orders = await apiCall(`/orders/?customer_name=${encodeURIComponent(user.full_name)}`);
        const ordersList = document.getElementById('orders-list');
        
        if (!ordersList) return;
        
        ordersList.innerHTML = '';
        if (orders.length === 0) {
            ordersList.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);">You have not placed any orders yet.</div>';
            return;
        }
        
        // Sort orders newest first
        orders.sort((a,b) => b.order_id - a.order_id);
        
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            
            // Map delivery status to timeline progress width
            const statusMap = {
                'Processing': { width: '10%', activeIdx: 0 },
                'Packed': { width: '35%', activeIdx: 1 },
                'Shipped': { width: '60%', activeIdx: 2 },
                'Out for Delivery': { width: '85%', activeIdx: 3 },
                'Delivered': { width: '100%', activeIdx: 4 },
                'Cancelled': { width: '0%', activeIdx: -1 }
            };
            
            const currentStatus = order.delivery_status;
            const statusInfo = statusMap[currentStatus] || { width: '10%', activeIdx: 0 };
            
            const steps = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            let timelineHtml = '';
            
            if (currentStatus === 'Cancelled') {
                timelineHtml = `
                    <div style="color:var(--danger); font-weight:700; text-align:center; margin:1rem 0;">
                        This order has been Cancelled.
                    </div>
                `;
            } else {
                let stepsHtml = '';
                steps.forEach((step, idx) => {
                    let stepClass = '';
                    if (idx < statusInfo.activeIdx) stepClass = 'completed';
                    else if (idx === statusInfo.activeIdx) stepClass = 'active';
                    
                    stepsHtml += `
                        <div class="timeline-step ${stepClass}">
                            <div class="timeline-dot">${idx + 1}</div>
                            <div class="timeline-label">${step}</div>
                        </div>
                    `;
                });
                
                timelineHtml = `
                    <div class="timeline">
                        <div class="timeline-progress" style="width: ${statusInfo.width};"></div>
                        ${stepsHtml}
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="order-header">
                    <div class="order-header-info">
                        <h3>Order #${order.order_id}</h3>
                        <p>Placed on: ${order.order_date}</p>
                        <p style="margin-top:0.3rem;">Payment: <strong>${order.payment_method}</strong></p>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                        <span class="status-badge ${order.payment_status.toLowerCase()}">Payment: ${order.payment_status}</span>
                        <span class="status-badge ${currentStatus.toLowerCase().replace(/\s+/g, '')}">Delivery: ${currentStatus}</span>
                        <span style="font-size:1.3rem; font-weight:700; margin-top:0.3rem;">₹${order.total_amount.toLocaleString()}</span>
                    </div>
                </div>
                ${timelineHtml}
            `;
            ordersList.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

// --- Load Dashboard Page ---
async function loadDashboardPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if Administrator
    if (isAdmin()) {
        renderAdminDashboard();
    } else {
        renderCustomerDashboard(user);
    }
}

// --- Customer Dashboard View ---
async function renderCustomerDashboard(user) {
    const container = document.getElementById('dashboard-view-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2>Welcome back, ${user.full_name}!</h2>
            <p style="color:var(--text-muted)">Manage your profile, wishlist, and track orders from your dashboard.</p>
        </div>
        
        <div class="stats-container">
            <div class="stat-card primary-border">
                <h4>Total Orders</h4>
                <div class="value" id="stat-total-orders">-</div>
            </div>
            <div class="stat-card secondary-border">
                <h4>Active Orders</h4>
                <div class="value" id="stat-active-orders">-</div>
            </div>
            <div class="stat-card accent-border">
                <h4>Delivered Orders</h4>
                <div class="value" id="stat-delivered-orders">-</div>
            </div>
        </div>
        
        <div class="cart-layout" style="grid-template-columns: 1fr 1fr;">
            <div>
                <h3 style="margin-bottom:1rem;">My Wishlist (Bonus)</h3>
                <div id="wishlist-container" class="cart-items-container" style="background:var(--bg-secondary)">
                    <!-- Wishlist items load here -->
                </div>
            </div>
            <div>
                <h3 style="margin-bottom:1rem;">Profile Settings</h3>
                <form id="profile-update-form" class="cart-items-container" style="background:var(--bg-secondary)">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="prof-name" value="${user.full_name}" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="prof-email" value="${user.email}" disabled style="opacity:0.6;">
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="text" id="prof-phone" value="${user.phone}" required>
                    </div>
                    <div class="form-group">
                        <label>Delivery Address</label>
                        <textarea id="prof-addr" required style="height:80px;">${user.address}</textarea>
                    </div>
                    <button type="submit" class="add-record-btn" style="width:100%;">Update Details</button>
                </form>
            </div>
        </div>
    `;
    
    // Load Customer Stats
    try {
        const orders = await apiCall(`/orders/?customer_name=${encodeURIComponent(user.full_name)}`);
        document.getElementById('stat-total-orders').textContent = orders.length;
        
        const active = orders.filter(o => o.delivery_status !== 'Delivered' && o.delivery_status !== 'Cancelled').length;
        document.getElementById('stat-active-orders').textContent = active;
        
        const delivered = orders.filter(o => o.delivery_status === 'Delivered').length;
        document.getElementById('stat-delivered-orders').textContent = delivered;
    } catch (e) {}
    
    // Load Wishlist
    renderWishlist();
    
    // Profile Update Handler
    const pForm = document.getElementById('profile-update-form');
    if (pForm) {
        pForm.onsubmit = async (e) => {
            e.preventDefault();
            const updatedData = {
                full_name: document.getElementById('prof-name').value,
                phone: document.getElementById('prof-phone').value,
                address: document.getElementById('prof-addr').value
            };
            try {
                const updated = await apiCall(`/customers/update/${user.customer_id}/`, 'PUT', updatedData);
                // Merge email and password back
                updated.password = user.password;
                setCurrentUser(updated);
                showToast('Profile updated successfully!', 'success');
                syncNavbar();
            } catch (err) {}
        };
    }
}

function renderWishlist() {
    const list = getWishlist();
    const wishContainer = document.getElementById('wishlist-container');
    if (!wishContainer) return;
    
    wishContainer.innerHTML = '';
    if (list.length === 0) {
        wishContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.95rem; text-align:center;">Your wishlist is empty.</p>';
        return;
    }
    
    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'summary-row';
        div.style.padding = '0.5rem 0';
        div.style.borderBottom = '1px solid var(--glass-border)';
        div.innerHTML = `
            <span>🎁 ${item.name}</span>
            <button class="delete-row-btn" style="padding:0.2rem 0.5rem; font-size:0.8rem;" onclick="removeWishlistItem(${item.id}, '${item.name}')">Remove</button>
        `;
        wishContainer.appendChild(div);
    });
}

function removeWishlistItem(id, name) {
    toggleWishlist(id, name);
    renderWishlist();
}

// --- Admin Dashboard View ---
let currentAdminTab = 'customers';

function renderAdminDashboard() {
    const container = document.getElementById('dashboard-view-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-sidebar">
                <h3 style="margin-bottom:1rem; padding-left:1rem; font-size:1.1rem; color:var(--text-muted); uppercase">Admin Panel</h3>
                <button class="sidebar-tab active" id="tab-customers" onclick="switchAdminTab('customers')">👤 Customers</button>
                <button class="sidebar-tab" id="tab-categories" onclick="switchAdminTab('categories')">📁 Categories</button>
                <button class="sidebar-tab" id="tab-products" onclick="switchAdminTab('products')">📦 Products</button>
                <button class="sidebar-tab" id="tab-cart" onclick="switchAdminTab('cart')">🛒 Cart items</button>
                <button class="sidebar-tab" id="tab-orders" onclick="switchAdminTab('orders')">📜 Orders</button>
            </div>
            
            <div class="dashboard-content" id="admin-crud-panel">
                <!-- Crud operations loaded dynamically -->
            </div>
        </div>
    `;
    
    loadAdminTabContent();
}

function switchAdminTab(tab) {
    document.querySelectorAll('.sidebar-tab').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById(`tab-${tab}`);
    if (btn) btn.classList.add('active');
    
    currentAdminTab = tab;
    loadAdminTabContent();
}

async function loadAdminTabContent() {
    const panel = document.getElementById('admin-crud-panel');
    if (!panel) return;
    
    panel.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading panel records...</div>';
    
    try {
        if (currentAdminTab === 'customers') {
            const records = await apiCall('/customers/');
            panel.innerHTML = `
                <div class="table-header-actions">
                    <h2>Manage Customers</h2>
                    <button class="add-record-btn" onclick="openCrudModal('customer', null)">Add Customer</button>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.customer_id}</td>
                                    <td><strong>${r.full_name}</strong></td>
                                    <td>${r.email}</td>
                                    <td>${r.phone}</td>
                                    <td>${r.address}</td>
                                    <td>
                                        <div class="action-row-btns">
                                            <button class="edit-row-btn" onclick="openCrudModal('customer', ${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
                                            <button class="delete-row-btn" onclick="deleteAdminRecord('customer', ${r.customer_id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (currentAdminTab === 'categories') {
            const records = await apiCall('/categories/');
            panel.innerHTML = `
                <div class="table-header-actions">
                    <h2>Manage Categories</h2>
                    <button class="add-record-btn" onclick="openCrudModal('category', null)">Add Category</button>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.category_id}</td>
                                    <td><strong>${r.category_name}</strong></td>
                                    <td>${r.description}</td>
                                    <td>
                                        <div class="action-row-btns">
                                            <button class="edit-row-btn" onclick="openCrudModal('category', ${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
                                            <button class="delete-row-btn" onclick="deleteAdminRecord('category', ${r.category_id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (currentAdminTab === 'products') {
            const records = await apiCall('/products/');
            panel.innerHTML = `
                <div class="table-header-actions">
                    <h2>Manage Products</h2>
                    <button class="add-record-btn" onclick="openCrudModal('product', null)">Add Product</button>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Brand</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.product_id}</td>
                                    <td><img src="${r.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                                    <td><strong>${r.product_name}</strong></td>
                                    <td>${r.category}</td>
                                    <td>${r.brand}</td>
                                    <td>₹${r.price.toLocaleString()}</td>
                                    <td>${r.stock}</td>
                                    <td>
                                        <div class="action-row-btns">
                                            <button class="edit-row-btn" onclick="openCrudModal('product', ${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
                                            <button class="delete-row-btn" onclick="deleteAdminRecord('product', ${r.product_id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (currentAdminTab === 'cart') {
            const records = await apiCall('/cart/');
            panel.innerHTML = `
                <div class="table-header-actions">
                    <h2>Manage Shopping Cart</h2>
                    <button class="add-record-btn" onclick="openCrudModal('cart', null)">Add Cart Item</button>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer Name</th>
                                <th>Product Name</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.cart_id}</td>
                                    <td>${r.customer_name}</td>
                                    <td><strong>${r.product_name}</strong></td>
                                    <td>${r.quantity}</td>
                                    <td>₹${r.price.toLocaleString()}</td>
                                    <td>₹${r.total_price.toLocaleString()}</td>
                                    <td>
                                        <div class="action-row-btns">
                                            <button class="edit-row-btn" onclick="openCrudModal('cart', ${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
                                            <button class="delete-row-btn" onclick="deleteAdminRecord('cart', ${r.cart_id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (currentAdminTab === 'orders') {
            const records = await apiCall('/orders/');
            panel.innerHTML = `
                <div class="table-header-actions">
                    <h2>Manage Orders</h2>
                    <button class="add-record-btn" onclick="openCrudModal('order', null)">Add Order</button>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer Name</th>
                                <th>Order Date</th>
                                <th>Total Amount</th>
                                <th>Payment Method</th>
                                <th>Payment Status</th>
                                <th>Delivery Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(r => `
                                <tr>
                                    <td>${r.order_id}</td>
                                    <td><strong>${r.customer_name}</strong></td>
                                    <td>${r.order_date}</td>
                                    <td>₹${r.total_amount.toLocaleString()}</td>
                                    <td>${r.payment_method}</td>
                                    <td><span class="status-badge ${r.payment_status.toLowerCase()}">${r.payment_status}</span></td>
                                    <td><span class="status-badge ${r.delivery_status.toLowerCase().replace(/\s+/g, '')}">${r.delivery_status}</span></td>
                                    <td>
                                        <div class="action-row-btns">
                                            <button class="edit-row-btn" onclick="openCrudModal('order', ${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
                                            <button class="delete-row-btn" onclick="deleteAdminRecord('order', ${r.order_id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (e) {
        panel.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--danger);">Error loading content: ${e.message}</div>`;
    }
}

async function deleteAdminRecord(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    let endpoint = '';
    if (type === 'customer') endpoint = `/customers/delete/${id}/`;
    else if (type === 'category') endpoint = `/categories/delete/${id}/`;
    else if (type === 'product') endpoint = `/products/delete/${id}/`;
    else if (type === 'cart') endpoint = `/cart/delete/${id}/`;
    else if (type === 'order') endpoint = `/orders/delete/${id}/`;
    
    try {
        await apiCall(endpoint, 'DELETE');
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} record deleted successfully!`, 'success');
        loadAdminTabContent();
    } catch (e) {}
}

// --- CRUD Dialog Form Popup ---
function openCrudModal(type, data) {
    let overlay = document.getElementById('crud-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'crud-modal';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    
    const isEdit = !!data;
    let title = isEdit ? `Edit ${type.toUpperCase()}` : `Add New ${type.toUpperCase()}`;
    let fieldsHtml = '';
    
    if (type === 'customer') {
        fieldsHtml = `
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="crud-full_name" value="${data?.full_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="crud-email" value="${data?.email || ''}" required ${isEdit ? 'disabled style="opacity:0.6;"' : ''}>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="crud-phone" value="${data?.phone || ''}" required>
            </div>
            <div class="form-group">
                <label>Address</label>
                <textarea id="crud-address" required style="height:60px;">${data?.address || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="crud-password" value="${data?.password || ''}" required>
            </div>
        `;
    } else if (type === 'category') {
        fieldsHtml = `
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="crud-category_name" value="${data?.category_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="crud-description" required style="height:80px;">${data?.description || ''}</textarea>
            </div>
        `;
    } else if (type === 'product') {
        fieldsHtml = `
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="crud-product_name" value="${data?.product_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <input type="text" id="crud-category" value="${data?.category || ''}" required placeholder="Electronics, Fashion, etc.">
            </div>
            <div class="form-group">
                <label>Brand</label>
                <input type="text" id="crud-brand" value="${data?.brand || ''}" required>
            </div>
            <div class="form-group">
                <label>Price (₹)</label>
                <input type="number" id="crud-price" value="${data?.price || ''}" required min="0">
            </div>
            <div class="form-group">
                <label>Stock</label>
                <input type="number" id="crud-stock" value="${data?.stock || ''}" required min="0">
            </div>
            <div class="form-group">
                <label>Image URL</label>
                <input type="text" id="crud-image_url" value="${data?.image_url || ''}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="crud-description" required style="height:60px;">${data?.description || ''}</textarea>
            </div>
        `;
    } else if (type === 'cart') {
        fieldsHtml = `
            <div class="form-group">
                <label>Customer Name</label>
                <input type="text" id="crud-customer_name" value="${data?.customer_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="crud-product_name" value="${data?.product_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="crud-quantity" value="${data?.quantity || 1}" required min="1">
            </div>
            <div class="form-group">
                <label>Unit Price (₹)</label>
                <input type="number" id="crud-price" value="${data?.price || ''}" required min="0">
            </div>
        `;
    } else if (type === 'order') {
        fieldsHtml = `
            <div class="form-group">
                <label>Customer Name</label>
                <input type="text" id="crud-customer_name" value="${data?.customer_name || ''}" required>
            </div>
            <div class="form-group">
                <label>Total Amount (₹)</label>
                <input type="number" id="crud-total_amount" value="${data?.total_amount || ''}" required min="0">
            </div>
            <div class="form-group">
                <label>Payment Method</label>
                <select id="crud-payment_method">
                    <option value="UPI" ${data?.payment_method === 'UPI' ? 'selected' : ''}>UPI</option>
                    <option value="Credit Card" ${data?.payment_method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                    <option value="Debit Card" ${data?.payment_method === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                    <option value="Net Banking" ${data?.payment_method === 'Net Banking' ? 'selected' : ''}>Net Banking</option>
                    <option value="Cash on Delivery" ${data?.payment_method === 'Cash on Delivery' ? 'selected' : ''}>Cash on Delivery</option>
                </select>
            </div>
            <div class="form-group">
                <label>Payment Status</label>
                <select id="crud-payment_status">
                    <option value="Pending" ${data?.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Paid" ${data?.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Failed" ${data?.payment_status === 'Failed' ? 'selected' : ''}>Failed</option>
                </select>
            </div>
            <div class="form-group">
                <label>Delivery Status</label>
                <select id="crud-delivery_status">
                    <option value="Processing" ${data?.delivery_status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Packed" ${data?.delivery_status === 'Packed' ? 'selected' : ''}>Packed</option>
                    <option value="Shipped" ${data?.delivery_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Out for Delivery" ${data?.delivery_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="Delivered" ${data?.delivery_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${data?.delivery_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn" onclick="closeCrudModal()">×</button>
            <h3 style="margin-bottom:1.5rem;">${title}</h3>
            <form id="crud-submit-form" onsubmit="event.preventDefault(); submitCrudRecord('${type}', ${isEdit}, ${data ? (type === 'customer' ? data.customer_id : type === 'category' ? data.category_id : type === 'product' ? data.product_id : type === 'cart' ? data.cart_id : data.order_id) : null})">
                ${fieldsHtml}
                <button type="submit" class="form-submit-btn">${isEdit ? 'Save Changes' : 'Create Record'}</button>
            </form>
        </div>
    `;
    
    overlay.classList.add('open');
}

function closeCrudModal() {
    const modal = document.getElementById('crud-modal');
    if (modal) modal.classList.remove('open');
}

async function submitCrudRecord(type, isEdit, id) {
    const payload = {};
    
    if (type === 'customer') {
        payload.full_name = document.getElementById('crud-full_name').value;
        payload.phone = document.getElementById('crud-phone').value;
        payload.address = document.getElementById('crud-address').value;
        payload.password = document.getElementById('crud-password').value;
        if (!isEdit) payload.email = document.getElementById('crud-email').value;
    } else if (type === 'category') {
        payload.category_name = document.getElementById('crud-category_name').value;
        payload.description = document.getElementById('crud-description').value;
    } else if (type === 'product') {
        payload.product_name = document.getElementById('crud-product_name').value;
        payload.category = document.getElementById('crud-category').value;
        payload.brand = document.getElementById('crud-brand').value;
        payload.price = parseFloat(document.getElementById('crud-price').value);
        payload.stock = parseInt(document.getElementById('crud-stock').value);
        payload.image_url = document.getElementById('crud-image_url').value;
        payload.description = document.getElementById('crud-description').value;
    } else if (type === 'cart') {
        payload.customer_name = document.getElementById('crud-customer_name').value;
        payload.product_name = document.getElementById('crud-product_name').value;
        payload.quantity = parseInt(document.getElementById('crud-quantity').value);
        payload.price = parseFloat(document.getElementById('crud-price').value);
        payload.total_price = payload.quantity * payload.price;
    } else if (type === 'order') {
        payload.customer_name = document.getElementById('crud-customer_name').value;
        payload.total_amount = parseFloat(document.getElementById('crud-total_amount').value);
        payload.payment_method = document.getElementById('crud-payment_method').value;
        payload.payment_status = document.getElementById('crud-payment_status').value;
        payload.delivery_status = document.getElementById('crud-delivery_status').value;
    }
    
    let endpoint = '';
    let method = 'POST';
    if (isEdit) {
        method = 'PUT';
        if (type === 'customer') endpoint = `/customers/update/${id}/`;
        else if (type === 'category') endpoint = `/categories/update/${id}/`;
        else if (type === 'product') endpoint = `/products/update/${id}/`;
        else if (type === 'cart') endpoint = `/cart/update/${id}/`;
        else if (type === 'order') endpoint = `/orders/update/${id}/`;
    } else {
        if (type === 'customer') endpoint = '/customers/add/';
        else if (type === 'category') endpoint = '/categories/add/';
        else if (type === 'product') endpoint = '/products/add/';
        else if (type === 'cart') endpoint = '/cart/add/';
        else if (type === 'order') endpoint = '/orders/add/';
    }
    
    try {
        await apiCall(endpoint, method, payload);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} record saved successfully!`, 'success');
        closeCrudModal();
        loadAdminTabContent();
    } catch (e) {}
}

// --- General Debounce Helper ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Initialize Page on Content Load ---
document.addEventListener('DOMContentLoaded', () => {
    syncNavbar();
    
    const page = window.location.pathname.split("/").pop();
    if (page === 'index.html' || page === '') {
        loadHomePage();
    } else if (page === 'products.html') {
        loadProductsPage();
    } else if (page === 'cart.html') {
        loadCartPage();
    } else if (page === 'checkout.html') {
        loadCheckoutPage();
    } else if (page === 'orders.html') {
        loadOrdersPage();
    } else if (page === 'dashboard.html') {
        loadDashboardPage();
    }
});

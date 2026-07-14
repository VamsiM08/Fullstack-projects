# AetherShop - Full Stack E-Commerce Application

AetherShop is a premium, responsive Full-Stack E-Commerce web application built using **Django REST APIs** (Function-Based Views) for the backend, **SQLite** for database management, and a beautiful **HTML5, CSS3, and JavaScript (Fetch API)** glassmorphic frontend.

---

## 📁 Folder Structure

The application is structured exactly as requested:

```
ECommerceApplication/
├── Backend/
│   ├── __init__.py
│   ├── apps.py
│   ├── db.py           # Database Model Definitions
│   ├── db.sqlite3      # SQLite Database File
│   ├── manage.py       # Django Manager Runner
│   ├── models.py       # Django Auto-discovery mappings
│   ├── populate.py     # Database Seed/Populate Script
│   ├── settings.py     # Django Settings (CORS, REST configuration)
│   ├── urls.py         # 20 REST API Endpoints Route Mapping
│   ├── views.py        # Django Function-Based Views (FBVs) & Serializers
│   └── wsgi.py         # WSGI Entry Point
└── Frontend/
    ├── index.html      # Home Page (Hero, Categories, Featured Products)
    ├── login.html      # Sign-In Form (Admin / Customer login)
    ├── register.html   # Customer Registration Form
    ├── products.html   # Products Catalogue (Filters, Search, Modal Details)
    ├── cart.html       # Shopping Cart Manager (Adjust qty, delete items)
    ├── checkout.html   # Checkout Portal (Delivery Address, Payment Details)
    ├── orders.html     # Orders History & Progress Timeline Tracker
    ├── style.css       # Custom Glassmorphic CSS Theme
    └── script.js       # Fetch API integrations & UI handlers
```

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Custom styles with backdrop-filters and gradients), Vanilla JavaScript (ES6), browser Fetch API, LocalStorage.
- **Backend**: Django 4.2.30, Django REST Framework (Function-Based Views & Serializers).
- **Database**: SQLite3 with custom primary keys ranges.

---

## 🚀 Installation & Startup Guide

### 1. Prerequisite Installations
Ensure that Python 3.8+ and Django are installed on your machine:
```bash
pip install django djangorestframework django-cors-headers
```

### 2. Set Up the Database and Seed Data
Navigate to the `Backend` directory and execute database migrations to set up SQLite tables:
```bash
cd ECommerceApplication/Backend
python manage.py makemigrations Backend
python manage.py migrate
```

Next, run the seeding script to populate the database with categories, products (with high-quality Unsplash image URLs), a customer account, and a sample order:
```bash
python populate.py
```

### 3. Start the Backend API Server
Run the Django development server:
```bash
python manage.py runserver 0.0.0.0:8000
```
The backend API server will listen on `http://localhost:8000/`.

### 4. Launch the Frontend
Simply open the `ECommerceApplication/Frontend/index.html` file in any modern web browser to interact with the application.

---

## 🔑 Login Credentials

For demonstration and testing purposes, the database is pre-seeded with the following users:

### 👤 Customer Login
- **Email**: `rahul@gmail.com`
- **Password**: `rahul123`
*(Allows browsing, adding to cart, placing orders, writing reviews, managing wishlist, and updating customer profile).*

### 🔑 Administrator Login
- **Email**: `admin` or `admin@ecommerce.com`
- **Password**: `admin`
*(Grants access to the full Admin CRUD console to create, read, update, and delete Customers, Categories, Products, Cart items, and Orders).*

---

## 📊 Summary of 20 CRUD REST APIs

All 20 endpoints are defined in `Backend/urls.py` and handled by Function-Based Views in `Backend/views.py`:

### 1. Customer Management (4 APIs)
- **POST** `/customers/add/` : Register a new customer
- **GET** `/customers/` : Retrieve all registered customers (supports query filters for email & password verification)
- **PUT** `/customers/update/<id>/` : Update customer profile info
- **DELETE** `/customers/delete/<id>/` : Delete a customer profile

### 2. Category Management (4 APIs)
- **POST** `/categories/add/` : Create a new category
- **GET** `/categories/` : Fetch all product categories
- **PUT** `/categories/update/<id>/` : Update category details
- **DELETE** `/categories/delete/<id>/` : Delete a category

### 3. Product Management (4 APIs)
- **POST** `/products/add/` : Create a new product
- **GET** `/products/` : Fetch all products (supports query parameters `search`, `category`, `min_price`, and `max_price` for live filtering)
- **PUT** `/products/update/<id>/` : Update product details
- **DELETE** `/products/delete/<id>/` : Delete a product

### 4. Shopping Cart Management (4 APIs)
- **POST** `/cart/add/` : Add item to cart
- **GET** `/cart/` : Retrieve cart items (supports `customer_name` query filtering)
- **PUT** `/cart/update/<id>/` : Update cart quantity and total price
- **DELETE** `/cart/delete/<id>/` : Remove item from cart

### 5. Order Management (4 APIs)
- **POST** `/orders/add/` : Place a new order
- **GET** `/orders/` : Fetch orders (supports `customer_name` query filtering)
- **PUT** `/orders/update/<id>/` : Update order details (payment status, delivery tracking)
- **DELETE** `/orders/delete/<id>/` : Delete or cancel an order

---

## 💎 Bonus Features Implemented

1. **Product Search & Filter**: Real-time debounce product name/brand search, category classification buttons, and price range selector.
2. **Wishlist Management**: Fully functional customer wishlist tracking synced via LocalStorage per customer.
3. **Product Rating & Reviews**: Users can post reviews (1 to 5 stars) and write comments on product detail modals.
4. **Order Tracking Timeline**: Stepper tracker widget visually representing order states from *Processing* to *Delivered*.
5. **Responsive Mobile Design**: CSS flex grids and media queries to support smartphones, tablets, and desktops.

# Fashion Store Website - Full Stack Major Project 9

A premium, interactive e-commerce storefront for browsing clothing, footwear, accessories, managing a shopping cart, and placing orders. The project utilizes a **Django REST API** (Function-Based Views and SQLite) backend and an aesthetically rich **HTML5/CSS3/JavaScript (ES6)** static frontend.

---

## 📂 Project Structure

```text
FashionStore/
│
├── Backend/
│   ├── db.py            # Direct SQLite3 operations and seeding
│   ├── views.py         # Function-Based Views and Custom CORS Middleware
│   ├── urls.py          # API Endpoint routing configuration
│   ├── settings.py      # Core Django Configurations
│   ├── manage.py        # Django CLI startup runner script
│   └── fashion_store.db # Auto-created SQLite Database
│
└── Frontend/
    ├── index.html       # Storefront home page with banner slider
    ├── login.html       # Customer Sign-in page
    ├── register.html    # Customer Sign-up registration page
    ├── products.html    # Product Catalog with Search & Filter
    ├── cart.html        # Shopping Cart management page
    ├── checkout.html    # Order Placement and Address selection page
    ├── orders.html      # Customer Purchase/Order tracking history page
    ├── dashboard.html   # Admin panel (Customers, Products, Categories, Orders CRUD)
    ├── style.css        # Premium, luxury dark-themed stylesheet
    └── script.js        # Ajax client wrappers, SVGs, and DOM controllers
```

---

## ⚡ Tech Stack Specifications

- **Frontend**: HTML5, Vanilla CSS3 (Custom variables, flex/grid layouts, keyframe animations, glassmorphic panels), ES6 JavaScript (Fetch API, DOM selectors, dynamic SVG vector card rendering, and LocalStorage state management).
- **Backend**: Django 4.2.x, Custom CorsMiddleware, Django Function-Based Views (`@csrf_exempt`).
- **Database**: SQLite3 (automatically initialized and seeded on first run).
- **Port Mapping**: Configured to run on Port **`8080`** by default (resolving potential local port conflicts with other development tasks).

---

## 🚀 Running the Project Locally

### 1. Start the Django Backend
Navigate to the `Backend` directory and start the server:
```bash
cd FashionStore/Backend
python manage.py runserver 8080
```
On startup, the backend automatically sets up the SQLite file `fashion_store.db` and populates it with the standard sample data.

### 2. Access the Frontend
Open `FashionStore/Frontend/index.html` in your browser. You can open it directly as a local file or run it via any local web server extension (such as Live Server in VS Code).

---

## 🔑 Default Accounts (Pre-Seeded)

- **Standard Customer**:
  - Email: `rahul@gmail.com`
  - Password: `password123`
  - Full Name: Rahul Sharma
- **Administrator**:
  - Email: `admin@gmail.com`
  - Password: `admin123`
  - Full Name: Admin User

---

## 📡 API Reference Checklist (20 APIs)

### 👤 Customer Management
- **POST** `/customers/add/`: Registers a new customer account.
- **GET** `/customers/`: Lists all registered customer profiles.
- **PUT** `/customers/update/<id>/`: Modifies details for a specific customer profile.
- **DELETE** `/customers/delete/<id>/`: Removes a customer account.
- **POST** `/customers/login/`: Validates credentials and returns customer details (Custom Auth helper).

### 🏷️ Category Management
- **POST** `/categories/add/`: Adds a new product category.
- **GET** `/categories/`: Retrieves list of all categories.
- **PUT** `/categories/update/<id>/`: Modifies category name or description.
- **DELETE** `/categories/delete/<id>/`: Removes a category.

### 👕 Product Management
- **POST** `/products/add/`: Registers a new product.
- **GET** `/products/`: Lists all products (supports query filters `?category=Name` and `?search=query`).
- **PUT** `/products/update/<id>/`: Updates size, price, stock, brand, etc.
- **DELETE** `/products/delete/<id>/`: Deletes a product.

### 🛒 Shopping Cart Management
- **POST** `/cart/add/`: Adds or increments item quantity inside a customer's cart.
- **GET** `/cart/`: Retrieves cart items (supports filtering by query `?customer_name=Name`).
- **PUT** `/cart/update/<id>/`: Updates quantity and recalculates totals.
- **DELETE** `/cart/delete/<id>/`: Removes item from the cart.

### 📦 Order Management
- **POST** `/orders/add/`: Submits order information, clears user's cart.
- **GET** `/orders/`: Retrieves order list (supports filtering by query `?customer_name=Name`).
- **PUT** `/orders/update/<id>/`: Modifies order statuses (payment, delivery).
- **DELETE** `/orders/delete/<id>/`: Removes order database record.

---

## 🛠️ Verification Test
To verify the REST API programmatically, run:
```bash
python "../verify_api.py"
```
It should return list summaries for the seeded categories, products, and customers.

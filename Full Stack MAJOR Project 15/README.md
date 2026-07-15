# Food Ordering Application

A modern, highly aesthetic gourmet food ordering web application. Built with a **Django REST API backend** (powered by SQLite) and a premium, responsive **HTML5/CSS3/JavaScript frontend** integrating APIs using the **Fetch API**.

## Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with dark-mode glassmorphism and responsive grid systems), JavaScript (ES6), Fetch API.
- **Backend**: Django (Function-Based Views for pure REST endpoints).
- **Database**: SQLite (initialized and seeded automatically).

---

## Folder Structure

```
FoodOrderingApplication/
├── Backend/
│   ├── db.sqlite3      (Auto-generated on run)
│   ├── db.py           (Database connection, table schemas, seed data & CRUD handlers)
│   ├── views.py        (Django FBV REST endpoints)
│   ├── urls.py         (Django endpoints mapping)
│   ├── settings.py     (Django server configuration with CORS enabled)
│   └── manage.py       (Django server manager)
│
└── Frontend/
    ├── index.html                  (Landing page with search, categories, and items)
    ├── login.html                  (Unified role selector login panel)
    ├── register.html               (Customer registration form)
    ├── restaurants.html            (Browse restaurants with cuisine/rating filters)
    ├── menu.html                   (Browse foods in a restaurant menu and add to cart)
    ├── cart.html                   (Shopping cart with live quantity & total calculations)
    ├── checkout.html               (Secure checkout page with address details)
    ├── orders.html                 (Customer order history & status tracking timeline)
    ├── customer_dashboard.html     (Profile updates & order statistics dashboard)
    ├── restaurant_dashboard.html   (Owner panel: menu editor & incoming orders updater)
    └── admin_dashboard.html        (Super Admin CRUD master interface for all 5 modules)
```

---

## Setup & Running Instructions

### 1. Start the Backend Server

Navigate to the `FoodOrderingApplication/Backend/` directory and start the Django development server:

```bash
# From the project root folder:
python FoodOrderingApplication/Backend/manage.py runserver
```

- The server will run on `http://127.0.0.1:8000`.
- **Note**: The backend automatically initializes the SQLite database (`db.sqlite3`) and populates it with all the required sample testing data for customers, restaurants, menu items, and initial carts/orders out of the box!

### 2. Launch the Frontend

Simply open `FoodOrderingApplication/Frontend/index.html` in any modern web browser.
- Alternatively, you can use a local web server extension (e.g., Live Server in VS Code) or Python's built-in http server:
  ```bash
  python -m http.server 8080 --directory FoodOrderingApplication/Frontend
  ```
  Then browse to `http://localhost:8080`.

---

## Role-Based Credentials for Testing

To test the application's flows, select one of the roles on the **Login Page**:

1. **Customer Login**
   - **Email**: `rahul@gmail.com`
   - **Password**: `rahul123`
   - *Alternative*: You can register a brand new customer using the **Sign Up** link.

2. **Restaurant Owner Login**
   - **Restaurant Name**: `Spicy Kitchen`
   - **Owner Name**: `Anil Kumar`
   - *Alternative*: Manage other seeded restaurants (e.g., `Burger Palace` / `Sarah Miller`, `Pizza Corner` / `Marco Rossi`).

3. **Admin Login (Super Administrator)**
   - **Username**: `admin`
   - **Password**: `admin`

---

## Key Features & Evaluator Bonus Items

- **Visual Excellence**: Sophisticated dark-mode layout with smooth transitions, custom Google Fonts (`Outfit` & `Inter`), glowing accent states, and responsive grids.
- **Restaurant Search & Filters (Bonus)**: Search restaurants by keyword and filter by cuisine types on the Browse Restaurants page.
- **Food Search by Category (Bonus)**: Instantly filter dishes on the Landing Page and Restaurant Menu using category chips.
- **Live Cart Total Calculation (Bonus)**: Interactively adjust quantities in the cart, delete items, and watch individual totals and grand bills update instantly without reloading the page.
- **Order Tracking Timeline (Bonus)**: Visual status tracking bar in the customer's Orders page showing order milestones (`Placed` -> `Preparing` -> `Out for Delivery` -> `Delivered`).
- **Owner Control Panel**: Add/update/delete menu items and change payment/delivery status of incoming orders.
- **Master Admin Control Panel**: Switch between tabs to access full CRUD panels for Customers, Restaurants, Food Items, Cart Items, and Orders.

---

## Full API Specification (20 APIs)

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Customer** | `POST` | `/customers/add/` | Add a new customer (Registration) |
| | `GET` | `/customers/` | Retrieve all customers (supports `?email=...&password=...` login query) |
| | `PUT` | `/customers/update/<id>/` | Update customer profile details |
| | `DELETE` | `/customers/delete/<id>/` | Delete customer account |
| **Restaurant** | `POST` | `/restaurants/add/` | Add a new restaurant |
| | `GET` | `/restaurants/` | Retrieve all restaurants (supports search/cuisine filtering) |
| | `PUT` | `/restaurants/update/<id>/` | Update restaurant details |
| | `DELETE` | `/restaurants/delete/<id>/` | Delete restaurant |
| **Food Menu** | `POST` | `/foods/add/` | Add a new dish to menu |
| | `GET` | `/foods/` | Retrieve all food items (supports `?restaurant_name=...` filtering) |
| | `PUT` | `/foods/update/<id>/` | Update food item details |
| | `DELETE` | `/foods/delete/<id>/` | Delete food item from menu |
| **Shopping Cart** | `POST` | `/cart/add/` | Add item to cart |
| | `GET` | `/cart/` | Retrieve active cart items (supports `?customer_name=...` filtering) |
| | `PUT` | `/cart/update/<id>/` | Update item quantity & total price |
| | `DELETE` | `/cart/delete/<id>/` | Remove item from cart |
| **Order** | `POST` | `/orders/add/` | Create a new order (clears cart automatically) |
| | `GET` | `/orders/` | Retrieve orders (supports `?customer_name=...` or `?restaurant_name=...`) |
| | `PUT` | `/orders/update/<id>/` | Update order status / payment status |
| | `DELETE` | `/orders/delete/<id>/` | Delete order history record |

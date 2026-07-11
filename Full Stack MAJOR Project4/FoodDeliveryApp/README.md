# GourmetGO | Food Delivery Application

Welcome to **GourmetGO**, a complete Full Stack Food Delivery Application built as a Major Project for the Python-FSD batch. It features a flat Django REST API backend integrated with a SQLite database, and a premium dark-themed glassmorphism frontend layout.

---

## 📂 Project Structure

```text
FoodDeliveryApp/
│
├── Backend/
│   ├── manage.py            # Custom lightweight Django command-line utility
│   ├── settings.py          # Django configurations (with CORS middleware)
│   ├── urls.py              # URL routes configuration for all 20 API endpoints
│   ├── views.py             # Function-Based Views (FBVs) executing SQLite queries
│   ├── db.py                # Database connector (table initialization and seeding)
│   ├── db.sqlite3           # SQLite database file containing preseeded datasets
│   └── test_endpoints.py    # Automated test suite verifying REST API compliance
│
└── Frontend/
    ├── index.html           # Landing page (hero banner, search bars, listings)
    ├── login.html           # Customer authentication using registered email
    ├── register.html        # Customer registration profile creator form
    ├── restaurants.html     # Explore restaurants list with cuisine and city filters
    ├── menu.html            # Interactive food menu with category tabs & quantity adjustments
    ├── cart.html            # Shopping cart overview, price summary & checkout modal
    ├── orders.html          # Order details with real-time delivery progress step-trackers
    ├── dashboard.html       # Administrator panel with stats counts & CRUD controls
    ├── style.css            # Custom CSS animations, dark palette & glassmorphism grids
    └── script.js            # Fetch calls, localStorage session managers & toasts helper
```

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, CSS Grid/Flexbox, Keyframes), JavaScript (ES6+), Fetch API.
- **Backend**: Django (Function-Based Views, REST APIs).
- **Database**: SQLite (SQL query integrations, auto-increment resets starting at offsets).
- **CORS Handling**: `django-cors-headers` middleware to enable local multi-origin fetches.

---

## 💾 Database Schema & ID Mapping

All database models automatically seed with standard testing data on the first server boot. Auto-increment parameters are set to offset primary keys for cleaner testing:

1. **Customer** (`customer_id` starts at `101`)
   - Fields: `customer_id` (Number), `full_name` (String), `email` (String, Unique), `phone` (String), `address` (String), `city` (String)
2. **Restaurant** (`restaurant_id` starts at `201`)
   - Fields: `restaurant_id` (Number), `restaurant_name` (String, Unique), `owner_name` (String), `location` (String), `cuisine` (String), `rating` (Number)
3. **Food Menu Item** (`food_id` starts at `301`)
   - Fields: `food_id` (Number), `restaurant_name` (String), `food_name` (String), `category` (String), `price` (Number), `availability` (String)
4. **Cart Item** (`cart_id` starts at `401`)
   - Fields: `cart_id` (Number), `customer_name` (String), `food_name` (String), `quantity` (Number), `price` (Number), `total_price` (Number)
5. **Order** (`order_id` starts at `501`)
   - Fields: `order_id` (Number), `customer_name` (String), `restaurant_name` (String), `order_items` (String), `total_amount` (Number), `payment_status` (String: Pending/Paid), `delivery_status` (String: Preparing/Out for Delivery/Delivered/Cancelled)

---

## 📡 REST API Specifications (20 CRUD Endpoints)

| Module | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Customer** | POST | `/customers/add/` | Registers a new customer profile |
| | GET | `/customers/` | Retrieves customer profiles (supports `?email=...` query) |
| | PUT | `/customers/update/<id>/` | Modifies an existing customer's records |
| | DELETE | `/customers/delete/<id>/` | Removes a customer profile |
| **Restaurant** | POST | `/restaurants/add/` | Onboards a new partner restaurant |
| | GET | `/restaurants/` | Retrieves restaurants (supports search & cuisine/city filters) |
| | PUT | `/restaurants/update/<id>/` | Modifies restaurant details |
| | DELETE | `/restaurants/delete/<id>/` | Removes a restaurant partner |
| **Food Menu** | POST | `/foods/add/` | Adds a dish to a restaurant's menu |
| | GET | `/foods/` | Retrieves food menu items (supports `?restaurant_name=...`) |
| | PUT | `/foods/update/<id>/` | Modifies dish details (availability, price, category) |
| | DELETE | `/foods/delete/<id>/` | Removes a dish from the menu |
| **Cart** | POST | `/cart/add/` | Adds item to customer's cart (increments qty if existing) |
| | GET | `/cart/` | Retrieves cart items (supports `?customer_name=...` filter) |
| | PUT | `/cart/update/<id>/` | Modifies quantity and recalculates totals |
| | DELETE | `/cart/delete/<id>/` | Removes an item from the cart |
| **Order** | POST | `/orders/add/` | Places a new order (clears matching user cart items) |
| | GET | `/orders/` | Retrieves orders (supports `?customer_name=...` filter) |
| | PUT | `/orders/update/<id>/` | Updates status (Preparing, Out for Delivery, etc.) |
| | DELETE | `/orders/delete/<id>/` | Deletes an order log entry |

---

## 🚀 Execution Instructions

### Prerequisites
Make sure Python is installed. Installs needed dependencies:
```bash
pip install django django-cors-headers
```

### 1. Launch Backend Server
Navigate to the `Backend` folder and run the command:
```bash
python manage.py runserver 8000
```
*Note: SQLite database is initialized and preseeded automatically during the startup.*

### 2. Verify REST APIs (Automated Test Suite)
While the server is running, open a new command window and run the test script inside the `Backend` folder:
```bash
python test_endpoints.py
```
This executes CRUD routines across all 20 REST API configurations and prints a success report.

### 3. Open Frontend Interface
Open `Frontend/index.html` directly in a browser or host it locally.
- Use the preseeded customer email `rahul@gmail.com` to log in instantly.
- Browse restaurants, adjust quantities, add to the cart, checkout, and monitor order tracking progress.
- Access the **Admin Dashboard** tab to add, modify, or delete customers, restaurants, food menu listings, or update order statuses.

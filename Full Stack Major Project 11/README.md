# Expense Tracker Application

A full-stack Expense Tracker application designed to record income, monitor daily expenses, manage category-specific limits, and track monthly budget summaries.

This project is built as part of the Python Full-Stack Development (FSD) curriculum and consists of a robust Django REST API backend coupled with an interactive, glassmorphism-themed frontend utilizing vanilla HTML, CSS, and JavaScript.

---

## 🛠️ Technology Stack

### Backend
*   **Core Framework**: Django (Version 4.2.30)
*   **Architecture**: Function-Based Views (FBVs) mapping directly to custom endpoints
*   **Database**: SQLite (built-in, self-initializing schema)
*   **CORS & CSRF**: Built-in CORS preflight responses and CSRF exemptions for local REST interactions

### Frontend
*   **Structure**: HTML5 (Semantic Layouts)
*   **Styling**: CSS3 (Curated Dark Mode & Glassmorphism Theme)
*   **Logic**: Vanilla JavaScript (ES6) utilizing the **Fetch API** for AJAX CRUD calls
*   **Data Visualization**: **Chart.js** via CDN for animated budget/category summaries
*   **Icons**: FontAwesome CDN for premium icon glyphs

---

## 📂 Project Structure

```text
ExpenseTracker/
│
├── Backend/
│   ├── db.py               # SQLite Connection, Table Setup & CRUD operations
│   ├── views.py            # Django Function-Based Views implementing 20 REST APIs
│   ├── urls.py             # Route mappings, inline settings, & Dev Server entrypoint
│   ├── test_api.py         # Automated Python script to test all 20 API endpoints
│   └── expense_tracker.db  # SQLite Database file (created dynamically)
│
└── Frontend/
    ├── index.html          # Portal Landing page with stats overview
    ├── login.html          # Credential auth login card
    ├── register.html       # User signup page matching DB Schema
    ├── dashboard.html      # KPI totals, Chart.js visualizations, and recent history
    ├── income.html         # Income logger form and history table
    ├── expenses.html       # Expense logger, category limits notifier, and filter dropdown
    ├── categories.html     # Custom category manager and monthly limit editor
    ├── budget.html         # Sync trigger, progress bars, and budget status indicators
    ├── style.css           # Glassmorphism design system & styles
    └── script.js           # AJAX fetch wrapper, session control, and budget compiler
```

---

## 🚀 Running the Project

### 1. Prerequisite Checks
Ensure Python 3.x is installed in your system environment.
```bash
python --version
```
Install Django if you haven't already:
```bash
pip install django
```

### 2. Start the Django API Backend Server
From the root directory of the project, start the Django development server by running:
```bash
python Backend/urls.py
```
This boots the backend on `http://127.0.0.1:8000/`. The server will dynamically create the SQLite database file (`expense_tracker.db`) and pre-populate it with default categories (Food, Travel, Shopping, Rent, Utilities, Entertainment) if they do not exist.

### 3. Open the Frontend Application
You can open the frontend pages by double-clicking on `Frontend/index.html` (or using a local development server like Live Server in VS Code). 
*   Accessing dashboard, income, expenses, categories, or budget pages requires being logged in. Unauthenticated users are redirected to `login.html`.
*   Click **Register** to create a user account. After creation, log in to start tracking.

---

## 🧪 Testing the APIs

We have written an automated validation script `Backend/test_api.py` that exercises the CRUD actions for all 5 modules (20 APIs in total).

While the Django server is running on `http://127.0.0.1:8000/`, open a new terminal window and run:
```bash
python Backend/test_api.py
```
It will run through the user registration, category updating, income logging, expense logging, budget syncing, and cleanup paths, printing success logs for each verification.

---

## 📡 REST API Specifications (20 APIs)

The backend implements the following Django FBV endpoints:

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **User** | `POST` | `/users/add/` | Register a new user |
| | `GET` | `/users/` | Fetch all user profiles |
| | `PUT` | `/users/update/<id>/` | Update user details |
| | `DELETE` | `/users/delete/<id>/` | Delete user profile |
| **Income**| `POST` | `/income/add/` | Log an income transaction |
| | `GET` | `/income/` | Fetch incomes (supports `?user_name=...` filter) |
| | `PUT` | `/income/update/<id>/` | Update income details |
| | `DELETE` | `/income/delete/<id>/` | Delete income transaction |
| **Expense**| `POST` | `/expenses/add/` | Log an expense transaction |
| | `GET` | `/expenses/` | Fetch expenses (supports `?user_name=...` & `?category=...` filters) |
| | `PUT` | `/expenses/update/<id>/` | Update expense details |
| | `DELETE` | `/expenses/delete/<id>/` | Delete expense transaction |
| **Category**| `POST` | `/categories/add/` | Create a custom category |
| | `GET` | `/categories/` | Fetch all active categories |
| | `PUT` | `/categories/update/<id>/` | Edit category limit or description |
| | `DELETE` | `/categories/delete/<id>/` | Remove category |
| **Budget** | `POST` | `/budgets/add/` | Create budget summary entry |
| | `GET` | `/budgets/` | Fetch budget ledger (supports `?user_name=...` filter) |
| | `PUT` | `/budgets/update/<id>/` | Update budget entry |
| | `DELETE` | `/budgets/delete/<id>/` | Delete budget entry |

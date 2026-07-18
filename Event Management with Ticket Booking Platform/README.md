# Event Management with Ticket Booking Platform

A full-stack Event Management and Ticket Booking web application built with **Django REST Framework (Function-Based Views)** backend, **SQLite** database, and **Vanilla HTML5, CSS3 (Dark Glassmorphism UI), and JavaScript (ES6 Fetch API)** frontend.

---

## 📁 Project Folder Structure

```
EventManagementSystem/
│── Backend/
│     manage.py               # Django management entry point
│     settings.py             # Django settings & CORS configuration
│     urls.py                 # REST API routes (20 CRUD endpoints + bonus)
│     views.py                # Django Function-Based Views (FBVs)
│     models.py               # Django ORM data models
│     db.py                   # Database migration & seed script
│     db.sqlite3              # SQLite database file
│     test_apis.py            # Automated API testing script
│     backend_app/            # Django application package
│
└── Frontend/
      index.html              # Home page with hero, live search & featured events
      login.html              # User authentication page
      register.html           # User registration & role selection page
      events.html             # Event catalog with search, category & price filters
      event_details.html      # Event details, countdown timer, venue & review system
      booking.html            # Ticket booking & interactive seat selection map
      payment.html            # Payment gateway simulation & instant QR ticket modal
      booking_history.html    # User ticket booking history & ticket download pass
      user_dashboard.html     # User metrics, ticket stats & profile editor
      organizer_dashboard.html# Organizer metrics, event publisher & venue manager
      admin_dashboard.html    # Master Admin dashboard (CRUD for all 5 modules)
      style.css               # Modern dark-mode glassmorphic CSS design system
      script.js               # Central JS engine & Fetch API wrapper
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- Python 3.8 or higher installed on your machine.
- Web Browser (Chrome, Edge, Firefox, or Safari).

### 2. Backend Installation & Server Launch
Navigate to the `Backend` directory and run the database setup script, then start the server:

```bash
cd EventManagementSystem/Backend

# 1. Install required Python packages
python -m pip install django djangorestframework django-cors-headers

# 2. Run Database Migration & Seed Script
python db.py

# 3. Launch the Django REST API Server (Port 8000)
python manage.py runserver 8000
```

The REST API backend will now be live at `http://127.0.0.1:8000/`.

### 3. Run Backend API Tests
To verify all 20 REST API endpoints automatically:
```bash
python test_apis.py
```

### 4. Running the Frontend
Open `EventManagementSystem/Frontend/index.html` directly in your browser or serve it using any HTTP static server (e.g. `npx serve` or Live Server).

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **User** | `rahul@gmail.com` | `rahul123` |
| **Organizer** | `priya@gmail.com` | `priya123` |
| **Admin** | `admin@eventhub.com` | `admin123` |

---

## 📡 Complete REST API Documentation (20 Endpoints)

### Module 1 – User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/users/add/` | Register a new user |
| `GET` | `/users/` | Get list of all registered users |
| `PUT` | `/users/update/<id>/` | Update user details |
| `DELETE` | `/users/delete/<id>/` | Delete a user by ID |
| `POST` | `/users/login/` | Authenticate user credentials |

### Module 2 – Event Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/events/add/` | Publish a new event |
| `GET` | `/events/` | Retrieve all events |
| `PUT` | `/events/update/<id>/` | Update event information |
| `DELETE` | `/events/delete/<id>/` | Delete an event |

### Module 3 – Venue Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/venues/add/` | Add a new venue |
| `GET` | `/venues/` | Retrieve all venues |
| `PUT` | `/venues/update/<id>/` | Update venue details |
| `DELETE` | `/venues/delete/<id>/` | Delete a venue |

### Module 4 – Ticket Booking Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/bookings/add/` | Book tickets for an event |
| `GET` | `/bookings/` | Retrieve all ticket bookings |
| `PUT` | `/bookings/update/<id>/` | Update booking status/details |
| `DELETE` | `/bookings/delete/<id>/` | Cancel or delete booking |

### Module 5 – Payment Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/payments/add/` | Process online payment transaction |
| `GET` | `/payments/` | Retrieve all transaction records |
| `PUT` | `/payments/update/<id>/` | Update payment details |
| `DELETE` | `/payments/delete/<id>/` | Delete payment record |

---

## 🌟 Bonus Features Implemented (20 Marks)

1. **Event Search & Category Filters (4 Marks)**: Real-time keyword search and category pills filtering (Conference, Music Concert, Comedy, Workshop, Sports, Seminar).
2. **Interactive Seat Selection Layout (4 Marks)**: Visual arena seat grid allowing users to choose specific seats (A1, A2, etc.) with dynamic total price calculations.
3. **QR Code Ticket Generation (4 Marks)**: Instant client-side SVG QR code generation for digital ticket passes.
4. **Event Reminder Notifications (4 Marks)**: Dynamic real-time countdown timer on event details pages showing days, hours, minutes, and seconds remaining.
5. **Event Reviews & Ratings (4 Marks)**: Interactive review posting system with star rating breakdown.

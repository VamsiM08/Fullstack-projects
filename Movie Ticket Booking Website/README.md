# Full Stack Movie Ticket Booking Website

This is a comprehensive Movie Ticket Booking Application. It features a modern, premium **dark-themed glassmorphism** Customer Portal and an Admin Dashboard.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla, modular scripts, responsive styling, dynamic SVG/Canvas charts, and micro-animations).
- **Backend**: Django REST APIs.
- **Database**: Dual-mode MongoDB connection layer (`db.py`). If MongoDB is not active locally on port `27017`, it automatically falls back to a local JSON file-based database schema (`data/`) for local testing. It also seeds initial sample data automatically on startup.
- **Library Add-ons**: `reportlab` for dynamic PDF ticket exports, `jwt` for user session tokens, and `passlib` for password hashing.

---

## Folder Structure

```
├── backend/
│   ├── api/
│   │   ├── data/             # Seeding/Local fallback databases (JSON)
│   │   ├── auth.py           # Custom decorators, password hashing, JWT checks
│   │   ├── db.py             # Database connector and schema seeder
│   │   ├── views.py          # CRUD REST endpoints, PDF compilers, stats engines
│   │   └── urls.py           # API routes definitions
│   ├── movie_booking/        # Project settings configurations
│   ├── manage.py
│   └── test_api.py           # Automatic integration tests executor
├── frontend/
│   ├── css/
│   │   └── style.css         # UI design style sheets
│   ├── js/
│   │   ├── app.js            # Customer controller, API client requests helper
│   │   └── admin.js          # Admin actions controller, Chart.js visuals handler
│   ├── index.html            # Landing / Movie browse page
│   ├── login.html            # Sign-In / Register forms
│   ├── movie-details.html    # Movie page & trailer frames
│   ├── booking.html          # Interactive seat selector (120 seats)
│   ├── profile.html          # Profile settings, logs, PDF triggers
│   └── admin.html            # Administrative control center & statistics panel
└── README.md
```

---

## How to Run the Application

### Step 1: Start the Backend Server

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Start the Django development server:
   ```bash
   python manage.py runserver 8000
   ```
   *The console will print out: "Database: MongoDB not available. Initializing Local JSON Database." and automatically seed movies, shows, theatres, bookings, and user credentials.*

### Step 2: Open the Frontend Portal

1. Simply open `/frontend/index.html` in your browser (e.g. double click the file or run via Live Server).
2. Enjoy booking movies and managing configurations!

---

## Testing Accounts

The system is pre-populated with these testing accounts for validation:

| Account Type | Email | Password | Role |
|---|---|---|---|
| **Administrator** | `admin@movies.com` | `admin123` | `admin` |
| **Customer 1** | `rahul@gmail.com` | `rahul123` | `customer` |
| **Customer 2** | `priya@gmail.com` | `priya@gmail.com` (actually `priya123` based on seeding) | `customer` |

*You can also create new accounts directly on the registration page and set their role to Administrator to test the Admin portal immediately.*

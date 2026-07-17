# Taxi Booking Application (Major Project)

A complete, professional, and visually stunning Taxi Booking Web Application developed with a modern SaaS minimalist look. This platform supports customer logins, Leaflet.js interactive maps, billing/tax calculations with promo codes, driver dashboards, and administrative inventory management with real-time Chart.js analytics.

---

## 🎨 Project Visuals

### Hero Banner
![Hero Banner](readme/hero_taxi.png)

### Vehicle Fleet Options
| Hatchback | Sedan | SUV | Luxury |
| :---: | :---: | :---: | :---: |
| ![Hatchback](readme/hatchback.png) | ![Sedan](readme/sedan.png) | ![SUV](readme/suv.png) | ![Luxury](readme/luxury.png) |

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, CSS3 (SaaS Minimalist design), Javascript (ES6), Leaflet.js Maps, Chart.js.
* **Backend**: Python, Django REST Framework (Function-Based Views only).
* **Database**: MongoDB Atlas / local MongoDB (using PyMongo driver).
* **Resilience Fallback**: Automatically fallbacks to a thread-safe in-memory database simulation pre-populated with mock data if MongoDB is offline.

---

## 🌟 Key Features

### 1. Customer Console
* **Registration & Custom Profiles**: Saves gender, DOB, emergency contact info, and custom avatar pictures.
* **Interactive Booking Map**: Click coordinates on Leaflet map to set pickup/drop-off. Displays distance calculations and travel ETA.
* **Fare Breakdowns**: Dynamically calculates fare rates based on vehicle type, adds 8% GST, and handles promocodes (e.g. `NEW30` for 30% savings).
* **Checkout & Invoices**: Stripe-styled checkout with billing address validation, payment simulator, and print-ready PDF invoice receipt generation.

### 2. Driver Console
* **Availability Toggles**: Drivers can switch their status between `Available`, `Busy`, or `Offline`.
* **Rides Log**: Displays assigned active bookings and completed ride earnings charts.
* **Profile Settings**: Lets drivers edit their license numbers, expiry dates, experience, and vehicle plates.

### 3. Administrative Dashboard
* **SaaS Analytics**: Displays aggregate statistics (Total Revenue, Total Rides, Active Fleet, Average Driver Rating) and Chart.js graphs mapping bookings status and payment channels.
* **Full CRUD Management**: Search, filter, add, edit, and delete records for Customers, Drivers, Vehicles, Bookings, and Payments using dynamic modal forms.

---

## 🔑 Demo Credentials
* **Customer**: `john.doe@example.com` / `password123`
* **Driver**: `michael.s@taxi.com` / `driver123`
* **Admin**: `admin@taxi.com` / `admin123`

---

## 🚀 Running the Project Locally

### 1. Setup Environment
Ensure Python 3.10+ is installed. Navigate to the project backend:
```bash
cd "Backend"
pip install django djangorestframework pymongo dnspython python-dotenv
```

### 2. Database Connection
* **Standard Mode**: Export your MongoDB Atlas URI or run a local instance:
  ```powershell
  $env:MONGO_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/?retryWrites=true&w=majority"
  ```
  Seed the collections with default data:
  ```bash
  python seed.py
  ```
* **Offline Mock Mode**: If no database connection is configured, the server automatically boots with pre-populated in-memory datasets.

### 3. Start the Servers
Start the Django API backend (Port 8000):
```bash
python manage.py runserver
```
Start the Frontend server (Port 3000):
```bash
python -m http.server 3000 --directory ../Frontend
```

Open your browser and navigate to **`http://localhost:3000/`** to begin testing!

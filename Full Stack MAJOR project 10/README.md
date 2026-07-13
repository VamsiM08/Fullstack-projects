# Hospital Management System

A digital healthcare management portal designed to streamline patient records, doctor allocations, appointment booking, medical histories, and billing operations.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6), Fetch API
- **Backend**: Django (Function-Based Views, REST APIs)
- **Database**: SQLite (handled via raw queries in `Backend/db.py` to keep database operations lightweight, migration-free, and cross-platform)

---

## Folder Structure
```text
HospitalManagementSystem/
├── manage.py                # Django command-line utility
├── db.sqlite3               # SQLite Database file
├── Backend/                 # Django App Folder
│   ├── db.py                # Database schemas & direct connection helpers
│   ├── settings.py          # Django server configurations
│   ├── urls.py              # API endpoint routings
│   └── views.py             # REST API business logic
└── Frontend/                # User Interface Assets
    ├── index.html           # Homepage
    ├── patients.html        # Patient Directory & Registration
    ├── doctors.html         # Doctor Directory Grid
    ├── appointments.html    # Appointment Scheduler
    ├── records.html         # Diagnoses & Medical History
    ├── billing.html         # Billing Generator & Print Invoice preview
    ├── dashboard.html       # Admin Panel & KPI charts (Chart.js)
    ├── style.css            # Custom CSS Stylesheet
    └── script.js            # Fetch calls & DOM event controllers
```

---

## Getting Started

### 1. Prerequisite
Ensure Python 3.8+ is installed on your system.

### 2. Startup Django REST API Backend
Open your terminal (Command Prompt, PowerShell, or bash), navigate to the project directory, and start the development server:
```bash
cd HospitalManagementSystem
python manage.py runserver
```
The backend server will spin up on: `http://127.0.0.1:8000/`

*Note: The SQLite database initializes and seeds itself automatically with test records on the first request or server startup.*

### 3. Open the Frontend Application
Double-click `index.html` or any html file in the `Frontend/` folder, or serve it using an extension like **Live Server** in VS Code.

---

## Core Operations

### Module 1: Patient Management
- **Add Patient**: Register new patient files using the form.
- **View/Search Directory**: View all records, edit fields via the inline modals, or remove patient entries.

### Module 2: Doctor Management
- **Add Doctor Profile**: Register doctor details (experience, specialized department, consultation fee, and phone number).
- **View Doctor Profiles**: Displayed in dynamic profiles featuring custom avatars and quick management buttons.

### Module 3: Appointment Management
- **Book Appointment**: Choose from patients and doctors dropdown lists (loaded dynamically from active database registries), select dates, and times.
- **Quick Status Changer**: Mark appointments as `Completed` or `Cancelled` directly in the list.

### Module 4: Medical Record Management
- **Add Medical Record**: Link diagnoses, prescriptions, and treatment plans to patient entries.
- **View History Directory**: Full database history table with editing capabilities.

### Module 5: Billing & Payments
- **Auto-Fee Population**: Selecting a patient automatically looks up if they have an appointment and queries that doctor's consultation fee to populate the field.
- **Live Fee Calculator**: Sums consultation, medicine, and laboratory charges to output a live estimated total.
- **Printable Invoices**: Click **Print** to open the itemized invoice modal. Clicking **Print Invoice** invokes the browser print view, styled specifically for paper layout (hiding navigation headers and buttons automatically).

### Module 6: Admin Dashboard
- Displays count metrics for Total Patients, Total Doctors, and Medical Records.
- Automatically calculates today's active appointments.
- Integrates Chart.js to render doughnut charts representing appointment status ratios and billing payment summary ratios (Paid vs. Pending).

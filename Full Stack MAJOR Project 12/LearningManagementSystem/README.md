# Learning Management System (LMS) - Aura Academy

Aura Academy is a full-featured, high-fidelity Learning Management System (LMS) built to manage students, instructors, courses, lessons, assignments, and certifications. 

It features a responsive, premium glassmorphic frontend utilizing modern CSS, vanilla JavaScript, and the Fetch API, integrated with a secure Django REST API backend backed by SQLite.

---

## Folder Structure

```
LearningManagementSystem/
│
├── Backend/
│     db.py          # Database Schema (Django ORM Models)
│     models.py      # App Models registrars (imports from db.py)
│     views.py       # Function-Based REST API Views (20 APIs + Auth helper)
│     urls.py        # Django URL Routing
│     settings.py    # Django CORS, middleware and DRF configuration
│     manage.py      # Django CLI management entrypoint
│
└── Frontend/
      index.html     # Academy landing homepage
      login.html     # Roles login page (Student and Admin)
      register.html  # Student registration form page
      courses.html   # Course browser (with Search and Filter)
      enrollments.html # Student enrolled courses, Pay fees, and Certificate portal
      assignments.html # Students tasks, submissions workspace
      dashboard.html # Profile progress console (Visual indicators)
      admin.html     # Administrative CRUD console (Control Panel for all models)
      style.css      # Custom premium stylesheet (Glassmorphic dark design)
      script.js      # Global JS (Router, API Fetch layer, PDF generator)
```

---

## Features Implemented

### Core Modules
1. **Student Management**: Student Registration (`/students/add/`), updates, profiles, and listing.
2. **Instructor Management**: Instructor profiling and specializing fields management.
3. **Course Management**: Course additions, duration, pricing, levels, and assignment tracking.
4. **Enrollment Management**: Enrolling students into courses, managing Payment status (`Paid`/`Pending`) and Course status (`Active`/`Completed`/`Cancelled`).
5. **Assignment Management**: Managing tasks assigned by instructors to students, status tracking (`Pending`/`Submitted`/`Evaluated`), and grading marks.

### 5 Bonus Features (20/20 Marks)
1. **Course Search & Filter**: Real-time text searching (filters by course or instructor name) and dropdown filters (category and levels: Beginner, Intermediate, Advanced) on the Courses page.
2. **Student Progress Bar**: Dynamic visual progress bars depicting progress on the Dashboard and Enrollments pages.
3. **Certificate Generation (PDF)**: High-quality certificate PDF downloadable directly from the browser for completed courses, built using the `jsPDF` client-side renderer.
4. **Responsive Mobile Dashboard**: Fully optimized CSS grid and flex rules ensuring responsiveness on mobile viewports.
5. **Course Completion Percentage**: Automatically calculates a student's completion percentage (0% - 100%) dynamically based on the ratio of completed/graded assignments.

---

## Getting Started

### 1. Set Up and Run Backend APIs
Ensure Python 3 is installed. Navigate to the `Backend` directory and execute:

```bash
# Install Django and dependencies
pip install django djangorestframework django-cors-headers

# Initialize database schemas
python manage.py makemigrations Backend
python manage.py migrate

# Start the Django API server
python manage.py runserver 8000
```
*Note: The server will automatically seed itself with the expected sample testing data (Student, Instructor, Course, Enrollment, Assignment) upon its first launch.*

### 2. Set Up and Run Frontend
To run the frontend, open `Frontend/index.html` directly in any web browser, or launch a quick HTTP server in the `Frontend` directory:

```bash
python -m http.server 5500
```
Open `http://localhost:5500/index.html` in your browser.

---

## Administrative Credentials
To access the Admin Panel, sign in as:
- **Email**: `admin@lms.com`
- **Password**: `admin123`

To access the Student Portal, sign in as:
- **Email**: `rahul@gmail.com`
- **Password**: `rahul123`

# Job Portal Application (Full-Stack Django & JS)

A feature-rich Job Portal Application connecting job seekers, employers, and administrators. 

- **Frontend**: HTML5, CSS3, ES6 JavaScript, and Fetch API (Premium Indigo/Violet theme with Light/Dark Mode toggle).
- **Backend**: Django (Function-Based Views, REST APIs).
- **Database**: SQLite (self-contained, auto-initializing database wrapper in `db.py`).

---

## Folder Structure

```text
JobPortal/
│
├── Backend/
│   ├── db.py               # SQLite initialization, sample data seeding & CRUD operations
│   ├── views.py            # 20 Function-Based REST API endpoints with CORS
│   ├── urls.py             # URL patterns for REST API routing
│   ├── settings.py         # Django configuration & custom CORS middleware
│   ├── manage.py           # Django execution wrapper
│   └── verify_apis.py      # Automated Python script to test all 20 API endpoints
│
└── Frontend/
    ├── index.html          # Landing home page
    ├── login.html          # Candidate & Employer tabbed login
    ├── register.html       # Candidate & Employer tabbed registration
    ├── jobs.html           # Job search engine with advanced search filters
    ├── applications.html   # Applied jobs list & status tracker
    ├── interviews.html     # Interview slots list for candidates & employers
    ├── candidate_dashboard.html # Candidate profile details, statistics & recent logs
    ├── employer_dashboard.html  # Job publisher, screen applications, schedule interviews
    ├── admin_dashboard.html     # Control console for complete CRUD management
    ├── style.css           # Premium glassmorphism design stylesheet
    └── script.js           # Fetch API hooks, local authentication & DOM renderers
```

---

## Getting Started

### 1. Start the Django Backend Server
From the project root directory, navigate to `JobPortal/Backend` and start the Django development server:
```bash
cd JobPortal/Backend
python manage.py runserver
```
*Note: The database file `db.sqlite3` will be created automatically on startup and seeded with default sample data for candidates, employers, jobs, applications, and interviews.*

### 2. Launch the Frontend
Simply open `JobPortal/Frontend/index.html` directly in any web browser (Chrome, Edge, Firefox, Safari) or serve it locally using a simple HTTP server:
```bash
cd JobPortal/Frontend
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your browser.

---

## Logins & Testing Credentials

Use the following default accounts to explore dashboard actions:

| User Type | Email Address | Password / Action | Description |
| :--- | :--- | :--- | :--- |
| **Candidate** | `rahul@gmail.com` | `rahul123` | Pre-seeded with a profile, 1 application, and 1 scheduled interview. |
| **Employer** | `hr@infosys.com` | *No password required* | Pre-seeded as Infosys. Can shortlist applicants, schedule interviews, and publish jobs. |
| **Admin** | `admin@jobportal.com` | `admin123` | Has full CRUD access to all tables (Add, Edit, Delete). |

---

## 20 API Endpoints Map

All APIs return and accept JSON payloads, configured with global CORS middleware.

### 1. Candidates Module
- **POST** `/candidates/add/` : Register a new candidate.
- **GET** `/candidates/` : Get all registered candidates.
- **PUT** `/candidates/update/<id>/` : Update candidate profile.
- **DELETE** `/candidates/delete/<id>/` : Delete a candidate record.

### 2. Employers Module
- **POST** `/employers/add/` : Register a company profile.
- **GET** `/employers/` : Get all registered companies.
- **PUT** `/employers/update/<id>/` : Update employer details.
- **DELETE** `/employers/delete/<id>/` : Delete an employer.

### 3. Job Management Module
- **POST** `/jobs/add/` : Publish a new job vacancy.
- **GET** `/jobs/` : Get all job postings.
- **PUT** `/jobs/update/<id>/` : Update a job posting.
- **DELETE** `/jobs/delete/<id>/` : Delete a job posting.

### 4. Job Applications Module
- **POST** `/applications/add/` : Apply for a job opening.
- **GET** `/applications/` : Get all job applications.
- **PUT** `/applications/update/<id>/` : Update application status (Shortlisted, Selected, Rejected).
- **DELETE** `/applications/delete/<id>/` : Delete an application.

### 5. Interview Management Module
- **POST** `/interviews/add/` : Schedule an interview slot.
- **GET** `/interviews/` : Get all scheduled interviews.
- **PUT** `/interviews/update/<id>/` : Update interview details or status (Scheduled, Completed, Selected, Rejected).
- **DELETE** `/interviews/delete/<id>/` : Cancel/delete an interview.

---

## Core & Bonus Features Implemented

1. **Auto-Initializing Schema & Seed Data**: The SQLite database requires no migration setup. It automatically builds the tables on server launch and seeds the sample testing data.
2. **Advanced Job Search Filters**: Filter job listings by keyword, company name, location, job type (Full Time, Part Time, Internship, Remote), and maximum experience required.
3. **Interactive Recruit Flow**: Employers can click "Shortlist" on incoming candidate applications. This unlocks the "Schedule Interview" modal. Creating an interview automatically updates the applicant's status to "Interview Scheduled".
4. **Complete Admin CRUD Console**: A unified admin console containing 5 sections to manage candidates, employers, jobs, applications, and interviews using custom modal forms.
5. **Resume Upload Simulation**: Prompts candidates for their resume file name during the application process, preserving it in the application table for download by employers.
6. **Dark/Light Theme Toggle**: An interactive toggle button on the navigation bar switches the entire styling palette instantly and saves the setting in `localStorage` for future sessions.

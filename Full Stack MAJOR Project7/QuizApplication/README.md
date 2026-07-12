# Online Quiz Management System (Q-Master)

A Full Stack Quiz Management application built using **Django REST APIs** on the backend and a premium **Glassmorphism Dark UI** on the frontend (HTML5, CSS3, ES6 JavaScript). The backend integrates with **SQLite** for storing and managing quizzes, questions, students, attempts, and results.

---

## Folder Structure

```
QuizApplication/
├── Backend/
│   ├── db.py          # SQLite database connection & CRUD methods
│   ├── settings.py    # Django CORS & static files configurations
│   ├── urls.py        # Django URL mapping (20 CRUD endpoints)
│   ├── views.py       # REST API handler views
│   └── manage.py      # Django manager utility
└── Frontend/
    ├── index.html     # Landing page (Featured quizzes grid)
    ├── login.html     # User login form
    ├── register.html  # Student registration form
    ├── dashboard.html # Student workspace (Available tests & history)
    ├── quiz.html      # Test attempt runner with active timer
    ├── result.html    # Result overview & progress gauge
    ├── style.css      # Custom stylesheet (Premium dark theme)
    └── script.js      # Fetch API operations & UI binding logic
```

---

## Technology Stack

* **Backend**: Django (Function-Based Views), python-sqlite3
* **Frontend**: HTML5, CSS3 (Vanilla Glassmorphism), JavaScript (Fetch API)
* **Database**: SQLite3

---

## Functional Modules & APIs (20 Endpoints)

### 1. Student Management
* `POST /students/add/` - Register a student
* `GET /students/` - Retrieve all students
* `PUT /students/update/<id>/` - Update student profile
* `DELETE /students/delete/<id>/` - Delete student profile

### 2. Quiz Management
* `POST /quizzes/add/` - Create a new quiz
* `GET /quizzes/` - List all quizzes
* `PUT /quizzes/update/<id>/` - Update quiz details
* `DELETE /quizzes/delete/<id>/` - Delete a quiz

### 3. Question Management
* `POST /questions/add/` - Add a quiz question
* `GET /questions/` - List all questions
* `PUT /questions/update/<id>/` - Modify a question
* `DELETE /questions/delete/<id>/` - Remove a question

### 4. Quiz Attempt Management
* `POST /attempts/add/` - Log a student's answer choice
* `GET /attempts/` - List all attempts
* `PUT /attempts/update/<id>/` - Modify attempt details
* `DELETE /attempts/delete/<id>/` - Remove attempt log

### 5. Result Management
* `POST /results/add/` - Log final quiz result score
* `GET /results/` - List all results
* `PUT /results/update/<id>/` - Modify result records
* `DELETE /results/delete/<id>/` - Remove a result record

---

## How to Run

1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
3. Open the application in your web browser:
   * **Main App**: [http://127.0.0.1:8000/static/index.html](http://127.0.0.1:8000/static/index.html)
   * **Login Portal**: [http://127.0.0.1:8000/static/login.html](http://127.0.0.1:8000/static/login.html)
   * **Admin Portal**: [http://127.0.0.1:8000/static/admin.html](http://127.0.0.1:8000/static/admin.html)

### Testing Accounts
* **Student**: Email: `rahul@gmail.com` | Password: `rahul123`
* **Admin**: Email: `admin@quiz.com` | Password: `admin123`

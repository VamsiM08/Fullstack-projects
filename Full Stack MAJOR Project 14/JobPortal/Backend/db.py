import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db.sqlite3')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Candidate Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS candidates (
        candidate_id INTEGER PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        qualification TEXT,
        skills TEXT,
        experience INTEGER,
        password TEXT NOT NULL
    )
    ''')

    # 2. Employer Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS employers (
        employer_id INTEGER PRIMARY KEY,
        company_name TEXT UNIQUE NOT NULL,
        hr_name TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        location TEXT,
        industry TEXT
    )
    ''')

    # 3. Job Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        job_id INTEGER PRIMARY KEY,
        job_title TEXT NOT NULL,
        company_name TEXT NOT NULL,
        location TEXT,
        job_type TEXT CHECK(job_type IN ('Full Time', 'Part Time', 'Internship', 'Remote')),
        experience_required INTEGER,
        salary REAL,
        last_date TEXT
    )
    ''')

    # 4. Job Application Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS applications (
        application_id INTEGER PRIMARY KEY,
        candidate_name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        job_title TEXT NOT NULL,
        applied_date TEXT NOT NULL,
        resume TEXT,
        application_status TEXT CHECK(application_status IN ('Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'))
    )
    ''')

    # 5. Interview Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interviews (
        interview_id INTEGER PRIMARY KEY,
        candidate_name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        interview_date TEXT NOT NULL,
        interview_time TEXT NOT NULL,
        interview_mode TEXT CHECK(interview_mode IN ('Online', 'Offline')),
        interview_status TEXT CHECK(interview_status IN ('Scheduled', 'Completed', 'Selected', 'Rejected'))
    )
    ''')

    conn.commit()

    # Seed Sample Data if tables are empty
    # Seed Candidates
    cursor.execute("SELECT COUNT(*) FROM candidates")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO candidates (candidate_id, full_name, email, phone, qualification, skills, experience, password)
        VALUES (101, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'B.Tech CSE', 'Python, Django, JavaScript', 2, 'rahul123')
        ''')
    
    # Seed Employers
    cursor.execute("SELECT COUNT(*) FROM employers")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO employers (employer_id, company_name, hr_name, email, phone, location, industry)
        VALUES (201, 'Infosys', 'Priya Reddy', 'hr@infosys.com', '9988776655', 'Bangalore', 'Information Technology')
        ''')

    # Seed Jobs
    cursor.execute("SELECT COUNT(*) FROM jobs")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO jobs (job_id, job_title, company_name, location, job_type, experience_required, salary, last_date)
        VALUES (301, 'Python Full Stack Developer', 'Infosys', 'Bangalore', 'Full Time', 2, 800000.0, '2026-08-15')
        ''')

    # Seed Applications
    cursor.execute("SELECT COUNT(*) FROM applications")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO applications (application_id, candidate_name, company_name, job_title, applied_date, resume, application_status)
        VALUES (401, 'Rahul Sharma', 'Infosys', 'Python Full Stack Developer', '2026-07-15', 'rahul_resume.pdf', 'Applied')
        ''')

    # Seed Interviews
    cursor.execute("SELECT COUNT(*) FROM interviews")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO interviews (interview_id, candidate_name, company_name, interview_date, interview_time, interview_mode, interview_status)
        VALUES (501, 'Rahul Sharma', 'Infosys', '2026-07-25', '10:30', 'Online', 'Scheduled')
        ''')

    conn.commit()
    conn.close()

# Initialize on import
init_db()

# --- Candidates CRUD ---
def add_candidate(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO candidates (candidate_id, full_name, email, phone, qualification, skills, experience, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('candidate_id'),
            data.get('full_name'),
            data.get('email'),
            data.get('phone'),
            data.get('qualification'),
            data.get('skills'),
            data.get('experience'),
            data.get('password')
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_candidates():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_candidate(candidate_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE candidate_id = ?", (candidate_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_candidate(candidate_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        UPDATE candidates
        SET full_name = ?, email = ?, phone = ?, qualification = ?, skills = ?, experience = ?, password = ?
        WHERE candidate_id = ?
        ''', (
            data.get('full_name'),
            data.get('email'),
            data.get('phone'),
            data.get('qualification'),
            data.get('skills'),
            data.get('experience'),
            data.get('password'),
            candidate_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_candidate(candidate_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM candidates WHERE candidate_id = ?", (candidate_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

# --- Employers CRUD ---
def add_employer(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO employers (employer_id, company_name, hr_name, email, phone, location, industry)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('employer_id'),
            data.get('company_name'),
            data.get('hr_name'),
            data.get('email'),
            data.get('phone'),
            data.get('location'),
            data.get('industry')
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_employers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employers")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_employer(employer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employers WHERE employer_id = ?", (employer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_employer(employer_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        UPDATE employers
        SET company_name = ?, hr_name = ?, email = ?, phone = ?, location = ?, industry = ?
        WHERE employer_id = ?
        ''', (
            data.get('company_name'),
            data.get('hr_name'),
            data.get('email'),
            data.get('phone'),
            data.get('location'),
            data.get('industry'),
            employer_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_employer(employer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM employers WHERE employer_id = ?", (employer_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

# --- Jobs CRUD ---
def add_job(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO jobs (job_id, job_title, company_name, location, job_type, experience_required, salary, last_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('job_id'),
            data.get('job_title'),
            data.get('company_name'),
            data.get('location'),
            data.get('job_type'),
            data.get('experience_required'),
            data.get('salary'),
            data.get('last_date')
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_jobs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_job(job_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_job(job_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        UPDATE jobs
        SET job_title = ?, company_name = ?, location = ?, job_type = ?, experience_required = ?, salary = ?, last_date = ?
        WHERE job_id = ?
        ''', (
            data.get('job_title'),
            data.get('company_name'),
            data.get('location'),
            data.get('job_type'),
            data.get('experience_required'),
            data.get('salary'),
            data.get('last_date'),
            job_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_job(job_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

# --- Applications CRUD ---
def add_application(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO applications (application_id, candidate_name, company_name, job_title, applied_date, resume, application_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('application_id'),
            data.get('candidate_name'),
            data.get('company_name'),
            data.get('job_title'),
            data.get('applied_date'),
            data.get('resume'),
            data.get('application_status', 'Applied')
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_applications():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_application(application_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE application_id = ?", (application_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_application(application_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        UPDATE applications
        SET candidate_name = ?, company_name = ?, job_title = ?, applied_date = ?, resume = ?, application_status = ?
        WHERE application_id = ?
        ''', (
            data.get('candidate_name'),
            data.get('company_name'),
            data.get('job_title'),
            data.get('applied_date'),
            data.get('resume'),
            data.get('application_status'),
            application_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_application(application_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM applications WHERE application_id = ?", (application_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

# --- Interviews CRUD ---
def add_interview(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO interviews (interview_id, candidate_name, company_name, interview_date, interview_time, interview_mode, interview_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('interview_id'),
            data.get('candidate_name'),
            data.get('company_name'),
            data.get('interview_date'),
            data.get('interview_time'),
            data.get('interview_mode'),
            data.get('interview_status', 'Scheduled')
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_interviews():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interviews")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_interview(interview_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM interviews WHERE interview_id = ?", (interview_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_interview(interview_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        UPDATE interviews
        SET candidate_name = ?, company_name = ?, interview_date = ?, interview_time = ?, interview_mode = ?, interview_status = ?
        WHERE interview_id = ?
        ''', (
            data.get('candidate_name'),
            data.get('company_name'),
            data.get('interview_date'),
            data.get('interview_time'),
            data.get('interview_mode'),
            data.get('interview_status'),
            interview_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_interview(interview_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM interviews WHERE interview_id = ?", (interview_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

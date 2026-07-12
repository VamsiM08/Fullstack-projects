import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'db.sqlite3'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Students table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        college TEXT NOT NULL,
        password TEXT NOT NULL
    )
    ''')
    
    # 2. Create Quizzes table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS quizzes (
        quiz_id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_title TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        total_marks INTEGER NOT NULL
    )
    ''')
    
    # 3. Create Questions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        question_id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_title TEXT NOT NULL,
        question TEXT NOT NULL,
        option1 TEXT NOT NULL,
        option2 TEXT NOT NULL,
        option3 TEXT NOT NULL,
        option4 TEXT NOT NULL,
        correct_answer TEXT NOT NULL
    )
    ''')
    
    # 4. Create Attempts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS attempts (
        attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        quiz_title TEXT NOT NULL,
        question TEXT NOT NULL,
        selected_answer TEXT NOT NULL,
        submission_time TEXT NOT NULL
    )
    ''')
    
    # 5. Create Results table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS results (
        result_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        quiz_title TEXT NOT NULL,
        total_marks INTEGER NOT NULL,
        obtained_marks INTEGER NOT NULL,
        percentage REAL NOT NULL,
        result_status TEXT NOT NULL
    )
    ''')
    
    # Seed Students
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO students (student_id, full_name, email, phone, college, password)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (101, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'ABC Engineering College', 'rahul123'))
        
    # Seed Quizzes
    cursor.execute("SELECT COUNT(*) FROM quizzes")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO quizzes (quiz_id, quiz_title, category, total_questions, duration, total_marks)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (201, 'JavaScript Basics', 'Programming', 10, 20, 100))
        
    # Seed Questions
    cursor.execute("SELECT COUNT(*) FROM questions")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO questions (question_id, quiz_title, question, option1, option2, option3, option4, correct_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (301, 'JavaScript Basics', 'Which keyword is used to declare a variable?', 'int', 'var', 'string', 'define', 'var'))
        
    # Seed Attempts
    cursor.execute("SELECT COUNT(*) FROM attempts")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO attempts (attempt_id, student_name, quiz_title, question, selected_answer, submission_time)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (401, 'Rahul Sharma', 'JavaScript Basics', 'Which keyword is used to declare a variable?', 'var', '2026-07-15 10:20:00'))
        
    # Seed Results
    cursor.execute("SELECT COUNT(*) FROM results")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO results (result_id, student_name, quiz_title, total_marks, obtained_marks, percentage, result_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (501, 'Rahul Sharma', 'JavaScript Basics', 100, 90, 90.0, 'Pass'))
        
    conn.commit()
    conn.close()

# Define Student CRUD functions
def add_student(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'student_id' in data and data['student_id'] is not None:
        cursor.execute('''
        INSERT INTO students (student_id, full_name, email, phone, college, password)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['student_id'], data['full_name'], data['email'], data['phone'], data['college'], data['password']))
        student_id = data['student_id']
    else:
        cursor.execute('''
        INSERT INTO students (full_name, email, phone, college, password)
        VALUES (?, ?, ?, ?, ?)
        ''', (data['full_name'], data['email'], data['phone'], data['college'], data['password']))
        student_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return student_id

def get_all_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_student_by_id(student_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE student_id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_student(student_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE students 
    SET full_name = ?, email = ?, phone = ?, college = ?, password = ?
    WHERE student_id = ?
    ''', (data['full_name'], data['email'], data['phone'], data['college'], data['password'], student_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def delete_student(student_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = ?", (student_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0


# Define Quiz CRUD functions
def add_quiz(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'quiz_id' in data and data['quiz_id'] is not None:
        cursor.execute('''
        INSERT INTO quizzes (quiz_id, quiz_title, category, total_questions, duration, total_marks)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['quiz_id'], data['quiz_title'], data['category'], data['total_questions'], data['duration'], data['total_marks']))
        quiz_id = data['quiz_id']
    else:
        cursor.execute('''
        INSERT INTO quizzes (quiz_title, category, total_questions, duration, total_marks)
        VALUES (?, ?, ?, ?, ?)
        ''', (data['quiz_title'], data['category'], data['total_questions'], data['duration'], data['total_marks']))
        quiz_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return quiz_id

def get_all_quizzes():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quizzes")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_quiz(quiz_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE quizzes 
    SET quiz_title = ?, category = ?, total_questions = ?, duration = ?, total_marks = ?
    WHERE quiz_id = ?
    ''', (data['quiz_title'], data['category'], data['total_questions'], data['duration'], data['total_marks'], quiz_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def delete_quiz(quiz_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quizzes WHERE quiz_id = ?", (quiz_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0


# Define Question CRUD functions
def add_question(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'question_id' in data and data['question_id'] is not None:
        cursor.execute('''
        INSERT INTO questions (question_id, quiz_title, question, option1, option2, option3, option4, correct_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data['question_id'], data['quiz_title'], data['question'], data['option1'], data['option2'], data['option3'], data['option4'], data['correct_answer']))
        question_id = data['question_id']
    else:
        cursor.execute('''
        INSERT INTO questions (quiz_title, question, option1, option2, option3, option4, correct_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['quiz_title'], data['question'], data['option1'], data['option2'], data['option3'], data['option4'], data['correct_answer']))
        question_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return question_id

def get_all_questions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_question(question_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE questions 
    SET quiz_title = ?, question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_answer = ?
    WHERE question_id = ?
    ''', (data['quiz_title'], data['question'], data['option1'], data['option2'], data['option3'], data['option4'], data['correct_answer'], question_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def delete_question(question_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE question_id = ?", (question_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0


# Define Attempt CRUD functions
def add_attempt(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'attempt_id' in data and data['attempt_id'] is not None:
        cursor.execute('''
        INSERT INTO attempts (attempt_id, student_name, quiz_title, question, selected_answer, submission_time)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['attempt_id'], data['student_name'], data['quiz_title'], data['question'], data['selected_answer'], data['submission_time']))
        attempt_id = data['attempt_id']
    else:
        cursor.execute('''
        INSERT INTO attempts (student_name, quiz_title, question, selected_answer, submission_time)
        VALUES (?, ?, ?, ?, ?)
        ''', (data['student_name'], data['quiz_title'], data['question'], data['selected_answer'], data['submission_time']))
        attempt_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return attempt_id

def get_all_attempts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attempts")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_attempt(attempt_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE attempts 
    SET student_name = ?, quiz_title = ?, question = ?, selected_answer = ?, submission_time = ?
    WHERE attempt_id = ?
    ''', (data['student_name'], data['quiz_title'], data['question'], data['selected_answer'], data['submission_time'], attempt_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def delete_attempt(attempt_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attempts WHERE attempt_id = ?", (attempt_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0


# Define Result CRUD functions
def add_result(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'result_id' in data and data['result_id'] is not None:
        cursor.execute('''
        INSERT INTO results (result_id, student_name, quiz_title, total_marks, obtained_marks, percentage, result_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['result_id'], data['student_name'], data['quiz_title'], data['total_marks'], data['obtained_marks'], data['percentage'], data['result_status']))
        result_id = data['result_id']
    else:
        cursor.execute('''
        INSERT INTO results (student_name, quiz_title, total_marks, obtained_marks, percentage, result_status)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['student_name'], data['quiz_title'], data['total_marks'], data['obtained_marks'], data['percentage'], data['result_status']))
        result_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return result_id

def get_all_results():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM results")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_result(result_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE results 
    SET student_name = ?, quiz_title = ?, total_marks = ?, obtained_marks = ?, percentage = ?, result_status = ?
    WHERE result_id = ?
    ''', (data['student_name'], data['quiz_title'], data['total_marks'], data['obtained_marks'], data['percentage'], data['result_status'], result_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

def delete_result(result_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM results WHERE result_id = ?", (result_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

# Run initialization
init_db()

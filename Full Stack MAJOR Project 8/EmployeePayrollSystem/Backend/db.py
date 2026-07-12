import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "db.sqlite3"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def query_db(query, args=(), one=False):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        rv = [dict(row) for row in cur.fetchall()]
        return (rv[0] if rv else None) if one else rv
    except Exception as e:
        print(f"Database Query Error: {e} | Query: {query} | Args: {args}")
        raise e
    finally:
        cur.close()
        conn.close()

def execute_db(query, args=()):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        conn.commit()
        last_id = cur.lastrowid
        return last_id
    except Exception as e:
        print(f"Database Execution Error: {e} | Query: {query} | Args: {args}")
        raise e
    finally:
        cur.close()
        conn.close()

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Employee Management table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS employees (
        employee_id INTEGER PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        department TEXT,
        designation TEXT,
        joining_date TEXT,
        salary REAL
    )
    """)
    
    # 2. Department Management table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id INTEGER PRIMARY KEY,
        department_name TEXT UNIQUE NOT NULL,
        manager_name TEXT,
        total_employees INTEGER DEFAULT 0,
        location TEXT
    )
    """)
    
    # 3. Attendance Management table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INTEGER PRIMARY KEY,
        employee_name TEXT NOT NULL,
        attendance_date TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        status TEXT NOT NULL
    )
    """)
    
    # 4. Payroll Management table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS payroll (
        payroll_id INTEGER PRIMARY KEY,
        employee_name TEXT NOT NULL,
        basic_salary REAL NOT NULL,
        bonus REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        net_salary REAL NOT NULL,
        payment_month TEXT NOT NULL
    )
    """)
    
    # 5. Salary Slip Management table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS payslips (
        payslip_id INTEGER PRIMARY KEY,
        employee_name TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        remarks TEXT
    )
    """)
    
    conn.commit()
    
    # Check if empty, then seed sample testing data
    cur.execute("SELECT COUNT(*) FROM employees")
    if cur.fetchone()[0] == 0:
        print("Seeding sample data into database...")
        # Employees
        cur.execute("""
        INSERT INTO employees (employee_id, full_name, email, phone, department, designation, joining_date, salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (101, "Rahul Sharma", "rahul@gmail.com", "9876543210", "Software Development", "Python Developer", "2026-01-15", 60000.0))
        
        cur.execute("""
        INSERT INTO employees (employee_id, full_name, email, phone, department, designation, joining_date, salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (102, "Anjali Verma", "anjali@gmail.com", "9876543211", "Software Development", "Manager", "2025-06-01", 90000.0))
        
        # Departments
        cur.execute("""
        INSERT INTO departments (department_id, department_name, manager_name, total_employees, location)
        VALUES (?, ?, ?, ?, ?)
        """, (201, "Software Development", "Anjali Verma", 15, "Bangalore"))

        cur.execute("""
        INSERT INTO departments (department_id, department_name, manager_name, total_employees, location)
        VALUES (?, ?, ?, ?, ?)
        """, (202, "Human Resources", "Sanjana Sen", 4, "Mumbai"))
        
        # Attendance
        cur.execute("""
        INSERT INTO attendance (attendance_id, employee_name, attendance_date, check_in, check_out, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (301, "Rahul Sharma", "2026-07-15", "09:00", "18:00", "Present"))
        
        # Payroll
        cur.execute("""
        INSERT INTO payroll (payroll_id, employee_name, basic_salary, bonus, deductions, net_salary, payment_month)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (401, "Rahul Sharma", 60000.0, 5000.0, 2000.0, 63000.0, "July 2026"))
        
        # Payslips
        cur.execute("""
        INSERT INTO payslips (payslip_id, employee_name, payment_date, payment_method, payment_status, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (501, "Rahul Sharma", "2026-07-31", "Bank Transfer", "Paid", "Salary credited successfully"))
        
        conn.commit()
        print("Database seeded successfully.")
        
    cur.close()
    conn.close()

# Auto-initialize database on import
init_db()

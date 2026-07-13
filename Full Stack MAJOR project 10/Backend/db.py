import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'db.sqlite3')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create Patients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            patient_id INTEGER PRIMARY KEY,
            patient_name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            email TEXT,
            blood_group TEXT,
            address TEXT
        )
    ''')

    # Create Doctors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id INTEGER PRIMARY KEY,
            doctor_name TEXT NOT NULL,
            specialization TEXT,
            department TEXT,
            experience INTEGER,
            phone TEXT,
            consultation_fee REAL
        )
    ''')

    # Create Appointments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            appointment_id INTEGER PRIMARY KEY,
            patient_name TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            appointment_status TEXT NOT NULL
        )
    ''')

    # Create Medical Records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS records (
            record_id INTEGER PRIMARY KEY,
            patient_name TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            diagnosis TEXT,
            prescription TEXT,
            treatment TEXT,
            visit_date TEXT NOT NULL
        )
    ''')

    # Create Bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bills (
            bill_id INTEGER PRIMARY KEY,
            patient_name TEXT NOT NULL,
            consultation_fee REAL NOT NULL,
            medicine_charge REAL DEFAULT 0.0,
            laboratory_charge REAL DEFAULT 0.0,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL
        )
    ''')

    conn.commit()

    # Seed sample data if empty
    # Check Patients
    cursor.execute("SELECT COUNT(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO patients (patient_id, patient_name, age, gender, phone, email, blood_group, address)
            VALUES (101, 'Rahul Sharma', 28, 'Male', '9876543210', 'rahul@gmail.com', 'O+', 'Hyderabad')
        ''')
    
    # Check Doctors
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO doctors (doctor_id, doctor_name, specialization, department, experience, phone, consultation_fee)
            VALUES (201, 'Dr. Priya Reddy', 'Cardiologist', 'Cardiology', 10, '9988776655', 800)
        ''')

    # Check Appointments
    cursor.execute("SELECT COUNT(*) FROM appointments")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO appointments (appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status)
            VALUES (301, 'Rahul Sharma', 'Dr. Priya Reddy', '2026-07-20', '10:30', 'Scheduled')
        ''')

    # Check Records
    cursor.execute("SELECT COUNT(*) FROM records")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO records (record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date)
            VALUES (401, 'Rahul Sharma', 'Dr. Priya Reddy', 'High Blood Pressure', 'Tablet A - Once Daily', 'Regular Monitoring', '2026-07-20')
        ''')

    # Check Bills
    cursor.execute("SELECT COUNT(*) FROM bills")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO bills (bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status)
            VALUES (501, 'Rahul Sharma', 800, 1200, 500, 2500, 'UPI', 'Paid')
        ''')

    conn.commit()
    conn.close()

# Helper for auto-generating IDs
def get_next_id(table_name, id_column, start_from):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT MAX({id_column}) FROM {table_name}")
    max_id = cursor.fetchone()[0]
    conn.close()
    if max_id is None:
        return start_from
    return max_id + 1

# --- PATIENT CRUD ---
def get_all_patients():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_patient_by_id(patient_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_patient(patient_id, name, age, gender, phone, email, blood_group, address):
    if not patient_id:
        patient_id = get_next_id('patients', 'patient_id', 101)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO patients (patient_id, patient_name, age, gender, phone, email, blood_group, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, name, age, gender, phone, email, blood_group, address))
    conn.commit()
    conn.close()
    return patient_id

def update_patient(patient_id, name, age, gender, phone, email, blood_group, address):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE patients
        SET patient_name = ?, age = ?, gender = ?, phone = ?, email = ?, blood_group = ?, address = ?
        WHERE patient_id = ?
    ''', (name, age, gender, phone, email, blood_group, address, patient_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_patient(patient_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM patients WHERE patient_id = ?", (patient_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

# --- DOCTOR CRUD ---
def get_all_doctors():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_doctor_by_id(doctor_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE doctor_id = ?", (doctor_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_doctor(doctor_id, name, specialization, department, experience, phone, consultation_fee):
    if not doctor_id:
        doctor_id = get_next_id('doctors', 'doctor_id', 201)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO doctors (doctor_id, doctor_name, specialization, department, experience, phone, consultation_fee)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (doctor_id, name, specialization, department, experience, phone, consultation_fee))
    conn.commit()
    conn.close()
    return doctor_id

def update_doctor(doctor_id, name, specialization, department, experience, phone, consultation_fee):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE doctors
        SET doctor_name = ?, specialization = ?, department = ?, experience = ?, phone = ?, consultation_fee = ?
        WHERE doctor_id = ?
    ''', (name, specialization, department, experience, phone, consultation_fee, doctor_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_doctor(doctor_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM doctors WHERE doctor_id = ?", (doctor_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

# --- APPOINTMENT CRUD ---
def get_all_appointments():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_appointment_by_id(appointment_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE appointment_id = ?", (appointment_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_appointment(appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status):
    if not appointment_id:
        appointment_id = get_next_id('appointments', 'appointment_id', 301)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO appointments (appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status))
    conn.commit()
    conn.close()
    return appointment_id

def update_appointment(appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE appointments
        SET patient_name = ?, doctor_name = ?, appointment_date = ?, appointment_time = ?, appointment_status = ?
        WHERE appointment_id = ?
    ''', (patient_name, doctor_name, appointment_date, appointment_time, appointment_status, appointment_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_appointment(appointment_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM appointments WHERE appointment_id = ?", (appointment_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

# --- MEDICAL RECORD CRUD ---
def get_all_records():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_record_by_id(record_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records WHERE record_id = ?", (record_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_record(record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date):
    if not record_id:
        record_id = get_next_id('records', 'record_id', 401)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO records (record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date))
    conn.commit()
    conn.close()
    return record_id

def update_record(record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE records
        SET patient_name = ?, doctor_name = ?, diagnosis = ?, prescription = ?, treatment = ?, visit_date = ?
        WHERE record_id = ?
    ''', (patient_name, doctor_name, diagnosis, prescription, treatment, visit_date, record_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_record(record_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM records WHERE record_id = ?", (record_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

# --- BILLING CRUD ---
def get_all_bills():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bills")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_bill_by_id(bill_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bills WHERE bill_id = ?", (bill_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_bill(bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status):
    if not bill_id:
        bill_id = get_next_id('bills', 'bill_id', 501)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO bills (bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status))
    conn.commit()
    conn.close()
    return bill_id

def update_bill(bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE bills
        SET patient_name = ?, consultation_fee = ?, medicine_charge = ?, laboratory_charge = ?, total_amount = ?, payment_method = ?, payment_status = ?
        WHERE bill_id = ?
    ''', (patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status, bill_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_bill(bill_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bills WHERE bill_id = ?", (bill_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

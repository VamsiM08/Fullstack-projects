import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expense_tracker.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        city TEXT
    )
    """)
    
    # 2. Income Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS income (
        income_id INTEGER PRIMARY KEY,
        user_name TEXT NOT NULL,
        source TEXT NOT NULL,
        amount REAL NOT NULL,
        received_date TEXT NOT NULL,
        description TEXT
    )
    """)
    
    # 3. Expense Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        expense_id INTEGER PRIMARY KEY,
        user_name TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        description TEXT
    )
    """)
    
    # 4. Category Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY,
        category_name TEXT UNIQUE NOT NULL,
        monthly_limit REAL NOT NULL,
        description TEXT
    )
    """)
    
    # 5. Budget Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        budget_id INTEGER PRIMARY KEY,
        user_name TEXT NOT NULL,
        month TEXT NOT NULL,
        total_income REAL NOT NULL,
        total_expense REAL NOT NULL,
        savings REAL NOT NULL,
        budget_status TEXT NOT NULL,
        UNIQUE(user_name, month)
    )
    """)
    
    # Insert default categories if none exist
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        default_categories = [
            (401, "Food", 8000.0, "Daily meals and dining"),
            (402, "Travel", 5000.0, "Commuting and trips"),
            (403, "Shopping", 10000.0, "Clothes, gadgets, and personal items"),
            (404, "Rent", 20000.0, "Monthly house rent"),
            (405, "Utilities", 4000.0, "Electricity, water, internet bills"),
            (406, "Entertainment", 3000.0, "Movies, games, and events")
        ]
        cursor.executemany(
            "INSERT INTO categories (category_id, category_name, monthly_limit, description) VALUES (?, ?, ?, ?)",
            default_categories
        )
        
    conn.commit()
    conn.close()

# Initialize tables when the module is imported or database is loaded
create_tables()

# ==========================================
# USER CRUD
# ==========================================

def add_user(user_id, full_name, email, phone, password, city):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id:
            cursor.execute(
                "INSERT INTO users (user_id, full_name, email, phone, password, city) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, full_name, email, phone, password, city)
            )
        else:
            cursor.execute(
                "INSERT INTO users (full_name, email, phone, password, city) VALUES (?, ?, ?, ?, ?)",
                (full_name, email, phone, password, city)
            )
        conn.commit()
        inserted_id = user_id if user_id else cursor.lastrowid
        return get_user_by_id(inserted_id)
    finally:
        conn.close()

def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_user(user_id, full_name, email, phone, password, city):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE users
            SET full_name = ?, email = ?, phone = ?, password = ?, city = ?
            WHERE user_id = ?
        """, (full_name, email, phone, password, city, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ==========================================
# INCOME CRUD
# ==========================================

def add_income(income_id, user_name, source, amount, received_date, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if income_id:
            cursor.execute("""
                INSERT INTO income (income_id, user_name, source, amount, received_date, description)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (income_id, user_name, source, amount, received_date, description))
        else:
            cursor.execute("""
                INSERT INTO income (user_name, source, amount, received_date, description)
                VALUES (?, ?, ?, ?, ?)
            """, (user_name, source, amount, received_date, description))
        conn.commit()
        inserted_id = income_id if income_id else cursor.lastrowid
        return get_income_by_id(inserted_id)
    finally:
        conn.close()

def get_incomes(user_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_name:
        cursor.execute("SELECT * FROM income WHERE user_name = ? ORDER BY received_date DESC", (user_name,))
    else:
        cursor.execute("SELECT * FROM income ORDER BY received_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_income_by_id(income_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM income WHERE income_id = ?", (income_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_income(income_id, user_name, source, amount, received_date, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE income
            SET user_name = ?, source = ?, amount = ?, received_date = ?, description = ?
            WHERE income_id = ?
        """, (user_name, source, amount, received_date, description, income_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_income(income_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM income WHERE income_id = ?", (income_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ==========================================
# EXPENSE CRUD
# ==========================================

def add_expense(expense_id, user_name, category, amount, expense_date, payment_method, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if expense_id:
            cursor.execute("""
                INSERT INTO expenses (expense_id, user_name, category, amount, expense_date, payment_method, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (expense_id, user_name, category, amount, expense_date, payment_method, description))
        else:
            cursor.execute("""
                INSERT INTO expenses (user_name, category, amount, expense_date, payment_method, description)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_name, category, amount, expense_date, payment_method, description))
        conn.commit()
        inserted_id = expense_id if expense_id else cursor.lastrowid
        return get_expense_by_id(inserted_id)
    finally:
        conn.close()

def get_expenses(user_name=None, category=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_name and category:
        cursor.execute("SELECT * FROM expenses WHERE user_name = ? AND category = ? ORDER BY expense_date DESC", (user_name, category))
    elif user_name:
        cursor.execute("SELECT * FROM expenses WHERE user_name = ? ORDER BY expense_date DESC", (user_name,))
    elif category:
        cursor.execute("SELECT * FROM expenses WHERE category = ? ORDER BY expense_date DESC", (category,))
    else:
        cursor.execute("SELECT * FROM expenses ORDER BY expense_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_expense_by_id(expense_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE expense_id = ?", (expense_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_expense(expense_id, user_name, category, amount, expense_date, payment_method, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE expenses
            SET user_name = ?, category = ?, amount = ?, expense_date = ?, payment_method = ?, description = ?
            WHERE expense_id = ?
        """, (user_name, category, amount, expense_date, payment_method, description, expense_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_expense(expense_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM expenses WHERE expense_id = ?", (expense_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ==========================================
# CATEGORY CRUD
# ==========================================

def add_category(category_id, category_name, monthly_limit, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if category_id:
            cursor.execute("""
                INSERT INTO categories (category_id, category_name, monthly_limit, description)
                VALUES (?, ?, ?, ?)
            """, (category_id, category_name, monthly_limit, description))
        else:
            cursor.execute("""
                INSERT INTO categories (category_name, monthly_limit, description)
                VALUES (?, ?, ?)
            """, (category_name, monthly_limit, description))
        conn.commit()
        inserted_id = category_id if category_id else cursor.lastrowid
        return get_category_by_id(inserted_id)
    finally:
        conn.close()

def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY category_name")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_category_by_id(category_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE category_id = ?", (category_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_category(category_id, category_name, monthly_limit, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE categories
            SET category_name = ?, monthly_limit = ?, description = ?
            WHERE category_id = ?
        """, (category_name, monthly_limit, description, category_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_category(category_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM categories WHERE category_id = ?", (category_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ==========================================
# BUDGET CRUD
# ==========================================

def add_budget(budget_id, user_name, month, total_income, total_expense, savings, budget_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if budget_id:
            cursor.execute("""
                INSERT INTO budgets (budget_id, user_name, month, total_income, total_expense, savings, budget_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (budget_id, user_name, month, total_income, total_expense, savings, budget_status))
        else:
            cursor.execute("""
                INSERT INTO budgets (user_name, month, total_income, total_expense, savings, budget_status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_name, month, total_income, total_expense, savings, budget_status))
        conn.commit()
        inserted_id = budget_id if budget_id else cursor.lastrowid
        return get_budget_by_id(inserted_id)
    finally:
        conn.close()

def get_budgets(user_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_name:
        cursor.execute("SELECT * FROM budgets WHERE user_name = ? ORDER BY month DESC", (user_name,))
    else:
        cursor.execute("SELECT * FROM budgets ORDER BY month DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_budget_by_id(budget_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM budgets WHERE budget_id = ?", (budget_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_budget(budget_id, user_name, month, total_income, total_expense, savings, budget_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE budgets
            SET user_name = ?, month = ?, total_income = ?, total_expense = ?, savings = ?, budget_status = ?
            WHERE budget_id = ?
        """, (user_name, month, total_income, total_expense, savings, budget_status, budget_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_budget(budget_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM budgets WHERE budget_id = ?", (budget_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db.sqlite3"

def get_db_connection():
    """Returns a connection to the SQLite database with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetch_one=False, fetch_all=False, commit=False):
    """Utility function to execute SQL queries on the database directly."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    
    result = None
    if commit:
        conn.commit()
    if fetch_one:
        row = cursor.fetchone()
        result = dict(row) if row else None
    elif fetch_all:
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        
    conn.close()
    return result

import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'db.sqlite3'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            profile_image TEXT
        )
    ''')
    
    # Create Chats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            message TEXT NOT NULL,
            sent_at TEXT NOT NULL
        )
    ''')
    
    # Check if empty and pre-populate sample testing data
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        # Prepopulate users
        sample_users = [
            (101, "Rahul Sharma", "rahul", "rahul@gmail.com", "rahul123", "profile.png"),
            (102, "Sneha Kapoor", "sneha", "sneha@gmail.com", "sneha123", "avatar2.png"),
            (103, "Kiran Patel", "kiran", "kiran@gmail.com", "kiran123", "avatar3.png"),
            (104, "Arjun Singh", "arjun", "arjun@gmail.com", "arjun123", "avatar4.png")
        ]
        cursor.executemany('''
            INSERT INTO users (user_id, full_name, username, email, password, profile_image)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', sample_users)
        
        # Prepopulate chats
        sample_chats = [
            (1, "rahul", "sneha", "Hello Sneha!", "2026-07-10 10:30:00"),
            (2, "sneha", "rahul", "Hi Rahul!", "2026-07-10 10:31:00"),
            (3, "rahul", "sneha", "How are you doing?", "2026-07-10 10:32:00"),
            (4, "sneha", "rahul", "I'm doing well, thank you! How are you?", "2026-07-10 10:33:00")
        ]
        cursor.executemany('''
            INSERT INTO chats (chat_id, sender, receiver, message, sent_at)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_chats)
        
    conn.commit()
    conn.close()

def get_all_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

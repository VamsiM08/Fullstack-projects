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
    
    # 1. Customer table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL
    )
    ''')
    
    # 2. Restaurant table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS restaurants (
        restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_name TEXT UNIQUE NOT NULL,
        owner_name TEXT NOT NULL,
        location TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        rating REAL NOT NULL
    )
    ''')
    
    # 3. Food Menu table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS foods (
        food_id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_name TEXT NOT NULL,
        food_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        availability TEXT NOT NULL
    )
    ''')
    
    # 4. Cart table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cart (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        food_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total_price REAL NOT NULL
    )
    ''')
    
    # 5. Order table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        restaurant_name TEXT NOT NULL,
        order_items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT NOT NULL,
        delivery_status TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

def seed_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Seed Customers (starting at 101)
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        customers_data = [
            (101, "Rahul Sharma", "rahul@gmail.com", "9876543210", "KPHB Colony", "Hyderabad"),
            (102, "Priya Patel", "priya@gmail.com", "9876543211", "Gachibowli", "Hyderabad"),
            (103, "Amit Kumar", "amit@gmail.com", "9876543212", "Salt Lake", "Kolkata")
        ]
        cursor.executemany("""
        INSERT INTO customers (customer_id, full_name, email, phone, address, city)
        VALUES (?, ?, ?, ?, ?, ?)
        """, customers_data)
        
        # Reset sqlite sequence so next autoincrement starts after 103
        cursor.execute("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('customers', 103)")
        print("Database: Seeded customers.")

    # Seed Restaurants (starting at 201)
    cursor.execute("SELECT COUNT(*) FROM restaurants")
    if cursor.fetchone()[0] == 0:
        restaurants_data = [
            (201, "Spicy Kitchen", "Kiran Kumar", "Hyderabad", "South Indian", 4.6),
            (202, "Burger Palace", "Vikram Rathore", "Mumbai", "Fast Food", 4.2),
            (203, "Bella Italia", "Neha Sharma", "Delhi", "Italian", 4.8),
            (204, "Wok Express", "Tony Chang", "Bangalore", "Asian", 4.4)
        ]
        cursor.executemany("""
        INSERT INTO restaurants (restaurant_id, restaurant_name, owner_name, location, cuisine, rating)
        VALUES (?, ?, ?, ?, ?, ?)
        """, restaurants_data)
        cursor.execute("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('restaurants', 204)")
        print("Database: Seeded restaurants.")

    # Seed Foods (starting at 301)
    cursor.execute("SELECT COUNT(*) FROM foods")
    if cursor.fetchone()[0] == 0:
        foods_data = [
            (301, "Spicy Kitchen", "Chicken Biryani", "Main Course", 299.00, "Available"),
            (302, "Spicy Kitchen", "Masala Dosa", "Breakfast", 99.00, "Available"),
            (303, "Spicy Kitchen", "Idli Sambar", "Breakfast", 79.00, "Available"),
            (304, "Burger Palace", "Cheese Burger", "Fast Food", 149.00, "Available"),
            (305, "Burger Palace", "Crispy Chicken Wings", "Starters", 199.00, "Available"),
            (306, "Burger Palace", "Veg Burger", "Fast Food", 119.00, "Out of Stock"),
            (307, "Bella Italia", "Margherita Pizza", "Main Course", 399.00, "Available"),
            (308, "Bella Italia", "Pasta Carbonara", "Main Course", 349.00, "Available"),
            (309, "Bella Italia", "Garlic Bread", "Starters", 129.00, "Available"),
            (310, "Wok Express", "Veg Hakka Noodles", "Main Course", 189.00, "Available"),
            (311, "Wok Express", "Chicken Momos", "Starters", 159.00, "Available")
        ]
        cursor.executemany("""
        INSERT INTO foods (food_id, restaurant_name, food_name, category, price, availability)
        VALUES (?, ?, ?, ?, ?, ?)
        """, foods_data)
        cursor.execute("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('foods', 311)")
        print("Database: Seeded food menu.")

    # Seed Cart (starting at 401)
    cursor.execute("SELECT COUNT(*) FROM cart")
    if cursor.fetchone()[0] == 0:
        cart_data = [
            (401, "Rahul Sharma", "Chicken Biryani", 2, 299.00, 598.00),
            (402, "Rahul Sharma", "Masala Dosa", 1, 99.00, 99.00)
        ]
        cursor.executemany("""
        INSERT INTO cart (cart_id, customer_name, food_name, quantity, price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
        """, cart_data)
        cursor.execute("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('cart', 402)")
        print("Database: Seeded cart items.")

    # Seed Orders (starting at 501)
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        orders_data = [
            (501, "Rahul Sharma", "Spicy Kitchen", "Chicken Biryani x2", 598.00, "Paid", "Preparing"),
            (502, "Priya Patel", "Bella Italia", "Margherita Pizza x1, Garlic Bread x1", 528.00, "Paid", "Out for Delivery"),
            (503, "Rahul Sharma", "Burger Palace", "Cheese Burger x2", 298.00, "Paid", "Delivered")
        ]
        cursor.executemany("""
        INSERT INTO orders (order_id, customer_name, restaurant_name, order_items, total_amount, payment_status, delivery_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, orders_data)
        cursor.execute("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('orders', 503)")
        print("Database: Seeded orders.")

    conn.commit()
    conn.close()

# Auto initialize database on import
init_db()
seed_db()

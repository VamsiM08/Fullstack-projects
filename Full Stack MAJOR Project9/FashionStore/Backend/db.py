import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'fashion_store.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Customers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        password TEXT NOT NULL
    )
    """)
    
    # 2. Categories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL
    )
    """)
    
    # 3. Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        image_url TEXT NOT NULL
    )
    """)
    
    # 4. Cart Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total_price REAL NOT NULL
    )
    """)
    
    # 5. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        order_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        delivery_status TEXT NOT NULL
    )
    """)
    
    conn.commit()
    
    # Seed Sample Data if tables are empty
    # Check Customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO customers (customer_id, full_name, email, phone, address, city, password)
        VALUES (101, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'KPHB Colony', 'Hyderabad', 'password123')
        """)
        cursor.execute("""
        INSERT INTO customers (customer_id, full_name, email, phone, address, city, password)
        VALUES (102, 'Admin User', 'admin@gmail.com', '9999999999', 'Headquarters', 'Delhi', 'admin123')
        """)
    
    # Check Categories
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO categories (category_id, category_name, description)
        VALUES (201, 'Men''s Clothing', 'Shirts, T-Shirts, Jeans, Jackets')
        """)
        cursor.execute("""
        INSERT INTO categories (category_id, category_name, description)
        VALUES (202, 'Women''s Clothing', 'Dresses, Tops, Skirts, Ethnic Wear')
        """)
        cursor.execute("""
        INSERT INTO categories (category_id, category_name, description)
        VALUES (203, 'Accessories', 'Watches, Bags, Sunglasses, Belts')
        """)
        cursor.execute("""
        INSERT INTO categories (category_id, category_name, description)
        VALUES (204, 'Footwear', 'Sneakers, Boots, Sandals, Shoes')
        """)

    # Check Products
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO products (product_id, product_name, category, brand, size, color, price, stock, image_url)
        VALUES (301, 'Slim Fit Denim Jacket', 'Men''s Clothing', 'Levi''s', 'L', 'Blue', 2499, 25, 'jacket.jpg')
        """)
        cursor.execute("""
        INSERT INTO products (product_id, product_name, category, brand, size, color, price, stock, image_url)
        VALUES (302, 'Classic White Sneakers', 'Footwear', 'Nike', '10', 'White', 4999, 15, 'sneakers.jpg')
        """)
        cursor.execute("""
        INSERT INTO products (product_id, product_name, category, brand, size, color, price, stock, image_url)
        VALUES (303, 'Floral Summer Dress', 'Women''s Clothing', 'Zara', 'M', 'Yellow', 3499, 20, 'dress.jpg')
        """)
        cursor.execute("""
        INSERT INTO products (product_id, product_name, category, brand, size, color, price, stock, image_url)
        VALUES (304, 'Leather Chronograph Watch', 'Accessories', 'Fossil', 'One Size', 'Brown', 8999, 10, 'watch.jpg')
        """)
        cursor.execute("""
        INSERT INTO products (product_id, product_name, category, brand, size, color, price, stock, image_url)
        VALUES (305, 'Oversized Cotton Hoodie', 'Men''s Clothing', 'H&M', 'XL', 'Black', 1999, 30, 'hoodie.jpg')
        """)

    # Check Cart
    cursor.execute("SELECT COUNT(*) FROM cart")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO cart (cart_id, customer_name, product_name, quantity, price, total_price)
        VALUES (401, 'Rahul Sharma', 'Slim Fit Denim Jacket', 2, 2499, 4998)
        """)

    # Check Orders
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO orders (order_id, customer_name, order_date, total_amount, payment_method, payment_status, delivery_status)
        VALUES (501, 'Rahul Sharma', '2026-07-15', 4998, 'UPI', 'Paid', 'Processing')
        """)

    conn.commit()
    conn.close()

# Initialize DB on import
init_db()

# --- Customer CRUD Functions ---
def add_customer(full_name, email, phone, address, city, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO customers (full_name, email, phone, address, city, password)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (full_name, email, phone, address, city, password))
        conn.commit()
        customer_id = cursor.lastrowid
        return customer_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT customer_id, full_name, email, phone, address, city FROM customers")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT customer_id, full_name, email, phone, address, city FROM customers WHERE customer_id = ?", (customer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_customer_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_customer(customer_id, full_name, email, phone, address, city, password=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if password:
        cursor.execute("""
        UPDATE customers
        SET full_name = ?, email = ?, phone = ?, address = ?, city = ?, password = ?
        WHERE customer_id = ?
        """, (full_name, email, phone, address, city, password, customer_id))
    else:
        cursor.execute("""
        UPDATE customers
        SET full_name = ?, email = ?, phone = ?, address = ?, city = ?
        WHERE customer_id = ?
        """, (full_name, email, phone, address, city, customer_id))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def delete_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customers WHERE customer_id = ?", (customer_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

# --- Category CRUD Functions ---
def add_category(category_name, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO categories (category_name, description)
        VALUES (?, ?)
        """, (category_name, description))
        conn.commit()
        category_id = cursor.lastrowid
        return category_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_category(category_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE category_id = ?", (category_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_category(category_id, category_name, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE categories
        SET category_name = ?, description = ?
        WHERE category_id = ?
        """, (category_name, description, category_id))
        conn.commit()
        changes = conn.total_changes
        return changes > 0
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def delete_category(category_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE category_id = ?", (category_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

# --- Product CRUD Functions ---
def add_product(product_name, category, brand, size, color, price, stock, image_url):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO products (product_name, category, brand, size, color, price, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (product_name, category, brand, size, color, price, stock, image_url))
    conn.commit()
    product_id = cursor.lastrowid
    conn.close()
    return product_id

def get_products(category=None, search=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
        
    if search:
        query += " AND (product_name LIKE ? OR brand LIKE ? OR color LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param])
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE product_id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_product(product_id, product_name, category, brand, size, color, price, stock, image_url):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE products
    SET product_name = ?, category = ?, brand = ?, size = ?, color = ?, price = ?, stock = ?, image_url = ?
    WHERE product_id = ?
    """, (product_name, category, brand, size, color, price, stock, image_url, product_id))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE product_id = ?", (product_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

# --- Cart CRUD Functions ---
def add_cart_item(customer_name, product_name, quantity, price, total_price):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if this customer already has this product in cart
    cursor.execute("SELECT cart_id, quantity FROM cart WHERE customer_name = ? AND product_name = ?", (customer_name, product_name))
    row = cursor.fetchone()
    
    if row:
        new_quantity = row['quantity'] + quantity
        new_total_price = new_quantity * price
        cursor.execute("""
        UPDATE cart
        SET quantity = ?, total_price = ?
        WHERE cart_id = ?
        """, (new_quantity, new_total_price, row['cart_id']))
        conn.commit()
        cart_id = row['cart_id']
    else:
        cursor.execute("""
        INSERT INTO cart (customer_name, product_name, quantity, price, total_price)
        VALUES (?, ?, ?, ?, ?)
        """, (customer_name, product_name, quantity, price, total_price))
        conn.commit()
        cart_id = cursor.lastrowid
        
    conn.close()
    return cart_id

def get_cart_items(customer_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if customer_name:
        cursor.execute("SELECT * FROM cart WHERE customer_name = ?", (customer_name,))
    else:
        cursor.execute("SELECT * FROM cart")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_cart_item(cart_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cart WHERE cart_id = ?", (cart_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_cart_item(cart_id, quantity, price, total_price):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE cart
    SET quantity = ?, price = ?, total_price = ?
    WHERE cart_id = ?
    """, (quantity, price, total_price, cart_id))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def delete_cart_item(cart_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cart WHERE cart_id = ?", (cart_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def clear_customer_cart(customer_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cart WHERE customer_name = ?", (customer_name,))
    conn.commit()
    conn.close()

# --- Order CRUD Functions ---
def add_order(customer_name, order_date, total_amount, payment_method, payment_status, delivery_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO orders (customer_name, order_date, total_amount, payment_method, payment_status, delivery_status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (customer_name, order_date, total_amount, payment_method, payment_status, delivery_status))
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()
    return order_id

def get_orders(customer_name=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if customer_name:
        cursor.execute("SELECT * FROM orders WHERE customer_name = ? ORDER BY order_id DESC", (customer_name,))
    else:
        cursor.execute("SELECT * FROM orders ORDER BY order_id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_order(order_id, customer_name, order_date, total_amount, payment_method, payment_status, delivery_status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE orders
    SET customer_name = ?, order_date = ?, total_amount = ?, payment_method = ?, payment_status = ?, delivery_status = ?
    WHERE order_id = ?
    """, (customer_name, order_date, total_amount, payment_method, payment_status, delivery_status, order_id))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

def delete_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders WHERE order_id = ?", (order_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0

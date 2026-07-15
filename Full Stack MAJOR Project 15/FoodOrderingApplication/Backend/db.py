import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db.sqlite3')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), commit=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        if commit:
            conn.commit()
            return cursor.lastrowid
        else:
            return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def get_next_id(table_name, pk_column, start_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT MAX({pk_column}) FROM {table_name}")
        row = cursor.fetchone()
        if row and row[0] is not None:
            return row[0] + 1
        return start_id
    finally:
        conn.close()

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Customers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # 2. Restaurants Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS restaurants (
            restaurant_id INTEGER PRIMARY KEY,
            restaurant_name TEXT UNIQUE NOT NULL,
            owner_name TEXT NOT NULL,
            cuisine TEXT NOT NULL,
            location TEXT NOT NULL,
            contact TEXT NOT NULL,
            rating REAL NOT NULL
        )
    ''')
    
    # 3. Food Menu Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS foods (
            food_id INTEGER PRIMARY KEY,
            food_name TEXT NOT NULL,
            restaurant_name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            availability TEXT NOT NULL,
            image_url TEXT,
            FOREIGN KEY (restaurant_name) REFERENCES restaurants (restaurant_name) ON DELETE CASCADE
        )
    ''')
    
    # 4. Shopping Cart Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            cart_id INTEGER PRIMARY KEY,
            customer_name TEXT NOT NULL,
            food_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            total_price REAL NOT NULL
        )
    ''')
    
    # 5. Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY,
            customer_name TEXT NOT NULL,
            restaurant_name TEXT NOT NULL,
            order_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            order_status TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    
    seed_data()

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if empty, then seed Customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO customers (customer_id, full_name, email, phone, address, password) VALUES (?, ?, ?, ?, ?, ?)",
                       (101, "Rahul Sharma", "rahul@gmail.com", "9876543210", "Hyderabad", "rahul123"))
        cursor.execute("INSERT INTO customers (customer_id, full_name, email, phone, address, password) VALUES (?, ?, ?, ?, ?, ?)",
                       (102, "Admin Customer", "admin@gmail.com", "9999999999", "Main Street", "admin123"))

    # Seed Restaurants
    cursor.execute("SELECT COUNT(*) FROM restaurants")
    if cursor.fetchone()[0] == 0:
        restaurants_list = [
            (201, "Spicy Kitchen", "Anil Kumar", "South Indian", "Hyderabad", "9876501234", 4.7),
            (202, "Burger Palace", "Sarah Miller", "American Fast Food", "Bangalore", "9876505678", 4.5),
            (203, "Pizza Corner", "Marco Rossi", "Italian", "Mumbai", "9876508901", 4.2),
            (204, "Royal Biryani", "Farhan Khan", "Mughlai", "Delhi", "9876501111", 4.8),
            (205, "Sweet Wonders", "Rhea Sen", "Desserts", "Kolkata", "9876502222", 4.6)
        ]
        cursor.executemany("INSERT INTO restaurants (restaurant_id, restaurant_name, owner_name, cuisine, location, contact, rating) VALUES (?, ?, ?, ?, ?, ?, ?)", restaurants_list)

    # Seed Food Menu
    cursor.execute("SELECT COUNT(*) FROM foods")
    if cursor.fetchone()[0] == 0:
        foods_list = [
            # Spicy Kitchen
            (301, "Chicken Biryani", "Spicy Kitchen", "Main Course", 299.0, "Available", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"),
            (302, "Masala Dosa", "Spicy Kitchen", "Breakfast", 99.0, "Available", "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500"),
            (303, "Paneer Butter Masala", "Spicy Kitchen", "Main Course", 249.0, "Available", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500"),
            # Burger Palace
            (304, "Classic Veg Burger", "Burger Palace", "Fast Food", 149.0, "Available", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"),
            (305, "Cheese Chicken Burger", "Burger Palace", "Fast Food", 199.0, "Available", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500"),
            (306, "French Fries", "Burger Palace", "Sides", 99.0, "Available", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500"),
            # Pizza Corner
            (307, "Margherita Pizza", "Pizza Corner", "Main Course", 199.0, "Available", "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"),
            (308, "Pepperoni Feast Pizza", "Pizza Corner", "Main Course", 299.0, "Available", "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500"),
            (309, "Garlic Breadsticks", "Pizza Corner", "Sides", 119.0, "Available", "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=500"),
            # Royal Biryani
            (310, "Mutton Biryani", "Royal Biryani", "Main Course", 349.0, "Available", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500"),
            (311, "Chicken Tikka", "Royal Biryani", "Starters", 220.0, "Available", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500"),
            # Sweet Wonders
            (312, "Chocolate Lava Cake", "Sweet Wonders", "Dessert", 129.0, "Available", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500"),
            (313, "Red Velvet Cupcake", "Sweet Wonders", "Dessert", 79.0, "Available", "https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=500")
        ]
        cursor.executemany("INSERT INTO foods (food_id, food_name, restaurant_name, category, price, availability, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)", foods_list)

    # Seed Shopping Cart
    cursor.execute("SELECT COUNT(*) FROM cart")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO cart (cart_id, customer_name, food_name, quantity, price, total_price) VALUES (?, ?, ?, ?, ?, ?)",
                       (401, "Rahul Sharma", "Chicken Biryani", 2, 299.0, 598.0))

    # Seed Orders
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO orders (order_id, customer_name, restaurant_name, order_date, total_amount, payment_method, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       (501, "Rahul Sharma", "Spicy Kitchen", "2026-07-15", 598.0, "UPI", "Paid", "Preparing"))

    conn.commit()
    conn.close()

# --- CUSTOMER CRUD ---
def add_customer(data):
    customer_id = get_next_id('customers', 'customer_id', 101)
    query = '''
        INSERT INTO customers (customer_id, full_name, email, phone, address, password)
        VALUES (?, ?, ?, ?, ?, ?)
    '''
    execute_query(query, (
        customer_id,
        data.get('full_name'),
        data.get('email'),
        data.get('phone'),
        data.get('address'),
        data.get('password')
    ), commit=True)
    return get_customer(customer_id)

def get_customers():
    return execute_query("SELECT * FROM customers")

def get_customer(customer_id):
    res = execute_query("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    return res[0] if res else None

def update_customer(customer_id, data):
    query = '''
        UPDATE customers
        SET full_name = ?, email = ?, phone = ?, address = ?, password = ?
        WHERE customer_id = ?
    '''
    execute_query(query, (
        data.get('full_name'),
        data.get('email'),
        data.get('phone'),
        data.get('address'),
        data.get('password'),
        customer_id
    ), commit=True)
    return get_customer(customer_id)

def delete_customer(customer_id):
    execute_query("DELETE FROM customers WHERE customer_id = ?", (customer_id,), commit=True)
    return True


# --- RESTAURANT CRUD ---
def add_restaurant(data):
    restaurant_id = get_next_id('restaurants', 'restaurant_id', 201)
    query = '''
        INSERT INTO restaurants (restaurant_id, restaurant_name, owner_name, cuisine, location, contact, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    '''
    execute_query(query, (
        restaurant_id,
        data.get('restaurant_name'),
        data.get('owner_name'),
        data.get('cuisine'),
        data.get('location'),
        data.get('contact'),
        float(data.get('rating', 0.0))
    ), commit=True)
    return get_restaurant(restaurant_id)

def get_restaurants():
    return execute_query("SELECT * FROM restaurants")

def get_restaurant(restaurant_id):
    res = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (restaurant_id,))
    return res[0] if res else None

def update_restaurant(restaurant_id, data):
    query = '''
        UPDATE restaurants
        SET restaurant_name = ?, owner_name = ?, cuisine = ?, location = ?, contact = ?, rating = ?
        WHERE restaurant_id = ?
    '''
    execute_query(query, (
        data.get('restaurant_name'),
        data.get('owner_name'),
        data.get('cuisine'),
        data.get('location'),
        data.get('contact'),
        float(data.get('rating', 0.0)),
        restaurant_id
    ), commit=True)
    return get_restaurant(restaurant_id)

def delete_restaurant(restaurant_id):
    execute_query("DELETE FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), commit=True)
    return True


# --- FOOD CRUD ---
def add_food(data):
    food_id = get_next_id('foods', 'food_id', 301)
    query = '''
        INSERT INTO foods (food_id, food_name, restaurant_name, category, price, availability, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    '''
    execute_query(query, (
        food_id,
        data.get('food_name'),
        data.get('restaurant_name'),
        data.get('category'),
        float(data.get('price', 0.0)),
        data.get('availability', 'Available'),
        data.get('image_url')
    ), commit=True)
    return get_food(food_id)

def get_foods():
    return execute_query("SELECT * FROM foods")

def get_food(food_id):
    res = execute_query("SELECT * FROM foods WHERE food_id = ?", (food_id,))
    return res[0] if res else None

def update_food(food_id, data):
    query = '''
        UPDATE foods
        SET food_name = ?, restaurant_name = ?, category = ?, price = ?, availability = ?, image_url = ?
        WHERE food_id = ?
    '''
    execute_query(query, (
        data.get('food_name'),
        data.get('restaurant_name'),
        data.get('category'),
        float(data.get('price', 0.0)),
        data.get('availability', 'Available'),
        data.get('image_url'),
        food_id
    ), commit=True)
    return get_food(food_id)

def delete_food(food_id):
    execute_query("DELETE FROM foods WHERE food_id = ?", (food_id,), commit=True)
    return True


# --- SHOPPING CART CRUD ---
def add_cart_item(data):
    cart_id = get_next_id('cart', 'cart_id', 401)
    
    # Check if item already exists for this customer in cart
    existing = execute_query(
        "SELECT * FROM cart WHERE customer_name = ? AND food_name = ?",
        (data.get('customer_name'), data.get('food_name'))
    )
    if existing:
        item = existing[0]
        new_quantity = item['quantity'] + int(data.get('quantity', 1))
        new_total = new_quantity * item['price']
        execute_query(
            "UPDATE cart SET quantity = ?, total_price = ? WHERE cart_id = ?",
            (new_quantity, new_total, item['cart_id']),
            commit=True
        )
        return get_cart_item(item['cart_id'])
        
    query = '''
        INSERT INTO cart (cart_id, customer_name, food_name, quantity, price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
    '''
    quantity = int(data.get('quantity', 1))
    price = float(data.get('price', 0.0))
    total_price = quantity * price
    execute_query(query, (
        cart_id,
        data.get('customer_name'),
        data.get('food_name'),
        quantity,
        price,
        total_price
    ), commit=True)
    return get_cart_item(cart_id)

def get_cart_items():
    return execute_query("SELECT * FROM cart")

def get_cart_item(cart_id):
    res = execute_query("SELECT * FROM cart WHERE cart_id = ?", (cart_id,))
    return res[0] if res else None

def update_cart_item(cart_id, data):
    item = get_cart_item(cart_id)
    if not item:
        return None
        
    quantity = int(data.get('quantity', item['quantity']))
    price = float(data.get('price', item['price']))
    total_price = data.get('total_price')
    if total_price is None:
        total_price = quantity * price
    else:
        total_price = float(total_price)
        
    query = '''
        UPDATE cart
        SET customer_name = ?, food_name = ?, quantity = ?, price = ?, total_price = ?
        WHERE cart_id = ?
    '''
    execute_query(query, (
        data.get('customer_name', item['customer_name']),
        data.get('food_name', item['food_name']),
        quantity,
        price,
        total_price,
        cart_id
    ), commit=True)
    return get_cart_item(cart_id)

def delete_cart_item(cart_id):
    execute_query("DELETE FROM cart WHERE cart_id = ?", (cart_id,), commit=True)
    return True

def clear_customer_cart(customer_name):
    execute_query("DELETE FROM cart WHERE customer_name = ?", (customer_name,), commit=True)
    return True


# --- ORDER CRUD ---
def add_order(data):
    order_id = get_next_id('orders', 'order_id', 501)
    query = '''
        INSERT INTO orders (order_id, customer_name, restaurant_name, order_date, total_amount, payment_method, payment_status, order_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    '''
    execute_query(query, (
        order_id,
        data.get('customer_name'),
        data.get('restaurant_name'),
        data.get('order_date'),
        float(data.get('total_amount', 0.0)),
        data.get('payment_method'),
        data.get('payment_status', 'Pending'),
        data.get('order_status', 'Order Placed')
    ), commit=True)
    
    # After placing order, clear the user's cart automatically
    clear_customer_cart(data.get('customer_name'))
    
    return get_order(order_id)

def get_orders():
    return execute_query("SELECT * FROM orders")

def get_order(order_id):
    res = execute_query("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    return res[0] if res else None

def update_order(order_id, data):
    item = get_order(order_id)
    if not item:
        return None
        
    query = '''
        UPDATE orders
        SET customer_name = ?, restaurant_name = ?, order_date = ?, total_amount = ?, payment_method = ?, payment_status = ?, order_status = ?
        WHERE order_id = ?
    '''
    execute_query(query, (
        data.get('customer_name', item['customer_name']),
        data.get('restaurant_name', item['restaurant_name']),
        data.get('order_date', item['order_date']),
        float(data.get('total_amount', item['total_amount'])),
        data.get('payment_method', item['payment_method']),
        data.get('payment_status', data.get('payment_status', item['payment_status'])),
        data.get('order_status', data.get('order_status', item['order_status'])),
        order_id
    ), commit=True)
    return get_order(order_id)

def delete_order(order_id):
    execute_query("DELETE FROM orders WHERE order_id = ?", (order_id,), commit=True)
    return True

# Initialize tables automatically when module is loaded
create_tables()

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db.sqlite3')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Passengers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS passengers (
            passenger_id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            gender TEXT NOT NULL,
            address TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')

    # 2. Buses Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buses (
            bus_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_name TEXT NOT NULL,
            bus_number TEXT UNIQUE NOT NULL,
            bus_type TEXT NOT NULL,
            total_seats INTEGER NOT NULL,
            operator_name TEXT NOT NULL
        )
    ''')

    # 3. Routes Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS routes (
            route_id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_name TEXT NOT NULL,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            fare REAL NOT NULL
        )
    ''')

    # 4. Bookings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_name TEXT NOT NULL,
            bus_name TEXT NOT NULL,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            journey_date TEXT NOT NULL,
            seat_number TEXT NOT NULL,
            ticket_price REAL NOT NULL,
            booking_status TEXT NOT NULL
        )
    ''')

    # 5. Payments Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            passenger_name TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            transaction_id TEXT NOT NULL
        )
    ''')

    # Check if empty and insert sample data
    # Passenger
    cursor.execute("SELECT COUNT(*) FROM passengers")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO passengers (passenger_id, full_name, email, phone, gender, address, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (101, "Rahul Sharma", "rahul@gmail.com", "9876543210", "Male", "Hyderabad", "rahul123"))

    # Bus
    cursor.execute("SELECT COUNT(*) FROM buses")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO buses (bus_id, bus_name, bus_number, bus_type, total_seats, operator_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (201, "Orange Travels", "TS09AB1234", "AC Sleeper", 40, "Orange Travels"))
        # Add a couple more buses to make search interesting!
        cursor.execute('''
            INSERT INTO buses (bus_id, bus_name, bus_number, bus_type, total_seats, operator_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (202, "KVR Travels", "AP16TV7890", "Non-AC Sleeper", 36, "KVR Travels"))
        cursor.execute('''
            INSERT INTO buses (bus_id, bus_name, bus_number, bus_type, total_seats, operator_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (203, "SRS Travels", "KA01SR1212", "AC Seater", 45, "SRS Travels"))

    # Route
    cursor.execute("SELECT COUNT(*) FROM routes")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO routes (route_id, bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (301, "Orange Travels", "Hyderabad", "Bangalore", "21:00", "06:00", 1200))
        cursor.execute('''
            INSERT INTO routes (route_id, bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (302, "KVR Travels", "Hyderabad", "Bangalore", "22:00", "08:00", 800))
        cursor.execute('''
            INSERT INTO routes (route_id, bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (303, "SRS Travels", "Hyderabad", "Bangalore", "08:00", "17:00", 1000))
        cursor.execute('''
            INSERT INTO routes (route_id, bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (304, "Orange Travels", "Bangalore", "Chennai", "20:00", "05:00", 1100))

    # Booking
    cursor.execute("SELECT COUNT(*) FROM bookings")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO bookings (booking_id, passenger_name, bus_name, source, destination, journey_date, seat_number, ticket_price, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (401, "Rahul Sharma", "Orange Travels", "Hyderabad", "Bangalore", "2026-08-15", "A12", 1200, "Confirmed"))

    # Payment
    cursor.execute("SELECT COUNT(*) FROM payments")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO payments (payment_id, booking_id, passenger_name, amount, payment_method, payment_status, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (501, 401, "Rahul Sharma", 1200, "UPI", "Success", "TXN987654321"))

    conn.commit()
    conn.close()

# Initialize tables immediately on import
init_db()

# --- PASSENGER CRUD ---
def add_passenger(data):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if passenger_id is provided, otherwise let SQLite handle it
    pid = data.get('passenger_id')
    if pid is not None:
        cursor.execute('''
            INSERT INTO passengers (passenger_id, full_name, email, phone, gender, address, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (pid, data['full_name'], data['email'], data['phone'], data['gender'], data['address'], data['password']))
    else:
        cursor.execute('''
            INSERT INTO passengers (full_name, email, phone, gender, address, password)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['full_name'], data['email'], data['phone'], data['gender'], data['address'], data['password']))
        pid = cursor.lastrowid
        
    conn.commit()
    conn.close()
    return pid

def get_passengers(email=None, password=None):
    conn = get_connection()
    cursor = conn.cursor()
    if email and password:
        cursor.execute("SELECT * FROM passengers WHERE email = ? AND password = ?", (email, password))
    elif email:
        cursor.execute("SELECT * FROM passengers WHERE email = ?", (email,))
    else:
        cursor.execute("SELECT * FROM passengers")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_passenger_by_id(pid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM passengers WHERE passenger_id = ?", (pid,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_passenger(pid, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE passengers
        SET full_name = ?, email = ?, phone = ?, gender = ?, address = ?, password = ?
        WHERE passenger_id = ?
    ''', (data['full_name'], data['email'], data['phone'], data['gender'], data['address'], data['password'], pid))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def delete_passenger(pid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM passengers WHERE passenger_id = ?", (pid,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


# --- BUS CRUD ---
def add_bus(data):
    conn = get_connection()
    cursor = conn.cursor()
    bid = data.get('bus_id')
    if bid is not None:
        cursor.execute('''
            INSERT INTO buses (bus_id, bus_name, bus_number, bus_type, total_seats, operator_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (bid, data['bus_name'], data['bus_number'], data['bus_type'], data['total_seats'], data['operator_name']))
    else:
        cursor.execute('''
            INSERT INTO buses (bus_name, bus_number, bus_type, total_seats, operator_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['bus_name'], data['bus_number'], data['bus_type'], data['total_seats'], data['operator_name']))
        bid = cursor.lastrowid
    conn.commit()
    conn.close()
    return bid

def get_buses():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buses")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_bus_by_id(bid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buses WHERE bus_id = ?", (bid,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_bus(bid, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE buses
        SET bus_name = ?, bus_number = ?, bus_type = ?, total_seats = ?, operator_name = ?
        WHERE bus_id = ?
    ''', (data['bus_name'], data['bus_number'], data['bus_type'], data['total_seats'], data['operator_name'], bid))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def delete_bus(bid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM buses WHERE bus_id = ?", (bid,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


# --- ROUTE CRUD ---
def add_route(data):
    conn = get_connection()
    cursor = conn.cursor()
    rid = data.get('route_id')
    if rid is not None:
        cursor.execute('''
            INSERT INTO routes (route_id, bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (rid, data['bus_name'], data['source'], data['destination'], data['departure_time'], data['arrival_time'], data['fare']))
    else:
        cursor.execute('''
            INSERT INTO routes (bus_name, source, destination, departure_time, arrival_time, fare)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['bus_name'], data['source'], data['destination'], data['departure_time'], data['arrival_time'], data['fare']))
        rid = cursor.lastrowid
    conn.commit()
    conn.close()
    return rid

def get_routes(source=None, destination=None):
    conn = get_connection()
    cursor = conn.cursor()
    if source and destination:
        # Case insensitive filtering
        cursor.execute("SELECT * FROM routes WHERE LOWER(source) = LOWER(?) AND LOWER(destination) = LOWER(?)", (source, destination))
    else:
        cursor.execute("SELECT * FROM routes")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_route_by_id(rid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routes WHERE route_id = ?", (rid,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_route(rid, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE routes
        SET bus_name = ?, source = ?, destination = ?, departure_time = ?, arrival_time = ?, fare = ?
        WHERE route_id = ?
    ''', (data['bus_name'], data['source'], data['destination'], data['departure_time'], data['arrival_time'], data['fare'], rid))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def delete_route(rid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM routes WHERE route_id = ?", (rid,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


# --- BOOKING CRUD ---
def add_booking(data):
    conn = get_connection()
    cursor = conn.cursor()
    bkid = data.get('booking_id')
    if bkid is not None:
        cursor.execute('''
            INSERT INTO bookings (booking_id, passenger_name, bus_name, source, destination, journey_date, seat_number, ticket_price, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (bkid, data['passenger_name'], data['bus_name'], data['source'], data['destination'], data['journey_date'], data['seat_number'], data['ticket_price'], data['booking_status']))
    else:
        cursor.execute('''
            INSERT INTO bookings (passenger_name, bus_name, source, destination, journey_date, seat_number, ticket_price, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data['passenger_name'], data['bus_name'], data['source'], data['destination'], data['journey_date'], data['seat_number'], data['ticket_price'], data['booking_status']))
        bkid = cursor.lastrowid
    conn.commit()
    conn.close()
    return bkid

def get_bookings(passenger_name=None, bus_name=None, journey_date=None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM bookings WHERE 1=1"
    params = []
    
    if passenger_name:
        query += " AND passenger_name = ?"
        params.append(passenger_name)
    if bus_name:
        query += " AND bus_name = ?"
        params.append(bus_name)
    if journey_date:
        query += " AND journey_date = ?"
        params.append(journey_date)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_booking_by_id(bkid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (bkid,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_booking(bkid, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE bookings
        SET passenger_name = ?, bus_name = ?, source = ?, destination = ?, journey_date = ?, seat_number = ?, ticket_price = ?, booking_status = ?
        WHERE booking_id = ?
    ''', (data['passenger_name'], data['bus_name'], data['source'], data['destination'], data['journey_date'], data['seat_number'], data['ticket_price'], data['booking_status'], bkid))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def delete_booking(bkid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookings WHERE booking_id = ?", (bkid,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


# --- PAYMENT CRUD ---
def add_payment(data):
    conn = get_connection()
    cursor = conn.cursor()
    pmid = data.get('payment_id')
    if pmid is not None:
        cursor.execute('''
            INSERT INTO payments (payment_id, booking_id, passenger_name, amount, payment_method, payment_status, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (pmid, data['booking_id'], data['passenger_name'], data['amount'], data['payment_method'], data['payment_status'], data['transaction_id']))
    else:
        cursor.execute('''
            INSERT INTO payments (booking_id, passenger_name, amount, payment_method, payment_status, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['booking_id'], data['passenger_name'], data['amount'], data['payment_method'], data['payment_status'], data['transaction_id']))
        pmid = cursor.lastrowid
    conn.commit()
    conn.close()
    return pmid

def get_payments(booking_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    if booking_id:
        cursor.execute("SELECT * FROM payments WHERE booking_id = ?", (booking_id,))
    else:
        cursor.execute("SELECT * FROM payments")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_payment_by_id(pmid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments WHERE payment_id = ?", (pmid,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_payment(pmid, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE payments
        SET booking_id = ?, passenger_name = ?, amount = ?, payment_method = ?, payment_status = ?, transaction_id = ?
        WHERE payment_id = ?
    ''', (data['booking_id'], data['passenger_name'], data['amount'], data['payment_method'], data['payment_status'], data['transaction_id'], pmid))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def delete_payment(pmid):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM payments WHERE payment_id = ?", (pmid,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

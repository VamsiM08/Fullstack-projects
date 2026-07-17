import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

# MongoDB URI setup
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')

_customers_raw = None
_drivers_raw = None
_vehicles_raw = None
_bookings_raw = None
_payments_raw = None

mongo_connected = False

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    db = client['taxibookingdb']
    client.server_info()  # Test connection
    _customers_raw = db['customers']
    _drivers_raw = db['drivers']
    _vehicles_raw = db['vehicles']
    _bookings_raw = db['bookings']
    _payments_raw = db['payments']
    mongo_connected = True
    print("Database Connection: ONLINE (MongoDB)")
except Exception as e:
    print(f"Database Connection: OFFLINE. Falling back to In-Memory DB simulation. Details: {e}")

# ==========================================
# PREPOPULATE IN-MEMORY DATASET
# ==========================================
def get_initial_customers():
    return [
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a1"),
            "customer_id": "CUST0001",
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "address": "742 Evergreen Terrace, Springfield",
            "password": "password123",
            "profile_pic": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
            "gender": "Male",
            "dob": "1992-05-15",
            "emergency_contact": "+1999888777",
            "member_since": "2024-01-10"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a2"),
            "customer_id": "CUST0002",
            "full_name": "Alice Vance",
            "email": "alice@example.com",
            "phone": "+1888222333",
            "address": "404 Baker St, London",
            "password": "password123",
            "profile_pic": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
            "gender": "Female",
            "dob": "1995-10-22",
            "emergency_contact": "+1888222334",
            "member_since": "2024-03-14"
        }
    ]

def get_initial_drivers():
    return [
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a3"),
            "driver_id": "DRV0001",
            "driver_name": "Michael Smith",
            "email": "michael.s@taxi.com",
            "phone": "+1555010099",
            "license_number": "DL-993882772",
            "experience": 8,
            "availability": "Available",
            "password": "driver123",
            "profile_pic": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            "vehicle_number": "NY-77A-9922",
            "rating": 4.85,
            "total_rides": 420,
            "license_expiry": "2029-12-15"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a4"),
            "driver_id": "DRV0002",
            "driver_name": "Sarah Connor",
            "email": "sarah.c@taxi.com",
            "phone": "+1555010088",
            "license_number": "DL-388277166",
            "experience": 5,
            "availability": "Available",
            "password": "driver123",
            "profile_pic": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
            "vehicle_number": "CA-88B-1122",
            "rating": 4.92,
            "total_rides": 280,
            "license_expiry": "2028-05-20"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a5"),
            "driver_id": "DRV0003",
            "driver_name": "Robert Downey",
            "email": "robert.d@taxi.com",
            "phone": "+1555010077",
            "license_number": "DL-112233445",
            "experience": 12,
            "availability": "Busy",
            "password": "driver123",
            "profile_pic": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            "vehicle_number": "TX-55C-3344",
            "rating": 4.79,
            "total_rides": 850,
            "license_expiry": "2030-08-11"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a6"),
            "driver_id": "DRV0004",
            "driver_name": "Bruce Wayne",
            "email": "bruce.w@taxi.com",
            "phone": "+1555010066",
            "license_number": "DL-665544332",
            "experience": 15,
            "availability": "Offline",
            "password": "driver123",
            "profile_pic": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
            "vehicle_number": "BAT-0001",
            "rating": 4.98,
            "total_rides": 1200,
            "license_expiry": "2032-11-22"
        }
    ]

def get_initial_vehicles():
    return [
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a7"),
            "vehicle_id": "VEH0001",
            "driver_name": "Michael Smith",
            "vehicle_type": "Sedan",
            "vehicle_number": "NY-77A-9922",
            "seating_capacity": 4,
            "model": "Toyota Camry Hybrid",
            "year": 2023,
            "color": "Obsidian Black",
            "transmission": "Automatic",
            "fuel_type": "Hybrid",
            "vehicle_image": "images/sedan.png"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a8"),
            "vehicle_id": "VEH0002",
            "driver_name": "Sarah Connor",
            "vehicle_type": "SUV",
            "vehicle_number": "CA-88B-1122",
            "seating_capacity": 6,
            "model": "Ford Explorer",
            "year": 2022,
            "color": "Oxford White",
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "vehicle_image": "images/suv.png"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8a9"),
            "vehicle_id": "VEH0003",
            "driver_name": "Robert Downey",
            "vehicle_type": "Luxury",
            "vehicle_number": "TX-55C-3344",
            "seating_capacity": 4,
            "model": "Tesla Model Y",
            "year": 2024,
            "color": "Solid Red",
            "transmission": "Automatic",
            "fuel_type": "Electric",
            "vehicle_image": "images/luxury.png"
        },
        {
            "_id": ObjectId("64b4c7be5c0d58309df8c8b0"),
            "vehicle_id": "VEH0004",
            "driver_name": "Bruce Wayne",
            "vehicle_type": "Luxury",
            "vehicle_number": "BAT-0001",
            "seating_capacity": 2,
            "model": "Lamborghini Aventador",
            "year": 2023,
            "color": "Matte Grey",
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "vehicle_image": "images/luxury.png"
        }
    ]

# Generate some default historical logs
def get_initial_bookings_and_payments():
    bookings = []
    payments = []
    
    cities_pickup = ["Times Square, NYC", "Central Park, NYC", "Grand Central, NYC", "Empire State Bldg, NYC", "Soho Market, NYC"]
    cities_drop = ["JFK Airport, Queens", "LaGuardia Airport, Queens", "Brooklyn Bridge, NY", "Hoboken Terminal, NJ", "Broadway Theatre, NY"]
    payment_methods = ["UPI", "Credit Card", "Debit Card", "Wallet", "Cash"]
    promos = ["NEW30", "AIRPORT10", "WEEKEND5", "FLAT20", ""]
    
    base_date = datetime.now() - timedelta(days=10)
    drivers = get_initial_drivers()

    for i in range(15):
        ride_date = base_date + timedelta(hours=i*12)
        booking_id = f"BK{10000 + i:05d}"
        payment_id = f"PMT{10000 + i:05d}"
        
        distance = round(random.uniform(3.2, 38.5), 1)
        eta = int(distance * 2) + 3
        promo = random.choice(promos)
        
        rate_per_km = 2.0
        subtotal = round(10.0 + (distance * rate_per_km), 2)
        
        discount = 0.0
        if promo == "NEW30":
            discount = round(subtotal * 0.3, 2)
        elif promo == "AIRPORT10":
            discount = 10.0
        elif promo == "FLAT20":
            discount = 20.0
        discount = min(discount, subtotal)
        
        tax = round((subtotal - discount) * 0.08, 2)
        final_fare = round((subtotal - discount) + tax, 2)

        ride_status = "Completed" if i < 12 else ("Cancelled" if i == 12 else "In Progress")
        c_name = "John Doe" if i % 2 == 0 else "Alice Vance"
        d_name = drivers[i % len(drivers)]["driver_name"]
        
        booking_doc = {
            "_id": ObjectId(),
            "booking_id": booking_id,
            "customer_name": c_name,
            "driver_name": d_name,
            "pickup_location": random.choice(cities_pickup),
            "drop_location": random.choice(cities_drop),
            "booking_date": ride_date.strftime("%Y-%m-%d %H:%M:%S"),
            "fare": final_fare,
            "ride_status": ride_status,
            "distance": distance,
            "eta": eta,
            "payment_method": random.choice(payment_methods) if ride_status == "Completed" else "Cash",
            "promo_code": promo,
            "rating": round(random.uniform(4.0, 5.0), 1) if ride_status == "Completed" else 5.0
        }
        bookings.append(booking_doc)

        if ride_status in ["Completed", "In Progress"]:
            pay_status = "Success" if ride_status == "Completed" else "Pending"
            method = booking_doc["payment_method"]
            import uuid
            txn_id = "TXN-" + str(uuid.uuid4().hex[:12]).upper() if pay_status == "Success" else ""
            
            payment_doc = {
                "_id": ObjectId(),
                "payment_id": payment_id,
                "booking_id": booking_id,
                "customer_name": c_name,
                "amount": final_fare,
                "payment_method": method,
                "payment_status": pay_status,
                "transaction_id": txn_id,
                "payment_date": (ride_date + timedelta(minutes=random.randint(15, 35))).strftime("%Y-%m-%d %H:%M:%S"),
                "subtotal": subtotal,
                "discount": discount,
                "tax": tax,
                "billing_address": f"{random.randint(100, 999)} Main St, NYC"
            }
            payments.append(payment_doc)
            
    return bookings, payments


# ==========================================
# SIMULATED COLLECTION CLASS
# ==========================================
class SimulatedCollection:
    def __init__(self, raw_col, collection_name, initial_data=None):
        self.raw_col = raw_col
        self.name = collection_name
        self.data = initial_data or []

    def _is_mongo_active(self):
        global mongo_connected
        if not mongo_connected:
            return False
        try:
            self.raw_col.database.client.server_info()
            return True
        except Exception:
            return False

    def insert_one(self, document):
        if self._is_mongo_active():
            return self.raw_col.insert_one(document)
        
        if '_id' not in document:
            document['_id'] = ObjectId()
        self.data.append(document)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document['_id'])

    def insert_many(self, documents):
        if self._is_mongo_active():
            return self.raw_col.insert_many(documents)
        for doc in documents:
            self.insert_one(doc)
        return True

    def find(self, filter_query=None):
        if self._is_mongo_active():
            return self.raw_col.find(filter_query)
        
        filter_query = filter_query or {}
        results = []
        for doc in self.data:
            match = True
            for k, v in filter_query.items():
                if hasattr(v, 'pattern') or hasattr(v, 'match'):
                    doc_val = str(doc.get(k, ''))
                    pat = v.pattern if hasattr(v, 'pattern') else str(v)
                    if not re_search(pat, doc_val):
                        match = False
                        break
                elif isinstance(v, dict):
                    for op, op_val in v.items():
                        if op == '$ne' and doc.get(k) == op_val:
                            match = False
                        elif op == '$in' and doc.get(k) not in op_val:
                            match = False
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        return results

    def find_one(self, filter_query=None):
        res = self.find(filter_query)
        results = list(res)
        return results[0] if results else None

    def update_one(self, filter_query, update_doc):
        if self._is_mongo_active():
            return self.raw_col.update_one(filter_query, update_doc)
        
        doc = self.find_one(filter_query)
        if doc and '$set' in update_doc:
            for k, v in update_doc['$set'].items():
                doc[k] = v
            return True
        return False

    def delete_one(self, filter_query):
        if self._is_mongo_active():
            return self.raw_col.delete_one(filter_query)
            
        doc = self.find_one(filter_query)
        if doc:
            self.data.remove(doc)
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        
        class DummyDeleteResult:
            deleted_count = 0
        return DummyDeleteResult()

    def delete_many(self, filter_query=None):
        if self._is_mongo_active():
            return self.raw_col.delete_many(filter_query)
        self.data.clear()
        return True

    def count_documents(self, filter_query=None):
        if self._is_mongo_active():
            return self.raw_col.count_documents(filter_query)
        return len(list(self.find(filter_query)))


def re_search(pattern, text):
    import re
    try:
        return re.search(pattern, text, re.IGNORECASE) is not None
    except Exception:
        return False


# Prepare mock datasets
bookings_init, payments_init = get_initial_bookings_and_payments()

# Export collections
customers_col = SimulatedCollection(_customers_raw, 'customers', get_initial_customers())
drivers_col = SimulatedCollection(_drivers_raw, 'drivers', get_initial_drivers())
vehicles_col = SimulatedCollection(_vehicles_raw, 'vehicles', get_initial_vehicles())
bookings_col = SimulatedCollection(_bookings_raw, 'bookings', bookings_init)
payments_col = SimulatedCollection(_payments_raw, 'payments', payments_init)


def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    
    doc = dict(doc)
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
        elif isinstance(v, list):
            doc[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
    return doc

import os
import sys
from datetime import datetime, timedelta
import random

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import (
    customers_col, drivers_col, vehicles_col, bookings_col, payments_col
)

def seed_database():
    print("Purging existing records in database...")
    customers_col.delete_many({})
    drivers_col.delete_many({})
    vehicles_col.delete_many({})
    bookings_col.delete_many({})
    payments_col.delete_many({})
    
    print("Database cleared. Loading detailed mock datasets...")
    
    # 1. Customers mock data (with avatars, DOB, emergency contacts)
    mock_customers = [
        {
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
    customers_col.insert_many(mock_customers)
    print("Loaded 2 customer profiles.")

    # 2. Drivers mock data (with ratings, photos, rides stats, vehicle number association)
    mock_drivers = [
        {
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
    drivers_col.insert_many(mock_drivers)
    print("Loaded 4 driver profiles.")

    # 3. Vehicles mock data (colors, transmission, engine types, car photos)
    mock_vehicles = [
        {
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
            "vehicle_image": "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=300"
        },
        {
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
            "vehicle_image": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=300"
        },
        {
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
            "vehicle_image": "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=300"
        },
        {
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
            "vehicle_image": "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&q=80&w=300"
        }
    ]
    vehicles_col.insert_many(mock_vehicles)
    print("Loaded 4 vehicle specs.")

    # 4. Bookings & Payments Historical Data
    cities_pickup = ["Times Square, NYC", "Central Park, NYC", "Grand Central, NYC", "Empire State Bldg, NYC", "Soho Market, NYC"]
    cities_drop = ["JFK Airport, Queens", "LaGuardia Airport, Queens", "Brooklyn Bridge, NY", "Hoboken Terminal, NJ", "Broadway Theatre, NY"]
    payment_methods = ["UPI", "Credit Card", "Debit Card", "Wallet", "Cash"]
    promos = ["NEW30", "AIRPORT10", "WEEKEND5", "FLAT20", ""]

    base_date = datetime.now() - timedelta(days=10)
    print("Generating simulated transactions...")

    for i in range(20):
        ride_date = base_date + timedelta(hours=i*12)
        booking_id = f"BK{10000 + i:05d}"
        payment_id = f"PMT{10000 + i:05d}"
        
        distance = round(random.uniform(3.2, 38.5), 1)
        eta = Math_eta = int(distance * 2) + 3
        promo = random.choice(promos)
        
        # Calculate subtotal based on model rates
        rate_per_km = 2.0
        subtotal = round(10.0 + (distance * rate_per_km), 2)
        
        # Apply discounts
        discount = 0.0
        if promo == "NEW30":
            discount = round(subtotal * 0.3, 2)
        elif promo == "AIRPORT10":
            discount = 10.0
        elif promo == "FLAT20":
            discount = 20.0
        discount = min(discount, subtotal)
        
        tax = round((subtotal - discount) * 0.08, 2) # 8% VAT
        final_fare = round((subtotal - discount) + tax, 2)

        ride_status = "Completed" if i < 16 else ("Cancelled" if i == 17 else "In Progress")
        
        c_name = "John Doe" if i % 2 == 0 else "Alice Vance"
        driver = mock_drivers[i % len(mock_drivers)]
        d_name = driver["driver_name"]
        
        booking_doc = {
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
        bookings_col.insert_one(booking_doc)

        if ride_status in ["Completed", "In Progress"]:
            pay_status = "Success" if ride_status == "Completed" else "Pending"
            method = booking_doc["payment_method"]
            import uuid
            txn_id = "TXN-" + str(uuid.uuid4().hex[:12]).upper() if pay_status == "Success" else ""
            
            payment_doc = {
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
            payments_col.insert_one(payment_doc)

    print("Successfully seeded extended database parameters.")

if __name__ == "__main__":
    seed_database()

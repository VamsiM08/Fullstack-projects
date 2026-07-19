import os
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ship_booking.settings')

import django
django.setup()

from db import Passenger, Ship, Schedule, Booking, Payment

def seed_database():
    print("Seeding database...")

    # Passengers
    passengers = [
        {
            "passenger_id": 101,
            "full_name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "phone": "9876543210",
            "nationality": "Indian",
            "passport_number": "N1234567",
            "password": "rahul123"
        },
        {
            "passenger_id": 102,
            "full_name": "Sophia Chen",
            "email": "sophia.chen@example.com",
            "phone": "+14155552671",
            "nationality": "American",
            "passport_number": "A9876543",
            "password": "sophia123"
        },
        {
            "passenger_id": 103,
            "full_name": "Vikram Patel",
            "email": "vikram@example.com",
            "phone": "9123456789",
            "nationality": "Indian",
            "passport_number": "P3456789",
            "password": "vikram123"
        }
    ]

    for p in passengers:
        Passenger.objects.update_or_create(passenger_id=p["passenger_id"], defaults=p)

    # Ships
    ships = [
        {
            "ship_id": 201,
            "ship_name": "Ocean Paradise",
            "ship_type": "Cruise Ship",
            "capacity": 2000,
            "operator_name": "Royal Cruises",
            "status": "Active"
        },
        {
            "ship_id": 202,
            "ship_name": "Sea Empress",
            "ship_type": "Luxury Yacht",
            "capacity": 250,
            "operator_name": "MSC Ferries",
            "status": "Active"
        },
        {
            "ship_id": 203,
            "ship_name": "Island Voyager",
            "ship_type": "Ferry",
            "capacity": 800,
            "operator_name": "Ferryhopper Lines",
            "status": "Active"
        },
        {
            "ship_id": 204,
            "ship_name": "Nile Breeze",
            "ship_type": "River Cruise",
            "capacity": 150,
            "operator_name": "Carnival River Ways",
            "status": "Active"
        },
        {
            "ship_id": 205,
            "ship_name": "Atlantis Trader",
            "ship_type": "Cargo Passenger Ship",
            "capacity": 500,
            "operator_name": "Maritime Logistics",
            "status": "Maintenance"
        }
    ]

    for s in ships:
        Ship.objects.update_or_create(ship_id=s["ship_id"], defaults=s)

    # Schedules
    schedules = [
        {
            "schedule_id": 301,
            "ship_name": "Ocean Paradise",
            "source_port": "Chennai Port",
            "destination_port": "Port Blair",
            "departure_date": "2026-10-15",
            "departure_time": "08:00",
            "arrival_date": "2026-10-16",
            "arrival_time": "06:00",
            "fare": 8500.0
        },
        {
            "schedule_id": 302,
            "ship_name": "Sea Empress",
            "source_port": "Mumbai Port",
            "destination_port": "Goa Harbor",
            "departure_date": "2026-11-01",
            "departure_time": "18:00",
            "arrival_date": "2026-11-02",
            "arrival_time": "07:30",
            "fare": 14500.0
        },
        {
            "schedule_id": 303,
            "ship_name": "Island Voyager",
            "source_port": "Kochi Port",
            "destination_port": "Lakshadweep Island",
            "departure_date": "2026-12-05",
            "departure_time": "10:00",
            "arrival_date": "2026-12-06",
            "arrival_time": "12:00",
            "fare": 6200.0
        },
        {
            "schedule_id": 304,
            "ship_name": "Nile Breeze",
            "source_port": "Kolkata Jetty",
            "destination_port": "Sundarbans Bay",
            "departure_date": "2026-10-25",
            "departure_time": "09:30",
            "arrival_date": "2026-10-27",
            "arrival_time": "15:00",
            "fare": 9800.0
        }
    ]

    for sch in schedules:
        Schedule.objects.update_or_create(schedule_id=sch["schedule_id"], defaults=sch)

    # Bookings
    bookings = [
        {
            "booking_id": 401,
            "passenger_name": "Rahul Sharma",
            "ship_name": "Ocean Paradise",
            "cabin_type": "Deluxe",
            "journey_date": "2026-10-15",
            "source_port": "Chennai Port",
            "destination_port": "Port Blair",
            "total_amount": 12000.0,
            "booking_status": "Confirmed"
        },
        {
            "booking_id": 402,
            "passenger_name": "Sophia Chen",
            "ship_name": "Sea Empress",
            "cabin_type": "VIP Cabin",
            "journey_date": "2026-11-01",
            "source_port": "Mumbai Port",
            "destination_port": "Goa Harbor",
            "total_amount": 25000.0,
            "booking_status": "Confirmed"
        },
        {
            "booking_id": 403,
            "passenger_name": "Rahul Sharma",
            "ship_name": "Island Voyager",
            "cabin_type": "Economy",
            "journey_date": "2026-05-10",
            "source_port": "Kochi Port",
            "destination_port": "Lakshadweep Island",
            "total_amount": 6200.0,
            "booking_status": "Completed"
        }
    ]

    for b in bookings:
        Booking.objects.update_or_create(booking_id=b["booking_id"], defaults=b)

    # Payments
    payments = [
        {
            "payment_id": 501,
            "booking_id": 401,
            "passenger_name": "Rahul Sharma",
            "amount": 12000.0,
            "payment_method": "UPI",
            "payment_status": "Success",
            "transaction_id": "TXN789456123",
            "payment_date": "2026-09-20"
        },
        {
            "payment_id": 502,
            "booking_id": 402,
            "passenger_name": "Sophia Chen",
            "amount": 25000.0,
            "payment_method": "Credit Card",
            "payment_status": "Success",
            "transaction_id": "TXN987654321",
            "payment_date": "2026-09-21"
        },
        {
            "payment_id": 503,
            "booking_id": 403,
            "passenger_name": "Rahul Sharma",
            "amount": 6200.0,
            "payment_method": "Net Banking",
            "payment_status": "Success",
            "transaction_id": "TXN112233445",
            "payment_date": "2026-05-01"
        }
    ]

    for pay in payments:
        Payment.objects.update_or_create(payment_id=pay["payment_id"], defaults=pay)

    print("Database successfully seeded with sample testing data!")

if __name__ == '__main__':
    seed_database()

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
import django
django.setup()


from Backend.models import Passenger, Train, Schedule, Booking, Payment

def seed_data():
    print("Clearing old data...")
    Payment.objects.all().delete()
    Booking.objects.all().delete()
    Schedule.objects.all().delete()
    Train.objects.all().delete()
    Passenger.objects.all().delete()

    print("Seeding Passengers...")
    passengers = [
        Passenger(
            passenger_id=101,
            full_name="Rahul Sharma",
            email="rahul@gmail.com",
            phone="9876543210",
            gender="Male",
            age=28,
            address="Hyderabad",
            password="rahul123"
        ),
        Passenger(
            passenger_id=102,
            full_name="Priya Verma",
            email="priya@gmail.com",
            phone="9812345678",
            gender="Female",
            age=26,
            address="Bangalore",
            password="priya123"
        ),
        Passenger(
            passenger_id=103,
            full_name="Amitabh Das",
            email="amitabh@gmail.com",
            phone="9988776655",
            gender="Male",
            age=35,
            address="Mumbai",
            password="amit123"
        )
    ]
    Passenger.objects.bulk_create(passengers)

    print("Seeding Trains...")
    trains = [
        Train(
            train_id=201,
            train_name="Vande Bharat Express",
            train_number="20678",
            train_type="Vande Bharat",
            total_seats=1128,
            source="Chennai",
            destination="Bangalore"
        ),
        Train(
            train_id=202,
            train_name="Rajdhani Express",
            train_number="12431",
            train_type="Rajdhani",
            total_seats=950,
            source="Delhi",
            destination="Mumbai"
        ),
        Train(
            train_id=203,
            train_name="Shatabdi Express",
            train_number="12002",
            train_type="Shatabdi",
            total_seats=780,
            source="Bhopal",
            destination="Delhi"
        ),
        Train(
            train_id=204,
            train_name="Coromandel Superfast",
            train_number="12841",
            train_type="Superfast",
            total_seats=1400,
            source="Howrah",
            destination="Chennai"
        ),
        Train(
            train_id=205,
            train_name="Deccan Queen Express",
            train_number="12124",
            train_type="Express",
            total_seats=850,
            source="Pune",
            destination="Mumbai"
        )
    ]
    Train.objects.bulk_create(trains)

    print("Seeding Schedules...")
    schedules = [
        Schedule(
            schedule_id=301,
            train_name="Vande Bharat Express",
            source="Chennai",
            destination="Bangalore",
            departure_date="2026-08-15",
            departure_time="06:00",
            arrival_date="2026-08-15",
            arrival_time="10:30",
            fare=1200.0
        ),
        Schedule(
            schedule_id=302,
            train_name="Rajdhani Express",
            source="Delhi",
            destination="Mumbai",
            departure_date="2026-08-16",
            departure_time="16:55",
            arrival_date="2026-08-17",
            arrival_time="08:35",
            fare=2450.0
        ),
        Schedule(
            schedule_id=303,
            train_name="Shatabdi Express",
            source="Bhopal",
            destination="Delhi",
            departure_date="2026-08-18",
            departure_time="15:00",
            arrival_date="2026-08-18",
            arrival_time="22:30",
            fare=1150.0
        ),
        Schedule(
            schedule_id=304,
            train_name="Coromandel Superfast",
            source="Howrah",
            destination="Chennai",
            departure_date="2026-08-20",
            departure_time="15:20",
            arrival_date="2026-08-21",
            arrival_time="17:00",
            fare=980.0
        ),
        Schedule(
            schedule_id=305,
            train_name="Deccan Queen Express",
            source="Pune",
            destination="Mumbai",
            departure_date="2026-08-15",
            departure_time="07:15",
            arrival_date="2026-08-15",
            arrival_time="10:25",
            fare=450.0
        )
    ]
    Schedule.objects.bulk_create(schedules)

    print("Seeding Bookings...")
    bookings = [
        Booking(
            booking_id=401,
            passenger_name="Rahul Sharma",
            train_name="Vande Bharat Express",
            journey_date="2026-08-15",
            source="Chennai",
            destination="Bangalore",
            coach_type="Chair Car",
            seat_number="C5-18",
            total_fare=1200.0,
            booking_status="Confirmed"
        ),
        Booking(
            booking_id=402,
            passenger_name="Priya Verma",
            train_name="Rajdhani Express",
            journey_date="2026-08-16",
            source="Delhi",
            destination="Mumbai",
            coach_type="AC 2 Tier",
            seat_number="A2-24",
            total_fare=2450.0,
            booking_status="Confirmed"
        ),
        Booking(
            booking_id=403,
            passenger_name="Rahul Sharma",
            train_name="Deccan Queen Express",
            journey_date="2026-08-25",
            source="Pune",
            destination="Mumbai",
            coach_type="Chair Car",
            seat_number="CC-42",
            total_fare=450.0,
            booking_status="RAC"
        )
    ]
    Booking.objects.bulk_create(bookings)

    print("Seeding Payments...")
    payments = [
        Payment(
            payment_id=501,
            booking_id=401,
            passenger_name="Rahul Sharma",
            amount=1200.0,
            payment_method="UPI",
            payment_status="Success",
            transaction_id="TXN987654321",
            payment_date="2026-08-10"
        ),
        Payment(
            payment_id=502,
            booking_id=402,
            passenger_name="Priya Verma",
            amount=2450.0,
            payment_method="Credit Card",
            payment_status="Success",
            transaction_id="TXN887766554",
            payment_date="2026-08-11"
        ),
        Payment(
            payment_id=503,
            booking_id=403,
            passenger_name="Rahul Sharma",
            amount=450.0,
            payment_method="Net Banking",
            payment_status="Success",
            transaction_id="TXN112233445",
            payment_date="2026-08-12"
        )
    ]
    Payment.objects.bulk_create(payments)

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_data()

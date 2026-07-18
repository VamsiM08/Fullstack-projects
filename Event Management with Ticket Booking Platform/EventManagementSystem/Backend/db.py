import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from backend_app.models import User, Event, Venue, Booking, Payment, Review
from django.core.management import call_command

def seed_database():
    print("Migrating Database...")
    call_command('makemigrations', 'backend_app')
    call_command('migrate')

    print("Seeding Initial Testing Data...")
    
    # 1. Users
    users_data = [
        {
            "user_id": 101,
            "full_name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "phone": "9876543210",
            "city": "Hyderabad",
            "password": "rahul123",
            "role": "user"
        },
        {
            "user_id": 102,
            "full_name": "Priya Patel",
            "email": "priya@gmail.com",
            "phone": "9812345678",
            "city": "Mumbai",
            "password": "priya123",
            "role": "organizer"
        },
        {
            "user_id": 103,
            "full_name": "Admin User",
            "email": "admin@eventhub.com",
            "phone": "9998887770",
            "city": "Bangalore",
            "password": "admin123",
            "role": "admin"
        }
    ]

    for u in users_data:
        User.objects.update_or_create(user_id=u['user_id'], defaults=u)

    # 2. Venues
    venues_data = [
        {
            "venue_id": 301,
            "venue_name": "Bangalore International Convention Center",
            "location": "Whitefield",
            "city": "Bangalore",
            "capacity": 1000,
            "contact_person": "Anil Kumar"
        },
        {
            "venue_id": 302,
            "venue_name": "Hyderabad Music Arena",
            "location": "Gachibowli",
            "city": "Hyderabad",
            "capacity": 5000,
            "contact_person": "Vikram Reddy"
        },
        {
            "venue_id": 303,
            "venue_name": "NCPA Auditorium",
            "location": "Nariman Point",
            "city": "Mumbai",
            "capacity": 800,
            "contact_person": "Meera Shah"
        },
        {
            "venue_id": 304,
            "venue_name": "DLF Cyber City Amphitheatre",
            "location": "Cyber Hub",
            "city": "Gurugram",
            "capacity": 1200,
            "contact_person": "Rajesh Gupta"
        }
    ]

    for v in venues_data:
        Venue.objects.update_or_create(venue_id=v['venue_id'], defaults=v)

    # 3. Events
    events_data = [
        {
            "event_id": 201,
            "event_name": "Tech Innovation Summit 2026",
            "category": "Conference",
            "organizer_name": "Tech Events Pvt Ltd",
            "event_date": "2026-09-15",
            "event_time": "10:00",
            "venue": "Bangalore International Convention Center",
            "ticket_price": 1500,
            "available_tickets": 498,
            "description": "Join global tech leaders, AI pioneers, and startup founders for keynotes, workshops, and networking.",
            "image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
            "rating": 4.9
        },
        {
            "event_id": 202,
            "event_name": "Sunburn Electronic Music Fest",
            "category": "Music Concert",
            "organizer_name": "Percept Live",
            "event_date": "2026-10-24",
            "event_time": "17:00",
            "venue": "Hyderabad Music Arena",
            "ticket_price": 2500,
            "available_tickets": 1200,
            "description": "Experience the ultimate EDM night featuring top international DJs, state-of-the-art light shows, and vibrant crowds.",
            "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
            "rating": 4.8
        },
        {
            "event_id": 203,
            "event_name": "Standup Comedy Night with Zakir",
            "category": "Comedy Show",
            "organizer_name": "Laughter Club",
            "event_date": "2026-08-10",
            "event_time": "19:30",
            "venue": "NCPA Auditorium",
            "ticket_price": 799,
            "available_tickets": 150,
            "description": "A hilarious evening filled with relatable stories, witty punchlines, and unstoppable laughter.",
            "image_url": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80",
            "rating": 4.7
        },
        {
            "event_id": 204,
            "event_name": "Full-Stack Web Dev Masterclass",
            "category": "Workshop",
            "organizer_name": "DevAcademy",
            "event_date": "2026-08-05",
            "event_time": "09:00",
            "venue": "DLF Cyber City Amphitheatre",
            "ticket_price": 499,
            "available_tickets": 80,
            "description": "Hands-on intensive workshop on modern Python, Django REST Framework, and reactive frontend design.",
            "image_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
            "rating": 4.9
        },
        {
            "event_id": 205,
            "event_name": "National Sports & Fitness Expo",
            "category": "Sports",
            "organizer_name": "FitIndia Org",
            "event_date": "2026-11-01",
            "event_time": "08:00",
            "venue": "Bangalore International Convention Center",
            "ticket_price": 299,
            "available_tickets": 400,
            "description": "Interactive sports exhibitions, crossfit challenges, nutrition masterclasses, and athlete meet-and-greets.",
            "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
            "rating": 4.6
        }
    ]

    for e in events_data:
        Event.objects.update_or_create(event_id=e['event_id'], defaults=e)

    # 4. Bookings
    bookings_data = [
        {
            "booking_id": 401,
            "user_name": "Rahul Sharma",
            "event_name": "Tech Innovation Summit 2026",
            "booking_date": "2026-08-20",
            "number_of_tickets": 2,
            "total_amount": 3000,
            "booking_status": "Confirmed",
            "seats": "A1, A2"
        }
    ]

    for b in bookings_data:
        Booking.objects.update_or_create(booking_id=b['booking_id'], defaults=b)

    # 5. Payments
    payments_data = [
        {
            "payment_id": 501,
            "booking_id": 401,
            "user_name": "Rahul Sharma",
            "amount": 3000,
            "payment_method": "UPI",
            "payment_status": "Success",
            "transaction_id": "TXN987654321",
            "payment_date": "2026-08-20"
        }
    ]

    for p in payments_data:
        Payment.objects.update_or_create(payment_id=p['payment_id'], defaults=p)

    # 6. Reviews
    reviews_data = [
        {
            "event_id": 201,
            "user_name": "Rahul Sharma",
            "rating": 5,
            "comment": "Outstanding summit! Keynote speeches on AI and Cloud infrastructure were phenomenal.",
            "created_at": "2026-08-21 14:30"
        },
        {
            "event_id": 201,
            "user_name": "Ananya Roy",
            "rating": 5,
            "comment": "Very well managed venue and excellent speakers. Looking forward to attending next year!",
            "created_at": "2026-08-22 11:15"
        }
    ]

    for r in reviews_data:
        Review.objects.create(**r)

    print("Database initialisation and seeding completed successfully!")

if __name__ == "__main__":
    seed_database()

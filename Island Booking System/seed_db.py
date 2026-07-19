import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'island_booking.settings')
django.setup()

from booking_app.models import Customer, Island, Package, Booking, Payment
from datetime import date, timedelta

def seed():
    print("Clearing old data...")
    Payment.objects.all().delete()
    Booking.objects.all().delete()
    Package.objects.all().delete()
    Island.objects.all().delete()
    Customer.objects.all().delete()

    print("Seeding Luxury Islands...")
    islands_data = [
        {
            "name": "Baros Private Island",
            "country": "Maldives",
            "climate": "Tropical Monsoonal",
            "best_season": "Nov - Apr",
            "rating": 4.95,
            "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=85",
            "description": "An award-winning boutique island resort in the Indian Ocean, featuring overwater villas with private infinity pools, crystal-clear turquoise lagoons, and Michelin-star dining.",
            "price_per_night": 850.00,
            "is_featured": True
        },
        {
            "name": "Bora Bora Lagoon Resort",
            "country": "French Polynesia",
            "climate": "Tropical Oceanic",
            "best_season": "May - Oct",
            "rating": 4.98,
            "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
            "description": "Nestled beneath Mount Otemanu, offering iconic overwater bungalows, private beach hammocks, lagoon ray safaris, and romantic sunset catamaran cruises.",
            "price_per_night": 1200.00,
            "is_featured": True
        },
        {
            "name": "Uluwatu Ocean Cliff Sanctuary",
            "country": "Bali, Indonesia",
            "climate": "Tropical Savanna",
            "best_season": "Apr - Oct",
            "rating": 4.89,
            "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85",
            "description": "Perched dramatically on Uluwatu cliffs overlooking the Indian Ocean, featuring traditional Balinese luxury architecture, private spa sanctuaries, and legendary surf access.",
            "price_per_night": 650.00,
            "is_featured": True
        },
        {
            "name": "Santorini Caldera Haven",
            "country": "Greece",
            "climate": "Mediterranean",
            "best_season": "Jun - Sep",
            "rating": 4.92,
            "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85",
            "description": "Breathtaking cliffside whitewashed cave suites in Oia with private heated jacuzzi balconies overlooking the volcanic Aegean Sea caldera.",
            "price_per_night": 950.00,
            "is_featured": True
        },
        {
            "name": "La Digue Granite Cove",
            "country": "Seychelles",
            "climate": "Equatorial Oceanic",
            "best_season": "Mar - May & Sep - Nov",
            "rating": 4.88,
            "image_url": "https://images.unsplash.com/photo-1589553460732-57ef51160601?auto=format&fit=crop&w=1200&q=85",
            "description": "Home to the famous Anse Source d'Argent granite boulders, coconut palm groves, Giant Tortoise encounters, and exclusive eco-luxury beachfront chalets.",
            "price_per_night": 780.00,
            "is_featured": True
        },
        {
            "name": "Maui Sunset Coast Estate",
            "country": "Hawaii, USA",
            "climate": "Tropical Maritime",
            "best_season": "Year-round",
            "rating": 4.91,
            "image_url": "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1200&q=85",
            "description": "Lush tropical retreat along Wailea Beach with oceanfront golf courses, humpback whale watching from your suite balcony, and traditional Hawaiian spa rituals.",
            "price_per_night": 890.00,
            "is_featured": True
        }
    ]

    created_islands = []
    for data in islands_data:
        i = Island.objects.create(**data)
        created_islands.append(i)

    print("Seeding Luxury Packages...")
    packages_data = [
        {
            "island": created_islands[0], # Baros Maldives
            "title": "Maldivian Overwater Royalty Villa Escape",
            "duration_days": 7,
            "price": 4999.00,
            "discount_percent": 15,
            "services": "Overwater Villa, Private Infinity Pool, Sunset Dolphin Cruise, Seaplane Transfers, All-Inclusive Fine Dining, Spa Treatment",
            "rating": 4.97,
            "image_url": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[0], # Baros Maldives
            "title": "Honeymoon Coral Reef & Scuba Haven",
            "duration_days": 5,
            "price": 3499.00,
            "discount_percent": 10,
            "services": "Ocean Villa, Daily Scuba Diving, Romantic Candlelight Beach Dinner, Butler Service, Sunset Yacht",
            "rating": 4.92,
            "image_url": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[1], # Bora Bora
            "title": "Polynesian Lagoon Paradise & Helicopter Tour",
            "duration_days": 6,
            "price": 5800.00,
            "discount_percent": 12,
            "services": "Luxury Overwater Suite, Mount Otemanu Helicopter Tour, Ray & Shark Snorkeling, Private Island Picnic, Canoe Breakfast",
            "rating": 4.99,
            "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[2], # Bali
            "title": "Uluwatu Sunset Ocean Sanctuary & Wellness Retreat",
            "duration_days": 7,
            "price": 2899.00,
            "discount_percent": 20,
            "services": "Cliffside Private Villa, Daily Balinese Massage, Sunrise Yoga, Kecak Fire Dance VIP Passes, Floating Pool Breakfast",
            "rating": 4.89,
            "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[3], # Santorini
            "title": "Oia Aegean Cliffside Honeymoon & Wine Experience",
            "duration_days": 5,
            "price": 3950.00,
            "discount_percent": 10,
            "services": "Caldera Cave Suite, Private Jacuzzi, Sunset Catamaran Cruise, Greek Wine Tasting Tour, Private Chauffeur",
            "rating": 4.94,
            "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[4], # Seychelles
            "title": "Seychelles Granite Coast Eco-Luxury Adventure",
            "duration_days": 8,
            "price": 4500.00,
            "discount_percent": 15,
            "services": "Beachfront Chalet, Helicopter Island Hopping, Giant Tortoise Sanctuary Tour, Creole Gastronomy Experience, Coral Reef Diving",
            "rating": 4.90,
            "image_url": "https://images.unsplash.com/photo-1589553460732-57ef51160601?auto=format&fit=crop&w=1000&q=85"
        },
        {
            "island": created_islands[5], # Maui Hawaii
            "title": "Maui Wailea Oceanfront Luxury & Helicopter Safari",
            "duration_days": 6,
            "price": 4200.00,
            "discount_percent": 10,
            "services": "Wailea Beach Villa, Road to Hana Guided Tour, Molokini Crater Snorkel, Hawaiian Luau VIP Seating, Sunset Sailing Yacht",
            "rating": 4.93,
            "image_url": "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1000&q=85"
        }
    ]

    created_packages = []
    for data in packages_data:
        p = Package.objects.create(**data)
        created_packages.append(p)

    print("Seeding Customers...")
    customers_data = [
        {
            "name": "Alexander Wright",
            "email": "alex.wright@luxuryescapes.com",
            "phone": "+1 415-890-2134",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            "membership": "Platinum VIP"
        },
        {
            "name": "Sophia Martinez",
            "email": "sophia.m@jetsetter.org",
            "phone": "+44 20-7946-0912",
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
            "membership": "Gold Member"
        },
        {
            "name": "Marcus Vance",
            "email": "marcus.vance@techtravels.io",
            "phone": "+1 310-555-0199",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            "membership": "Platinum VIP"
        },
        {
            "name": "Elena Rostova",
            "email": "elena.r@voyageur.fr",
            "phone": "+33 1-4268-5500",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
            "membership": "Diamond Elite"
        }
    ]

    created_customers = []
    for data in customers_data:
        c = Customer.objects.create(**data)
        created_customers.append(c)

    print("Seeding Sample Bookings & Payments...")
    today = date.today()
    
    b1 = Booking.objects.create(
        customer=created_customers[0],
        package=created_packages[0],
        check_in=today + timedelta(days=14),
        check_out=today + timedelta(days=21),
        guests=2,
        total_price=4249.15, # 15% discount applied
        status='Confirmed'
    )
    Payment.objects.create(
        booking=b1,
        amount=4249.15,
        payment_method='Visa Signature',
        transaction_id='TXN-984210492-MAL',
        status='Success'
    )

    b2 = Booking.objects.create(
        customer=created_customers[1],
        package=created_packages[2],
        check_in=today + timedelta(days=30),
        check_out=today + timedelta(days=36),
        guests=2,
        total_price=5104.00,
        status='Confirmed'
    )
    Payment.objects.create(
        booking=b2,
        amount=5104.00,
        payment_method='Mastercard World Elite',
        transaction_id='TXN-741952108-BOR',
        status='Success'
    )

    b3 = Booking.objects.create(
        customer=created_customers[2],
        package=created_packages[3],
        check_in=today + timedelta(days=5),
        check_out=today + timedelta(days=12),
        guests=1,
        total_price=2319.20,
        status='Confirmed'
    )
    Payment.objects.create(
        booking=b3,
        amount=2319.20,
        payment_method='UPI Instant',
        transaction_id='TXN-330198421-BAL',
        status='Success'
    )

    b4 = Booking.objects.create(
        customer=created_customers[3],
        package=created_packages[4],
        check_in=today + timedelta(days=45),
        check_out=today + timedelta(days=50),
        guests=2,
        total_price=3555.00,
        status='Pending'
    )

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()

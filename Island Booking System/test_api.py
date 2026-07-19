import os
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'island_booking.settings')
django.setup()

from django.test import Client

def run_tests():
    c = Client()
    print("Testing GET /islands/...")
    r = c.get('/islands/')
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'success'
    print(f"-> Found {len(data['data'])} islands.")

    print("Testing POST /islands/add/...")
    new_island = {
        "name": "Bedar Private Atoll",
        "country": "Australia",
        "climate": "Tropical Maritime",
        "best_season": "Jun - Nov",
        "rating": 4.93,
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "description": "Secluded Great Barrier Reef private island.",
        "price_per_night": 990.00,
        "is_featured": True
    }
    r = c.post('/islands/add/', data=json.dumps(new_island), content_type='application/json')
    assert r.status_code == 201
    created_island_id = r.json()['data']['id']
    print(f"-> Island added with ID #{created_island_id}")

    print("Testing PUT /islands/update/<id>/...")
    r = c.put(f'/islands/update/{created_island_id}/', data=json.dumps({"name": "Bedar Sanctuary Atoll"}), content_type='application/json')
    assert r.status_code == 200
    assert r.json()['data']['name'] == "Bedar Sanctuary Atoll"
    print("-> Island updated successfully.")

    print("Testing DELETE /islands/delete/<id>/...")
    r = c.delete(f'/islands/delete/{created_island_id}/')
    assert r.status_code == 200
    print("-> Island deleted successfully.")

    print("Testing GET /packages/...")
    r = c.get('/packages/')
    assert r.status_code == 200
    print(f"-> Found {len(r.json()['data'])} packages.")

    print("Testing GET /customers/...")
    r = c.get('/customers/')
    assert r.status_code == 200
    print(f"-> Found {len(r.json()['data'])} customers.")

    print("Testing GET /bookings/...")
    r = c.get('/bookings/')
    assert r.status_code == 200
    print(f"-> Found {len(r.json()['data'])} bookings.")

    print("Testing GET /payments/...")
    r = c.get('/payments/')
    assert r.status_code == 200
    print(f"-> Found {len(r.json()['data'])} payments.")

    print("\nALL BACKEND API TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    run_tests()

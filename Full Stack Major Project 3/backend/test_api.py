import time
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    print("Starting API integration tests...\n")
    
    # 1. Register a new user
    reg_url = f"{BASE_URL}/register"
    reg_data = {
        "name": "Integration Test User",
        "email": f"testuser_{int(time.time())}@test.com",
        "phone": "9999999999",
        "password": "password123",
        "role": "customer"
    }
    print(f"POST {reg_url}")
    try:
        r = requests.post(reg_url, json=reg_data)
        print(f"Status: {r.status_code}")
        print(r.json())
        assert r.status_code == 201, "Registration failed"
    except Exception as e:
        print(f"Registration Error: {e}")
        return

    # 2. Login the registered user
    login_url = f"{BASE_URL}/login"
    login_data = {
        "email": reg_data["email"],
        "password": "password123"
    }
    print(f"\nPOST {login_url}")
    token = None
    try:
        r = requests.post(login_url, json=login_data)
        print(f"Status: {r.status_code}")
        res = r.json()
        print(res)
        assert r.status_code == 200, "Login failed"
        token = res.get("token")
    except Exception as e:
        print(f"Login Error: {e}")
        return

    # Keep Authorization headers ready
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get profile
    profile_url = f"{BASE_URL}/profile"
    print(f"\nGET {profile_url}")
    try:
        r = requests.get(profile_url, headers=headers)
        print(f"Status: {r.status_code}")
        print(r.json())
        assert r.status_code == 200, "Fetch profile failed"
    except Exception as e:
        print(f"Profile Error: {e}")

    # 4. Get Movies
    movies_url = f"{BASE_URL}/movies"
    print(f"\nGET {movies_url}")
    movie_id = None
    try:
        r = requests.get(movies_url)
        print(f"Status: {r.status_code}")
        res = r.json()
        print(f"Found {len(res)} movies.")
        if len(res) > 0:
            movie_id = res[0]["_id"]
            print(f"Selected Movie: {res[0]['title']} (ID: {movie_id})")
        assert r.status_code == 200, "Fetch movies failed"
    except Exception as e:
        print(f"Movies Error: {e}")

    # 5. Get Shows for Selected Movie
    if movie_id:
        shows_url = f"{BASE_URL}/shows/movie/{movie_id}"
        print(f"\nGET {shows_url}")
        show_id = None
        try:
            r = requests.get(shows_url)
            print(f"Status: {r.status_code}")
            res = r.json()
            print(f"Found {len(res)} shows.")
            if len(res) > 0:
                show_id = res[0]["_id"]
                print(f"Selected Show: {res[0]['showTime']} on {res[0]['showDate']} (ID: {show_id})")
            assert r.status_code == 200, "Fetch shows failed"
        except Exception as e:
            print(f"Shows Error: {e}")

        # 6. Check Available Seats
        if show_id:
            seats_url = f"{BASE_URL}/seats/{show_id}"
            print(f"\nGET {seats_url}")
            try:
                r = requests.get(seats_url)
                print(f"Status: {r.status_code}")
                res = r.json()
                print(f"Available Seats Details: Total={res.get('totalSeats')}, Booked={res.get('bookedSeats')}")
                assert r.status_code == 200, "Get seats failed"
            except Exception as e:
                print(f"Seats Error: {e}")

            # 7. Create a Booking
            booking_url = f"{BASE_URL}/bookings"
            booking_data = {
                "showId": show_id,
                "seats": ["B1", "B2"],
                "paymentMethod": "Credit Card"
            }
            print(f"\nPOST {booking_url}")
            booking_id = None
            try:
                r = requests.post(booking_url, json=booking_data, headers=headers)
                print(f"Status: {r.status_code}")
                res = r.json()
                print(res)
                assert r.status_code == 201, "Create booking failed"
                booking_id = res.get("booking", {}).get("_id")
            except Exception as e:
                print(f"Booking Error: {e}")

            # 8. Check Booked Seats again
            print(f"\nGET {seats_url} (After booking)")
            try:
                r = requests.get(seats_url)
                print(f"Status: {r.status_code}")
                res = r.json()
                print(f"Booked Seats: {res.get('bookedSeats')}")
                assert "B1" in res.get("bookedSeats"), "B1 seat should be booked"
            except Exception as e:
                print(f"Seats re-check Error: {e}")

            # 9. Cancel booking
            if booking_id:
                cancel_url = f"{BASE_URL}/bookings/{booking_id}"
                print(f"\nDELETE {cancel_url} (Cancel booking)")
                try:
                    r = requests.delete(cancel_url, headers=headers)
                    print(f"Status: {r.status_code}")
                    res = r.json()
                    print(res)
                    assert r.status_code == 200, "Cancel booking failed"
                    assert res.get("booking", {}).get("status") == "Cancelled", "Booking status should be Cancelled"
                except Exception as e:
                    print(f"Cancel Booking Error: {e}")

    # 10. Admin Login & Dashboard Check
    admin_login_data = {
        "email": "admin@movies.com",
        "password": "admin123"
    }
    print(f"\nPOST {login_url} (Admin Login)")
    admin_token = None
    try:
        r = requests.post(login_url, json=admin_login_data)
        print(f"Status: {r.status_code}")
        res = r.json()
        assert r.status_code == 200, "Admin login failed"
        admin_token = res.get("token")
    except Exception as e:
        print(f"Admin Login Error: {e}")
        return

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    dashboard_url = f"{BASE_URL}/dashboard"
    print(f"\nGET {dashboard_url}")
    try:
        r = requests.get(dashboard_url, headers=admin_headers)
        print(f"Status: {r.status_code}")
        print(r.json())
        assert r.status_code == 200, "Dashboard fetch failed"
    except Exception as e:
        print(f"Dashboard Error: {e}")

    print("\nAPI Integration flow test completed successfully!")

if __name__ == "__main__":
    test_flow()

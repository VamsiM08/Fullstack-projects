import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(f"{BASE_URL}{url}", method=method)
    req.add_header('Content-Type', 'application/json')
    body = json.dumps(data).encode('utf-8') if data else None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 500, {"error": str(e)}

def test_all():
    print("--- TESTING USER APIS ---")
    st, res = make_request("/users/")
    print(f"GET /users/: {st} - {len(res)} users found")

    st, res = make_request("/users/add/", method="POST", data={
        "user_id": 105,
        "full_name": "Test User",
        "email": "test@gmail.com",
        "phone": "9999999999",
        "city": "Chennai",
        "password": "testpass"
    })
    print(f"POST /users/add/: {st}")

    st, res = make_request("/users/update/105/", method="PUT", data={"city": "Kolkata"})
    print(f"PUT /users/update/105/: {st} - City: {res.get('city')}")

    st, res = make_request("/users/delete/105/", method="DELETE")
    print(f"DELETE /users/delete/105/: {st}")

    print("\n--- TESTING EVENT APIS ---")
    st, res = make_request("/events/")
    print(f"GET /events/: {st} - {len(res)} events found")

    st, res = make_request("/events/add/", method="POST", data={
        "event_id": 209,
        "event_name": "Test Event",
        "category": "Seminar",
        "organizer_name": "Test Org",
        "event_date": "2026-12-01",
        "event_time": "11:00",
        "venue": "Test Center",
        "ticket_price": 500,
        "available_tickets": 100
    })
    print(f"POST /events/add/: {st}")

    st, res = make_request("/events/delete/209/", method="DELETE")
    print(f"DELETE /events/delete/209/: {st}")

    print("\n--- TESTING VENUE APIS ---")
    st, res = make_request("/venues/")
    print(f"GET /venues/: {st} - {len(res)} venues found")

    print("\n--- TESTING BOOKING APIS ---")
    st, res = make_request("/bookings/")
    print(f"GET /bookings/: {st} - {len(res)} bookings found")

    print("\n--- TESTING PAYMENT APIS ---")
    st, res = make_request("/payments/")
    print(f"GET /payments/: {st} - {len(res)} payments found")

    print("\nALL BACKEND API TESTS COMPLETED!")

if __name__ == "__main__":
    test_all()

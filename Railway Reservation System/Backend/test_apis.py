import urllib.request
import json

BASE = "http://127.0.0.1:8000"

def test_endpoint(url, method="GET", data=None):
    req = urllib.request.Request(f"{BASE}{url}", method=method)
    req.add_header('Content-Type', 'application/json')
    body = json.dumps(data).encode('utf-8') if data else None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_body = response.read().decode()
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def run_tests():
    print("Testing 20 REST API endpoints...")
    
    # 1. Passengers
    status, res = test_endpoint("/passengers/")
    assert status == 200 and len(res) >= 1, "GET /passengers/ failed"
    print("[OK] GET /passengers/")

    status, res = test_endpoint("/passengers/add/", "POST", {
        "passenger_id": 999, "full_name": "Test User", "email": "test@user.com",
        "phone": "9900112233", "gender": "Male", "age": 30, "address": "Test City", "password": "pass"
    })
    assert status in [200, 201], "POST /passengers/add/ failed"
    print("[OK] POST /passengers/add/")

    status, res = test_endpoint("/passengers/update/999/", "PUT", {"full_name": "Updated User"})
    assert status == 200, "PUT /passengers/update/999/ failed"
    print("[OK] PUT /passengers/update/<id>/")

    status, res = test_endpoint("/passengers/delete/999/", "DELETE")
    assert status == 200, "DELETE /passengers/delete/999/ failed"
    print("[OK] DELETE /passengers/delete/<id>/")

    # 2. Trains
    status, res = test_endpoint("/trains/")
    assert status == 200 and len(res) >= 1, "GET /trains/ failed"
    print("[OK] GET /trains/")

    status, res = test_endpoint("/trains/add/", "POST", {
        "train_id": 888, "train_name": "Test Express", "train_number": "99988",
        "train_type": "Express", "total_seats": 500, "source": "CityA", "destination": "CityB"
    })
    assert status in [200, 201], "POST /trains/add/ failed"
    print("[OK] POST /trains/add/")

    status, res = test_endpoint("/trains/update/888/", "PUT", {"total_seats": 600})
    assert status == 200, "PUT /trains/update/888/ failed"
    print("[OK] PUT /trains/update/<id>/")

    status, res = test_endpoint("/trains/delete/888/", "DELETE")
    assert status == 200, "DELETE /trains/delete/888/ failed"
    print("[OK] DELETE /trains/delete/<id>/")

    # 3. Schedules
    status, res = test_endpoint("/schedules/")
    assert status == 200 and len(res) >= 1, "GET /schedules/ failed"
    print("[OK] GET /schedules/")

    status, res = test_endpoint("/schedules/add/", "POST", {
        "schedule_id": 777, "train_name": "Vande Bharat Express", "source": "CityA",
        "destination": "CityB", "departure_date": "2026-09-01", "departure_time": "08:00",
        "arrival_date": "2026-09-01", "arrival_time": "12:00", "fare": 1500.0
    })
    assert status in [200, 201], "POST /schedules/add/ failed"
    print("[OK] POST /schedules/add/")

    status, res = test_endpoint("/schedules/update/777/", "PUT", {"fare": 1600.0})
    assert status == 200, "PUT /schedules/update/777/ failed"
    print("[OK] PUT /schedules/update/<id>/")

    status, res = test_endpoint("/schedules/delete/777/", "DELETE")
    assert status == 200, "DELETE /schedules/delete/777/ failed"
    print("[OK] DELETE /schedules/delete/<id>/")

    # 4. Bookings
    status, res = test_endpoint("/bookings/")
    assert status == 200 and len(res) >= 1, "GET /bookings/ failed"
    print("[OK] GET /bookings/")

    status, res = test_endpoint("/bookings/add/", "POST", {
        "booking_id": 666, "passenger_name": "Rahul Sharma", "train_name": "Vande Bharat Express",
        "journey_date": "2026-08-15", "source": "Chennai", "destination": "Bangalore",
        "coach_type": "Chair Car", "seat_number": "C5-99", "total_fare": 1200.0, "booking_status": "Confirmed"
    })
    assert status in [200, 201], "POST /bookings/add/ failed"
    print("[OK] POST /bookings/add/")

    status, res = test_endpoint("/bookings/update/666/", "PUT", {"booking_status": "RAC"})
    assert status == 200, "PUT /bookings/update/666/ failed"
    print("[OK] PUT /bookings/update/<id>/")

    status, res = test_endpoint("/bookings/delete/666/", "DELETE")
    assert status == 200, "DELETE /bookings/delete/666/ failed"
    print("[OK] DELETE /bookings/delete/<id>/")

    # 5. Payments
    status, res = test_endpoint("/payments/")
    assert status == 200 and len(res) >= 1, "GET /payments/ failed"
    print("[OK] GET /payments/")

    status, res = test_endpoint("/payments/add/", "POST", {
        "payment_id": 555, "booking_id": 401, "passenger_name": "Rahul Sharma",
        "amount": 1200.0, "payment_method": "UPI", "payment_status": "Success",
        "transaction_id": "TXN999000111", "payment_date": "2026-08-10"
    })
    assert status in [200, 201], "POST /payments/add/ failed"
    print("[OK] POST /payments/add/")

    status, res = test_endpoint("/payments/update/555/", "PUT", {"payment_status": "Success"})
    assert status == 200, "PUT /payments/update/555/ failed"
    print("[OK] PUT /payments/update/<id>/")

    status, res = test_endpoint("/payments/delete/555/", "DELETE")
    assert status == 200, "DELETE /payments/delete/555/ failed"
    print("[OK] DELETE /payments/delete/<id>/")

    print("\nALL 20 API ENDPOINTS PASSED VERIFICATION PERFECTLY!")

if __name__ == "__main__":
    run_tests()

import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Starting Event Registration Management API Tests...")
    
    # 1. Clean up first (in case previous tests ran)
    print("\n--- Cleaning up potential test records ---")
    test_ids = [9991, 9992, 1001, 1002, 1003, 1004, 1005]
    for p_id in test_ids:
        try:
            requests.delete(f"{BASE_URL}/participants/delete/{p_id}/")
        except Exception:
            pass

    # 2. Test GET /participants/ (Initial fetch)
    print("\n--- Testing GET /participants/ ---")
    response = requests.get(f"{BASE_URL}/participants/")
    if response.status_code == 200:
        initial_list = response.json()
        print(f"SUCCESS: GET /participants/ returned {len(initial_list)} participants")
    else:
        print(f"FAILED: GET /participants/ returned code {response.status_code}")
        sys.exit(1)

    # 3. Test POST /participants/add/ (Insert new participant)
    print("\n--- Testing POST /participants/add/ ---")
    test_participant = {
        "participant_id": 9991,
        "full_name": "Test Participant 1",
        "email": "test1@gmail.com",
        "phone": "9876543210",
        "college": "Test University One",
        "event_name": "Test Hackathon",
        "registration_fee": 500
    }
    response = requests.post(f"{BASE_URL}/participants/add/", json=test_participant)
    if response.status_code == 201:
        data = response.json()
        print("SUCCESS: POST /participants/add/ returned 201")
        print("Response data:", data)
    else:
        print(f"FAILED: POST /participants/add/ returned code {response.status_code}: {response.text}")
        sys.exit(1)

    # 4. Test duplicate POST /participants/add/ (Should fail with 409 Conflict)
    print("\n--- Testing duplicate POST /participants/add/ ---")
    response = requests.post(f"{BASE_URL}/participants/add/", json=test_participant)
    if response.status_code == 409:
        print("SUCCESS: POST with duplicate ID correctly failed with 409 Conflict")
    else:
        print(f"FAILED: Duplicate POST returned code {response.status_code} (expected 409)")
        sys.exit(1)

    # 5. Test PUT /participants/update/<participant_id>/ (Update participant details)
    print("\n--- Testing PUT /participants/update/<participant_id>/ ---")
    update_data = {
        "full_name": "Updated Participant 1",
        "registration_fee": 550
    }
    response = requests.put(f"{BASE_URL}/participants/update/9991/", json=update_data)
    if response.status_code == 200:
        data = response.json()
        print("SUCCESS: PUT /participants/update/ returned 200")
        print("Updated participant details:", data)
        # Check if details were actually updated
        updated_p = data["participant"]
        if updated_p["full_name"] == "Updated Participant 1" and updated_p["registration_fee"] == 550.0:
            print("SUCCESS: Fields were updated correctly")
        else:
            print("FAILED: Field values do not match updated data")
            sys.exit(1)
    else:
        print(f"FAILED: PUT /participants/update/ returned code {response.status_code}: {response.text}")
        sys.exit(1)

    # 6. Test DELETE /participants/delete/<participant_id>/ (Delete participant)
    print("\n--- Testing DELETE /participants/delete/<participant_id>/ ---")
    response = requests.delete(f"{BASE_URL}/participants/delete/9991/")
    if response.status_code == 200:
        print("SUCCESS: DELETE returned 200")
        print("Response:", response.json())
    else:
        print(f"FAILED: DELETE returned code {response.status_code}: {response.text}")
        sys.exit(1)

    # 7. Verify deletion via GET
    print("\n--- Verifying deletion with GET ---")
    response = requests.get(f"{BASE_URL}/participants/")
    final_list = response.json()
    deleted_p = [p for p in final_list if p["participant_id"] == 9991]
    if len(deleted_p) == 0:
        print("SUCCESS: Participant was successfully deleted from MongoDB")
    else:
        print("FAILED: Participant still exists in MongoDB")
        sys.exit(1)

    print("\n==============================")
    print("ALL API ENDPOINT TESTS PASSED!")
    print("==============================")

if __name__ == "__main__":
    run_tests()

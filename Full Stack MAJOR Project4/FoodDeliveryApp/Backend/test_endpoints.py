import urllib.request
import urllib.parse
import json
import sys

API_BASE = "http://127.0.0.1:8000"

def make_request(url, method="GET", data=None):
    req_url = f"{API_BASE}{url}"
    headers = {"Content-Type": "application/json"}
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(req_url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}
    except Exception as e:
        print(f"Connection error: {e}")
        return 0, {"error": str(e)}

def run_tests():
    print("="*60)
    print("         GOURMETGO ENDPOINT VERIFICATION REPORT         ")
    print("="*60)
    
    success_count = 0
    total_count = 20
    
    # ----------------- MODULE 1: CUSTOMERS (4 APIs) -----------------
    print("\n--- Testing Module 1: Customers ---")
    
    # 1. POST /customers/add/
    cust_payload = {
        "customer_id": 999,
        "full_name": "Test User",
        "email": "testuser@gmail.com",
        "phone": "9999999999",
        "address": "Admin Tower",
        "city": "Hyderabad"
    }
    status, res = make_request("/customers/add/", "POST", cust_payload)
    if status == 201 and res.get("customer_id") == 999:
        print("[PASS] 1. POST /customers/add/")
        success_count += 1
    else:
        print(f"[FAIL] 1. POST /customers/add/ (Status: {status}, Response: {res})")
        
    # 2. GET /customers/
    status, res = make_request("/customers/")
    if status == 200 and isinstance(res, list) and len(res) > 0:
        print("[PASS] 2. GET /customers/")
        success_count += 1
    else:
        print(f"[FAIL] 2. GET /customers/ (Status: {status})")

    # 3. PUT /customers/update/<id>/
    status, res = make_request("/customers/update/999/", "PUT", {"full_name": "Test User Updated"})
    if status == 200 and res.get("full_name") == "Test User Updated":
        print("[PASS] 3. PUT /customers/update/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 3. PUT /customers/update/<id>/ (Status: {status}, Response: {res})")

    # 4. DELETE /customers/delete/<id>/
    status, res = make_request("/customers/delete/999/", "DELETE")
    if status == 200:
        print("[PASS] 4. DELETE /customers/delete/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 4. DELETE /customers/delete/<id>/ (Status: {status})")


    # ----------------- MODULE 2: RESTAURANTS (4 APIs) -----------------
    print("\n--- Testing Module 2: Restaurants ---")
    
    # 5. POST /restaurants/add/
    rest_payload = {
        "restaurant_id": 888,
        "restaurant_name": "Test Restaurant",
        "owner_name": "Test Owner",
        "location": "Delhi",
        "cuisine": "Continental",
        "rating": 4.5
    }
    status, res = make_request("/restaurants/add/", "POST", rest_payload)
    if status == 201 and res.get("restaurant_id") == 888:
        print("[PASS] 5. POST /restaurants/add/")
        success_count += 1
    else:
        print(f"[FAIL] 5. POST /restaurants/add/ (Status: {status}, Response: {res})")
        
    # 6. GET /restaurants/
    status, res = make_request("/restaurants/")
    if status == 200 and isinstance(res, list):
        print("[PASS] 6. GET /restaurants/")
        success_count += 1
    else:
        print(f"[FAIL] 6. GET /restaurants/ (Status: {status})")

    # 7. PUT /restaurants/update/<id>/
    status, res = make_request("/restaurants/update/888/", "PUT", {"owner_name": "Test Owner Updated"})
    if status == 200 and res.get("owner_name") == "Test Owner Updated":
        print("[PASS] 7. PUT /restaurants/update/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 7. PUT /restaurants/update/<id>/ (Status: {status}, Response: {res})")

    # 8. DELETE /restaurants/delete/<id>/
    status, res = make_request("/restaurants/delete/888/", "DELETE")
    if status == 200:
        print("[PASS] 8. DELETE /restaurants/delete/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 8. DELETE /restaurants/delete/<id>/ (Status: {status})")


    # ----------------- MODULE 3: FOOD MENU (4 APIs) -----------------
    # For food tests, we use the preseeded Spicy Kitchen restaurant
    print("\n--- Testing Module 3: Food Menu ---")
    
    # 9. POST /foods/add/
    food_payload = {
        "food_id": 777,
        "restaurant_name": "Spicy Kitchen",
        "food_name": "Test Curry",
        "category": "Main Course",
        "price": 180.0,
        "availability": "Available"
    }
    status, res = make_request("/foods/add/", "POST", food_payload)
    if status == 201 and res.get("food_id") == 777:
        print("[PASS] 9. POST /foods/add/")
        success_count += 1
    else:
        print(f"[FAIL] 9. POST /foods/add/ (Status: {status}, Response: {res})")
        
    # 10. GET /foods/
    status, res = make_request("/foods/")
    if status == 200 and isinstance(res, list):
        print("[PASS] 10. GET /foods/")
        success_count += 1
    else:
        print(f"[FAIL] 10. GET /foods/ (Status: {status})")

    # 11. PUT /foods/update/<id>/
    status, res = make_request("/foods/update/777/", "PUT", {"price": 195.0})
    if status == 200 and float(res.get("price")) == 195.0:
        print("[PASS] 11. PUT /foods/update/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 11. PUT /foods/update/<id>/ (Status: {status}, Response: {res})")

    # 12. DELETE /foods/delete/<id>/
    status, res = make_request("/foods/delete/777/", "DELETE")
    if status == 200:
        print("[PASS] 12. DELETE /foods/delete/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 12. DELETE /foods/delete/<id>/ (Status: {status})")


    # ----------------- MODULE 4: CART (4 APIs) -----------------
    print("\n--- Testing Module 4: Cart Management ---")
    
    # 13. POST /cart/add/
    cart_payload = {
        "cart_id": 666,
        "customer_name": "Rahul Sharma",
        "food_name": "Veg Noodles",
        "quantity": 1,
        "price": 120.0
    }
    status, res = make_request("/cart/add/", "POST", cart_payload)
    if status in (200, 201) and res.get("cart_id") == 666:
        print("[PASS] 13. POST /cart/add/")
        success_count += 1
    else:
        print(f"[FAIL] 13. POST /cart/add/ (Status: {status}, Response: {res})")
        
    # 14. GET /cart/
    status, res = make_request("/cart/")
    if status == 200 and isinstance(res, list):
        print("[PASS] 14. GET /cart/")
        success_count += 1
    else:
        print(f"[FAIL] 14. GET /cart/ (Status: {status})")

    # 15. PUT /cart/update/<id>/
    status, res = make_request("/cart/update/666/", "PUT", {"quantity": 3})
    if status == 200 and res.get("quantity") == 3:
        print("[PASS] 15. PUT /cart/update/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 15. PUT /cart/update/<id>/ (Status: {status}, Response: {res})")

    # 16. DELETE /cart/delete/<id>/
    status, res = make_request("/cart/delete/666/", "DELETE")
    if status == 200:
        print("[PASS] 16. DELETE /cart/delete/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 16. DELETE /cart/delete/<id>/ (Status: {status})")


    # ----------------- MODULE 5: ORDERS (4 APIs) -----------------
    print("\n--- Testing Module 5: Order Management ---")
    
    # 17. POST /orders/add/
    order_payload = {
        "order_id": 555,
        "customer_name": "Rahul Sharma",
        "restaurant_name": "Spicy Kitchen",
        "order_items": "Veg Noodles x3",
        "total_amount": 360.0,
        "payment_status": "Paid",
        "delivery_status": "Preparing"
    }
    status, res = make_request("/orders/add/", "POST", order_payload)
    if status == 201 and res.get("order_id") == 555:
        print("[PASS] 17. POST /orders/add/")
        success_count += 1
    else:
        print(f"[FAIL] 17. POST /orders/add/ (Status: {status}, Response: {res})")
        
    # 18. GET /orders/
    status, res = make_request("/orders/")
    if status == 200 and isinstance(res, list):
        print("[PASS] 18. GET /orders/")
        success_count += 1
    else:
        print(f"[FAIL] 18. GET /orders/ (Status: {status})")

    # 19. PUT /orders/update/<id>/
    status, res = make_request("/orders/update/555/", "PUT", {"delivery_status": "Out for Delivery"})
    if status == 200 and res.get("delivery_status") == "Out for Delivery":
        print("[PASS] 19. PUT /orders/update/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 19. PUT /orders/update/<id>/ (Status: {status}, Response: {res})")

    # 20. DELETE /orders/delete/<id>/
    status, res = make_request("/orders/delete/555/", "DELETE")
    if status == 200:
        print("[PASS] 20. DELETE /orders/delete/<id>/")
        success_count += 1
    else:
        print(f"[FAIL] 20. DELETE /orders/delete/<id>/ (Status: {status})")

    print("\n" + "="*60)
    print(f"VERIFICATION SUMMARY: {success_count} / {total_count} PASSED")
    print("="*60)
    
    if success_count == total_count:
        print("\nAll 20 endpoints are successfully validated and conform to API specifications!")
        sys.exit(0)
    else:
        print("\nSome tests failed. Please review errors above.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()

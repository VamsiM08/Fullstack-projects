import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_request(url, method, data=None):
    full_url = f"{BASE_URL}{url}"
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(full_url, data=req_data, method=method)
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            err_data = json.loads(res_body)
        except:
            err_data = res_body
        return e.code, err_data

def run_tests():
    print("=== Starting API Tests ===")
    
    # 1. User Management Tests
    print("\n--- Testing User CRUD ---")
    user_data = {
        "user_id": 101,
        "full_name": "Rahul Sharma",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "password": "rahul123",
        "city": "Hyderabad"
    }
    
    # POST /users/add/
    status, res = make_request("/users/add/", "POST", user_data)
    print(f"POST /users/add/: status={status}, response={res}")
    assert status in (200, 201), "User creation failed"
    
    # GET /users/
    status, res = make_request("/users/", "GET")
    print(f"GET /users/: status={status}, count={len(res)}")
    assert status == 200, "Get users failed"
    assert any(u["user_id"] == 101 for u in res), "User 101 not in list"
    
    # PUT /users/update/101/
    update_user_data = user_data.copy()
    update_user_data["city"] = "Bangalore"
    status, res = make_request("/users/update/101/", "PUT", update_user_data)
    print(f"PUT /users/update/101/: status={status}, response={res}")
    assert status == 200 and res["city"] == "Bangalore", "User update failed"

    # 2. Category Management Tests
    print("\n--- Testing Category CRUD ---")
    cat_data = {
        "category_id": 401,
        "category_name": "Food",
        "monthly_limit": 8000,
        "description": "Daily meals and dining"
    }
    # POST /categories/add/
    status, res = make_request("/categories/add/", "POST", cat_data)
    print(f"POST /categories/add/: status={status}, response={res}")
    # Note: 401 might already exist because of default setup, so status could be 400 (Unique check) or 201/200
    
    # GET /categories/
    status, res = make_request("/categories/", "GET")
    print(f"GET /categories/: status={status}, count={len(res)}")
    assert status == 200, "Get categories failed"
    
    # PUT /categories/update/401/
    cat_data["monthly_limit"] = 9000
    status, res = make_request("/categories/update/401/", "PUT", cat_data)
    print(f"PUT /categories/update/401/: status={status}, response={res}")
    assert status == 200 and res["monthly_limit"] == 9000, "Category update failed"

    # 3. Income Management Tests
    print("\n--- Testing Income CRUD ---")
    income_data = {
        "income_id": 201,
        "user_name": "Rahul Sharma",
        "source": "Salary",
        "amount": 60000,
        "received_date": "2026-07-01",
        "description": "Monthly Salary"
    }
    # POST /income/add/
    status, res = make_request("/income/add/", "POST", income_data)
    print(f"POST /income/add/: status={status}, response={res}")
    assert status in (200, 201), "Income creation failed"
    
    # GET /income/
    status, res = make_request("/income/", "GET")
    print(f"GET /income/: status={status}, count={len(res)}")
    assert status == 200, "Get income failed"
    
    # PUT /income/update/201/
    income_data["amount"] = 65000
    status, res = make_request("/income/update/201/", "PUT", income_data)
    print(f"PUT /income/update/201/: status={status}, response={res}")
    assert status == 200 and res["amount"] == 65000, "Income update failed"

    # 4. Expense Management Tests
    print("\n--- Testing Expense CRUD ---")
    expense_data = {
        "expense_id": 301,
        "user_name": "Rahul Sharma",
        "category": "Food",
        "amount": 450,
        "expense_date": "2026-07-05",
        "payment_method": "UPI",
        "description": "Lunch at Restaurant"
    }
    # POST /expenses/add/
    status, res = make_request("/expenses/add/", "POST", expense_data)
    print(f"POST /expenses/add/: status={status}, response={res}")
    assert status in (200, 201), "Expense creation failed"
    
    # GET /expenses/
    status, res = make_request("/expenses/", "GET")
    print(f"GET /expenses/: status={status}, count={len(res)}")
    assert status == 200, "Get expenses failed"
    
    # PUT /expenses/update/301/
    expense_data["amount"] = 500
    status, res = make_request("/expenses/update/301/", "PUT", expense_data)
    print(f"PUT /expenses/update/301/: status={status}, response={res}")
    assert status == 200 and res["amount"] == 500, "Expense update failed"

    # 5. Budget Management Tests
    print("\n--- Testing Budget CRUD ---")
    budget_data = {
        "budget_id": 501,
        "user_name": "Rahul Sharma",
        "month": "July 2026",
        "total_income": 60000,
        "total_expense": 35000,
        "savings": 25000,
        "budget_status": "Under Budget"
    }
    # POST /budgets/add/
    status, res = make_request("/budgets/add/", "POST", budget_data)
    print(f"POST /budgets/add/: status={status}, response={res}")
    assert status in (200, 201), "Budget creation failed"
    
    # GET /budgets/
    status, res = make_request("/budgets/", "GET")
    print(f"GET /budgets/: status={status}, count={len(res)}")
    assert status == 200, "Get budgets failed"
    
    # PUT /budgets/update/501/
    budget_data["savings"] = 26000
    status, res = make_request("/budgets/update/501/", "PUT", budget_data)
    print(f"PUT /budgets/update/501/: status={status}, response={res}")
    assert status == 200 and res["savings"] == 26000, "Budget update failed"

    # 6. Delete operations testing (Clean up test instances or verify DELETE paths)
    print("\n--- Testing DELETE Endpoints ---")
    
    # DELETE /income/delete/201/
    status, res = make_request("/income/delete/201/", "DELETE")
    print(f"DELETE /income/delete/201/: status={status}")
    assert status == 200, "Delete income failed"
    
    # DELETE /expenses/delete/301/
    status, res = make_request("/expenses/delete/301/", "DELETE")
    print(f"DELETE /expenses/delete/301/: status={status}")
    assert status == 200, "Delete expense failed"
    
    # DELETE /budgets/delete/501/
    status, res = make_request("/budgets/delete/501/", "DELETE")
    print(f"DELETE /budgets/delete/501/: status={status}")
    assert status == 200, "Delete budget failed"
    
    # DELETE /users/delete/101/
    status, res = make_request("/users/delete/101/", "DELETE")
    print(f"DELETE /users/delete/101/: status={status}")
    assert status == 200, "Delete user failed"
    
    print("\n=== All Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_tests()

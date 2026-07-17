import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from . import db

def cors_response(data, status=200):
    response = JsonResponse(data, safe=False, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def handle_options(request):
    if request.method == "OPTIONS":
        return cors_response({"detail": "CORS Preflight OK"})
    return None

# ==========================================
# USER VIEWS
# ==========================================

@csrf_exempt
def user_list_add(request):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "GET":
        users = db.get_users()
        return cors_response(users)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            # Schema fields: user_id, full_name, email, phone, password, city
            user_id = data.get("user_id")
            full_name = data.get("full_name")
            email = data.get("email")
            phone = data.get("phone")
            password = data.get("password")
            city = data.get("city")
            
            if not full_name or not email or not password:
                return cors_response({"error": "Missing required fields (full_name, email, password)"}, status=400)
                
            new_user = db.add_user(user_id, full_name, email, phone, password, city)
            return cors_response(new_user, status=201) # Return 201 Created
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def user_update_delete(request, id):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            full_name = data.get("full_name")
            email = data.get("email")
            phone = data.get("phone")
            password = data.get("password")
            city = data.get("city")
            
            if not full_name or not email or not password:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            success = db.update_user(int(id), full_name, email, phone, password, city)
            if success:
                updated_user = db.get_user_by_id(int(id))
                return cors_response(updated_user)
            return cors_response({"error": "User not found or no changes made"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    elif request.method == "DELETE":
        try:
            success = db.delete_user(int(id))
            if success:
                return cors_response({"message": "User deleted successfully"})
            return cors_response({"error": "User not found"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)


# ==========================================
# INCOME VIEWS
# ==========================================

@csrf_exempt
def income_list_add(request):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "GET":
        user_name = request.GET.get("user_name")
        incomes = db.get_incomes(user_name)
        return cors_response(incomes)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            # Schema fields: income_id, user_name, source, amount, received_date, description
            income_id = data.get("income_id")
            user_name = data.get("user_name")
            source = data.get("source")
            amount = data.get("amount")
            received_date = data.get("received_date")
            description = data.get("description")
            
            if not user_name or not source or amount is None or not received_date:
                return cors_response({"error": "Missing required fields (user_name, source, amount, received_date)"}, status=400)
                
            new_income = db.add_income(income_id, user_name, source, float(amount), received_date, description)
            return cors_response(new_income, status=201)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def income_update_delete(request, id):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            user_name = data.get("user_name")
            source = data.get("source")
            amount = data.get("amount")
            received_date = data.get("received_date")
            description = data.get("description")
            
            if not user_name or not source or amount is None or not received_date:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            success = db.update_income(int(id), user_name, source, float(amount), received_date, description)
            if success:
                updated_income = db.get_income_by_id(int(id))
                return cors_response(updated_income)
            return cors_response({"error": "Income not found or no changes made"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    elif request.method == "DELETE":
        try:
            success = db.delete_income(int(id))
            if success:
                return cors_response({"message": "Income record deleted successfully"})
            return cors_response({"error": "Income record not found"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)


# ==========================================
# EXPENSE VIEWS
# ==========================================

@csrf_exempt
def expense_list_add(request):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "GET":
        user_name = request.GET.get("user_name")
        category = request.GET.get("category")
        expenses = db.get_expenses(user_name, category)
        return cors_response(expenses)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            # Schema fields: expense_id, user_name, category, amount, expense_date, payment_method, description
            expense_id = data.get("expense_id")
            user_name = data.get("user_name")
            category = data.get("category")
            amount = data.get("amount")
            expense_date = data.get("expense_date")
            payment_method = data.get("payment_method")
            description = data.get("description")
            
            if not user_name or not category or amount is None or not expense_date or not payment_method:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            new_expense = db.add_expense(expense_id, user_name, category, float(amount), expense_date, payment_method, description)
            return cors_response(new_expense, status=201)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def expense_update_delete(request, id):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            user_name = data.get("user_name")
            category = data.get("category")
            amount = data.get("amount")
            expense_date = data.get("expense_date")
            payment_method = data.get("payment_method")
            description = data.get("description")
            
            if not user_name or not category or amount is None or not expense_date or not payment_method:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            success = db.update_expense(int(id), user_name, category, float(amount), expense_date, payment_method, description)
            if success:
                updated_expense = db.get_expense_by_id(int(id))
                return cors_response(updated_expense)
            return cors_response({"error": "Expense not found or no changes made"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    elif request.method == "DELETE":
        try:
            success = db.delete_expense(int(id))
            if success:
                return cors_response({"message": "Expense deleted successfully"})
            return cors_response({"error": "Expense not found"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)


# ==========================================
# CATEGORY VIEWS
# ==========================================

@csrf_exempt
def category_list_add(request):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "GET":
        categories = db.get_categories()
        return cors_response(categories)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            # Schema fields: category_id, category_name, monthly_limit, description
            category_id = data.get("category_id")
            category_name = data.get("category_name")
            monthly_limit = data.get("monthly_limit")
            description = data.get("description")
            
            if not category_name or monthly_limit is None:
                return cors_response({"error": "Missing required fields (category_name, monthly_limit)"}, status=400)
                
            new_cat = db.add_category(category_id, category_name, float(monthly_limit), description)
            return cors_response(new_cat, status=201)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def category_update_delete(request, id):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            category_name = data.get("category_name")
            monthly_limit = data.get("monthly_limit")
            description = data.get("description")
            
            if not category_name or monthly_limit is None:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            success = db.update_category(int(id), category_name, float(monthly_limit), description)
            if success:
                updated_cat = db.get_category_by_id(int(id))
                return cors_response(updated_cat)
            return cors_response({"error": "Category not found or no changes made"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    elif request.method == "DELETE":
        try:
            success = db.delete_category(int(id))
            if success:
                return cors_response({"message": "Category deleted successfully"})
            return cors_response({"error": "Category not found"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)


# ==========================================
# BUDGET VIEWS
# ==========================================

@csrf_exempt
def budget_list_add(request):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "GET":
        user_name = request.GET.get("user_name")
        budgets = db.get_budgets(user_name)
        return cors_response(budgets)
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            # Schema fields: budget_id, user_name, month, total_income, total_expense, savings, budget_status
            budget_id = data.get("budget_id")
            user_name = data.get("user_name")
            month = data.get("month")
            total_income = data.get("total_income")
            total_expense = data.get("total_expense")
            savings = data.get("savings")
            budget_status = data.get("budget_status")
            
            if not user_name or not month or total_income is None or total_expense is None or savings is None or not budget_status:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            new_budget = db.add_budget(budget_id, user_name, month, float(total_income), float(total_expense), float(savings), budget_status)
            return cors_response(new_budget, status=201)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

@csrf_exempt
def budget_update_delete(request, id):
    options_resp = handle_options(request)
    if options_resp:
        return options_resp

    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            user_name = data.get("user_name")
            month = data.get("month")
            total_income = data.get("total_income")
            total_expense = data.get("total_expense")
            savings = data.get("savings")
            budget_status = data.get("budget_status")
            
            if not user_name or not month or total_income is None or total_expense is None or savings is None or not budget_status:
                return cors_response({"error": "Missing required fields"}, status=400)
                
            success = db.update_budget(int(id), user_name, month, float(total_income), float(total_expense), float(savings), budget_status)
            if success:
                updated_budget = db.get_budget_by_id(int(id))
                return cors_response(updated_budget)
            return cors_response({"error": "Budget not found or no changes made"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    elif request.method == "DELETE":
        try:
            success = db.delete_budget(int(id))
            if success:
                return cors_response({"message": "Budget deleted successfully"})
            return cors_response({"error": "Budget not found"}, status=404)
        except Exception as e:
            return cors_response({"error": str(e)}, status=400)
            
    return cors_response({"error": "Method Not Allowed"}, status=405)

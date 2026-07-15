from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import db

# Helper to check if record exists
def check_exists(item, error_msg="Not found"):
    if item is None:
        return JsonResponse({"error": error_msg}, status=404)
    return JsonResponse(item)

# --- CUSTOMER ENDPOINTS ---
@csrf_exempt
def customer_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required = ['full_name', 'email', 'phone', 'address', 'password']
            for field in required:
                if not data.get(field):
                    return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
            
            # Check if email already exists
            existing = db.execute_query("SELECT * FROM customers WHERE email = ?", (data.get('email'),))
            if existing:
                return JsonResponse({"error": "Email already registered"}, status=400)

            new_customer = db.add_customer(data)
            return JsonResponse(new_customer, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def customer_list(request):
    if request.method == 'GET':
        email = request.GET.get('email')
        password = request.GET.get('password')
        customers = db.get_customers()
        if email and password:
            customers = [c for c in customers if c['email'] == email and c['password'] == password]
        return JsonResponse(customers, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def customer_update(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = db.update_customer(int(id), data)
            if updated:
                return JsonResponse(updated)
            return JsonResponse({"error": "Customer not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def customer_delete(request, id):
    if request.method == 'DELETE':
        try:
            # Check if customer exists
            cust = db.get_customer(int(id))
            if not cust:
                return JsonResponse({"error": "Customer not found"}, status=404)
            db.delete_customer(int(id))
            return JsonResponse({"message": "Customer deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)


# --- RESTAURANT ENDPOINTS ---
@csrf_exempt
def restaurant_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required = ['restaurant_name', 'owner_name', 'cuisine', 'location', 'contact', 'rating']
            for field in required:
                if data.get(field) is None:
                    return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
            
            existing = db.execute_query("SELECT * FROM restaurants WHERE restaurant_name = ?", (data.get('restaurant_name'),))
            if existing:
                return JsonResponse({"error": "Restaurant name already exists"}, status=400)

            new_restaurant = db.add_restaurant(data)
            return JsonResponse(new_restaurant, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def restaurant_list(request):
    if request.method == 'GET':
        name = request.GET.get('name')
        cuisine = request.GET.get('cuisine')
        location = request.GET.get('location')
        restaurants = db.get_restaurants()
        
        # Apply filters if provided
        if name:
            restaurants = [r for r in restaurants if name.lower() in r['restaurant_name'].lower()]
        if cuisine:
            restaurants = [r for r in restaurants if cuisine.lower() in r['cuisine'].lower()]
        if location:
            restaurants = [r for r in restaurants if location.lower() in r['location'].lower()]
            
        return JsonResponse(restaurants, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def restaurant_update(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = db.update_restaurant(int(id), data)
            if updated:
                return JsonResponse(updated)
            return JsonResponse({"error": "Restaurant not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def restaurant_delete(request, id):
    if request.method == 'DELETE':
        try:
            rest = db.get_restaurant(int(id))
            if not rest:
                return JsonResponse({"error": "Restaurant not found"}, status=404)
            db.delete_restaurant(int(id))
            return JsonResponse({"message": "Restaurant deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)


# --- FOOD ENDPOINTS ---
@csrf_exempt
def food_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required = ['food_name', 'restaurant_name', 'category', 'price', 'availability']
            for field in required:
                if data.get(field) is None:
                    return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
            
            new_food = db.add_food(data)
            return JsonResponse(new_food, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def food_list(request):
    if request.method == 'GET':
        restaurant_name = request.GET.get('restaurant_name')
        category = request.GET.get('category')
        foods = db.get_foods()
        
        if restaurant_name:
            foods = [f for f in foods if f['restaurant_name'].lower() == restaurant_name.lower()]
        if category:
            foods = [f for f in foods if f['category'].lower() == category.lower()]
            
        return JsonResponse(foods, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def food_update(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = db.update_food(int(id), data)
            if updated:
                return JsonResponse(updated)
            return JsonResponse({"error": "Food item not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def food_delete(request, id):
    if request.method == 'DELETE':
        try:
            food = db.get_food(int(id))
            if not food:
                return JsonResponse({"error": "Food item not found"}, status=404)
            db.delete_food(int(id))
            return JsonResponse({"message": "Food item deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)


# --- SHOPPING CART ENDPOINTS ---
@csrf_exempt
def cart_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required = ['customer_name', 'food_name', 'quantity', 'price']
            for field in required:
                if data.get(field) is None:
                    return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
            
            new_item = db.add_cart_item(data)
            return JsonResponse(new_item, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def cart_list(request):
    if request.method == 'GET':
        customer_name = request.GET.get('customer_name')
        cart_items = db.get_cart_items()
        
        if customer_name:
            cart_items = [c for c in cart_items if c['customer_name'].lower() == customer_name.lower()]
            
        return JsonResponse(cart_items, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def cart_update(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = db.update_cart_item(int(id), data)
            if updated:
                return JsonResponse(updated)
            return JsonResponse({"error": "Cart item not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def cart_delete(request, id):
    if request.method == 'DELETE':
        try:
            item = db.get_cart_item(int(id))
            if not item:
                return JsonResponse({"error": "Cart item not found"}, status=404)
            db.delete_cart_item(int(id))
            return JsonResponse({"message": "Cart item removed successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)


# --- ORDER ENDPOINTS ---
@csrf_exempt
def order_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required = ['customer_name', 'restaurant_name', 'order_date', 'total_amount', 'payment_method']
            for field in required:
                if data.get(field) is None:
                    return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
            
            new_order = db.add_order(data)
            return JsonResponse(new_order, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def order_list(request):
    if request.method == 'GET':
        customer_name = request.GET.get('customer_name')
        restaurant_name = request.GET.get('restaurant_name')
        orders = db.get_orders()
        
        if customer_name:
            orders = [o for o in orders if o['customer_name'].lower() == customer_name.lower()]
        if restaurant_name:
            orders = [o for o in orders if o['restaurant_name'].lower() == restaurant_name.lower()]
            
        return JsonResponse(orders, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def order_update(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = db.update_order(int(id), data)
            if updated:
                return JsonResponse(updated)
            return JsonResponse({"error": "Order not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def order_delete(request, id):
    if request.method == 'DELETE':
        try:
            order = db.get_order(int(id))
            if not order:
                return JsonResponse({"error": "Order not found"}, status=404)
            db.delete_order(int(id))
            return JsonResponse({"message": "Order deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

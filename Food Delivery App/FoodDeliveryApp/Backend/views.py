import json
import sqlite3
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import db

def rows_to_dict(rows):
    return [dict(row) for row in rows]

# Helper to execute a query and return rows
def execute_query(query, params=(), commit=False, fetch_all=False, fetch_one=False):
    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            return last_id
        if fetch_all:
            return cursor.fetchall()
        if fetch_one:
            return cursor.fetchone()
    except Exception as e:
        print(f"Database Error: {e}")
        raise e
    finally:
        conn.close()

# ----------------- MODULE 1: CUSTOMERS -----------------

@csrf_exempt
@require_http_methods(["POST"])
def add_customer(request):
    try:
        data = json.loads(request.body)
        full_name = data.get("full_name")
        email = data.get("email")
        phone = data.get("phone")
        address = data.get("address")
        city = data.get("city")
        customer_id = data.get("customer_id") # Optional, check if they provide it

        if not all([full_name, email, phone, address, city]):
            return JsonResponse({"error": "Missing required fields (full_name, email, phone, address, city)"}, status=400)
        
        # Check if email already exists
        existing = execute_query("SELECT * FROM customers WHERE email = ?", (email,), fetch_one=True)
        if existing:
            return JsonResponse({"error": f"Customer with email {email} already exists"}, status=400)

        if customer_id:
            # Check if customer_id already exists
            id_exists = execute_query("SELECT * FROM customers WHERE customer_id = ?", (customer_id,), fetch_one=True)
            if id_exists:
                return JsonResponse({"error": f"Customer ID {customer_id} is already taken"}, status=400)
            
            execute_query("""
                INSERT INTO customers (customer_id, full_name, email, phone, address, city)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (customer_id, full_name, email, phone, address, city), commit=True)
            new_id = customer_id
        else:
            new_id = execute_query("""
                INSERT INTO customers (full_name, email, phone, address, city)
                VALUES (?, ?, ?, ?, ?)
            """, (full_name, email, phone, address, city), commit=True)

        created = execute_query("SELECT * FROM customers WHERE customer_id = ?", (new_id,), fetch_one=True)
        return JsonResponse(dict(created), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_customers(request):
    try:
        # Check if user attempts login by passing ?email=...
        email_query = request.GET.get('email')
        if email_query:
            customer = execute_query("SELECT * FROM customers WHERE email = ?", (email_query,), fetch_one=True)
            if customer:
                return JsonResponse(dict(customer), status=200)
            return JsonResponse({"error": "Customer not found"}, status=404)

        rows = execute_query("SELECT * FROM customers ORDER BY customer_id DESC", fetch_all=True)
        return JsonResponse(rows_to_dict(rows), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_customer(request, customer_id):
    try:
        data = json.loads(request.body)
        fields = []
        values = []
        for key in ["full_name", "email", "phone", "address", "city"]:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])
        
        if not fields:
            return JsonResponse({"error": "No update parameters provided"}, status=400)
        
        values.append(customer_id)
        # Check if customer exists
        existing = execute_query("SELECT * FROM customers WHERE customer_id = ?", (customer_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Customer with ID {customer_id} not found"}, status=404)
        
        execute_query(f"UPDATE customers SET {', '.join(fields)} WHERE customer_id = ?", tuple(values), commit=True)
        updated = execute_query("SELECT * FROM customers WHERE customer_id = ?", (customer_id,), fetch_one=True)
        return JsonResponse(dict(updated), status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_customer(request, customer_id):
    try:
        existing = execute_query("SELECT * FROM customers WHERE customer_id = ?", (customer_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Customer with ID {customer_id} not found"}, status=404)
        
        execute_query("DELETE FROM customers WHERE customer_id = ?", (customer_id,), commit=True)
        return JsonResponse({"message": f"Customer {customer_id} deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ----------------- MODULE 2: RESTAURANTS -----------------

@csrf_exempt
@require_http_methods(["POST"])
def add_restaurant(request):
    try:
        data = json.loads(request.body)
        restaurant_name = data.get("restaurant_name")
        owner_name = data.get("owner_name")
        location = data.get("location")
        cuisine = data.get("cuisine")
        rating = data.get("rating", 0.0)
        restaurant_id = data.get("restaurant_id")

        if not all([restaurant_name, owner_name, location, cuisine]):
            return JsonResponse({"error": "Missing required fields (restaurant_name, owner_name, location, cuisine)"}, status=400)

        existing = execute_query("SELECT * FROM restaurants WHERE restaurant_name = ?", (restaurant_name,), fetch_one=True)
        if existing:
            return JsonResponse({"error": f"Restaurant '{restaurant_name}' already exists"}, status=400)

        if restaurant_id:
            id_exists = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), fetch_one=True)
            if id_exists:
                return JsonResponse({"error": f"Restaurant ID {restaurant_id} is already taken"}, status=400)
            
            execute_query("""
                INSERT INTO restaurants (restaurant_id, restaurant_name, owner_name, location, cuisine, rating)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (restaurant_id, restaurant_name, owner_name, location, cuisine, rating), commit=True)
            new_id = restaurant_id
        else:
            new_id = execute_query("""
                INSERT INTO restaurants (restaurant_name, owner_name, location, cuisine, rating)
                VALUES (?, ?, ?, ?, ?)
            """, (restaurant_name, owner_name, location, cuisine, rating), commit=True)

        created = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (new_id,), fetch_one=True)
        return JsonResponse(dict(created), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_restaurants(request):
    try:
        # Search & Filter
        search_query = request.GET.get('search')
        cuisine_filter = request.GET.get('cuisine')
        location_filter = request.GET.get('location')
        
        sql = "SELECT * FROM restaurants"
        params = []
        conditions = []
        
        if search_query:
            conditions.append("(restaurant_name LIKE ? OR cuisine LIKE ? OR location LIKE ?)")
            like_pat = f"%{search_query}%"
            params.extend([like_pat, like_pat, like_pat])
        if cuisine_filter:
            conditions.append("cuisine = ?")
            params.append(cuisine_filter)
        if location_filter:
            conditions.append("location = ?")
            params.append(location_filter)
            
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY rating DESC"
        
        rows = execute_query(sql, tuple(params), fetch_all=True)
        return JsonResponse(rows_to_dict(rows), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_restaurant(request, restaurant_id):
    try:
        data = json.loads(request.body)
        fields = []
        values = []
        for key in ["restaurant_name", "owner_name", "location", "cuisine", "rating"]:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])
        
        if not fields:
            return JsonResponse({"error": "No update parameters provided"}, status=400)
        
        values.append(restaurant_id)
        existing = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Restaurant with ID {restaurant_id} not found"}, status=404)
        
        execute_query(f"UPDATE restaurants SET {', '.join(fields)} WHERE restaurant_id = ?", tuple(values), commit=True)
        updated = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), fetch_one=True)
        return JsonResponse(dict(updated), status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_restaurant(request, restaurant_id):
    try:
        existing = execute_query("SELECT * FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Restaurant with ID {restaurant_id} not found"}, status=404)
        
        execute_query("DELETE FROM restaurants WHERE restaurant_id = ?", (restaurant_id,), commit=True)
        return JsonResponse({"message": f"Restaurant {restaurant_id} deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ----------------- MODULE 3: FOOD MENU -----------------

@csrf_exempt
@require_http_methods(["POST"])
def add_food(request):
    try:
        data = json.loads(request.body)
        restaurant_name = data.get("restaurant_name")
        food_name = data.get("food_name")
        category = data.get("category")
        price = data.get("price")
        availability = data.get("availability", "Available")
        food_id = data.get("food_id")

        if not all([restaurant_name, food_name, category, price]):
            return JsonResponse({"error": "Missing required fields (restaurant_name, food_name, category, price)"}, status=400)

        # Check if restaurant exists (optional, let's just make sure it's valid)
        rest_exists = execute_query("SELECT * FROM restaurants WHERE restaurant_name = ?", (restaurant_name,), fetch_one=True)
        if not rest_exists:
            return JsonResponse({"error": f"Restaurant '{restaurant_name}' does not exist"}, status=400)

        if food_id:
            id_exists = execute_query("SELECT * FROM foods WHERE food_id = ?", (food_id,), fetch_one=True)
            if id_exists:
                return JsonResponse({"error": f"Food ID {food_id} is already taken"}, status=400)
            
            execute_query("""
                INSERT INTO foods (food_id, restaurant_name, food_name, category, price, availability)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (food_id, restaurant_name, food_name, category, price, availability), commit=True)
            new_id = food_id
        else:
            new_id = execute_query("""
                INSERT INTO foods (restaurant_name, food_name, category, price, availability)
                VALUES (?, ?, ?, ?, ?)
            """, (restaurant_name, food_name, category, price, availability), commit=True)

        created = execute_query("SELECT * FROM foods WHERE food_id = ?", (new_id,), fetch_one=True)
        return JsonResponse(dict(created), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_foods(request):
    try:
        restaurant_name = request.GET.get('restaurant_name')
        search_query = request.GET.get('search')
        
        sql = "SELECT * FROM foods"
        params = []
        conditions = []
        
        if restaurant_name:
            conditions.append("restaurant_name = ?")
            params.append(restaurant_name)
        if search_query:
            conditions.append("(food_name LIKE ? OR category LIKE ?)")
            like_pat = f"%{search_query}%"
            params.extend([like_pat, like_pat])
            
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY category, food_name"
        
        rows = execute_query(sql, tuple(params), fetch_all=True)
        return JsonResponse(rows_to_dict(rows), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_food(request, food_id):
    try:
        data = json.loads(request.body)
        fields = []
        values = []
        for key in ["restaurant_name", "food_name", "category", "price", "availability"]:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])
                
        if not fields:
            return JsonResponse({"error": "No update parameters provided"}, status=400)
            
        values.append(food_id)
        existing = execute_query("SELECT * FROM foods WHERE food_id = ?", (food_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Food item with ID {food_id} not found"}, status=404)
            
        execute_query(f"UPDATE foods SET {', '.join(fields)} WHERE food_id = ?", tuple(values), commit=True)
        updated = execute_query("SELECT * FROM foods WHERE food_id = ?", (food_id,), fetch_one=True)
        return JsonResponse(dict(updated), status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_food(request, food_id):
    try:
        existing = execute_query("SELECT * FROM foods WHERE food_id = ?", (food_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Food item with ID {food_id} not found"}, status=404)
            
        execute_query("DELETE FROM foods WHERE food_id = ?", (food_id,), commit=True)
        return JsonResponse({"message": f"Food item {food_id} deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ----------------- MODULE 4: CART MANAGEMENT -----------------

@csrf_exempt
@require_http_methods(["POST"])
def add_cart_item(request):
    try:
        data = json.loads(request.body)
        customer_name = data.get("customer_name")
        food_name = data.get("food_name")
        quantity = data.get("quantity")
        price = data.get("price")
        cart_id = data.get("cart_id")

        if not all([customer_name, food_name, quantity, price]):
            return JsonResponse({"error": "Missing required fields (customer_name, food_name, quantity, price)"}, status=400)

        total_price = quantity * price

        # Standard check: if item is already in this customer's cart, increment quantity instead!
        existing = execute_query(
            "SELECT * FROM cart WHERE customer_name = ? AND food_name = ?", 
            (customer_name, food_name), 
            fetch_one=True
        )
        
        if existing:
            new_qty = existing['quantity'] + quantity
            new_total = new_qty * price
            execute_query(
                "UPDATE cart SET quantity = ?, total_price = ? WHERE cart_id = ?",
                (new_qty, new_total, existing['cart_id']),
                commit=True
            )
            updated = execute_query("SELECT * FROM cart WHERE cart_id = ?", (existing['cart_id'],), fetch_one=True)
            return JsonResponse(dict(updated), status=200)
            
        # Insert new item
        if cart_id:
            id_exists = execute_query("SELECT * FROM cart WHERE cart_id = ?", (cart_id,), fetch_one=True)
            if id_exists:
                return JsonResponse({"error": f"Cart ID {cart_id} is already taken"}, status=400)
            
            execute_query("""
                INSERT INTO cart (cart_id, customer_name, food_name, quantity, price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (cart_id, customer_name, food_name, quantity, price, total_price), commit=True)
            new_id = cart_id
        else:
            new_id = execute_query("""
                INSERT INTO cart (customer_name, food_name, quantity, price, total_price)
                VALUES (?, ?, ?, ?, ?)
            """, (customer_name, food_name, quantity, price, total_price), commit=True)

        created = execute_query("SELECT * FROM cart WHERE cart_id = ?", (new_id,), fetch_one=True)
        return JsonResponse(dict(created), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_cart_items(request):
    try:
        customer_name = request.GET.get('customer_name')
        if customer_name:
            rows = execute_query("SELECT * FROM cart WHERE customer_name = ? ORDER BY cart_id DESC", (customer_name,), fetch_all=True)
        else:
            rows = execute_query("SELECT * FROM cart ORDER BY cart_id DESC", fetch_all=True)
        return JsonResponse(rows_to_dict(rows), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_cart_item(request, cart_id):
    try:
        data = json.loads(request.body)
        existing = execute_query("SELECT * FROM cart WHERE cart_id = ?", (cart_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Cart item with ID {cart_id} not found"}, status=404)
        
        # Calculate new total price if quantity or price is changing
        quantity = data.get("quantity", existing["quantity"])
        price = data.get("price", existing["price"])
        total_price = quantity * price

        fields = []
        values = []
        for key in ["customer_name", "food_name"]:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])
        
        fields.append("quantity = ?")
        values.append(quantity)
        fields.append("price = ?")
        values.append(price)
        fields.append("total_price = ?")
        values.append(total_price)

        values.append(cart_id)
        execute_query(f"UPDATE cart SET {', '.join(fields)} WHERE cart_id = ?", tuple(values), commit=True)
        updated = execute_query("SELECT * FROM cart WHERE cart_id = ?", (cart_id,), fetch_one=True)
        return JsonResponse(dict(updated), status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_cart_item(request, cart_id):
    try:
        existing = execute_query("SELECT * FROM cart WHERE cart_id = ?", (cart_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Cart item with ID {cart_id} not found"}, status=404)
            
        execute_query("DELETE FROM cart WHERE cart_id = ?", (cart_id,), commit=True)
        return JsonResponse({"message": f"Cart item {cart_id} deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ----------------- MODULE 5: ORDER MANAGEMENT -----------------

@csrf_exempt
@require_http_methods(["POST"])
def add_order(request):
    try:
        data = json.loads(request.body)
        customer_name = data.get("customer_name")
        restaurant_name = data.get("restaurant_name")
        order_items = data.get("order_items")
        total_amount = data.get("total_amount")
        payment_status = data.get("payment_status", "Pending")
        delivery_status = data.get("delivery_status", "Preparing")
        order_id = data.get("order_id")

        if not all([customer_name, restaurant_name, order_items, total_amount]):
            return JsonResponse({"error": "Missing required fields (customer_name, restaurant_name, order_items, total_amount)"}, status=400)

        if order_id:
            id_exists = execute_query("SELECT * FROM orders WHERE order_id = ?", (order_id,), fetch_one=True)
            if id_exists:
                return JsonResponse({"error": f"Order ID {order_id} is already taken"}, status=400)
            
            execute_query("""
                INSERT INTO orders (order_id, customer_name, restaurant_name, order_items, total_amount, payment_status, delivery_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (order_id, customer_name, restaurant_name, order_items, total_amount, payment_status, delivery_status), commit=True)
            new_id = order_id
        else:
            new_id = execute_query("""
                INSERT INTO orders (customer_name, restaurant_name, order_items, total_amount, payment_status, delivery_status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (customer_name, restaurant_name, order_items, total_amount, payment_status, delivery_status), commit=True)

        # Clean cart after placing order
        execute_query("DELETE FROM cart WHERE customer_name = ?", (customer_name,), commit=True)

        created = execute_query("SELECT * FROM orders WHERE order_id = ?", (new_id,), fetch_one=True)
        return JsonResponse(dict(created), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_orders(request):
    try:
        customer_name = request.GET.get('customer_name')
        if customer_name:
            rows = execute_query("SELECT * FROM orders WHERE customer_name = ? ORDER BY order_id DESC", (customer_name,), fetch_all=True)
        else:
            rows = execute_query("SELECT * FROM orders ORDER BY order_id DESC", fetch_all=True)
        return JsonResponse(rows_to_dict(rows), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_order(request, order_id):
    try:
        data = json.loads(request.body)
        fields = []
        values = []
        for key in ["customer_name", "restaurant_name", "order_items", "total_amount", "payment_status", "delivery_status"]:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if not fields:
            return JsonResponse({"error": "No update parameters provided"}, status=400)
            
        values.append(order_id)
        existing = execute_query("SELECT * FROM orders WHERE order_id = ?", (order_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Order with ID {order_id} not found"}, status=404)

        execute_query(f"UPDATE orders SET {', '.join(fields)} WHERE order_id = ?", tuple(values), commit=True)
        updated = execute_query("SELECT * FROM orders WHERE order_id = ?", (order_id,), fetch_one=True)
        return JsonResponse(dict(updated), status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_order(request, order_id):
    try:
        existing = execute_query("SELECT * FROM orders WHERE order_id = ?", (order_id,), fetch_one=True)
        if not existing:
            return JsonResponse({"error": f"Order with ID {order_id} not found"}, status=404)

        execute_query("DELETE FROM orders WHERE order_id = ?", (order_id,), commit=True)
        return JsonResponse({"message": f"Order {order_id} deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

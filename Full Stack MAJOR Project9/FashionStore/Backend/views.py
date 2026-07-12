from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import db

class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS':
            response = HttpResponse()
        else:
            response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

def parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return None

# --- CUSTOMER VIEWS ---

@csrf_exempt
def customer_list_or_add(request):
    if request.method == 'GET':
        customers = db.get_customers()
        return JsonResponse(customers, safe=False)
    
    elif request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
        
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        address = data.get('address')
        city = data.get('city')
        password = data.get('password', 'password123') # default if not provided
        
        if not (full_name and email and phone and address and city):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        customer_id = db.add_customer(full_name, email, phone, address, city, password)
        if customer_id:
            return JsonResponse({
                'message': 'Customer registered successfully',
                'customer_id': customer_id,
                'full_name': full_name,
                'email': email,
                'phone': phone,
                'address': address,
                'city': city
            }, status=201)
        else:
            return JsonResponse({'error': 'Email already exists'}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def customer_update_delete(request, id):
    if request.method == 'PUT':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        address = data.get('address')
        city = data.get('city')
        password = data.get('password')
        
        if not (full_name and email and phone and address and city):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        success = db.update_customer(id, full_name, email, phone, address, city, password)
        if success:
            return JsonResponse({'message': 'Customer updated successfully'})
        else:
            return JsonResponse({'error': 'Customer not found or no changes made'}, status=404)
            
    elif request.method == 'DELETE':
        success = db.delete_customer(id)
        if success:
            return JsonResponse({'message': 'Customer deleted successfully'})
        else:
            return JsonResponse({'error': 'Customer not found'}, status=404)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def customer_login(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        email = data.get('email')
        password = data.get('password')
        
        if not (email and password):
            return JsonResponse({'error': 'Missing email or password'}, status=400)
            
        customer = db.get_customer_by_email(email)
        if customer and customer['password'] == password:
            # Check if admin
            is_admin = (email == 'admin@gmail.com')
            return JsonResponse({
                'message': 'Login successful',
                'customer': {
                    'customer_id': customer['customer_id'],
                    'full_name': customer['full_name'],
                    'email': customer['email'],
                    'phone': customer['phone'],
                    'address': customer['address'],
                    'city': customer['city'],
                    'is_admin': is_admin
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- CATEGORY VIEWS ---

@csrf_exempt
def category_list_or_add(request):
    if request.method == 'GET':
        categories = db.get_categories()
        return JsonResponse(categories, safe=False)
        
    elif request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        category_name = data.get('category_name')
        description = data.get('description')
        
        if not (category_name and description):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        category_id = db.add_category(category_name, description)
        if category_id:
            return JsonResponse({
                'message': 'Category added successfully',
                'category_id': category_id,
                'category_name': category_name,
                'description': description
            }, status=201)
        else:
            return JsonResponse({'error': 'Category name already exists'}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def category_update_delete(request, id):
    if request.method == 'PUT':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        category_name = data.get('category_name')
        description = data.get('description')
        
        if not (category_name and description):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        success = db.update_category(id, category_name, description)
        if success:
            return JsonResponse({'message': 'Category updated successfully'})
        else:
            return JsonResponse({'error': 'Category not found or name already exists'}, status=404)
            
    elif request.method == 'DELETE':
        success = db.delete_category(id)
        if success:
            return JsonResponse({'message': 'Category deleted successfully'})
        else:
            return JsonResponse({'error': 'Category not found'}, status=404)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- PRODUCT VIEWS ---

@csrf_exempt
def product_list_or_add(request):
    if request.method == 'GET':
        category = request.GET.get('category')
        search = request.GET.get('search')
        products = db.get_products(category=category, search=search)
        return JsonResponse(products, safe=False)
        
    elif request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        product_name = data.get('product_name')
        category = data.get('category')
        brand = data.get('brand')
        size = data.get('size')
        color = data.get('color')
        price = data.get('price')
        stock = data.get('stock')
        image_url = data.get('image_url')
        
        if not (product_name and category and brand and size and color and price is not None and stock is not None and image_url):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        product_id = db.add_product(product_name, category, brand, size, color, float(price), int(stock), image_url)
        return JsonResponse({
            'message': 'Product added successfully',
            'product_id': product_id,
            'product_name': product_name,
            'category': category,
            'brand': brand,
            'size': size,
            'color': color,
            'price': price,
            'stock': stock,
            'image_url': image_url
        }, status=201)
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def product_update_delete(request, id):
    if request.method == 'PUT':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        product_name = data.get('product_name')
        category = data.get('category')
        brand = data.get('brand')
        size = data.get('size')
        color = data.get('color')
        price = data.get('price')
        stock = data.get('stock')
        image_url = data.get('image_url')
        
        if not (product_name and category and brand and size and color and price is not None and stock is not None and image_url):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        success = db.update_product(id, product_name, category, brand, size, color, float(price), int(stock), image_url)
        if success:
            return JsonResponse({'message': 'Product updated successfully'})
        else:
            return JsonResponse({'error': 'Product not found'}, status=404)
            
    elif request.method == 'DELETE':
        success = db.delete_product(id)
        if success:
            return JsonResponse({'message': 'Product deleted successfully'})
        else:
            return JsonResponse({'error': 'Product not found'}, status=404)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- CART VIEWS ---

@csrf_exempt
def cart_list_or_add(request):
    if request.method == 'GET':
        customer_name = request.GET.get('customer_name')
        cart_items = db.get_cart_items(customer_name=customer_name)
        return JsonResponse(cart_items, safe=False)
        
    elif request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        customer_name = data.get('customer_name')
        product_name = data.get('product_name')
        quantity = data.get('quantity')
        price = data.get('price')
        
        if not (customer_name and product_name and quantity is not None and price is not None):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        quantity = int(quantity)
        price = float(price)
        total_price = quantity * price
        
        cart_id = db.add_cart_item(customer_name, product_name, quantity, price, total_price)
        return JsonResponse({
            'message': 'Cart updated successfully',
            'cart_id': cart_id,
            'customer_name': customer_name,
            'product_name': product_name,
            'quantity': quantity,
            'price': price,
            'total_price': total_price
        }, status=201)
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def cart_update_delete(request, id):
    if request.method == 'PUT':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        quantity = data.get('quantity')
        price = data.get('price')
        
        if quantity is None or price is None:
            return JsonResponse({'error': 'Missing quantity or price'}, status=400)
            
        quantity = int(quantity)
        price = float(price)
        total_price = quantity * price
        
        success = db.update_cart_item(id, quantity, price, total_price)
        if success:
            return JsonResponse({'message': 'Cart item updated successfully'})
        else:
            return JsonResponse({'error': 'Cart item not found'}, status=404)
            
    elif request.method == 'DELETE':
        success = db.delete_cart_item(id)
        if success:
            return JsonResponse({'message': 'Cart item removed successfully'})
        else:
            return JsonResponse({'error': 'Cart item not found'}, status=404)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- ORDER VIEWS ---

@csrf_exempt
def order_list_or_add(request):
    if request.method == 'GET':
        customer_name = request.GET.get('customer_name')
        orders = db.get_orders(customer_name=customer_name)
        return JsonResponse(orders, safe=False)
        
    elif request.method == 'POST':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        customer_name = data.get('customer_name')
        order_date = data.get('order_date')
        total_amount = data.get('total_amount')
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status', 'Pending')
        delivery_status = data.get('delivery_status', 'Processing')
        
        if not (customer_name and order_date and total_amount is not None and payment_method):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        order_id = db.add_order(customer_name, order_date, float(total_amount), payment_method, payment_status, delivery_status)
        
        # Clear customer's cart after order is successfully placed
        db.clear_customer_cart(customer_name)
        
        return JsonResponse({
            'message': 'Order placed successfully',
            'order_id': order_id,
            'customer_name': customer_name,
            'order_date': order_date,
            'total_amount': total_amount,
            'payment_method': payment_method,
            'payment_status': payment_status,
            'delivery_status': delivery_status
        }, status=201)
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def order_update_delete(request, id):
    if request.method == 'PUT':
        data = parse_json(request)
        if not data:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
            
        customer_name = data.get('customer_name')
        order_date = data.get('order_date')
        total_amount = data.get('total_amount')
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status')
        delivery_status = data.get('delivery_status')
        
        if not (customer_name and order_date and total_amount is not None and payment_method and payment_status and delivery_status):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        success = db.update_order(id, customer_name, order_date, float(total_amount), payment_method, payment_status, delivery_status)
        if success:
            return JsonResponse({'message': 'Order updated successfully'})
        else:
            return JsonResponse({'error': 'Order not found'}, status=404)
            
    elif request.method == 'DELETE':
        success = db.delete_order(id)
        if success:
            return JsonResponse({'message': 'Order deleted successfully'})
        else:
            return JsonResponse({'error': 'Order not found'}, status=404)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

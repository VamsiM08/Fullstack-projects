import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Customer, Island, Package, Booking, Payment

# ==========================================
# PAGE VIEWS (HTML Rendering)
# ==========================================

def index_view(request):
    return render(request, 'index.html')

def login_view(request):
    return render(request, 'login.html')

def register_view(request):
    return render(request, 'register.html')

def islands_page_view(request):
    return render(request, 'islands.html')

def packages_page_view(request):
    return render(request, 'packages.html')

def booking_page_view(request):
    return render(request, 'booking.html')

def payment_page_view(request):
    return render(request, 'payment.html')

def customer_dashboard_view(request):
    return render(request, 'customer_dashboard.html')

def admin_dashboard_view(request):
    return render(request, 'admin_dashboard.html')


# ==========================================
# REST API VIEWS (Function Based Views)
# ==========================================

# --- CUSTOMER ENDPOINTS ---

@csrf_exempt
def get_customers(request):
    if request.method == 'GET':
        customers = Customer.objects.all().order_by('-id')
        return JsonResponse({'status': 'success', 'data': [c.to_dict() for c in customers]}, status=200)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def add_customer(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer = Customer.objects.create(
                name=data.get('name', ''),
                email=data.get('email', ''),
                phone=data.get('phone', ''),
                avatar=data.get('avatar', ''),
                membership=data.get('membership', 'Gold')
            )
            return JsonResponse({'status': 'success', 'message': 'Customer added successfully', 'data': customer.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def update_customer(request, id):
    if request.method in ['PUT', 'POST']:
        try:
            customer = get_object_or_404(Customer, id=id)
            data = json.loads(request.body.decode('utf-8'))
            customer.name = data.get('name', customer.name)
            customer.email = data.get('email', customer.email)
            customer.phone = data.get('phone', customer.phone)
            customer.avatar = data.get('avatar', customer.avatar)
            customer.membership = data.get('membership', customer.membership)
            customer.save()
            return JsonResponse({'status': 'success', 'message': 'Customer updated successfully', 'data': customer.to_dict()}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_customer(request, id):
    if request.method in ['DELETE', 'POST']:
        try:
            customer = get_object_or_404(Customer, id=id)
            customer.delete()
            return JsonResponse({'status': 'success', 'message': 'Customer deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


# --- ISLAND ENDPOINTS ---

@csrf_exempt
def get_islands(request):
    if request.method == 'GET':
        islands = Island.objects.all().order_by('-id')
        return JsonResponse({'status': 'success', 'data': [i.to_dict() for i in islands]}, status=200)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def add_island(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            island = Island.objects.create(
                name=data.get('name', ''),
                country=data.get('country', ''),
                climate=data.get('climate', 'Tropical'),
                best_season=data.get('best_season', 'Year-round'),
                rating=float(data.get('rating', 4.8)),
                image_url=data.get('image_url', ''),
                description=data.get('description', ''),
                price_per_night=float(data.get('price_per_night', 299.00)),
                is_featured=bool(data.get('is_featured', False))
            )
            return JsonResponse({'status': 'success', 'message': 'Island added successfully', 'data': island.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def update_island(request, id):
    if request.method in ['PUT', 'POST']:
        try:
            island = get_object_or_404(Island, id=id)
            data = json.loads(request.body.decode('utf-8'))
            island.name = data.get('name', island.name)
            island.country = data.get('country', island.country)
            island.climate = data.get('climate', island.climate)
            island.best_season = data.get('best_season', island.best_season)
            island.rating = float(data.get('rating', island.rating))
            island.image_url = data.get('image_url', island.image_url)
            island.description = data.get('description', island.description)
            island.price_per_night = float(data.get('price_per_night', island.price_per_night))
            island.is_featured = bool(data.get('is_featured', island.is_featured))
            island.save()
            return JsonResponse({'status': 'success', 'message': 'Island updated successfully', 'data': island.to_dict()}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_island(request, id):
    if request.method in ['DELETE', 'POST']:
        try:
            island = get_object_or_404(Island, id=id)
            island.delete()
            return JsonResponse({'status': 'success', 'message': 'Island deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


# --- PACKAGE ENDPOINTS ---

@csrf_exempt
def get_packages(request):
    if request.method == 'GET':
        packages = Package.objects.all().order_by('-id')
        return JsonResponse({'status': 'success', 'data': [p.to_dict() for p in packages]}, status=200)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def add_package(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            island = get_object_or_404(Island, id=data.get('island_id'))
            package = Package.objects.create(
                island=island,
                title=data.get('title', ''),
                duration_days=int(data.get('duration_days', 5)),
                price=float(data.get('price', 999.00)),
                discount_percent=int(data.get('discount_percent', 0)),
                services=data.get('services', ''),
                rating=float(data.get('rating', 4.9)),
                image_url=data.get('image_url', island.image_url)
            )
            return JsonResponse({'status': 'success', 'message': 'Package added successfully', 'data': package.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def update_package(request, id):
    if request.method in ['PUT', 'POST']:
        try:
            package = get_object_or_404(Package, id=id)
            data = json.loads(request.body.decode('utf-8'))
            if 'island_id' in data:
                package.island = get_object_or_404(Island, id=data['island_id'])
            package.title = data.get('title', package.title)
            package.duration_days = int(data.get('duration_days', package.duration_days))
            package.price = float(data.get('price', package.price))
            package.discount_percent = int(data.get('discount_percent', package.discount_percent))
            package.services = data.get('services', package.services)
            package.rating = float(data.get('rating', package.rating))
            package.image_url = data.get('image_url', package.image_url)
            package.save()
            return JsonResponse({'status': 'success', 'message': 'Package updated successfully', 'data': package.to_dict()}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_package(request, id):
    if request.method in ['DELETE', 'POST']:
        try:
            package = get_object_or_404(Package, id=id)
            package.delete()
            return JsonResponse({'status': 'success', 'message': 'Package deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


# --- BOOKING ENDPOINTS ---

@csrf_exempt
def get_bookings(request):
    if request.method == 'GET':
        bookings = Booking.objects.all().order_by('-id')
        return JsonResponse({'status': 'success', 'data': [b.to_dict() for b in bookings]}, status=200)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def add_booking(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            customer = get_object_or_404(Customer, id=data.get('customer_id'))
            package = get_object_or_404(Package, id=data.get('package_id'))
            booking = Booking.objects.create(
                customer=customer,
                package=package,
                check_in=data.get('check_in'),
                check_out=data.get('check_out'),
                guests=int(data.get('guests', 2)),
                total_price=float(data.get('total_price', package.price)),
                status=data.get('status', 'Confirmed')
            )
            return JsonResponse({'status': 'success', 'message': 'Booking created successfully', 'data': booking.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def update_booking(request, id):
    if request.method in ['PUT', 'POST']:
        try:
            booking = get_object_or_404(Booking, id=id)
            data = json.loads(request.body.decode('utf-8'))
            if 'customer_id' in data:
                booking.customer = get_object_or_404(Customer, id=data['customer_id'])
            if 'package_id' in data:
                booking.package = get_object_or_404(Package, id=data['package_id'])
            booking.check_in = data.get('check_in', booking.check_in)
            booking.check_out = data.get('check_out', booking.check_out)
            booking.guests = int(data.get('guests', booking.guests))
            booking.total_price = float(data.get('total_price', booking.total_price))
            booking.status = data.get('status', booking.status)
            booking.save()
            return JsonResponse({'status': 'success', 'message': 'Booking updated successfully', 'data': booking.to_dict()}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_booking(request, id):
    if request.method in ['DELETE', 'POST']:
        try:
            booking = get_object_or_404(Booking, id=id)
            booking.delete()
            return JsonResponse({'status': 'success', 'message': 'Booking deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


# --- PAYMENT ENDPOINTS ---

@csrf_exempt
def get_payments(request):
    if request.method == 'GET':
        payments = Payment.objects.all().order_by('-id')
        return JsonResponse({'status': 'success', 'data': [p.to_dict() for p in payments]}, status=200)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def add_payment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            booking = get_object_or_404(Booking, id=data.get('booking_id'))
            payment = Payment.objects.create(
                booking=booking,
                amount=float(data.get('amount', booking.total_price)),
                payment_method=data.get('payment_method', 'Visa'),
                transaction_id=data.get('transaction_id', f"TXN-{booking.id}-{int(data.get('amount'))}"),
                status=data.get('status', 'Success')
            )
            return JsonResponse({'status': 'success', 'message': 'Payment processed successfully', 'data': payment.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def update_payment(request, id):
    if request.method in ['PUT', 'POST']:
        try:
            payment = get_object_or_404(Payment, id=id)
            data = json.loads(request.body.decode('utf-8'))
            if 'booking_id' in data:
                payment.booking = get_object_or_404(Booking, id=data['booking_id'])
            payment.amount = float(data.get('amount', payment.amount))
            payment.payment_method = data.get('payment_method', payment.payment_method)
            payment.transaction_id = data.get('transaction_id', payment.transaction_id)
            payment.status = data.get('status', payment.status)
            payment.save()
            return JsonResponse({'status': 'success', 'message': 'Payment updated successfully', 'data': payment.to_dict()}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_payment(request, id):
    if request.method in ['DELETE', 'POST']:
        try:
            payment = get_object_or_404(Payment, id=id)
            payment.delete()
            return JsonResponse({'status': 'success', 'message': 'Payment deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

import json
import sqlite3
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from Backend import db

def parse_json(request):
    try:
        return json.loads(request.body), None
    except Exception as e:
        return None, JsonResponse({"error": "Invalid JSON body: " + str(e)}, status=400)

# ==================== PASSENGER VIEWS ====================

@csrf_exempt
def add_passenger(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    
    data, err_res = parse_json(request)
    if err_res:
        return err_res
    
    required = ['full_name', 'email', 'phone', 'gender', 'address', 'password']
    for r in required:
        if r not in data or not str(data[r]).strip():
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        pid = db.add_passenger(data)
        return JsonResponse({
            "message": "Passenger registered successfully",
            "passenger_id": pid
        }, status=201)
    except sqlite3.IntegrityError:
        return JsonResponse({"error": "Passenger with this email already exists"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_passengers(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    
    email = request.GET.get('email')
    password = request.GET.get('password')
    
    try:
        passengers = db.get_passengers(email, password)
        return JsonResponse(passengers, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_passenger(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
    
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['full_name', 'email', 'phone', 'gender', 'address', 'password']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        success = db.update_passenger(int(id), data)
        if success:
            return JsonResponse({"message": "Passenger updated successfully"})
        else:
            return JsonResponse({"error": "Passenger not found"}, status=404)
    except sqlite3.IntegrityError:
        return JsonResponse({"error": "Email is already taken by another user"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_passenger(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        success = db.delete_passenger(int(id))
        if success:
            return JsonResponse({"message": "Passenger deleted successfully"})
        else:
            return JsonResponse({"error": "Passenger not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== BUS VIEWS ====================

@csrf_exempt
def add_bus(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['bus_name', 'bus_number', 'bus_type', 'total_seats', 'operator_name']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        bid = db.add_bus(data)
        return JsonResponse({
            "message": "Bus added successfully",
            "bus_id": bid
        }, status=201)
    except sqlite3.IntegrityError:
        return JsonResponse({"error": "Bus with this bus number already exists"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_buses(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        buses = db.get_buses()
        return JsonResponse(buses, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_bus(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['bus_name', 'bus_number', 'bus_type', 'total_seats', 'operator_name']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        success = db.update_bus(int(id), data)
        if success:
            return JsonResponse({"message": "Bus updated successfully"})
        else:
            return JsonResponse({"error": "Bus not found"}, status=404)
    except sqlite3.IntegrityError:
        return JsonResponse({"error": "Bus number is already taken by another bus"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_bus(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        success = db.delete_bus(int(id))
        if success:
            return JsonResponse({"message": "Bus deleted successfully"})
        else:
            return JsonResponse({"error": "Bus not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== ROUTE VIEWS ====================

@csrf_exempt
def add_route(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['bus_name', 'source', 'destination', 'departure_time', 'arrival_time', 'fare']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        rid = db.add_route(data)
        return JsonResponse({
            "message": "Route added successfully",
            "route_id": rid
        }, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_routes(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    source = request.GET.get('source')
    destination = request.GET.get('destination')
    
    try:
        routes = db.get_routes(source, destination)
        return JsonResponse(routes, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_route(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['bus_name', 'source', 'destination', 'departure_time', 'arrival_time', 'fare']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        success = db.update_route(int(id), data)
        if success:
            return JsonResponse({"message": "Route updated successfully"})
        else:
            return JsonResponse({"error": "Route not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_route(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        success = db.delete_route(int(id))
        if success:
            return JsonResponse({"message": "Route deleted successfully"})
        else:
            return JsonResponse({"error": "Route not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== BOOKING VIEWS ====================

@csrf_exempt
def add_booking(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['passenger_name', 'bus_name', 'source', 'destination', 'journey_date', 'seat_number', 'ticket_price', 'booking_status']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        bkid = db.add_booking(data)
        return JsonResponse({
            "message": "Booking created successfully",
            "booking_id": bkid
        }, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_bookings(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    passenger_name = request.GET.get('passenger_name')
    bus_name = request.GET.get('bus_name')
    journey_date = request.GET.get('journey_date')
    
    try:
        bookings = db.get_bookings(passenger_name, bus_name, journey_date)
        return JsonResponse(bookings, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_booking(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['passenger_name', 'bus_name', 'source', 'destination', 'journey_date', 'seat_number', 'ticket_price', 'booking_status']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        success = db.update_booking(int(id), data)
        if success:
            return JsonResponse({"message": "Booking updated successfully"})
        else:
            return JsonResponse({"error": "Booking not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_booking(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        success = db.delete_booking(int(id))
        if success:
            return JsonResponse({"message": "Booking deleted successfully"})
        else:
            return JsonResponse({"error": "Booking not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== PAYMENT VIEWS ====================

@csrf_exempt
def add_payment(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['booking_id', 'passenger_name', 'amount', 'payment_method', 'payment_status', 'transaction_id']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        pmid = db.add_payment(data)
        return JsonResponse({
            "message": "Payment recorded successfully",
            "payment_id": pmid
        }, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_payments(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    booking_id = request.GET.get('booking_id')
    
    try:
        payments = db.get_payments(booking_id)
        return JsonResponse(payments, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_payment(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    data, err_res = parse_json(request)
    if err_res:
        return err_res
        
    required = ['booking_id', 'passenger_name', 'amount', 'payment_method', 'payment_status', 'transaction_id']
    for r in required:
        if r not in data:
            return JsonResponse({"error": f"Field '{r}' is required"}, status=400)
            
    try:
        success = db.update_payment(int(id), data)
        if success:
            return JsonResponse({"message": "Payment updated successfully"})
        else:
            return JsonResponse({"error": "Payment not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_payment(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method Not Allowed"}, status=405)
        
    try:
        success = db.delete_payment(int(id))
        if success:
            return JsonResponse({"message": "Payment deleted successfully"})
        else:
            return JsonResponse({"error": "Payment not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

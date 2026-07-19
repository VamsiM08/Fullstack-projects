import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

try:
    from db import Passenger, Ship, Schedule, Booking, Payment
except ImportError:
    from .db import Passenger, Ship, Schedule, Booking, Payment

def cors_response(data, status=200):
    response = JsonResponse(data, safe=False, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def handle_options():
    response = HttpResponse()
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def parse_json(request):
    try:
        if request.body:
            return json.loads(request.body.decode('utf-8'))
    except Exception:
        pass
    return {}

# Root Welcome API
@csrf_exempt
def home_api(request):
    if request.method == "OPTIONS":
        return handle_options()
    return cors_response({
        "message": "Welcome to Oceania Direct Ship Booking System REST API Service",
        "status": "Online",
        "total_endpoints": 20,
        "available_modules": {
            "passengers": ["/passengers/", "/passengers/add/", "/passengers/update/<id>/", "/passengers/delete/<id>/"],
            "ships": ["/ships/", "/ships/add/", "/ships/update/<id>/", "/ships/delete/<id>/"],
            "schedules": ["/schedules/", "/schedules/add/", "/schedules/update/<id>/", "/schedules/delete/<id>/"],
            "bookings": ["/bookings/", "/bookings/add/", "/bookings/update/<id>/", "/bookings/delete/<id>/"],
            "payments": ["/payments/", "/payments/add/", "/payments/update/<id>/", "/payments/delete/<id>/"]
        }
    })

# ==============================================================================
# MODULE 1: PASSENGER MANAGEMENT APIs
# ==============================================================================

@csrf_exempt
def add_passenger(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "POST":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    data = parse_json(request)
    if not data.get("passenger_id"):
        max_id = Passenger.objects.all().order_by("-passenger_id").first()
        data["passenger_id"] = (max_id.passenger_id + 1) if max_id else 101

    try:
        passenger = Passenger.objects.create(
            passenger_id=data.get("passenger_id"),
            full_name=data.get("full_name", ""),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            nationality=data.get("nationality", ""),
            passport_number=data.get("passport_number", ""),
            password=data.get("password", "")
        )
        return cors_response({"message": "Passenger registered successfully", "passenger": passenger.to_dict()}, status=201)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def get_passengers(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "GET":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    passengers = [p.to_dict() for p in Passenger.objects.all()]
    return cors_response(passengers)

@csrf_exempt
def update_passenger(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["PUT", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        passenger = Passenger.objects.get(passenger_id=id)
        data = parse_json(request)
        for key in ["full_name", "email", "phone", "nationality", "passport_number", "password"]:
            if key in data:
                setattr(passenger, key, data[key])
        passenger.save()
        return cors_response({"message": "Passenger updated successfully", "passenger": passenger.to_dict()})
    except Passenger.DoesNotExist:
        return cors_response({"error": "Passenger not found"}, status=404)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def delete_passenger(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["DELETE", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        passenger = Passenger.objects.get(passenger_id=id)
        passenger.delete()
        return cors_response({"message": f"Passenger {id} deleted successfully"})
    except Passenger.DoesNotExist:
        return cors_response({"error": "Passenger not found"}, status=404)

# ==============================================================================
# MODULE 2: SHIP MANAGEMENT APIs
# ==============================================================================

@csrf_exempt
def add_ship(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "POST":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    data = parse_json(request)
    if not data.get("ship_id"):
        max_id = Ship.objects.all().order_by("-ship_id").first()
        data["ship_id"] = (max_id.ship_id + 1) if max_id else 201

    try:
        ship = Ship.objects.create(
            ship_id=data.get("ship_id"),
            ship_name=data.get("ship_name", ""),
            ship_type=data.get("ship_type", "Cruise Ship"),
            capacity=data.get("capacity", 1000),
            operator_name=data.get("operator_name", ""),
            status=data.get("status", "Active")
        )
        return cors_response({"message": "Ship added successfully", "ship": ship.to_dict()}, status=201)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def get_ships(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "GET":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    ships = [s.to_dict() for s in Ship.objects.all()]
    return cors_response(ships)

@csrf_exempt
def update_ship(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["PUT", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        ship = Ship.objects.get(ship_id=id)
        data = parse_json(request)
        for key in ["ship_name", "ship_type", "capacity", "operator_name", "status"]:
            if key in data:
                setattr(ship, key, data[key])
        ship.save()
        return cors_response({"message": "Ship updated successfully", "ship": ship.to_dict()})
    except Ship.DoesNotExist:
        return cors_response({"error": "Ship not found"}, status=404)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def delete_ship(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["DELETE", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        ship = Ship.objects.get(ship_id=id)
        ship.delete()
        return cors_response({"message": f"Ship {id} deleted successfully"})
    except Ship.DoesNotExist:
        return cors_response({"error": "Ship not found"}, status=404)

# ==============================================================================
# MODULE 3: ROUTE & SCHEDULE MANAGEMENT APIs
# ==============================================================================

@csrf_exempt
def add_schedule(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "POST":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    data = parse_json(request)
    if not data.get("schedule_id"):
        max_id = Schedule.objects.all().order_by("-schedule_id").first()
        data["schedule_id"] = (max_id.schedule_id + 1) if max_id else 301

    try:
        schedule = Schedule.objects.create(
            schedule_id=data.get("schedule_id"),
            ship_name=data.get("ship_name", ""),
            source_port=data.get("source_port", ""),
            destination_port=data.get("destination_port", ""),
            departure_date=data.get("departure_date", ""),
            departure_time=data.get("departure_time", ""),
            arrival_date=data.get("arrival_date", ""),
            arrival_time=data.get("arrival_time", ""),
            fare=float(data.get("fare", 0))
        )
        return cors_response({"message": "Schedule created successfully", "schedule": schedule.to_dict()}, status=201)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def get_schedules(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "GET":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    schedules = [s.to_dict() for s in Schedule.objects.all()]
    return cors_response(schedules)

@csrf_exempt
def update_schedule(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["PUT", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        schedule = Schedule.objects.get(schedule_id=id)
        data = parse_json(request)
        for key in ["ship_name", "source_port", "destination_port", "departure_date", "departure_time", "arrival_date", "arrival_time", "fare"]:
            if key in data:
                setattr(schedule, key, data[key])
        schedule.save()
        return cors_response({"message": "Schedule updated successfully", "schedule": schedule.to_dict()})
    except Schedule.DoesNotExist:
        return cors_response({"error": "Schedule not found"}, status=404)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def delete_schedule(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["DELETE", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        schedule = Schedule.objects.get(schedule_id=id)
        schedule.delete()
        return cors_response({"message": f"Schedule {id} deleted successfully"})
    except Schedule.DoesNotExist:
        return cors_response({"error": "Schedule not found"}, status=404)

# ==============================================================================
# MODULE 4: CABIN / TICKET BOOKING APIs
# ==============================================================================

@csrf_exempt
def add_booking(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "POST":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    data = parse_json(request)
    if not data.get("booking_id"):
        max_id = Booking.objects.all().order_by("-booking_id").first()
        data["booking_id"] = (max_id.booking_id + 1) if max_id else 401

    try:
        booking = Booking.objects.create(
            booking_id=data.get("booking_id"),
            passenger_name=data.get("passenger_name", ""),
            ship_name=data.get("ship_name", ""),
            cabin_type=data.get("cabin_type", "Economy"),
            journey_date=data.get("journey_date", ""),
            source_port=data.get("source_port", ""),
            destination_port=data.get("destination_port", ""),
            total_amount=float(data.get("total_amount", 0)),
            booking_status=data.get("booking_status", "Confirmed")
        )
        return cors_response({"message": "Booking created successfully", "booking": booking.to_dict()}, status=201)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def get_bookings(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "GET":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    bookings = [b.to_dict() for b in Booking.objects.all()]
    return cors_response(bookings)

@csrf_exempt
def update_booking(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["PUT", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        booking = Booking.objects.get(booking_id=id)
        data = parse_json(request)
        for key in ["passenger_name", "ship_name", "cabin_type", "journey_date", "source_port", "destination_port", "total_amount", "booking_status"]:
            if key in data:
                setattr(booking, key, data[key])
        booking.save()
        return cors_response({"message": "Booking updated successfully", "booking": booking.to_dict()})
    except Booking.DoesNotExist:
        return cors_response({"error": "Booking not found"}, status=404)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def delete_booking(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["DELETE", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        booking = Booking.objects.get(booking_id=id)
        booking.delete()
        return cors_response({"message": f"Booking {id} deleted successfully"})
    except Booking.DoesNotExist:
        return cors_response({"error": "Booking not found"}, status=404)

# ==============================================================================
# MODULE 5: PAYMENT MANAGEMENT APIs
# ==============================================================================

@csrf_exempt
def add_payment(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "POST":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    data = parse_json(request)
    if not data.get("payment_id"):
        max_id = Payment.objects.all().order_by("-payment_id").first()
        data["payment_id"] = (max_id.payment_id + 1) if max_id else 501

    try:
        payment = Payment.objects.create(
            payment_id=data.get("payment_id"),
            booking_id=int(data.get("booking_id", 0)),
            passenger_name=data.get("passenger_name", ""),
            amount=float(data.get("amount", 0)),
            payment_method=data.get("payment_method", "UPI"),
            payment_status=data.get("payment_status", "Success"),
            transaction_id=data.get("transaction_id", f"TXN{data.get('payment_id')}"),
            payment_date=data.get("payment_date", "")
        )
        return cors_response({"message": "Payment recorded successfully", "payment": payment.to_dict()}, status=201)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def get_payments(request):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method != "GET":
        return cors_response({"error": "Method not allowed"}, status=405)
    
    payments = [p.to_dict() for p in Payment.objects.all()]
    return cors_response(payments)

@csrf_exempt
def update_payment(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["PUT", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        payment = Payment.objects.get(payment_id=id)
        data = parse_json(request)
        for key in ["booking_id", "passenger_name", "amount", "payment_method", "payment_status", "transaction_id", "payment_date"]:
            if key in data:
                setattr(payment, key, data[key])
        payment.save()
        return cors_response({"message": "Payment updated successfully", "payment": payment.to_dict()})
    except Payment.DoesNotExist:
        return cors_response({"error": "Payment not found"}, status=404)
    except Exception as e:
        return cors_response({"error": str(e)}, status=400)

@csrf_exempt
def delete_payment(request, id):
    if request.method == "OPTIONS":
        return handle_options()
    if request.method not in ["DELETE", "POST"]:
        return cors_response({"error": "Method not allowed"}, status=405)

    try:
        payment = Payment.objects.get(payment_id=id)
        payment.delete()
        return cors_response({"message": f"Payment {id} deleted successfully"})
    except Payment.DoesNotExist:
        return cors_response({"error": "Payment not found"}, status=404)

import json
import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import models
from .models import Passenger, Train, Schedule, Booking, Payment

def parse_json_body(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return None

# ==========================================
# AUTHENTICATION HELPERS
# ==========================================
@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "passenger") # passenger or admin

    if role == "admin":
        if email == "admin@railway.com" and password == "admin123":
            return JsonResponse({
                "message": "Admin login successful",
                "role": "admin",
                "user": {"full_name": "Railway Administrator", "email": email}
            })
        else:
            return JsonResponse({"error": "Invalid admin credentials"}, status=401)

    try:
        passenger = Passenger.objects.get(email=email, password=password)
        return JsonResponse({
            "message": "Login successful",
            "role": "passenger",
            "user": passenger.to_dict()
        })
    except Passenger.DoesNotExist:
        return JsonResponse({"error": "Invalid email or password"}, status=401)


# ==========================================
# MODULE 1: PASSENGER MANAGEMENT
# APIs:
# POST /passengers/add/
# GET  /passengers/
# PUT  /passengers/update/<id>/
# DELETE /passengers/delete/<id>/
# ==========================================
@csrf_exempt
def passenger_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid data provided"}, status=400)
    
    pid = data.get("passenger_id")
    if not pid:
        pid = random.randint(100, 99999)

    try:
        passenger = Passenger.objects.create(
            passenger_id=int(pid),
            full_name=data.get("full_name", ""),
            email=data.get("email", ""),
            phone=str(data.get("phone", "")),
            gender=data.get("gender", "Male"),
            age=int(data.get("age", 25)),
            address=data.get("address", ""),
            password=data.get("password", "123456")
        )
        return JsonResponse({"message": "Passenger registered successfully", "data": passenger.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def passenger_list(request, pk=None):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if pk:
        try:
            p = Passenger.objects.get(pk=pk)
            return JsonResponse({"data": p.to_dict()})
        except Passenger.DoesNotExist:
            return JsonResponse({"error": "Passenger not found"}, status=404)

    pid = request.GET.get("id")
    if pid:
        try:
            p = Passenger.objects.get(pk=pid)
            return JsonResponse({"data": p.to_dict()})
        except Passenger.DoesNotExist:
            return JsonResponse({"error": "Passenger not found"}, status=404)

    passengers = Passenger.objects.all().order_by('passenger_id')
    return JsonResponse([p.to_dict() for p in passengers], safe=False)


@csrf_exempt
def passenger_update(request, pk):
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)
    
    try:
        passenger = Passenger.objects.get(pk=pk)
        if "full_name" in data: passenger.full_name = data["full_name"]
        if "email" in data: passenger.email = data["email"]
        if "phone" in data: passenger.phone = str(data["phone"])
        if "gender" in data: passenger.gender = data["gender"]
        if "age" in data: passenger.age = int(data["age"])
        if "address" in data: passenger.address = data["address"]
        if "password" in data: passenger.password = data["password"]
        passenger.save()
        return JsonResponse({"message": "Passenger updated successfully", "data": passenger.to_dict()})
    except Passenger.DoesNotExist:
        return JsonResponse({"error": "Passenger not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def passenger_delete(request, pk):
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        passenger = Passenger.objects.get(pk=pk)
        passenger.delete()
        return JsonResponse({"message": "Passenger deleted successfully"})
    except Passenger.DoesNotExist:
        return JsonResponse({"error": "Passenger not found"}, status=404)


# ==========================================
# MODULE 2: TRAIN MANAGEMENT
# APIs:
# POST /trains/add/
# GET  /trains/
# PUT  /trains/update/<id>/
# DELETE /trains/delete/<id>/
# ==========================================
@csrf_exempt
def train_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    tid = data.get("train_id")
    if not tid:
        tid = random.randint(200, 99999)

    try:
        train = Train.objects.create(
            train_id=int(tid),
            train_name=data.get("train_name", ""),
            train_number=str(data.get("train_number", "")),
            train_type=data.get("train_type", "Express"),
            total_seats=int(data.get("total_seats", 500)),
            source=data.get("source", ""),
            destination=data.get("destination", "")
        )
        return JsonResponse({"message": "Train added successfully", "data": train.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def train_list(request, pk=None):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if pk:
        try:
            t = Train.objects.get(pk=pk)
            return JsonResponse({"data": t.to_dict()})
        except Train.DoesNotExist:
            return JsonResponse({"error": "Train not found"}, status=404)

    src = request.GET.get("source")
    dest = request.GET.get("destination")
    t_type = request.GET.get("type")

    trains = Train.objects.all()
    if src:
        trains = trains.filter(source__icontains=src)
    if dest:
        trains = trains.filter(destination__icontains=dest)
    if t_type:
        trains = trains.filter(train_type__iexact=t_type)

    return JsonResponse([t.to_dict() for t in trains.order_by('train_id')], safe=False)


@csrf_exempt
def train_update(request, pk):
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    try:
        train = Train.objects.get(pk=pk)
        if "train_name" in data: train.train_name = data["train_name"]
        if "train_number" in data: train.train_number = str(data["train_number"])
        if "train_type" in data: train.train_type = data["train_type"]
        if "total_seats" in data: train.total_seats = int(data["total_seats"])
        if "source" in data: train.source = data["source"]
        if "destination" in data: train.destination = data["destination"]
        train.save()
        return JsonResponse({"message": "Train updated successfully", "data": train.to_dict()})
    except Train.DoesNotExist:
        return JsonResponse({"error": "Train not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def train_delete(request, pk):
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        train = Train.objects.get(pk=pk)
        train.delete()
        return JsonResponse({"message": "Train deleted successfully"})
    except Train.DoesNotExist:
        return JsonResponse({"error": "Train not found"}, status=404)


# ==========================================
# MODULE 3: ROUTE & SCHEDULE MANAGEMENT
# APIs:
# POST /schedules/add/
# GET  /schedules/
# PUT  /schedules/update/<id>/
# DELETE /schedules/delete/<id>/
# ==========================================
@csrf_exempt
def schedule_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    sid = data.get("schedule_id")
    if not sid:
        sid = random.randint(300, 99999)

    try:
        sch = Schedule.objects.create(
            schedule_id=int(sid),
            train_name=data.get("train_name", ""),
            source=data.get("source", ""),
            destination=data.get("destination", ""),
            departure_date=str(data.get("departure_date", "")),
            departure_time=str(data.get("departure_time", "")),
            arrival_date=str(data.get("arrival_date", "")),
            arrival_time=str(data.get("arrival_time", "")),
            fare=float(data.get("fare", 0.0))
        )
        return JsonResponse({"message": "Schedule added successfully", "data": sch.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def schedule_list(request, pk=None):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    if pk:
        try:
            sch = Schedule.objects.get(pk=pk)
            return JsonResponse({"data": sch.to_dict()})
        except Schedule.DoesNotExist:
            return JsonResponse({"error": "Schedule not found"}, status=404)

    src = request.GET.get("source")
    dest = request.GET.get("destination")
    date = request.GET.get("date")

    schedules = Schedule.objects.all()
    if src:
        schedules = schedules.filter(source__icontains=src)
    if dest:
        schedules = schedules.filter(destination__icontains=dest)
    if date:
        schedules = schedules.filter(departure_date=date)

    return JsonResponse([s.to_dict() for s in schedules.order_by('schedule_id')], safe=False)


@csrf_exempt
def schedule_update(request, pk):
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    try:
        sch = Schedule.objects.get(pk=pk)
        if "train_name" in data: sch.train_name = data["train_name"]
        if "source" in data: sch.source = data["source"]
        if "destination" in data: sch.destination = data["destination"]
        if "departure_date" in data: sch.departure_date = str(data["departure_date"])
        if "departure_time" in data: sch.departure_time = str(data["departure_time"])
        if "arrival_date" in data: sch.arrival_date = str(data["arrival_date"])
        if "arrival_time" in data: sch.arrival_time = str(data["arrival_time"])
        if "fare" in data: sch.fare = float(data["fare"])
        sch.save()
        return JsonResponse({"message": "Schedule updated successfully", "data": sch.to_dict()})
    except Schedule.DoesNotExist:
        return JsonResponse({"error": "Schedule not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def schedule_delete(request, pk):
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        sch = Schedule.objects.get(pk=pk)
        sch.delete()
        return JsonResponse({"message": "Schedule deleted successfully"})
    except Schedule.DoesNotExist:
        return JsonResponse({"error": "Schedule not found"}, status=404)


# ==========================================
# MODULE 4: TICKET RESERVATION MANAGEMENT
# APIs:
# POST /bookings/add/
# GET  /bookings/
# PUT  /bookings/update/<id>/
# DELETE /bookings/delete/<id>/
# ==========================================
@csrf_exempt
def booking_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    bid = data.get("booking_id")
    if not bid:
        bid = random.randint(400, 99999)

    try:
        booking = Booking.objects.create(
            booking_id=int(bid),
            passenger_name=data.get("passenger_name", ""),
            train_name=data.get("train_name", ""),
            journey_date=str(data.get("journey_date", "")),
            source=data.get("source", ""),
            destination=data.get("destination", ""),
            coach_type=data.get("coach_type", "Sleeper"),
            seat_number=data.get("seat_number", "S1-12"),
            total_fare=float(data.get("total_fare", 0.0)),
            booking_status=data.get("booking_status", "Confirmed")
        )
        return JsonResponse({"message": "Ticket reserved successfully", "data": booking.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def booking_list(request, pk=None):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if pk:
        try:
            b = Booking.objects.get(pk=pk)
            return JsonResponse({"data": b.to_dict()})
        except Booking.DoesNotExist:
            return JsonResponse({"error": "Booking not found"}, status=404)

    passenger = request.GET.get("passenger_name")
    status = request.GET.get("status")

    bookings = Booking.objects.all()
    if passenger:
        bookings = bookings.filter(passenger_name__icontains=passenger)
    if status:
        bookings = bookings.filter(booking_status__iexact=status)

    return JsonResponse([b.to_dict() for b in bookings.order_by('-booking_id')], safe=False)


@csrf_exempt
def booking_update(request, pk):
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    try:
        booking = Booking.objects.get(pk=pk)
        if "passenger_name" in data: booking.passenger_name = data["passenger_name"]
        if "train_name" in data: booking.train_name = data["train_name"]
        if "journey_date" in data: booking.journey_date = str(data["journey_date"])
        if "source" in data: booking.source = data["source"]
        if "destination" in data: booking.destination = data["destination"]
        if "coach_type" in data: booking.coach_type = data["coach_type"]
        if "seat_number" in data: booking.seat_number = data["seat_number"]
        if "total_fare" in data: booking.total_fare = float(data["total_fare"])
        if "booking_status" in data: booking.booking_status = data["booking_status"]
        booking.save()
        return JsonResponse({"message": "Booking updated successfully", "data": booking.to_dict()})
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def booking_delete(request, pk):
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        booking = Booking.objects.get(pk=pk)
        booking.delete()
        return JsonResponse({"message": "Booking deleted successfully"})
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)


# ==========================================
# MODULE 5: PAYMENT MANAGEMENT
# APIs:
# POST /payments/add/
# GET  /payments/
# PUT  /payments/update/<id>/
# DELETE /payments/delete/<id>/
# ==========================================
@csrf_exempt
def payment_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    pid = data.get("payment_id")
    if not pid:
        pid = random.randint(500, 99999)

    txn_id = data.get("transaction_id")
    if not txn_id:
        txn_id = f"TXN{random.randint(10000000, 99999999)}"

    try:
        payment = Payment.objects.create(
            payment_id=int(pid),
            booking_id=int(data.get("booking_id", 0)),
            passenger_name=data.get("passenger_name", ""),
            amount=float(data.get("amount", 0.0)),
            payment_method=data.get("payment_method", "UPI"),
            payment_status=data.get("payment_status", "Success"),
            transaction_id=str(txn_id),
            payment_date=str(data.get("payment_date", "2026-07-19"))
        )
        return JsonResponse({"message": "Payment recorded successfully", "data": payment.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def payment_list(request, pk=None):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if pk:
        try:
            p = Payment.objects.get(pk=pk)
            return JsonResponse({"data": p.to_dict()})
        except Payment.DoesNotExist:
            return JsonResponse({"error": "Payment not found"}, status=404)

    passenger = request.GET.get("passenger_name")
    booking_id = request.GET.get("booking_id")

    payments = Payment.objects.all()
    if passenger:
        payments = payments.filter(passenger_name__icontains=passenger)
    if booking_id:
        payments = payments.filter(booking_id=booking_id)

    return JsonResponse([p.to_dict() for p in payments.order_by('-payment_id')], safe=False)


@csrf_exempt
def payment_update(request, pk):
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = parse_json_body(request)
    if not data:
        return JsonResponse({"error": "Invalid payload"}, status=400)

    try:
        payment = Payment.objects.get(pk=pk)
        if "booking_id" in data: payment.booking_id = int(data["booking_id"])
        if "passenger_name" in data: payment.passenger_name = data["passenger_name"]
        if "amount" in data: payment.amount = float(data["amount"])
        if "payment_method" in data: payment.payment_method = data["payment_method"]
        if "payment_status" in data: payment.payment_status = data["payment_status"]
        if "transaction_id" in data: payment.transaction_id = str(data["transaction_id"])
        if "payment_date" in data: payment.payment_date = str(data["payment_date"])
        payment.save()
        return JsonResponse({"message": "Payment updated successfully", "data": payment.to_dict()})
    except Payment.DoesNotExist:
        return JsonResponse({"error": "Payment not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def payment_delete(request, pk):
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        payment = Payment.objects.get(pk=pk)
        payment.delete()
        return JsonResponse({"message": "Payment record deleted successfully"})
    except Payment.DoesNotExist:
        return JsonResponse({"error": "Payment record not found"}, status=404)


# ==========================================
# EXTRA SYSTEM STATS API FOR DASHBOARD
# ==========================================
@csrf_exempt
def dashboard_stats(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    total_passengers = Passenger.objects.count()
    total_trains = Train.objects.count()
    total_schedules = Schedule.objects.count()
    total_bookings = Booking.objects.count()
    total_payments = Payment.objects.filter(payment_status="Success").aggregate(total=models.Sum('amount'))['total'] or 0.0

    return JsonResponse({
        "total_passengers": total_passengers,
        "total_trains": total_trains,
        "total_schedules": total_schedules,
        "total_bookings": total_bookings,
        "total_revenue": total_payments
    })

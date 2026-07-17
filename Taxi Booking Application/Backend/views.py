from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from datetime import datetime
import re

from db import (
    customers_col, drivers_col, vehicles_col, bookings_col, payments_col, serialize_doc
)
from serializers import (
    CustomerSerializer, DriverSerializer, VehicleSerializer, BookingSerializer, PaymentSerializer
)

def get_id_query(id_str):
    try:
        return {"_id": ObjectId(id_str)}
    except Exception:
        return {"$or": [
            {"customer_id": id_str},
            {"driver_id": id_str},
            {"vehicle_id": id_str},
            {"booking_id": id_str},
            {"payment_id": id_str}
        ]}

# ==========================================
# AUTHENTICATION APIs
# ==========================================

@api_view(['POST'])
def customer_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    customer = customers_col.find_one({"email": email, "password": password})
    if not customer:
        return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serialize_doc(customer), status=status.HTTP_200_OK)


@api_view(['POST'])
def driver_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    driver = drivers_col.find_one({"email": email, "password": password})
    if not driver:
        return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serialize_doc(driver), status=status.HTTP_200_OK)


@api_view(['POST'])
def admin_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if email == "admin@taxi.com" and password == "admin123":
        return Response({
            "email": "admin@taxi.com",
            "full_name": "System Administrator",
            "role": "admin",
            "profile_pic": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
        }, status=status.HTTP_200_OK)
    
    return Response({"error": "Invalid admin credentials."}, status=status.HTTP_401_UNAUTHORIZED)


# ==========================================
# MODULE 1: CUSTOMERS CRUD
# ==========================================

@api_view(['POST'])
def add_customer(request):
    serializer = CustomerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    # Check uniqueness
    if customers_col.find_one({"email": data['email']}):
        return Response({"email": ["Email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    if customers_col.find_one({"phone": data['phone']}):
        return Response({"phone": ["Phone number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    
    # Default fields
    if not data.get('customer_id'):
        count = customers_col.count_documents({})
        data['customer_id'] = f"CUST{count + 1:04d}"
    if not data.get('profile_pic'):
        data['profile_pic'] = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    if not data.get('member_since'):
        data['member_since'] = datetime.now().strftime("%Y-%m-%d")
        
    result = customers_col.insert_one(data)
    data['id'] = str(result.inserted_id)
    return Response(serialize_doc(data), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_customers(request):
    query_param = request.GET.get('q', '')
    query = {}
    if query_param:
        regex = re.compile(query_param, re.IGNORECASE)
        query = {"$or": [
            {"full_name": regex},
            {"email": regex},
            {"phone": regex},
            {"customer_id": regex}
        ]}
    
    customers = list(customers_col.find(query))
    return Response(serialize_doc(customers), status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_customer(request, id):
    q = get_id_query(id)
    customer = customers_col.find_one(q)
    if not customer:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = CustomerSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    current_id = customer['_id']
    
    if 'email' in data:
        dup = customers_col.find_one({"email": data['email'], "_id": {"$ne": current_id}})
        if dup:
            return Response({"email": ["Email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    if 'phone' in data:
        dup = customers_col.find_one({"phone": data['phone'], "_id": {"$ne": current_id}})
        if dup:
            return Response({"phone": ["Phone number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
            
    customers_col.update_one({"_id": current_id}, {"$set": data})
    updated_customer = customers_col.find_one({"_id": current_id})
    return Response(serialize_doc(updated_customer), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_customer(request, id):
    q = get_id_query(id)
    result = customers_col.delete_one(q)
    if result.deleted_count == 0:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"message": "Customer deleted successfully."}, status=status.HTTP_200_OK)


# ==========================================
# MODULE 2: DRIVERS CRUD
# ==========================================

@api_view(['POST'])
def add_driver(request):
    serializer = DriverSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    
    if drivers_col.find_one({"email": data['email']}):
        return Response({"email": ["Email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    if drivers_col.find_one({"phone": data['phone']}):
        return Response({"phone": ["Phone number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        
    if not data.get('driver_id'):
        count = drivers_col.count_documents({})
        data['driver_id'] = f"DRV{count + 1:04d}"
    if not data.get('password'):
        data['password'] = "driver123"
    if not data.get('profile_pic'):
        data['profile_pic'] = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
    if not data.get('rating'):
        data['rating'] = 5.0
    if not data.get('total_rides'):
        data['total_rides'] = 0
        
    result = drivers_col.insert_one(data)
    data['id'] = str(result.inserted_id)
    return Response(serialize_doc(data), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_drivers(request):
    query_param = request.GET.get('q', '')
    availability = request.GET.get('availability', '')
    query = {}
    
    if query_param:
        regex = re.compile(query_param, re.IGNORECASE)
        query["$or"] = [
            {"driver_name": regex},
            {"email": regex},
            {"phone": regex},
            {"driver_id": regex}
        ]
        
    if availability:
        query["availability"] = availability
        
    drivers = list(drivers_col.find(query))
    return Response(serialize_doc(drivers), status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_driver(request, id):
    q = get_id_query(id)
    driver = drivers_col.find_one(q)
    if not driver:
        return Response({"error": "Driver not found."}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = DriverSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    current_id = driver['_id']
    
    if 'email' in data:
        dup = drivers_col.find_one({"email": data['email'], "_id": {"$ne": current_id}})
        if dup:
            return Response({"email": ["Email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    if 'phone' in data:
        dup = drivers_col.find_one({"phone": data['phone'], "_id": {"$ne": current_id}})
        if dup:
            return Response({"phone": ["Phone number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
            
    drivers_col.update_one({"_id": current_id}, {"$set": data})
    updated_driver = drivers_col.find_one({"_id": current_id})
    return Response(serialize_doc(updated_driver), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_driver(request, id):
    q = get_id_query(id)
    result = drivers_col.delete_one(q)
    if result.deleted_count == 0:
        return Response({"error": "Driver not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"message": "Driver deleted successfully."}, status=status.HTTP_200_OK)


# ==========================================
# MODULE 3: VEHICLES CRUD
# ==========================================

@api_view(['POST'])
def add_vehicle(request):
    serializer = VehicleSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    
    if vehicles_col.find_one({"vehicle_number": data['vehicle_number']}):
        return Response({"vehicle_number": ["Vehicle number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        
    if not data.get('vehicle_id'):
        count = vehicles_col.count_documents({})
        data['vehicle_id'] = f"VEH{count + 1:04d}"
    if not data.get('vehicle_image'):
        data['vehicle_image'] = "https://images.unsplash.com/photo-1549880181-56a44cf4a9a1?auto=format&fit=crop&q=80&w=300"
        
    result = vehicles_col.insert_one(data)
    data['id'] = str(result.inserted_id)
    return Response(serialize_doc(data), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_vehicles(request):
    query_param = request.GET.get('q', '')
    vehicle_type = request.GET.get('vehicle_type', '')
    query = {}
    
    if query_param:
        regex = re.compile(query_param, re.IGNORECASE)
        query["$or"] = [
            {"vehicle_number": regex},
            {"model": regex},
            {"driver_name": regex},
            {"vehicle_id": regex}
        ]
        
    if vehicle_type:
        query["vehicle_type"] = vehicle_type
        
    vehicles = list(vehicles_col.find(query))
    return Response(serialize_doc(vehicles), status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_vehicle(request, id):
    q = get_id_query(id)
    vehicle = vehicles_col.find_one(q)
    if not vehicle:
        return Response({"error": "Vehicle not found."}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = VehicleSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    current_id = vehicle['_id']
    
    if 'vehicle_number' in data:
        dup = vehicles_col.find_one({"vehicle_number": data['vehicle_number'], "_id": {"$ne": current_id}})
        if dup:
            return Response({"vehicle_number": ["Vehicle number already exists."]}, status=status.HTTP_400_BAD_REQUEST)
            
    vehicles_col.update_one({"_id": current_id}, {"$set": data})
    updated_vehicle = vehicles_col.find_one({"_id": current_id})
    return Response(serialize_doc(updated_vehicle), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_vehicle(request, id):
    q = get_id_query(id)
    result = vehicles_col.delete_one(q)
    if result.deleted_count == 0:
        return Response({"error": "Vehicle not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"message": "Vehicle deleted successfully."}, status=status.HTTP_200_OK)


# ==========================================
# MODULE 4: BOOKINGS CRUD
# ==========================================

@api_view(['POST'])
def add_booking(request):
    serializer = BookingSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    
    if not data.get('booking_id'):
        count = bookings_col.count_documents({})
        data['booking_id'] = f"BK{count + 1:05d}"
    if not data.get('booking_date'):
        data['booking_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    # Dynamically pick driver
    driver = drivers_col.find_one({"availability": "Available"})
    if driver:
        data['driver_name'] = driver['driver_name']
        data['ride_status'] = 'Accepted'
        drivers_col.update_one({"_id": driver['_id']}, {"$set": {"availability": "Busy"}})
    else:
        data['driver_name'] = 'Unassigned'
        data['ride_status'] = 'Requested'
        
    result = bookings_col.insert_one(data)
    data['id'] = str(result.inserted_id)
    return Response(serialize_doc(data), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_bookings(request):
    query_param = request.GET.get('q', '')
    status_filter = request.GET.get('ride_status', '')
    customer_name = request.GET.get('customer_name', '')
    driver_name = request.GET.get('driver_name', '')
    
    query = {}
    if query_param:
        regex = re.compile(query_param, re.IGNORECASE)
        query["$or"] = [
            {"customer_name": regex},
            {"driver_name": regex},
            {"pickup_location": regex},
            {"drop_location": regex},
            {"booking_id": regex}
        ]
        
    if status_filter:
        query["ride_status"] = status_filter
    if customer_name:
        query["customer_name"] = customer_name
    if driver_name:
        query["driver_name"] = driver_name
        
    bookings = list(bookings_col.find(query).sort("booking_date", -1))
    return Response(serialize_doc(bookings), status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_booking(request, id):
    q = get_id_query(id)
    booking = bookings_col.find_one(q)
    if not booking:
        return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = BookingSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    current_id = booking['_id']
    
    old_status = booking.get('ride_status')
    new_status = data.get('ride_status')
    driver_name = data.get('driver_name') or booking.get('driver_name')
    
    if new_status and new_status != old_status:
        if new_status in ['Completed', 'Cancelled']:
            if driver_name and driver_name != 'Unassigned':
                drivers_col.update_one({"driver_name": driver_name}, {"$set": {"availability": "Available"}, "$inc": {"total_rides": 1}})
        elif new_status == 'Accepted' or new_status == 'In Progress':
            if driver_name and driver_name != 'Unassigned':
                drivers_col.update_one({"driver_name": driver_name}, {"$set": {"availability": "Busy"}})
                
    bookings_col.update_one({"_id": current_id}, {"$set": data})
    updated_booking = bookings_col.find_one({"_id": current_id})
    return Response(serialize_doc(updated_booking), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_booking(request, id):
    q = get_id_query(id)
    booking = bookings_col.find_one(q)
    if booking:
        driver_name = booking.get('driver_name')
        if driver_name and driver_name != 'Unassigned' and booking.get('ride_status') in ['Requested', 'Accepted', 'In Progress']:
            drivers_col.update_one({"driver_name": driver_name}, {"$set": {"availability": "Available"}})
            
    result = bookings_col.delete_one(q)
    if result.deleted_count == 0:
        return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"message": "Booking deleted successfully."}, status=status.HTTP_200_OK)


# ==========================================
# MODULE 5: PAYMENTS CRUD
# ==========================================

@api_view(['POST'])
def add_payment(request):
    serializer = PaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    
    if not data.get('payment_id'):
        count = payments_col.count_documents({})
        data['payment_id'] = f"PMT{count + 1:05d}"
    if not data.get('transaction_id'):
        import uuid
        data['transaction_id'] = "TXN-" + str(uuid.uuid4().hex[:12]).upper()
    if not data.get('payment_date'):
        data['payment_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    result = payments_col.insert_one(data)
    data['id'] = str(result.inserted_id)
    return Response(serialize_doc(data), status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_payments(request):
    query_param = request.GET.get('q', '')
    status_filter = request.GET.get('payment_status', '')
    customer_name = request.GET.get('customer_name', '')
    
    query = {}
    if query_param:
        regex = re.compile(query_param, re.IGNORECASE)
        query["$or"] = [
            {"customer_name": regex},
            {"booking_id": regex},
            {"payment_id": regex},
            {"transaction_id": regex}
        ]
        
    if status_filter:
        query["payment_status"] = status_filter
    if customer_name:
        query["customer_name"] = customer_name
        
    payments = list(payments_col.find(query).sort("payment_date", -1))
    return Response(serialize_doc(payments), status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_payment(request, id):
    q = get_id_query(id)
    payment = payments_col.find_one(q)
    if not payment:
        return Response({"error": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = PaymentSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    data = serializer.validated_data
    current_id = payment['_id']
    
    payments_col.update_one({"_id": current_id}, {"$set": data})
    updated_payment = payments_col.find_one({"_id": current_id})
    return Response(serialize_doc(updated_payment), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_payment(request, id):
    q = get_id_query(id)
    result = payments_col.delete_one(q)
    if result.deleted_count == 0:
        return Response({"error": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"message": "Payment deleted successfully."}, status=status.HTTP_200_OK)


# ==========================================
# DASHBOARD STATS APIs
# ==========================================

@api_view(['GET'])
def admin_dashboard_stats(request):
    total_customers = customers_col.count_documents({})
    total_drivers = drivers_col.count_documents({})
    total_vehicles = vehicles_col.count_documents({})
    total_bookings = bookings_col.count_documents({})
    
    successful_payments = list(payments_col.find({"payment_status": "Success"}))
    total_revenue = sum(p.get('amount', 0.0) for p in successful_payments)
    
    # Calculate avg driver rating
    drivers = list(drivers_col.find({}))
    avg_rating = sum(d.get('rating', 5.0) for d in drivers) / len(drivers) if drivers else 5.0
    
    methods = ["UPI", "Credit Card", "Debit Card", "Wallet", "Cash"]
    revenue_by_method = {}
    for m in methods:
        revenue_by_method[m] = sum(p.get('amount', 0.0) for p in successful_payments if p.get('payment_method') == m)
        
    statuses = ["Requested", "Accepted", "In Progress", "Completed", "Cancelled"]
    rides_breakdown = {}
    for s in statuses:
        rides_breakdown[s] = bookings_col.count_documents({"ride_status": s})
        
    recent_bookings = serialize_doc(list(bookings_col.find().sort("booking_date", -1).limit(5)))
    
    return Response({
        "total_customers": total_customers,
        "total_drivers": total_drivers,
        "total_vehicles": total_vehicles,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "avg_driver_rating": round(avg_rating, 2),
        "revenue_by_method": revenue_by_method,
        "rides_breakdown": rides_breakdown,
        "recent_bookings": recent_bookings
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def driver_dashboard_stats(request, driver_name):
    assigned = bookings_col.count_documents({"driver_name": driver_name, "ride_status": {"$in": ["Accepted", "In Progress"]}})
    completed = bookings_col.count_documents({"driver_name": driver_name, "ride_status": "Completed"})
    
    completed_bookings = list(bookings_col.find({"driver_name": driver_name, "ride_status": "Completed"}))
    earnings = sum(b.get('fare', 0.0) for b in completed_bookings)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_bookings = [b for b in completed_bookings if today_str in b.get('booking_date', '')]
    today_earnings = sum(b.get('fare', 0.0) for b in today_bookings)
    
    active_rides = serialize_doc(list(bookings_col.find({
        "driver_name": driver_name,
        "ride_status": {"$in": ["Accepted", "In Progress"]}
    }).sort("booking_date", -1)))
    
    completed_rides = serialize_doc(list(bookings_col.find({
        "driver_name": driver_name,
        "ride_status": "Completed"
    }).sort("booking_date", -1).limit(10)))

    return Response({
        "assigned_rides": assigned,
        "completed_trips": completed,
        "total_earnings": earnings,
        "today_earnings": today_earnings,
        "active_rides": active_rides,
        "completed_rides": completed_rides
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def customer_dashboard_stats(request, customer_name):
    total = bookings_col.count_documents({"customer_name": customer_name})
    completed = bookings_col.count_documents({"customer_name": customer_name, "ride_status": "Completed"})
    cancelled = bookings_col.count_documents({"customer_name": customer_name, "ride_status": "Cancelled"})
    upcoming = bookings_col.count_documents({"customer_name": customer_name, "ride_status": {"$in": ["Requested", "Accepted", "In Progress"]}})
    
    recent_bookings = serialize_doc(list(bookings_col.find({"customer_name": customer_name}).sort("booking_date", -1).limit(5)))
    payments = serialize_doc(list(payments_col.find({"customer_name": customer_name}).sort("payment_date", -1).limit(5)))
    
    return Response({
        "total_rides": total,
        "completed_rides": completed,
        "cancelled_rides": cancelled,
        "upcoming_rides": upcoming,
        "recent_bookings": recent_bookings,
        "payment_history": payments
    }, status=status.HTTP_200_OK)

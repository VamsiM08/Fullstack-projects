from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json
from datetime import datetime

from backend_app.models import User, Event, Venue, Booking, Payment, Review

# Helper function to generate IDs if not provided
def get_next_id(model_class, id_field_name):
    max_obj = model_class.objects.order_by(f'-{id_field_name}').first()
    if max_obj:
        return getattr(max_obj, id_field_name) + 1
    base_ids = {
        'User': 101,
        'Event': 201,
        'Venue': 301,
        'Booking': 401,
        'Payment': 501
    }
    return base_ids.get(model_class.__name__, 1)

# ==================== MODULE 1: USER MANAGEMENT ====================

@csrf_exempt
@api_view(['POST'])
def add_user(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    user_id = data.get('user_id') or get_next_id(User, 'user_id')
    
    # Check if user with same email exists
    if User.objects.filter(email=data.get('email')).exists():
        return Response({"error": "User with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User.objects.create(
        user_id=user_id,
        full_name=data.get('full_name', ''),
        email=data.get('email', ''),
        phone=data.get('phone', ''),
        city=data.get('city', ''),
        password=data.get('password', ''),
        role=data.get('role', 'user')
    )
    return Response(user.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_users(request):
    users = User.objects.all()
    return Response([u.to_dict() for u in users], status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['PUT'])
def update_user(request, id):
    try:
        user = User.objects.get(user_id=id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.city = data.get('city', user.city)
    if 'password' in data and data['password']:
        user.password = data['password']
    if 'role' in data:
        user.role = data['role']
    user.save()
    return Response(user.to_dict(), status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
def delete_user(request, id):
    try:
        user = User.objects.get(user_id=id)
        user.delete()
        return Response({"message": f"User {id} deleted successfully"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
def login_user(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    email = data.get('email')
    password = data.get('password')
    
    try:
        user = User.objects.get(email=email, password=password)
        return Response({"message": "Login successful", "user": user.to_dict()}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)


# ==================== MODULE 2: EVENT MANAGEMENT ====================

@csrf_exempt
@api_view(['POST'])
def add_event(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    event_id = data.get('event_id') or get_next_id(Event, 'event_id')
    
    event = Event.objects.create(
        event_id=event_id,
        event_name=data.get('event_name', ''),
        category=data.get('category', 'Conference'),
        organizer_name=data.get('organizer_name', ''),
        event_date=str(data.get('event_date', '')),
        event_time=str(data.get('event_time', '')),
        venue=data.get('venue', ''),
        ticket_price=float(data.get('ticket_price', 0)),
        available_tickets=int(data.get('available_tickets', 100)),
        description=data.get('description', ''),
        image_url=data.get('image_url', ''),
        rating=float(data.get('rating', 4.8))
    )
    return Response(event.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_events(request):
    events = Event.objects.all()
    return Response([e.to_dict() for e in events], status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['PUT'])
def update_event(request, id):
    try:
        event = Event.objects.get(event_id=id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    event.event_name = data.get('event_name', event.event_name)
    event.category = data.get('category', event.category)
    event.organizer_name = data.get('organizer_name', event.organizer_name)
    event.event_date = str(data.get('event_date', event.event_date))
    event.event_time = str(data.get('event_time', event.event_time))
    event.venue = data.get('venue', event.venue)
    event.ticket_price = float(data.get('ticket_price', event.ticket_price))
    event.available_tickets = int(data.get('available_tickets', event.available_tickets))
    if 'description' in data:
        event.description = data['description']
    if 'image_url' in data:
        event.image_url = data['image_url']
    if 'rating' in data:
        event.rating = float(data['rating'])
    event.save()
    return Response(event.to_dict(), status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
def delete_event(request, id):
    try:
        event = Event.objects.get(event_id=id)
        event.delete()
        return Response({"message": f"Event {id} deleted successfully"}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)


# ==================== MODULE 3: VENUE MANAGEMENT ====================

@csrf_exempt
@api_view(['POST'])
def add_venue(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    venue_id = data.get('venue_id') or get_next_id(Venue, 'venue_id')
    
    venue = Venue.objects.create(
        venue_id=venue_id,
        venue_name=data.get('venue_name', ''),
        location=data.get('location', ''),
        city=data.get('city', ''),
        capacity=int(data.get('capacity', 500)),
        contact_person=data.get('contact_person', '')
    )
    return Response(venue.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_venues(request):
    venues = Venue.objects.all()
    return Response([v.to_dict() for v in venues], status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['PUT'])
def update_venue(request, id):
    try:
        venue = Venue.objects.get(venue_id=id)
    except Venue.DoesNotExist:
        return Response({"error": "Venue not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    venue.venue_name = data.get('venue_name', venue.venue_name)
    venue.location = data.get('location', venue.location)
    venue.city = data.get('city', venue.city)
    venue.capacity = int(data.get('capacity', venue.capacity))
    venue.contact_person = data.get('contact_person', venue.contact_person)
    venue.save()
    return Response(venue.to_dict(), status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
def delete_venue(request, id):
    try:
        venue = Venue.objects.get(venue_id=id)
        venue.delete()
        return Response({"message": f"Venue {id} deleted successfully"}, status=status.HTTP_200_OK)
    except Venue.DoesNotExist:
        return Response({"error": "Venue not found"}, status=status.HTTP_404_NOT_FOUND)


# ==================== MODULE 4: TICKET BOOKING MANAGEMENT ====================

@csrf_exempt
@api_view(['POST'])
def add_booking(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    booking_id = data.get('booking_id') or get_next_id(Booking, 'booking_id')
    num_tickets = int(data.get('number_of_tickets', 1))
    
    # Deduct available tickets if event matches
    event_name = data.get('event_name', '')
    matching_events = Event.objects.filter(event_name=event_name)
    if matching_events.exists():
        event = matching_events.first()
        if event.available_tickets >= num_tickets:
            event.available_tickets -= num_tickets
            event.save()
            
    booking = Booking.objects.create(
        booking_id=booking_id,
        user_name=data.get('user_name', ''),
        event_name=event_name,
        booking_date=str(data.get('booking_date', datetime.now().strftime('%Y-%m-%d'))),
        number_of_tickets=num_tickets,
        total_amount=float(data.get('total_amount', 0)),
        booking_status=data.get('booking_status', 'Confirmed'),
        seats=data.get('seats', '')
    )
    return Response(booking.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_bookings(request):
    bookings = Booking.objects.all()
    return Response([b.to_dict() for b in bookings], status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['PUT'])
def update_booking(request, id):
    try:
        booking = Booking.objects.get(booking_id=id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    booking.user_name = data.get('user_name', booking.user_name)
    booking.event_name = data.get('event_name', booking.event_name)
    booking.booking_date = str(data.get('booking_date', booking.booking_date))
    booking.number_of_tickets = int(data.get('number_of_tickets', booking.number_of_tickets))
    booking.total_amount = float(data.get('total_amount', booking.total_amount))
    booking.booking_status = data.get('booking_status', booking.booking_status)
    if 'seats' in data:
        booking.seats = data['seats']
    booking.save()
    return Response(booking.to_dict(), status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
def delete_booking(request, id):
    try:
        booking = Booking.objects.get(booking_id=id)
        # Restore tickets if cancelled/deleted
        matching_events = Event.objects.filter(event_name=booking.event_name)
        if matching_events.exists():
            ev = matching_events.first()
            ev.available_tickets += booking.number_of_tickets
            ev.save()
        booking.delete()
        return Response({"message": f"Booking {id} deleted successfully"}, status=status.HTTP_200_OK)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)


# ==================== MODULE 5: PAYMENT MANAGEMENT ====================

@csrf_exempt
@api_view(['POST'])
def add_payment(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    payment_id = data.get('payment_id') or get_next_id(Payment, 'payment_id')
    
    payment = Payment.objects.create(
        payment_id=payment_id,
        booking_id=int(data.get('booking_id', 0)),
        user_name=data.get('user_name', ''),
        amount=float(data.get('amount', 0)),
        payment_method=data.get('payment_method', 'UPI'),
        payment_status=data.get('payment_status', 'Success'),
        transaction_id=data.get('transaction_id', f'TXN{payment_id}987'),
        payment_date=str(data.get('payment_date', datetime.now().strftime('%Y-%m-%d')))
    )
    
    # Update linked booking status if payment successful
    if payment.payment_status == 'Success' and payment.booking_id:
        try:
            b = Booking.objects.get(booking_id=payment.booking_id)
            b.booking_status = 'Confirmed'
            b.save()
        except Booking.DoesNotExist:
            pass
            
    return Response(payment.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_payments(request):
    payments = Payment.objects.all()
    return Response([p.to_dict() for p in payments], status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['PUT'])
def update_payment(request, id):
    try:
        payment = Payment.objects.get(payment_id=id)
    except Payment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    payment.booking_id = int(data.get('booking_id', payment.booking_id))
    payment.user_name = data.get('user_name', payment.user_name)
    payment.amount = float(data.get('amount', payment.amount))
    payment.payment_method = data.get('payment_method', payment.payment_method)
    payment.payment_status = data.get('payment_status', payment.payment_status)
    payment.transaction_id = data.get('transaction_id', payment.transaction_id)
    payment.payment_date = str(data.get('payment_date', payment.payment_date))
    payment.save()
    return Response(payment.to_dict(), status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
def delete_payment(request, id):
    try:
        payment = Payment.objects.get(payment_id=id)
        payment.delete()
        return Response({"message": f"Payment {id} deleted successfully"}, status=status.HTTP_200_OK)
    except Payment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)


# ==================== BONUS MODULE: REVIEWS & RATINGS ====================

@csrf_exempt
@api_view(['POST'])
def add_review(request):
    data = request.data if isinstance(request.data, dict) else json.loads(request.body)
    review = Review.objects.create(
        event_id=int(data.get('event_id', 0)),
        user_name=data.get('user_name', 'Anonymous User'),
        rating=int(data.get('rating', 5)),
        comment=data.get('comment', ''),
        created_at=datetime.now().strftime('%Y-%m-%d %H:%M')
    )
    return Response(review.to_dict(), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_event_reviews(request, event_id):
    reviews = Review.objects.filter(event_id=event_id).order_by('-review_id')
    return Response([r.to_dict() for r in reviews], status=status.HTTP_200_OK)

import json
import uuid
from datetime import datetime
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from api.db import db
from api.auth import (
    hash_password, verify_password, generate_token, 
    token_required, admin_required
)
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO

# --- Helper functions ---

def serialize(doc):
    """Recursively serialize MongoDB objects (like ObjectIds) to standard JSON format."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(item) for item in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if k == '_id':
                new_doc['_id'] = str(v)
            elif isinstance(v, dict):
                new_doc[k] = serialize(v)
            elif isinstance(v, list):
                new_doc[k] = [serialize(item) if isinstance(item, dict) else item for item in v]
            else:
                new_doc[k] = v
        return new_doc
    return doc

def resolve_show(show):
    """Embed movie, theatre, and screen documents into show response details."""
    if not show:
        return None
    show = serialize(show)
    movie = db.movies.find_one({"_id": show.get("movieId")})
    theatre = db.theatres.find_one({"_id": show.get("theatreId")})
    screen = db.screens.find_one({"_id": show.get("screenId")})
    
    show["movie"] = serialize(movie)
    show["theatre"] = serialize(theatre)
    show["screen"] = serialize(screen)
    return show

def resolve_booking(booking):
    """Embed user and show (with full movie/theatre details) into booking details."""
    if not booking:
        return None
    booking = serialize(booking)
    user = db.users.find_one({"_id": booking.get("userId")}, {"password": 0})
    show = db.shows.find_one({"_id": booking.get("showId")})
    
    booking["user"] = serialize(user)
    booking["show"] = resolve_show(show)
    return booking


# --- Authentication APIs ---

@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    try:
        data = json.loads(request.body)
        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")
        role = data.get("role", "customer") # defaults to customer

        if not all([name, email, phone, password]):
            return JsonResponse({"message": "All fields (name, email, phone, password) are required"}, status=400)

        # Check existing user
        if db.users.find_one({"email": email}):
            return JsonResponse({"message": "User with this email already exists"}, status=400)

        hashed = hash_password(password)
        user_id = str(uuid.uuid4())
        
        user_doc = {
            "_id": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "password": hashed,
            "role": role
        }
        db.users.insert_one(user_doc)
        return JsonResponse({"message": "User registered successfully", "userId": user_id}, status=201)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse({"message": "Email and password are required"}, status=400)

        user = db.users.find_one({"email": email})
        if not user or not verify_password(password, user.get("password")):
            return JsonResponse({"message": "Invalid email or password"}, status=401)

        if user.get("active") == False:
            return JsonResponse({"message": "Your account has been blocked. Please contact admin."}, status=403)

        token = generate_token(user["_id"], user["email"], user["role"])
        return JsonResponse({
            "message": "Login successful",
            "token": token,
            "user": {
                "_id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
            }
        }, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def logout_user(request):
    # JWT authentication is stateless. Logging out is handled client side by removing token.
    return JsonResponse({"message": "Logged out successfully"}, status=200)

@csrf_exempt
@token_required
def profile_user(request):
    if request.method == "GET":
        user_info = serialize(request.user)
        user_info.pop("password", None)
        return JsonResponse(user_info, status=200)

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            update_data = {}
            if "name" in data:
                update_data["name"] = data["name"]
            if "phone" in data:
                update_data["phone"] = data["phone"]
            if "email" in data:
                # check unique email
                existing = db.users.find_one({"email": data["email"]})
                if existing and str(existing["_id"]) != str(request.user["_id"]):
                    return JsonResponse({"message": "Email already in use by another account"}, status=400)
                update_data["email"] = data["email"]
            if "password" in data and data["password"].strip() != "":
                update_data["password"] = hash_password(data["password"])

            if not update_data:
                return JsonResponse({"message": "No valid fields provided for update"}, status=400)

            db.users.update_one({"_id": request.user["_id"]}, {"$set": update_data})
            return JsonResponse({"message": "Profile updated successfully"}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)


# --- Movie APIs ---

@csrf_exempt
def movies_list(request):
    if request.method == "GET":
        genre = request.GET.get("genre")
        language = request.GET.get("language")
        query = {}
        if genre:
            query["genre"] = {"$regex": f"^{genre}$", "$options": "i"}
        if language:
            query["language"] = {"$regex": f"^{language}$", "$options": "i"}
            
        movies = db.movies.find(query)
        return JsonResponse(serialize(movies), safe=False, status=200)

    elif request.method == "POST":
        # Admin authentication check
        @admin_required
        def create_movie(req):
            try:
                data = json.loads(req.body)
                title = data.get("title")
                genre = data.get("genre")
                language = data.get("language")
                duration = data.get("duration", "2h")
                rating = data.get("rating", "8.0")
                releaseDate = data.get("releaseDate", "")
                poster = data.get("poster", "")
                banner = data.get("banner", "")
                trailer = data.get("trailer", "")
                description = data.get("description", "")

                if not title or not genre or not language:
                    return JsonResponse({"message": "Title, genre and language are required"}, status=400)

                movie_doc = {
                    "_id": str(uuid.uuid4()),
                    "title": title,
                    "genre": genre,
                    "language": language,
                    "duration": duration,
                    "rating": rating,
                    "releaseDate": releaseDate,
                    "poster": poster,
                    "banner": banner,
                    "trailer": trailer,
                    "description": description
                }
                db.movies.insert_one(movie_doc)
                return JsonResponse({"message": "Movie created successfully", "movie": movie_doc}, status=201)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return create_movie(request)

@csrf_exempt
def movie_detail(request, movie_id):
    if request.method == "GET":
        movie = db.movies.find_one({"_id": movie_id})
        if not movie:
            return JsonResponse({"message": "Movie not found"}, status=404)
        return JsonResponse(serialize(movie), status=200)

    elif request.method == "PUT":
        @admin_required
        def update_movie(req):
            try:
                data = json.loads(req.body)
                movie = db.movies.find_one({"_id": movie_id})
                if not movie:
                    return JsonResponse({"message": "Movie not found"}, status=404)
                
                db.movies.update_one({"_id": movie_id}, {"$set": data})
                updated = db.movies.find_one({"_id": movie_id})
                return JsonResponse({"message": "Movie updated successfully", "movie": serialize(updated)}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return update_movie(request)

    elif request.method == "DELETE":
        @admin_required
        def delete_movie(req):
            try:
                movie = db.movies.find_one({"_id": movie_id})
                if not movie:
                    return JsonResponse({"message": "Movie not found"}, status=404)
                
                # Delete any associated shows and bookings
                shows = db.shows.find({"movieId": movie_id})
                for s in shows:
                    db.bookings.delete_many({"showId": s["_id"]})
                db.shows.delete_many({"movieId": movie_id})
                db.movies.delete_one({"_id": movie_id})
                
                return JsonResponse({"message": "Movie and related schedules deleted successfully"}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return delete_movie(request)

@csrf_exempt
@require_http_methods(["GET"])
def movies_search(request):
    q = request.GET.get("q", "")
    if not q:
        movies = db.movies.find({})
        return JsonResponse(serialize(movies), safe=False, status=200)
        
    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"genre": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"language": {"$regex": q, "$options": "i"}}
        ]
    }
    movies = db.movies.find(query)
    return JsonResponse(serialize(movies), safe=False, status=200)

@csrf_exempt
@require_http_methods(["GET"])
def movies_by_genre(request, genre):
    movies = db.movies.find({"genre": {"$regex": f"^{genre}$", "$options": "i"}})
    return JsonResponse(serialize(movies), safe=False, status=200)

@csrf_exempt
@require_http_methods(["GET"])
def movies_by_language(request, language):
    movies = db.movies.find({"language": {"$regex": f"^{language}$", "$options": "i"}})
    return JsonResponse(serialize(movies), safe=False, status=200)


# --- Theatre & Screen APIs ---

@csrf_exempt
def theatres_list(request):
    if request.method == "GET":
        city = request.GET.get("city")
        query = {}
        if city:
            query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        theatres = db.theatres.find(query)
        return JsonResponse(serialize(theatres), safe=False, status=200)

    elif request.method == "POST":
        @admin_required
        def create_theatre(req):
            try:
                data = json.loads(req.body)
                theatreName = data.get("theatreName")
                city = data.get("city")
                address = data.get("address", "")
                screens_cnt = int(data.get("screens", 1))

                if not theatreName or not city:
                    return JsonResponse({"message": "Theatre name and City are required"}, status=400)

                theatre_id = str(uuid.uuid4())
                theatre_doc = {
                    "_id": theatre_id,
                    "theatreName": theatreName,
                    "city": city,
                    "address": address,
                    "screens": screens_cnt
                }
                db.theatres.insert_one(theatre_doc)
                
                # Automatically create Screens
                for i in range(1, screens_cnt + 1):
                    screen_doc = {
                        "_id": f"screen-{theatre_id}-{i}",
                        "theatreId": theatre_id,
                        "screenName": f"Screen {i}",
                        "totalSeats": 120
                    }
                    db.screens.insert_one(screen_doc)

                return JsonResponse({"message": "Theatre and screens created successfully", "theatre": theatre_doc}, status=201)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return create_theatre(request)

@csrf_exempt
def theatre_detail(request, theatre_id):
    if request.method == "GET":
        theatre = db.theatres.find_one({"_id": theatre_id})
        if not theatre:
            return JsonResponse({"message": "Theatre not found"}, status=404)
        return JsonResponse(serialize(theatre), status=200)

    elif request.method == "PUT":
        @admin_required
        def update_theatre(req):
            try:
                data = json.loads(req.body)
                theatre = db.theatres.find_one({"_id": theatre_id})
                if not theatre:
                    return JsonResponse({"message": "Theatre not found"}, status=404)
                
                db.theatres.update_one({"_id": theatre_id}, {"$set": data})
                updated = db.theatres.find_one({"_id": theatre_id})
                return JsonResponse({"message": "Theatre updated successfully", "theatre": serialize(updated)}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return update_theatre(request)

    elif request.method == "DELETE":
        @admin_required
        def delete_theatre(req):
            try:
                theatre = db.theatres.find_one({"_id": theatre_id})
                if not theatre:
                    return JsonResponse({"message": "Theatre not found"}, status=404)
                
                # Delete related screens, shows, bookings
                db.screens.delete_many({"theatreId": theatre_id})
                shows = db.shows.find({"theatreId": theatre_id})
                for s in shows:
                    db.bookings.delete_many({"showId": s["_id"]})
                db.shows.delete_many({"theatreId": theatre_id})
                db.theatres.delete_one({"_id": theatre_id})
                
                return JsonResponse({"message": "Theatre and all dependent schedules/bookings deleted"}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return delete_theatre(request)


# --- Screen APIs ---

@csrf_exempt
def screens_list(request):
    if request.method == "GET":
        theatreId = request.GET.get("theatreId")
        query = {}
        if theatreId:
            query["theatreId"] = theatreId
        screens = db.screens.find(query)
        return JsonResponse(serialize(screens), safe=False, status=200)

    elif request.method == "POST":
        @admin_required
        def create_screen(req):
            try:
                data = json.loads(req.body)
                theatreId = data.get("theatreId")
                screenName = data.get("screenName")
                totalSeats = int(data.get("totalSeats", 120))

                if not theatreId or not screenName:
                    return JsonResponse({"message": "Theatre ID and Screen Name are required"}, status=400)

                screen_doc = {
                    "_id": str(uuid.uuid4()),
                    "theatreId": theatreId,
                    "screenName": screenName,
                    "totalSeats": totalSeats
                }
                db.screens.insert_one(screen_doc)
                
                # Update screens count in Theatre doc
                count = db.screens.count_documents({"theatreId": theatreId})
                db.theatres.update_one({"_id": theatreId}, {"$set": {"screens": count}})

                return JsonResponse({"message": "Screen added successfully", "screen": screen_doc}, status=201)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return create_screen(request)

@csrf_exempt
def screen_detail(request, screen_id):
    if request.method == "GET":
        screen = db.screens.find_one({"_id": screen_id})
        if not screen:
            return JsonResponse({"message": "Screen not found"}, status=404)
        return JsonResponse(serialize(screen), status=200)

    elif request.method == "PUT":
        @admin_required
        def update_screen(req):
            try:
                data = json.loads(req.body)
                screen = db.screens.find_one({"_id": screen_id})
                if not screen:
                    return JsonResponse({"message": "Screen not found"}, status=404)
                db.screens.update_one({"_id": screen_id}, {"$set": data})
                updated = db.screens.find_one({"_id": screen_id})
                return JsonResponse({"message": "Screen updated successfully", "screen": serialize(updated)}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return update_screen(request)

    elif request.method == "DELETE":
        @admin_required
        def delete_screen(req):
            try:
                screen = db.screens.find_one({"_id": screen_id})
                if not screen:
                    return JsonResponse({"message": "Screen not found"}, status=404)
                
                theatreId = screen["theatreId"]
                # Delete related shows & bookings
                shows = db.shows.find({"screenId": screen_id})
                for s in shows:
                    db.bookings.delete_many({"showId": s["_id"]})
                db.shows.delete_many({"screenId": screen_id})
                db.screens.delete_one({"_id": screen_id})
                
                # Update screens count in Theatre
                count = db.screens.count_documents({"theatreId": theatreId})
                db.theatres.update_one({"_id": theatreId}, {"$set": {"screens": count}})

                return JsonResponse({"message": "Screen and dependent records deleted successfully"}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return delete_screen(request)


# --- Show APIs ---

@csrf_exempt
def shows_list(request):
    if request.method == "GET":
        shows = db.shows.find({})
        resolved = [resolve_show(s) for s in shows]
        return JsonResponse(resolved, safe=False, status=200)

    elif request.method == "POST":
        @admin_required
        def create_show(req):
            try:
                data = json.loads(req.body)
                movieId = data.get("movieId")
                theatreId = data.get("theatreId")
                screenId = data.get("screenId")
                showDate = data.get("showDate")
                showTime = data.get("showTime")
                ticketPrice = float(data.get("ticketPrice", 250))
                enabled = data.get("enabled", True)

                if not all([movieId, theatreId, screenId, showDate, showTime]):
                    return JsonResponse({"message": "movieId, theatreId, screenId, showDate, showTime are required"}, status=400)

                show_doc = {
                    "_id": str(uuid.uuid4()),
                    "movieId": movieId,
                    "theatreId": theatreId,
                    "screenId": screenId,
                    "showDate": showDate,
                    "showTime": showTime,
                    "ticketPrice": ticketPrice,
                    "enabled": enabled
                }
                db.shows.insert_one(show_doc)
                return JsonResponse({"message": "Show created successfully", "show": resolve_show(show_doc)}, status=201)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return create_show(request)

@csrf_exempt
def show_detail(request, show_id):
    if request.method == "GET":
        show = db.shows.find_one({"_id": show_id})
        if not show:
            return JsonResponse({"message": "Show not found"}, status=404)
        return JsonResponse(resolve_show(show), status=200)

    elif request.method == "PUT":
        @admin_required
        def update_show(req):
            try:
                data = json.loads(req.body)
                show = db.shows.find_one({"_id": show_id})
                if not show:
                    return JsonResponse({"message": "Show not found"}, status=404)
                
                db.shows.update_one({"_id": show_id}, {"$set": data})
                updated = db.shows.find_one({"_id": show_id})
                return JsonResponse({"message": "Show updated successfully", "show": resolve_show(updated)}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return update_show(request)

    elif request.method == "DELETE":
        @admin_required
        def delete_show(req):
            try:
                show = db.shows.find_one({"_id": show_id})
                if not show:
                    return JsonResponse({"message": "Show not found"}, status=404)
                
                # Delete related bookings
                db.bookings.delete_many({"showId": show_id})
                db.shows.delete_one({"_id": show_id})
                return JsonResponse({"message": "Show and bookings deleted successfully"}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        return delete_show(request)

@csrf_exempt
@require_http_methods(["GET"])
def shows_by_movie(request, movie_id):
    shows = db.shows.find({"movieId": movie_id, "enabled": True})
    resolved = [resolve_show(s) for s in shows]
    return JsonResponse(resolved, safe=False, status=200)

@csrf_exempt
@require_http_methods(["GET"])
def shows_by_theatre(request, theatre_id):
    shows = db.shows.find({"theatreId": theatre_id, "enabled": True})
    resolved = [resolve_show(s) for s in shows]
    return JsonResponse(resolved, safe=False, status=200)


# --- Seat APIs ---

@csrf_exempt
@require_http_methods(["GET"])
def get_seats(request, show_id):
    """Get dynamic seat details including total seats and booked seats for a show."""
    show = db.shows.find_one({"_id": show_id})
    if not show:
        return JsonResponse({"message": "Show not found"}, status=404)

    screen = db.screens.find_one({"_id": show.get("screenId")})
    total_seats = screen.get("totalSeats", 120) if screen else 120

    # Retrieve all booked seats for active bookings under this showId
    bookings = db.bookings.find({"showId": show_id, "status": {"$ne": "Cancelled"}})
    booked_seats = []
    for b in bookings:
        booked_seats.extend(b.get("seats", []))

    return JsonResponse({
        "showId": show_id,
        "totalSeats": total_seats,
        "bookedSeats": booked_seats
    }, status=200)

@csrf_exempt
@require_http_methods(["PUT"])
@token_required
def book_seats(request):
    """An alternative seat booking interface representing booking creation or reservation."""
    try:
        data = json.loads(request.body)
        showId = data.get("showId")
        seats = data.get("seats", [])
        paymentMethod = data.get("paymentMethod", "UPI")

        if not showId or not seats:
            return JsonResponse({"message": "showId and seats are required"}, status=400)

        show = db.shows.find_one({"_id": showId})
        if not show:
            return JsonResponse({"message": "Show not found"}, status=404)

        # Check seat availability
        bookings = db.bookings.find({"showId": showId, "status": {"$ne": "Cancelled"}})
        already_booked = []
        for b in bookings:
            already_booked.extend(b.get("seats", []))

        for seat in seats:
            if seat in already_booked:
                return JsonResponse({"message": f"Seat {seat} is already booked"}, status=400)

        total_amount = len(seats) * show.get("ticketPrice", 250)
        booking_id = str(uuid.uuid4())
        
        booking_doc = {
            "_id": booking_id,
            "userId": request.user["_id"],
            "showId": showId,
            "seats": seats,
            "totalAmount": total_amount,
            "paymentMethod": paymentMethod,
            "status": "Confirmed"
        }
        db.bookings.insert_one(booking_doc)
        return JsonResponse({"message": "Booking successful", "booking": resolve_booking(booking_doc)}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


# --- Booking APIs ---

@csrf_exempt
@token_required
def bookings_list(request):
    if request.method == "GET":
        # If admin, return all bookings. If customer, return user-specific bookings.
        if request.user.get("role") == "admin":
            bookings = db.bookings.find({})
        else:
            bookings = db.bookings.find({"userId": request.user["_id"]})
        resolved = [resolve_booking(b) for b in bookings]
        return JsonResponse(resolved, safe=False, status=200)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            showId = data.get("showId")
            seats = data.get("seats", [])
            paymentMethod = data.get("paymentMethod", "UPI")

            if not showId or not seats:
                return JsonResponse({"message": "showId and seats lists are required"}, status=400)

            show = db.shows.find_one({"_id": showId})
            if not show:
                return JsonResponse({"message": "Show details not found"}, status=404)

            # Check seat overlap
            bookings = db.bookings.find({"showId": showId, "status": {"$ne": "Cancelled"}})
            already_booked = []
            for b in bookings:
                already_booked.extend(b.get("seats", []))

            for seat in seats:
                if seat in already_booked:
                    return JsonResponse({"message": f"Seat {seat} is already booked"}, status=400)

            amount = len(seats) * show.get("ticketPrice", 250)
            booking_id = str(uuid.uuid4())

            booking_doc = {
                "_id": booking_id,
                "userId": request.user["_id"],
                "showId": showId,
                "seats": seats,
                "totalAmount": amount,
                "paymentMethod": paymentMethod,
                "status": "Confirmed"
            }
            db.bookings.insert_one(booking_doc)
            return JsonResponse({"message": "Ticket booking created successfully", "booking": resolve_booking(booking_doc)}, status=201)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@token_required
def booking_detail(request, booking_id):
    booking = db.bookings.find_one({"_id": booking_id})
    if not booking:
        return JsonResponse({"message": "Booking not found"}, status=404)

    # Check permission (must be owner or admin)
    if request.user.get("role") != "admin" and str(booking.get("userId")) != str(request.user["_id"]):
        return JsonResponse({"message": "Forbidden. Unauthorized access to booking details"}, status=403)

    if request.method == "GET":
        return JsonResponse(resolve_booking(booking), status=200)

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            # Only status can be updated (e.g. Cancelled)
            if "status" not in data:
                return JsonResponse({"message": "Only status field updates are permitted"}, status=400)
            
            db.bookings.update_one({"_id": booking_id}, {"$set": {"status": data["status"]}})
            updated = db.bookings.find_one({"_id": booking_id})
            return JsonResponse({"message": "Booking updated successfully", "booking": resolve_booking(updated)}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

    elif request.method == "DELETE":
        # Cancel booking (sets status to Cancelled)
        try:
            db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "Cancelled"}})
            updated = db.bookings.find_one({"_id": booking_id})
            return JsonResponse({"message": "Booking cancelled successfully", "booking": resolve_booking(updated)}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)


# --- PDF Ticket Generation ---

@csrf_exempt
@token_required
def booking_ticket_pdf(request, booking_id):
    """Generate dynamic PDF ticket download using reportlab."""
    booking = db.bookings.find_one({"_id": booking_id})
    if not booking:
        return JsonResponse({"message": "Booking not found"}, status=404)
        
    # Check permissions
    if request.user.get("role") != "admin" and str(booking.get("userId")) != str(request.user["_id"]):
        return JsonResponse({"message": "Forbidden. Unauthorized access"}, status=403)

    # Gather information
    resolved = resolve_booking(booking)
    user = resolved.get("user", {})
    show = resolved.get("show", {})
    movie = show.get("movie", {}) if show else {}
    theatre = show.get("theatre", {}) if show else {}
    screen = show.get("screen", {}) if show else {}

    # Build PDF Document
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    story = []

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1A1A1A"),
        spaceAfter=15,
        alignment=1 # Center
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#2563EB"),
        spaceBefore=10,
        spaceAfter=10
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#333333")
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#FFFFFF")
    )

    story.append(Paragraph("MOVIE TICKET CONFIRMATION", title_style))
    story.append(Spacer(1, 15))

    # General Info Table
    info_data = [
        [Paragraph("<b>Ticket Number:</b>", body_style), Paragraph(str(booking.get("_id")), body_style),
         Paragraph("<b>Booking Date:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d"), body_style)],
        [Paragraph("<b>Customer Name:</b>", body_style), Paragraph(user.get("name", "N/A"), body_style),
         Paragraph("<b>Payment Status:</b>", body_style), Paragraph(booking.get("status", "Confirmed"), body_style)]
    ]
    
    info_table = Table(info_data, colWidths=[120, 160, 100, 120])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.lightgrey)
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))

    # Show Details Table
    story.append(Paragraph("Show details", section_title))
    
    details_header = [
        Paragraph("Movie", header_style),
        Paragraph("Theatre & Screen", header_style),
        Paragraph("Date & Time", header_style),
        Paragraph("Seats", header_style),
        Paragraph("Amount Paid", header_style)
    ]
    
    details_row = [
        Paragraph(f"<b>{movie.get('title', 'N/A')}</b><br/>{movie.get('language', '')} ({movie.get('genre', '')})", body_style),
        Paragraph(f"<b>{theatre.get('theatreName', 'N/A')}</b><br/>{theatre.get('city', '')}<br/>{screen.get('screenName', 'Screen 1')}", body_style),
        Paragraph(f"Date: {show.get('showDate', 'N/A')}<br/>Time: {show.get('showTime', 'N/A')}", body_style),
        Paragraph(", ".join(booking.get("seats", [])), body_style),
        Paragraph(f"Rs. {booking.get('totalAmount', 0.0)} ({booking.get('paymentMethod', 'UPI')})", body_style)
    ]

    details_data = [details_header, details_row]
    details_table = Table(details_data, colWidths=[110, 130, 110, 80, 90])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2563EB")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 30))

    # Important Instructions
    story.append(Paragraph("Terms & Conditions", section_title))
    instructions = (
        "1. Please carry a copy of this ticket (digital or printed) along with a valid ID proof.<br/>"
        "2. Tickets once purchased cannot be cancelled or refunded within 2 hours of show timing.<br/>"
        "3. Outside food and beverages are strictly not allowed inside the theatre premises.<br/>"
        "4. Parents are advised to inspect movie age certifications (e.g. A-rated content) before booking."
    )
    story.append(Paragraph(instructions, body_style))

    # Build PDF
    doc.build(story)
    
    buffer.seek(0)
    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="ticket-{booking_id}.pdf"'
    return response


# --- Dashboard APIs ---

@csrf_exempt
@admin_required
def dashboard_summary(request):
    """Provide KPI overview numbers for movies, theatres, bookings, users, and revenues."""
    try:
        total_movies = db.movies.count_documents({})
        total_theatres = db.theatres.count_documents({})
        total_screens = db.screens.count_documents({})
        total_shows = db.shows.count_documents({})
        
        # filter user-roles counts
        total_users = db.users.count_documents({"role": "customer"})
        
        # Bookings metrics
        bookings = db.bookings.find({"status": "Confirmed"})
        total_bookings = 0
        today_revenue = 0.0
        monthly_revenue = 0.0
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        current_month_str = datetime.now().strftime("%Y-%m")
        
        for b in bookings:
            total_bookings += 1
            amount = float(b.get("totalAmount", 0))
            
            # Resolve showDate of the booking
            show = db.shows.find_one({"_id": b.get("showId")})
            if show:
                show_date = show.get("showDate", "")
                if show_date == today_str:
                    today_revenue += amount
                if show_date.startswith(current_month_str):
                    monthly_revenue += amount

        return JsonResponse({
            "totalMovies": total_movies,
            "totalTheatres": total_theatres,
            "totalScreens": total_screens,
            "totalShows": total_shows,
            "totalBookings": total_bookings,
            "totalUsers": total_users,
            "todayRevenue": today_revenue,
            "monthlyRevenue": monthly_revenue
        }, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@admin_required
def dashboard_revenue(request):
    """Return structured daily and monthly revenue breakdowns for analytics charting."""
    try:
        bookings = db.bookings.find({"status": "Confirmed"})
        daily_breakdown = {}
        monthly_breakdown = {}

        for b in bookings:
            amount = float(b.get("totalAmount", 0))
            show = db.shows.find_one({"_id": b.get("showId")})
            if show:
                date_str = show.get("showDate", "")
                month_str = date_str[:7] # YYYY-MM
                
                daily_breakdown[date_str] = daily_breakdown.get(date_str, 0.0) + amount
                if month_str:
                    monthly_breakdown[month_str] = monthly_breakdown.get(month_str, 0.0) + amount

        # Convert back to sorted lists
        daily_list = [{"date": k, "revenue": v} for k, v in sorted(daily_breakdown.items())]
        monthly_list = [{"month": k, "revenue": v} for k, v in sorted(monthly_breakdown.items())]

        return JsonResponse({
            "dailyRevenue": daily_list,
            "monthlyRevenue": monthly_list
        }, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@admin_required
def dashboard_bookings(request):
    """Retrieve detailed stats of active vs cancelled bookings and recent bookings table."""
    try:
        bookings = db.bookings.find({})
        status_counts = {"Confirmed": 0, "Cancelled": 0}
        recent_bookings = []

        for b in bookings:
            status = b.get("status", "Confirmed")
            status_counts[status] = status_counts.get(status, 0) + 1
            recent_bookings.append(resolve_booking(b))

        # Sort recent bookings (we assume bookings are ordered or just sort them)
        # For simplicity, reverse list for latest first and cap at 10 items
        recent_bookings.reverse()
        recent_bookings = recent_bookings[:10]

        return JsonResponse({
            "statusCounts": status_counts,
            "recentBookings": recent_bookings
        }, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@admin_required
def dashboard_top_movies(request):
    """Return top movies ranked by booking count & booking revenues."""
    try:
        bookings = db.bookings.find({"status": "Confirmed"})
        movie_stats = {} # movieId -> {"title": str, "bookings": int, "revenue": float}

        for b in bookings:
            amount = float(b.get("totalAmount", 0))
            show = db.shows.find_one({"_id": b.get("showId")})
            if show:
                movieId = show.get("movieId")
                movie = db.movies.find_one({"_id": movieId})
                title = movie.get("title", "Unknown") if movie else "Unknown"
                
                if movieId not in movie_stats:
                    movie_stats[movieId] = {"movieId": movieId, "title": title, "bookingsCount": 0, "revenue": 0.0}
                
                movie_stats[movieId]["bookingsCount"] += 1
                movie_stats[movieId]["revenue"] += amount

        # Sort by bookings count descending
        sorted_movies = sorted(movie_stats.values(), key=lambda x: x["bookingsCount"], reverse=True)
        return JsonResponse(sorted_movies, safe=False, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


# --- User Management APIs ---

@csrf_exempt
@admin_required
def users_list(request):
    """Retrieve lists of all user records for account management."""
    if request.method == "GET":
        users = db.users.find({}, {"password": 0})
        return JsonResponse(serialize(users), safe=False, status=200)

@csrf_exempt
@admin_required
def user_status(request, user_id):
    """Admin toggle to block or activate a user account."""
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            active = data.get("active", True)
            db.users.update_one({"_id": user_id}, {"$set": {"active": active}})
            updated = db.users.find_one({"_id": user_id}, {"password": 0})
            return JsonResponse({"message": "User status updated successfully", "user": serialize(updated)}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@admin_required
def user_delete(request, user_id):
    """Admin endpoint to permanently delete a user account and associated bookings."""
    if request.method == "DELETE":
        try:
            db.bookings.delete_many({"userId": user_id})
            db.users.delete_one({"_id": user_id})
            return JsonResponse({"message": "User and associated bookings deleted successfully"}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)


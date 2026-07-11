import jwt
import datetime
from functools import wraps
from django.http import JsonResponse
from django.conf import settings
from passlib.hash import pbkdf2_sha256
from api.db import db

# Secret key for JWT signing (uses Django's secret key or fallback)
JWT_SECRET = getattr(settings, 'SECRET_KEY', 'movie-booking-site-jwt-secret-key-12345')
JWT_ALGORITHM = 'HS256'

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2."""
    return pbkdf2_sha256.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify a raw password against the PBKDF2 hash."""
    try:
        return pbkdf2_sha256.verify(password, hashed)
    except Exception:
        return False

def generate_token(user_id: str, email: str, role: str) -> str:
    """Generate a JWT token valid for 24 hours."""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode a JWT token. Returns payload or None if invalid/expired."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def token_required(f):
    """Decorator to require a valid JWT token."""
    @wraps(f)
    def decorator(request, *args, **kwargs):
        token = None
        # Look for token in Authorization header
        auth_header = request.headers.get('Authorization', None)
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return JsonResponse({'message': 'Authorization token is missing'}, status=401)

        payload = decode_token(token)
        if not payload:
            return JsonResponse({'message': 'Token is invalid or expired'}, status=401)

        # Retrieve user from database
        user = db.users.find_one({'_id': payload['user_id']})
        if not user:
            return JsonResponse({'message': 'User associated with this token does not exist'}, status=401)

        # Attach user to request
        request.user = user
        return f(request, *args, **kwargs)
    return decorator

def admin_required(f):
    """Decorator to require a valid JWT token and administrator privileges."""
    @wraps(f)
    def decorator(request, *args, **kwargs):
        # We wrap the view with token_required first, so request.user is populated.
        @token_required
        def check_admin(req, *a, **kw):
            if req.user.get('role') != 'admin':
                return JsonResponse({'message': 'Forbidden. Admin privileges required.'}, status=403)
            return f(req, *a, **kw)
        return check_admin(request, *args, **kwargs)
    return decorator

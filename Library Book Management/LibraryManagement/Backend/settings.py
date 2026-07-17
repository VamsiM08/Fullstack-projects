from pathlib import Path
from django.http import HttpResponse

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = 'django-insecure-m+!_h7p*gox4%4v-d*o)p1x%q(o2z=s$-!%g&g($f=7*&1g)r^'

DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.contenttypes',
]

class SimpleCORSMiddleware:
    """
    Custom middleware to add CORS headers and intercept OPTIONS requests.
    Enables frontend-backend Fetch API communication without django-cors-headers.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse()
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
            response["Access-Control-Max-Age"] = "86400"
            return response

        response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, Authorization"
        return response

MIDDLEWARE = [
    'django.middleware.common.CommonMiddleware',
    'settings.SimpleCORSMiddleware',
]

ROOT_URLCONF = 'urls'

TEMPLATES = []

# We provide a default SQLite db configuration to satisfy Django initialization requirements.
# Our application data is stored in MongoDB via PyMongo.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

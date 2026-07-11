from pathlib import Path
import sys
import os

BASE_DIR = Path(__file__).resolve().parent

# Ensure the Backend directory is in Python path for easy module imports
sys.path.append(str(BASE_DIR))

SECRET_KEY = 'django-insecure-food-delivery-secret-key-007'
DEBUG = True
ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Disable CSRF middleware since we are running cross-origin APIs without sessions
# and we will use @csrf_exempt decorator anyway.
MIDDLEWARE_CLASSES = []

ROOT_URLCONF = 'urls'

TEMPLATES = []

# Using native python sqlite3 in db.py directly, so dummy database configured here
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'django_internal.sqlite3',
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

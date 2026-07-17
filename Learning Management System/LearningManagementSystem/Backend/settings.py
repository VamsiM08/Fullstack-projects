import os
import sys
from pathlib import Path

# Resolve directory paths
BASE_DIR = Path(__file__).resolve().parent

# Ensure the parent directory of Backend is in python path
# so that Django can import "Backend" as an app.
parent_dir = str(BASE_DIR.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

SECRET_KEY = 'django-insecure-lms-secret-key-123456789'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
    'rest_framework',
    'Backend',  # The app containing our models, views, and urls
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'Backend.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
TIME_ZONE = 'UTC'
USE_TZ = True

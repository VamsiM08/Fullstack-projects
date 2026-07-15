from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = 'django-insecure-k3f(=!8u7&!#j3s5e3n9s(3h)e4l7m-c)x(m(p7(d$s*-0&y9i'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True  # Allows Fetch API calls from any origin (e.g. index.html)
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'urls'

TEMPLATES = []

WSGI_APPLICATION = 'wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

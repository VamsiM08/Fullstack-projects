import os
import sys

# Ensure the parent directory is in sys.path so we can import 'Backend' correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from django.conf import settings

# Inline Settings configuration for a minimal standalone Django app
if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='django-insecure-expense-tracker-app-key-1234567',
        ROOT_URLCONF='Backend.urls',
        MIDDLEWARE=[
            'django.middleware.common.CommonMiddleware',
        ],
        INSTALLED_APPS=[
            'django.contrib.contenttypes',
            'django.contrib.auth',
        ],
        ALLOWED_HOSTS=['*'],
        USE_TZ=True,
    )

from django.urls import path
from Backend import views

urlpatterns = [
    # User APIs
    path('users/add/', views.user_list_add),
    path('users/', views.user_list_add),
    path('users/update/<int:id>/', views.user_update_delete),
    path('users/delete/<int:id>/', views.user_update_delete),
    
    # Income APIs
    path('income/add/', views.income_list_add),
    path('income/', views.income_list_add),
    path('income/update/<int:id>/', views.income_update_delete),
    path('income/delete/<int:id>/', views.income_update_delete),
    
    # Expense APIs
    path('expenses/add/', views.expense_list_add),
    path('expenses/', views.expense_list_add),
    path('expenses/update/<int:id>/', views.expense_update_delete),
    path('expenses/delete/<int:id>/', views.expense_update_delete),
    
    # Category APIs
    path('categories/add/', views.category_list_add),
    path('categories/', views.category_list_add),
    path('categories/update/<int:id>/', views.category_update_delete),
    path('categories/delete/<int:id>/', views.category_update_delete),
    
    # Budget APIs
    path('budgets/add/', views.budget_list_add),
    path('budgets/', views.budget_list_add),
    path('budgets/update/<int:id>/', views.budget_update_delete),
    path('budgets/delete/<int:id>/', views.budget_update_delete),
]

# Frontend static serving configuration
from django.views.static import serve
FRONTEND_DIR = os.path.join(parent_dir, 'Frontend')

urlpatterns += [
    path('', lambda r: serve(r, 'index.html', document_root=FRONTEND_DIR)),
    path('<path:path>', serve, {'document_root': FRONTEND_DIR}),
]

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.urls')
    # Start the Django development server on port 8000
    print("Starting Expense Tracker Django Server on http://127.0.0.1:8000/ ...")
    execute_from_command_line([sys.argv[0], 'runserver', '127.0.0.1:8000'])

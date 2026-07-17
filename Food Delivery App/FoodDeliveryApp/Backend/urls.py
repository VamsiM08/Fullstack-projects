from django.urls import path
import views

urlpatterns = [
    # Module 1: Customer Management
    path('customers/add/', views.add_customer, name='add_customer'),
    path('customers/', views.get_customers, name='get_customers'),
    path('customers/update/<int:customer_id>/', views.update_customer, name='update_customer'),
    path('customers/delete/<int:customer_id>/', views.delete_customer, name='delete_customer'),

    # Module 2: Restaurant Management
    path('restaurants/add/', views.add_restaurant, name='add_restaurant'),
    path('restaurants/', views.get_restaurants, name='get_restaurants'),
    path('restaurants/update/<int:restaurant_id>/', views.update_restaurant, name='update_restaurant'),
    path('restaurants/delete/<int:restaurant_id>/', views.delete_restaurant, name='delete_restaurant'),

    # Module 3: Food Menu Management
    path('foods/add/', views.add_food, name='add_food'),
    path('foods/', views.get_foods, name='get_foods'),
    path('foods/update/<int:food_id>/', views.update_food, name='update_food'),
    path('foods/delete/<int:food_id>/', views.delete_food, name='delete_food'),

    # Module 4: Cart Management
    path('cart/add/', views.add_cart_item, name='add_cart_item'),
    path('cart/', views.get_cart_items, name='get_cart_items'),
    path('cart/update/<int:cart_id>/', views.update_cart_item, name='update_cart_item'),
    path('cart/delete/<int:cart_id>/', views.delete_cart_item, name='delete_cart_item'),

    # Module 5: Order Management
    path('orders/add/', views.add_order, name='add_order'),
    path('orders/', views.get_orders, name='get_orders'),
    path('orders/update/<int:order_id>/', views.update_order, name='update_order'),
    path('orders/delete/<int:order_id>/', views.delete_order, name='delete_order'),
]

# Serve Frontend static files directly from Django for local demonstration
from django.views.static import serve
from pathlib import Path
FRONTEND_DIR = Path(__file__).resolve().parent.parent / 'Frontend'

urlpatterns += [
    path('', serve, {'document_root': FRONTEND_DIR, 'path': 'index.html'}),
    path('<path:path>', serve, {'document_root': FRONTEND_DIR}),
]


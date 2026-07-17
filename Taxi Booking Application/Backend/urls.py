from django.urls import path
import views

urlpatterns = [
    # Authentication endpoints
    path('customers/login/', views.customer_login, name='customer_login'),
    path('drivers/login/', views.driver_login, name='driver_login'),
    path('admin/login/', views.admin_login, name='admin_login'),

    # Module 1: Customers CRUD
    path('customers/add/', views.add_customer, name='add_customer'),
    path('customers/', views.get_customers, name='get_customers'),
    path('customers/update/<str:id>/', views.update_customer, name='update_customer'),
    path('customers/delete/<str:id>/', views.delete_customer, name='delete_customer'),

    # Module 2: Drivers CRUD
    path('drivers/add/', views.add_driver, name='add_driver'),
    path('drivers/', views.get_drivers, name='get_drivers'),
    path('drivers/update/<str:id>/', views.update_driver, name='update_driver'),
    path('drivers/delete/<str:id>/', views.delete_driver, name='delete_driver'),

    # Module 3: Vehicles CRUD
    path('vehicles/add/', views.add_vehicle, name='add_vehicle'),
    path('vehicles/', views.get_vehicles, name='get_vehicles'),
    path('vehicles/update/<str:id>/', views.update_vehicle, name='update_vehicle'),
    path('vehicles/delete/<str:id>/', views.delete_vehicle, name='delete_vehicle'),

    # Module 4: Bookings CRUD
    path('bookings/add/', views.add_booking, name='add_booking'),
    path('bookings/', views.get_bookings, name='get_bookings'),
    path('bookings/update/<str:id>/', views.update_booking, name='update_booking'),
    path('bookings/delete/<str:id>/', views.delete_booking, name='delete_booking'),

    # Module 5: Payments CRUD
    path('payments/add/', views.add_payment, name='add_payment'),
    path('payments/', views.get_payments, name='get_payments'),
    path('payments/update/<str:id>/', views.update_payment, name='update_payment'),
    path('payments/delete/<str:id>/', views.delete_payment, name='delete_payment'),

    # Dashboard Statistics Aggregations
    path('admin/dashboard-stats/', views.admin_dashboard_stats, name='admin_dashboard_stats'),
    path('driver/dashboard-stats/<str:driver_name>/', views.driver_dashboard_stats, name='driver_dashboard_stats'),
    path('customer/dashboard-stats/<str:customer_name>/', views.customer_dashboard_stats, name='customer_dashboard_stats'),
]

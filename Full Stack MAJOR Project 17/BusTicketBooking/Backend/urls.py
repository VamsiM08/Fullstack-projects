from django.urls import path
from Backend import views

urlpatterns = [
    # Passenger Management Module (4 APIs)
    path('passengers/add/', views.add_passenger, name='add_passenger'),
    path('passengers/', views.get_passengers, name='get_passengers'),
    path('passengers/update/<int:id>/', views.update_passenger, name='update_passenger'),
    path('passengers/delete/<int:id>/', views.delete_passenger, name='delete_passenger'),

    # Bus Management Module (4 APIs)
    path('buses/add/', views.add_bus, name='add_bus'),
    path('buses/', views.get_buses, name='get_buses'),
    path('buses/update/<int:id>/', views.update_bus, name='update_bus'),
    path('buses/delete/<int:id>/', views.delete_bus, name='delete_bus'),

    # Route & Schedule Management Module (4 APIs)
    path('routes/add/', views.add_route, name='add_route'),
    path('routes/', views.get_routes, name='get_routes'),
    path('routes/update/<int:id>/', views.update_route, name='update_route'),
    path('routes/delete/<int:id>/', views.delete_route, name='delete_route'),

    # Ticket Booking Management Module (4 APIs)
    path('bookings/add/', views.add_booking, name='add_booking'),
    path('bookings/', views.get_bookings, name='get_bookings'),
    path('bookings/update/<int:id>/', views.update_booking, name='update_booking'),
    path('bookings/delete/<int:id>/', views.delete_booking, name='delete_booking'),

    # Payment Management Module (4 APIs)
    path('payments/add/', views.add_payment, name='add_payment'),
    path('payments/', views.get_payments, name='get_payments'),
    path('payments/update/<int:id>/', views.update_payment, name='update_payment'),
    path('payments/delete/<int:id>/', views.delete_payment, name='delete_payment'),
]

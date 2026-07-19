from django.urls import path
import views

urlpatterns = [
    # Root Welcome & Status API
    path('', views.home_api, name='home_api'),

    # Passenger URLs
    path('passengers/add/', views.add_passenger, name='add_passenger'),
    path('passengers/', views.get_passengers, name='get_passengers'),
    path('passengers/update/<int:id>/', views.update_passenger, name='update_passenger'),
    path('passengers/delete/<int:id>/', views.delete_passenger, name='delete_passenger'),

    # Ship URLs
    path('ships/add/', views.add_ship, name='add_ship'),
    path('ships/', views.get_ships, name='get_ships'),
    path('ships/update/<int:id>/', views.update_ship, name='update_ship'),
    path('ships/delete/<int:id>/', views.delete_ship, name='delete_ship'),

    # Schedule URLs
    path('schedules/add/', views.add_schedule, name='add_schedule'),
    path('schedules/', views.get_schedules, name='get_schedules'),
    path('schedules/update/<int:id>/', views.update_schedule, name='update_schedule'),
    path('schedules/delete/<int:id>/', views.delete_schedule, name='delete_schedule'),

    # Booking URLs
    path('bookings/add/', views.add_booking, name='add_booking'),
    path('bookings/', views.get_bookings, name='get_bookings'),
    path('bookings/update/<int:id>/', views.update_booking, name='update_booking'),
    path('bookings/delete/<int:id>/', views.delete_booking, name='delete_booking'),

    # Payment URLs
    path('payments/add/', views.add_payment, name='add_payment'),
    path('payments/', views.get_payments, name='get_payments'),
    path('payments/update/<int:id>/', views.update_payment, name='update_payment'),
    path('payments/delete/<int:id>/', views.delete_payment, name='delete_payment'),
]

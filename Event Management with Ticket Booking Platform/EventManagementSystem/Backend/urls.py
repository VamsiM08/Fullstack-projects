from django.urls import path
import views

urlpatterns = [
    # User Management
    path('users/add/', views.add_user, name='add_user'),
    path('users/', views.get_users, name='get_users'),
    path('users/update/<int:id>/', views.update_user, name='update_user'),
    path('users/delete/<int:id>/', views.delete_user, name='delete_user'),
    path('users/login/', views.login_user, name='login_user'),

    # Event Management
    path('events/add/', views.add_event, name='add_event'),
    path('events/', views.get_events, name='get_events'),
    path('events/update/<int:id>/', views.update_event, name='update_event'),
    path('events/delete/<int:id>/', views.delete_event, name='delete_event'),

    # Venue Management
    path('venues/add/', views.add_venue, name='add_venue'),
    path('venues/', views.get_venues, name='get_venues'),
    path('venues/update/<int:id>/', views.update_venue, name='update_venue'),
    path('venues/delete/<int:id>/', views.delete_venue, name='delete_venue'),

    # Ticket Booking Management
    path('bookings/add/', views.add_booking, name='add_booking'),
    path('bookings/', views.get_bookings, name='get_bookings'),
    path('bookings/update/<int:id>/', views.update_booking, name='update_booking'),
    path('bookings/delete/<int:id>/', views.delete_booking, name='delete_booking'),

    # Payment Management
    path('payments/add/', views.add_payment, name='add_payment'),
    path('payments/', views.get_payments, name='get_payments'),
    path('payments/update/<int:id>/', views.update_payment, name='update_payment'),
    path('payments/delete/<int:id>/', views.delete_payment, name='delete_payment'),

    # Reviews (Bonus)
    path('reviews/add/', views.add_review, name='add_review'),
    path('reviews/event/<int:event_id>/', views.get_event_reviews, name='get_event_reviews'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Auth & Stats
    path('login/', views.login_view, name='login'),
    path('stats/', views.dashboard_stats, name='stats'),

    # Module 1 - Passengers
    path('passengers/add/', views.passenger_add, name='passenger_add'),
    path('passengers/add', views.passenger_add),
    path('passengers/', views.passenger_list, name='passenger_list'),
    path('passengers', views.passenger_list),
    path('passengers/<int:pk>/', views.passenger_list),
    path('passengers/update/<int:pk>/', views.passenger_update, name='passenger_update'),
    path('passengers/update/<int:pk>', views.passenger_update),
    path('passengers/delete/<int:pk>/', views.passenger_delete, name='passenger_delete'),
    path('passengers/delete/<int:pk>', views.passenger_delete),

    # Module 2 - Trains
    path('trains/add/', views.train_add, name='train_add'),
    path('trains/add', views.train_add),
    path('trains/', views.train_list, name='train_list'),
    path('trains', views.train_list),
    path('trains/<int:pk>/', views.train_list),
    path('trains/update/<int:pk>/', views.train_update, name='train_update'),
    path('trains/update/<int:pk>', views.train_update),
    path('trains/delete/<int:pk>/', views.train_delete, name='train_delete'),
    path('trains/delete/<int:pk>', views.train_delete),

    # Module 3 - Route & Schedule
    path('schedules/add/', views.schedule_add, name='schedule_add'),
    path('schedules/add', views.schedule_add),
    path('schedules/', views.schedule_list, name='schedule_list'),
    path('schedules', views.schedule_list),
    path('schedules/<int:pk>/', views.schedule_list),
    path('schedules/update/<int:pk>/', views.schedule_update, name='schedule_update'),
    path('schedules/update/<int:pk>', views.schedule_update),
    path('schedules/delete/<int:pk>/', views.schedule_delete, name='schedule_delete'),
    path('schedules/delete/<int:pk>', views.schedule_delete),

    # Module 4 - Ticket Reservation
    path('bookings/add/', views.booking_add, name='booking_add'),
    path('bookings/add', views.booking_add),
    path('bookings/', views.booking_list, name='booking_list'),
    path('bookings', views.booking_list),
    path('bookings/<int:pk>/', views.booking_list),
    path('bookings/update/<int:pk>/', views.booking_update, name='booking_update'),
    path('bookings/update/<int:pk>', views.booking_update),
    path('bookings/delete/<int:pk>/', views.booking_delete, name='booking_delete'),
    path('bookings/delete/<int:pk>', views.booking_delete),

    # Module 5 - Payments
    path('payments/add/', views.payment_add, name='payment_add'),
    path('payments/add', views.payment_add),
    path('payments/', views.payment_list, name='payment_list'),
    path('payments', views.payment_list),
    path('payments/<int:pk>/', views.payment_list),
    path('payments/update/<int:pk>/', views.payment_update, name='payment_update'),
    path('payments/update/<int:pk>', views.payment_update),
    path('payments/delete/<int:pk>/', views.payment_delete, name='payment_delete'),
    path('payments/delete/<int:pk>', views.payment_delete),
]

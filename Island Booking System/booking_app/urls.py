from django.urls import path
from . import views

urlpatterns = [
    # Page Routes (Supporting both clean URLs and .html extensions)
    path('', views.index_view, name='index'),
    path('index.html', views.index_view, name='index_html'),
    path('login/', views.login_view, name='login'),
    path('login.html', views.login_view, name='login_html'),
    path('register/', views.register_view, name='register'),
    path('register.html', views.register_view, name='register_html'),
    path('islands-page/', views.islands_page_view, name='islands_page'),
    path('islands.html', views.islands_page_view, name='islands_html'),
    path('packages-page/', views.packages_page_view, name='packages_page'),
    path('packages.html', views.packages_page_view, name='packages_html'),
    path('booking-page/', views.booking_page_view, name='booking_page'),
    path('booking.html', views.booking_page_view, name='booking_html'),
    path('payment-page/', views.payment_page_view, name='payment_page'),
    path('payment.html', views.payment_page_view, name='payment_html'),
    path('customer-dashboard/', views.customer_dashboard_view, name='customer_dashboard'),
    path('customer_dashboard.html', views.customer_dashboard_view, name='customer_dashboard_html'),
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin_dashboard.html', views.admin_dashboard_view, name='admin_dashboard_html'),

    # REST APIs - Customers
    path('customers/', views.get_customers, name='get_customers'),
    path('customers/add/', views.add_customer, name='add_customer'),
    path('customers/update/<int:id>/', views.update_customer, name='update_customer'),
    path('customers/delete/<int:id>/', views.delete_customer, name='delete_customer'),

    # REST APIs - Islands
    path('islands/', views.get_islands, name='get_islands'),
    path('islands/add/', views.add_island, name='add_island'),
    path('islands/update/<int:id>/', views.update_island, name='update_island'),
    path('islands/delete/<int:id>/', views.delete_island, name='delete_island'),

    # REST APIs - Packages
    path('packages/', views.get_packages, name='get_packages'),
    path('packages/add/', views.add_package, name='add_package'),
    path('packages/update/<int:id>/', views.update_package, name='update_package'),
    path('packages/delete/<int:id>/', views.delete_package, name='delete_package'),

    # REST APIs - Bookings
    path('bookings/', views.get_bookings, name='get_bookings'),
    path('bookings/add/', views.add_booking, name='add_booking'),
    path('bookings/update/<int:id>/', views.update_booking, name='update_booking'),
    path('bookings/delete/<int:id>/', views.delete_booking, name='delete_booking'),

    # REST APIs - Payments
    path('payments/', views.get_payments, name='get_payments'),
    path('payments/add/', views.add_payment, name='add_payment'),
    path('payments/update/<int:id>/', views.update_payment, name='update_payment'),
    path('payments/delete/<int:id>/', views.delete_payment, name='delete_payment'),
]

from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    # Customer Management
    path('customers/add/', views.customer_add, name='customer_add'),
    path('customers/', views.customer_list, name='customer_list'),
    path('customers/update/<int:pk>/', views.customer_update, name='customer_update'),
    path('customers/delete/<int:pk>/', views.customer_delete, name='customer_delete'),

    # Category Management
    path('categories/add/', views.category_add, name='category_add'),
    path('categories/', views.category_list, name='category_list'),
    path('categories/update/<int:pk>/', views.category_update, name='category_update'),
    path('categories/delete/<int:pk>/', views.category_delete, name='category_delete'),

    # Product Management
    path('products/add/', views.product_add, name='product_add'),
    path('products/', views.product_list, name='product_list'),
    path('products/update/<int:pk>/', views.product_update, name='product_update'),
    path('products/delete/<int:pk>/', views.product_delete, name='product_delete'),

    # Shopping Cart Management
    path('cart/add/', views.cart_add, name='cart_add'),
    path('cart/', views.cart_list, name='cart_list'),
    path('cart/update/<int:pk>/', views.cart_update, name='cart_update'),
    path('cart/delete/<int:pk>/', views.cart_delete, name='cart_delete'),

    # Order Management
    path('orders/add/', views.order_add, name='order_add'),
    path('orders/', views.order_list, name='order_list'),
    path('orders/update/<int:pk>/', views.order_update, name='order_update'),
    path('orders/delete/<int:pk>/', views.order_delete, name='order_delete'),
]

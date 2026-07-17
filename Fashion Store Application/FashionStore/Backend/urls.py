from django.urls import path
import views

urlpatterns = [
    # Customer APIs
    path('customers/add/', views.customer_list_or_add, name='customer_add'),
    path('customers/', views.customer_list_or_add, name='customer_list'),
    path('customers/update/<int:id>/', views.customer_update_delete, name='customer_update'),
    path('customers/delete/<int:id>/', views.customer_update_delete, name='customer_delete'),
    path('customers/login/', views.customer_login, name='customer_login'),
    
    # Category APIs
    path('categories/add/', views.category_list_or_add, name='category_add'),
    path('categories/', views.category_list_or_add, name='category_list'),
    path('categories/update/<int:id>/', views.category_update_delete, name='category_update'),
    path('categories/delete/<int:id>/', views.category_update_delete, name='category_delete'),
    
    # Product APIs
    path('products/add/', views.product_list_or_add, name='product_add'),
    path('products/', views.product_list_or_add, name='product_list'),
    path('products/update/<int:id>/', views.product_update_delete, name='product_update'),
    path('products/delete/<int:id>/', views.product_update_delete, name='product_delete'),
    
    # Cart APIs
    path('cart/add/', views.cart_list_or_add, name='cart_add'),
    path('cart/', views.cart_list_or_add, name='cart_list'),
    path('cart/update/<int:id>/', views.cart_update_delete, name='cart_update'),
    path('cart/delete/<int:id>/', views.cart_update_delete, name='cart_delete'),
    
    # Order APIs
    path('orders/add/', views.order_list_or_add, name='order_add'),
    path('orders/', views.order_list_or_add, name='order_list'),
    path('orders/update/<int:id>/', views.order_update_delete, name='order_update'),
    path('orders/delete/<int:id>/', views.order_update_delete, name='order_delete'),
]

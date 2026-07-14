import os
import sys
import django
import datetime

# Setup django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(backend_dir))
sys.path.append(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from Backend.db import Customer, Category, Product, Cart, Order

def populate():
    # Customer
    c, created = Customer.objects.get_or_create(
        customer_id=101,
        defaults={
            'full_name': "Rahul Sharma",
            'email': "rahul@gmail.com",
            'phone': "9876543210",
            'address': "Hyderabad",
            'password': "rahul123"
        }
    )
    if created:
        print("Created Customer 101 (Rahul)")
        
    c_admin, created_admin = Customer.objects.get_or_create(
        customer_id=100,
        defaults={
            'full_name': "Administrator",
            'email': "admin@ecommerce.com",
            'phone': "0000000000",
            'address': "Main Office",
            'password': "admin"
        }
    )
    if created_admin:
        print("Created Admin Customer 100")

    # Category
    cat, created = Category.objects.get_or_create(
        category_id=201,
        defaults={
            'category_name': "Electronics",
            'description': "Mobiles, Laptops, Accessories"
        }
    )
    if created:
        print("Created Category 201")
        
    Category.objects.get_or_create(
        category_id=202,
        defaults={
            'category_name': "Fashion",
            'description': "Clothing, Shoes, and Watches"
        }
    )
    Category.objects.get_or_create(
        category_id=203,
        defaults={
            'category_name': "Home Decor",
            'description': "Furniture, Lighting, and Art"
        }
    )

    # Product
    p, created = Product.objects.get_or_create(
        product_id=301,
        defaults={
            'product_name': "Samsung Galaxy S25",
            'category': "Electronics",
            'brand': "Samsung",
            'price': 79999.0,
            'stock': 50,
            'image_url': "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            'description': "Latest Samsung flagship smartphone with AI capabilities."
        }
    )
    if created:
        print("Created Product 301")
        
    Product.objects.get_or_create(
        product_id=302,
        defaults={
            'product_name': "Apple iPhone 16 Pro",
            'category': "Electronics",
            'brand': "Apple",
            'price': 119999.0,
            'stock': 35,
            'image_url': "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            'description': "Pro camera system with action button and powerful A18 Pro chip."
        }
    )
    Product.objects.get_or_create(
        product_id=303,
        defaults={
            'product_name': "Sony WH-1000XM5",
            'category': "Electronics",
            'brand': "Sony",
            'price': 29999.0,
            'stock': 20,
            'image_url': "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            'description': "Industry leading noise-canceling wireless headphones."
        }
    )
    Product.objects.get_or_create(
        product_id=304,
        defaults={
            'product_name': "Men's Classic Leather Jacket",
            'category': "Fashion",
            'brand': "Zara",
            'price': 8999.0,
            'stock': 15,
            'image_url': "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            'description': "Premium quality leather jacket, perfect for casual outings."
        }
    )
    Product.objects.get_or_create(
        product_id=305,
        defaults={
            'product_name': "Ceramic Vase",
            'category': "Home Decor",
            'brand': "DecoLand",
            'price': 1499.0,
            'stock': 40,
            'image_url': "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            'description': "Handmade modern ceramic vase for elegant home style."
        }
    )

    # Cart
    Cart.objects.get_or_create(
        cart_id=401,
        defaults={
            'customer_name': "Rahul Sharma",
            'product_name': "Samsung Galaxy S25",
            'quantity': 1,
            'price': 79999.0,
            'total_price': 79999.0
        }
    )
    
    # Order
    Order.objects.get_or_create(
        order_id=501,
        defaults={
            'customer_name': "Rahul Sharma",
            'order_date': datetime.date(2026, 7, 15),
            'total_amount': 79999.0,
            'payment_method': "UPI",
            'payment_status': "Paid",
            'delivery_status': "Processing"
        }
    )
    print("Database populated successfully!")

if __name__ == '__main__':
    populate()

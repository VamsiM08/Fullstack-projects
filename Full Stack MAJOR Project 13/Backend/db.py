from django.db import models
from django.utils import timezone

class Customer(models.Model):
    customer_id = models.IntegerField(primary_key=True, blank=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    password = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        if not self.customer_id:
            last = Customer.objects.order_by('customer_id').last()
            if last:
                self.customer_id = max(last.customer_id + 1, 101)
            else:
                self.customer_id = 101
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


class Category(models.Model):
    category_id = models.IntegerField(primary_key=True, blank=True)
    category_name = models.CharField(max_length=255, unique=True)
    description = models.TextField()

    def save(self, *args, **kwargs):
        if not self.category_id:
            last = Category.objects.order_by('category_id').last()
            if last:
                self.category_id = max(last.category_id + 1, 201)
            else:
                self.category_id = 201
        super().save(*args, **kwargs)

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_id = models.IntegerField(primary_key=True, blank=True)
    product_name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    brand = models.CharField(max_length=255)
    price = models.FloatField()
    stock = models.IntegerField()
    image_url = models.CharField(max_length=255)
    description = models.TextField()

    def save(self, *args, **kwargs):
        if not self.product_id:
            last = Product.objects.order_by('product_id').last()
            if last:
                self.product_id = max(last.product_id + 1, 301)
            else:
                self.product_id = 301
        super().save(*args, **kwargs)

    def __str__(self):
        return self.product_name


class Cart(models.Model):
    cart_id = models.IntegerField(primary_key=True, blank=True)
    customer_name = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.FloatField()
    total_price = models.FloatField()

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.price
        if not self.cart_id:
            last = Cart.objects.order_by('cart_id').last()
            if last:
                self.cart_id = max(last.cart_id + 1, 401)
            else:
                self.cart_id = 401
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_name}'s Cart - {self.product_name}"


class Order(models.Model):
    order_id = models.IntegerField(primary_key=True, blank=True)
    customer_name = models.CharField(max_length=255)
    order_date = models.DateField(default=timezone.localdate)
    total_amount = models.FloatField()
    payment_method = models.CharField(max_length=50) # UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery
    payment_status = models.CharField(max_length=50, default='Pending') # Pending, Paid, Failed
    delivery_status = models.CharField(max_length=50, default='Processing') # Processing, Packed, Shipped, Out for Delivery, Delivered, Cancelled

    def save(self, *args, **kwargs):
        if not self.order_id:
            last = Order.objects.order_by('order_id').last()
            if last:
                self.order_id = max(last.order_id + 1, 501)
            else:
                self.order_id = 501
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_id} by {self.customer_name}"

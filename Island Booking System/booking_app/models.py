from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    avatar = models.CharField(max_length=500, blank=True, default='')
    membership = models.CharField(max_length=50, default='Gold')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'avatar': self.avatar or 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            'membership': self.membership,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


class Island(models.Model):
    name = models.CharField(max_length=150)
    country = models.CharField(max_length=100)
    climate = models.CharField(max_length=100)
    best_season = models.CharField(max_length=100)
    rating = models.FloatField(default=4.8)
    image_url = models.CharField(max_length=500)
    description = models.TextField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    is_featured = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name}, {self.country}"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'country': self.country,
            'climate': self.climate,
            'best_season': self.best_season,
            'rating': self.rating,
            'image_url': self.image_url,
            'description': self.description,
            'price_per_night': float(self.price_per_night),
            'is_featured': self.is_featured
        }


class Package(models.Model):
    island = models.ForeignKey(Island, on_delete=models.CASCADE, related_name='packages')
    title = models.CharField(max_length=200)
    duration_days = models.IntegerField(default=5)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.IntegerField(default=0)
    services = models.TextField(help_text="Comma separated list of included services")
    rating = models.FloatField(default=4.9)
    image_url = models.CharField(max_length=500)

    def __str__(self):
        return self.title

    def to_dict(self):
        services_list = [s.strip() for s in self.services.split(',') if s.strip()]
        discounted_price = float(self.price) * (1 - self.discount_percent / 100)
        return {
            'id': self.id,
            'island_id': self.island.id,
            'island_name': self.island.name,
            'island_country': self.island.country,
            'title': self.title,
            'duration_days': self.duration_days,
            'price': float(self.price),
            'discount_percent': self.discount_percent,
            'discounted_price': round(discounted_price, 2),
            'services': services_list,
            'rating': self.rating,
            'image_url': self.image_url
        }


class Booking(models.Model):
    STATUS_CHOICES = [
        ('Confirmed', 'Confirmed'),
        ('Pending', 'Pending'),
        ('Cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.IntegerField(default=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.customer.name} - {self.package.title}"

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer.id,
            'customer_name': self.customer.name,
            'customer_email': self.customer.email,
            'package_id': self.package.id,
            'package_title': self.package.title,
            'island_name': self.package.island.name,
            'island_country': self.package.island.country,
            'check_in': str(self.check_in),
            'check_out': str(self.check_out),
            'guests': self.guests,
            'total_price': float(self.total_price),
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


class Payment(models.Model):
    STATUS_CHOICES = [
        ('Success', 'Success'),
        ('Failed', 'Failed'),
        ('Pending', 'Pending'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50) # UPI, Visa, Mastercard, Wallet, Net Banking
    transaction_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Success')
    payment_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Txn {self.transaction_id} - ${self.amount}"

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking.id,
            'customer_name': self.booking.customer.name,
            'package_title': self.booking.package.title,
            'amount': float(self.amount),
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'payment_date': self.payment_date.strftime('%Y-%m-%d %H:%M:%S')
        }

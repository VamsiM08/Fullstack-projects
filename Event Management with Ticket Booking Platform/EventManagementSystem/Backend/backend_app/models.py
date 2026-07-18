from django.db import models

class User(models.Model):
    user_id = models.IntegerField(primary_key=True)
    full_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    phone = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, default='user')

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "city": self.city,
            "password": self.password,
            "role": self.role,
        }

class Event(models.Model):
    event_id = models.IntegerField(primary_key=True)
    event_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    organizer_name = models.CharField(max_length=255)
    event_date = models.CharField(max_length=50)
    event_time = models.CharField(max_length=50)
    venue = models.CharField(max_length=255)
    ticket_price = models.FloatField()
    available_tickets = models.IntegerField()
    description = models.TextField(blank=True, default='')
    image_url = models.CharField(max_length=500, blank=True, default='')
    rating = models.FloatField(default=4.8)

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_name": self.event_name,
            "category": self.category,
            "organizer_name": self.organizer_name,
            "event_date": self.event_date,
            "event_time": self.event_time,
            "venue": self.venue,
            "ticket_price": self.ticket_price,
            "available_tickets": self.available_tickets,
            "description": self.description,
            "image_url": self.image_url,
            "rating": self.rating,
        }

class Venue(models.Model):
    venue_id = models.IntegerField(primary_key=True)
    venue_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    capacity = models.IntegerField()
    contact_person = models.CharField(max_length=255)

    def to_dict(self):
        return {
            "venue_id": self.venue_id,
            "venue_name": self.venue_name,
            "location": self.location,
            "city": self.city,
            "capacity": self.capacity,
            "contact_person": self.contact_person,
        }

class Booking(models.Model):
    booking_id = models.IntegerField(primary_key=True)
    user_name = models.CharField(max_length=255)
    event_name = models.CharField(max_length=255)
    booking_date = models.CharField(max_length=50)
    number_of_tickets = models.IntegerField()
    total_amount = models.FloatField()
    booking_status = models.CharField(max_length=50, default='Confirmed')
    seats = models.CharField(max_length=255, blank=True, default='')

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "user_name": self.user_name,
            "event_name": self.event_name,
            "booking_date": self.booking_date,
            "number_of_tickets": self.number_of_tickets,
            "total_amount": self.total_amount,
            "booking_status": self.booking_status,
            "seats": self.seats,
        }

class Payment(models.Model):
    payment_id = models.IntegerField(primary_key=True)
    booking_id = models.IntegerField()
    user_name = models.CharField(max_length=255)
    amount = models.FloatField()
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=50, default='Success')
    transaction_id = models.CharField(max_length=100)
    payment_date = models.CharField(max_length=50)

    def to_dict(self):
        return {
            "payment_id": self.payment_id,
            "booking_id": self.booking_id,
            "user_name": self.user_name,
            "amount": self.amount,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "transaction_id": self.transaction_id,
            "payment_date": self.payment_date,
        }

class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    event_id = models.IntegerField()
    user_name = models.CharField(max_length=255)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.CharField(max_length=50)

    def to_dict(self):
        return {
            "review_id": self.review_id,
            "event_id": self.event_id,
            "user_name": self.user_name,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at,
        }

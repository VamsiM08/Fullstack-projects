from django.db import models

class Passenger(models.Model):
    passenger_id = models.IntegerField(primary_key=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150, unique=True)
    phone = models.CharField(max_length=20)
    gender = models.CharField(max_length=20)
    age = models.IntegerField()
    address = models.TextField()
    password = models.CharField(max_length=128)

    def to_dict(self):
        return {
            "passenger_id": self.passenger_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "gender": self.gender,
            "age": self.age,
            "address": self.address,
            "password": self.password,
        }

    def __str__(self):
        return f"{self.passenger_id} - {self.full_name}"


class Train(models.Model):
    train_id = models.IntegerField(primary_key=True)
    train_name = models.CharField(max_length=150)
    train_number = models.CharField(max_length=50, unique=True)
    train_type = models.CharField(max_length=50)  # Express, Superfast, Passenger, Rajdhani, Shatabdi, Vande Bharat
    total_seats = models.IntegerField()
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)

    def to_dict(self):
        return {
            "train_id": self.train_id,
            "train_name": self.train_name,
            "train_number": self.train_number,
            "train_type": self.train_type,
            "total_seats": self.total_seats,
            "source": self.source,
            "destination": self.destination,
        }

    def __str__(self):
        return f"{self.train_number} - {self.train_name}"


class Schedule(models.Model):
    schedule_id = models.IntegerField(primary_key=True)
    train_name = models.CharField(max_length=150)
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_date = models.CharField(max_length=20)  # YYYY-MM-DD
    departure_time = models.CharField(max_length=20)  # HH:MM
    arrival_date = models.CharField(max_length=20)    # YYYY-MM-DD
    arrival_time = models.CharField(max_length=20)      # HH:MM
    fare = models.FloatField()

    def to_dict(self):
        return {
            "schedule_id": self.schedule_id,
            "train_name": self.train_name,
            "source": self.source,
            "destination": self.destination,
            "departure_date": str(self.departure_date),
            "departure_time": str(self.departure_time),
            "arrival_date": str(self.arrival_date),
            "arrival_time": str(self.arrival_time),
            "fare": self.fare,
        }

    def __str__(self):
        return f"Schedule {self.schedule_id}: {self.train_name} ({self.source} -> {self.destination})"


class Booking(models.Model):
    booking_id = models.IntegerField(primary_key=True)
    passenger_name = models.CharField(max_length=150)
    train_name = models.CharField(max_length=150)
    journey_date = models.CharField(max_length=20) # YYYY-MM-DD
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    coach_type = models.CharField(max_length=50) # Sleeper, AC 3 Tier, AC 2 Tier, AC First Class, Chair Car
    seat_number = models.CharField(max_length=50)
    total_fare = models.FloatField()
    booking_status = models.CharField(max_length=50) # Confirmed, RAC, Waiting List, Cancelled

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "passenger_name": self.passenger_name,
            "train_name": self.train_name,
            "journey_date": str(self.journey_date),
            "source": self.source,
            "destination": self.destination,
            "coach_type": self.coach_type,
            "seat_number": self.seat_number,
            "total_fare": self.total_fare,
            "booking_status": self.booking_status,
        }

    def __str__(self):
        return f"Booking {self.booking_id} - {self.passenger_name}"


class Payment(models.Model):
    payment_id = models.IntegerField(primary_key=True)
    booking_id = models.IntegerField()
    passenger_name = models.CharField(max_length=150)
    amount = models.FloatField()
    payment_method = models.CharField(max_length=50) # UPI, Credit Card, Debit Card, Net Banking, Wallet
    payment_status = models.CharField(max_length=50) # Success, Pending, Failed
    transaction_id = models.CharField(max_length=100)
    payment_date = models.CharField(max_length=20) # YYYY-MM-DD

    def to_dict(self):
        return {
            "payment_id": self.payment_id,
            "booking_id": self.booking_id,
            "passenger_name": self.passenger_name,
            "amount": self.amount,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "transaction_id": self.transaction_id,
            "payment_date": str(self.payment_date),
        }

    def __str__(self):
        return f"Payment {self.payment_id} for Booking {self.booking_id}"

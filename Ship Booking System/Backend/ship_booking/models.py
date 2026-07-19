from django.db import models

class Passenger(models.Model):
    passenger_id = models.IntegerField(primary_key=True)
    full_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    phone = models.CharField(max_length=50)
    nationality = models.CharField(max_length=100)
    passport_number = models.CharField(max_length=100)
    password = models.CharField(max_length=255)

    def to_dict(self):
        return {
            "passenger_id": int(self.passenger_id),
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "nationality": self.nationality,
            "passport_number": self.passport_number,
            "password": self.password,
        }

class Ship(models.Model):
    ship_id = models.IntegerField(primary_key=True)
    ship_name = models.CharField(max_length=255)
    ship_type = models.CharField(max_length=100)
    capacity = models.IntegerField()
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)

    def to_dict(self):
        return {
            "ship_id": int(self.ship_id),
            "ship_name": self.ship_name,
            "ship_type": self.ship_type,
            "capacity": int(self.capacity),
            "operator_name": self.operator_name,
            "status": self.status,
        }

class Schedule(models.Model):
    schedule_id = models.IntegerField(primary_key=True)
    ship_name = models.CharField(max_length=255)
    source_port = models.CharField(max_length=255)
    destination_port = models.CharField(max_length=255)
    departure_date = models.CharField(max_length=50)
    departure_time = models.CharField(max_length=50)
    arrival_date = models.CharField(max_length=50)
    arrival_time = models.CharField(max_length=50)
    fare = models.FloatField()

    def to_dict(self):
        return {
            "schedule_id": int(self.schedule_id),
            "ship_name": self.ship_name,
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "departure_date": str(self.departure_date),
            "departure_time": str(self.departure_time),
            "arrival_date": str(self.arrival_date),
            "arrival_time": str(self.arrival_time),
            "fare": float(self.fare),
        }

class Booking(models.Model):
    booking_id = models.IntegerField(primary_key=True)
    passenger_name = models.CharField(max_length=255)
    ship_name = models.CharField(max_length=255)
    cabin_type = models.CharField(max_length=100)
    journey_date = models.CharField(max_length=50)
    source_port = models.CharField(max_length=255)
    destination_port = models.CharField(max_length=255)
    total_amount = models.FloatField()
    booking_status = models.CharField(max_length=50)

    def to_dict(self):
        return {
            "booking_id": int(self.booking_id),
            "passenger_name": self.passenger_name,
            "ship_name": self.ship_name,
            "cabin_type": self.cabin_type,
            "journey_date": str(self.journey_date),
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "total_amount": float(self.total_amount),
            "booking_status": self.booking_status,
        }

class Payment(models.Model):
    payment_id = models.IntegerField(primary_key=True)
    booking_id = models.IntegerField()
    passenger_name = models.CharField(max_length=255)
    amount = models.FloatField()
    payment_method = models.CharField(max_length=100)
    payment_status = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=255)
    payment_date = models.CharField(max_length=50)

    def to_dict(self):
        return {
            "payment_id": int(self.payment_id),
            "booking_id": int(self.booking_id),
            "passenger_name": self.passenger_name,
            "amount": float(self.amount),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "transaction_id": self.transaction_id,
            "payment_date": str(self.payment_date),
        }

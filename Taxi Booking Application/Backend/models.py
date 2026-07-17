from datetime import datetime

class Customer:
    def __init__(self, customer_id, full_name, email, phone, address, password, 
                 profile_pic="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150", 
                 gender="Not Specified", dob="", emergency_contact="", member_since=None):
        self.customer_id = customer_id
        self.full_name = full_name
        self.email = email
        self.phone = phone
        self.address = address
        self.password = password
        self.profile_pic = profile_pic
        self.gender = gender
        self.dob = dob
        self.emergency_contact = emergency_contact
        self.member_since = member_since or datetime.utcnow().strftime("%Y-%m-%d")

    def to_dict(self):
        return {
            "customer_id": self.customer_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "password": self.password,
            "profile_pic": self.profile_pic,
            "gender": self.gender,
            "dob": self.dob,
            "emergency_contact": self.emergency_contact,
            "member_since": self.member_since
        }


class Driver:
    def __init__(self, driver_id, driver_name, email, phone, license_number, experience, 
                 availability="Available", password=None, 
                 profile_pic="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", 
                 vehicle_number="", rating=5.0, total_rides=0, license_expiry=""):
        self.driver_id = driver_id
        self.driver_name = driver_name
        self.email = email
        self.phone = phone
        self.license_number = license_number
        self.experience = experience
        self.availability = availability
        self.password = password or "driver123"
        self.profile_pic = profile_pic
        self.vehicle_number = vehicle_number
        self.rating = rating
        self.total_rides = total_rides
        self.license_expiry = license_expiry

    def to_dict(self):
        return {
            "driver_id": self.driver_id,
            "driver_name": self.driver_name,
            "email": self.email,
            "phone": self.phone,
            "license_number": self.license_number,
            "experience": self.experience,
            "availability": self.availability,
            "password": self.password,
            "profile_pic": self.profile_pic,
            "vehicle_number": self.vehicle_number,
            "rating": self.rating,
            "total_rides": self.total_rides,
            "license_expiry": self.license_expiry
        }


class Vehicle:
    def __init__(self, vehicle_id, driver_name, vehicle_type, vehicle_number, seating_capacity, model, 
                 year=2022, color="White", transmission="Automatic", fuel_type="Petrol",
                 vehicle_image="https://images.unsplash.com/photo-1549880181-56a44cf4a9a1?auto=format&fit=crop&q=80&w=300"):
        self.vehicle_id = vehicle_id
        self.driver_name = driver_name
        self.vehicle_type = vehicle_type
        self.vehicle_number = vehicle_number
        self.seating_capacity = seating_capacity
        self.model = model
        self.year = year
        self.color = color
        self.transmission = transmission
        self.fuel_type = fuel_type
        self.vehicle_image = vehicle_image

    def to_dict(self):
        return {
            "vehicle_id": self.vehicle_id,
            "driver_name": self.driver_name,
            "vehicle_type": self.vehicle_type,
            "vehicle_number": self.vehicle_number,
            "seating_capacity": self.seating_capacity,
            "model": self.model,
            "year": self.year,
            "color": self.color,
            "transmission": self.transmission,
            "fuel_type": self.fuel_type,
            "vehicle_image": self.vehicle_image
        }


class Booking:
    def __init__(self, booking_id, customer_name, driver_name, pickup_location, drop_location, 
                 booking_date=None, fare=0.0, ride_status="Requested", distance=0.0, eta=0, 
                 payment_method="Cash", promo_code="", rating=5.0):
        self.booking_id = booking_id
        self.customer_name = customer_name
        self.driver_name = driver_name
        self.pickup_location = pickup_location
        self.drop_location = drop_location
        self.booking_date = booking_date or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        self.fare = fare
        self.ride_status = ride_status
        self.distance = distance
        self.eta = eta
        self.payment_method = payment_method
        self.promo_code = promo_code
        self.rating = rating

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "customer_name": self.customer_name,
            "driver_name": self.driver_name,
            "pickup_location": self.pickup_location,
            "drop_location": self.drop_location,
            "booking_date": self.booking_date,
            "fare": self.fare,
            "ride_status": self.ride_status,
            "distance": self.distance,
            "eta": self.eta,
            "payment_method": self.payment_method,
            "promo_code": self.promo_code,
            "rating": self.rating
        }


class Payment:
    def __init__(self, payment_id, booking_id, customer_name, amount, payment_method, 
                 payment_status="Pending", transaction_id=None, payment_date=None, 
                 subtotal=0.0, discount=0.0, tax=0.0, billing_address=""):
        self.payment_id = payment_id
        self.booking_id = booking_id
        self.customer_name = customer_name
        self.amount = amount
        self.payment_method = payment_method
        self.payment_status = payment_status
        self.transaction_id = transaction_id or ""
        self.payment_date = payment_date or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        self.subtotal = subtotal
        self.discount = discount
        self.tax = tax
        self.billing_address = billing_address

    def to_dict(self):
        return {
            "payment_id": self.payment_id,
            "booking_id": self.booking_id,
            "customer_name": self.customer_name,
            "amount": self.amount,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "transaction_id": self.transaction_id,
            "payment_date": self.payment_date,
            "subtotal": self.subtotal,
            "discount": self.discount,
            "tax": self.tax,
            "billing_address": self.billing_address
        }

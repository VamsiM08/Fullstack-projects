from django.db import models

class Freelancer(models.Model):
    freelancer_id = models.IntegerField(primary_key=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    skills = models.TextField()
    experience = models.IntegerField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.full_name

class Client(models.Model):
    client_id = models.IntegerField(primary_key=True)
    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.company_name

class Project(models.Model):
    project_id = models.IntegerField(primary_key=True)
    project_title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    deadline = models.DateField()
    client_name = models.CharField(max_length=255)

    def __str__(self):
        return self.project_title

class Bid(models.Model):
    bid_id = models.IntegerField(primary_key=True)
    project_title = models.CharField(max_length=255)
    freelancer_name = models.CharField(max_length=255)
    bid_amount = models.DecimalField(max_digits=12, decimal_places=2)
    proposal = models.TextField()
    status = models.CharField(max_length=50, default='Pending')  # Pending, Accepted, Rejected

    def __str__(self):
        return f"Bid {self.bid_id} on {self.project_title}"

class Contract(models.Model):
    contract_id = models.IntegerField(primary_key=True)
    project_title = models.CharField(max_length=255)
    freelancer_name = models.CharField(max_length=255)
    client_name = models.CharField(max_length=255)
    agreed_budget = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    contract_status = models.CharField(max_length=50, default='Active')  # Active, Completed, Cancelled

    def __str__(self):
        return f"Contract {self.contract_id} for {self.project_title}"

from django.db import models

class Student(models.Model):
    student_id = models.IntegerField(primary_key=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    qualification = models.CharField(max_length=255)
    password = models.CharField(max_length=255)

    def __str__(self):
        return self.full_name

class Instructor(models.Model):
    instructor_id = models.IntegerField(primary_key=True)
    instructor_name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255)
    experience = models.IntegerField()
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.instructor_name

class Course(models.Model):
    course_id = models.IntegerField(primary_key=True)
    course_name = models.CharField(max_length=255)
    instructor_name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    duration = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    level = models.CharField(max_length=50)  # Beginner, Intermediate, Advanced

    def __str__(self):
        return self.course_name

class Enrollment(models.Model):
    enrollment_id = models.IntegerField(primary_key=True)
    student_name = models.CharField(max_length=255)
    course_name = models.CharField(max_length=255)
    enrollment_date = models.DateField()
    payment_status = models.CharField(max_length=50)  # Paid, Pending
    course_status = models.CharField(max_length=50)  # Active, Completed, Cancelled

    def __str__(self):
        return f"{self.student_name} - {self.course_name}"

class Assignment(models.Model):
    assignment_id = models.IntegerField(primary_key=True)
    course_name = models.CharField(max_length=255)
    student_name = models.CharField(max_length=255)
    assignment_title = models.CharField(max_length=255)
    submission_date = models.DateField()
    marks = models.IntegerField()
    status = models.CharField(max_length=50)  # Pending, Submitted, Evaluated

    def __str__(self):
        return self.assignment_title

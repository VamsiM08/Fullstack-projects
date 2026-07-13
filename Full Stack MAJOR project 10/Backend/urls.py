from django.urls import path
from Backend import views

urlpatterns = [
    # Module 1 – Patient Management
    path('patients/add/', views.add_patient_view, name='add_patient'),
    path('patients/', views.get_patients_view, name='get_patients'),
    path('patients/update/<int:id>/', views.update_patient_view, name='update_patient'),
    path('patients/delete/<int:id>/', views.delete_patient_view, name='delete_patient'),

    # Module 2 – Doctor Management
    path('doctors/add/', views.add_doctor_view, name='add_doctor'),
    path('doctors/', views.get_doctors_view, name='get_doctors'),
    path('doctors/update/<int:id>/', views.update_doctor_view, name='update_doctor'),
    path('doctors/delete/<int:id>/', views.delete_doctor_view, name='delete_doctor'),

    # Module 3 – Appointment Management
    path('appointments/add/', views.add_appointment_view, name='add_appointment'),
    path('appointments/', views.get_appointments_view, name='get_appointments'),
    path('appointments/update/<int:id>/', views.update_appointment_view, name='update_appointment'),
    path('appointments/delete/<int:id>/', views.delete_appointment_view, name='delete_appointment'),

    # Module 4 – Medical Record Management
    path('records/add/', views.add_record_view, name='add_record'),
    path('records/', views.get_records_view, name='get_records'),
    path('records/update/<int:id>/', views.update_record_view, name='update_record'),
    path('records/delete/<int:id>/', views.delete_record_view, name='delete_record'),

    # Module 5 – Billing Management
    path('bills/add/', views.add_bill_view, name='add_bill'),
    path('bills/', views.get_bills_view, name='get_bills'),
    path('bills/update/<int:id>/', views.update_bill_view, name='update_bill'),
    path('bills/delete/<int:id>/', views.delete_bill_view, name='delete_bill'),
]

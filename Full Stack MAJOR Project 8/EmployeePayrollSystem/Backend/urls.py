from django.urls import path
import views

urlpatterns = [
    # Custom Authentication helper
    path('login/', views.api_login, name='api_login'),
    
    # Employee Management (Module 1)
    path('employees/add/', views.add_employee, name='add_employee'),
    path('employees/', views.get_employees, name='get_employees'),
    path('employees/update/<int:id>/', views.update_employee, name='update_employee'),
    path('employees/delete/<int:id>/', views.delete_employee, name='delete_employee'),
    
    # Department Management (Module 2)
    path('departments/add/', views.add_department, name='add_department'),
    path('departments/', views.get_departments, name='get_departments'),
    path('departments/update/<int:id>/', views.update_department, name='update_department'),
    path('departments/delete/<int:id>/', views.delete_department, name='delete_department'),
    
    # Attendance Management (Module 3)
    path('attendance/add/', views.add_attendance, name='add_attendance'),
    path('attendance/', views.get_attendance, name='get_attendance'),
    path('attendance/update/<int:id>/', views.update_attendance, name='update_attendance'),
    path('attendance/delete/<int:id>/', views.delete_attendance, name='delete_attendance'),
    
    # Payroll Management (Module 4)
    path('payroll/add/', views.add_payroll, name='add_payroll'),
    path('payroll/', views.get_payroll, name='get_payroll'),
    path('payroll/update/<int:id>/', views.update_payroll, name='update_payroll'),
    path('payroll/delete/<int:id>/', views.delete_payroll, name='delete_payroll'),
    
    # Salary Slip Management (Module 5)
    path('payslips/add/', views.add_payslip, name='add_payslip'),
    path('payslips/', views.get_payslips, name='get_payslips'),
    path('payslips/update/<int:id>/', views.update_payslip, name='update_payslip'),
    path('payslips/delete/<int:id>/', views.delete_payslip, name='delete_payslip'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Authentication Helper
    path('login/', views.login_view, name='login_view'),

    # Students (Module 1)
    path('students/add/', views.student_add, name='student_add'),
    path('students/', views.student_list, name='student_list'),
    path('students/update/<int:pk>/', views.student_update, name='student_update'),
    path('students/delete/<int:pk>/', views.student_delete, name='student_delete'),

    # Instructors (Module 2)
    path('instructors/add/', views.instructor_add, name='instructor_add'),
    path('instructors/', views.instructor_list, name='instructor_list'),
    path('instructors/update/<int:pk>/', views.instructor_update, name='instructor_update'),
    path('instructors/delete/<int:pk>/', views.instructor_delete, name='instructor_delete'),

    # Courses (Module 3)
    path('courses/add/', views.course_add, name='course_add'),
    path('courses/', views.course_list, name='course_list'),
    path('courses/update/<int:pk>/', views.course_update, name='course_update'),
    path('courses/delete/<int:pk>/', views.course_delete, name='course_delete'),

    # Enrollments (Module 4)
    path('enrollments/add/', views.enrollment_add, name='enrollment_add'),
    path('enrollments/', views.enrollment_list, name='enrollment_list'),
    path('enrollments/update/<int:pk>/', views.enrollment_update, name='enrollment_update'),
    path('enrollments/delete/<int:pk>/', views.enrollment_delete, name='enrollment_delete'),

    # Assignments (Module 5)
    path('assignments/add/', views.assignment_add, name='assignment_add'),
    path('assignments/', views.assignment_list, name='assignment_list'),
    path('assignments/update/<int:pk>/', views.assignment_update, name='assignment_update'),
    path('assignments/delete/<int:pk>/', views.assignment_delete, name='assignment_delete'),
]

from django.urls import path
import views

urlpatterns = [
    # Candidates
    path('candidates/add/', views.add_candidate_view, name='add_candidate'),
    path('candidates/', views.candidates_list_view, name='candidates_list'),
    path('candidates/update/<int:candidate_id>/', views.update_candidate_view, name='update_candidate'),
    path('candidates/delete/<int:candidate_id>/', views.delete_candidate_view, name='delete_candidate'),

    # Employers
    path('employers/add/', views.add_employer_view, name='add_employer'),
    path('employers/', views.employers_list_view, name='employers_list'),
    path('employers/update/<int:employer_id>/', views.update_employer_view, name='update_employer'),
    path('employers/delete/<int:employer_id>/', views.delete_employer_view, name='delete_employer'),

    # Jobs
    path('jobs/add/', views.add_job_view, name='add_job'),
    path('jobs/', views.jobs_list_view, name='jobs_list'),
    path('jobs/update/<int:job_id>/', views.update_job_view, name='update_job'),
    path('jobs/delete/<int:job_id>/', views.delete_job_view, name='delete_job'),

    # Applications
    path('applications/add/', views.add_application_view, name='add_application'),
    path('applications/', views.applications_list_view, name='applications_list'),
    path('applications/update/<int:application_id>/', views.update_application_view, name='update_application'),
    path('applications/delete/<int:application_id>/', views.delete_application_view, name='delete_application'),

    # Interviews
    path('interviews/add/', views.add_interview_view, name='add_interview'),
    path('interviews/', views.interviews_list_view, name='interviews_list'),
    path('interviews/update/<int:interview_id>/', views.update_interview_view, name='update_interview'),
    path('interviews/delete/<int:interview_id>/', views.delete_interview_view, name='delete_interview'),
]

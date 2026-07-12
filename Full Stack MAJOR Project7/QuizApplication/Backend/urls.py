from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
import views

urlpatterns = [
    # Student Endpoints
    path('students/add/', views.add_student_view, name='add_student'),
    path('students/', views.students_list_view, name='get_students'),
    path('students/update/<int:id>/', views.update_student_view, name='update_student'),
    path('students/delete/<int:id>/', views.delete_student_view, name='delete_student'),

    # Quiz Endpoints
    path('quizzes/add/', views.add_quiz_view, name='add_quiz'),
    path('quizzes/', views.quizzes_list_view, name='get_quizzes'),
    path('quizzes/update/<int:id>/', views.update_quiz_view, name='update_quiz'),
    path('quizzes/delete/<int:id>/', views.delete_quiz_view, name='delete_quiz'),

    # Question Endpoints
    path('questions/add/', views.add_question_view, name='add_question'),
    path('questions/', views.questions_list_view, name='get_questions'),
    path('questions/update/<int:id>/', views.update_question_view, name='update_question'),
    path('questions/delete/<int:id>/', views.delete_question_view, name='delete_question'),

    # Quiz Attempt Endpoints
    path('attempts/add/', views.add_attempt_view, name='add_attempt'),
    path('attempts/', views.attempts_list_view, name='get_attempts'),
    path('attempts/update/<int:id>/', views.update_attempt_view, name='update_attempt'),
    path('attempts/delete/<int:id>/', views.delete_attempt_view, name='delete_attempt'),

    # Result Endpoints
    path('results/add/', views.add_result_view, name='add_result'),
    path('results/', views.results_list_view, name='get_results'),
    path('results/update/<int:id>/', views.update_result_view, name='update_result'),
    path('results/delete/<int:id>/', views.delete_result_view, name='delete_result'),
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])


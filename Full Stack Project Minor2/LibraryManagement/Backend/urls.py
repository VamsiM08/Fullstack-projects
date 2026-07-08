from django.urls import path
import views

urlpatterns = [
    # Read operation: GET /books/
    path('books/', views.books_list, name='books_list'),
    
    # Create operation: POST /books/add/
    path('books/add/', views.add_book, name='add_book'),
    
    # Update operation: PUT /books/update/<book_id>/
    path('books/update/<int:book_id>/', views.update_book, name='update_book'),
    
    # Delete operation: DELETE /books/delete/<book_id>/
    path('books/delete/<int:book_id>/', views.delete_book, name='delete_book'),
]

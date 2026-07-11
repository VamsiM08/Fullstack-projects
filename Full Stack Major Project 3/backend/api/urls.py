from django.urls import path
from api import views

urlpatterns = [
    # Auth APIs
    path('register', views.register_user, name='register'),
    path('login', views.login_user, name='login'),
    path('logout', views.logout_user, name='logout'),
    path('profile', views.profile_user, name='profile'),
    
    # Movie APIs
    path('movies', views.movies_list, name='movies_list'),
    path('movies/search', views.movies_search, name='movies_search'),
    path('movies/genre/<str:genre>', views.movies_by_genre, name='movies_by_genre'),
    path('movies/language/<str:language>', views.movies_by_language, name='movies_by_language'),
    path('movies/<str:movie_id>', views.movie_detail, name='movie_detail'),
    
    # Theatre APIs
    path('theatres', views.theatres_list, name='theatres_list'),
    path('theatres/<str:theatre_id>', views.theatre_detail, name='theatre_detail'),
    
    # Screen APIs
    path('screens', views.screens_list, name='screens_list'),
    path('screens/<str:screen_id>', views.screen_detail, name='screen_detail'),
    
    # Show APIs
    path('shows', views.shows_list, name='shows_list'),
    path('shows/movie/<str:movie_id>', views.shows_by_movie, name='shows_by_movie'),
    path('shows/theatre/<str:theatre_id>', views.shows_by_theatre, name='shows_by_theatre'),
    path('shows/<str:show_id>', views.show_detail, name='show_detail'),
    
    # Seat APIs
    path('seats/<str:show_id>', views.get_seats, name='get_seats'),
    path('seats/book', views.book_seats, name='book_seats'),
    
    # Booking APIs
    path('bookings', views.bookings_list, name='bookings_list'),
    path('bookings/<str:booking_id>', views.booking_detail, name='booking_detail'),
    path('bookings/<str:booking_id>/pdf', views.booking_ticket_pdf, name='booking_ticket_pdf'),
    
    # Dashboard APIs
    path('dashboard', views.dashboard_summary, name='dashboard_summary'),
    path('dashboard/revenue', views.dashboard_revenue, name='dashboard_revenue'),
    path('dashboard/bookings', views.dashboard_bookings, name='dashboard_bookings'),
    path('dashboard/top-movies', views.dashboard_top_movies, name='dashboard_top_movies'),

    # User Management APIs
    path('users', views.users_list, name='users_list'),
    path('users/<str:user_id>/status', views.user_status, name='user_status'),
    path('users/<str:user_id>', views.user_delete, name='user_delete'),
]

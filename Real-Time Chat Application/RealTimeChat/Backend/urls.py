from django.urls import path
import views

urlpatterns = [
    # User Management APIs
    path('users/register/', views.register_user),
    path('users/login/', views.login_user),
    path('users/', views.get_users),
    path('users/update/<int:user_id>/', views.update_user),
    path('users/delete/<int:user_id>/', views.delete_user),
    
    # Chat Management APIs
    path('chats/send/', views.send_message),
    path('chats/', views.get_chats),
    path('chats/update/<int:chat_id>/', views.update_message),
    path('chats/delete/<int:chat_id>/', views.delete_message),
    
    # Conversation Management APIs
    path('conversation/', views.get_conversations),
    path('conversation/<str:username>/', views.get_conversation_history),
]

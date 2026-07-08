"""
URL configuration for Backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # Frontend assets
    path('', views.serve_index, name='index'),
    path('style.css', views.serve_css, name='style_css'),
    path('script.js', views.serve_js, name='script_js'),
    # API endpoints
    path('participants/', views.get_participants, name='get_participants'),
    path('participants/add/', views.add_participant, name='add_participant'),
    path('participants/update/<int:participant_id>/', views.update_participant, name='update_participant'),
    path('participants/delete/<int:participant_id>/', views.delete_participant, name='delete_participant'),
]

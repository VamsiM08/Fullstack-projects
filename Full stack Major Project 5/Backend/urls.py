from django.urls import path
from Backend import views

urlpatterns = [
    # Freelancers
    path('freelancers/add/', views.add_freelancer),
    path('freelancers/', views.get_freelancers),
    path('freelancers/update/<int:id>/', views.update_freelancer),
    path('freelancers/delete/<int:id>/', views.delete_freelancer),

    # Clients
    path('clients/add/', views.add_client),
    path('clients/', views.get_clients),
    path('clients/update/<int:id>/', views.update_client),
    path('clients/delete/<int:id>/', views.delete_client),

    # Projects
    path('projects/add/', views.add_project),
    path('projects/', views.get_projects),
    path('projects/update/<int:id>/', views.update_project),
    path('projects/delete/<int:id>/', views.delete_project),

    # Bids
    path('bids/add/', views.add_bid),
    path('bids/', views.get_bids),
    path('bids/update/<int:id>/', views.update_bid),
    path('bids/delete/<int:id>/', views.delete_bid),

    # Contracts
    path('contracts/add/', views.add_contract),
    path('contracts/', views.get_contracts),
    path('contracts/update/<int:id>/', views.update_contract),
    path('contracts/delete/<int:id>/', views.delete_contract),
]

# Serve Frontend static files directly from Django for local demonstration
from django.views.static import serve
from pathlib import Path
FRONTEND_DIR = Path(__file__).resolve().parent.parent / 'Frontend'

urlpatterns += [
    path('', serve, {'document_root': FRONTEND_DIR, 'path': 'index.html'}),
    path('<path:path>', serve, {'document_root': FRONTEND_DIR}),
]


import os
import sys
from pathlib import Path

# Setup django environment
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir.parent))
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

import django
django.setup()

from Backend.db import Freelancer, Client, Project, Bid, Contract

def seed():
    # Freelancer
    f, created = Freelancer.objects.get_or_create(
        freelancer_id=101,
        defaults={
            'full_name': 'Rahul Sharma',
            'email': 'rahul@gmail.com',
            'phone': '9876543210',
            'skills': 'MERN Stack, Django',
            'experience': 3,
            'hourly_rate': 20
        }
    )
    if created:
        print("Seeded Freelancer 101")
    else:
        print("Freelancer 101 already exists")

    # Client
    c, created = Client.objects.get_or_create(
        client_id=201,
        defaults={
            'company_name': 'Tech Solutions Pvt Ltd',
            'contact_person': 'Anjali Verma',
            'email': 'client@techsolutions.com',
            'phone': '9988776655',
            'location': 'Bangalore'
        }
    )
    if created:
        print("Seeded Client 201")
    else:
        print("Client 201 already exists")

    # Project
    p, created = Project.objects.get_or_create(
        project_id=301,
        defaults={
            'project_title': 'E-Commerce Website',
            'description': 'Develop a responsive e-commerce platform.',
            'category': 'Web Development',
            'budget': 50000,
            'deadline': '2026-08-30',
            'client_name': 'Tech Solutions Pvt Ltd'
        }
    )
    if created:
        print("Seeded Project 301")
    else:
        print("Project 301 already exists")

    # Bid
    b, created = Bid.objects.get_or_create(
        bid_id=401,
        defaults={
            'project_title': 'E-Commerce Website',
            'freelancer_name': 'Rahul Sharma',
            'bid_amount': 45000,
            'proposal': 'I can complete the project in 25 days.',
            'status': 'Pending'
        }
    )
    if created:
        print("Seeded Bid 401")
    else:
        print("Bid 401 already exists")

    # Contract
    cnt, created = Contract.objects.get_or_create(
        contract_id=501,
        defaults={
            'project_title': 'E-Commerce Website',
            'freelancer_name': 'Rahul Sharma',
            'client_name': 'Tech Solutions Pvt Ltd',
            'agreed_budget': 45000,
            'start_date': '2026-08-05',
            'end_date': '2026-08-30',
            'contract_status': 'Active'
        }
    )
    if created:
        print("Seeded Contract 501")
    else:
        print("Contract 501 already exists")

if __name__ == '__main__':
    seed()

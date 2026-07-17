import os
import sys

# Ensure db.py can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import tasks_collection

test_tasks = [
    {
        "title": "Complete Django Assignment",
        "description": "Finish CRUD APIs using Django REST Framework",
        "priority": "High",
        "status": "Pending"
    },
    {
        "title": "Prepare Interview",
        "description": "Practice JavaScript interview questions",
        "priority": "Medium",
        "status": "Pending"
    },
    {
        "title": "Buy Groceries",
        "description": "Purchase vegetables, fruits, and milk",
        "priority": "Low",
        "status": "Completed"
    },
    {
        "title": "Workout",
        "description": "Go to the gym for one hour",
        "priority": "High",
        "status": "Pending"
    },
    {
        "title": "Read Python Notes",
        "description": "Study Django Models and Serializers",
        "priority": "Medium",
        "status": "Completed"
    }
]

def seed():
    if tasks_collection is None:
        print("Error: tasks_collection is None. Check MongoDB database connection configuration.")
        sys.exit(1)
        
    print("Clearing existing tasks in collection...")
    tasks_collection.delete_many({})
    
    print(f"Seeding {len(test_tasks)} sample tasks...")
    result = tasks_collection.insert_many(test_tasks)
    print(f"Successfully seeded database with IDs: {result.inserted_ids}")

if __name__ == '__main__':
    seed()

import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Use MONGO_URI environment variable if available, otherwise fallback to local MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

# Global references for DB and Collection
client = None
db = None
participants_collection = None

try:
    # Set a 2-second selection timeout to fail fast if MongoDB is unavailable
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Check connection
    client.admin.command('ping')
    
    db = client["event_registration_db"]
    participants_collection = db["participants"]
    print("\n" + "=" * 60)
    print(">>> DATABASE STATUS: Successfully connected to MongoDB.")
    print(">>> URI:", MONGO_URI)
    print("=" * 60 + "\n")
except Exception as e:
    print("\n" + "!" * 60)
    print(">>> DATABASE STATUS: Could not connect to MongoDB.")
    print(">>> Error:", str(e))
    print(">>> Falling back to an in-memory Mock Database for preview/testing.")
    print("!" * 60 + "\n")
    
    class MockCursor(list):
        """Mock cursor to support PyMongo sort method chaining."""
        def sort(self, field, direction=1):
            super().sort(key=lambda x: x.get(field) or 0, reverse=(direction == -1))
            return self

    class MockParticipantsCollection:
        """
        In-memory MongoDB Collection mock containing the 5 specified
        testing participants to support immediate running.
        """
        def __init__(self):
            self.data = [
                {
                    "participant_id": 1001,
                    "full_name": "Rahul Sharma",
                    "email": "rahul@gmail.com",
                    "phone": "9876543210",
                    "college": "ABC Engineering College",
                    "event_name": "Hackathon 2026",
                    "registration_fee": 500.0
                },
                {
                    "participant_id": 1002,
                    "full_name": "Sneha Patel",
                    "email": "sneha@gmail.com",
                    "phone": "9988776655",
                    "college": "XYZ University",
                    "event_name": "AI Workshop",
                    "registration_fee": 300.0
                },
                {
                    "participant_id": 1003,
                    "full_name": "Kiran Kumar",
                    "email": "kiran@gmail.com",
                    "phone": "9123456789",
                    "college": "National Institute of Technology",
                    "event_name": "Web Development Bootcamp",
                    "registration_fee": 400.0
                },
                {
                    "participant_id": 1004,
                    "full_name": "Anjali Verma",
                    "email": "anjali@gmail.com",
                    "phone": "9012345678",
                    "college": "Government Engineering College",
                    "event_name": "Cloud Computing Seminar",
                    "registration_fee": 350.0
                },
                {
                    "participant_id": 1005,
                    "full_name": "Vikram Singh",
                    "email": "vikram@gmail.com",
                    "phone": "9090909090",
                    "college": "Tech University",
                    "event_name": "Python Programming Workshop",
                    "registration_fee": 450.0
                }
            ]

        def find(self, query=None, projection=None):
            # Return copies of the dictionaries to prevent external mutation
            results = [dict(p) for p in self.data]
            return MockCursor(results)

        def find_one(self, query, projection=None):
            p_id = query.get("participant_id")
            for p in self.data:
                if p["participant_id"] == p_id:
                    return dict(p)
            return None

        def insert_one(self, doc):
            # Clone doc to avoid reference issues
            self.data.append(dict(doc))
            return type('InsertResult', (), {'inserted_id': doc.get('participant_id')})()

        def update_one(self, query, update):
            p_id = query.get("participant_id")
            for idx, p in enumerate(self.data):
                if p['participant_id'] == p_id:
                    for k, v in update.get('$set', {}).items():
                        self.data[idx][k] = v
                    return type('UpdateResult', (), {'modified_count': 1})()
            return type('UpdateResult', (), {'modified_count': 0})()

        def delete_one(self, query):
            p_id = query.get("participant_id")
            for idx, p in enumerate(self.data):
                if p['participant_id'] == p_id:
                    self.data.pop(idx)
                    return type('DeleteResult', (), {'deleted_count': 1})()
            return type('DeleteResult', (), {'deleted_count': 0})()

    participants_collection = MockParticipantsCollection()

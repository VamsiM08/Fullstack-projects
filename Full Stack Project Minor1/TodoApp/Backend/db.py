import os
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from bson import ObjectId

# Read MongoDB URI from environment variable, fallback to local MongoDB instance
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGO_DB", "todo_db")

# In-memory mock fallback to support testing when MongoDB is not running locally
class MockCollection:
    def __init__(self):
        self.data = []

    def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = ObjectId()
        doc_copy = dict(document)
        self.data.append(doc_copy)
        
        class InsertOneResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertOneResult(doc_copy["_id"])

    def insert_many(self, documents):
        inserted_ids = []
        for doc in documents:
            res = self.insert_one(doc)
            inserted_ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    def find(self, filter=None):
        if filter is None:
            return [dict(d) for d in self.data]
        results = []
        for d in self.data:
            match = True
            for k, v in filter.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(d))
        return results

    def find_one(self, filter):
        results = self.find(filter)
        return results[0] if results else None

    def update_one(self, filter, update):
        doc = self.find_one(filter)
        if doc:
            idx = next(i for i, d in enumerate(self.data) if d["_id"] == doc["_id"])
            if "$set" in update:
                for k, v in update["$set"].items():
                    self.data[idx][k] = v
            else:
                for k, v in update.items():
                    self.data[idx][k] = v
        class UpdateResult:
            pass
        return UpdateResult()

    def delete_one(self, filter):
        doc = self.find_one(filter)
        if doc:
            self.data = [d for d in self.data if d["_id"] != doc["_id"]]
        class DeleteResult:
            pass
        return DeleteResult()

    def delete_many(self, filter=None):
        if filter is None or filter == {}:
            self.data = []
        else:
            self.data = [d for d in self.data if not all(d.get(k) == v for k, v in filter.items())]
        class DeleteResult:
            pass
        return DeleteResult()

# Check and establish connection
try:
    print(f"Connecting to MongoDB at: {MONGO_URI}...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Force connection check
    client.server_info()
    db = client[DB_NAME]
    tasks_collection = db["tasks"]
    print("Database connection successfully established.")
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    print("WARNING: Could not connect to MongoDB server. Falling back to local in-memory database mock.")
    tasks_collection = MockCollection()
    # Auto-seed mock database with the testing data
    tasks_collection.insert_many([
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
    ])

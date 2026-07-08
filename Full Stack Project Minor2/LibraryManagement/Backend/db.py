import os
from pymongo import MongoClient

# MongoDB Connection URI
# By default, falls back to local MongoDB. Change this or set MONGO_URI environment variable for MongoDB Atlas.
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')

# Initialize PyMongo Client with connection validation and fallback
try:
    # Use a short timeout of 1.5 seconds so we fall back quickly if offline
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    
    # Check connection
    client.admin.command('ping')
    
    db = client['library_db']
    books_collection = db['books']
    print("\n" + "="*60)
    print(">>> SUCCESS: Connected to MongoDB at", MONGO_URI)
    print("="*60 + "\n")
except Exception as e:
    print("\n" + "!"*60)
    print(">>> WARNING: Could not connect to MongoDB.")
    print(">>> Error detail:", str(e))
    print(">>> Falling back to an in-memory Mock Database for preview/testing.")
    print("!"*60 + "\n")
    
    class MockCollection:
        """
        Mock MongoDB Collection class providing in-memory database CRUD operations
        when a live MongoDB instance is not available.
        """
        def __init__(self):
            # Seed with the 5 testing books requested in instructions
            self.data = [
                {
                    "book_id": 101,
                    "title": "Python Programming",
                    "author": "Guido Rossum",
                    "category": "Programming",
                    "price": 799.0,
                    "quantity": 25,
                    "publisher": "Tech Books"
                },
                {
                    "book_id": 102,
                    "title": "Learning Django",
                    "author": "William Vincent",
                    "category": "Web Development",
                    "price": 950.0,
                    "quantity": 15,
                    "publisher": "Code Publications"
                },
                {
                    "book_id": 103,
                    "title": "MongoDB Basics",
                    "author": "John Smith",
                    "category": "Database",
                    "price": 650.0,
                    "quantity": 20,
                    "publisher": "Database World"
                },
                {
                    "book_id": 104,
                    "title": "JavaScript Essentials",
                    "author": "David Green",
                    "category": "Programming",
                    "price": 550.0,
                    "quantity": 18,
                    "publisher": "Web Tech"
                },
                {
                    "book_id": 105,
                    "title": "HTML & CSS Complete Guide",
                    "author": "Sarah Johnson",
                    "category": "Frontend",
                    "price": 450.0,
                    "quantity": 30,
                    "publisher": "Frontend Academy"
                }
            ]

        def find(self, query=None, projection=None):
            return [dict(b) for b in self.data]

        def find_one(self, query, projection=None):
            for book in self.data:
                if all(book.get(k) == v for k, v in query.items()):
                    return dict(book)
            return None

        def insert_one(self, doc):
            self.data.append(doc)
            return type('InsertResult', (), {'inserted_id': doc.get('book_id')})()

        def update_one(self, query, update):
            book_id = query.get('book_id')
            for idx, book in enumerate(self.data):
                if book['book_id'] == book_id:
                    for k, v in update.get('$set', {}).items():
                        self.data[idx][k] = v
                    return type('UpdateResult', (), {'modified_count': 1})()
            return type('UpdateResult', (), {'modified_count': 0})()

        def delete_one(self, query):
            book_id = query.get('book_id')
            for idx, book in enumerate(self.data):
                if book['book_id'] == book_id:
                    self.data.pop(idx)
                    return type('DeleteResult', (), {'deleted_count': 1})()
            return type('DeleteResult', (), {'deleted_count': 0})()

    books_collection = MockCollection()


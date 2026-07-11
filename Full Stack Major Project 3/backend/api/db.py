import os
import json
import uuid
import re
from bson import ObjectId
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from passlib.hash import pbkdf2_sha256

class JSONCollection:
    def __init__(self, file_path):
        self.file_path = file_path
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path):
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _read(self):
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def _write(self, data):
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

    def _match(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            if key == '_id':
                doc_val = str(doc.get('_id', ''))
                val_str = str(val)
                if doc_val != val_str:
                    return False
                continue

            # Handle sub-document operators like $regex, $in, $gt, etc.
            if isinstance(val, dict):
                doc_val = doc.get(key)
                matched = True
                for op, op_val in val.items():
                    if op == '$regex':
                        options = val.get('$options', '')
                        flags = re.IGNORECASE if 'i' in options else 0
                        if doc_val is None or not re.search(op_val, str(doc_val), flags):
                            matched = False
                            break
                    elif op == '$in':
                        if isinstance(doc_val, list):
                            if not any(x in op_val for x in doc_val):
                                matched = False
                                break
                        else:
                            if doc_val not in op_val:
                                matched = False
                                break
                    elif op == '$nin':
                        if isinstance(doc_val, list):
                            if any(x in op_val for x in doc_val):
                                matched = False
                                break
                        else:
                            if doc_val in op_val:
                                matched = False
                                break
                    elif op == '$gt':
                        try:
                            if doc_val is None or float(doc_val) <= float(op_val):
                                matched = False
                                break
                        except ValueError:
                            matched = False
                            break
                    elif op == '$gte':
                        try:
                            if doc_val is None or float(doc_val) < float(op_val):
                                matched = False
                                break
                        except ValueError:
                            matched = False
                            break
                    elif op == '$lt':
                        try:
                            if doc_val is None or float(doc_val) >= float(op_val):
                                matched = False
                                break
                        except ValueError:
                            matched = False
                            break
                    elif op == '$lte':
                        try:
                            if doc_val is None or float(doc_val) > float(op_val):
                                matched = False
                                break
                        except ValueError:
                            matched = False
                            break
                    elif op == '$ne':
                        if doc_val == op_val:
                            matched = False
                            break
                if not matched:
                    return False
            else:
                doc_val = doc.get(key)
                if isinstance(doc_val, list):
                    if val not in doc_val:
                        return False
                elif str(doc_val) != str(val):
                    return False
        return True

    def find(self, query=None, projection=None):
        docs = self._read()
        results = [doc for doc in docs if self._match(doc, query)]
        if projection:
            projected = []
            for doc in results:
                new_doc = {}
                for k, v in doc.items():
                    if projection.get(k, 0) == 1:
                        new_doc[k] = v
                if '_id' not in new_doc and projection.get('_id', 1) != 0:
                    new_doc['_id'] = doc.get('_id')
                projected.append(new_doc)
            return projected
        return results

    def find_one(self, query=None, projection=None):
        docs = self.find(query, projection)
        return docs[0] if docs else None

    def insert_one(self, document):
        if not isinstance(document, dict):
            raise ValueError("Document must be a dict")
        doc_copy = json.loads(json.dumps(document, default=str))
        docs = self._read()
        if '_id' not in doc_copy:
            doc_copy['_id'] = str(uuid.uuid4())
        else:
            doc_copy['_id'] = str(doc_copy['_id'])
        docs.append(doc_copy)
        self._write(docs)
        
        class InsertOneResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertOneResult(doc_copy['_id'])

    def insert_many(self, documents):
        docs = self._read()
        inserted_ids = []
        doc_copies = []
        for doc in documents:
            doc_copy = json.loads(json.dumps(doc, default=str))
            if '_id' not in doc_copy:
                doc_copy['_id'] = str(uuid.uuid4())
            else:
                doc_copy['_id'] = str(doc_copy['_id'])
            doc_copies.append(doc_copy)
            inserted_ids.append(doc_copy['_id'])
        docs.extend(doc_copies)
        self._write(docs)
        
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(inserted_ids)

    def update_one(self, query, update):
        docs = self._read()
        modified_count = 0
        for doc in docs:
            if self._match(doc, query):
                if '$set' in update:
                    for k, v in update['$set'].items():
                        doc[k] = json.loads(json.dumps(v, default=str))
                    modified_count = 1
                    break
        if modified_count > 0:
            self._write(docs)
        
        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(modified_count)

    def update_many(self, query, update):
        docs = self._read()
        modified_count = 0
        for doc in docs:
            if self._match(doc, query):
                if '$set' in update:
                    for k, v in update['$set'].items():
                        doc[k] = json.loads(json.dumps(v, default=str))
                    modified_count += 1
        if modified_count > 0:
            self._write(docs)
            
        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(modified_count)

    def delete_one(self, query):
        docs = self._read()
        deleted_count = 0
        for idx, doc in enumerate(docs):
            if self._match(doc, query):
                docs.pop(idx)
                deleted_count = 1
                break
        if deleted_count > 0:
            self._write(docs)
            
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    def delete_many(self, query):
        docs = self._read()
        initial_len = len(docs)
        docs = [doc for doc in docs if not self._match(doc, query)]
        deleted_count = initial_len - len(docs)
        if deleted_count > 0:
            self._write(docs)
            
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    def count_documents(self, query):
        docs = self._read()
        return sum(1 for doc in docs if self._match(doc, query))

class JSONDatabase:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
        self.collections = {}

    def __getitem__(self, collection_name):
        if collection_name not in self.collections:
            file_path = os.path.join(self.base_dir, f"{collection_name}.json")
            self.collections[collection_name] = JSONCollection(file_path)
        return self.collections[collection_name]

    def __getattr__(self, collection_name):
        return self[collection_name]

# MongoDB Connection logic
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db = None
is_mongodb = False

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.server_info()
    db = client["movie_ticket_booking"]
    is_mongodb = True
    print("Database: Connected successfully to MongoDB server.")
except (ConnectionFailure, ServerSelectionTimeoutError):
    print("Database: MongoDB not available. Initializing Local JSON Database.")
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    db = JSONDatabase(db_path)
    is_mongodb = False

# Database seeding logic
def seed_database():
    def get_hashed_pwd(raw):
        return pbkdf2_sha256.hash(raw)

    if db.users.count_documents({}) == 0:
        print("Database: Seeding Users...")
        users_data = [
            {
                "_id": "user-admin",
                "name": "Admin",
                "email": "admin@movies.com",
                "phone": "9876543210",
                "password": get_hashed_pwd("admin123"),
                "role": "admin"
            },
            {
                "_id": "user-rahul",
                "name": "Rahul Sharma",
                "email": "rahul@gmail.com",
                "phone": "9876543211",
                "password": get_hashed_pwd("rahul123"),
                "role": "customer"
            },
            {
                "_id": "user-priya",
                "name": "Priya Verma",
                "email": "priya@gmail.com",
                "phone": "9876543212",
                "password": get_hashed_pwd("priya123"),
                "role": "customer"
            }
        ]
        db.users.insert_many(users_data)

    if db.movies.count_documents({}) == 0:
        print("Database: Seeding Movies...")
        movies_data = [
            {
                "_id": "movie-leo",
                "title": "Leo",
                "genre": "Action",
                "language": "Tamil",
                "duration": "2h 44m",
                "rating": "8.2",
                "releaseDate": "2023-10-19",
                "poster": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
                "banner": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
                "trailer": "https://www.youtube.com/watch?v=CoYwGp5n9F8",
                "description": "An action-packed thriller where an ordinary cafe owner becomes the target of a drug cartel who believe he is a former gang member."
            },
            {
                "_id": "movie-pushpa2",
                "title": "Pushpa 2",
                "genre": "Action",
                "language": "Telugu",
                "duration": "3h 10m",
                "rating": "8.5",
                "releaseDate": "2024-12-05",
                "poster": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500",
                "banner": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200",
                "trailer": "https://www.youtube.com/watch?v=1kVK0MZlbI4",
                "description": "The clash continues between Pushpa Raj, now rules the smuggling empire, and Bhanwar Singh Shekhawat, who seeks vengeance."
            },
            {
                "_id": "movie-kalki",
                "title": "Kalki 2898 AD",
                "genre": "Sci-Fi",
                "language": "Telugu",
                "duration": "3h",
                "rating": "8.9",
                "releaseDate": "2024-06-27",
                "poster": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500",
                "banner": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
                "trailer": "https://www.youtube.com/watch?v=kQDd1AhGIHk",
                "description": "A modern avatar of Vishnu, a Hindu god, is believed to have descended to earth to protect the world from evil forces."
            },
            {
                "_id": "movie-jawan",
                "title": "Jawan",
                "genre": "Action",
                "language": "Hindi",
                "duration": "2h 50m",
                "rating": "8.3",
                "releaseDate": "2023-09-07",
                "poster": "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=500",
                "banner": "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1200",
                "trailer": "https://www.youtube.com/watch?v=COv527TE_CU",
                "description": "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society."
            },
            {
                "_id": "movie-avatar",
                "title": "Avatar: The Way of Water",
                "genre": "Sci-Fi",
                "language": "English",
                "duration": "3h 12m",
                "rating": "8.7",
                "releaseDate": "2022-12-16",
                "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500",
                "banner": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200",
                "trailer": "https://www.youtube.com/watch?v=d9MyW72ELq0",
                "description": "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Jake must work with Neytiri and other Na'vi to protect their home from a returned threat."
            }
        ]
        db.movies.insert_many(movies_data)

    if db.theatres.count_documents({}) == 0:
        print("Database: Seeding Theatres...")
        theatres_data = [
            {
                "_id": "theatre-pvr",
                "theatreName": "PVR Cinemas",
                "city": "Hyderabad",
                "address": "Next Galleria Mall, Punjagutta, Hyderabad",
                "screens": 5
            },
            {
                "_id": "theatre-inox",
                "theatreName": "INOX",
                "city": "Bengaluru",
                "address": "Mantri Square Mall, Malleshwaram, Bengaluru",
                "screens": 4
            },
            {
                "_id": "theatre-cinepolis",
                "theatreName": "Cinepolis",
                "city": "Chennai",
                "address": "Season's Mall, Velachery, Chennai",
                "screens": 6
            }
        ]
        db.theatres.insert_many(theatres_data)

    if db.screens.count_documents({}) == 0:
        print("Database: Seeding Screens...")
        screens_data = [
            {"_id": "screen-pvr-1", "theatreId": "theatre-pvr", "screenName": "Screen 1", "totalSeats": 120},
            {"_id": "screen-pvr-2", "theatreId": "theatre-pvr", "screenName": "Screen 2", "totalSeats": 120},
            {"_id": "screen-pvr-3", "theatreId": "theatre-pvr", "screenName": "Screen 3", "totalSeats": 120},
            {"_id": "screen-pvr-4", "theatreId": "theatre-pvr", "screenName": "Screen 4", "totalSeats": 120},
            {"_id": "screen-pvr-5", "theatreId": "theatre-pvr", "screenName": "Screen 5", "totalSeats": 120},
            {"_id": "screen-inox-1", "theatreId": "theatre-inox", "screenName": "Screen 1", "totalSeats": 120},
            {"_id": "screen-inox-2", "theatreId": "theatre-inox", "screenName": "Screen 2", "totalSeats": 120},
            {"_id": "screen-inox-3", "theatreId": "theatre-inox", "screenName": "Screen 3", "totalSeats": 120},
            {"_id": "screen-inox-4", "theatreId": "theatre-inox", "screenName": "Screen 4", "totalSeats": 120},
            {"_id": "screen-cine-1", "theatreId": "theatre-cinepolis", "screenName": "Screen 1", "totalSeats": 120},
            {"_id": "screen-cine-2", "theatreId": "theatre-cinepolis", "screenName": "Screen 2", "totalSeats": 120},
            {"_id": "screen-cine-3", "theatreId": "theatre-cinepolis", "screenName": "Screen 3", "totalSeats": 120},
            {"_id": "screen-cine-4", "theatreId": "theatre-cinepolis", "screenName": "Screen 4", "totalSeats": 120},
            {"_id": "screen-cine-5", "theatreId": "theatre-cinepolis", "screenName": "Screen 5", "totalSeats": 120},
            {"_id": "screen-cine-6", "theatreId": "theatre-cinepolis", "screenName": "Screen 6", "totalSeats": 120}
        ]
        db.screens.insert_many(screens_data)

    if db.shows.count_documents({}) == 0:
        print("Database: Seeding Shows...")
        shows_data = [
            {
                "_id": "show-1",
                "movieId": "movie-leo",
                "theatreId": "theatre-pvr",
                "screenId": "screen-pvr-1",
                "showDate": "2026-07-15",
                "showTime": "10:00 AM",
                "ticketPrice": 250,
                "enabled": True
            },
            {
                "_id": "show-2",
                "movieId": "movie-pushpa2",
                "theatreId": "theatre-inox",
                "screenId": "screen-inox-2",
                "showDate": "2026-07-15",
                "showTime": "02:00 PM",
                "ticketPrice": 300,
                "enabled": True
            },
            {
                "_id": "show-3",
                "movieId": "movie-kalki",
                "theatreId": "theatre-cinepolis",
                "screenId": "screen-cine-3",
                "showDate": "2026-07-15",
                "showTime": "07:30 PM",
                "ticketPrice": 350,
                "enabled": True
            }
        ]
        db.shows.insert_many(shows_data)

    if db.bookings.count_documents({}) == 0:
        print("Database: Seeding Bookings...")
        bookings_data = [
            {
                "_id": "booking-1",
                "userId": "user-rahul",
                "showId": "show-1",
                "seats": ["A1", "A2"],
                "totalAmount": 500,
                "paymentMethod": "UPI",
                "status": "Confirmed"
            },
            {
                "_id": "booking-2",
                "userId": "user-priya",
                "showId": "show-2",
                "seats": ["C5", "C6", "C7"],
                "totalAmount": 900,
                "paymentMethod": "Credit Card",
                "status": "Confirmed"
            }
        ]
        db.bookings.insert_many(bookings_data)

seed_database()
print("Database: Initialization & seeding completed successfully.")

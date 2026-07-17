import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from db import books_collection

def books_list(request):
    """
    GET /books/
    Retrieve and display all books in the database.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed. Use GET.'}, status=405)
    
    try:
        # Retrieve all books, excluding the MongoDB default ObjectId (_id)
        books = list(books_collection.find({}, {'_id': 0}))
        return JsonResponse(books, safe=False, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Database query failed: {str(e)}'}, status=500)

@csrf_exempt
def add_book(request):
    """
    POST /books/add/
    Add a new book record. Enforces unique book_id and types.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        # 1. Validation for presence of all required fields
        required_fields = ['book_id', 'title', 'author', 'category', 'price', 'quantity', 'publisher']
        for field in required_fields:
            if field not in data or data[field] is None:
                return JsonResponse({'error': f"Field '{field}' is required."}, status=400)
        
        # 2. Type validation and conversion
        try:
            book_id = int(data['book_id'])
            price = float(data['price'])
            quantity = int(data['quantity'])
        except (ValueError, TypeError):
            return JsonResponse({'error': 'book_id, price, and quantity must be valid numbers.'}, status=400)
        
        # 3. Check for unique book_id
        if books_collection.find_one({'book_id': book_id}):
            return JsonResponse({'error': f"Book with ID {book_id} already exists."}, status=400)
        
        # 4. Save book
        new_book = {
            'book_id': book_id,
            'title': str(data['title']).strip(),
            'author': str(data['author']).strip(),
            'category': str(data['category']).strip(),
            'price': price,
            'quantity': quantity,
            'publisher': str(data['publisher']).strip()
        }
        
        books_collection.insert_one(new_book)
        return JsonResponse({'message': 'Book added successfully.', 'book': new_book}, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)

@csrf_exempt
def update_book(request, book_id):
    """
    PUT /books/update/<book_id>/
    Update an existing book record.
    """
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed. Use PUT.'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        # Convert book_id to int to query the DB
        try:
            book_id_int = int(book_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid book ID in URL.'}, status=400)
        
        # Check if the book exists
        existing_book = books_collection.find_one({'book_id': book_id_int})
        if not existing_book:
            return JsonResponse({'error': f"Book with ID {book_id_int} not found."}, status=404)
        
        # Gather update fields
        update_fields = {}
        
        if 'title' in data:
            update_fields['title'] = str(data['title']).strip()
        if 'author' in data:
            update_fields['author'] = str(data['author']).strip()
        if 'category' in data:
            update_fields['category'] = str(data['category']).strip()
        if 'publisher' in data:
            update_fields['publisher'] = str(data['publisher']).strip()
            
        if 'price' in data:
            try:
                update_fields['price'] = float(data['price'])
            except (ValueError, TypeError):
                return JsonResponse({'error': 'Price must be a valid number.'}, status=400)
                
        if 'quantity' in data:
            try:
                update_fields['quantity'] = int(data['quantity'])
            except (ValueError, TypeError):
                return JsonResponse({'error': 'Quantity must be a valid integer.'}, status=400)
                
        if not update_fields:
            return JsonResponse({'message': 'No details were updated.'}, status=200)
            
        # Update the document in MongoDB
        books_collection.update_one({'book_id': book_id_int}, {'$set': update_fields})
        
        # Retrieve and return updated book
        updated_book = books_collection.find_one({'book_id': book_id_int}, {'_id': 0})
        return JsonResponse({'message': 'Book updated successfully.', 'book': updated_book}, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)

@csrf_exempt
def delete_book(request, book_id):
    """
    DELETE /books/delete/<book_id>/
    Delete the selected book record.
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed. Use DELETE.'}, status=405)
    
    try:
        try:
            book_id_int = int(book_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid book ID in URL.'}, status=400)
        
        # Attempt to delete
        result = books_collection.delete_one({'book_id': book_id_int})
        
        if result.deleted_count == 0:
            return JsonResponse({'error': f"Book with ID {book_id_int} not found."}, status=404)
            
        return JsonResponse({'message': f'Book with ID {book_id_int} deleted successfully.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)

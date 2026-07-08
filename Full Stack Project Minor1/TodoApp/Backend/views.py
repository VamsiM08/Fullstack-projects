from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from bson.errors import InvalidId
from db import tasks_collection

def serialize_task(doc):
    if doc is None:
        return None
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "priority": doc.get("priority", "Medium"),
        "status": doc.get("status", "Pending")
    }

@api_view(['GET'])
def get_tasks(request):
    """
    GET /tasks/
    Display all available tasks.
    """
    if tasks_collection is None:
        return Response({"error": "Database connection is not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        tasks_cursor = tasks_collection.find()
        tasks_list = [serialize_task(t) for t in tasks_cursor]
        return Response(tasks_list, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def add_task(request):
    """
    POST /tasks/add/
    Add a new task to the To-Do list.
    """
    if tasks_collection is None:
        return Response({"error": "Database connection is not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    data = request.data
    title = data.get("title")
    description = data.get("description", "")
    priority = data.get("priority", "Medium")
    status_val = data.get("status", "Pending")
    
    if not title:
        return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    task_doc = {
        "title": title,
        "description": description,
        "priority": priority,
        "status": status_val
    }
    
    try:
        result = tasks_collection.insert_one(task_doc)
        task_doc["_id"] = result.inserted_id
        return Response(serialize_task(task_doc), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_task(request, id):
    """
    PUT /tasks/update/<id>/
    Update the task title, description, priority, or status.
    """
    if tasks_collection is None:
        return Response({"error": "Database connection is not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        oid = ObjectId(id)
    except InvalidId:
        return Response({"error": "Invalid task ID format"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        existing = tasks_collection.find_one({"_id": oid})
        if not existing:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
            
        data = request.data
        
        # Support updating title, description, priority, or status, falling back to existing values if not provided
        update_data = {
            "title": data.get("title", existing.get("title", "")),
            "description": data.get("description", existing.get("description", "")),
            "priority": data.get("priority", existing.get("priority", "Medium")),
            "status": data.get("status", existing.get("status", "Pending"))
        }
        
        tasks_collection.update_one({"_id": oid}, {"$set": update_data})
        updated_doc = tasks_collection.find_one({"_id": oid})
        
        return Response(serialize_task(updated_doc), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_task(request, id):
    """
    DELETE /tasks/delete/<id>/
    Delete a task using its unique ID.
    """
    if tasks_collection is None:
        return Response({"error": "Database connection is not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    try:
        oid = ObjectId(id)
    except InvalidId:
        return Response({"error": "Invalid task ID format"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        existing = tasks_collection.find_one({"_id": oid})
        if not existing:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
            
        tasks_collection.delete_one({"_id": oid})
        return Response({"message": "Task deleted successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

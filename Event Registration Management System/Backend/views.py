import json
import os
from django.conf import settings
from django.http import JsonResponse, FileResponse, HttpResponse, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .db import participants_collection

# --- Frontend Serving Views ---

def serve_index(request):
    """Serves the main index.html file from the Frontend directory."""
    frontend_dir = os.path.join(settings.BASE_DIR, 'Frontend')
    file_path = os.path.join(frontend_dir, 'index.html')
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='text/html')
    return HttpResponseNotFound("index.html not found in Frontend directory.")

def serve_css(request):
    """Serves style.css from the Frontend directory."""
    frontend_dir = os.path.join(settings.BASE_DIR, 'Frontend')
    file_path = os.path.join(frontend_dir, 'style.css')
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='text/css')
    return HttpResponseNotFound("style.css not found in Frontend directory.")

def serve_js(request):
    """Serves script.js from the Frontend directory."""
    frontend_dir = os.path.join(settings.BASE_DIR, 'Frontend')
    file_path = os.path.join(frontend_dir, 'script.js')
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='application/javascript')
    return HttpResponseNotFound("script.js not found in Frontend directory.")


# --- CRUD API Views ---

@require_http_methods(["GET"])
def get_participants(request):
    """
    GET /participants/
    Retrieves all registered participants.
    """
    try:
        # Exclude MongoDB internal _id from response
        cursor = participants_collection.find({}, {"_id": 0})
        # Sort by participant_id ascending
        participants = list(cursor.sort("participant_id", 1))
        return JsonResponse(participants, safe=False)
    except Exception as e:
        return JsonResponse({"error": f"Failed to retrieve participants: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def add_participant(request):
    """
    POST /participants/add/
    Registers a new participant.
    """
    try:
        if not request.body:
            return JsonResponse({"error": "Empty request body"}, status=400)
            
        data = json.loads(request.body)
        
        # Required fields check
        required_fields = ["participant_id", "full_name", "email", "phone", "college", "event_name", "registration_fee"]
        for field in required_fields:
            if field not in data or data[field] is None:
                return JsonResponse({"error": f"Field '{field}' is required"}, status=400)
        
        # Parse and validate types
        try:
            participant_id = int(data["participant_id"])
        except (ValueError, TypeError):
            return JsonResponse({"error": "participant_id must be an integer"}, status=400)
            
        try:
            registration_fee = float(data["registration_fee"])
        except (ValueError, TypeError):
            return JsonResponse({"error": "registration_fee must be a number"}, status=400)
            
        full_name = str(data["full_name"]).strip()
        email = str(data["email"]).strip()
        phone = str(data["phone"]).strip()
        college = str(data["college"]).strip()
        event_name = str(data["event_name"]).strip()
        
        if not full_name or not email or not phone or not college or not event_name:
            return JsonResponse({"error": "Text fields cannot be empty"}, status=400)
            
        # Check for duplicate participant_id
        existing = participants_collection.find_one({"participant_id": participant_id})
        if existing:
            return JsonResponse({"error": f"Participant with ID {participant_id} already exists"}, status=409)
            
        participant = {
            "participant_id": participant_id,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "college": college,
            "event_name": event_name,
            "registration_fee": registration_fee
        }
        
        participants_collection.insert_one(participant)
        
        # Return success with the created participant (excluding DB internal ID)
        participant.pop("_id", None)
        return JsonResponse({"success": "Participant registered successfully", "participant": participant}, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["PUT", "OPTIONS"])
def update_participant(request, participant_id):
    """
    PUT /participants/update/<participant_id>/
    Updates details of a registered participant.
    """
    if request.method == "OPTIONS":
        # Handled by CORS middleware but added here for safety
        return HttpResponse(status=200)
        
    try:
        # Convert participant_id in URL to integer
        try:
            p_id = int(participant_id)
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid participant ID in URL"}, status=400)
            
        if not request.body:
            return JsonResponse({"error": "Empty request body"}, status=400)
            
        data = json.loads(request.body)
        
        # Check if participant exists
        existing = participants_collection.find_one({"participant_id": p_id})
        if not existing:
            return JsonResponse({"error": f"Participant with ID {p_id} not found"}, status=404)
            
        # Compile update fields
        update_fields = {}
        
        if "full_name" in data:
            val = str(data["full_name"]).strip()
            if not val:
                return JsonResponse({"error": "full_name cannot be empty"}, status=400)
            update_fields["full_name"] = val
            
        if "email" in data:
            val = str(data["email"]).strip()
            if not val:
                return JsonResponse({"error": "email cannot be empty"}, status=400)
            update_fields["email"] = val
            
        if "phone" in data:
            val = str(data["phone"]).strip()
            if not val:
                return JsonResponse({"error": "phone cannot be empty"}, status=400)
            update_fields["phone"] = val
            
        if "college" in data:
            val = str(data["college"]).strip()
            if not val:
                return JsonResponse({"error": "college cannot be empty"}, status=400)
            update_fields["college"] = val
            
        if "event_name" in data:
            val = str(data["event_name"]).strip()
            if not val:
                return JsonResponse({"error": "event_name cannot be empty"}, status=400)
            update_fields["event_name"] = val
            
        if "registration_fee" in data:
            try:
                update_fields["registration_fee"] = float(data["registration_fee"])
            except (ValueError, TypeError):
                return JsonResponse({"error": "registration_fee must be a number"}, status=400)
                
        if not update_fields:
            return JsonResponse({"message": "No changes requested"}, status=200)
            
        participants_collection.update_one({"participant_id": p_id}, {"$set": update_fields})
        
        # Fetch updated item
        updated = participants_collection.find_one({"participant_id": p_id}, {"_id": 0})
        return JsonResponse({"success": "Participant updated successfully", "participant": updated}, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["DELETE", "OPTIONS"])
def delete_participant(request, participant_id):
    """
    DELETE /participants/delete/<participant_id>/
    Deletes a registered participant.
    """
    if request.method == "OPTIONS":
        return HttpResponse(status=200)
        
    try:
        try:
            p_id = int(participant_id)
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid participant ID in URL"}, status=400)
            
        result = participants_collection.delete_one({"participant_id": p_id})
        
        if result.deleted_count == 0:
            return JsonResponse({"error": f"Participant with ID {p_id} not found"}, status=404)
            
        return JsonResponse({"success": f"Participant {p_id} deleted successfully"}, status=200)
        
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)

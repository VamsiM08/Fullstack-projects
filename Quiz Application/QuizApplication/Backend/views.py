import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import db

# ----------------- Student Views -----------------

@csrf_exempt
def add_student_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Basic validation
            required_fields = ['full_name', 'email', 'phone', 'college', 'password']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            student_id = db.add_student(data)
            return JsonResponse({
                'message': 'Student registered successfully',
                'student_id': student_id
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def students_list_view(request):
    if request.method == 'GET':
        try:
            students = db.get_all_students()
            return JsonResponse(students, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_student_view(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            # Basic validation
            required_fields = ['full_name', 'email', 'phone', 'college', 'password']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            success = db.update_student(id, data)
            if success:
                return JsonResponse({'message': 'Student updated successfully'}, status=200)
            return JsonResponse({'error': 'Student not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_student_view(request, id):
    if request.method == 'DELETE':
        try:
            success = db.delete_student(id)
            if success:
                return JsonResponse({'message': 'Student deleted successfully'}, status=200)
            return JsonResponse({'error': 'Student not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ----------------- Quiz Views -----------------

@csrf_exempt
def add_quiz_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['quiz_title', 'category', 'total_questions', 'duration', 'total_marks']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            quiz_id = db.add_quiz(data)
            return JsonResponse({
                'message': 'Quiz created successfully',
                'quiz_id': quiz_id
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def quizzes_list_view(request):
    if request.method == 'GET':
        try:
            quizzes = db.get_all_quizzes()
            return JsonResponse(quizzes, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_quiz_view(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            required_fields = ['quiz_title', 'category', 'total_questions', 'duration', 'total_marks']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            success = db.update_quiz(id, data)
            if success:
                return JsonResponse({'message': 'Quiz updated successfully'}, status=200)
            return JsonResponse({'error': 'Quiz not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_quiz_view(request, id):
    if request.method == 'DELETE':
        try:
            success = db.delete_quiz(id)
            if success:
                return JsonResponse({'message': 'Quiz deleted successfully'}, status=200)
            return JsonResponse({'error': 'Quiz not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ----------------- Question Views -----------------

@csrf_exempt
def add_question_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['quiz_title', 'question', 'option1', 'option2', 'option3', 'option4', 'correct_answer']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            question_id = db.add_question(data)
            return JsonResponse({
                'message': 'Question added successfully',
                'question_id': question_id
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def questions_list_view(request):
    if request.method == 'GET':
        try:
            questions = db.get_all_questions()
            return JsonResponse(questions, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_question_view(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            required_fields = ['quiz_title', 'question', 'option1', 'option2', 'option3', 'option4', 'correct_answer']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            success = db.update_question(id, data)
            if success:
                return JsonResponse({'message': 'Question updated successfully'}, status=200)
            return JsonResponse({'error': 'Question not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_question_view(request, id):
    if request.method == 'DELETE':
        try:
            success = db.delete_question(id)
            if success:
                return JsonResponse({'message': 'Question deleted successfully'}, status=200)
            return JsonResponse({'error': 'Question not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ----------------- Quiz Attempt Views -----------------

@csrf_exempt
def add_attempt_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['student_name', 'quiz_title', 'question', 'selected_answer', 'submission_time']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            attempt_id = db.add_attempt(data)
            return JsonResponse({
                'message': 'Attempt recorded successfully',
                'attempt_id': attempt_id
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def attempts_list_view(request):
    if request.method == 'GET':
        try:
            attempts = db.get_all_attempts()
            return JsonResponse(attempts, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_attempt_view(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            required_fields = ['student_name', 'quiz_title', 'question', 'selected_answer', 'submission_time']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            success = db.update_attempt(id, data)
            if success:
                return JsonResponse({'message': 'Attempt updated successfully'}, status=200)
            return JsonResponse({'error': 'Attempt not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_attempt_view(request, id):
    if request.method == 'DELETE':
        try:
            success = db.delete_attempt(id)
            if success:
                return JsonResponse({'message': 'Attempt deleted successfully'}, status=200)
            return JsonResponse({'error': 'Attempt not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ----------------- Result Views -----------------

@csrf_exempt
def add_result_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['student_name', 'quiz_title', 'total_marks', 'obtained_marks', 'percentage', 'result_status']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            result_id = db.add_result(data)
            return JsonResponse({
                'message': 'Result recorded successfully',
                'result_id': result_id
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def results_list_view(request):
    if request.method == 'GET':
        try:
            results = db.get_all_results()
            return JsonResponse(results, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_result_view(request, id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            required_fields = ['student_name', 'quiz_title', 'total_marks', 'obtained_marks', 'percentage', 'result_status']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing field: {field}'}, status=400)
            
            success = db.update_result(id, data)
            if success:
                return JsonResponse({'message': 'Result updated successfully'}, status=200)
            return JsonResponse({'error': 'Result not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_result_view(request, id):
    if request.method == 'DELETE':
        try:
            success = db.delete_result(id)
            if success:
                return JsonResponse({'message': 'Result deleted successfully'}, status=200)
            return JsonResponse({'error': 'Result not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

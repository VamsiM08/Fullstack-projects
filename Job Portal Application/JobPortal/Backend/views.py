import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import db

def parse_json(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        try:
            # Fallback for text/plain or other decodings
            return json.loads(request.body)
        except Exception:
            return {}

# ==========================================
# 1. CANDIDATE VIEWS
# ==========================================

@csrf_exempt
def add_candidate_view(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data.get('candidate_id') or not data.get('full_name') or not data.get('email') or not data.get('password'):
            return JsonResponse({'success': False, 'message': 'Missing required fields (candidate_id, full_name, email, password)'}, status=400)
        
        success = db.add_candidate(data)
        if success:
            return JsonResponse({'success': True, 'message': 'Candidate added successfully'}, status=201)
        else:
            return JsonResponse({'success': False, 'message': 'Candidate ID or Email already exists'}, status=400)
    return JsonResponse({'success': False, 'message': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def candidates_list_view(request):
    if request.method == 'GET':
        candidates = db.get_candidates()
        return JsonResponse(candidates, safe=False)
    return JsonResponse({'success': False, 'message': 'Only GET method is allowed'}, status=405)

@csrf_exempt
def update_candidate_view(request, candidate_id):
    if request.method in ('PUT', 'POST'):
        data = parse_json(request)
        success = db.update_candidate(candidate_id, data)
        if success:
            return JsonResponse({'success': True, 'message': f'Candidate {candidate_id} updated successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Candidate {candidate_id} not found or update failed'}, status=404)
    return JsonResponse({'success': False, 'message': 'Only PUT/POST methods are allowed'}, status=405)

@csrf_exempt
def delete_candidate_view(request, candidate_id):
    if request.method in ('DELETE', 'POST', 'GET'):
        success = db.delete_candidate(candidate_id)
        if success:
            return JsonResponse({'success': True, 'message': f'Candidate {candidate_id} deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Candidate {candidate_id} not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

# ==========================================
# 2. EMPLOYER VIEWS
# ==========================================

@csrf_exempt
def add_employer_view(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data.get('employer_id') or not data.get('company_name') or not data.get('email'):
            return JsonResponse({'success': False, 'message': 'Missing required fields (employer_id, company_name, email)'}, status=400)
        
        success = db.add_employer(data)
        if success:
            return JsonResponse({'success': True, 'message': 'Employer added successfully'}, status=201)
        else:
            return JsonResponse({'success': False, 'message': 'Employer ID or Company Name already exists'}, status=400)
    return JsonResponse({'success': False, 'message': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def employers_list_view(request):
    if request.method == 'GET':
        employers = db.get_employers()
        return JsonResponse(employers, safe=False)
    return JsonResponse({'success': False, 'message': 'Only GET method is allowed'}, status=405)

@csrf_exempt
def update_employer_view(request, employer_id):
    if request.method in ('PUT', 'POST'):
        data = parse_json(request)
        success = db.update_employer(employer_id, data)
        if success:
            return JsonResponse({'success': True, 'message': f'Employer {employer_id} updated successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Employer {employer_id} not found or update failed'}, status=404)
    return JsonResponse({'success': False, 'message': 'Only PUT/POST methods are allowed'}, status=405)

@csrf_exempt
def delete_employer_view(request, employer_id):
    if request.method in ('DELETE', 'POST', 'GET'):
        success = db.delete_employer(employer_id)
        if success:
            return JsonResponse({'success': True, 'message': f'Employer {employer_id} deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Employer {employer_id} not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

# ==========================================
# 3. JOB VIEWS
# ==========================================

@csrf_exempt
def add_job_view(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data.get('job_id') or not data.get('job_title') or not data.get('company_name'):
            return JsonResponse({'success': False, 'message': 'Missing required fields (job_id, job_title, company_name)'}, status=400)
        
        success = db.add_job(data)
        if success:
            return JsonResponse({'success': True, 'message': 'Job added successfully'}, status=201)
        else:
            return JsonResponse({'success': False, 'message': 'Job ID already exists'}, status=400)
    return JsonResponse({'success': False, 'message': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def jobs_list_view(request):
    if request.method == 'GET':
        jobs = db.get_jobs()
        return JsonResponse(jobs, safe=False)
    return JsonResponse({'success': False, 'message': 'Only GET method is allowed'}, status=405)

@csrf_exempt
def update_job_view(request, job_id):
    if request.method in ('PUT', 'POST'):
        data = parse_json(request)
        success = db.update_job(job_id, data)
        if success:
            return JsonResponse({'success': True, 'message': f'Job {job_id} updated successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Job {job_id} not found or update failed'}, status=404)
    return JsonResponse({'success': False, 'message': 'Only PUT/POST methods are allowed'}, status=405)

@csrf_exempt
def delete_job_view(request, job_id):
    if request.method in ('DELETE', 'POST', 'GET'):
        success = db.delete_job(job_id)
        if success:
            return JsonResponse({'success': True, 'message': f'Job {job_id} deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Job {job_id} not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

# ==========================================
# 4. APPLICATION VIEWS
# ==========================================

@csrf_exempt
def add_application_view(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data.get('application_id') or not data.get('candidate_name') or not data.get('company_name') or not data.get('job_title'):
            return JsonResponse({'success': False, 'message': 'Missing required fields (application_id, candidate_name, company_name, job_title)'}, status=400)
        
        success = db.add_application(data)
        if success:
            return JsonResponse({'success': True, 'message': 'Application added successfully'}, status=201)
        else:
            return JsonResponse({'success': False, 'message': 'Application ID already exists'}, status=400)
    return JsonResponse({'success': False, 'message': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def applications_list_view(request):
    if request.method == 'GET':
        applications = db.get_applications()
        return JsonResponse(applications, safe=False)
    return JsonResponse({'success': False, 'message': 'Only GET method is allowed'}, status=405)

@csrf_exempt
def update_application_view(request, application_id):
    if request.method in ('PUT', 'POST'):
        data = parse_json(request)
        success = db.update_application(application_id, data)
        if success:
            return JsonResponse({'success': True, 'message': f'Application {application_id} updated successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Application {application_id} not found or update failed'}, status=404)
    return JsonResponse({'success': False, 'message': 'Only PUT/POST methods are allowed'}, status=405)

@csrf_exempt
def delete_application_view(request, application_id):
    if request.method in ('DELETE', 'POST', 'GET'):
        success = db.delete_application(application_id)
        if success:
            return JsonResponse({'success': True, 'message': f'Application {application_id} deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Application {application_id} not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

# ==========================================
# 5. INTERVIEW VIEWS
# ==========================================

@csrf_exempt
def add_interview_view(request):
    if request.method == 'POST':
        data = parse_json(request)
        if not data.get('interview_id') or not data.get('candidate_name') or not data.get('company_name') or not data.get('interview_date') or not data.get('interview_time'):
            return JsonResponse({'success': False, 'message': 'Missing required fields (interview_id, candidate_name, company_name, interview_date, interview_time)'}, status=400)
        
        success = db.add_interview(data)
        if success:
            return JsonResponse({'success': True, 'message': 'Interview added successfully'}, status=201)
        else:
            return JsonResponse({'success': False, 'message': 'Interview ID already exists'}, status=400)
    return JsonResponse({'success': False, 'message': 'Only POST method is allowed'}, status=405)

@csrf_exempt
def interviews_list_view(request):
    if request.method == 'GET':
        interviews = db.get_interviews()
        return JsonResponse(interviews, safe=False)
    return JsonResponse({'success': False, 'message': 'Only GET method is allowed'}, status=405)

@csrf_exempt
def update_interview_view(request, interview_id):
    if request.method in ('PUT', 'POST'):
        data = parse_json(request)
        success = db.update_interview(interview_id, data)
        if success:
            return JsonResponse({'success': True, 'message': f'Interview {interview_id} updated successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Interview {interview_id} not found or update failed'}, status=404)
    return JsonResponse({'success': False, 'message': 'Only PUT/POST methods are allowed'}, status=405)

@csrf_exempt
def delete_interview_view(request, interview_id):
    if request.method in ('DELETE', 'POST', 'GET'):
        success = db.delete_interview(interview_id)
        if success:
            return JsonResponse({'success': True, 'message': f'Interview {interview_id} deleted successfully'})
        else:
            return JsonResponse({'success': False, 'message': f'Interview {interview_id} not found'}, status=404)
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

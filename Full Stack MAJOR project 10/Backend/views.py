import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from Backend import db

# Initialize the SQLite database and seed initial testing data
db.init_db()

# --- CORS & JSON Helpers ---
def make_api_response(data, status=200):
    response = JsonResponse(data, safe=False, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def handle_preflight(request):
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    return None

def get_json_data(request):
    try:
        return json.loads(request.body)
    except Exception:
        return {}

# --- Module 1: Patient Views ---

@csrf_exempt
def get_patients_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
    
    if request.method == 'GET':
        patients = db.get_all_patients()
        return make_api_response(patients)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def add_patient_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
    
    if request.method == 'POST':
        data = get_json_data(request)
        patient_id = data.get('patient_id')
        patient_name = data.get('patient_name')
        age = data.get('age')
        gender = data.get('gender')
        phone = data.get('phone')
        email = data.get('email')
        blood_group = data.get('blood_group')
        address = data.get('address')
        
        if not patient_name:
            return make_api_response({'error': 'patient_name is required'}, status=400)
            
        new_id = db.add_patient(patient_id, patient_name, age, gender, phone, email, blood_group, address)
        return make_api_response({'message': 'Patient registered successfully', 'patient_id': new_id}, status=201)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_patient_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'PUT':
        data = get_json_data(request)
        patient_name = data.get('patient_name')
        age = data.get('age')
        gender = data.get('gender')
        phone = data.get('phone')
        email = data.get('email')
        blood_group = data.get('blood_group')
        address = data.get('address')
        
        if not patient_name:
            return make_api_response({'error': 'patient_name is required'}, status=400)
            
        success = db.update_patient(int(id), patient_name, age, gender, phone, email, blood_group, address)
        if success:
            return make_api_response({'message': 'Patient updated successfully'})
        return make_api_response({'error': 'Patient not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_patient_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'DELETE':
        success = db.delete_patient(int(id))
        if success:
            return make_api_response({'message': 'Patient deleted successfully'})
        return make_api_response({'error': 'Patient not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)


# --- Module 2: Doctor Views ---

@csrf_exempt
def get_doctors_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'GET':
        doctors = db.get_all_doctors()
        return make_api_response(doctors)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def add_doctor_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'POST':
        data = get_json_data(request)
        doctor_id = data.get('doctor_id')
        doctor_name = data.get('doctor_name')
        specialization = data.get('specialization')
        department = data.get('department')
        experience = data.get('experience')
        phone = data.get('phone')
        consultation_fee = data.get('consultation_fee')
        
        if not doctor_name:
            return make_api_response({'error': 'doctor_name is required'}, status=400)
            
        new_id = db.add_doctor(doctor_id, doctor_name, specialization, department, experience, phone, consultation_fee)
        return make_api_response({'message': 'Doctor added successfully', 'doctor_id': new_id}, status=201)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_doctor_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'PUT':
        data = get_json_data(request)
        doctor_name = data.get('doctor_name')
        specialization = data.get('specialization')
        department = data.get('department')
        experience = data.get('experience')
        phone = data.get('phone')
        consultation_fee = data.get('consultation_fee')
        
        if not doctor_name:
            return make_api_response({'error': 'doctor_name is required'}, status=400)
            
        success = db.update_doctor(int(id), doctor_name, specialization, department, experience, phone, consultation_fee)
        if success:
            return make_api_response({'message': 'Doctor updated successfully'})
        return make_api_response({'error': 'Doctor not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_doctor_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'DELETE':
        success = db.delete_doctor(int(id))
        if success:
            return make_api_response({'message': 'Doctor deleted successfully'})
        return make_api_response({'error': 'Doctor not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)


# --- Module 3: Appointment Views ---

@csrf_exempt
def get_appointments_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'GET':
        appointments = db.get_all_appointments()
        return make_api_response(appointments)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def add_appointment_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'POST':
        data = get_json_data(request)
        appointment_id = data.get('appointment_id')
        patient_name = data.get('patient_name')
        doctor_name = data.get('doctor_name')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        appointment_status = data.get('appointment_status', 'Scheduled')
        
        if not patient_name or not doctor_name or not appointment_date or not appointment_time:
            return make_api_response({'error': 'patient_name, doctor_name, appointment_date, and appointment_time are required'}, status=400)
            
        new_id = db.add_appointment(appointment_id, patient_name, doctor_name, appointment_date, appointment_time, appointment_status)
        return make_api_response({'message': 'Appointment booked successfully', 'appointment_id': new_id}, status=201)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_appointment_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'PUT':
        data = get_json_data(request)
        patient_name = data.get('patient_name')
        doctor_name = data.get('doctor_name')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        appointment_status = data.get('appointment_status')
        
        if not patient_name or not doctor_name:
            return make_api_response({'error': 'patient_name and doctor_name are required'}, status=400)
            
        success = db.update_appointment(int(id), patient_name, doctor_name, appointment_date, appointment_time, appointment_status)
        if success:
            return make_api_response({'message': 'Appointment updated successfully'})
        return make_api_response({'error': 'Appointment not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_appointment_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'DELETE':
        success = db.delete_appointment(int(id))
        if success:
            return make_api_response({'message': 'Appointment deleted successfully'})
        return make_api_response({'error': 'Appointment not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)


# --- Module 4: Medical Record Views ---

@csrf_exempt
def get_records_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'GET':
        records = db.get_all_records()
        return make_api_response(records)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def add_record_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'POST':
        data = get_json_data(request)
        record_id = data.get('record_id')
        patient_name = data.get('patient_name')
        doctor_name = data.get('doctor_name')
        diagnosis = data.get('diagnosis')
        prescription = data.get('prescription')
        treatment = data.get('treatment')
        visit_date = data.get('visit_date')
        
        if not patient_name or not doctor_name or not visit_date:
            return make_api_response({'error': 'patient_name, doctor_name, and visit_date are required'}, status=400)
            
        new_id = db.add_record(record_id, patient_name, doctor_name, diagnosis, prescription, treatment, visit_date)
        return make_api_response({'message': 'Medical record created successfully', 'record_id': new_id}, status=201)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_record_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'PUT':
        data = get_json_data(request)
        patient_name = data.get('patient_name')
        doctor_name = data.get('doctor_name')
        diagnosis = data.get('diagnosis')
        prescription = data.get('prescription')
        treatment = data.get('treatment')
        visit_date = data.get('visit_date')
        
        if not patient_name or not doctor_name:
            return make_api_response({'error': 'patient_name and doctor_name are required'}, status=400)
            
        success = db.update_record(int(id), patient_name, doctor_name, diagnosis, prescription, treatment, visit_date)
        if success:
            return make_api_response({'message': 'Medical record updated successfully'})
        return make_api_response({'error': 'Medical record not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_record_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'DELETE':
        success = db.delete_record(int(id))
        if success:
            return make_api_response({'message': 'Medical record deleted successfully'})
        return make_api_response({'error': 'Medical record not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)


# --- Module 5: Billing Views ---

@csrf_exempt
def get_bills_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'GET':
        bills = db.get_all_bills()
        return make_api_response(bills)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def add_bill_view(request):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'POST':
        data = get_json_data(request)
        bill_id = data.get('bill_id')
        patient_name = data.get('patient_name')
        consultation_fee = data.get('consultation_fee')
        medicine_charge = data.get('medicine_charge', 0.0)
        laboratory_charge = data.get('laboratory_charge', 0.0)
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status')
        
        if not patient_name or consultation_fee is None or not payment_method or not payment_status:
            return make_api_response({'error': 'patient_name, consultation_fee, payment_method, and payment_status are required'}, status=400)
            
        try:
            consultation_fee = float(consultation_fee)
            medicine_charge = float(medicine_charge)
            laboratory_charge = float(laboratory_charge)
        except ValueError:
            return make_api_response({'error': 'consultation_fee, medicine_charge, and laboratory_charge must be numbers'}, status=400)
            
        total_amount = consultation_fee + medicine_charge + laboratory_charge
        
        new_id = db.add_bill(bill_id, patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status)
        return make_api_response({'message': 'Bill generated successfully', 'bill_id': new_id, 'total_amount': total_amount}, status=201)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def update_bill_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'PUT':
        data = get_json_data(request)
        patient_name = data.get('patient_name')
        consultation_fee = data.get('consultation_fee')
        medicine_charge = data.get('medicine_charge', 0.0)
        laboratory_charge = data.get('laboratory_charge', 0.0)
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status')
        
        if not patient_name or consultation_fee is None:
            return make_api_response({'error': 'patient_name and consultation_fee are required'}, status=400)
            
        try:
            consultation_fee = float(consultation_fee)
            medicine_charge = float(medicine_charge)
            laboratory_charge = float(laboratory_charge)
        except ValueError:
            return make_api_response({'error': 'consultation_fee, medicine_charge, and laboratory_charge must be numbers'}, status=400)
            
        total_amount = consultation_fee + medicine_charge + laboratory_charge
        
        success = db.update_bill(int(id), patient_name, consultation_fee, medicine_charge, laboratory_charge, total_amount, payment_method, payment_status)
        if success:
            return make_api_response({'message': 'Bill updated successfully', 'total_amount': total_amount})
        return make_api_response({'error': 'Bill not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_bill_view(request, id):
    preflight = handle_preflight(request)
    if preflight:
        return preflight
        
    if request.method == 'DELETE':
        success = db.delete_bill(int(id))
        if success:
            return make_api_response({'message': 'Bill deleted successfully'})
        return make_api_response({'error': 'Bill not found'}, status=404)
    return make_api_response({'error': 'Method not allowed'}, status=405)

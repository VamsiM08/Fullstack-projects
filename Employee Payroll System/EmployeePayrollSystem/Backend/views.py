from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from db import query_db, execute_db

@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')  # 'admin' or 'employee'
        
        if role == 'admin':
            if username == 'admin' and password == 'admin123':
                return JsonResponse({"status": "success", "role": "admin", "user": {"full_name": "Administrator", "email": "admin@company.com"}})
            else:
                return JsonResponse({"status": "error", "message": "Invalid admin credentials"}, status=401)
        else:  # employee login
            employee = query_db("SELECT * FROM employees WHERE email = ?", (username,), one=True)
            if employee:
                # Password must be employee_id (e.g. 101)
                if str(password) == str(employee['employee_id']):
                    return JsonResponse({"status": "success", "role": "employee", "user": employee})
                else:
                    return JsonResponse({"status": "error", "message": "Incorrect password. Use your Employee ID."}, status=401)
            else:
                return JsonResponse({"status": "error", "message": "Employee email not found"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- Employee Management APIs ---

@csrf_exempt
def get_employees(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    employees = query_db("SELECT * FROM employees")
    return JsonResponse(employees, safe=False)

@csrf_exempt
def add_employee(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone', '')
        department = data.get('department', '')
        designation = data.get('designation', '')
        joining_date = data.get('joining_date', '')
        salary = float(data.get('salary', 0))
        
        if not full_name or not email:
            return JsonResponse({"error": "full_name and email are required"}, status=400)
            
        existing = query_db("SELECT * FROM employees WHERE email = ?", (email,), one=True)
        if existing:
            return JsonResponse({"error": f"Employee with email {email} already exists"}, status=400)
            
        employee_id = data.get('employee_id')
        if not employee_id:
            max_id = query_db("SELECT MAX(employee_id) as max_id FROM employees", one=True)
            employee_id = (max_id['max_id'] + 1) if (max_id and max_id['max_id']) else 101
            
        execute_db("""
        INSERT INTO employees (employee_id, full_name, email, phone, department, designation, joining_date, salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (employee_id, full_name, email, phone, department, designation, joining_date, salary))
        
        # Dynamic count adjustment
        if department:
            execute_db("UPDATE departments SET total_employees = total_employees + 1 WHERE department_name = ?", (department,))
            
        return JsonResponse({"message": "Employee added successfully", "employee_id": employee_id}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_employee(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        department = data.get('department')
        designation = data.get('designation')
        joining_date = data.get('joining_date')
        salary = data.get('salary')
        
        current = query_db("SELECT * FROM employees WHERE employee_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Employee not found"}, status=404)
            
        if email and email != current['email']:
            existing = query_db("SELECT * FROM employees WHERE email = ? AND employee_id != ?", (email, id), one=True)
            if existing:
                return JsonResponse({"error": "Email is already taken"}, status=400)
                
        fields = []
        args = []
        if full_name is not None:
            fields.append("full_name = ?")
            args.append(full_name)
        if email is not None:
            fields.append("email = ?")
            args.append(email)
        if phone is not None:
            fields.append("phone = ?")
            args.append(phone)
        if department is not None:
            fields.append("department = ?")
            args.append(department)
        if designation is not None:
            fields.append("designation = ?")
            args.append(designation)
        if joining_date is not None:
            fields.append("joining_date = ?")
            args.append(joining_date)
        if salary is not None:
            fields.append("salary = ?")
            args.append(float(salary))
            
        if not fields:
            return JsonResponse({"message": "No changes requested"})
            
        args.append(id)
        execute_db(f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?", args)
        
        # Adjust department employee counts if department updated
        if department is not None and department != current['department']:
            if current['department']:
                execute_db("UPDATE departments SET total_employees = MAX(0, total_employees - 1) WHERE department_name = ?", (current['department'],))
            if department:
                execute_db("UPDATE departments SET total_employees = total_employees + 1 WHERE department_name = ?", (department,))
                
        return JsonResponse({"message": "Employee updated successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_employee(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        current = query_db("SELECT * FROM employees WHERE employee_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Employee not found"}, status=404)
            
        execute_db("DELETE FROM employees WHERE employee_id = ?", (id,))
        if current['department']:
            execute_db("UPDATE departments SET total_employees = MAX(0, total_employees - 1) WHERE department_name = ?", (current['department'],))
            
        return JsonResponse({"message": "Employee deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- Department Management APIs ---

@csrf_exempt
def get_departments(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    departments = query_db("SELECT * FROM departments")
    return JsonResponse(departments, safe=False)

@csrf_exempt
def add_department(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        department_name = data.get('department_name')
        manager_name = data.get('manager_name', '')
        location = data.get('location', '')
        
        if not department_name:
            return JsonResponse({"error": "department_name is required"}, status=400)
            
        existing = query_db("SELECT * FROM departments WHERE department_name = ?", (department_name,), one=True)
        if existing:
            return JsonResponse({"error": "Department name already exists"}, status=400)
            
        department_id = data.get('department_id')
        if not department_id:
            max_id = query_db("SELECT MAX(department_id) as max_id FROM departments", one=True)
            department_id = (max_id['max_id'] + 1) if (max_id and max_id['max_id']) else 201
            
        total_employees = query_db("SELECT COUNT(*) as count FROM employees WHERE department = ?", (department_name,), one=True)['count']
        
        execute_db("""
        INSERT INTO departments (department_id, department_name, manager_name, total_employees, location)
        VALUES (?, ?, ?, ?, ?)
        """, (department_id, department_name, manager_name, total_employees, location))
        
        return JsonResponse({"message": "Department added successfully", "department_id": department_id}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_department(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        department_name = data.get('department_name')
        manager_name = data.get('manager_name')
        location = data.get('location')
        
        current = query_db("SELECT * FROM departments WHERE department_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Department not found"}, status=404)
            
        if department_name and department_name != current['department_name']:
            existing = query_db("SELECT * FROM departments WHERE department_name = ? AND department_id != ?", (department_name, id), one=True)
            if existing:
                return JsonResponse({"error": "Department name already exists"}, status=400)
                
        fields = []
        args = []
        if department_name is not None:
            fields.append("department_name = ?")
            args.append(department_name)
        if manager_name is not None:
            fields.append("manager_name = ?")
            args.append(manager_name)
        if location is not None:
            fields.append("location = ?")
            args.append(location)
            
        if not fields:
            return JsonResponse({"message": "No changes requested"})
            
        args.append(id)
        execute_db(f"UPDATE departments SET {', '.join(fields)} WHERE department_id = ?", args)
        
        # Keep employees synced if department name changed
        if department_name and department_name != current['department_name']:
            execute_db("UPDATE employees SET department = ? WHERE department = ?", (department_name, current['department_name']))
            
        return JsonResponse({"message": "Department updated successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_department(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        current = query_db("SELECT * FROM departments WHERE department_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Department not found"}, status=404)
            
        execute_db("DELETE FROM departments WHERE department_id = ?", (id,))
        execute_db("UPDATE employees SET department = '' WHERE department = ?", (current['department_name'],))
        
        return JsonResponse({"message": "Department deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- Attendance Management APIs ---

@csrf_exempt
def get_attendance(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    attendance = query_db("SELECT * FROM attendance")
    return JsonResponse(attendance, safe=False)

@csrf_exempt
def add_attendance(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        attendance_date = data.get('attendance_date')
        check_in = data.get('check_in', '')
        check_out = data.get('check_out', '')
        status = data.get('status')
        
        if not employee_name or not attendance_date or not status:
            return JsonResponse({"error": "employee_name, attendance_date, and status are required"}, status=400)
            
        attendance_id = data.get('attendance_id')
        if not attendance_id:
            max_id = query_db("SELECT MAX(attendance_id) as max_id FROM attendance", one=True)
            attendance_id = (max_id['max_id'] + 1) if (max_id and max_id['max_id']) else 301
            
        execute_db("""
        INSERT INTO attendance (attendance_id, employee_name, attendance_date, check_in, check_out, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (attendance_id, employee_name, attendance_date, check_in, check_out, status))
        
        return JsonResponse({"message": "Attendance recorded successfully", "attendance_id": attendance_id}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_attendance(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        attendance_date = data.get('attendance_date')
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        status = data.get('status')
        
        current = query_db("SELECT * FROM attendance WHERE attendance_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Attendance record not found"}, status=404)
            
        fields = []
        args = []
        if employee_name is not None:
            fields.append("employee_name = ?")
            args.append(employee_name)
        if attendance_date is not None:
            fields.append("attendance_date = ?")
            args.append(attendance_date)
        if check_in is not None:
            fields.append("check_in = ?")
            args.append(check_in)
        if check_out is not None:
            fields.append("check_out = ?")
            args.append(check_out)
        if status is not None:
            fields.append("status = ?")
            args.append(status)
            
        if not fields:
            return JsonResponse({"message": "No changes requested"})
            
        args.append(id)
        execute_db(f"UPDATE attendance SET {', '.join(fields)} WHERE attendance_id = ?", args)
        return JsonResponse({"message": "Attendance record updated successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_attendance(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        current = query_db("SELECT * FROM attendance WHERE attendance_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Attendance record not found"}, status=404)
            
        execute_db("DELETE FROM attendance WHERE attendance_id = ?", (id,))
        return JsonResponse({"message": "Attendance record deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- Payroll Management APIs ---

@csrf_exempt
def get_payroll(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    payroll = query_db("SELECT * FROM payroll")
    return JsonResponse(payroll, safe=False)

@csrf_exempt
def add_payroll(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        basic_salary = float(data.get('basic_salary', 0))
        bonus = float(data.get('bonus', 0))
        deductions = float(data.get('deductions', 0))
        payment_month = data.get('payment_month')
        
        if not employee_name or not payment_month:
            return JsonResponse({"error": "employee_name and payment_month are required"}, status=400)
            
        net_salary = basic_salary + bonus - deductions
        
        payroll_id = data.get('payroll_id')
        if not payroll_id:
            max_id = query_db("SELECT MAX(payroll_id) as max_id FROM payroll", one=True)
            payroll_id = (max_id['max_id'] + 1) if (max_id and max_id['max_id']) else 401
            
        execute_db("""
        INSERT INTO payroll (payroll_id, employee_name, basic_salary, bonus, deductions, net_salary, payment_month)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (payroll_id, employee_name, basic_salary, bonus, deductions, net_salary, payment_month))
        
        return JsonResponse({"message": "Payroll processed successfully", "payroll_id": payroll_id}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_payroll(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        basic_salary = data.get('basic_salary')
        bonus = data.get('bonus')
        deductions = data.get('deductions')
        payment_month = data.get('payment_month')
        
        current = query_db("SELECT * FROM payroll WHERE payroll_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Payroll record not found"}, status=404)
            
        c_basic = float(basic_salary if basic_salary is not None else current['basic_salary'])
        c_bonus = float(bonus if bonus is not None else current['bonus'])
        c_deductions = float(deductions if deductions is not None else current['deductions'])
        net_salary = c_basic + c_bonus - c_deductions
        
        fields = ["net_salary = ?"]
        args = [net_salary]
        
        if employee_name is not None:
            fields.append("employee_name = ?")
            args.append(employee_name)
        if basic_salary is not None:
            fields.append("basic_salary = ?")
            args.append(float(basic_salary))
        if bonus is not None:
            fields.append("bonus = ?")
            args.append(float(bonus))
        if deductions is not None:
            fields.append("deductions = ?")
            args.append(float(deductions))
        if payment_month is not None:
            fields.append("payment_month = ?")
            args.append(payment_month)
            
        args.append(id)
        execute_db(f"UPDATE payroll SET {', '.join(fields)} WHERE payroll_id = ?", args)
        return JsonResponse({"message": "Payroll record updated successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_payroll(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        current = query_db("SELECT * FROM payroll WHERE payroll_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Payroll record not found"}, status=404)
            
        execute_db("DELETE FROM payroll WHERE payroll_id = ?", (id,))
        return JsonResponse({"message": "Payroll record deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- Salary Slip (Payslip) Management APIs ---

@csrf_exempt
def get_payslips(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    payslips = query_db("SELECT * FROM payslips")
    return JsonResponse(payslips, safe=False)

@csrf_exempt
def add_payslip(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        payment_date = data.get('payment_date')
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status')
        remarks = data.get('remarks', '')
        
        if not employee_name or not payment_date or not payment_method or not payment_status:
            return JsonResponse({"error": "employee_name, payment_date, payment_method, and payment_status are required"}, status=400)
            
        payslip_id = data.get('payslip_id')
        if not payslip_id:
            max_id = query_db("SELECT MAX(payslip_id) as max_id FROM payslips", one=True)
            payslip_id = (max_id['max_id'] + 1) if (max_id and max_id['max_id']) else 501
            
        execute_db("""
        INSERT INTO payslips (payslip_id, employee_name, payment_date, payment_method, payment_status, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (payslip_id, employee_name, payment_date, payment_method, payment_status, remarks))
        
        return JsonResponse({"message": "Salary slip generated successfully", "payslip_id": payslip_id}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_payslip(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        payment_date = data.get('payment_date')
        payment_method = data.get('payment_method')
        payment_status = data.get('payment_status')
        remarks = data.get('remarks')
        
        current = query_db("SELECT * FROM payslips WHERE payslip_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Payslip record not found"}, status=404)
            
        fields = []
        args = []
        if employee_name is not None:
            fields.append("employee_name = ?")
            args.append(employee_name)
        if payment_date is not None:
            fields.append("payment_date = ?")
            args.append(payment_date)
        if payment_method is not None:
            fields.append("payment_method = ?")
            args.append(payment_method)
        if payment_status is not None:
            fields.append("payment_status = ?")
            args.append(payment_status)
        if remarks is not None:
            fields.append("remarks = ?")
            args.append(remarks)
            
        if not fields:
            return JsonResponse({"message": "No changes requested"})
            
        args.append(id)
        execute_db(f"UPDATE payslips SET {', '.join(fields)} WHERE payslip_id = ?", args)
        return JsonResponse({"message": "Payslip record updated successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_payslip(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        current = query_db("SELECT * FROM payslips WHERE payslip_id = ?", (id,), one=True)
        if not current:
            return JsonResponse({"error": "Payslip record not found"}, status=404)
            
        execute_db("DELETE FROM payslips WHERE payslip_id = ?", (id,))
        return JsonResponse({"message": "Payslip record deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

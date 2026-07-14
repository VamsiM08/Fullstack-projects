from django.db import models
from rest_framework import status, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db import Student, Instructor, Course, Enrollment, Assignment

# ==========================================
# Serializers
# ==========================================

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'

# Helper to automatically generate primary key if not provided
def get_next_id(model, field_name, start_id):
    try:
        max_dict = model.objects.all().aggregate(models.Max(field_name))
        max_val = max_dict[f'{field_name}__max']
        if max_val is not None:
            return max_val + 1
        return start_id
    except Exception:
        return start_id

# ==========================================
# Authentication View
# ==========================================

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role')  # 'student' or 'admin'

    if role == 'admin':
        if email == 'admin@lms.com' and password == 'admin123':
            return Response({
                'status': 'success',
                'role': 'admin',
                'user': {
                    'full_name': 'Administrator',
                    'email': 'admin@lms.com'
                }
            })
        return Response({'error': 'Invalid Admin credentials'}, status=status.HTTP_400_BAD_REQUEST)

    # Student login
    try:
        student = Student.objects.get(email=email, password=password)
        return Response({
            'status': 'success',
            'role': 'student',
            'user': {
                'student_id': student.student_id,
                'full_name': student.full_name,
                'email': student.email
            }
        })
    except Student.DoesNotExist:
        return Response({'error': 'Invalid Student credentials'}, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
# Student Views (Module 1)
# ==========================================

@api_view(['POST'])
def student_add(request):
    data = request.data.copy()
    if 'student_id' not in data or not data['student_id']:
        data['student_id'] = get_next_id(Student, 'student_id', 101)
    serializer = StudentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def student_list(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def student_update(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = StudentSerializer(student, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def student_delete(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    student.delete()
    return Response({'message': 'Student deleted successfully'}, status=status.HTTP_200_OK)

# ==========================================
# Instructor Views (Module 2)
# ==========================================

@api_view(['POST'])
def instructor_add(request):
    data = request.data.copy()
    if 'instructor_id' not in data or not data['instructor_id']:
        data['instructor_id'] = get_next_id(Instructor, 'instructor_id', 201)
    serializer = InstructorSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def instructor_list(request):
    instructors = Instructor.objects.all()
    serializer = InstructorSerializer(instructors, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def instructor_update(request, pk):
    try:
        instructor = Instructor.objects.get(pk=pk)
    except Instructor.DoesNotExist:
        return Response({'error': 'Instructor not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = InstructorSerializer(instructor, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def instructor_delete(request, pk):
    try:
        instructor = Instructor.objects.get(pk=pk)
    except Instructor.DoesNotExist:
        return Response({'error': 'Instructor not found'}, status=status.HTTP_404_NOT_FOUND)
    instructor.delete()
    return Response({'message': 'Instructor deleted successfully'}, status=status.HTTP_200_OK)

# ==========================================
# Course Views (Module 3)
# ==========================================

@api_view(['POST'])
def course_add(request):
    data = request.data.copy()
    if 'course_id' not in data or not data['course_id']:
        data['course_id'] = get_next_id(Course, 'course_id', 301)
    serializer = CourseSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def course_list(request):
    courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def course_update(request, pk):
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = CourseSerializer(course, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def course_delete(request, pk):
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    course.delete()
    return Response({'message': 'Course deleted successfully'}, status=status.HTTP_200_OK)

# ==========================================
# Enrollment Views (Module 4)
# ==========================================

@api_view(['POST'])
def enrollment_add(request):
    data = request.data.copy()
    if 'enrollment_id' not in data or not data['enrollment_id']:
        data['enrollment_id'] = get_next_id(Enrollment, 'enrollment_id', 401)
    serializer = EnrollmentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def enrollment_list(request):
    # Support filtering by student_name via query param
    student_name = request.query_params.get('student_name', None)
    if student_name:
        enrollments = Enrollment.objects.filter(student_name=student_name)
    else:
        enrollments = Enrollment.objects.all()
    serializer = EnrollmentSerializer(enrollments, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def enrollment_update(request, pk):
    try:
        enrollment = Enrollment.objects.get(pk=pk)
    except Enrollment.DoesNotExist:
        return Response({'error': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = EnrollmentSerializer(enrollment, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def enrollment_delete(request, pk):
    try:
        enrollment = Enrollment.objects.get(pk=pk)
    except Enrollment.DoesNotExist:
        return Response({'error': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)
    enrollment.delete()
    return Response({'message': 'Enrollment deleted successfully'}, status=status.HTTP_200_OK)

# ==========================================
# Assignment Views (Module 5)
# ==========================================

@api_view(['POST'])
def assignment_add(request):
    data = request.data.copy()
    if 'assignment_id' not in data or not data['assignment_id']:
        data['assignment_id'] = get_next_id(Assignment, 'assignment_id', 501)
    serializer = AssignmentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def assignment_list(request):
    student_name = request.query_params.get('student_name', None)
    if student_name:
        assignments = Assignment.objects.filter(student_name=student_name)
    else:
        assignments = Assignment.objects.all()
    serializer = AssignmentSerializer(assignments, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def assignment_update(request, pk):
    try:
        assignment = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = AssignmentSerializer(assignment, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def assignment_delete(request, pk):
    try:
        assignment = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
    assignment.delete()
    return Response({'message': 'Assignment deleted successfully'}, status=status.HTTP_200_OK)

# ==========================================
# Database Seeding helper (Runs on import if DB tables exist)
# ==========================================
def seed_data():
    try:
        # Check if tables exist and are empty, then insert sample data
        if Student.objects.count() == 0:
            Student.objects.create(
                student_id=101,
                full_name="Rahul Sharma",
                email="rahul@gmail.com",
                phone="9876543210",
                qualification="B.Tech",
                password="rahul123"
            )
        if Instructor.objects.count() == 0:
            Instructor.objects.create(
                instructor_id=201,
                instructor_name="Saran Velmurugan",
                specialization="Full Stack Development",
                experience=5,
                email="trainer@gmail.com",
                phone="9876543211"
            )
        if Course.objects.count() == 0:
            Course.objects.create(
                course_id=301,
                course_name="Python Full Stack",
                instructor_name="Saran Velmurugan",
                category="Programming",
                duration="6 Months",
                price=25000.00,
                level="Beginner"
            )
            # Add secondary course for filtering / demo
            Course.objects.create(
                course_id=302,
                course_name="Advanced Java Mastery",
                instructor_name="Saran Velmurugan",
                category="Programming",
                duration="3 Months",
                price=18000.00,
                level="Advanced"
            )
        if Enrollment.objects.count() == 0:
            Enrollment.objects.create(
                enrollment_id=401,
                student_name="Rahul Sharma",
                course_name="Python Full Stack",
                enrollment_date="2026-07-15",
                payment_status="Paid",
                course_status="Active"
            )
        if Assignment.objects.count() == 0:
            Assignment.objects.create(
                assignment_id=501,
                course_name="Python Full Stack",
                student_name="Rahul Sharma",
                assignment_title="Student Management System",
                submission_date="2026-07-25",
                marks=95,
                status="Evaluated"
            )
    except Exception:
        # Fail silently if migrations haven't run yet
        pass

# Trigger seed checking
seed_data()

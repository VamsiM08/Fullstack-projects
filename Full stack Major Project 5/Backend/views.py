import json
import datetime
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from Backend.db import Freelancer, Client, Project, Bid, Contract

def get_next_id(model, field, start=100):
    try:
        max_obj = model.objects.order_by(f'-{field}').first()
        if max_obj:
            return getattr(max_obj, field) + 1
    except Exception:
        pass
    return start

def api_endpoint(allowed_methods):
    def decorator(view_func):
        @csrf_exempt
        def wrapped_view(request, *args, **kwargs):
            if request.method == 'OPTIONS':
                response = HttpResponse()
                response["Access-Control-Allow-Origin"] = "*"
                response["Access-Control-Allow-Methods"] = ", ".join(allowed_methods)
                response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                return response

            if request.method not in allowed_methods:
                response = JsonResponse({'error': f'Method {request.method} not allowed'}, status=405)
                response["Access-Control-Allow-Origin"] = "*"
                return response

            if request.method in ['POST', 'PUT']:
                try:
                    if request.body:
                        request.JSON = json.loads(request.body)
                    else:
                        request.JSON = {}
                except json.JSONDecodeError:
                    response = JsonResponse({'error': 'Invalid JSON body'}, status=400)
                    response["Access-Control-Allow-Origin"] = "*"
                    return response
            else:
                request.JSON = {}

            try:
                result = view_func(request, *args, **kwargs)
                if isinstance(result, tuple):
                    data, status_code = result
                else:
                    data = result
                    status_code = 200
                
                if isinstance(data, HttpResponse):
                    response = data
                else:
                    response = JsonResponse(data, safe=False)
                    response.status_code = status_code
            except Exception as e:
                response = JsonResponse({'error': str(e)}, status=500)

            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = ", ".join(allowed_methods)
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return response
        return wrapped_view
    return decorator

# Serializers
def serialize_freelancer(f):
    return {
        'freelancer_id': f.freelancer_id,
        'full_name': f.full_name,
        'email': f.email,
        'phone': f.phone,
        'skills': f.skills,
        'experience': f.experience,
        'hourly_rate': float(f.hourly_rate),
    }

def serialize_client(c):
    return {
        'client_id': c.client_id,
        'company_name': c.company_name,
        'contact_person': c.contact_person,
        'email': c.email,
        'phone': c.phone,
        'location': c.location,
    }

def serialize_project(p):
    return {
        'project_id': p.project_id,
        'project_title': p.project_title,
        'description': p.description,
        'category': p.category,
        'budget': float(p.budget),
        'deadline': p.deadline.isoformat() if isinstance(p.deadline, (datetime.date, datetime.datetime)) else p.deadline,
        'client_name': p.client_name,
    }

def serialize_bid(b):
    return {
        'bid_id': b.bid_id,
        'project_title': b.project_title,
        'freelancer_name': b.freelancer_name,
        'bid_amount': float(b.bid_amount),
        'proposal': b.proposal,
        'status': b.status,
    }

def serialize_contract(c):
    return {
        'contract_id': c.contract_id,
        'project_title': c.project_title,
        'freelancer_name': c.freelancer_name,
        'client_name': c.client_name,
        'agreed_budget': float(c.agreed_budget),
        'start_date': c.start_date.isoformat() if isinstance(c.start_date, (datetime.date, datetime.datetime)) else c.start_date,
        'end_date': c.end_date.isoformat() if isinstance(c.end_date, (datetime.date, datetime.datetime)) else c.end_date,
        'contract_status': c.contract_status,
    }

# ----------------- Freelancers APIs -----------------
@api_endpoint(['POST'])
def add_freelancer(request):
    data = request.JSON
    fid = data.get('freelancer_id')
    if not fid:
        fid = get_next_id(Freelancer, 'freelancer_id', 101)
    
    # check email uniqueness
    if Freelancer.objects.filter(email=data.get('email')).exists():
        return {'error': 'Freelancer with this email already exists'}, 400

    freelancer = Freelancer.objects.create(
        freelancer_id=int(fid),
        full_name=data.get('full_name'),
        email=data.get('email'),
        phone=data.get('phone', ''),
        skills=data.get('skills', ''),
        experience=int(data.get('experience', 0)),
        hourly_rate=data.get('hourly_rate', 0)
    )
    return serialize_freelancer(freelancer), 201

@api_endpoint(['GET'])
def get_freelancers(request):
    freelancers = Freelancer.objects.all()
    return [serialize_freelancer(f) for f in freelancers], 200

@api_endpoint(['PUT'])
def update_freelancer(request, id):
    try:
        f = Freelancer.objects.get(freelancer_id=id)
    except Freelancer.DoesNotExist:
        return {'error': 'Freelancer not found'}, 404
    
    data = request.JSON
    if 'full_name' in data: f.full_name = data['full_name']
    if 'email' in data: f.email = data['email']
    if 'phone' in data: f.phone = data['phone']
    if 'skills' in data: f.skills = data['skills']
    if 'experience' in data: f.experience = int(data['experience'])
    if 'hourly_rate' in data: f.hourly_rate = data['hourly_rate']
    f.save()
    return serialize_freelancer(f), 200

@api_endpoint(['DELETE'])
def delete_freelancer(request, id):
    try:
        f = Freelancer.objects.get(freelancer_id=id)
        f.delete()
        return {'message': 'Freelancer deleted successfully'}, 200
    except Freelancer.DoesNotExist:
        return {'error': 'Freelancer not found'}, 404


# ----------------- Clients APIs -----------------
@api_endpoint(['POST'])
def add_client(request):
    data = request.JSON
    cid = data.get('client_id')
    if not cid:
        cid = get_next_id(Client, 'client_id', 201)
    
    if Client.objects.filter(email=data.get('email')).exists():
        return {'error': 'Client with this email already exists'}, 400

    client = Client.objects.create(
        client_id=int(cid),
        company_name=data.get('company_name'),
        contact_person=data.get('contact_person'),
        email=data.get('email'),
        phone=data.get('phone', ''),
        location=data.get('location', '')
    )
    return serialize_client(client), 201

@api_endpoint(['GET'])
def get_clients(request):
    clients = Client.objects.all()
    return [serialize_client(c) for c in clients], 200

@api_endpoint(['PUT'])
def update_client(request, id):
    try:
        c = Client.objects.get(client_id=id)
    except Client.DoesNotExist:
        return {'error': 'Client not found'}, 404
    
    data = request.JSON
    if 'company_name' in data: c.company_name = data['company_name']
    if 'contact_person' in data: c.contact_person = data['contact_person']
    if 'email' in data: c.email = data['email']
    if 'phone' in data: c.phone = data['phone']
    if 'location' in data: c.location = data['location']
    c.save()
    return serialize_client(c), 200

@api_endpoint(['DELETE'])
def delete_client(request, id):
    try:
        c = Client.objects.get(client_id=id)
        c.delete()
        return {'message': 'Client deleted successfully'}, 200
    except Client.DoesNotExist:
        return {'error': 'Client not found'}, 404


# ----------------- Projects APIs -----------------
@api_endpoint(['POST'])
def add_project(request):
    data = request.JSON
    pid = data.get('project_id')
    if not pid:
        pid = get_next_id(Project, 'project_id', 301)
    
    project = Project.objects.create(
        project_id=int(pid),
        project_title=data.get('project_title'),
        description=data.get('description'),
        category=data.get('category'),
        budget=data.get('budget'),
        deadline=data.get('deadline'),
        client_name=data.get('client_name')
    )
    return serialize_project(project), 201

@api_endpoint(['GET'])
def get_projects(request):
    projects = Project.objects.all()
    search = request.GET.get('search')
    category = request.GET.get('category')
    if search:
        projects = projects.filter(project_title__icontains=search) | projects.filter(description__icontains=search)
    if category:
        projects = projects.filter(category__iexact=category)
    return [serialize_project(p) for p in projects], 200

@api_endpoint(['PUT'])
def update_project(request, id):
    try:
        p = Project.objects.get(project_id=id)
    except Project.DoesNotExist:
        return {'error': 'Project not found'}, 404
    
    data = request.JSON
    if 'project_title' in data: p.project_title = data['project_title']
    if 'description' in data: p.description = data['description']
    if 'category' in data: p.category = data['category']
    if 'budget' in data: p.budget = data['budget']
    if 'deadline' in data: p.deadline = data['deadline']
    if 'client_name' in data: p.client_name = data['client_name']
    p.save()
    return serialize_project(p), 200

@api_endpoint(['DELETE'])
def delete_project(request, id):
    try:
        p = Project.objects.get(project_id=id)
        p.delete()
        return {'message': 'Project deleted successfully'}, 200
    except Project.DoesNotExist:
        return {'error': 'Project not found'}, 404


# ----------------- Bids APIs -----------------
@api_endpoint(['POST'])
def add_bid(request):
    data = request.JSON
    bid = data.get('bid_id')
    if not bid:
        bid = get_next_id(Bid, 'bid_id', 401)
    
    b = Bid.objects.create(
        bid_id=int(bid),
        project_title=data.get('project_title'),
        freelancer_name=data.get('freelancer_name'),
        bid_amount=data.get('bid_amount'),
        proposal=data.get('proposal'),
        status=data.get('status', 'Pending')
    )
    return serialize_bid(b), 201

@api_endpoint(['GET'])
def get_bids(request):
    bids = Bid.objects.all()
    return [serialize_bid(b) for b in bids], 200

@api_endpoint(['PUT'])
def update_bid(request, id):
    try:
        b = Bid.objects.get(bid_id=id)
    except Bid.DoesNotExist:
        return {'error': 'Bid not found'}, 404
    
    data = request.JSON
    old_status = b.status
    if 'project_title' in data: b.project_title = data['project_title']
    if 'freelancer_name' in data: b.freelancer_name = data['freelancer_name']
    if 'bid_amount' in data: b.bid_amount = data['bid_amount']
    if 'proposal' in data: b.proposal = data['proposal']
    if 'status' in data: b.status = data['status']
    b.save()

    # Create project contract automatically if accepted
    if b.status == 'Accepted' and old_status != 'Accepted':
        client_name = "Unknown Client"
        proj = Project.objects.filter(project_title=b.project_title).first()
        if proj:
            client_name = proj.client_name
            deadline = proj.deadline
        else:
            deadline = datetime.date.today() + datetime.timedelta(days=30)
        
        # Check if contract already exists
        exists = Contract.objects.filter(project_title=b.project_title, freelancer_name=b.freelancer_name, client_name=client_name).exists()
        if not exists:
            cid = get_next_id(Contract, 'contract_id', 501)
            Contract.objects.create(
                contract_id=cid,
                project_title=b.project_title,
                freelancer_name=b.freelancer_name,
                client_name=client_name,
                agreed_budget=b.bid_amount,
                start_date=datetime.date.today(),
                end_date=deadline,
                contract_status='Active'
            )

    return serialize_bid(b), 200

@api_endpoint(['DELETE'])
def delete_bid(request, id):
    try:
        b = Bid.objects.get(bid_id=id)
        b.delete()
        return {'message': 'Bid deleted successfully'}, 200
    except Bid.DoesNotExist:
        return {'error': 'Bid not found'}, 404


# ----------------- Contracts APIs -----------------
@api_endpoint(['POST'])
def add_contract(request):
    data = request.JSON
    cid = data.get('contract_id')
    if not cid:
        cid = get_next_id(Contract, 'contract_id', 501)
    
    # parse dates from string if necessary
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    
    c = Contract.objects.create(
        contract_id=int(cid),
        project_title=data.get('project_title'),
        freelancer_name=data.get('freelancer_name'),
        client_name=data.get('client_name'),
        agreed_budget=data.get('agreed_budget'),
        start_date=start_date,
        end_date=end_date,
        contract_status=data.get('contract_status', 'Active')
    )
    return serialize_contract(c), 201

@api_endpoint(['GET'])
def get_contracts(request):
    contracts = Contract.objects.all()
    return [serialize_contract(c) for c in contracts], 200

@api_endpoint(['PUT'])
def update_contract(request, id):
    try:
        c = Contract.objects.get(contract_id=id)
    except Contract.DoesNotExist:
        return {'error': 'Contract not found'}, 404
    
    data = request.JSON
    if 'project_title' in data: c.project_title = data['project_title']
    if 'freelancer_name' in data: c.freelancer_name = data['freelancer_name']
    if 'client_name' in data: c.client_name = data['client_name']
    if 'agreed_budget' in data: c.agreed_budget = data['agreed_budget']
    if 'start_date' in data: c.start_date = data['start_date']
    if 'end_date' in data: c.end_date = data['end_date']
    if 'contract_status' in data: c.contract_status = data['contract_status']
    c.save()
    return serialize_contract(c), 200

@api_endpoint(['DELETE'])
def delete_contract(request, id):
    try:
        c = Contract.objects.get(contract_id=id)
        c.delete()
        return {'message': 'Contract deleted successfully'}, 200
    except Contract.DoesNotExist:
        return {'error': 'Contract not found'}, 404

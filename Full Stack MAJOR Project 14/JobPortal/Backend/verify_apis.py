import urllib.request
import urllib.parse
import json
import time
import subprocess
import sys
import os

API_BASE = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        res_data = e.read().decode("utf-8")
        try:
            return e.code, json.loads(res_data)
        except Exception:
            return e.code, res_data
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("=== Starting API Integration Testing ===")
    
    # 1. CANDIDATES CRUD
    print("\n--- Testing Candidates Module ---")
    status, res = make_request("/candidates/")
    print(f"GET /candidates/: Status {status}, Count: {len(res) if isinstance(res, list) else 'Error'}")
    
    candidate_test = {
        "candidate_id": 102,
        "full_name": "Test Candidate",
        "email": "test_cand@gmail.com",
        "phone": "1112223333",
        "qualification": "M.Tech",
        "skills": "Go, Docker",
        "experience": 4,
        "password": "testpassword"
    }
    status, res = make_request("/candidates/add/", "POST", candidate_test)
    print(f"POST /candidates/add/: Status {status}, Res: {res}")
    
    candidate_test["full_name"] = "Updated Test Candidate"
    status, res = make_request("/candidates/update/102/", "PUT", candidate_test)
    print(f"PUT /candidates/update/102/: Status {status}, Res: {res}")
    
    status, res = make_request("/candidates/delete/102/", "DELETE")
    print(f"DELETE /candidates/delete/102/: Status {status}, Res: {res}")

    # 2. EMPLOYERS CRUD
    print("\n--- Testing Employers Module ---")
    status, res = make_request("/employers/")
    print(f"GET /employers/: Status {status}, Count: {len(res) if isinstance(res, list) else 'Error'}")
    
    employer_test = {
        "employer_id": 202,
        "company_name": "Test Company Ltd",
        "hr_name": "HR Manager",
        "email": "hr@testco.com",
        "phone": "5556667777",
        "location": "Mumbai",
        "industry": "Finance"
    }
    status, res = make_request("/employers/add/", "POST", employer_test)
    print(f"POST /employers/add/: Status {status}, Res: {res}")
    
    employer_test["location"] = "Pune"
    status, res = make_request("/employers/update/202/", "PUT", employer_test)
    print(f"PUT /employers/update/202/: Status {status}, Res: {res}")
    
    status, res = make_request("/employers/delete/202/", "DELETE")
    print(f"DELETE /employers/delete/202/: Status {status}, Res: {res}")

    # 3. JOBS CRUD
    print("\n--- Testing Jobs Module ---")
    status, res = make_request("/jobs/")
    print(f"GET /jobs/: Status {status}, Count: {len(res) if isinstance(res, list) else 'Error'}")
    
    job_test = {
        "job_id": 302,
        "job_title": "Python Junior Developer",
        "company_name": "Infosys",
        "location": "Bangalore",
        "job_type": "Full Time",
        "experience_required": 1,
        "salary": 450000.0,
        "last_date": "2026-09-01"
    }
    status, res = make_request("/jobs/add/", "POST", job_test)
    print(f"POST /jobs/add/: Status {status}, Res: {res}")
    
    job_test["job_title"] = "Python Junior Developer (Intern)"
    job_test["job_type"] = "Internship"
    status, res = make_request("/jobs/update/302/", "PUT", job_test)
    print(f"PUT /jobs/update/302/: Status {status}, Res: {res}")
    
    status, res = make_request("/jobs/delete/302/", "DELETE")
    print(f"DELETE /jobs/delete/302/: Status {status}, Res: {res}")

    # 4. APPLICATIONS CRUD
    print("\n--- Testing Job Applications Module ---")
    status, res = make_request("/applications/")
    print(f"GET /applications/: Status {status}, Count: {len(res) if isinstance(res, list) else 'Error'}")
    
    app_test = {
        "application_id": 402,
        "candidate_name": "Rahul Sharma",
        "company_name": "Infosys",
        "job_title": "Python Full Stack Developer",
        "applied_date": "2026-07-16",
        "resume": "rahul_res_v2.pdf",
        "application_status": "Applied"
    }
    status, res = make_request("/applications/add/", "POST", app_test)
    print(f"POST /applications/add/: Status {status}, Res: {res}")
    
    app_test["application_status"] = "Shortlisted"
    status, res = make_request("/applications/update/402/", "PUT", app_test)
    print(f"PUT /applications/update/402/: Status {status}, Res: {res}")
    
    status, res = make_request("/applications/delete/402/", "DELETE")
    print(f"DELETE /applications/delete/402/: Status {status}, Res: {res}")

    # 5. INTERVIEWS CRUD
    print("\n--- Testing Interviews Module ---")
    status, res = make_request("/interviews/")
    print(f"GET /interviews/: Status {status}, Count: {len(res) if isinstance(res, list) else 'Error'}")
    
    int_test = {
        "interview_id": 502,
        "candidate_name": "Rahul Sharma",
        "company_name": "Infosys",
        "interview_date": "2026-07-28",
        "interview_time": "14:00",
        "interview_mode": "Online",
        "interview_status": "Scheduled"
    }
    status, res = make_request("/interviews/add/", "POST", int_test)
    print(f"POST /interviews/add/: Status {status}, Res: {res}")
    
    int_test["interview_status"] = "Completed"
    status, res = make_request("/interviews/update/502/", "PUT", int_test)
    print(f"PUT /interviews/update/502/: Status {status}, Res: {res}")
    
    status, res = make_request("/interviews/delete/502/", "DELETE")
    print(f"DELETE /interviews/delete/502/: Status {status}, Res: {res}")

    print("\n=== API Integration Testing Completed ===")

if __name__ == "__main__":
    run_tests()

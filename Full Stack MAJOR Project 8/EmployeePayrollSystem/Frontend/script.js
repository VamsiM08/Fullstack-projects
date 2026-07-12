const API_BASE = "http://127.0.0.1:8000";

// --- Toast Notifications ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '⚡';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✗';
    if (type === 'warning') icon = '⚠';
    
    toast.innerHTML = `
        <span style="font-weight: bold; font-size: 1.2rem; margin-right: 0.5rem;">${icon}</span>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Session & Navigation Management ---
function getSession() {
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    if (userStr && role) {
        return { user: JSON.parse(userStr), role };
    }
    return null;
}

function checkSession(allowedRoles = ['admin', 'employee']) {
    const session = getSession();
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    
    if (!session) {
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
        return null;
    }
    
    if (isLoginPage) {
        window.location.href = session.role === 'admin' ? 'dashboard.html' : 'employees.html';
        return session;
    }
    
    if (!allowedRoles.includes(session.role)) {
        showToast("Access Denied: Insufficient Permissions", "error");
        setTimeout(() => {
            window.location.href = session.role === 'admin' ? 'dashboard.html' : 'employees.html';
        }, 1500);
        return null;
    }
    
    return session;
}

function initNavigation() {
    const session = getSession();
    if (!session) return;
    
    // Injects User profile details in sidebar footer
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    
    if (userNameEl) userNameEl.textContent = session.user.full_name;
    if (userRoleEl) userRoleEl.textContent = session.role === 'admin' ? 'HR / Administrator' : session.user.designation || 'Employee';
    if (avatarEl) {
        const initials = session.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
    
    // Role-based link restriction
    if (session.role === 'employee') {
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => link.style.display = 'none');
    }
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            showToast("Logged out successfully");
            setTimeout(() => window.location.href = 'index.html', 1000);
        });
    }
    
    // Theme logic
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeBtn.textContent = '🌙';
        } else {
            themeBtn.textContent = '☀️';
        }
        
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeBtn.textContent = isLight ? '🌙' : '☀️';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
}

// --- Fetch Utility Helpers ---
async function apiFetch(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    options.headers = {
        ...defaultHeaders,
        ...options.headers
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `Request failed: ${response.status}`);
        }
        return data;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        showToast(err.message, "error");
        throw err;
    }
}

// --- Module 1: Employee Management ---
let employeesList = [];

async function loadEmployees() {
    const listTable = document.getElementById('employees-table-body');
    if (!listTable) return;
    
    const session = getSession();
    if (!session) return;
    
    try {
        const employees = await apiFetch('/employees/');
        employeesList = employees;
        
        listTable.innerHTML = '';
        
        // If employee role, show only details or limit CRUD operations
        if (session.role === 'employee') {
            const filtered = employees.filter(e => e.email === session.user.email);
            renderEmployeesTable(filtered, false);
            
            // Auto fill profile form
            fillProfileForm(filtered[0]);
        } else {
            renderEmployeesTable(employees, true);
        }
    } catch (err) {
        listTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger)">Failed to load employees.</td></tr>';
    }
}

function renderEmployeesTable(employees, isEditable) {
    const listTable = document.getElementById('employees-table-body');
    if (!listTable) return;
    
    if (employees.length === 0) {
        listTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted)">No employees found.</td></tr>';
        return;
    }
    
    listTable.innerHTML = employees.map(emp => `
        <tr>
            <td style="font-weight: 600;">#${emp.employee_id}</td>
            <td>
                <div style="font-weight: 500;">${emp.full_name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${emp.email}</div>
            </td>
            <td>${emp.phone || '-'}</td>
            <td><span class="badge badge-leave" style="background-color: var(--primary-light); color: var(--primary);">${emp.department || '-'}</span></td>
            <td>${emp.designation || '-'}</td>
            <td>${emp.joining_date || '-'}</td>
            <td>₹${parseFloat(emp.salary).toLocaleString('en-IN')}</td>
            <td>
                ${isEditable ? `
                    <div class="table-actions">
                        <button class="btn-icon" onclick="openEditEmployeeModal(${emp.employee_id})" title="Edit Employee">✎</button>
                        <button class="btn-icon delete" onclick="deleteEmployee(${emp.employee_id})" title="Delete Employee">🗑</button>
                    </div>
                ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">View Only</span>`}
            </td>
        </tr>
    `).join('');
}

function fillProfileForm(emp) {
    if (!emp) return;
    const form = document.getElementById('profile-update-form');
    if (!form) return;
    
    document.getElementById('profile-id').value = emp.employee_id;
    document.getElementById('profile-name').value = emp.full_name;
    document.getElementById('profile-email').value = emp.email;
    document.getElementById('profile-phone').value = emp.phone || '';
    document.getElementById('profile-dept').value = emp.department || '';
    document.getElementById('profile-desig').value = emp.designation || '';
    document.getElementById('profile-salary').value = emp.salary || '';
    document.getElementById('profile-date').value = emp.joining_date || '';
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    const id = document.getElementById('profile-id').value;
    const phone = document.getElementById('profile-phone').value;
    const email = document.getElementById('profile-email').value;
    const full_name = document.getElementById('profile-name').value;
    
    try {
        await apiFetch(`/employees/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify({ phone, email, full_name })
        });
        showToast("Profile updated successfully!");
        
        // Refresh local storage
        const session = getSession();
        session.user.phone = phone;
        session.user.email = email;
        session.user.full_name = full_name;
        localStorage.setItem('user', JSON.stringify(session.user));
        
        loadEmployees();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function addEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const payload = {
        employee_id: parseInt(formData.get('employee_id')),
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        designation: formData.get('designation'),
        joining_date: formData.get('joining_date'),
        salary: parseFloat(formData.get('salary'))
    };
    
    try {
        await apiFetch('/employees/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Employee added successfully!");
        form.reset();
        closeModal('employee-modal');
        loadEmployees();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function saveEmployeeEdits(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('edit-emp-id-key').value;
    const formData = new FormData(form);
    
    const payload = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        designation: formData.get('designation'),
        joining_date: formData.get('joining_date'),
        salary: parseFloat(formData.get('salary'))
    };
    
    try {
        await apiFetch(`/employees/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showToast("Employee details updated!");
        closeModal('edit-employee-modal');
        loadEmployees();
    } catch (err) {
        // Handled by fetch helper
    }
}

function openEditEmployeeModal(id) {
    const emp = employeesList.find(e => e.employee_id === id);
    if (!emp) return;
    
    document.getElementById('edit-emp-id-key').value = emp.employee_id;
    document.getElementById('edit-emp-id').value = emp.employee_id;
    document.getElementById('edit-emp-name').value = emp.full_name;
    document.getElementById('edit-emp-email').value = emp.email;
    document.getElementById('edit-emp-phone').value = emp.phone || '';
    document.getElementById('edit-emp-dept').value = emp.department || '';
    document.getElementById('edit-emp-desig').value = emp.designation || '';
    document.getElementById('edit-emp-joining').value = emp.joining_date || '';
    document.getElementById('edit-emp-salary').value = emp.salary || '';
    
    openModal('edit-employee-modal');
}

async function deleteEmployee(id) {
    if (!confirm(`Are you sure you want to delete employee #${id}?`)) return;
    try {
        await apiFetch(`/employees/delete/${id}/`, { method: 'DELETE' });
        showToast("Employee deleted successfully");
        loadEmployees();
    } catch (err) {
        // Handled by fetch helper
    }
}

// --- Module 2: Department Management ---
let departmentsList = [];

async function loadDepartments() {
    const listTable = document.getElementById('departments-table-body');
    if (!listTable) return;
    
    try {
        const depts = await apiFetch('/departments/');
        departmentsList = depts;
        
        listTable.innerHTML = '';
        
        if (depts.length === 0) {
            listTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No departments found.</td></tr>';
            return;
        }
        
        listTable.innerHTML = depts.map(dept => `
            <tr>
                <td style="font-weight: 600;">#${dept.department_id}</td>
                <td style="font-weight: 500;">${dept.department_name}</td>
                <td>${dept.manager_name || 'Not Assigned'}</td>
                <td><span class="badge badge-present" style="background-color: var(--primary-light); color: var(--primary); font-weight: 700;">${dept.total_employees} Employees</span></td>
                <td>${dept.location || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" onclick="openEditDeptModal(${dept.department_id})" title="Edit Department">✎</button>
                        <button class="btn-icon delete" onclick="deleteDepartment(${dept.department_id})" title="Delete Department">🗑</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        listTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger)">Failed to load departments.</td></tr>';
    }
}

async function addDepartment(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const payload = {
        department_id: parseInt(formData.get('department_id')),
        department_name: formData.get('department_name'),
        manager_name: formData.get('manager_name'),
        location: formData.get('location')
    };
    
    try {
        await apiFetch('/departments/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Department added successfully!");
        form.reset();
        closeModal('dept-modal');
        loadDepartments();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function saveDeptEdits(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('edit-dept-id-key').value;
    const formData = new FormData(form);
    
    const payload = {
        department_name: formData.get('department_name'),
        manager_name: formData.get('manager_name'),
        location: formData.get('location')
    };
    
    try {
        await apiFetch(`/departments/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showToast("Department details updated!");
        closeModal('edit-dept-modal');
        loadDepartments();
    } catch (err) {
        // Handled by fetch helper
    }
}

function openEditDeptModal(id) {
    const dept = departmentsList.find(d => d.department_id === id);
    if (!dept) return;
    
    document.getElementById('edit-dept-id-key').value = dept.department_id;
    document.getElementById('edit-dept-id').value = dept.department_id;
    document.getElementById('edit-dept-name').value = dept.department_name;
    document.getElementById('edit-dept-manager').value = dept.manager_name || '';
    document.getElementById('edit-dept-location').value = dept.location || '';
    
    openModal('edit-dept-modal');
}

async function deleteDepartment(id) {
    if (!confirm(`Are you sure you want to delete department #${id}?`)) return;
    try {
        await apiFetch(`/departments/delete/${id}/`, { method: 'DELETE' });
        showToast("Department deleted successfully");
        loadDepartments();
    } catch (err) {
        // Handled by fetch helper
    }
}

// --- Module 3: Attendance Management ---
let attendanceList = [];

async function loadAttendance() {
    const listTable = document.getElementById('attendance-table-body');
    if (!listTable) return;
    
    const session = getSession();
    if (!session) return;
    
    try {
        const records = await apiFetch('/attendance/');
        attendanceList = records;
        
        listTable.innerHTML = '';
        
        const filtered = session.role === 'employee' ? records.filter(r => r.employee_name === session.user.full_name) : records;
        
        if (filtered.length === 0) {
            listTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No attendance records found.</td></tr>';
            return;
        }
        
        listTable.innerHTML = filtered.map(rec => `
            <tr>
                <td style="font-weight: 600;">#${rec.attendance_id}</td>
                <td style="font-weight: 500;">${rec.employee_name}</td>
                <td>${rec.attendance_date}</td>
                <td>${rec.check_in || '-'}</td>
                <td>${rec.check_out || '-'}</td>
                <td><span class="badge badge-${rec.status.toLowerCase()}">${rec.status}</span></td>
                <td>
                    ${session.role === 'admin' ? `
                        <div class="table-actions">
                            <button class="btn-icon" onclick="openEditAttendanceModal(${rec.attendance_id})" title="Edit Attendance">✎</button>
                            <button class="btn-icon delete" onclick="deleteAttendance(${rec.attendance_id})" title="Delete Attendance">🗑</button>
                        </div>
                    ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">View Only</span>`}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        listTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger)">Failed to load attendance history.</td></tr>';
    }
}

async function addAttendance(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        attendance_date: formData.get('attendance_date'),
        check_in: formData.get('check_in'),
        check_out: formData.get('check_out'),
        status: formData.get('status')
    };
    
    try {
        await apiFetch('/attendance/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Attendance logged successfully!");
        form.reset();
        closeModal('attendance-modal');
        loadAttendance();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function saveAttendanceEdits(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('edit-att-id-key').value;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        attendance_date: formData.get('attendance_date'),
        check_in: formData.get('check_in'),
        check_out: formData.get('check_out'),
        status: formData.get('status')
    };
    
    try {
        await apiFetch(`/attendance/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showToast("Attendance record updated!");
        closeModal('edit-attendance-modal');
        loadAttendance();
    } catch (err) {
        // Handled by fetch helper
    }
}

function openEditAttendanceModal(id) {
    const rec = attendanceList.find(r => r.attendance_id === id);
    if (!rec) return;
    
    document.getElementById('edit-att-id-key').value = rec.attendance_id;
    document.getElementById('edit-att-name').value = rec.employee_name;
    document.getElementById('edit-att-date').value = rec.attendance_date;
    document.getElementById('edit-att-checkin').value = rec.check_in || '';
    document.getElementById('edit-att-checkout').value = rec.check_out || '';
    document.getElementById('edit-att-status').value = rec.status;
    
    openModal('edit-attendance-modal');
}

async function deleteAttendance(id) {
    if (!confirm(`Are you sure you want to delete attendance record #${id}?`)) return;
    try {
        await apiFetch(`/attendance/delete/${id}/`, { method: 'DELETE' });
        showToast("Attendance record deleted successfully");
        loadAttendance();
    } catch (err) {
        // Handled by fetch helper
    }
}

// Quick Employee Check In/Out Actions
async function quickCheckIn() {
    const session = getSession();
    if (!session) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    const payload = {
        employee_name: session.user.full_name,
        attendance_date: today,
        check_in: now,
        check_out: "",
        status: "Present"
    };
    
    try {
        await apiFetch('/attendance/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Checked In Successfully!");
        loadAttendance();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function quickCheckOut() {
    const session = getSession();
    if (!session) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    try {
        // Find today's record to update it
        const records = await apiFetch('/attendance/');
        const todayRecord = records.find(r => r.employee_name === session.user.full_name && r.attendance_date === today);
        
        if (todayRecord) {
            await apiFetch(`/attendance/update/${todayRecord.attendance_id}/`, {
                method: 'PUT',
                body: JSON.stringify({ check_out: now })
            });
            showToast("Checked Out Successfully!");
        } else {
            // No check-in found, log check-out directly
            await apiFetch('/attendance/add/', {
                method: 'POST',
                body: JSON.stringify({
                    employee_name: session.user.full_name,
                    attendance_date: today,
                    check_in: "",
                    check_out: now,
                    status: "Present"
                })
            });
            showToast("Checked Out recorded directly.");
        }
        loadAttendance();
    } catch (err) {
        // Handled by fetch helper
    }
}

// --- Module 4: Payroll Management ---
let payrollList = [];

async function loadPayroll() {
    const listTable = document.getElementById('payroll-table-body');
    if (!listTable) return;
    
    const session = getSession();
    if (!session) return;
    
    try {
        const records = await apiFetch('/payroll/');
        payrollList = records;
        
        listTable.innerHTML = '';
        
        const filtered = session.role === 'employee' ? records.filter(r => r.employee_name === session.user.full_name) : records;
        
        if (filtered.length === 0) {
            listTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted)">No payroll records found.</td></tr>';
            return;
        }
        
        listTable.innerHTML = filtered.map(pay => `
            <tr>
                <td style="font-weight: 600;">#${pay.payroll_id}</td>
                <td style="font-weight: 500;">${pay.employee_name}</td>
                <td>₹${parseFloat(pay.basic_salary).toLocaleString('en-IN')}</td>
                <td style="color: var(--success); font-weight: 500;">+ ₹${parseFloat(pay.bonus).toLocaleString('en-IN')}</td>
                <td style="color: var(--danger); font-weight: 500;">- ₹${parseFloat(pay.deductions).toLocaleString('en-IN')}</td>
                <td style="font-weight: 700; color: var(--primary);">₹${parseFloat(pay.net_salary).toLocaleString('en-IN')}</td>
                <td style="font-weight: 500;">${pay.payment_month}</td>
                <td>
                    ${session.role === 'admin' ? `
                        <div class="table-actions">
                            <button class="btn-icon" onclick="openEditPayrollModal(${pay.payroll_id})" title="Edit Record">✎</button>
                            <button class="btn-icon delete" onclick="deletePayroll(${pay.payroll_id})" title="Delete Record">🗑</button>
                        </div>
                    ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">View Only</span>`}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        listTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger)">Failed to load payroll list.</td></tr>';
    }
}

// Calculates net salary on input fields change inside modals
function initPayrollCalculation() {
    const basicInput = document.getElementById('pay-basic');
    const bonusInput = document.getElementById('pay-bonus');
    const dedInput = document.getElementById('pay-ded');
    const netInput = document.getElementById('pay-net');
    
    const calculate = () => {
        const basic = parseFloat(basicInput.value) || 0;
        const bonus = parseFloat(bonusInput.value) || 0;
        const ded = parseFloat(dedInput.value) || 0;
        netInput.value = (basic + bonus - ded).toFixed(2);
    };
    
    if (basicInput && bonusInput && dedInput && netInput) {
        basicInput.addEventListener('input', calculate);
        bonusInput.addEventListener('input', calculate);
        dedInput.addEventListener('input', calculate);
    }
    
    // Edit Modal counterparts
    const eBasicInput = document.getElementById('edit-pay-basic');
    const eBonusInput = document.getElementById('edit-pay-bonus');
    const eDedInput = document.getElementById('edit-pay-ded');
    const eNetInput = document.getElementById('edit-pay-net');
    
    const eCalculate = () => {
        const basic = parseFloat(eBasicInput.value) || 0;
        const bonus = parseFloat(eBonusInput.value) || 0;
        const ded = parseFloat(eDedInput.value) || 0;
        eNetInput.value = (basic + bonus - ded).toFixed(2);
    };
    
    if (eBasicInput && eBonusInput && eDedInput && eNetInput) {
        eBasicInput.addEventListener('input', eCalculate);
        eBonusInput.addEventListener('input', eCalculate);
        eDedInput.addEventListener('input', eCalculate);
    }
}

async function addPayroll(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        basic_salary: parseFloat(formData.get('basic_salary')),
        bonus: parseFloat(formData.get('bonus') || 0),
        deductions: parseFloat(formData.get('deductions') || 0),
        payment_month: formData.get('payment_month')
    };
    
    try {
        await apiFetch('/payroll/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Payroll processed successfully!");
        form.reset();
        closeModal('payroll-modal');
        loadPayroll();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function savePayrollEdits(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('edit-pay-id-key').value;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        basic_salary: parseFloat(formData.get('basic_salary')),
        bonus: parseFloat(formData.get('bonus')),
        deductions: parseFloat(formData.get('deductions')),
        payment_month: formData.get('payment_month')
    };
    
    try {
        await apiFetch(`/payroll/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showToast("Payroll record updated!");
        closeModal('edit-payroll-modal');
        loadPayroll();
    } catch (err) {
        // Handled by fetch helper
    }
}

function openEditPayrollModal(id) {
    const pay = payrollList.find(p => p.payroll_id === id);
    if (!pay) return;
    
    document.getElementById('edit-pay-id-key').value = pay.payroll_id;
    document.getElementById('edit-pay-name').value = pay.employee_name;
    document.getElementById('edit-pay-basic').value = pay.basic_salary;
    document.getElementById('edit-pay-bonus').value = pay.bonus;
    document.getElementById('edit-pay-ded').value = pay.deductions;
    document.getElementById('edit-pay-net').value = pay.net_salary;
    document.getElementById('edit-pay-month').value = pay.payment_month;
    
    openModal('edit-payroll-modal');
}

async function deletePayroll(id) {
    if (!confirm(`Are you sure you want to delete payroll record #${id}?`)) return;
    try {
        await apiFetch(`/payroll/delete/${id}/`, { method: 'DELETE' });
        showToast("Payroll record deleted");
        loadPayroll();
    } catch (err) {
        // Handled by fetch helper
    }
}

// Autocompletes base salary when employee dropdown selection changes
async function initEmployeeDropdowns() {
    const selectAdd = document.getElementById('pay-emp-select');
    const selectEdit = document.getElementById('edit-pay-name');
    if (!selectAdd && !selectEdit) return;
    
    try {
        const employees = await apiFetch('/employees/');
        
        if (selectAdd) {
            selectAdd.innerHTML = '<option value="">Select Employee</option>' + 
                employees.map(e => `<option value="${e.full_name}" data-salary="${e.salary}">${e.full_name} (${e.designation})</option>`).join('');
                
            selectAdd.addEventListener('change', () => {
                const selected = selectAdd.options[selectAdd.selectedIndex];
                const salary = selected.getAttribute('data-salary') || 0;
                document.getElementById('pay-basic').value = salary;
                
                // Trigger recalculate event
                document.getElementById('pay-basic').dispatchEvent(new Event('input'));
            });
        }
        
        if (selectEdit) {
            selectEdit.innerHTML = employees.map(e => `<option value="${e.full_name}" data-salary="${e.salary}">${e.full_name}</option>`).join('');
        }
        
        // Also populate for Attendance dropdown
        const attSelect = document.getElementById('att-emp-select');
        if (attSelect) {
            attSelect.innerHTML = '<option value="">Select Employee</option>' + 
                employees.map(e => `<option value="${e.full_name}">${e.full_name}</option>`).join('');
        }
        
        // Also populate for Payslips generate dropdown
        const payslipSelect = document.getElementById('payslip-emp-select');
        if (payslipSelect) {
            payslipSelect.innerHTML = '<option value="">Select Employee</option>' + 
                employees.map(e => `<option value="${e.full_name}">${e.full_name}</option>`).join('');
        }
    } catch (err) {
        // Handled by fetch helper
    }
}

// --- Module 5: Salary Slip (Payslip) Management ---
let payslipsList = [];

async function loadPayslips() {
    const listTable = document.getElementById('payslips-table-body');
    if (!listTable) return;
    
    const session = getSession();
    if (!session) return;
    
    try {
        const records = await apiFetch('/payslips/');
        payslipsList = records;
        
        listTable.innerHTML = '';
        
        const filtered = session.role === 'employee' ? records.filter(r => r.employee_name === session.user.full_name) : records;
        
        if (filtered.length === 0) {
            listTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No payslip records found.</td></tr>';
            return;
        }
        
        listTable.innerHTML = filtered.map(slip => `
            <tr>
                <td style="font-weight: 600;">#${slip.payslip_id}</td>
                <td style="font-weight: 500;">${slip.employee_name}</td>
                <td>${slip.payment_date}</td>
                <td>${slip.payment_method}</td>
                <td><span class="badge badge-${slip.payment_status.toLowerCase()}">${slip.payment_status}</span></td>
                <td>${slip.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="viewPayslip(${slip.payslip_id})">📄 View Slip</button>
                        ${session.role === 'admin' ? `
                            <button class="btn-icon" onclick="openEditPayslipModal(${slip.payslip_id})" title="Edit Status">✎</button>
                            <button class="btn-icon delete" onclick="deletePayslip(${slip.payslip_id})" title="Delete Payslip">🗑</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        listTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger)">Failed to load payslips.</td></tr>';
    }
}

async function addPayslip(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        payment_date: formData.get('payment_date'),
        payment_method: formData.get('payment_method'),
        payment_status: formData.get('payment_status'),
        remarks: formData.get('remarks')
    };
    
    try {
        await apiFetch('/payslips/add/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Salary slip logged successfully!");
        form.reset();
        closeModal('payslip-modal');
        loadPayslips();
    } catch (err) {
        // Handled by fetch helper
    }
}

async function savePayslipEdits(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById('edit-slip-id-key').value;
    const formData = new FormData(form);
    
    const payload = {
        employee_name: formData.get('employee_name'),
        payment_date: formData.get('payment_date'),
        payment_method: formData.get('payment_method'),
        payment_status: formData.get('payment_status'),
        remarks: formData.get('remarks')
    };
    
    try {
        await apiFetch(`/payslips/update/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showToast("Payslip details updated!");
        closeModal('edit-payslip-modal');
        loadPayslips();
    } catch (err) {
        // Handled by fetch helper
    }
}

function openEditPayslipModal(id) {
    const slip = payslipsList.find(s => s.payslip_id === id);
    if (!slip) return;
    
    document.getElementById('edit-slip-id-key').value = slip.payslip_id;
    document.getElementById('edit-slip-name').value = slip.employee_name;
    document.getElementById('edit-slip-date').value = slip.payment_date;
    document.getElementById('edit-slip-method').value = slip.payment_method;
    document.getElementById('edit-slip-status').value = slip.payment_status;
    document.getElementById('edit-slip-remarks').value = slip.remarks || '';
    
    openModal('edit-payslip-modal');
}

async function deletePayslip(id) {
    if (!confirm(`Are you sure you want to delete payslip record #${id}?`)) return;
    try {
        await apiFetch(`/payslips/delete/${id}/`, { method: 'DELETE' });
        showToast("Payslip record deleted");
        loadPayslips();
    } catch (err) {
        // Handled by fetch helper
    }
}

// Generate the printable visual PDF-style payslip card
async function viewPayslip(id) {
    const slip = payslipsList.find(s => s.payslip_id === id);
    if (!slip) return;
    
    try {
        // Fetch details of this employee & payroll info to match
        const employees = await apiFetch('/employees/');
        const payrolls = await apiFetch('/payroll/');
        
        const emp = employees.find(e => e.full_name === slip.employee_name) || { department: "N/A", designation: "Employee", joining_date: "N/A", employee_id: "N/A" };
        
        // Find matching payroll for this employee in the payslip's month
        // We'll search for matching name. Since months are strings e.g. "July 2026", we can match or fallback to employee's latest record.
        const pay = payrolls.filter(p => p.employee_name === slip.employee_name).pop() || { basic_salary: emp.salary || 0, bonus: 0, deductions: 0, net_salary: emp.salary || 0, payment_month: "N/A" };
        
        const container = document.getElementById('payslip-viewer-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="payslip-card">
                <div class="payslip-header">
                    <div class="payslip-company">
                        <h2>EMP-PAY CORP</h2>
                        <p>Tech Hub, Sector 62, Bangalore, India</p>
                    </div>
                    <div class="payslip-title">
                        <h3>SALARY SLIP</h3>
                        <p>Payslip ID: #${slip.payslip_id}</p>
                    </div>
                </div>
                
                <div class="payslip-meta-grid">
                    <div class="payslip-meta-item"><span>Employee ID:</span> #${emp.employee_id}</div>
                    <div class="payslip-meta-item"><span>Department:</span> ${emp.department}</div>
                    <div class="payslip-meta-item"><span>Full Name:</span> ${slip.employee_name}</div>
                    <div class="payslip-meta-item"><span>Designation:</span> ${emp.designation}</div>
                    <div class="payslip-meta-item"><span>Payment Date:</span> ${slip.payment_date}</div>
                    <div class="payslip-meta-item"><span>Pay Period:</span> ${pay.payment_month}</div>
                </div>
                
                <div class="payslip-calculation-grid">
                    <div class="calculation-column">
                        <h4>EARNINGS</h4>
                        <div class="calculation-row">
                            <span>Basic Salary</span>
                            <span>₹${parseFloat(pay.basic_salary).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="calculation-row">
                            <span>Bonus / Allowances</span>
                            <span style="color: var(--success);">+ ₹${parseFloat(pay.bonus).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="calculation-row total">
                            <span>Gross Earnings</span>
                            <span>₹${(parseFloat(pay.basic_salary) + parseFloat(pay.bonus)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    
                    <div class="calculation-column">
                        <h4>DEDUCTIONS</h4>
                        <div class="calculation-row">
                            <span>Provident Fund / Taxes</span>
                            <span>₹${parseFloat(pay.deductions).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="calculation-row" style="opacity: 0;">
                            <span>Spacer</span>
                            <span>-</span>
                        </div>
                        <div class="calculation-row total">
                            <span>Total Deductions</span>
                            <span style="color: var(--danger);">- ₹${parseFloat(pay.deductions).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payslip-summary">
                    <div style="font-size: 0.85rem; color: #64748b;">
                        <div><strong>Payment Method:</strong> ${slip.payment_method}</div>
                        <div><strong>Payment Status:</strong> <span class="badge badge-${slip.payment_status.toLowerCase()}">${slip.payment_status}</span></div>
                        <div style="margin-top: 0.25rem;"><strong>Remarks:</strong> ${slip.remarks || 'Credited successfully'}</div>
                    </div>
                    <div class="net-salary-badge-container">
                        <p>Net Take-Home Salary</p>
                        <div class="net-salary-badge-value">₹${parseFloat(pay.net_salary).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
                
                <div class="payslip-actions-bar">
                    <button class="btn btn-secondary" onclick="window.print()">🖨 Print / Save PDF</button>
                    <button class="btn btn-primary" onclick="closeModal('payslip-view-modal')">Close</button>
                </div>
            </div>
        `;
        
        openModal('payslip-view-modal');
    } catch (err) {
        // Handled by fetch helper
    }
}

// --- Home & Dashboard Pages Logic ---
async function loadDashboardData() {
    const totalEmpEl = document.getElementById('dash-total-employees');
    const totalDeptEl = document.getElementById('dash-total-departments');
    const avgAttEl = document.getElementById('dash-avg-attendance');
    const totalPayrollEl = document.getElementById('dash-total-payroll');
    const paidCountEl = document.getElementById('dash-paid-count');
    const pendingCountEl = document.getElementById('dash-pending-count');
    
    if (!totalEmpEl) return;
    
    try {
        const employees = await apiFetch('/employees/');
        const departments = await apiFetch('/departments/');
        const attendance = await apiFetch('/attendance/');
        const payroll = await apiFetch('/payroll/');
        const payslips = await apiFetch('/payslips/');
        
        // Compute statistics
        if (totalEmpEl) totalEmpEl.textContent = employees.length;
        if (totalDeptEl) totalDeptEl.textContent = departments.length;
        
        // Total monthly payroll expenditure
        const totalExp = payroll.reduce((sum, p) => sum + parseFloat(p.net_salary), 0);
        if (totalPayrollEl) totalPayrollEl.textContent = `₹${totalExp.toLocaleString('en-IN')}`;
        
        // Paid vs Pending slips
        const paid = payslips.filter(s => s.payment_status === 'Paid').length;
        const pending = payslips.filter(s => s.payment_status === 'Pending').length;
        
        if (paidCountEl) paidCountEl.textContent = paid;
        if (pendingCountEl) pendingCountEl.textContent = pending;
        
        // Attendance present count today
        const today = new Date().toISOString().split('T')[0];
        const presentToday = attendance.filter(a => a.attendance_date === today && a.status === 'Present').length;
        if (avgAttEl) avgAttEl.textContent = `${presentToday} Present Today`;
        
        // Render recent activity dashboard log
        const activityList = document.getElementById('recent-activity-list');
        if (activityList) {
            activityList.innerHTML = '';
            
            const recentEmployees = [...employees].slice(-3).reverse();
            const recentPayslips = [...payslips].slice(-3).reverse();
            
            let html = '';
            recentEmployees.forEach(e => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--glass-border); padding: 0.75rem 0;">
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">${e.full_name} joined</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${e.designation} in ${e.department}</div>
                        </div>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${e.joining_date}</span>
                    </div>
                `;
            });
            
            recentPayslips.forEach(s => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--glass-border); padding: 0.75rem 0;">
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">Salary slip generated</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.employee_name} • ${s.payment_method}</div>
                        </div>
                        <span class="badge badge-${s.payment_status.toLowerCase()}" style="font-size: 0.7rem;">${s.payment_status}</span>
                    </div>
                `;
            });
            
            if (!html) {
                activityList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recent activities logged.</p>';
            } else {
                activityList.innerHTML = html;
            }
        }
        
        // Draw Chart.js diagram if canvas element is loaded
        const ctx = document.getElementById('payroll-chart');
        if (ctx) {
            // Group payroll expenditure by Month
            const monthlyData = {};
            payroll.forEach(p => {
                monthlyData[p.payment_month] = (monthlyData[p.payment_month] || 0) + parseFloat(p.net_salary);
            });
            
            const labels = Object.keys(monthlyData);
            const values = Object.values(monthlyData);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels.length ? labels : ['No Data'],
                    datasets: [{
                        label: 'Total Salary Payout (₹)',
                        data: values.length ? values : [0],
                        backgroundColor: '#8b5cf6',
                        borderColor: '#7c3aed',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
    } catch (err) {
        // Handled by fetch helper
    }
}

// User login submit controller
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Get active role
    const activeTab = document.querySelector('.login-tab.active');
    const role = activeTab.getAttribute('data-role');
    
    const payload = {
        username: formData.get('username'),
        password: formData.get('password'),
        role: role
    };
    
    try {
        const response = await apiFetch('/login/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        showToast("Login Successful! Redirecting...");
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', response.role);
        
        setTimeout(() => {
            if (response.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'employees.html';
            }
        }, 1200);
    } catch (err) {
        // Handled by fetch helper
    }
}

// Dynamic portal tabs toggler
function toggleLoginRole(role) {
    const tabs = document.querySelectorAll('.login-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const clickedTab = document.querySelector(`.login-tab[data-role="${role}"]`);
    if (clickedTab) clickedTab.classList.add('active');
    
    const usernameLabel = document.getElementById('login-username-label');
    const usernameInput = document.getElementById('login-username');
    const passwordLabel = document.getElementById('login-password-label');
    const passwordInput = document.getElementById('login-password');
    
    if (role === 'admin') {
        if (usernameLabel) usernameLabel.textContent = 'Admin Username';
        if (usernameInput) usernameInput.placeholder = 'e.g. admin';
        if (passwordLabel) passwordLabel.textContent = 'Admin Secret Password';
        if (passwordInput) passwordInput.placeholder = '••••••••';
    } else {
        if (usernameLabel) usernameLabel.textContent = 'Employee Email Address';
        if (usernameInput) usernameInput.placeholder = 'e.g. employee@company.com';
        if (passwordLabel) passwordLabel.textContent = 'Password (Your Employee ID)';
        if (passwordInput) passwordInput.placeholder = 'e.g. 101';
    }
}

// --- General Modal Control Helpers ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// --- Bootstrapping logic on page load ---
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page is currently open and invoke relevant loader
    const pageName = window.location.pathname.split('/').pop();
    
    const session = checkSession();
    initNavigation();
    
    // Page load specific initializers
    if (pageName === 'index.html' || pageName === '') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
    } else if (pageName === 'dashboard.html') {
        loadDashboardData();
    } else if (pageName === 'employees.html') {
        loadEmployees();
        initEmployeeDropdowns();
        
        // Bind forms
        const addEmpForm = document.getElementById('add-employee-form');
        if (addEmpForm) addEmpForm.addEventListener('submit', addEmployee);
        
        const editEmpForm = document.getElementById('edit-employee-form');
        if (editEmpForm) editEmpForm.addEventListener('submit', saveEmployeeEdits);
        
        const profileForm = document.getElementById('profile-update-form');
        if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    } else if (pageName === 'departments.html') {
        loadDepartments();
        
        const addDeptForm = document.getElementById('add-dept-form');
        if (addDeptForm) addDeptForm.addEventListener('submit', addDepartment);
        
        const editDeptForm = document.getElementById('edit-dept-form');
        if (editDeptForm) editDeptForm.addEventListener('submit', saveDeptEdits);
    } else if (pageName === 'attendance.html') {
        loadAttendance();
        initEmployeeDropdowns();
        
        const addAttForm = document.getElementById('add-attendance-form');
        if (addAttForm) addAttForm.addEventListener('submit', addAttendance);
        
        const editAttForm = document.getElementById('edit-attendance-form');
        if (editAttForm) editAttForm.addEventListener('submit', saveAttendanceEdits);
    } else if (pageName === 'payroll.html') {
        loadPayroll();
        initPayrollCalculation();
        initEmployeeDropdowns();
        
        const addPayForm = document.getElementById('add-payroll-form');
        if (addPayForm) addPayForm.addEventListener('submit', addPayroll);
        
        const editPayForm = document.getElementById('edit-payroll-form');
        if (editPayForm) editPayForm.addEventListener('submit', savePayrollEdits);
    } else if (pageName === 'payslips.html') {
        loadPayslips();
        initEmployeeDropdowns();
        
        const addSlipForm = document.getElementById('add-payslip-form');
        if (addSlipForm) addSlipForm.addEventListener('submit', addPayslip);
        
        const editSlipForm = document.getElementById('edit-payslip-form');
        if (editSlipForm) editSlipForm.addEventListener('submit', savePayslipEdits);
    }
});

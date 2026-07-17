const API_BASE = 'http://127.0.0.1:8000';

// Global state / Helper to get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if page needs authentication
function checkAuth(requiredRole = null) {
    const user = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();
    
    // Allow index.html, login.html, register.html, jobs.html to be accessed without login
    const publicPages = ['index.html', 'login.html', 'register.html', 'jobs.html', ''];
    const isPublic = publicPages.some(page => currentPage === page || (page === '' && currentPage === ''));

    if (!user && !isPublic) {
        showToast('Please login to access this page.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }

    if (user && requiredRole && user.role !== requiredRole) {
        showToast('Access denied: Unauthorized role.', 'error');
        setTimeout(() => {
            if (user.role === 'candidate') window.location.href = 'candidate_dashboard.html';
            else if (user.role === 'employer') window.location.href = 'employer_dashboard.html';
            else if (user.role === 'admin') window.location.href = 'admin_dashboard.html';
        }, 1500);
        return false;
    }
    return true;
}

// Toast Notification
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <span class="toast-close">&times;</span>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Dynamic Navigation Rendering
function renderNavbar() {
    const navEl = document.getElementById('global-nav');
    if (!navEl) return;

    const user = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();

    let navHtml = `
        <div class="logo" onclick="window.location.href='index.html'">
            💼 JobPortal
        </div>
        <ul class="nav-links">
            <li><a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a></li>
            <li><a href="jobs.html" class="${currentPage === 'jobs.html' ? 'active' : ''}">Find Jobs</a></li>
    `;

    if (user) {
        if (user.role === 'candidate') {
            navHtml += `
                <li><a href="applications.html" class="${currentPage === 'applications.html' ? 'active' : ''}">My Applications</a></li>
                <li><a href="interviews.html" class="${currentPage === 'interviews.html' ? 'active' : ''}">My Interviews</a></li>
                <li><a href="candidate_dashboard.html" class="${currentPage === 'candidate_dashboard.html' ? 'active' : ''}">Dashboard</a></li>
            `;
        } else if (user.role === 'employer') {
            navHtml += `
                <li><a href="interviews.html" class="${currentPage === 'interviews.html' ? 'active' : ''}">Interviews</a></li>
                <li><a href="employer_dashboard.html" class="${currentPage === 'employer_dashboard.html' ? 'active' : ''}">Dashboard</a></li>
            `;
        } else if (user.role === 'admin') {
            navHtml += `
                <li><a href="admin_dashboard.html" class="${currentPage === 'admin_dashboard.html' ? 'active' : ''}">Admin Control</a></li>
            `;
        }
    }

    navHtml += `
        </ul>
        <div class="nav-actions">
            <button class="theme-toggle" id="theme-btn">🌙</button>
    `;

    if (user) {
        navHtml += `
            <span class="user-greeting">Hi, ${user.name}</span>
            <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        `;
    } else {
        navHtml += `
            <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    }

    navHtml += `</div>`;
    navEl.innerHTML = navHtml;

    // Theme Toggle Handler
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        if (currentTheme === 'light') {
            document.body.classList.add('light-mode');
            themeBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('light-mode');
            themeBtn.textContent = '🌙';
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeBtn.textContent = isLight ? '☀️' : '🌙';
        });
    }

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            showToast('Logged out successfully.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
}

// Helper for API fetch wrapper
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    if (data && ['POST', 'PUT'].includes(method)) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Call failed (${endpoint}):`, error);
        throw error;
    }
}

// =========================================================================
// PAGE SPECIFIC LOGIC
// =========================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize Navigation
    renderNavbar();

    const path = window.location.pathname.split('/').pop();
    
    // Auth Check
    if (path === 'candidate_dashboard.html') checkAuth('candidate');
    else if (path === 'employer_dashboard.html') checkAuth('employer');
    else if (path === 'admin_dashboard.html') checkAuth('admin');
    else if (path === 'applications.html') checkAuth('candidate');
    else if (path === 'interviews.html') checkAuth();

    // 2. Route Handling
    if (path === 'index.html' || path === '') {
        initHomePage();
    } else if (path === 'login.html') {
        initLoginPage();
    } else if (path === 'register.html') {
        initRegisterPage();
    } else if (path === 'jobs.html') {
        initJobsPage();
    } else if (path === 'candidate_dashboard.html') {
        initCandidateDashboard();
    } else if (path === 'employer_dashboard.html') {
        initEmployerDashboard();
    } else if (path === 'admin_dashboard.html') {
        initAdminDashboard();
    } else if (path === 'applications.html') {
        initApplicationsPage();
    } else if (path === 'interviews.html') {
        initInterviewsPage();
    }
});

// ==========================================
// HOME PAGE LOGIC
// ==========================================
async function initHomePage() {
    try {
        const jobs = await apiCall('/jobs/');
        const latestJobsGrid = document.getElementById('latest-jobs-grid');
        if (latestJobsGrid) {
            // Sort by ID descending to get latest jobs, cap at 3
            const latest = [...jobs].reverse().slice(0, 3);
            if (latest.length === 0) {
                latestJobsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No jobs available.</p>';
                return;
            }
            
            latestJobsGrid.innerHTML = latest.map(job => `
                <div class="card">
                    <div class="card-header">
                        <span class="card-badge">${job.job_type}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted-dark);">Last Date: ${job.last_date}</span>
                    </div>
                    <h3>${job.job_title}</h3>
                    <div class="company">${job.company_name}</div>
                    <div class="details">
                        <span>📍 ${job.location}</span>
                        <span>💼 ${job.experience_required} yrs exp</span>
                    </div>
                    <div class="card-footer">
                        <span class="salary">₹${job.salary.toLocaleString()}/yr</span>
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='jobs.html'">View & Apply</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Home page error", e);
    }
}

// ==========================================
// LOGIN PAGE LOGIC
// ==========================================
function initLoginPage() {
    let currentRole = 'candidate';
    const tabs = document.querySelectorAll('.form-tab');
    const roleInput = document.getElementById('login-role');
    const form = document.getElementById('login-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentRole = tab.dataset.role;
            if (roleInput) roleInput.value = currentRole;

            // Adjust fields if needed
            const passwordGroup = document.getElementById('password-group');
            if (currentRole === 'employer') {
                passwordGroup.style.display = 'none'; // Employers can login using email as requested
            } else {
                passwordGroup.style.display = 'block';
            }
        });
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                if (currentRole === 'candidate') {
                    const candidates = await apiCall('/candidates/');
                    const matched = candidates.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
                    if (matched) {
                        localStorage.setItem('user', JSON.stringify({
                            role: 'candidate',
                            id: matched.candidate_id,
                            name: matched.full_name
                        }));
                        showToast('Login successful!');
                        setTimeout(() => window.location.href = 'candidate_dashboard.html', 1000);
                    } else {
                        showToast('Invalid candidate email or password.', 'error');
                    }
                } else if (currentRole === 'employer') {
                    // Admin login shortcut
                    if (email.toLowerCase() === 'admin@jobportal.com') {
                        localStorage.setItem('user', JSON.stringify({
                            role: 'admin',
                            name: 'Administrator'
                        }));
                        showToast('Admin logged in!');
                        setTimeout(() => window.location.href = 'admin_dashboard.html', 1000);
                        return;
                    }

                    const employers = await apiCall('/employers/');
                    const matched = employers.find(emp => emp.email.toLowerCase() === email.toLowerCase());
                    if (matched) {
                        localStorage.setItem('user', JSON.stringify({
                            role: 'employer',
                            id: matched.employer_id,
                            name: matched.company_name
                        }));
                        showToast('Employer login successful!');
                        setTimeout(() => window.location.href = 'employer_dashboard.html', 1000);
                    } else {
                        showToast('Employer with this email does not exist.', 'error');
                    }
                }
            } catch (err) {
                showToast('Login failed. Server error.', 'error');
            }
        });
    }
}

// ==========================================
// REGISTER PAGE LOGIC
// ==========================================
function initRegisterPage() {
    let currentRole = 'candidate';
    const tabs = document.querySelectorAll('.form-tab');
    const candFields = document.getElementById('candidate-fields');
    const empFields = document.getElementById('employer-fields');
    const form = document.getElementById('register-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentRole = tab.dataset.role;

            if (currentRole === 'candidate') {
                candFields.style.display = 'block';
                empFields.style.display = 'none';
            } else {
                candFields.style.display = 'none';
                empFields.style.display = 'block';
            }
        });
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                if (currentRole === 'candidate') {
                    const data = {
                        candidate_id: parseInt(document.getElementById('c_id').value),
                        full_name: document.getElementById('c_name').value.trim(),
                        email: document.getElementById('c_email').value.trim(),
                        phone: document.getElementById('c_phone').value.trim(),
                        qualification: document.getElementById('c_qual').value.trim(),
                        skills: document.getElementById('c_skills').value.trim(),
                        experience: parseInt(document.getElementById('c_exp').value) || 0,
                        password: document.getElementById('c_pass').value
                    };

                    if (!data.candidate_id || !data.full_name || !data.email || !data.password) {
                        return showToast('Please fill out all required fields.', 'error');
                    }

                    await apiCall('/candidates/add/', 'POST', data);
                    showToast('Candidate registered! Please login.');
                    setTimeout(() => window.location.href = 'login.html', 1500);

                } else {
                    const data = {
                        employer_id: parseInt(document.getElementById('e_id').value),
                        company_name: document.getElementById('e_company').value.trim(),
                        hr_name: document.getElementById('e_hr').value.trim(),
                        email: document.getElementById('e_email').value.trim(),
                        phone: document.getElementById('e_phone').value.trim(),
                        location: document.getElementById('e_loc').value.trim(),
                        industry: document.getElementById('e_ind').value.trim()
                    };

                    if (!data.employer_id || !data.company_name || !data.email) {
                        return showToast('Please fill out all required fields.', 'error');
                    }

                    await apiCall('/employers/add/', 'POST', data);
                    showToast('Employer registered! Please login.');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                }
            } catch (err) {
                showToast(err.message || 'Registration failed.', 'error');
            }
        });
    }
}

// ==========================================
// JOBS PAGE LOGIC
// ==========================================
let allJobs = [];
function initJobsPage() {
    const jobListings = document.getElementById('job-listings-grid');
    const searchBtn = document.getElementById('search-btn');
    const searchTitle = document.getElementById('search-title');
    const searchLocation = document.getElementById('search-location');
    const filterType = document.getElementById('filter-type');
    const filterExperience = document.getElementById('filter-experience');

    async function loadJobs() {
        try {
            allJobs = await apiCall('/jobs/');
            filterAndRenderJobs();
        } catch (e) {
            showToast('Failed to load job listings.', 'error');
        }
    }

    function filterAndRenderJobs() {
        const titleQ = searchTitle.value.toLowerCase();
        const locQ = searchLocation.value.toLowerCase();
        const typeQ = filterType.value;
        const expQ = parseInt(filterExperience.value) || 0;

        const filtered = allJobs.filter(job => {
            const matchesTitle = job.job_title.toLowerCase().includes(titleQ) || job.company_name.toLowerCase().includes(titleQ);
            const matchesLoc = job.location.toLowerCase().includes(locQ);
            const matchesType = !typeQ || job.job_type === typeQ;
            const matchesExp = !expQ || job.experience_required <= expQ;
            return matchesTitle && matchesLoc && matchesType && matchesExp;
        });

        renderJobs(filtered);
    }

    function renderJobs(jobsList) {
        if (!jobListings) return;
        if (jobsList.length === 0) {
            jobListings.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No jobs match your search parameters.</p>';
            return;
        }

        const user = getCurrentUser();

        jobListings.innerHTML = jobsList.map(job => {
            let applyButton = '';
            if (!user) {
                applyButton = `<button class="btn btn-primary btn-sm" onclick="window.location.href='login.html'">Login to Apply</button>`;
            } else if (user.role === 'candidate') {
                applyButton = `<button class="btn btn-primary btn-sm" onclick="handleApplyJob(${job.job_id}, '${job.job_title}', '${job.company_name}')">Apply Now</button>`;
            } else {
                applyButton = `<button class="btn btn-secondary btn-sm" disabled>Apply (Candidates Only)</button>`;
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <span class="card-badge">${job.job_type}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted-dark);">Last Date: ${job.last_date}</span>
                    </div>
                    <h3>${job.job_title}</h3>
                    <div class="company">${job.company_name}</div>
                    <div class="details">
                        <span>📍 ${job.location}</span>
                        <span>💼 Req Experience: ${job.experience_required} yrs</span>
                    </div>
                    <div class="card-footer">
                        <span class="salary">₹${job.salary.toLocaleString()}/yr</span>
                        ${applyButton}
                    </div>
                </div>
            `;
        }).join('');
    }

    if (searchBtn) searchBtn.addEventListener('click', filterAndRenderJobs);
    if (searchTitle) searchTitle.addEventListener('input', filterAndRenderJobs);
    if (searchLocation) searchLocation.addEventListener('input', filterAndRenderJobs);
    if (filterType) filterType.addEventListener('change', filterAndRenderJobs);
    if (filterExperience) filterExperience.addEventListener('input', filterAndRenderJobs);

    loadJobs();
}

// Global Apply Function called by card buttons
async function handleApplyJob(jobId, jobTitle, companyName) {
    const user = getCurrentUser();
    if (!user || user.role !== 'candidate') return;

    const resumeName = prompt("Enter your resume file name (e.g. resume.pdf):", `${user.name.toLowerCase().replace(' ', '_')}_resume.pdf`);
    if (resumeName === null) return; // user cancelled

    // Generate random application_id
    const appId = Math.floor(1000 + Math.random() * 9000);

    const applicationData = {
        application_id: appId,
        candidate_name: user.name,
        company_name: companyName,
        job_title: jobTitle,
        applied_date: new Date().toISOString().split('T')[0],
        resume: resumeName || 'resume.pdf',
        application_status: 'Applied'
    };

    try {
        await apiCall('/applications/add/', 'POST', applicationData);
        showToast('Successfully applied for the job!');
        setTimeout(() => window.location.href = 'applications.html', 1500);
    } catch (e) {
        showToast('Error applying for job: ' + e.message, 'error');
    }
}

// ==========================================
// CANDIDATE DASHBOARD
// ==========================================
async function initCandidateDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Fetch candidates list to find full details
        const candidates = await apiCall('/candidates/');
        const profile = candidates.find(c => c.candidate_id === user.id);
        
        if (profile) {
            document.getElementById('profile-name').textContent = profile.full_name;
            document.getElementById('profile-email').textContent = profile.email;
            document.getElementById('profile-phone').textContent = profile.phone || 'N/A';
            document.getElementById('profile-qual').textContent = profile.qualification || 'N/A';
            document.getElementById('profile-skills').textContent = profile.skills || 'N/A';
            document.getElementById('profile-exp').textContent = `${profile.experience} years`;
        }

        // Fetch applications and filter by candidate name
        const apps = await apiCall('/applications/');
        const candApps = apps.filter(a => a.candidate_name.toLowerCase() === user.name.toLowerCase());
        
        document.getElementById('stat-applied').textContent = candApps.length;
        
        const shortlistedApps = candApps.filter(a => ['Shortlisted', 'Interview Scheduled'].includes(a.application_status));
        document.getElementById('stat-shortlisted').textContent = shortlistedApps.length;

        // Fetch interviews and filter by candidate name
        const interviews = await apiCall('/interviews/');
        const candInts = interviews.filter(i => i.candidate_name.toLowerCase() === user.name.toLowerCase());
        
        const upcomingInts = candInts.filter(i => i.interview_status === 'Scheduled');
        document.getElementById('stat-interviews').textContent = upcomingInts.length;

        // Populate tables on dashboard
        const dashboardAppsBody = document.getElementById('dashboard-apps-body');
        if (dashboardAppsBody) {
            const recentApps = [...candApps].reverse().slice(0, 5);
            if (recentApps.length === 0) {
                dashboardAppsBody.innerHTML = '<tr><td colspan="4" class="text-center">No applications yet.</td></tr>';
            } else {
                dashboardAppsBody.innerHTML = recentApps.map(app => `
                    <tr>
                        <td><strong>${app.job_title}</strong></td>
                        <td>${app.company_name}</td>
                        <td>${app.applied_date}</td>
                        <td><span class="badge badge-${app.application_status.toLowerCase().replace(' ', '-')}">${app.application_status}</span></td>
                    </tr>
                `).join('');
            }
        }

        const dashboardIntsBody = document.getElementById('dashboard-ints-body');
        if (dashboardIntsBody) {
            const recentInts = upcomingInts.slice(0, 5);
            if (recentInts.length === 0) {
                dashboardIntsBody.innerHTML = '<tr><td colspan="5" class="text-center">No upcoming interviews.</td></tr>';
            } else {
                dashboardIntsBody.innerHTML = recentInts.map(i => `
                    <tr>
                        <td>${i.company_name}</td>
                        <td>${i.interview_date}</td>
                        <td>${i.interview_time}</td>
                        <td><span class="badge badge-${i.interview_mode.toLowerCase()}">${i.interview_mode}</span></td>
                        <td><span class="badge badge-${i.interview_status.toLowerCase()}">${i.interview_status}</span></td>
                    </tr>
                `).join('');
            }
        }

    } catch (e) {
        showToast('Error loading candidate profile data.', 'error');
    }
}

// ==========================================
// CANDIDATE APPLICATIONS PAGE
// ==========================================
async function initApplicationsPage() {
    const user = getCurrentUser();
    if (!user) return;

    const appsBody = document.getElementById('applications-table-body');
    if (!appsBody) return;

    try {
        const apps = await apiCall('/applications/');
        const candApps = apps.filter(a => a.candidate_name.toLowerCase() === user.name.toLowerCase());
        
        if (candApps.length === 0) {
            appsBody.innerHTML = '<tr><td colspan="6" class="text-center">You have not applied to any jobs yet.</td></tr>';
            return;
        }

        appsBody.innerHTML = candApps.map(app => `
            <tr>
                <td>${app.application_id}</td>
                <td><strong>${app.job_title}</strong></td>
                <td>${app.company_name}</td>
                <td>${app.applied_date}</td>
                <td><a href="#" onclick="alert('Downloading resume: ${app.resume}')" style="color: var(--secondary); text-decoration: underline;">📄 ${app.resume}</a></td>
                <td><span class="badge badge-${app.application_status.toLowerCase().replace(' ', '-')}">${app.application_status}</span></td>
            </tr>
        `).join('');

    } catch (e) {
        showToast('Error fetching applications.', 'error');
    }
}

// ==========================================
// INTERVIEWS PAGE (SHARED CANDIDATE / EMPLOYER)
// ==========================================
async function initInterviewsPage() {
    const user = getCurrentUser();
    if (!user) return;

    const interviewsBody = document.getElementById('interviews-table-body');
    if (!interviewsBody) return;

    try {
        const interviews = await apiCall('/interviews/');
        let filteredInts = [];

        if (user.role === 'candidate') {
            filteredInts = interviews.filter(i => i.candidate_name.toLowerCase() === user.name.toLowerCase());
        } else if (user.role === 'employer') {
            filteredInts = interviews.filter(i => i.company_name.toLowerCase() === user.name.toLowerCase());
        }

        if (filteredInts.length === 0) {
            interviewsBody.innerHTML = '<tr><td colspan="6" class="text-center">No interviews scheduled.</td></tr>';
            return;
        }

        interviewsBody.innerHTML = filteredInts.map(i => `
            <tr>
                <td>${i.interview_id}</td>
                <td>${user.role === 'candidate' ? i.company_name : i.candidate_name}</td>
                <td>${i.interview_date}</td>
                <td>${i.interview_time}</td>
                <td><span class="badge badge-${i.interview_mode.toLowerCase()}">${i.interview_mode}</span></td>
                <td><span class="badge badge-${i.interview_status.toLowerCase()}">${i.interview_status}</span></td>
            </tr>
        `).join('');

    } catch (e) {
        showToast('Error fetching interviews.', 'error');
    }
}

// ==========================================
// EMPLOYER DASHBOARD
// ==========================================
async function initEmployerDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    // Load stats & lists
    await loadEmployerData();

    // 1. Post Job Handler
    const postJobForm = document.getElementById('post-job-form');
    if (postJobForm) {
        postJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jobData = {
                job_id: parseInt(document.getElementById('job-id').value),
                job_title: document.getElementById('job-title').value.trim(),
                company_name: user.name, // Set logged-in company name
                location: document.getElementById('job-location').value.trim(),
                job_type: document.getElementById('job-type').value,
                experience_required: parseInt(document.getElementById('job-exp').value),
                salary: parseFloat(document.getElementById('job-salary').value),
                last_date: document.getElementById('job-last-date').value
            };

            try {
                await apiCall('/jobs/add/', 'POST', jobData);
                showToast('Job posted successfully!');
                postJobForm.reset();
                // Set default job_id as random next
                document.getElementById('job-id').value = Math.floor(1000 + Math.random() * 9000);
                await loadEmployerData();
            } catch (err) {
                showToast('Failed to post job: ' + err.message, 'error');
            }
        });
        // Auto seed random job id
        document.getElementById('job-id').value = Math.floor(1000 + Math.random() * 9000);
    }

    // 2. Schedule Interview Handler
    const scheduleForm = document.getElementById('schedule-interview-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const interviewData = {
                interview_id: parseInt(document.getElementById('int-id').value),
                candidate_name: document.getElementById('int-candidate-name').value,
                company_name: user.name,
                interview_date: document.getElementById('int-date').value,
                interview_time: document.getElementById('int-time').value,
                interview_mode: document.getElementById('int-mode').value,
                interview_status: 'Scheduled'
            };

            try {
                await apiCall('/interviews/add/', 'POST', interviewData);
                // Also update application status to 'Interview Scheduled' if exists
                const apps = await apiCall('/applications/');
                const matchedApp = apps.find(a => 
                    a.candidate_name.toLowerCase() === interviewData.candidate_name.toLowerCase() && 
                    a.company_name.toLowerCase() === user.name.toLowerCase()
                );
                
                if (matchedApp) {
                    matchedApp.application_status = 'Interview Scheduled';
                    await apiCall(`/applications/update/${matchedApp.application_id}/`, 'PUT', matchedApp);
                }

                showToast('Interview scheduled!');
                closeModal('schedule-modal');
                await loadEmployerData();
            } catch (err) {
                showToast('Scheduling failed: ' + err.message, 'error');
            }
        });
    }
}

async function loadEmployerData() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const [jobs, apps, interviews] = await Promise.all([
            apiCall('/jobs/'),
            apiCall('/applications/'),
            apiCall('/interviews/')
        ]);

        // Filter data related to this company
        const myJobs = jobs.filter(j => j.company_name.toLowerCase() === user.name.toLowerCase());
        const myApps = apps.filter(a => a.company_name.toLowerCase() === user.name.toLowerCase());
        const myInts = interviews.filter(i => i.company_name.toLowerCase() === user.name.toLowerCase());
        
        // Update stats card counts
        document.getElementById('stat-emp-jobs').textContent = myJobs.length;
        document.getElementById('stat-emp-apps').textContent = myApps.length;
        document.getElementById('stat-emp-ints').textContent = myInts.filter(i => i.interview_status === 'Scheduled').length;
        document.getElementById('stat-emp-sel').textContent = myApps.filter(a => a.application_status === 'Selected').length;

        // Render posted jobs list
        const postedJobsBody = document.getElementById('posted-jobs-body');
        if (postedJobsBody) {
            if (myJobs.length === 0) {
                postedJobsBody.innerHTML = '<tr><td colspan="6" class="text-center">No jobs posted yet.</td></tr>';
            } else {
                postedJobsBody.innerHTML = myJobs.map(job => `
                    <tr>
                        <td>${job.job_id}</td>
                        <td><strong>${job.job_title}</strong></td>
                        <td>${job.location}</td>
                        <td>${job.job_type}</td>
                        <td>₹${job.salary.toLocaleString()}</td>
                        <td>${job.last_date}</td>
                    </tr>
                `).join('');
            }
        }

        // Render received applications list with action status hooks
        const recAppsBody = document.getElementById('received-apps-body');
        if (recAppsBody) {
            if (myApps.length === 0) {
                recAppsBody.innerHTML = '<tr><td colspan="7" class="text-center">No applications received yet.</td></tr>';
            } else {
                recAppsBody.innerHTML = myApps.map(app => {
                    let actionHtml = '';
                    if (app.application_status === 'Applied') {
                        actionHtml = `
                            <button class="btn btn-secondary btn-sm" onclick="updateAppStatus(${app.application_id}, 'Shortlisted')">Shortlist</button>
                            <button class="btn btn-danger btn-sm" onclick="updateAppStatus(${app.application_id}, 'Rejected')">Reject</button>
                        `;
                    } else if (app.application_status === 'Shortlisted') {
                        actionHtml = `
                            <button class="btn btn-primary btn-sm" onclick="openScheduleModal('${app.candidate_name}')">Schedule Interview</button>
                        `;
                    } else if (app.application_status === 'Interview Scheduled') {
                        actionHtml = `
                            <button class="btn btn-success btn-sm" onclick="updateAppStatus(${app.application_id}, 'Selected')">Select</button>
                            <button class="btn btn-danger btn-sm" onclick="updateAppStatus(${app.application_id}, 'Rejected')">Reject</button>
                        `;
                    } else {
                        actionHtml = `<span style="font-size: 0.85rem; color: var(--text-muted-dark);">None</span>`;
                    }

                    return `
                        <tr>
                            <td>${app.application_id}</td>
                            <td><strong>${app.candidate_name}</strong></td>
                            <td>${app.job_title}</td>
                            <td>${app.applied_date}</td>
                            <td><a href="#" onclick="alert('Downloading resume: ${app.resume}')" style="color: var(--secondary); text-decoration: underline;">📄 ${app.resume}</a></td>
                            <td><span class="badge badge-${app.application_status.toLowerCase().replace(' ', '-')}">${app.application_status}</span></td>
                            <td><div style="display: flex; gap: 0.5rem;">${actionHtml}</div></td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render scheduled interviews
        const schedIntsBody = document.getElementById('scheduled-interviews-body');
        if (schedIntsBody) {
            if (myInts.length === 0) {
                schedIntsBody.innerHTML = '<tr><td colspan="6" class="text-center">No interviews scheduled yet.</td></tr>';
            } else {
                schedIntsBody.innerHTML = myInts.map(i => {
                    let actionHtml = '';
                    if (i.interview_status === 'Scheduled') {
                        actionHtml = `
                            <button class="btn btn-success btn-sm" onclick="updateInterviewStatus(${i.interview_id}, 'Completed')">Complete</button>
                            <button class="btn btn-danger btn-sm" onclick="updateInterviewStatus(${i.interview_id}, 'Rejected')">Reject</button>
                        `;
                    } else {
                        actionHtml = `<span style="font-size: 0.85rem; color: var(--text-muted-dark);">-</span>`;
                    }
                    return `
                        <tr>
                            <td>${i.interview_id}</td>
                            <td><strong>${i.candidate_name}</strong></td>
                            <td>${i.interview_date}</td>
                            <td>${i.interview_time}</td>
                            <td><span class="badge badge-${i.interview_mode.toLowerCase()}">${i.interview_mode}</span></td>
                            <td><span class="badge badge-${i.interview_status.toLowerCase()}">${i.interview_status}</span></td>
                            <td>${actionHtml}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

    } catch (e) {
        showToast('Error loading employer details.', 'error');
    }
}

// Global hook for updating application status
async function updateAppStatus(appId, newStatus) {
    try {
        const app = await apiCall(`/applications/`);
        const target = app.find(a => a.application_id === appId);
        if (!target) return showToast('Application not found', 'error');

        target.application_status = newStatus;
        await apiCall(`/applications/update/${appId}/`, 'PUT', target);
        showToast(`Application status updated to ${newStatus}`);
        await loadEmployerData();
    } catch (e) {
        showToast('Failed to update status', 'error');
    }
}

// Global hook for updating interview status
async function updateInterviewStatus(interviewId, newStatus) {
    try {
        const interviews = await apiCall(`/interviews/`);
        const target = interviews.find(i => i.interview_id === interviewId);
        if (!target) return showToast('Interview not found', 'error');

        target.interview_status = newStatus;
        await apiCall(`/interviews/update/${interviewId}/`, 'PUT', target);
        
        // If candidate is selected, we can also auto-select them in the job application
        if (newStatus === 'Completed') {
            const apps = await apiCall('/applications/');
            const matchedApp = apps.find(a => 
                a.candidate_name.toLowerCase() === target.candidate_name.toLowerCase() && 
                a.company_name.toLowerCase() === target.company_name.toLowerCase()
            );
            if (matchedApp) {
                matchedApp.application_status = 'Selected';
                await apiCall(`/applications/update/${matchedApp.application_id}/`, 'PUT', matchedApp);
            }
        } else if (newStatus === 'Rejected') {
            const apps = await apiCall('/applications/');
            const matchedApp = apps.find(a => 
                a.candidate_name.toLowerCase() === target.candidate_name.toLowerCase() && 
                a.company_name.toLowerCase() === target.company_name.toLowerCase()
            );
            if (matchedApp) {
                matchedApp.application_status = 'Rejected';
                await apiCall(`/applications/update/${matchedApp.application_id}/`, 'PUT', matchedApp);
            }
        }

        showToast(`Interview status updated to ${newStatus}`);
        await loadEmployerData();
    } catch (e) {
        showToast('Failed to update status', 'error');
    }
}

// Modal Toggle Helpers
function openScheduleModal(candidateName) {
    const modal = document.getElementById('schedule-modal');
    if (modal) {
        document.getElementById('int-candidate-name').value = candidateName;
        document.getElementById('int-id').value = Math.floor(1000 + Math.random() * 9000);
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
let adminCurrentTab = 'candidates';

async function initAdminDashboard() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            adminCurrentTab = tab.dataset.module;
            renderAdminModule();
        });
    });

    // Close Modal Event listeners
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(c => {
        c.addEventListener('click', () => {
            const modal = c.closest('.modal-overlay');
            if (modal) modal.style.display = 'none';
        });
    });

    // Form Submits in Modal
    document.getElementById('admin-form').addEventListener('submit', handleAdminFormSubmit);

    // Initial Load
    renderAdminModule();
}

async function renderAdminModule() {
    const headerTitle = document.getElementById('admin-table-title');
    const tableHead = document.getElementById('admin-table-head');
    const tableBody = document.getElementById('admin-table-body');
    const addBtn = document.getElementById('admin-add-btn');

    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Loading module data...</td></tr>';
    addBtn.textContent = `Add New ${adminCurrentTab.slice(0, -1).charAt(0).toUpperCase() + adminCurrentTab.slice(0, -1).slice(1)}`;

    try {
        if (adminCurrentTab === 'candidates') {
            headerTitle.textContent = "Candidate Accounts";
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Qualification</th>
                    <th>Skills</th>
                    <th>Experience (yrs)</th>
                    <th>Actions</th>
                </tr>
            `;
            const list = await apiCall('/candidates/');
            tableBody.innerHTML = list.map(item => `
                <tr>
                    <td>${item.candidate_id}</td>
                    <td><strong>${item.full_name}</strong></td>
                    <td>${item.email}</td>
                    <td>${item.phone || '-'}</td>
                    <td>${item.qualification || '-'}</td>
                    <td>${item.skills || '-'}</td>
                    <td>${item.experience}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openAdminEditModal('candidates', ${item.candidate_id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="adminDeleteRecord('candidates', ${item.candidate_id})">Delete</button>
                    </td>
                </tr>
            `).join('');

        } else if (adminCurrentTab === 'employers') {
            headerTitle.textContent = "Employer Companies";
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Company Name</th>
                    <th>HR Contact</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Industry</th>
                    <th>Actions</th>
                </tr>
            `;
            const list = await apiCall('/employers/');
            tableBody.innerHTML = list.map(item => `
                <tr>
                    <td>${item.employer_id}</td>
                    <td><strong>${item.company_name}</strong></td>
                    <td>${item.hr_name || '-'}</td>
                    <td>${item.email}</td>
                    <td>${item.phone || '-'}</td>
                    <td>${item.location || '-'}</td>
                    <td>${item.industry || '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openAdminEditModal('employers', ${item.employer_id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="adminDeleteRecord('employers', ${item.employer_id})">Delete</button>
                    </td>
                </tr>
            `).join('');

        } else if (adminCurrentTab === 'jobs') {
            headerTitle.textContent = "Active Job Postings";
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Job Type</th>
                    <th>Req Experience</th>
                    <th>Salary</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                </tr>
            `;
            const list = await apiCall('/jobs/');
            tableBody.innerHTML = list.map(item => `
                <tr>
                    <td>${item.job_id}</td>
                    <td><strong>${item.job_title}</strong></td>
                    <td>${item.company_name}</td>
                    <td>${item.location || '-'}</td>
                    <td><span class="badge badge-applied">${item.job_type}</span></td>
                    <td>${item.experience_required} yrs</td>
                    <td>₹${item.salary.toLocaleString()}</td>
                    <td>${item.last_date}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openAdminEditModal('jobs', ${item.job_id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="adminDeleteRecord('jobs', ${item.job_id})">Delete</button>
                    </td>
                </tr>
            `).join('');

        } else if (adminCurrentTab === 'applications') {
            headerTitle.textContent = "Job Applications";
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Candidate</th>
                    <th>Company</th>
                    <th>Job Title</th>
                    <th>Applied Date</th>
                    <th>Resume</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            `;
            const list = await apiCall('/applications/');
            tableBody.innerHTML = list.map(item => `
                <tr>
                    <td>${item.application_id}</td>
                    <td><strong>${item.candidate_name}</strong></td>
                    <td>${item.company_name}</td>
                    <td>${item.job_title}</td>
                    <td>${item.applied_date}</td>
                    <td>${item.resume}</td>
                    <td><span class="badge badge-${item.application_status.toLowerCase().replace(' ', '-')}">${item.application_status}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openAdminEditModal('applications', ${item.application_id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="adminDeleteRecord('applications', ${item.application_id})">Delete</button>
                    </td>
                </tr>
            `).join('');

        } else if (adminCurrentTab === 'interviews') {
            headerTitle.textContent = "Scheduled Interviews";
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Candidate</th>
                    <th>Company</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            `;
            const list = await apiCall('/interviews/');
            tableBody.innerHTML = list.map(item => `
                <tr>
                    <td>${item.interview_id}</td>
                    <td><strong>${item.candidate_name}</strong></td>
                    <td>${item.company_name}</td>
                    <td>${item.interview_date}</td>
                    <td>${item.interview_time}</td>
                    <td><span class="badge badge-${item.interview_mode.toLowerCase()}">${item.interview_mode}</span></td>
                    <td><span class="badge badge-${item.interview_status.toLowerCase()}">${item.interview_status}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openAdminEditModal('interviews', ${item.interview_id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="adminDeleteRecord('interviews', ${item.interview_id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Failed to fetch data from API server.</td></tr>';
    }
}

// Open Admin Modal to Add or Edit
let adminEditingId = null;

function openAdminAddModal() {
    adminEditingId = null;
    document.getElementById('modal-title').textContent = `Add New ${adminCurrentTab.slice(0, -1).toUpperCase() + adminCurrentTab.slice(0, -1).slice(1)}`;
    renderAdminFields(null);
    document.getElementById('admin-modal').style.display = 'flex';
}

async function openAdminEditModal(module, id) {
    adminEditingId = id;
    document.getElementById('modal-title').textContent = `Edit ${module.slice(0, -1).charAt(0).toUpperCase() + module.slice(0, -1).slice(1)} ID: ${id}`;
    
    try {
        let endpoint = `/${module}/`;
        const list = await apiCall(endpoint);
        const idKey = module === 'candidates' ? 'candidate_id' : 
                      module === 'employers' ? 'employer_id' : 
                      module === 'jobs' ? 'job_id' : 
                      module === 'applications' ? 'application_id' : 'interview_id';
        
        const record = list.find(item => item[idKey] === id);
        if (record) {
            renderAdminFields(record);
            document.getElementById('admin-modal').style.display = 'flex';
        } else {
            showToast('Failed to load record details.', 'error');
        }
    } catch (err) {
        showToast('Error fetching record detail.', 'error');
    }
}

// Dynamic field rendering in Admin Modal
function renderAdminFields(data = null) {
    const container = document.getElementById('admin-fields-container');
    container.innerHTML = '';

    if (adminCurrentTab === 'candidates') {
        container.innerHTML = `
            <div class="form-group">
                <label>Candidate ID *</label>
                <input type="number" id="f-candidate_id" value="${data ? data.candidate_id : Math.floor(100 + Math.random() * 900)}" ${data ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="f-full_name" value="${data ? data.full_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="f-email" value="${data ? data.email : ''}" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="f-phone" value="${data ? data.phone : ''}">
            </div>
            <div class="form-group">
                <label>Qualification</label>
                <input type="text" id="f-qualification" value="${data ? data.qualification : ''}">
            </div>
            <div class="form-group">
                <label>Skills</label>
                <input type="text" id="f-skills" value="${data ? data.skills : ''}">
            </div>
            <div class="form-group">
                <label>Experience (Years)</label>
                <input type="number" id="f-experience" value="${data ? data.experience : 0}">
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" id="f-password" value="${data ? data.password : '12345'}" required>
            </div>
        `;
    } else if (adminCurrentTab === 'employers') {
        container.innerHTML = `
            <div class="form-group">
                <label>Employer ID *</label>
                <input type="number" id="f-employer_id" value="${data ? data.employer_id : Math.floor(200 + Math.random() * 800)}" ${data ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Company Name *</label>
                <input type="text" id="f-company_name" value="${data ? data.company_name : ''}" required>
            </div>
            <div class="form-group">
                <label>HR Name</label>
                <input type="text" id="f-hr_name" value="${data ? data.hr_name : ''}">
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="f-email" value="${data ? data.email : ''}" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="f-phone" value="${data ? data.phone : ''}">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" id="f-location" value="${data ? data.location : ''}">
            </div>
            <div class="form-group">
                <label>Industry</label>
                <input type="text" id="f-industry" value="${data ? data.industry : ''}">
            </div>
        `;
    } else if (adminCurrentTab === 'jobs') {
        container.innerHTML = `
            <div class="form-group">
                <label>Job ID *</label>
                <input type="number" id="f-job_id" value="${data ? data.job_id : Math.floor(300 + Math.random() * 700)}" ${data ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Job Title *</label>
                <input type="text" id="f-job_title" value="${data ? data.job_title : ''}" required>
            </div>
            <div class="form-group">
                <label>Company Name *</label>
                <input type="text" id="f-company_name" value="${data ? data.company_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" id="f-location" value="${data ? data.location : ''}">
            </div>
            <div class="form-group">
                <label>Job Type *</label>
                <select id="f-job_type">
                    <option value="Full Time" ${data && data.job_type === 'Full Time' ? 'selected' : ''}>Full Time</option>
                    <option value="Part Time" ${data && data.job_type === 'Part Time' ? 'selected' : ''}>Part Time</option>
                    <option value="Internship" ${data && data.job_type === 'Internship' ? 'selected' : ''}>Internship</option>
                    <option value="Remote" ${data && data.job_type === 'Remote' ? 'selected' : ''}>Remote</option>
                </select>
            </div>
            <div class="form-group">
                <label>Required Experience (Years)</label>
                <input type="number" id="f-experience_required" value="${data ? data.experience_required : 0}">
            </div>
            <div class="form-group">
                <label>Salary *</label>
                <input type="number" id="f-salary" value="${data ? data.salary : 0}" required>
            </div>
            <div class="form-group">
                <label>Last Date (YYYY-MM-DD)</label>
                <input type="date" id="f-last_date" value="${data ? data.last_date : new Date().toISOString().split('T')[0]}">
            </div>
        `;
    } else if (adminCurrentTab === 'applications') {
        container.innerHTML = `
            <div class="form-group">
                <label>Application ID *</label>
                <input type="number" id="f-application_id" value="${data ? data.application_id : Math.floor(400 + Math.random() * 600)}" ${data ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Candidate Name *</label>
                <input type="text" id="f-candidate_name" value="${data ? data.candidate_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Company Name *</label>
                <input type="text" id="f-company_name" value="${data ? data.company_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Job Title *</label>
                <input type="text" id="f-job_title" value="${data ? data.job_title : ''}" required>
            </div>
            <div class="form-group">
                <label>Applied Date (YYYY-MM-DD)</label>
                <input type="date" id="f-applied_date" value="${data ? data.applied_date : new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Resume File Name</label>
                <input type="text" id="f-resume" value="${data ? data.resume : 'resume.pdf'}">
            </div>
            <div class="form-group">
                <label>Application Status *</label>
                <select id="f-application_status">
                    <option value="Applied" ${data && data.application_status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Shortlisted" ${data && data.application_status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                    <option value="Interview Scheduled" ${data && data.application_status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
                    <option value="Selected" ${data && data.application_status === 'Selected' ? 'selected' : ''}>Selected</option>
                    <option value="Rejected" ${data && data.application_status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        `;
    } else if (adminCurrentTab === 'interviews') {
        container.innerHTML = `
            <div class="form-group">
                <label>Interview ID *</label>
                <input type="number" id="f-interview_id" value="${data ? data.interview_id : Math.floor(500 + Math.random() * 500)}" ${data ? 'disabled' : 'required'}>
            </div>
            <div class="form-group">
                <label>Candidate Name *</label>
                <input type="text" id="f-candidate_name" value="${data ? data.candidate_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Company Name *</label>
                <input type="text" id="f-company_name" value="${data ? data.company_name : ''}" required>
            </div>
            <div class="form-group">
                <label>Interview Date (YYYY-MM-DD)</label>
                <input type="date" id="f-interview_date" value="${data ? data.interview_date : new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Interview Time (HH:MM)</label>
                <input type="text" id="f-interview_time" placeholder="e.g. 11:30" value="${data ? data.interview_time : '10:00'}">
            </div>
            <div class="form-group">
                <label>Interview Mode *</label>
                <select id="f-interview_mode">
                    <option value="Online" ${data && data.interview_mode === 'Online' ? 'selected' : ''}>Online</option>
                    <option value="Offline" ${data && data.interview_mode === 'Offline' ? 'selected' : ''}>Offline</option>
                </select>
            </div>
            <div class="form-group">
                <label>Interview Status *</label>
                <select id="f-interview_status">
                    <option value="Scheduled" ${data && data.interview_status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="Completed" ${data && data.interview_status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Selected" ${data && data.interview_status === 'Selected' ? 'selected' : ''}>Selected</option>
                    <option value="Rejected" ${data && data.interview_status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        `;
    }
}

// Handle Admin Submit (Handles both ADD and EDIT)
async function handleAdminFormSubmit(e) {
    e.preventDefault();

    const data = {};
    const elements = document.querySelectorAll('[id^="f-"]');
    elements.forEach(el => {
        const key = el.id.substring(2);
        let val = el.value;
        if (el.type === 'number') val = parseInt(val);
        else if (key === 'salary') val = parseFloat(val);
        data[key] = val;
    });

    let endpoint = `/${adminCurrentTab}/`;
    let method = 'POST';

    // If edit mode
    if (adminEditingId !== null) {
        endpoint = `/${adminCurrentTab}/update/${adminEditingId}/`;
        method = 'PUT';
    } else {
        endpoint = `/${adminCurrentTab}/add/`;
        method = 'POST';
    }

    try {
        const res = await apiCall(endpoint, method, data);
        showToast(res.message || 'Operation successful!');
        closeModal('admin-modal');
        renderAdminModule();
    } catch (err) {
        showToast('Error saving record: ' + err.message, 'error');
    }
}

// Delete Record Hook for Admin
async function adminDeleteRecord(module, id) {
    if (!confirm(`Are you sure you want to delete ${module.slice(0, -1)} ID: ${id}?`)) return;
    
    try {
        const res = await apiCall(`/${module}/delete/${id}/`, 'DELETE');
        showToast(res.message || 'Deleted successfully.');
        renderAdminModule();
    } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
    }
}

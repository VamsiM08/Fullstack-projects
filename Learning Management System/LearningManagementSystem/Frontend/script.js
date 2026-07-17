// ==========================================================================
// LMS Global Logic and Fetch API Integrations
// ==========================================================================

const API_BASE = "http://localhost:8000";

// --- Session Helpers ---
function getCurrentUser() {
    const userStr = localStorage.getItem("lms_user");
    return userStr ? JSON.parse(userStr) : null;
}

function getRole() {
    return localStorage.getItem("lms_role"); // 'student' or 'admin'
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function checkAuthentication(requiredRole = null) {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }
    if (requiredRole && getRole() !== requiredRole) {
        alert("Unauthorized access!");
        window.location.href = "index.html";
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_role");
    window.location.href = "index.html";
}

// --- Dynamic Navbar Renderer ---
function renderNavbar() {
    const header = document.querySelector("header");
    if (!header) return;

    const user = getCurrentUser();
    const role = getRole();

    let navLinksHTML = `<li><a href="index.html" class="nav-link" id="nav-home">Home</a></li>`;
    let userSectionHTML = "";

    if (!user) {
        navLinksHTML += `
            <li><a href="courses.html" class="nav-link" id="nav-courses">Courses</a></li>
            <li><a href="login.html" class="nav-btn nav-link" id="nav-login">Sign In</a></li>
            <li><a href="register.html" class="nav-btn" style="background:transparent;border:1px solid var(--primary);color:var(--primary);margin-left:0.5rem;" id="nav-register">Register</a></li>
        `;
    } else if (role === "admin") {
        navLinksHTML += `
            <li><a href="admin.html" class="nav-link" id="nav-admin">Admin Panel</a></li>
        `;
        userSectionHTML = `
            <div class="user-identity">
                <div class="user-avatar">A</div>
                <span class="user-name">Administrator</span>
            </div>
            <li><button onclick="logout()" class="nav-btn logout-btn" style="margin-left:1rem;">Logout</button></li>
        `;
    } else {
        // Student Logged In
        navLinksHTML += `
            <li><a href="courses.html" class="nav-link" id="nav-courses">Browse Courses</a></li>
            <li><a href="enrollments.html" class="nav-link" id="nav-enrollments">My Courses</a></li>
            <li><a href="assignments.html" class="nav-link" id="nav-assignments">My Tasks</a></li>
            <li><a href="dashboard.html" class="nav-link" id="nav-dashboard">Dashboard</a></li>
        `;
        
        const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : "S";
        userSectionHTML = `
            <div class="user-identity">
                <div class="user-avatar">${initial}</div>
                <span class="user-name">${user.full_name}</span>
            </div>
            <li><button onclick="logout()" class="nav-btn logout-btn" style="margin-left:1rem;">Logout</button></li>
        `;
    }

    header.innerHTML = `
        <div class="nav-container">
            <a href="index.html" class="logo-container">
                <span class="logo-icon">▲</span>
                <span class="logo-text">AURA ACADEMY</span>
            </a>
            <ul class="nav-menu">
                ${navLinksHTML}
                ${userSectionHTML}
            </ul>
        </div>
    `;

    // Highlight active link
    const path = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach(link => {
        if (path.includes(link.getAttribute("href"))) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

// --- Custom fetch wrapper to handle JSON and errors ---
async function apiFetch(endpoint, method = "GET", body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.detail || `HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Fetch error on ${endpoint}:`, error);
        throw error;
    }
}

// ==========================================
// Page Specific Initializers
// ==========================================

// --- 1. Home Page ---
async function initHomePage() {
    try {
        const courses = await apiFetch("/courses/");
        const grid = document.getElementById("featured-courses-grid");
        if (!grid) return;

        grid.innerHTML = "";
        // Show up to 3 featured courses
        courses.slice(0, 3).forEach(c => {
            grid.innerHTML += renderCourseCardHTML(c);
        });
    } catch (e) {
        console.error("Failed to load featured courses", e);
    }
}

// --- Helper to render Course Card ---
function renderCourseCardHTML(course) {
    const badgeClass = `badge-${course.level.toLowerCase()}`;
    const user = getCurrentUser();
    const role = getRole();
    let enrollBtn = "";

    if (role !== "admin") {
        enrollBtn = `<button onclick="enrollInCourse('${course.course_name.replace(/'/g, "\\'")}')" class="nav-btn btn-full" style="text-align:center;justify-content:center;">Enroll Now</button>`;
    }

    return `
        <div class="glass-card course-card">
            <span class="course-badge ${badgeClass}">${course.level}</span>
            <div class="course-cat">${course.category}</div>
            <h3 class="course-title">${course.course_name}</h3>
            <div class="course-info">
                <div class="course-info-item">👤 Instructor: <strong>${course.instructor_name}</strong></div>
                <div class="course-info-item">⏱ Duration: <strong>${course.duration}</strong></div>
            </div>
            <div class="course-price-row">
                <div class="course-price">₹${parseFloat(course.price).toLocaleString('en-IN')}</div>
                ${enrollBtn}
            </div>
        </div>
    `;
}

// Enrollment logic from course card
async function enrollInCourse(courseName) {
    if (!isLoggedIn()) {
        alert("Please login first to enroll in courses.");
        window.location.href = "login.html";
        return;
    }
    const student = getCurrentUser();
    
    // Check if student already enrolled in this course
    try {
        const enrollments = await apiFetch(`/enrollments/?student_name=${encodeURIComponent(student.full_name)}`);
        const alreadyEnrolled = enrollments.some(e => e.course_name === courseName);
        if (alreadyEnrolled) {
            alert("You are already enrolled in this course!");
            window.location.href = "enrollments.html";
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newEnrollment = {
            student_name: student.full_name,
            course_name: courseName,
            enrollment_date: today,
            payment_status: "Pending",
            course_status: "Active"
        };
        await apiFetch("/enrollments/add/", "POST", newEnrollment);
        alert(`Successfully enrolled in ${courseName}! Proceed to pay for your course.`);
        window.location.href = "enrollments.html";
    } catch (err) {
        alert("Enrollment failed: " + err.message);
    }
}

// --- 2. Login Page ---
function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    // Role switcher
    let currentRole = "student";
    const studentOpt = document.getElementById("role-student");
    const adminOpt = document.getElementById("role-admin");

    if (studentOpt && adminOpt) {
        studentOpt.addEventListener("click", () => {
            currentRole = "student";
            studentOpt.classList.add("active");
            adminOpt.classList.remove("active");
        });
        adminOpt.addEventListener("click", () => {
            currentRole = "admin";
            adminOpt.classList.add("active");
            studentOpt.classList.remove("active");
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await apiFetch("/login/", "POST", {
                email: email,
                password: password,
                role: currentRole
            });
            
            localStorage.setItem("lms_user", JSON.stringify(response.user));
            localStorage.setItem("lms_role", response.role);
            
            alert("Login Successful!");
            if (response.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            alert(error.message);
        }
    });
}

// --- 3. Register Page ---
function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const full_name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        const phone = document.getElementById("reg-phone").value;
        const qualification = document.getElementById("reg-qualification").value;
        const password = document.getElementById("reg-password").value;

        try {
            await apiFetch("/students/add/", "POST", {
                full_name, email, phone, qualification, password
            });
            alert("Registration successful! Please log in.");
            window.location.href = "login.html";
        } catch (error) {
            alert("Registration failed: " + error.message);
        }
    });
}

// --- 4. Courses Browsing (Search & Filter - Bonus) ---
let allCourses = [];
async function initCoursesPage() {
    try {
        allCourses = await apiFetch("/courses/");
        renderCourses(allCourses);

        // Filters listeners
        const searchInput = document.getElementById("course-search");
        const categorySelect = document.getElementById("course-category");
        const levelSelect = document.getElementById("course-level");

        const applyFilters = () => {
            const query = searchInput.value.toLowerCase();
            const cat = categorySelect.value;
            const lvl = levelSelect.value;

            const filtered = allCourses.filter(c => {
                const matchSearch = c.course_name.toLowerCase().includes(query) || 
                                    c.instructor_name.toLowerCase().includes(query);
                const matchCat = cat === "all" || c.category === cat;
                const matchLvl = lvl === "all" || c.level === lvl;
                return matchSearch && matchCat && matchLvl;
            });
            renderCourses(filtered);
        };

        if (searchInput) searchInput.addEventListener("input", applyFilters);
        if (categorySelect) categorySelect.addEventListener("change", applyFilters);
        if (levelSelect) levelSelect.addEventListener("change", applyFilters);

        // Prepopulate unique categories
        const categories = ["all", ...new Set(allCourses.map(c => c.category))];
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat === "all" ? "All Categories" : cat}</option>`
            ).join("");
        }

    } catch (e) {
        console.error("Failed to load courses page", e);
    }
}

function renderCourses(courses) {
    const container = document.getElementById("courses-list-grid");
    if (!container) return;
    if (courses.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No courses found matching criteria.</div>`;
        return;
    }
    container.innerHTML = courses.map(c => renderCourseCardHTML(c)).join("");
}

// --- 5. Enrollments Page (My Courses, Payment, Certificate Generation - Bonus) ---
async function initEnrollmentsPage() {
    if (!checkAuthentication("student")) return;
    const student = getCurrentUser();

    try {
        const enrollments = await apiFetch(`/enrollments/?student_name=${encodeURIComponent(student.full_name)}`);
        const list = document.getElementById("enrollments-list");
        if (!list) return;

        if (enrollments.length === 0) {
            list.innerHTML = `<div class="glass-card" style="text-align:center;color:var(--text-secondary);">You have not enrolled in any courses yet. <a href="courses.html" style="color:var(--primary);">Browse courses</a></div>`;
            return;
        }

        // Fetch assignments to calculate course completion percentages
        const assignments = await apiFetch(`/assignments/?student_name=${encodeURIComponent(student.full_name)}`);

        list.innerHTML = "";
        enrollments.forEach(e => {
            // Find assignments for this specific course to compute progress percentage
            const courseAssignments = assignments.filter(a => a.course_name === e.course_name);
            const totalAssigns = courseAssignments.length;
            const completedAssigns = courseAssignments.filter(a => a.status === "Submitted" || a.status === "Evaluated").length;
            
            // Calculate progress: if no assignments, base it on course_status (completed = 100%, active = 20%)
            let progressPercent = 0;
            if (e.course_status === "Completed") {
                progressPercent = 100;
            } else if (totalAssigns > 0) {
                progressPercent = Math.round((completedAssigns / totalAssigns) * 100);
            } else {
                progressPercent = 15; // default starting progress
            }

            let statusHTML = `<span class="status-pill status-${e.course_status.toLowerCase()}">${e.course_status}</span>`;
            let paymentHTML = `<span class="status-pill status-${e.payment_status.toLowerCase()}">${e.payment_status}</span>`;
            
            // Action button logic
            let actionBtnHTML = "";
            if (e.payment_status === "Pending") {
                actionBtnHTML = `<button onclick="payEnrollment(${e.enrollment_id})" class="nav-btn btn-small" style="background:var(--accent-emerald);">Pay Fees</button>`;
            } else if (e.course_status === "Active") {
                actionBtnHTML = `<button onclick="completeCourse(${e.enrollment_id}, '${e.course_name.replace(/'/g, "\\'")}')" class="nav-btn btn-small" style="background:var(--primary);">Mark Completed</button>`;
            } else if (e.course_status === "Completed") {
                const todayStr = new Date().toLocaleDateString();
                actionBtnHTML = `<button onclick="downloadPdfCertificate('${student.full_name.replace(/'/g, "\\'")}', '${e.course_name.replace(/'/g, "\\'")}', '${todayStr}')" class="nav-btn btn-small" style="background:var(--secondary);">Download Certificate</button>`;
            }

            list.innerHTML += `
                <div class="glass-card" style="margin-bottom:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h3 style="font-family:var(--font-heading); font-size:1.3rem; margin-bottom:0.3rem;">${e.course_name}</h3>
                            <div style="color:var(--text-secondary); font-size:0.85rem;">Enrolled: ${e.enrollment_date}</div>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            Payment: ${paymentHTML}
                            Course: ${statusHTML}
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>Course Progress (Bonus Calculated)</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width:${progressPercent}%;"></div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid var(--border-glass); padding-top:1rem;">
                        ${actionBtnHTML}
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Failed to load enrollments", e);
    }
}

async function payEnrollment(id) {
    if (confirm("Proceed to simulate payment of course fees?")) {
        try {
            await apiFetch(`/enrollments/update/${id}/`, "PUT", { payment_status: "Paid" });
            alert("Payment successful!");
            window.location.reload();
        } catch (e) {
            alert("Payment failed: " + e.message);
        }
    }
}

async function completeCourse(id, courseName) {
    if (confirm(`Congratulations on completing all modules of ${courseName}! Mark as complete?`)) {
        try {
            await apiFetch(`/enrollments/update/${id}/`, "PUT", { course_status: "Completed" });
            alert("Course Completed! You can now download your completion certificate.");
            window.location.reload();
        } catch (e) {
            alert("Status update failed: " + e.message);
        }
    }
}

// Generate premium custom PDF (Bonus)
function downloadPdfCertificate(studentName, courseName, date) {
    if (!window.jspdf) {
        alert("Certificate generation library is loading, please wait...");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [600, 400]
    });

    // Dark layout style
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, 600, 400, 'F');

    // Double elegant borders
    doc.setDrawColor(245, 158, 11); // Amber
    doc.setLineWidth(3);
    doc.rect(20, 20, 560, 360);
    doc.setLineWidth(1);
    doc.rect(25, 25, 550, 350);

    // Accent header lines
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(2);
    doc.line(120, 85, 480, 85);
    doc.line(120, 320, 480, 320);

    // Typography setup
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(28);
    doc.text("CERTIFICATE OF COMPLETION", 300, 65, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(14);
    doc.text("THIS IS PROUDLY PRESENTED TO", 300, 120, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text(studentName, 300, 160, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(12);
    doc.text("for successfully meeting all academic demands and completing the curriculum in", 300, 200, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246); // Purple
    doc.setFontSize(20);
    doc.text(courseName, 300, 230, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(12);
    doc.text(`Given this day: ${date} | AURA Academy Online Platform`, 300, 270, { align: "center" });

    // Decorative golden emblem star
    doc.setFont("zapfdingbats", "normal");
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(28);
    doc.text("H", 300, 310, { align: "center" }); // Ribbon/star icon representation in dingbats or font

    // Signatures
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.line(100, 340, 220, 340);
    doc.text("Academy Director", 160, 352, { align: "center" });

    doc.line(380, 340, 500, 340);
    doc.text("Course Instructor", 440, 352, { align: "center" });

    doc.save(`Certificate_${courseName.replace(/\s+/g, '_')}.pdf`);
}

// --- 6. Assignments Page (Submission management) ---
async function initAssignmentsPage() {
    if (!checkAuthentication("student")) return;
    const student = getCurrentUser();

    try {
        const assignments = await apiFetch(`/assignments/?student_name=${encodeURIComponent(student.full_name)}`);
        const list = document.getElementById("assignments-list");
        if (!list) return;

        if (assignments.length === 0) {
            // Seed a dynamic task if none exist, so student has something to submit
            list.innerHTML = `
                <div class="glass-card" style="text-align:center;color:var(--text-secondary);">
                    No tasks assigned to you. Instructors will create tasks once you register!
                    <button onclick="seedStudentDemoTask()" class="nav-btn btn-small" style="margin-top:1rem;">Add Practice Task</button>
                </div>`;
            return;
        }

        list.innerHTML = assignments.map(a => {
            const statusClass = `status-${a.status.toLowerCase()}`;
            let marksStr = a.marks > 0 ? `${a.marks} / 100` : "Not evaluated";
            
            let submitBtnHTML = "";
            if (a.status === "Pending") {
                submitBtnHTML = `<button onclick="submitAssignmentTask(${a.assignment_id})" class="nav-btn btn-small" style="background:var(--primary);">Submit Task</button>`;
            } else {
                submitBtnHTML = `<span style="font-size:0.85rem;color:var(--text-muted);">Submitted successfully</span>`;
            }

            return `
                <div class="glass-card" style="margin-bottom:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <span class="course-cat">${a.course_name}</span>
                            <h3 style="font-family:var(--font-heading); font-size:1.3rem; margin-top:0.3rem;">${a.assignment_title}</h3>
                        </div>
                        <div>
                            <span class="status-pill ${statusClass}">${a.status}</span>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; border-top:1px solid var(--border-glass); padding-top:1rem; align-items:center;">
                        <div>📅 Due/Submitted: <strong>${a.submission_date}</strong></div>
                        <div>Marks Obtained: <strong style="color:var(--accent-emerald); font-size:1.1rem;">${marksStr}</strong></div>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                        ${submitBtnHTML}
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error("Failed to load assignments", e);
    }
}

async function seedStudentDemoTask() {
    const student = getCurrentUser();
    const demo = {
        course_name: "Python Full Stack",
        student_name: student.full_name,
        assignment_title: "Build LMS views.py controllers",
        submission_date: new Date().toISOString().split('T')[0],
        marks: 0,
        status: "Pending"
    };
    try {
        await apiFetch("/assignments/add/", "POST", demo);
        alert("Demo assignment added! Click submit once ready.");
        window.location.reload();
    } catch(err) {
        alert(err.message);
    }
}

async function submitAssignmentTask(id) {
    if (confirm("Submit code file links for this assignment task?")) {
        try {
            await apiFetch(`/assignments/update/${id}/`, "PUT", {
                status: "Submitted",
                submission_date: new Date().toISOString().split('T')[0]
            });
            alert("Assignment submitted successfully!");
            window.location.reload();
        } catch (e) {
            alert(e.message);
        }
    }
}

// --- 7. Student Dashboard (Calculations & overall progress tracker - Bonus) ---
async function initDashboardPage() {
    if (!checkAuthentication("student")) return;
    const student = getCurrentUser();

    try {
        // Fetch enrollments
        const enrollments = await apiFetch(`/enrollments/?student_name=${encodeURIComponent(student.full_name)}`);
        // Fetch assignments
        const assignments = await apiFetch(`/assignments/?student_name=${encodeURIComponent(student.full_name)}`);

        // Compute numbers
        const totalCourses = enrollments.length;
        const activeCourses = enrollments.filter(e => e.course_status === "Active").length;
        const completedCourses = enrollments.filter(e => e.course_status === "Completed").length;

        // Assignments details
        const totalTasks = assignments.length;
        const pendingTasks = assignments.filter(a => a.status === "Pending").length;
        const completedTasks = assignments.filter(a => a.status === "Submitted" || a.status === "Evaluated").length;

        // Render card numbers
        document.getElementById("total-courses").innerText = totalCourses;
        document.getElementById("active-courses").innerText = activeCourses;
        document.getElementById("completed-courses").innerText = completedCourses;
        document.getElementById("completed-assignments").innerText = `${completedTasks}/${totalTasks}`;

        // Overall progress calculations (Bonus - Student Progress Bar)
        let overallProgress = 0;
        if (totalCourses > 0) {
            let sumPercent = 0;
            enrollments.forEach(e => {
                if (e.course_status === "Completed") {
                    sumPercent += 100;
                } else {
                    const courseAssigns = assignments.filter(a => a.course_name === e.course_name);
                    const courseTotal = courseAssigns.length;
                    const courseCompleted = courseAssigns.filter(a => a.status === "Submitted" || a.status === "Evaluated").length;
                    if (courseTotal > 0) {
                        sumPercent += (courseCompleted / courseTotal) * 100;
                    } else {
                        sumPercent += 20; // active status baseline
                    }
                }
            });
            overallProgress = Math.round(sumPercent / totalCourses);
        }

        // Render overall progress bar
        document.getElementById("overall-progress-text").innerText = `${overallProgress}%`;
        document.getElementById("overall-progress-fill").style.width = `${overallProgress}%`;

        // Render task summary status lists
        const taskSummary = document.getElementById("dashboard-tasks-summary");
        if (taskSummary) {
            if (assignments.length === 0) {
                taskSummary.innerHTML = `<li style="color:var(--text-secondary);">No outstanding assignments.</li>`;
            } else {
                taskSummary.innerHTML = assignments.map(a => `
                    <li style="display:flex; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                        <span>${a.assignment_title}</span>
                        <span class="status-pill status-${a.status.toLowerCase()}">${a.status}</span>
                    </li>
                `).join("");
            }
        }

    } catch (e) {
        console.error("Dashboard init error", e);
    }
}

// --- 8. Admin CRUD Dashboard Panel ---
let activeTab = "students";
let editId = null; // Stored ID if editing

function initAdminPage() {
    if (!checkAuthentication("admin")) return;

    // Hook tab button clicks
    const tabs = ["students", "instructors", "courses", "enrollments", "assignments"];
    tabs.forEach(tab => {
        const btn = document.getElementById(`tab-btn-${tab}`);
        if (btn) {
            btn.addEventListener("click", () => {
                activeTab = tab;
                tabs.forEach(t => document.getElementById(`tab-btn-${t}`).classList.remove("active"));
                btn.classList.add("active");
                loadAdminData();
            });
        }
    });

    // Close modal actions
    const modal = document.getElementById("admin-modal");
    const closeBtn = document.querySelector(".modal-close");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Modal submit handler
    const form = document.getElementById("admin-form");
    if (form) {
        form.addEventListener("submit", handleAdminFormSubmit);
    }

    // Load initial data
    loadAdminData();
}

async function loadAdminData() {
    const tableHeader = document.getElementById("table-header-row");
    const tableBody = document.getElementById("table-body");
    const tabTitle = document.getElementById("admin-tab-title");

    if (!tableHeader || !tableBody || !tabTitle) return;

    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary);">Loading list...</td></tr>`;

    try {
        const data = await apiFetch(`/${activeTab}/`);
        tableBody.innerHTML = "";

        if (activeTab === "students") {
            tabTitle.innerText = "Students Database";
            tableHeader.innerHTML = `
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Qualification</th>
                <th>Actions</th>
            `;
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No students registered.</td></tr>`;
                return;
            }
            data.forEach(s => {
                tableBody.innerHTML += `
                    <tr>
                        <td><strong>#${s.student_id}</strong></td>
                        <td>${s.full_name}</td>
                        <td>${s.email}</td>
                        <td>${s.phone}</td>
                        <td>${s.qualification}</td>
                        <td>
                            <div class="btn-action-group">
                                <button onclick="openEditModal('students', ${s.student_id})" class="nav-btn btn-small btn-edit">Edit</button>
                                <button onclick="deleteEntity('students', ${s.student_id})" class="nav-btn btn-small btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } 
        else if (activeTab === "instructors") {
            tabTitle.innerText = "Instructors Database";
            tableHeader.innerHTML = `
                <th>ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Experience (Yrs)</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
            `;
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No instructors registered.</td></tr>`;
                return;
            }
            data.forEach(i => {
                tableBody.innerHTML += `
                    <tr>
                        <td><strong>#${i.instructor_id}</strong></td>
                        <td>${i.instructor_name}</td>
                        <td>${i.specialization}</td>
                        <td>${i.experience}</td>
                        <td>${i.email}</td>
                        <td>${i.phone}</td>
                        <td>
                            <div class="btn-action-group">
                                <button onclick="openEditModal('instructors', ${i.instructor_id})" class="nav-btn btn-small btn-edit">Edit</button>
                                <button onclick="deleteEntity('instructors', ${i.instructor_id})" class="nav-btn btn-small btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } 
        else if (activeTab === "courses") {
            tabTitle.innerText = "Course Offerings";
            tableHeader.innerHTML = `
                <th>ID</th>
                <th>Course Name</th>
                <th>Instructor</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Level</th>
                <th>Actions</th>
            `;
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No courses active.</td></tr>`;
                return;
            }
            data.forEach(c => {
                const badgeClass = `badge-${c.level.toLowerCase()}`;
                tableBody.innerHTML += `
                    <tr>
                        <td><strong>#${c.course_id}</strong></td>
                        <td>${c.course_name}</td>
                        <td>${c.instructor_name}</td>
                        <td>${c.category}</td>
                        <td>${c.duration}</td>
                        <td>₹${parseFloat(c.price).toLocaleString('en-IN')}</td>
                        <td><span class="status-pill ${badgeClass}">${c.level}</span></td>
                        <td>
                            <div class="btn-action-group">
                                <button onclick="openEditModal('courses', ${c.course_id})" class="nav-btn btn-small btn-edit">Edit</button>
                                <button onclick="deleteEntity('courses', ${c.course_id})" class="nav-btn btn-small btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } 
        else if (activeTab === "enrollments") {
            tabTitle.innerText = "Enrollments / Registrations";
            tableHeader.innerHTML = `
                <th>ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Date Enrolled</th>
                <th>Payment Status</th>
                <th>Course Status</th>
                <th>Actions</th>
            `;
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No course enrollments yet.</td></tr>`;
                return;
            }
            data.forEach(e => {
                tableBody.innerHTML += `
                    <tr>
                        <td><strong>#${e.enrollment_id}</strong></td>
                        <td>${e.student_name}</td>
                        <td>${e.course_name}</td>
                        <td>${e.enrollment_date}</td>
                        <td><span class="status-pill status-${e.payment_status.toLowerCase()}">${e.payment_status}</span></td>
                        <td><span class="status-pill status-${e.course_status.toLowerCase()}">${e.course_status}</span></td>
                        <td>
                            <div class="btn-action-group">
                                <button onclick="openEditModal('enrollments', ${e.enrollment_id})" class="nav-btn btn-small btn-edit">Edit</button>
                                <button onclick="deleteEntity('enrollments', ${e.enrollment_id})" class="nav-btn btn-small btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } 
        else if (activeTab === "assignments") {
            tabTitle.innerText = "Assignment Submissions";
            tableHeader.innerHTML = `
                <th>ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Task Title</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Actions</th>
            `;
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No student assignments assigned/submitted.</td></tr>`;
                return;
            }
            data.forEach(a => {
                const statusClass = `status-${a.status.toLowerCase()}`;
                tableBody.innerHTML += `
                    <tr>
                        <td><strong>#${a.assignment_id}</strong></td>
                        <td>${a.student_name}</td>
                        <td>${a.course_name}</td>
                        <td>${a.assignment_title}</td>
                        <td>${a.submission_date}</td>
                        <td><strong>${a.marks}</strong> / 100</td>
                        <td><span class="status-pill ${statusClass}">${a.status}</span></td>
                        <td>
                            <div class="btn-action-group">
                                <button onclick="openEditModal('assignments', ${a.assignment_id})" class="nav-btn btn-small btn-edit">Evaluate / Edit</button>
                                <button onclick="deleteEntity('assignments', ${a.assignment_id})" class="nav-btn btn-small btn-delete">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--accent-rose);padding:2rem;">Error fetching data: ${e.message}</td></tr>`;
    }
}

// Open modal for adding new item
function openCreateModal() {
    editId = null;
    document.getElementById("modal-title").innerText = `Add New ${activeTab.slice(0,-1).toUpperCase()}`;
    const fieldsContainer = document.getElementById("modal-fields");
    fieldsContainer.innerHTML = generateFormFieldsHTML(activeTab);
    
    // Show modal
    document.getElementById("admin-modal").style.display = "flex";
}

// Open modal for editing existing item
async function openEditModal(entity, id) {
    editId = id;
    document.getElementById("modal-title").innerText = `Edit ${entity.slice(0,-1).toUpperCase()} #${id}`;
    const fieldsContainer = document.getElementById("modal-fields");
    
    fieldsContainer.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-secondary);">Loading existing details...</div>`;
    document.getElementById("admin-modal").style.display = "flex";

    try {
        const allItems = await apiFetch(`/${entity}/`);
        const item = allItems.find(i => {
            const itemKey = `${entity.slice(0,-1)}_id`;
            return parseInt(i[itemKey]) === id;
        });

        if (!item) {
            alert("Record details not found.");
            document.getElementById("admin-modal").style.display = "none";
            return;
        }

        fieldsContainer.innerHTML = generateFormFieldsHTML(entity, item);
    } catch (e) {
        alert("Failed to load details: " + e.message);
        document.getElementById("admin-modal").style.display = "none";
    }
}

// Generate HTML elements depending on tab
function generateFormFieldsHTML(entity, data = {}) {
    if (entity === "students") {
        return `
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="admin-field-name" value="${data.full_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="admin-field-email" value="${data.email || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="text" class="form-input" id="admin-field-phone" value="${data.phone || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Qualification</label>
                <input type="text" class="form-input" id="admin-field-qualification" value="${data.qualification || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" id="admin-field-password" value="${data.password || ''}" required>
            </div>
        `;
    } 
    else if (entity === "instructors") {
        return `
            <div class="form-group">
                <label class="form-label">Instructor Name</label>
                <input type="text" class="form-input" id="admin-field-name" value="${data.instructor_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Specialization</label>
                <input type="text" class="form-input" id="admin-field-specialization" value="${data.specialization || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Experience (Years)</label>
                <input type="number" class="form-input" id="admin-field-experience" value="${data.experience || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="admin-field-email" value="${data.email || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="text" class="form-input" id="admin-field-phone" value="${data.phone || ''}" required>
            </div>
        `;
    } 
    else if (entity === "courses") {
        return `
            <div class="form-group">
                <label class="form-label">Course Name</label>
                <input type="text" class="form-input" id="admin-field-name" value="${data.course_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Instructor Name</label>
                <input type="text" class="form-input" id="admin-field-instructor" value="${data.instructor_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <input type="text" class="form-input" id="admin-field-category" value="${data.category || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Duration</label>
                <input type="text" class="form-input" id="admin-field-duration" value="${data.duration || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Price (INR)</label>
                <input type="number" class="form-input" id="admin-field-price" value="${data.price || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Level</label>
                <select class="form-input select-filter" id="admin-field-level" style="width:100%;">
                    <option value="Beginner" ${data.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                    <option value="Intermediate" ${data.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                    <option value="Advanced" ${data.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
                </select>
            </div>
        `;
    } 
    else if (entity === "enrollments") {
        return `
            <div class="form-group">
                <label class="form-label">Student Name</label>
                <input type="text" class="form-input" id="admin-field-student" value="${data.student_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Course Name</label>
                <input type="text" class="form-input" id="admin-field-course" value="${data.course_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Date (YYYY-MM-DD)</label>
                <input type="date" class="form-input" id="admin-field-date" value="${data.enrollment_date || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Payment Status</label>
                <select class="form-input select-filter" id="admin-field-payment" style="width:100%;">
                    <option value="Paid" ${data.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Pending" ${data.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Course Status</label>
                <select class="form-input select-filter" id="admin-field-status" style="width:100%;">
                    <option value="Active" ${data.course_status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Completed" ${data.course_status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${data.course_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        `;
    } 
    else if (entity === "assignments") {
        return `
            <div class="form-group">
                <label class="form-label">Course Name</label>
                <input type="text" class="form-input" id="admin-field-course" value="${data.course_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Student Name</label>
                <input type="text" class="form-input" id="admin-field-student" value="${data.student_name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Task Title</label>
                <input type="text" class="form-input" id="admin-field-title" value="${data.assignment_title || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Submission Date (YYYY-MM-DD)</label>
                <input type="date" class="form-input" id="admin-field-date" value="${data.submission_date || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Marks Obtained (Out of 100)</label>
                <input type="number" class="form-input" id="admin-field-marks" value="${data.marks || 0}" min="0" max="100" required>
            </div>
            <div class="form-group">
                <label class="form-label">Assignment Status</label>
                <select class="form-input select-filter" id="admin-field-status" style="width:100%;">
                    <option value="Pending" ${data.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Submitted" ${data.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                    <option value="Evaluated" ${data.status === 'Evaluated' ? 'selected' : ''}>Evaluated</option>
                </select>
            </div>
        `;
    }
}

// Handle add / edit form submit
async function handleAdminFormSubmit(e) {
    e.preventDefault();
    const payload = {};
    
    try {
        if (activeTab === "students") {
            payload.full_name = document.getElementById("admin-field-name").value;
            payload.email = document.getElementById("admin-field-email").value;
            payload.phone = document.getElementById("admin-field-phone").value;
            payload.qualification = document.getElementById("admin-field-qualification").value;
            payload.password = document.getElementById("admin-field-password").value;
        } 
        else if (activeTab === "instructors") {
            payload.instructor_name = document.getElementById("admin-field-name").value;
            payload.specialization = document.getElementById("admin-field-specialization").value;
            payload.experience = parseInt(document.getElementById("admin-field-experience").value);
            payload.email = document.getElementById("admin-field-email").value;
            payload.phone = document.getElementById("admin-field-phone").value;
        } 
        else if (activeTab === "courses") {
            payload.course_name = document.getElementById("admin-field-name").value;
            payload.instructor_name = document.getElementById("admin-field-instructor").value;
            payload.category = document.getElementById("admin-field-category").value;
            payload.duration = document.getElementById("admin-field-duration").value;
            payload.price = parseFloat(document.getElementById("admin-field-price").value);
            payload.level = document.getElementById("admin-field-level").value;
        } 
        else if (activeTab === "enrollments") {
            payload.student_name = document.getElementById("admin-field-student").value;
            payload.course_name = document.getElementById("admin-field-course").value;
            payload.enrollment_date = document.getElementById("admin-field-date").value;
            payload.payment_status = document.getElementById("admin-field-payment").value;
            payload.course_status = document.getElementById("admin-field-status").value;
        } 
        else if (activeTab === "assignments") {
            payload.course_name = document.getElementById("admin-field-course").value;
            payload.student_name = document.getElementById("admin-field-student").value;
            payload.assignment_title = document.getElementById("admin-field-title").value;
            payload.submission_date = document.getElementById("admin-field-date").value;
            payload.marks = parseInt(document.getElementById("admin-field-marks").value);
            payload.status = document.getElementById("admin-field-status").value;
        }

        if (editId) {
            // Put/Update
            await apiFetch(`/${activeTab}/update/${editId}/`, "PUT", payload);
            alert("Details updated successfully!");
        } else {
            // Post/Add
            await apiFetch(`/${activeTab}/add/`, "POST", payload);
            alert("New record added successfully!");
        }

        // Hide modal and refresh data
        document.getElementById("admin-modal").style.display = "none";
        loadAdminData();

    } catch (err) {
        alert("Operation failed: " + err.message);
    }
}

// Delete Record
async function deleteEntity(entity, id) {
    if (confirm(`Are you absolutely sure you want to delete ${entity.slice(0,-1)} #${id}?`)) {
        try {
            await apiFetch(`/${entity}/delete/${id}/`, "DELETE");
            alert("Record deleted successfully.");
            loadAdminData();
        } catch (e) {
            alert("Deletion failed: " + e.message);
        }
    }
}

// Global Exports
window.payEnrollment = payEnrollment;
window.completeCourse = completeCourse;
window.downloadPdfCertificate = downloadPdfCertificate;
window.submitAssignmentTask = submitAssignmentTask;
window.seedStudentDemoTask = seedStudentDemoTask;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.deleteEntity = deleteEntity;
window.logout = logout;

// --- Global DOM Router mapping ---
document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    const path = window.location.pathname;
    
    if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
        initHomePage();
    } else if (path.endsWith("login.html")) {
        initLoginPage();
    } else if (path.endsWith("register.html")) {
        initRegisterPage();
    } else if (path.endsWith("courses.html")) {
        initCoursesPage();
    } else if (path.endsWith("enrollments.html")) {
        initEnrollmentsPage();
    } else if (path.endsWith("assignments.html")) {
        initAssignmentsPage();
    } else if (path.endsWith("dashboard.html")) {
        initDashboardPage();
    } else if (path.endsWith("admin.html")) {
        initAdminPage();
    }
});

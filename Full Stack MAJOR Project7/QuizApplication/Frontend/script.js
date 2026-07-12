const API_BASE = 'http://127.0.0.1:8000';

// Global state
let currentStudent = null;
let isAdmin = false;

// Toast Notifications helper
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Global API fetch wrapper
async function apiFetch(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Load and persist sessions
function initSession() {
    const studentData = localStorage.getItem('student_session');
    if (studentData) {
        currentStudent = JSON.parse(studentData);
    }
    isAdmin = localStorage.getItem('admin_session') === 'true';
    updateNavbar();
}

function updateNavbar() {
    const navRight = document.getElementById('nav-right');
    if (!navRight) return;
    
    if (isAdmin) {
        navRight.innerHTML = `
            <li><a href="admin.html" class="active">Admin Panel</a></li>
            <li><button class="btn btn-secondary" onclick="handleLogout()">Logout</button></li>
        `;
    } else if (currentStudent) {
        navRight.innerHTML = `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li style="color: var(--text-secondary); font-weight: 500;">Hi, ${currentStudent.full_name}</li>
            <li><button class="btn btn-secondary" onclick="handleLogout()">Logout</button></li>
        `;
    } else {
        navRight.innerHTML = `
            <li><a href="login.html" class="btn btn-secondary">Login</a></li>
            <li><a href="register.html" class="btn btn-primary">Register</a></li>
        `;
    }
}

function handleLogout() {
    localStorage.removeItem('student_session');
    localStorage.removeItem('admin_session');
    currentStudent = null;
    isAdmin = false;
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Get helper formatted date
function getFormattedDateTime() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}


// ==========================================
// PAGE SPECIFIC SCRIPTS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initSession();
    
    // HOME PAGE
    if (document.getElementById('home-page')) {
        loadFeaturedQuizzes();
    }
    
    // LOGIN PAGE
    if (document.getElementById('login-page')) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // REGISTER PAGE
    if (document.getElementById('register-page')) {
        const registerForm = document.getElementById('registerForm');
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // STUDENT DASHBOARD PAGE
    if (document.getElementById('dashboard-page')) {
        if (!currentStudent) {
            window.location.href = 'login.html';
            return;
        }
        loadDashboardQuizzes();
        loadStudentHistory();
    }
    
    // PLAY QUIZ PAGE
    if (document.getElementById('quiz-page')) {
        if (!currentStudent) {
            window.location.href = 'login.html';
            return;
        }
        initQuizPlay();
    }
    
    // RESULT PAGE
    if (document.getElementById('result-page')) {
        if (!currentStudent) {
            window.location.href = 'login.html';
            return;
        }
        loadResultDetails();
    }
    
    // ADMIN PAGE
    if (document.getElementById('admin-page')) {
        if (!isAdmin) {
            window.location.href = 'login.html';
            return;
        }
        initAdminDashboard();
    }
});

// ================= HOME PAGE LOGIC =================

async function loadFeaturedQuizzes() {
    const grid = document.getElementById('featured-quizzes-grid');
    if (!grid) return;
    
    try {
        const quizzes = await apiFetch('/quizzes/');
        grid.innerHTML = '';
        
        // Show up to 3 quizzes as featured
        const featured = quizzes.slice(0, 3);
        if (featured.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No quizzes available currently.</div>';
            return;
        }
        
        featured.forEach(quiz => {
            grid.innerHTML += `
                <div class="glass-card quiz-card">
                    <div>
                        <div class="quiz-badge">${quiz.category}</div>
                        <h3>${quiz.quiz_title}</h3>
                    </div>
                    <div>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>📋</span> ${quiz.total_questions} Questions
                            </div>
                            <div class="quiz-meta-item">
                                <span>⏱️</span> ${quiz.duration} Mins
                            </div>
                        </div>
                        <button class="btn btn-primary" style="width: 100%;" onclick="startQuizFromCard('${quiz.quiz_title}', ${quiz.duration}, ${quiz.total_marks})">Attempt Quiz</button>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--danger);">Failed to load quizzes.</div>';
    }
}

function startQuizFromCard(title, duration, marks) {
    if (!currentStudent) {
        showToast('Please login to attempt the quiz!', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    sessionStorage.setItem('active_quiz_title', title);
    sessionStorage.setItem('active_quiz_duration', duration);
    sessionStorage.setItem('active_quiz_marks', marks);
    window.location.href = 'quiz.html';
}


// ================= AUTHENTICATION LOGIC =================

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    if (role === 'admin') {
        if (email === 'admin@quiz.com' && password === 'admin123') {
            localStorage.setItem('admin_session', 'true');
            showToast('Admin logged in successfully', 'success');
            setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
        } else {
            showToast('Invalid Admin Credentials', 'error');
        }
    } else {
        try {
            const students = await apiFetch('/students/');
            const student = students.find(s => s.email === email && s.password === password);
            if (student) {
                localStorage.setItem('student_session', JSON.stringify(student));
                showToast(`Welcome back, ${student.full_name}!`, 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } else {
                showToast('Invalid Email or Password', 'error');
            }
        } catch (err) {
            showToast('Login verification failed. Check server status.', 'error');
        }
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const college = document.getElementById('college').value.trim();
    const password = document.getElementById('password').value;
    
    const payload = {
        full_name: fullName,
        email: email,
        phone: phone,
        college: college,
        password: password
    };
    
    try {
        await apiFetch('/students/add/', 'POST', payload);
        showToast('Registration successful! Please login.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    } catch (err) {
        // Error toast shown in apiFetch
    }
}


// ================= STUDENT DASHBOARD LOGIC =================

async function loadDashboardQuizzes() {
    const grid = document.getElementById('dashboard-quizzes-grid');
    if (!grid) return;
    
    try {
        const quizzes = await apiFetch('/quizzes/');
        grid.innerHTML = '';
        
        if (quizzes.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No quizzes available at the moment.</div>';
            return;
        }
        
        quizzes.forEach(quiz => {
            grid.innerHTML += `
                <div class="glass-card quiz-card">
                    <div>
                        <div class="quiz-badge">${quiz.category}</div>
                        <h3>${quiz.quiz_title}</h3>
                    </div>
                    <div>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>📋</span> ${quiz.total_questions} Qs
                            </div>
                            <div class="quiz-meta-item">
                                <span>⏱️</span> ${quiz.duration} Mins
                            </div>
                            <div class="quiz-meta-item">
                                <span>🎯</span> ${quiz.total_marks} Marks
                            </div>
                        </div>
                        <button class="btn btn-primary" style="width: 100%;" onclick="startQuizFromCard('${quiz.quiz_title}', ${quiz.duration}, ${quiz.total_marks})">Start Quiz</button>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--danger);">Failed to load quizzes.</div>';
    }
}

async function loadStudentHistory() {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;
    
    try {
        const results = await apiFetch('/results/');
        const studentResults = results.filter(r => r.student_name === currentStudent.full_name);
        
        tableBody.innerHTML = '';
        if (studentResults.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">You have not attempted any quizzes yet.</td></tr>';
            return;
        }
        
        studentResults.forEach(res => {
            const badgeClass = res.result_status.toLowerCase() === 'pass' ? 'badge-pass' : 'badge-fail';
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight: 600;">${res.quiz_title}</td>
                    <td>${res.total_marks}</td>
                    <td>${res.obtained_marks}</td>
                    <td style="font-weight: 600; color: var(--accent);">${res.percentage}%</td>
                    <td><span class="results-status-badge ${badgeClass}" style="font-size: 0.8rem; padding: 0.2rem 0.8rem; margin-bottom:0;">${res.result_status}</span></td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="viewHistoryResult(${res.result_id})">Details</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load score history.</td></tr>';
    }
}

function viewHistoryResult(resultId) {
    localStorage.setItem('last_result_id', resultId);
    window.location.href = 'result.html';
}


// ================= QUIZ PLAY LOGIC =================

let quizQuestions = [];
let currentQuestionIdx = 0;
let selectedAnswers = {}; // Map of question_id -> option_text
let timerInterval = null;
let secondsRemaining = 0;

async function initQuizPlay() {
    const quizTitle = sessionStorage.getItem('active_quiz_title');
    const quizDuration = parseInt(sessionStorage.getItem('active_quiz_duration'));
    
    if (!quizTitle || !quizDuration) {
        showToast('No active quiz selected', 'error');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        return;
    }
    
    document.getElementById('active-quiz-title').textContent = quizTitle;
    
    try {
        const questions = await apiFetch('/questions/');
        quizQuestions = questions.filter(q => q.quiz_title === quizTitle);
        
        if (quizQuestions.length === 0) {
            showToast('This quiz has no questions yet!', 'info');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
            return;
        }
        
        secondsRemaining = quizDuration * 60;
        startQuizTimer();
        renderQuestion();
    } catch (e) {
        showToast('Error loading quiz questions', 'error');
    }
}

function startQuizTimer() {
    const timerDisplay = document.getElementById('timer-countdown');
    
    function updateDisplay() {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        if (secondsRemaining <= 10) {
            timerDisplay.parentElement.style.borderColor = 'var(--danger)';
            timerDisplay.parentElement.style.color = 'var(--danger)';
            timerDisplay.parentElement.style.background = 'rgba(244, 63, 94, 0.1)';
        }
        
        if (secondsRemaining <= 0) {
            clearInterval(timerInterval);
            showToast('Time expired! Submitting your answers automatically.', 'warning');
            submitQuizAttempt();
        }
        secondsRemaining--;
    }
    
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);
}

function renderQuestion() {
    const q = quizQuestions[currentQuestionIdx];
    
    // Update question progress indicators
    document.getElementById('current-question-num').textContent = currentQuestionIdx + 1;
    document.getElementById('total-questions-num').textContent = quizQuestions.length;
    
    // Set question text
    document.getElementById('question-text').textContent = q.question;
    
    // Render options list
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    const options = [q.option1, q.option2, q.option3, q.option4];
    const optionMarkers = ['A', 'B', 'C', 'D'];
    
    options.forEach((opt, idx) => {
        const isSelected = selectedAnswers[q.question_id] === opt;
        optionsContainer.innerHTML += `
            <div class="option-card ${isSelected ? 'selected' : ''}" onclick="selectOption(${q.question_id}, '${opt.replace(/'/g, "\\'")}')">
                <div class="option-marker">${optionMarkers[idx]}</div>
                <div class="option-text">${opt}</div>
            </div>
        `;
    });
    
    // Update button states
    document.getElementById('prev-btn').disabled = currentQuestionIdx === 0;
    
    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIdx === quizQuestions.length - 1) {
        nextBtn.style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        document.getElementById('submit-btn').style.display = 'none';
    }
}

function selectOption(questionId, optionValue) {
    selectedAnswers[questionId] = optionValue;
    renderQuestion();
}

function prevQuestion() {
    if (currentQuestionIdx > 0) {
        currentQuestionIdx--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIdx < quizQuestions.length - 1) {
        currentQuestionIdx++;
        renderQuestion();
    }
}

async function submitQuizAttempt() {
    clearInterval(timerInterval);
    
    const quizTitle = sessionStorage.getItem('active_quiz_title');
    const totalMarks = parseInt(sessionStorage.getItem('active_quiz_marks'));
    const submissionTime = getFormattedDateTime();
    
    let correctCount = 0;
    
    // 1. Post attempts sequentially and count correct options
    for (const q of quizQuestions) {
        const selected = selectedAnswers[q.question_id] || 'Unanswered';
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) {
            correctCount++;
        }
        
        const attemptData = {
            student_name: currentStudent.full_name,
            quiz_title: quizTitle,
            question: q.question,
            selected_answer: selected,
            submission_time: submissionTime
        };
        
        try {
            await apiFetch('/attempts/add/', 'POST', attemptData);
        } catch (e) {
            console.error('Error posting attempt for question:', q.question_id);
        }
    }
    
    // 2. Compute final result values
    const quizTotalQuestions = quizQuestions.length;
    const scoreFraction = correctCount / quizTotalQuestions;
    const obtainedMarks = Math.round(scoreFraction * totalMarks);
    const percentage = Math.round(scoreFraction * 100);
    const resultStatus = percentage >= 50 ? 'Pass' : 'Fail';
    
    const resultData = {
        student_name: currentStudent.full_name,
        quiz_title: quizTitle,
        total_marks: totalMarks,
        obtained_marks: obtainedMarks,
        percentage: percentage,
        result_status: resultStatus
    };
    
    try {
        const res = await apiFetch('/results/add/', 'POST', resultData);
        localStorage.setItem('last_result_id', res.result_id);
        showToast('Quiz submitted successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 1200);
    } catch (e) {
        showToast('Error recording overall quiz results', 'error');
    }
}


// ================= RESULT PAGE LOGIC =================

async function loadResultDetails() {
    const resultId = localStorage.getItem('last_result_id');
    if (!resultId) {
        showToast('No result details found', 'error');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        return;
    }
    
    try {
        const results = await apiFetch('/results/');
        const res = results.find(r => r.result_id == resultId);
        
        if (!res) {
            showToast('Result record does not exist', 'error');
            return;
        }
        
        // Update texts
        document.getElementById('res-student-name').textContent = res.student_name;
        document.getElementById('res-quiz-title').textContent = res.quiz_title;
        document.getElementById('res-marks-summary').textContent = `${res.obtained_marks} / ${res.total_marks}`;
        document.getElementById('res-percentage-text').textContent = `${res.percentage}%`;
        
        // Update Pass/Fail Status badge
        const badge = document.getElementById('res-status-badge');
        badge.textContent = res.result_status;
        badge.className = `results-status-badge ${res.result_status.toLowerCase() === 'pass' ? 'badge-pass' : 'badge-fail'}`;
        
        // Circular Gauge calculations
        const circumference = 2 * Math.PI * 90; // 565.48
        const progressStroke = document.getElementById('gauge-progress-stroke');
        const offset = circumference * (1 - res.percentage / 100);
        
        // Start animation after a short delay
        setTimeout(() => {
            progressStroke.style.strokeDashoffset = offset;
        }, 150);
        
    } catch (e) {
        showToast('Failed to load result statistics', 'error');
    }
}


// ==========================================
// ADMIN DASHBOARD & CRUD MANAGEMENT LOGIC
// ==========================================

let allStudents = [];
let allQuizzes = [];
let allQuestions = [];
let allResults = [];

function initAdminDashboard() {
    // Tab switching setup
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetSection = tab.dataset.tab;
            document.querySelectorAll('.admin-content-section').forEach(sec => {
                sec.classList.remove('active');
            });
            document.getElementById(`${targetSection}-section`).classList.add('active');
            
            // Reload specific tab data
            loadTabContent(targetSection);
        });
    });
    
    // Initial tab load
    loadTabContent('students');
}

function loadTabContent(tab) {
    if (tab === 'students') loadAdminStudents();
    if (tab === 'quizzes') loadAdminQuizzes();
    if (tab === 'questions') loadAdminQuestions();
    if (tab === 'results') loadAdminResults();
}

// 1. ADMIN STUDENTS CRUD

async function loadAdminStudents() {
    const tableBody = document.getElementById('admin-students-table-body');
    try {
        allStudents = await apiFetch('/students/');
        tableBody.innerHTML = '';
        
        allStudents.forEach(st => {
            tableBody.innerHTML += `
                <tr>
                    <td>${st.student_id}</td>
                    <td style="font-weight: 600;">${st.full_name}</td>
                    <td>${st.email}</td>
                    <td>${st.phone}</td>
                    <td>${st.college}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="openEditStudentModal(${st.student_id})">Edit</button>
                        <button class="btn btn-danger" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-left: 0.25rem;" onclick="deleteStudent(${st.student_id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load students database.</td></tr>';
    }
}

function openAddStudentModal() {
    document.getElementById('student-modal-title').textContent = 'Add Student';
    document.getElementById('student-id-group').style.display = 'block';
    document.getElementById('modal-student-id').value = '';
    document.getElementById('modal-student-id').disabled = false;
    document.getElementById('modal-student-name').value = '';
    document.getElementById('modal-student-email').value = '';
    document.getElementById('modal-student-phone').value = '';
    document.getElementById('modal-student-college').value = '';
    document.getElementById('modal-student-password').value = '';
    
    openModal('student-modal');
}

function openEditStudentModal(id) {
    const st = allStudents.find(s => s.student_id === id);
    if (!st) return;
    
    document.getElementById('student-modal-title').textContent = 'Edit Student';
    document.getElementById('student-id-group').style.display = 'block';
    const idInput = document.getElementById('modal-student-id');
    idInput.value = st.student_id;
    idInput.disabled = true; // Cannot edit primary key
    
    document.getElementById('modal-student-name').value = st.full_name;
    document.getElementById('modal-student-email').value = st.email;
    document.getElementById('modal-student-phone').value = st.phone;
    document.getElementById('modal-student-college').value = st.college;
    document.getElementById('modal-student-password').value = st.password;
    
    openModal('student-modal');
}

async function saveStudent(event) {
    event.preventDefault();
    const id = document.getElementById('modal-student-id').value;
    const name = document.getElementById('modal-student-name').value.trim();
    const email = document.getElementById('modal-student-email').value.trim();
    const phone = document.getElementById('modal-student-phone').value.trim();
    const college = document.getElementById('modal-student-college').value.trim();
    const password = document.getElementById('modal-student-password').value;
    
    const payload = {
        full_name: name,
        email,
        phone,
        college,
        password
    };
    
    const isEdit = document.getElementById('modal-student-id').disabled;
    
    try {
        if (isEdit) {
            await apiFetch(`/students/update/${id}/`, 'PUT', payload);
            showToast('Student updated successfully!', 'success');
        } else {
            if (id) {
                payload.student_id = parseInt(id);
            }
            await apiFetch('/students/add/', 'POST', payload);
            showToast('Student added successfully!', 'success');
        }
        closeModal('student-modal');
        loadAdminStudents();
    } catch (e) {
        // Error shown in apiFetch
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
        await apiFetch(`/students/delete/${id}/`, 'DELETE');
        showToast('Student deleted successfully', 'success');
        loadAdminStudents();
    } catch (e) {}
}


// 2. ADMIN QUIZZES CRUD

async function loadAdminQuizzes() {
    const tableBody = document.getElementById('admin-quizzes-table-body');
    try {
        allQuizzes = await apiFetch('/quizzes/');
        tableBody.innerHTML = '';
        
        allQuizzes.forEach(qz => {
            tableBody.innerHTML += `
                <tr>
                    <td>${qz.quiz_id}</td>
                    <td style="font-weight: 600;">${qz.quiz_title}</td>
                    <td>${qz.category}</td>
                    <td>${qz.total_questions}</td>
                    <td>${qz.duration} Mins</td>
                    <td>${qz.total_marks}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="openEditQuizModal(${qz.quiz_id})">Edit</button>
                        <button class="btn btn-danger" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-left: 0.25rem;" onclick="deleteQuiz(${qz.quiz_id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load quizzes.</td></tr>';
    }
}

function openAddQuizModal() {
    document.getElementById('quiz-modal-title').textContent = 'Add Quiz';
    document.getElementById('quiz-id-group').style.display = 'block';
    document.getElementById('modal-quiz-id').value = '';
    document.getElementById('modal-quiz-id').disabled = false;
    document.getElementById('modal-quiz-title').value = '';
    document.getElementById('modal-quiz-category').value = '';
    document.getElementById('modal-quiz-questions').value = '';
    document.getElementById('modal-quiz-duration').value = '';
    document.getElementById('modal-quiz-marks').value = '';
    
    openModal('quiz-modal');
}

function openEditQuizModal(id) {
    const qz = allQuizzes.find(q => q.quiz_id === id);
    if (!qz) return;
    
    document.getElementById('quiz-modal-title').textContent = 'Edit Quiz';
    document.getElementById('quiz-id-group').style.display = 'block';
    const idInput = document.getElementById('modal-quiz-id');
    idInput.value = qz.quiz_id;
    idInput.disabled = true;
    
    document.getElementById('modal-quiz-title').value = qz.quiz_title;
    document.getElementById('modal-quiz-category').value = qz.category;
    document.getElementById('modal-quiz-questions').value = qz.total_questions;
    document.getElementById('modal-quiz-duration').value = qz.duration;
    document.getElementById('modal-quiz-marks').value = qz.total_marks;
    
    openModal('quiz-modal');
}

async function saveQuiz(event) {
    event.preventDefault();
    const id = document.getElementById('modal-quiz-id').value;
    const title = document.getElementById('modal-quiz-title').value.trim();
    const category = document.getElementById('modal-quiz-category').value.trim();
    const totalQuestions = parseInt(document.getElementById('modal-quiz-questions').value);
    const duration = parseInt(document.getElementById('modal-quiz-duration').value);
    const totalMarks = parseInt(document.getElementById('modal-quiz-marks').value);
    
    const payload = {
        quiz_title: title,
        category,
        total_questions: totalQuestions,
        duration,
        total_marks: totalMarks
    };
    
    const isEdit = document.getElementById('modal-quiz-id').disabled;
    
    try {
        if (isEdit) {
            await apiFetch(`/quizzes/update/${id}/`, 'PUT', payload);
            showToast('Quiz updated successfully!', 'success');
        } else {
            if (id) {
                payload.quiz_id = parseInt(id);
            }
            await apiFetch('/quizzes/add/', 'POST', payload);
            showToast('Quiz created successfully!', 'success');
        }
        closeModal('quiz-modal');
        loadAdminQuizzes();
    } catch (e) {}
}

async function deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
        await apiFetch(`/quizzes/delete/${id}/`, 'DELETE');
        showToast('Quiz deleted successfully', 'success');
        loadAdminQuizzes();
    } catch (e) {}
}


// 3. ADMIN QUESTIONS CRUD

async function loadAdminQuestions() {
    const tableBody = document.getElementById('admin-questions-table-body');
    try {
        allQuestions = await apiFetch('/questions/');
        tableBody.innerHTML = '';
        
        allQuestions.forEach(qn => {
            tableBody.innerHTML += `
                <tr>
                    <td>${qn.question_id}</td>
                    <td style="font-weight: 500; color: var(--accent);">${qn.quiz_title}</td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${qn.question}</td>
                    <td>${qn.correct_answer}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="openEditQuestionModal(${qn.question_id})">Edit</button>
                        <button class="btn btn-danger" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-left: 0.25rem;" onclick="deleteQuestion(${qn.question_id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load questions.</td></tr>';
    }
}

async function openAddQuestionModal() {
    // Populate select quiz dropdown
    const quizSelect = document.getElementById('modal-question-quiz');
    quizSelect.innerHTML = '<option value="">-- Select a Quiz --</option>';
    try {
        const quizzes = await apiFetch('/quizzes/');
        quizzes.forEach(q => {
            quizSelect.innerHTML += `<option value="${q.quiz_title}">${q.quiz_title}</option>`;
        });
    } catch (e) {}

    document.getElementById('question-modal-title').textContent = 'Add Question';
    document.getElementById('question-id-group').style.display = 'block';
    document.getElementById('modal-question-id').value = '';
    document.getElementById('modal-question-id').disabled = false;
    document.getElementById('modal-question-text').value = '';
    document.getElementById('modal-question-opt1').value = '';
    document.getElementById('modal-question-opt2').value = '';
    document.getElementById('modal-question-opt3').value = '';
    document.getElementById('modal-question-opt4').value = '';
    document.getElementById('modal-question-correct').value = '';
    
    openModal('question-modal');
}

async function openEditQuestionModal(id) {
    const qn = allQuestions.find(q => q.question_id === id);
    if (!qn) return;

    // Populate select quiz dropdown
    const quizSelect = document.getElementById('modal-question-quiz');
    quizSelect.innerHTML = '';
    try {
        const quizzes = await apiFetch('/quizzes/');
        quizzes.forEach(q => {
            const selected = q.quiz_title === qn.quiz_title ? 'selected' : '';
            quizSelect.innerHTML += `<option value="${q.quiz_title}" ${selected}>${q.quiz_title}</option>`;
        });
    } catch (e) {}
    
    document.getElementById('question-modal-title').textContent = 'Edit Question';
    document.getElementById('question-id-group').style.display = 'block';
    const idInput = document.getElementById('modal-question-id');
    idInput.value = qn.question_id;
    idInput.disabled = true;
    
    document.getElementById('modal-question-text').value = qn.question;
    document.getElementById('modal-question-opt1').value = qn.option1;
    document.getElementById('modal-question-opt2').value = qn.option2;
    document.getElementById('modal-question-opt3').value = qn.option3;
    document.getElementById('modal-question-opt4').value = qn.option4;
    document.getElementById('modal-question-correct').value = qn.correct_answer;
    
    openModal('question-modal');
}

async function saveQuestion(event) {
    event.preventDefault();
    const id = document.getElementById('modal-question-id').value;
    const quizTitle = document.getElementById('modal-question-quiz').value;
    const questionText = document.getElementById('modal-question-text').value.trim();
    const option1 = document.getElementById('modal-question-opt1').value.trim();
    const option2 = document.getElementById('modal-question-opt2').value.trim();
    const option3 = document.getElementById('modal-question-opt3').value.trim();
    const option4 = document.getElementById('modal-question-opt4').value.trim();
    const correctVal = document.getElementById('modal-question-correct').value.trim();
    
    if (!quizTitle) {
        showToast('Please select a quiz first', 'warning');
        return;
    }
    
    // Check correct answer matches one of the options
    const opts = [option1, option2, option3, option4];
    if (!opts.includes(correctVal)) {
        showToast('Correct answer must exactly match one of the 4 options', 'warning');
        return;
    }
    
    const payload = {
        quiz_title: quizTitle,
        question: questionText,
        option1,
        option2,
        option3,
        option4,
        correct_answer: correctVal
    };
    
    const isEdit = document.getElementById('modal-question-id').disabled;
    
    try {
        if (isEdit) {
            await apiFetch(`/questions/update/${id}/`, 'PUT', payload);
            showToast('Question updated successfully!', 'success');
        } else {
            if (id) {
                payload.question_id = parseInt(id);
            }
            await apiFetch('/questions/add/', 'POST', payload);
            showToast('Question added successfully!', 'success');
        }
        closeModal('question-modal');
        loadAdminQuestions();
    } catch (e) {}
}

async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
        await apiFetch(`/questions/delete/${id}/`, 'DELETE');
        showToast('Question deleted successfully', 'success');
        loadAdminQuestions();
    } catch (e) {}
}


// 4. ADMIN RESULTS LIST

async function loadAdminResults() {
    const tableBody = document.getElementById('admin-results-table-body');
    try {
        allResults = await apiFetch('/results/');
        tableBody.innerHTML = '';
        
        if (allResults.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No attempts or results recorded yet.</td></tr>';
            return;
        }
        
        allResults.forEach(res => {
            const badgeClass = res.result_status.toLowerCase() === 'pass' ? 'badge-pass' : 'badge-fail';
            tableBody.innerHTML += `
                <tr>
                    <td>${res.result_id}</td>
                    <td style="font-weight: 600;">${res.student_name}</td>
                    <td style="color: var(--accent);">${res.quiz_title}</td>
                    <td>${res.total_marks}</td>
                    <td>${res.obtained_marks}</td>
                    <td style="font-weight: 600;">${res.percentage}%</td>
                    <td><span class="results-status-badge ${badgeClass}" style="font-size: 0.8rem; padding: 0.2rem 0.8rem; margin-bottom:0;">${res.result_status}</span></td>
                </tr>
            `;
        });
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load attempts results database.</td></tr>';
    }
}


// ================= MODAL CONTROLLER UTILS =================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

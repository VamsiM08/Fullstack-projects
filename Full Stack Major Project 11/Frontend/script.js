const API_BASE = "http://127.0.0.1:8000";

// Retrieve current logged in user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem("expense_tracker_user");
    return userJson ? JSON.parse(userJson) : null;
}

// Save user to localStorage
function setCurrentUser(user) {
    localStorage.setItem("expense_tracker_user", JSON.stringify(user));
}

// Redirect to login if not authenticated
function checkAuth() {
    const currentPage = window.location.pathname.split("/").pop();
    const publicPages = ["index.html", "login.html", "register.html", ""];
    
    // If the path ends in a folder name or is empty, it's index.html
    const isPublic = publicPages.includes(currentPage);
    const user = getCurrentUser();
    
    if (!user && !isPublic) {
        window.location.href = "login.html";
    }
}

// API Call helper
async function apiCall(endpoint, method = "GET", bodyData = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    
    if (bodyData) {
        options.body = JSON.stringify(bodyData);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Call failed on ${endpoint}:`, error);
        throw error;
    }
}

// Dynamic Navigation Bar Render
function renderNavbar() {
    const navbarContainer = document.getElementById("navbar-container");
    if (!navbarContainer) return;
    
    const user = getCurrentUser();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    
    let linksHtml = `
        <li><a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Home</a></li>
    `;
    
    if (user) {
        linksHtml += `
            <li><a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">Dashboard</a></li>
            <li><a href="income.html" class="${currentPage === 'income.html' ? 'active' : ''}">Income</a></li>
            <li><a href="expenses.html" class="${currentPage === 'expenses.html' ? 'active' : ''}">Expenses</a></li>
            <li><a href="categories.html" class="${currentPage === 'categories.html' ? 'active' : ''}">Categories</a></li>
            <li><a href="budget.html" class="${currentPage === 'budget.html' ? 'active' : ''}">Budget</a></li>
        `;
    }
    
    let controlsHtml = "";
    if (user) {
        controlsHtml = `
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <span>${user.full_name}</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="logoutUser()">Logout</button>
        `;
    } else {
        controlsHtml = `
            <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Register</a>
        `;
    }
    
    navbarContainer.innerHTML = `
        <header>
            <a href="index.html" class="logo">
                <i class="fas fa-wallet"></i> ExpenseTracker
            </a>
            <nav>
                <ul class="nav-links">
                    ${linksHtml}
                </ul>
            </nav>
            <div class="user-controls">
                ${controlsHtml}
            </div>
        </header>
    `;
}

// Logout handler
function logoutUser() {
    localStorage.removeItem("expense_tracker_user");
    window.location.href = "login.html";
}

// Convert "YYYY-MM-DD" date to "Month YYYY" (e.g. "July 2026")
function getMonthYearName(dateString) {
    if (!dateString) return "Unknown";
    const parts = dateString.split("-");
    if (parts.length < 2) return "Unknown";
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    return `${monthNames[monthIndex]} ${year}`;
}

// Dynamic budget calculations
async function recalculateBudgets() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Fetch all incomes and expenses for the active user
        const incomes = await apiCall(`/income/?user_name=${encodeURIComponent(user.full_name)}`);
        const expenses = await apiCall(`/expenses/?user_name=${encodeURIComponent(user.full_name)}`);
        
        // Sums by month
        const monthlyData = {};
        
        incomes.forEach(inc => {
            const mYear = getMonthYearName(inc.received_date);
            if (!monthlyData[mYear]) {
                monthlyData[mYear] = { income: 0, expense: 0 };
            }
            monthlyData[mYear].income += inc.amount;
        });
        
        expenses.forEach(exp => {
            const mYear = getMonthYearName(exp.expense_date);
            if (!monthlyData[mYear]) {
                monthlyData[mYear] = { income: 0, expense: 0 };
            }
            monthlyData[mYear].expense += exp.amount;
        });
        
        // Fetch categories to sum monthly limits if needed, or simply check total expenses
        const categories = await apiCall("/categories/");
        // Total monthly category limits as standard budget cap
        let totalLimitThreshold = 0;
        categories.forEach(c => totalLimitThreshold += c.monthly_limit);
        if (totalLimitThreshold === 0) totalLimitThreshold = 50000; // default safety cap
        
        // Fetch existing budgets for user
        const existingBudgets = await apiCall(`/budgets/?user_name=${encodeURIComponent(user.full_name)}`);
        
        for (const month of Object.keys(monthlyData)) {
            const data = monthlyData[month];
            const savings = data.income - data.expense;
            
            // Check status: Over Budget if expense exceeds total income (or category threshold)
            const status = data.expense > data.income ? "Over Budget" : "Under Budget";
            
            const existing = existingBudgets.find(b => b.month === month && b.user_name === user.full_name);
            
            const budgetRecord = {
                user_name: user.full_name,
                month: month,
                total_income: data.income,
                total_expense: data.expense,
                savings: savings,
                budget_status: status
            };
            
            if (existing) {
                // Update existing budget
                await apiCall(`/budgets/update/${existing.budget_id}/`, "PUT", budgetRecord);
            } else {
                // Insert new budget record. We can auto-generate the ID by passing null/omitting or generating a large random integer.
                budgetRecord.budget_id = Math.floor(Math.random() * 100000) + 1000;
                await apiCall("/budgets/add/", "POST", budgetRecord);
            }
        }
    } catch (err) {
        console.error("Failed to recalculate budgets:", err);
    }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    renderNavbar();
});

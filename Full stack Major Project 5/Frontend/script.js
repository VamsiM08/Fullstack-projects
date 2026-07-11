// GigNexus Frontend Logic - Fully Integrated with Django REST APIs
const API_URL = 'http://127.0.0.1:8001';

// Global namespace
const GigNexus = {
    // Session handlers
    getActiveUser: function() {
        const session = localStorage.getItem('gignexus_session');
        return session ? JSON.parse(session) : null;
    },

    setActiveUser: function(userData, role) {
        localStorage.setItem('gignexus_session', JSON.stringify({
            user: userData,
            role: role
        }));
    },

    logout: function() {
        localStorage.removeItem('gignexus_session');
        this.showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    },

    // UI Toast Notification
    showToast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-circle-exclamation';
        
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Core Fetch Wrapper
    apiCall: async function(endpoint, method = 'GET', body = null) {
        const url = `${API_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body && (method === 'POST' || method === 'PUT')) {
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
            console.error('API Call Error:', error);
            this.showToast(error.message, 'error');
            throw error;
        }
    },

    // Update Header Navigation elements depending on active session status
    renderNavigation: function() {
        const authSection = document.getElementById('nav-auth-section');
        const dashLink = document.getElementById('nav-dashboard-link');
        const contractLink = document.getElementById('nav-contracts-link');
        
        const session = this.getActiveUser();
        
        if (session) {
            if (dashLink) dashLink.style.display = 'block';
            if (contractLink) contractLink.style.display = 'block';
            
            if (authSection) {
                const name = session.role === 'freelancer' ? session.user.full_name : session.user.company_name;
                authSection.innerHTML = `
                    <div class="user-profile-badge ${session.role}">
                        <span class="role-indicator"></span>
                        <strong>${name}</strong> (${session.role})
                    </div>
                    <button onclick="GigNexus.logout()" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
                `;
            }
        } else {
            if (dashLink) dashLink.style.display = 'none';
            if (contractLink) contractLink.style.display = 'none';
            
            if (authSection) {
                authSection.innerHTML = `
                    <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
                    <a href="register.html" class="btn btn-primary btn-sm">Register</a>
                `;
            }
        }
    },

    // Home Page Loading Function
    loadHomepageData: async function() {
        this.renderNavigation();
        
        // 1. Load Featured Freelancers (first 3)
        const freelancersContainer = document.getElementById('featured-freelancers-container');
        try {
            const freelancers = await this.apiCall('/freelancers/');
            if (freelancers.length === 0) {
                freelancersContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);">No freelancers registered yet.</div>`;
            } else {
                freelancersContainer.innerHTML = '';
                freelancers.slice(0, 3).forEach(f => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="profile-card-header">
                            <div>
                                <h3>${f.full_name}</h3>
                                <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-envelope"></i> ${f.email}</p>
                            </div>
                            <span class="badge badge-active">$${f.hourly_rate}/hr</span>
                        </div>
                        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.75rem;">Experience: <strong>${f.experience} Years</strong></p>
                        <div class="skills-list">
                            ${f.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
                        </div>
                    `;
                    freelancersContainer.appendChild(card);
                });
            }
        } catch (e) {
            freelancersContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--status-rejected);">Failed to load freelancers.</div>`;
        }

        // 2. Load Featured Projects (first 3)
        const projectsContainer = document.getElementById('featured-projects-container');
        try {
            const projects = await this.apiCall('/projects/');
            if (projects.length === 0) {
                projectsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);">No projects posted yet.</div>`;
            } else {
                projectsContainer.innerHTML = '';
                projects.slice(0, 3).forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="project-card-header">
                            <div>
                                <h3>${p.project_title}</h3>
                                <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-building"></i> ${p.client_name}</p>
                            </div>
                            <span class="badge badge-pending">$${p.budget.toLocaleString()}</span>
                        </div>
                        <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted); line-clamp: 2; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
                            ${p.description}
                        </p>
                        <div class="meta-info">
                            <span class="meta-item"><i class="fa-solid fa-tag"></i> ${p.category}</span>
                            <span class="meta-item"><i class="fa-solid fa-calendar-days"></i> ${p.deadline}</span>
                        </div>
                    `;
                    projectsContainer.appendChild(card);
                });
            }
        } catch (e) {
            projectsContainer.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--status-rejected);">Failed to load projects.</div>`;
        }
    },

    // Login Page Handlers
    setLoginRole: function(role) {
        window.currentLoginRole = role;
        const btnFree = document.getElementById('btn-role-freelancer');
        const btnClient = document.getElementById('btn-role-client');
        const hint = document.getElementById('login-hint');
        
        if (role === 'freelancer') {
            btnFree.classList.add('active');
            btnClient.classList.remove('active');
            hint.innerHTML = 'Hint: Use <strong>rahul@gmail.com</strong> for Freelancer.';
        } else {
            btnClient.classList.add('active');
            btnFree.classList.remove('active');
            hint.innerHTML = 'Hint: Use <strong>client@techsolutions.com</strong> for Client.';
        }
    },

    handleLogin: async function(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const role = window.currentLoginRole || 'freelancer';
        
        try {
            if (role === 'freelancer') {
                const freelancers = await this.apiCall('/freelancers/');
                const user = freelancers.find(f => f.email.toLowerCase() === email.toLowerCase());
                if (user) {
                    this.setActiveUser(user, 'freelancer');
                    this.showToast(`Welcome back, ${user.full_name}!`, 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                } else {
                    this.showToast('Email not registered as a Freelancer', 'error');
                }
            } else {
                const clients = await this.apiCall('/clients/');
                const user = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
                if (user) {
                    this.setActiveUser(user, 'client');
                    this.showToast(`Logged in under ${user.company_name}`, 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                } else {
                    this.showToast('Email not registered as a Client company', 'error');
                }
            }
        } catch (err) {
            this.showToast('Login verification failed.', 'error');
        }
    },

    // Registration Page Handlers
    toggleRegisterForm: function(role) {
        const btnFree = document.getElementById('tab-reg-freelancer');
        const btnClient = document.getElementById('tab-reg-client');
        const formFree = document.getElementById('freelancer-register-form');
        const formClient = document.getElementById('client-register-form');
        
        if (role === 'freelancer') {
            btnFree.classList.add('active');
            btnClient.classList.remove('active');
            formFree.style.display = 'block';
            formClient.style.display = 'none';
        } else {
            btnClient.classList.add('active');
            btnFree.classList.remove('active');
            formClient.style.display = 'block';
            formFree.style.display = 'none';
        }
    },

    handleRegisterFreelancer: async function(event) {
        event.preventDefault();
        const payload = {
            full_name: document.getElementById('free-name').value.trim(),
            email: document.getElementById('free-email').value.trim(),
            phone: document.getElementById('free-phone').value.trim(),
            skills: document.getElementById('free-skills').value.trim(),
            experience: parseInt(document.getElementById('free-experience').value),
            hourly_rate: parseFloat(document.getElementById('free-rate').value)
        };
        
        const customId = document.getElementById('free-id').value;
        if (customId) {
            payload.freelancer_id = parseInt(customId);
        }
        
        try {
            const data = await this.apiCall('/freelancers/add/', 'POST', payload);
            this.showToast('Registration successful!', 'success');
            // Auto login
            this.setActiveUser(data, 'freelancer');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (e) {
            // Toast error shown by apiCall
        }
    },

    handleRegisterClient: async function(event) {
        event.preventDefault();
        const payload = {
            company_name: document.getElementById('client-company').value.trim(),
            contact_person: document.getElementById('client-person').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            phone: document.getElementById('client-phone').value.trim(),
            location: document.getElementById('client-location').value.trim()
        };
        
        const customId = document.getElementById('client-id').value;
        if (customId) {
            payload.client_id = parseInt(customId);
        }
        
        try {
            const data = await this.apiCall('/clients/add/', 'POST', payload);
            this.showToast('Company registration successful!', 'success');
            // Auto login
            this.setActiveUser(data, 'client');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (e) {
            // error shown
        }
    },

    // Projects Page Handling
    renderProjectsPage: async function() {
        this.renderNavigation();
        const session = this.getActiveUser();
        
        // Render project post form if Client
        const postSection = document.getElementById('post-project-section');
        if (session && session.role === 'client') {
            postSection.style.display = 'block';
            document.getElementById('proj-client-name').value = session.user.company_name;
        } else {
            postSection.style.display = 'none';
        }
        
        await this.loadProjectsList();
    },

    loadProjectsList: async function(search = '', category = '') {
        const container = document.getElementById('projects-list-container');
        container.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Fetching active projects...</div>`;
        
        let endpoint = '/projects/';
        const queryParams = [];
        if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
        if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }
        
        try {
            const projects = await this.apiCall(endpoint);
            if (projects.length === 0) {
                container.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);">No matching projects found.</div>`;
                return;
            }
            
            container.innerHTML = '';
            const session = this.getActiveUser();
            
            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let actionBtn = '';
                if (session && session.role === 'freelancer') {
                    actionBtn = `<a href="bids.html?project_title=${encodeURIComponent(p.project_title)}" class="btn btn-accent btn-sm" style="width: 100%; margin-top: 1rem;"><i class="fa-solid fa-gavel"></i> Bid on Project</a>`;
                } else if (session && session.role === 'client' && session.user.company_name === p.client_name) {
                    actionBtn = `
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="GigNexus.openEditProjectModal(${p.project_id}, '${p.project_title.replace(/'/g, "\\'")}', '${p.category.replace(/'/g, "\\'")}', ${p.budget}, '${p.deadline}', '${p.description.replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="GigNexus.handleDeleteProject(${p.project_id})"><i class="fa-solid fa-trash-can"></i> Delete</button>
                        </div>
                    `;
                } else if (!session) {
                    actionBtn = `<a href="login.html" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 1rem;"><i class="fa-solid fa-lock"></i> Login to Bid</a>`;
                }
                
                card.innerHTML = `
                    <div class="project-card-header">
                        <div>
                            <h3>${p.project_title}</h3>
                            <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-building"></i> ${p.client_name}</p>
                        </div>
                        <span class="badge badge-pending">$${p.budget.toLocaleString()}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                        ${p.description}
                    </p>
                    <div class="meta-info">
                        <span class="meta-item"><i class="fa-solid fa-tag"></i> ${p.category}</span>
                        <span class="meta-item"><i class="fa-solid fa-calendar-days"></i> ${p.deadline}</span>
                    </div>
                    ${actionBtn}
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--status-rejected);">Error loading projects list.</div>`;
        }
    },

    searchAndFilterProjects: function() {
        const query = document.getElementById('search-query').value.trim();
        const cat = document.getElementById('filter-category').value;
        this.loadProjectsList(query, cat);
    },

    handleCreateProject: async function(event) {
        event.preventDefault();
        const session = this.getActiveUser();
        if (!session || session.role !== 'client') {
            this.showToast('You must be registered as a Client company to post projects', 'error');
            return;
        }
        
        const payload = {
            project_title: document.getElementById('proj-title').value.trim(),
            category: document.getElementById('proj-category').value,
            budget: parseFloat(document.getElementById('proj-budget').value),
            deadline: document.getElementById('proj-deadline').value,
            client_name: session.user.company_name
        };
        
        const customId = document.getElementById('proj-id').value;
        if (customId) {
            payload.project_id = parseInt(customId);
        }
        
        try {
            await this.apiCall('/projects/add/', 'POST', payload);
            this.showToast('Project listing posted successfully!', 'success');
            document.getElementById('post-project-form').reset();
            document.getElementById('proj-client-name').value = session.user.company_name;
            this.loadProjectsList();
        } catch (e) {}
    },

    openEditProjectModal: function(id, title, category, budget, deadline, desc) {
        document.getElementById('edit-proj-id').value = id;
        document.getElementById('edit-proj-title').value = title;
        document.getElementById('edit-proj-category').value = category;
        document.getElementById('edit-proj-budget').value = budget;
        document.getElementById('edit-proj-deadline').value = deadline;
        document.getElementById('edit-proj-desc').value = desc;
        
        const session = this.getActiveUser();
        document.getElementById('edit-proj-client').value = session.user.company_name;
        
        document.getElementById('project-edit-modal').style.display = 'flex';
    },

    handleUpdateProject: async function(event) {
        event.preventDefault();
        const id = document.getElementById('edit-proj-id').value;
        const payload = {
            project_title: document.getElementById('edit-proj-title').value.trim(),
            category: document.getElementById('edit-proj-category').value.trim(),
            budget: parseFloat(document.getElementById('edit-proj-budget').value),
            deadline: document.getElementById('edit-proj-deadline').value,
            description: document.getElementById('edit-proj-desc').value.trim(),
            client_name: document.getElementById('edit-proj-client').value
        };
        
        try {
            await this.apiCall(`/projects/update/${id}/`, 'PUT', payload);
            this.showToast('Project listing updated!', 'success');
            document.getElementById('project-edit-modal').style.display = 'none';
            // Reload projects list or dashboard if on dashboard
            if (window.location.pathname.includes('dashboard')) {
                this.renderDashboard();
            } else {
                this.loadProjectsList();
            }
        } catch (e) {}
    },

    handleDeleteProject: async function(id) {
        if (!confirm('Are you sure you want to delete this project listing?')) return;
        try {
            await this.apiCall(`/projects/delete/${id}/`, 'DELETE');
            this.showToast('Project listing deleted', 'success');
            if (window.location.pathname.includes('dashboard')) {
                this.renderDashboard();
            } else {
                this.loadProjectsList();
            }
        } catch(e) {}
    },

    // Bids Page Handling
    renderBidsPage: async function() {
        this.renderNavigation();
        const session = this.getActiveUser();
        
        const warning = document.getElementById('bid-warning');
        const submitBtn = document.getElementById('btn-submit-bid');
        const nameInput = document.getElementById('bid-freelancer-name');
        
        if (!session || session.role !== 'freelancer') {
            warning.style.display = 'block';
            submitBtn.disabled = true;
            nameInput.value = 'Guest Account';
        } else {
            warning.style.display = 'none';
            submitBtn.disabled = false;
            nameInput.value = session.user.full_name;
        }

        // Fetch query parameter for project_title
        const params = new URLSearchParams(window.location.search);
        const pTitle = params.get('project_title');
        
        const dropdown = document.getElementById('bid-project-title');
        const textInput = document.getElementById('bid-project-title-text');
        
        try {
            const projects = await this.apiCall('/projects/');
            
            if (pTitle) {
                // Read-only text mode
                dropdown.style.display = 'none';
                textInput.style.display = 'block';
                textInput.value = pTitle;
            } else {
                // Dropdown select mode
                dropdown.style.display = 'block';
                textInput.style.display = 'none';
                dropdown.innerHTML = '<option value="" disabled selected>Select a project listing</option>';
                projects.forEach(p => {
                    dropdown.innerHTML += `<option value="${p.project_title}">${p.project_title} (by ${p.client_name})</option>`;
                });
            }
            
            // Show all bids list
            document.getElementById('all-bids-section').style.display = 'block';
            this.loadBidsList();
        } catch (e) {}
    },

    loadBidsList: async function() {
        const container = document.getElementById('bids-list-container');
        container.innerHTML = `<div class="card" style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading proposal bids...</div>`;
        
        try {
            const bids = await this.apiCall('/bids/');
            if (bids.length === 0) {
                container.innerHTML = `<div class="card" style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--text-muted);">No bids submitted yet.</div>`;
                return;
            }
            
            container.innerHTML = '';
            bids.forEach(b => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let statusClass = 'badge-pending';
                if (b.status === 'Accepted') statusClass = 'badge-accepted';
                if (b.status === 'Rejected') statusClass = 'badge-rejected';
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; align-items: flex-start;">
                        <div>
                            <h4>${b.project_title}</h4>
                            <p class="text-muted" style="font-size: 0.8rem;"><i class="fa-solid fa-user-tie"></i> Bidder: ${b.freelancer_name}</p>
                        </div>
                        <span class="badge ${statusClass}">${b.status}</span>
                    </div>
                    <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted);">${b.proposal}</p>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Proposed Budget:</span>
                        <strong style="color: var(--color-accent); font-size: 1.1rem;">$${b.bid_amount.toLocaleString()}</strong>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="card" style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--status-rejected);">Error fetching bids.</div>`;
        }
    },

    handleCreateBid: async function(event) {
        event.preventDefault();
        const session = this.getActiveUser();
        if (!session || session.role !== 'freelancer') return;
        
        const dropdown = document.getElementById('bid-project-title');
        const textInput = document.getElementById('bid-project-title-text');
        
        const projectTitle = dropdown.style.display === 'none' ? textInput.value : dropdown.value;
        if (!projectTitle) {
            this.showToast('Please select a project to bid on', 'error');
            return;
        }
        
        const payload = {
            project_title: projectTitle,
            freelancer_name: session.user.full_name,
            bid_amount: parseFloat(document.getElementById('bid-amount').value),
            proposal: document.getElementById('bid-proposal').value.trim(),
            status: 'Pending'
        };
        
        const customId = document.getElementById('bid-id').value;
        if (customId) {
            payload.bid_id = parseInt(customId);
        }
        
        try {
            await this.apiCall('/bids/add/', 'POST', payload);
            this.showToast('Proposal submitted successfully!', 'success');
            document.getElementById('bid-submit-form').reset();
            document.getElementById('bid-freelancer-name').value = session.user.full_name;
            
            // Reload bids list or dashboard
            if (window.location.search.includes('project_title')) {
                // redirect to projects page or dashboard
                setTimeout(() => window.location.href = 'projects.html', 1200);
            } else {
                this.loadBidsList();
            }
        } catch (e) {}
    },

    // Contracts Page Handling
    renderContractsPage: async function() {
        this.renderNavigation();
        const container = document.getElementById('contracts-grid-container');
        container.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving contracts...</div>`;
        
        const filterVal = document.getElementById('filter-contract-status').value;
        
        try {
            let contracts = await this.apiCall('/contracts/');
            if (filterVal) {
                contracts = contracts.filter(c => c.contract_status === filterVal);
            }
            
            if (contracts.length === 0) {
                container.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);">No matching contracts found.</div>`;
                return;
            }
            
            container.innerHTML = '';
            const session = this.getActiveUser();
            
            contracts.forEach(c => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let badgeClass = 'badge-active';
                if (c.contract_status === 'Completed') badgeClass = 'badge-completed';
                if (c.contract_status === 'Cancelled') badgeClass = 'badge-cancelled';
                
                // Show actions if active and user matches contract client
                let actions = '';
                if (session && session.role === 'client' && session.user.company_name === c.client_name) {
                    if (c.contract_status === 'Active') {
                        actions = `
                            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                <button class="btn btn-accent btn-sm" style="flex: 1;" onclick="GigNexus.updateContractStatus(${c.contract_id}, 'Completed')"><i class="fa-solid fa-circle-check"></i> Complete</button>
                                <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="GigNexus.updateContractStatus(${c.contract_id}, 'Cancelled')"><i class="fa-solid fa-ban"></i> Cancel</button>
                            </div>
                        `;
                    } else {
                        // Delete completed/cancelled contracts
                        actions = `
                            <button class="btn btn-danger btn-sm" style="width: 100%; margin-top: 1rem;" onclick="GigNexus.handleDeleteContract(${c.contract_id})"><i class="fa-solid fa-trash-can"></i> Remove Contract Record</button>
                        `;
                    }
                }
                
                card.innerHTML = `
                    <div class="project-card-header">
                        <div>
                            <h3>${c.project_title}</h3>
                            <span class="badge ${badgeClass}">${c.contract_status}</span>
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                        <p><i class="fa-solid fa-laptop-code"></i> Freelancer: <strong>${c.freelancer_name}</strong></p>
                        <p><i class="fa-solid fa-building"></i> Client: <strong>${c.client_name}</strong></p>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); padding: 0.5rem 0; margin-top: 0.5rem; display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
                        <span>Start: ${c.start_date}</span>
                        <span>End: ${c.end_date}</span>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Agreed Budget:</span>
                        <strong style="color: var(--color-primary); font-size: 1.1rem;">$${c.agreed_budget.toLocaleString()}</strong>
                    </div>
                    ${actions}
                `;
                container.appendChild(card);
            });
        } catch (e) {}
    },

    updateContractStatus: async function(id, newStatus) {
        try {
            await this.apiCall(`/contracts/update/${id}/`, 'PUT', { contract_status: newStatus });
            this.showToast(`Contract marked as ${newStatus}`, 'success');
            if (window.location.pathname.includes('dashboard')) {
                this.renderDashboard();
            } else {
                this.renderContractsPage();
            }
        } catch(e) {}
    },

    handleDeleteContract: async function(id) {
        if (!confirm('Are you sure you want to delete this contract record?')) return;
        try {
            await this.apiCall(`/contracts/delete/${id}/`, 'DELETE');
            this.showToast('Contract deleted', 'success');
            if (window.location.pathname.includes('dashboard')) {
                this.renderDashboard();
            } else {
                this.renderContractsPage();
            }
        } catch(e) {}
    },

    // Dashboard Rendering and Logic
    renderDashboard: async function() {
        this.renderNavigation();
        const session = this.getActiveUser();
        
        if (!session) {
            this.showToast('Session expired. Please log in.', 'error');
            setTimeout(() => window.location.href = 'login.html', 1000);
            return;
        }

        const loader = document.getElementById('dashboard-loading');
        const content = document.getElementById('dashboard-content');
        
        loader.style.display = 'block';
        content.style.display = 'none';

        // 1. Personalize greeting
        const greeting = document.getElementById('dashboard-greeting');
        const subGreeting = document.getElementById('dashboard-sub-greeting');
        const actionBtnContainer = document.getElementById('dashboard-action-btn');
        
        if (session.role === 'freelancer') {
            greeting.innerText = `Welcome, ${session.user.full_name}`;
            subGreeting.innerText = `Review your freelance bid submissions, edit skills, and check active contracts.`;
            actionBtnContainer.innerHTML = `<a href="projects.html" class="btn btn-primary"><i class="fa-solid fa-briefcase"></i> Browse Available Projects</a>`;
            
            document.getElementById('freelancer-sections').style.display = 'block';
            document.getElementById('client-sections').style.display = 'none';
        } else {
            greeting.innerText = `${session.user.company_name}`;
            subGreeting.innerText = `Manage project postings, evaluate bids, and sign digital contracts.`;
            actionBtnContainer.innerHTML = `<a href="projects.html" class="btn btn-accent"><i class="fa-solid fa-plus"></i> Post a New Project</a>`;
            
            document.getElementById('client-sections').style.display = 'block';
            document.getElementById('freelancer-sections').style.display = 'none';
        }

        // 2. Populate profile card details
        const detailsContainer = document.getElementById('profile-view-details');
        if (session.role === 'freelancer') {
            detailsContainer.innerHTML = `
                <p style="margin-bottom: 0.5rem;"><strong>ID:</strong> #${session.user.freelancer_id}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${session.user.full_name}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Email:</strong> ${session.user.email}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Phone:</strong> ${session.user.phone}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Rate:</strong> $${session.user.hourly_rate}/hr</p>
                <p style="margin-bottom: 0.5rem;"><strong>Experience:</strong> ${session.user.experience} Years</p>
                <div style="margin-top: 1rem;">
                    <strong>Skills:</strong>
                    <div class="skills-list" style="margin-top: 0.25rem;">
                        ${session.user.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `
                <p style="margin-bottom: 0.5rem;"><strong>ID:</strong> #${session.user.client_id}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Company:</strong> ${session.user.company_name}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Contact:</strong> ${session.user.contact_person}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Email:</strong> ${session.user.email}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Phone:</strong> ${session.user.phone}</p>
                <p style="margin-bottom: 0.5rem;"><strong>HQ Location:</strong> ${session.user.location}</p>
            `;
        }

        // 3. Fetch resources & build dynamic statistics
        try {
            const projects = await this.apiCall('/projects/');
            const bids = await this.apiCall('/bids/');
            const contracts = await this.apiCall('/contracts/');
            
            if (session.role === 'freelancer') {
                const myBids = bids.filter(b => b.freelancer_name === session.user.full_name);
                const myContracts = contracts.filter(c => c.freelancer_name === session.user.full_name);
                
                document.getElementById('stat-count-1').innerText = projects.length;
                document.getElementById('stat-label-1').innerText = 'Available Projects';
                document.getElementById('stat-count-2').innerText = myBids.length;
                document.getElementById('stat-label-2').innerText = 'My Sent Bids';
                document.getElementById('stat-count-3').innerText = myContracts.length;
                document.getElementById('stat-label-3').innerText = 'My Contracts';
                
                // Populate freelancer bids table
                const bidsTableBody = document.querySelector('#table-freelancer-bids tbody');
                bidsTableBody.innerHTML = '';
                if (myBids.length === 0) {
                    bidsTableBody.innerHTML = `<tr><td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">You haven't submitted any proposals yet.</td></tr>`;
                } else {
                    myBids.forEach(b => {
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid var(--border-color)';
                        
                        let badgeClass = 'badge-pending';
                        if (b.status === 'Accepted') badgeClass = 'badge-accepted';
                        if (b.status === 'Rejected') badgeClass = 'badge-rejected';
                        
                        let action = '';
                        if (b.status === 'Pending') {
                            action = `
                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                    <button class="btn btn-secondary btn-sm" onclick="GigNexus.openEditBidModal(${b.bid_id}, '${b.project_title.replace(/'/g, "\\'")}', '${b.freelancer_name.replace(/'/g, "\\'")}', ${b.bid_amount}, '${b.proposal.replace(/'/g, "\\'")}', '${b.status}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-danger btn-sm" onclick="GigNexus.handleDeleteBid(${b.bid_id})"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            `;
                        } else {
                            action = `<span class="text-muted" style="font-size: 0.85rem;">Completed</span>`;
                        }
                        
                        tr.innerHTML = `
                            <td style="padding: 1rem;">#${b.bid_id}</td>
                            <td style="padding: 1rem; font-weight: 600;">${b.project_title}</td>
                            <td style="padding: 1rem; font-weight: bold; color: var(--color-accent);">$${b.bid_amount.toLocaleString()}</td>
                            <td style="padding: 1rem; font-size: 0.85rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.proposal}</td>
                            <td style="padding: 1rem;"><span class="badge ${badgeClass}">${b.status}</span></td>
                            <td style="padding: 1rem; text-align: center;">${action}</td>
                        `;
                        bidsTableBody.appendChild(tr);
                    });
                }
                
                // Render shared contracts grid filtered for Freelancer
                this.renderDashboardContracts(myContracts);
                
            } else {
                // Client Dashboard
                const myProjects = projects.filter(p => p.client_name === session.user.company_name);
                const myProjectTitles = myProjects.map(p => p.project_title.toLowerCase());
                
                // Bids on my projects
                const receivedBids = bids.filter(b => myProjectTitles.includes(b.project_title.toLowerCase()));
                const myContracts = contracts.filter(c => c.client_name === session.user.company_name);
                
                document.getElementById('stat-count-1').innerText = myProjects.length;
                document.getElementById('stat-label-1').innerText = 'My Postings';
                document.getElementById('stat-count-2').innerText = receivedBids.length;
                document.getElementById('stat-label-2').innerText = 'Received Bids';
                document.getElementById('stat-count-3').innerText = myContracts.length;
                document.getElementById('stat-label-3').innerText = 'Active Contracts';
                
                // Populate client projects table
                const projectsTableBody = document.querySelector('#table-client-projects tbody');
                projectsTableBody.innerHTML = '';
                if (myProjects.length === 0) {
                    projectsTableBody.innerHTML = `<tr><td colspan="6" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">You haven't posted any projects yet.</td></tr>`;
                } else {
                    myProjects.forEach(p => {
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid var(--border-color)';
                        tr.innerHTML = `
                            <td style="padding: 1rem;">#${p.project_id}</td>
                            <td style="padding: 1rem; font-weight: 600;">${p.project_title}</td>
                            <td style="padding: 1rem; font-weight: bold; color: var(--color-primary);">$${p.budget.toLocaleString()}</td>
                            <td style="padding: 1rem;"><span class="badge badge-active">${p.category}</span></td>
                            <td style="padding: 1rem;">${p.deadline}</td>
                            <td style="padding: 1rem; text-align: center;">
                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                    <button class="btn btn-secondary btn-sm" onclick="GigNexus.openEditProjectModal(${p.project_id}, '${p.project_title.replace(/'/g, "\\'")}', '${p.category.replace(/'/g, "\\'")}', ${p.budget}, '${p.deadline}', '${p.description.replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-danger btn-sm" onclick="GigNexus.handleDeleteProject(${p.project_id})"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            </td>
                        `;
                        projectsTableBody.appendChild(tr);
                    });
                }
                
                // Populate client bids received table
                const bidsTableBody = document.querySelector('#table-client-bids tbody');
                bidsTableBody.innerHTML = '';
                if (receivedBids.length === 0) {
                    bidsTableBody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No proposals received yet.</td></tr>`;
                } else {
                    receivedBids.forEach(b => {
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid var(--border-color)';
                        
                        let badgeClass = 'badge-pending';
                        if (b.status === 'Accepted') badgeClass = 'badge-accepted';
                        if (b.status === 'Rejected') badgeClass = 'badge-rejected';
                        
                        let action = '';
                        if (b.status === 'Pending') {
                            action = `
                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                    <button class="btn btn-accent btn-sm" onclick="GigNexus.updateBidStatus(${b.bid_id}, 'Accepted')"><i class="fa-solid fa-check"></i> Accept</button>
                                    <button class="btn btn-danger btn-sm" onclick="GigNexus.updateBidStatus(${b.bid_id}, 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                                </div>
                            `;
                        } else {
                            action = `<span class="text-muted" style="font-size: 0.85rem;">Signed / Closed</span>`;
                        }
                        
                        tr.innerHTML = `
                            <td style="padding: 1rem;">#${b.bid_id}</td>
                            <td style="padding: 1rem; font-weight: 600;">${b.project_title}</td>
                            <td style="padding: 1rem; font-weight: bold; color: var(--color-primary);">${b.freelancer_name}</td>
                            <td style="padding: 1rem; font-weight: bold; color: var(--color-accent);">$${b.bid_amount.toLocaleString()}</td>
                            <td style="padding: 1rem; font-size: 0.85rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${b.proposal}">${b.proposal}</td>
                            <td style="padding: 1rem;"><span class="badge ${badgeClass}">${b.status}</span></td>
                            <td style="padding: 1rem; text-align: center;">${action}</td>
                        `;
                        bidsTableBody.appendChild(tr);
                    });
                }
                
                // Render shared contracts grid filtered for Client
                this.renderDashboardContracts(myContracts);
            }
            
            loader.style.display = 'none';
            content.style.display = 'block';
            
        } catch (e) {
            loader.style.display = 'none';
            this.showToast('Failed to load dashboard resources', 'error');
        }
    },

    // Rendering shared contracts under dashboard
    renderDashboardContracts: function(contracts) {
        const grid = document.getElementById('dashboard-contracts-grid');
        grid.innerHTML = '';
        
        if (contracts.length === 0) {
            grid.innerHTML = `<div class="card" style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--text-muted);">No contract agreements active.</div>`;
            return;
        }
        
        const session = this.getActiveUser();
        
        contracts.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let statusClass = 'badge-active';
            if (c.contract_status === 'Completed') statusClass = 'badge-completed';
            if (c.contract_status === 'Cancelled') statusClass = 'badge-cancelled';
            
            let actions = '';
            if (session.role === 'client' && c.contract_status === 'Active') {
                actions = `
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn btn-accent btn-sm" style="flex: 1;" onclick="GigNexus.updateContractStatus(${c.contract_id}, 'Completed')"><i class="fa-solid fa-check"></i> Complete</button>
                        <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="GigNexus.updateContractStatus(${c.contract_id}, 'Cancelled')"><i class="fa-solid fa-xmark"></i> Cancel</button>
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="project-card-header">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${c.project_title}</h4>
                        <span class="badge ${statusClass}">${c.contract_status}</span>
                    </div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                    <p><i class="fa-solid fa-user"></i> Freelancer: <strong>${c.freelancer_name}</strong></p>
                    <p><i class="fa-solid fa-building"></i> Client: <strong>${c.client_name}</strong></p>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem; display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
                    <span>Budget: <strong>$${c.agreed_budget.toLocaleString()}</strong></span>
                    <span>Ends: ${c.end_date}</span>
                </div>
                ${actions}
            `;
            grid.appendChild(card);
        });
    },

    // Bid actions
    openEditBidModal: function(id, title, freeName, amount, proposal, status) {
        document.getElementById('edit-bid-id').value = id;
        document.getElementById('edit-bid-project-title').value = title;
        document.getElementById('edit-bid-freelancer-name').value = freeName;
        document.getElementById('edit-bid-amount').value = amount;
        document.getElementById('edit-bid-proposal').value = proposal;
        document.getElementById('edit-bid-status').value = status;
        
        document.getElementById('bid-edit-modal').style.display = 'flex';
    },

    handleUpdateBid: async function(event) {
        event.preventDefault();
        const id = document.getElementById('edit-bid-id').value;
        const payload = {
            project_title: document.getElementById('edit-bid-project-title').value,
            freelancer_name: document.getElementById('edit-bid-freelancer-name').value,
            bid_amount: parseFloat(document.getElementById('edit-bid-amount').value),
            proposal: document.getElementById('edit-bid-proposal').value.trim(),
            status: document.getElementById('edit-bid-status').value
        };
        
        try {
            await this.apiCall(`/bids/update/${id}/`, 'PUT', payload);
            this.showToast('Proposal bid updated successfully!', 'success');
            document.getElementById('bid-edit-modal').style.display = 'none';
            this.renderDashboard();
        } catch(e) {}
    },

    handleDeleteBid: async function(id) {
        if (!confirm('Are you sure you want to delete this bid?')) return;
        try {
            await this.apiCall(`/bids/delete/${id}/`, 'DELETE');
            this.showToast('Proposal bid deleted', 'success');
            this.renderDashboard();
        } catch(e) {}
    },

    updateBidStatus: async function(id, newStatus) {
        try {
            const bids = await this.apiCall('/bids/');
            const bid = bids.find(b => b.bid_id === id);
            if (!bid) throw new Error('Bid not found');
            
            // Send full payload to PUT update endpoint
            const payload = {
                project_title: bid.project_title,
                freelancer_name: bid.freelancer_name,
                bid_amount: bid.bid_amount,
                proposal: bid.proposal,
                status: newStatus
            };
            
            await this.apiCall(`/bids/update/${id}/`, 'PUT', payload);
            this.showToast(`Bid status set to ${newStatus}`, 'success');
            this.renderDashboard();
        } catch (e) {}
    },

    // Edit Profile Logic
    toggleProfileEditForm: function(show) {
        const viewCard = document.getElementById('profile-view-card');
        const editCard = document.getElementById('profile-edit-card');
        const statsCard = document.getElementById('profile-stats-card');
        
        const session = this.getActiveUser();
        const form = document.getElementById('profile-edit-form');
        
        if (show) {
            // Render edit form fields dynamically
            if (session.role === 'freelancer') {
                form.innerHTML = `
                    <div class="form-group">
                        <label for="edit-free-name">Full Name</label>
                        <input type="text" id="edit-free-name" class="form-control" value="${session.user.full_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-free-email">Email Address</label>
                        <input type="email" id="edit-free-email" class="form-control" value="${session.user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-free-phone">Phone Number</label>
                        <input type="tel" id="edit-free-phone" class="form-control" value="${session.user.phone}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-free-skills">Professional Skills (Comma separated)</label>
                        <input type="text" id="edit-free-skills" class="form-control" value="${session.user.skills}" required>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="edit-free-exp">Experience (Years)</label>
                            <input type="number" id="edit-free-exp" class="form-control" value="${session.user.experience}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-free-rate">Hourly Rate ($)</label>
                            <input type="number" id="edit-free-rate" class="form-control" value="${session.user.hourly_rate}" required>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="GigNexus.toggleProfileEditForm(false)">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm">Save Profile</button>
                    </div>
                `;
            } else {
                form.innerHTML = `
                    <div class="form-group">
                        <label for="edit-client-company">Company Name</label>
                        <input type="text" id="edit-client-company" class="form-control" value="${session.user.company_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-client-person">Contact Person</label>
                        <input type="text" id="edit-client-person" class="form-control" value="${session.user.contact_person}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-client-email">Business Email</label>
                        <input type="email" id="edit-client-email" class="form-control" value="${session.user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-client-phone">Business Phone</label>
                        <input type="tel" id="edit-client-phone" class="form-control" value="${session.user.phone}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-client-loc">Location</label>
                        <input type="text" id="edit-client-loc" class="form-control" value="${session.user.location}" required>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="GigNexus.toggleProfileEditForm(false)">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm">Save Profile</button>
                    </div>
                `;
            }
            
            editCard.style.display = 'block';
            statsCard.style.display = 'none';
        } else {
            editCard.style.display = 'none';
            statsCard.style.display = 'flex';
        }
    },

    handleUpdateProfile: async function(event) {
        event.preventDefault();
        const session = this.getActiveUser();
        
        try {
            if (session.role === 'freelancer') {
                const payload = {
                    full_name: document.getElementById('edit-free-name').value.trim(),
                    email: document.getElementById('edit-free-email').value.trim(),
                    phone: document.getElementById('edit-free-phone').value.trim(),
                    skills: document.getElementById('edit-free-skills').value.trim(),
                    experience: parseInt(document.getElementById('edit-free-exp').value),
                    hourly_rate: parseFloat(document.getElementById('edit-free-rate').value)
                };
                
                const updated = await this.apiCall(`/freelancers/update/${session.user.freelancer_id}/`, 'PUT', payload);
                this.setActiveUser(updated, 'freelancer');
                this.showToast('Freelancer profile updated!', 'success');
            } else {
                const payload = {
                    company_name: document.getElementById('edit-client-company').value.trim(),
                    contact_person: document.getElementById('edit-client-person').value.trim(),
                    email: document.getElementById('edit-client-email').value.trim(),
                    phone: document.getElementById('edit-client-phone').value.trim(),
                    location: document.getElementById('edit-client-loc').value.trim()
                };
                
                const updated = await this.apiCall(`/clients/update/${session.user.client_id}/`, 'PUT', payload);
                this.setActiveUser(updated, 'client');
                this.showToast('Client profile updated!', 'success');
            }
            
            this.toggleProfileEditForm(false);
            this.renderDashboard();
        } catch(e) {}
    },

    handleDeleteProfile: async function() {
        const session = this.getActiveUser();
        if (!confirm('WARNING: Deleting your profile will log you out and delete your account permanently. Do you wish to proceed?')) return;
        
        try {
            if (session.role === 'freelancer') {
                await this.apiCall(`/freelancers/delete/${session.user.freelancer_id}/`, 'DELETE');
            } else {
                await this.apiCall(`/clients/delete/${session.user.client_id}/`, 'DELETE');
            }
            
            this.showToast('Account successfully deleted', 'success');
            localStorage.removeItem('gignexus_session');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (e) {}
    }
};

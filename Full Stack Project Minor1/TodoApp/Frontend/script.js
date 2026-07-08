// Configure API endpoint base URL
const API_BASE = 'http://127.0.0.1:8000';

// Global state variables
let tasks = [];
let activeStatusFilter = 'all';
let activePriorityFilter = 'all';
let searchQuery = '';
let deleteTargetId = null;
let deleteTargetCard = null;

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskPrioritySelect = document.getElementById('task-priority');
const taskStatusSelect = document.getElementById('task-status');
const taskListContainer = document.getElementById('task-list');

// State views
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');

// Stats Counters
const totalCountEl = document.getElementById('total-tasks-count');
const pendingCountEl = document.getElementById('pending-tasks-count');
const completedCountEl = document.getElementById('completed-tasks-count');
const completionPercentageEl = document.getElementById('completion-percentage');
const progressBarFill = document.getElementById('progress-bar-fill');

// Search & Filters
const searchInput = document.getElementById('search-input');
const filterStatusButtons = document.querySelectorAll('[data-filter-status]');
const filterPriorityButtons = document.querySelectorAll('[data-filter-priority]');

// Toast Notifications
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

// Custom Confirm Modal
const confirmModal = document.getElementById('confirm-modal');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupEventListeners();
});

function setupEventListeners() {
    // Task submission
    taskForm.addEventListener('submit', handleAddTask);

    // Search query input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTasks();
    });

    // Status filter clicks
    filterStatusButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterStatusButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeStatusFilter = button.getAttribute('data-filter-status');
            renderTasks();
        });
    });

    // Priority filter clicks
    filterPriorityButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterPriorityButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activePriorityFilter = button.getAttribute('data-filter-priority');
            renderTasks();
        });
    });

    // Confirm modal buttons
    confirmCancelBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        deleteTargetId = null;
        deleteTargetCard = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteTargetId || !deleteTargetCard) return;
        confirmModal.classList.add('hidden');

        const id = deleteTargetId;
        const cardElement = deleteTargetCard;

        try {
            const response = await fetch(`${API_BASE}/tasks/delete/${id}/`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');

            // Play card fade out animation before updating DOM
            cardElement.style.transform = 'scale(0.9) translateY(-10px)';
            cardElement.style.opacity = '0';
            cardElement.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                // Update local state
                tasks = tasks.filter(t => t.id !== id);
                renderTasks();
                showToast('Task deleted successfully.', 'success');
            }, 300);
        } catch (error) {
            console.error('Error deleting task:', error);
            showToast(error.message, 'error');
        } finally {
            deleteTargetId = null;
            deleteTargetCard = null;
        }
    });
}

/* ==========================================================================
   API Communications (Fetch API)
   ========================================================================== */

// GET: View all tasks
async function fetchTasks() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/tasks/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        tasks = await response.ok ? await response.json() : [];
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Could not load tasks from server. Ensure Backend is running!', 'error');
        showLoading(false);
        emptyState.classList.remove('hidden');
    }
}

// POST: Add new task
async function handleAddTask(e) {
    e.preventDefault();
    
    const taskData = {
        title: taskTitleInput.value.trim(),
        description: taskDescInput.value.trim(),
        priority: taskPrioritySelect.value,
        status: taskStatusSelect.value
    };

    if (!taskData.title) return;

    try {
        const response = await fetch(`${API_BASE}/tasks/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to add task');
        }

        const newTask = await response.json();
        
        // Add to local state and reset form
        tasks.push(newTask);
        taskForm.reset();
        
        // Set default values back
        taskPrioritySelect.value = 'Medium';
        taskStatusSelect.value = 'Pending';
        
        renderTasks();
        showToast('Task created successfully!', 'success');
    } catch (error) {
        console.error('Error adding task:', error);
        showToast(error.message, 'error');
    }
}

// PUT: Toggle status (Quick complete checkmark)
async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
        const response = await fetch(`${API_BASE}/tasks/update/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update task status');
        
        const updatedTask = await response.json();
        
        // Update local state
        tasks = tasks.map(t => t.id === id ? updatedTask : t);
        renderTasks();
        
        const msg = newStatus === 'Completed' ? 'Task marked as Completed! 🎉' : 'Task marked as Pending.';
        showToast(msg, 'success');
    } catch (error) {
        console.error('Error updating task status:', error);
        showToast(error.message, 'error');
    }
}

// PUT: Save inline edited task fields
async function saveInlineEdit(id, cardElement) {
    const editTitleInput = cardElement.querySelector('.edit-title-input');
    const editDescInput = cardElement.querySelector('.edit-desc-input');
    const editPrioritySelect = cardElement.querySelector('.edit-priority-select');
    const editStatusSelect = cardElement.querySelector('.edit-status-select');

    const updatedData = {
        title: editTitleInput.value.trim(),
        description: editDescInput.value.trim(),
        priority: editPrioritySelect.value,
        status: editStatusSelect.value
    };

    if (!updatedData.title) {
        showToast('Title is required!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks/update/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Failed to save edits');
        
        const updatedTask = await response.json();
        
        // Update local state
        tasks = tasks.map(t => t.id === id ? updatedTask : t);
        renderTasks();
        showToast('Task updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showToast(error.message, 'error');
    }
}

// DELETE: Delete task
function deleteTask(id, cardElement) {
    // Show custom confirmation modal instead of native prompt
    deleteTargetId = id;
    deleteTargetCard = cardElement;
    confirmModal.classList.remove('hidden');
}

/* ==========================================================================
   Render & UI Updates
   ========================================================================== */

function showLoading(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        taskListContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        taskListContainer.classList.remove('hidden');
    }
}

function updateStatsDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Set numbers
    totalCountEl.textContent = total;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
    completionPercentageEl.textContent = `${percentage}%`;

    // Animate progress bar fill width
    progressBarFill.style.width = `${percentage}%`;
}

function renderTasks() {
    showLoading(false);
    taskListContainer.innerHTML = '';
    
    // Apply filters
    const filteredTasks = tasks.filter(task => {
        const matchesStatus = activeStatusFilter === 'all' || task.status === activeStatusFilter;
        const matchesPriority = activePriorityFilter === 'all' || task.priority === activePriorityFilter;
        
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descMatch = task.description.toLowerCase().includes(searchQuery);
        const matchesSearch = titleMatch || descMatch;

        return matchesStatus && matchesPriority && matchesSearch;
    });

    // Check empty state
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        taskListContainer.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        taskListContainer.classList.remove('hidden');

        filteredTasks.forEach(task => {
            const card = createTaskCard(task);
            taskListContainer.appendChild(card);
        });
    }

    // Always keep counters updated
    updateStatsDashboard();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority} ${task.status === 'Completed' ? 'completed-state' : ''} animate-task-entrance`;
    card.id = `task-card-${task.id}`;

    // Priority level class helper
    const priorityBadgeClass = `badge-priority-${task.priority.toLowerCase()}`;
    const statusBadgeClass = task.status === 'Completed' ? 'badge-status-completed' : 'badge-status-pending';
    const statusIcon = task.status === 'Completed' ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';

    card.innerHTML = `
        <div class="task-card-header">
            <div class="task-title-area">
                <button type="button" class="quick-complete-btn" title="Toggle Completion status">
                    <i class="${statusIcon}"></i>
                </button>
                <h3>${escapeHTML(task.title)}</h3>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" title="Delete Task"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <p class="task-desc">${escapeHTML(task.description || 'No description provided.')}</p>
        <div class="task-card-footer">
            <div class="badge-row">
                <span class="badge ${priorityBadgeClass}"><i class="fa-solid fa-triangle-exclamation"></i> ${task.priority}</span>
                <span class="badge ${statusBadgeClass}">${task.status === 'Completed' ? '<i class="fa-solid fa-check"></i> Completed' : '<i class="fa-solid fa-spinner fa-spin-slow"></i> Pending'}</span>
            </div>
        </div>
    `;

    // Event Handlers attachment
    
    // 1. Quick status toggle
    card.querySelector('.quick-complete-btn').addEventListener('click', () => {
        toggleTaskStatus(task.id, task.status);
    });

    // 2. Delete button
    card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteTask(task.id, card);
    });

    // 3. Edit button (Swaps layout for inline form editing)
    card.querySelector('.edit-btn').addEventListener('click', () => {
        toggleCardEditMode(task, card);
    });

    return card;
}

// Inline card editor toggling
function toggleCardEditMode(task, card) {
    const isCompleted = task.status === 'Completed';
    
    // Save original content in case we cancel
    const originalHTML = card.innerHTML;

    card.innerHTML = `
        <div class="edit-form-container">
            <div class="input-group">
                <input type="text" class="edit-title-input edit-input" value="${escapeHTML(task.title)}" placeholder="Task title..." required>
            </div>
            <div class="input-group">
                <textarea class="edit-desc-input edit-input" placeholder="Task description..." rows="2">${escapeHTML(task.description)}</textarea>
            </div>
            <div class="edit-selects">
                <select class="edit-priority-select">
                    <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                </select>
                <select class="edit-status-select">
                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="edit-actions">
                <button class="edit-cancel-btn" type="button">Cancel</button>
                <button class="edit-save-btn" type="button">Save Changes</button>
            </div>
        </div>
    `;

    // Remove active styles during edit to avoid visuals issues
    card.classList.remove('completed-state');

    // Attach event listeners for edit actions
    card.querySelector('.edit-cancel-btn').addEventListener('click', () => {
        // Revert card view
        if (isCompleted) card.classList.add('completed-state');
        card.innerHTML = originalHTML;
        
        // Re-attach parent event handlers
        card.querySelector('.quick-complete-btn').addEventListener('click', () => {
            toggleTaskStatus(task.id, task.status);
        });
        card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id, card);
        });
        card.querySelector('.edit-btn').addEventListener('click', () => {
            toggleCardEditMode(task, card);
        });
    });

    card.querySelector('.edit-save-btn').addEventListener('click', () => {
        saveInlineEdit(task.id, card);
    });
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Reset toast classes
    toastNotification.className = 'toast-notification';
    toastNotification.classList.add(type);
    
    // Handle status icon
    const icon = toastNotification.querySelector('.toast-icon');
    if (type === 'success') {
        icon.className = 'toast-icon fa-solid fa-circle-check';
    } else if (type === 'error') {
        icon.className = 'toast-icon fa-solid fa-circle-exclamation';
    } else {
        icon.className = 'toast-icon fa-solid fa-circle-info';
    }

    // Unhide toast
    toastNotification.style.opacity = '1';
    toastNotification.style.transform = 'translateY(0)';
    
    // Auto-hide after 3 seconds
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    
    window.toastTimeout = setTimeout(() => {
        toastNotification.style.opacity = '0';
        toastNotification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            toastNotification.classList.add('hidden');
        }, 300);
    }, 3000);
}

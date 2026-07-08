/* ==========================================================================
   Event Registration Management System - Client Side Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('registrationForm');
    const participantIdInput = document.getElementById('participant_id');
    const fullNameInput = document.getElementById('full_name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const collegeInput = document.getElementById('college');
    const eventNameInput = document.getElementById('event_name');
    const registrationFeeInput = document.getElementById('registration_fee');
    
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    
    const searchInput = document.getElementById('searchInput');
    const participantsListContainer = document.getElementById('participantsListContainer');
    const tableLoader = document.getElementById('tableLoader');
    const emptyState = document.getElementById('emptyState');
    const toastContainer = document.getElementById('toastContainer');
    
    // Stats elements
    const statTotalRegistrations = document.getElementById('statTotalRegistrations');
    const statTotalRevenue = document.getElementById('statTotalRevenue');
    const statTotalColleges = document.getElementById('statTotalColleges');
    const statTotalEvents = document.getElementById('statTotalEvents');
    
    // Application State Variables
    let participants = [];
    let isEditing = false;
    let editingId = null;

    // Determine the base API URL based on host environment
    const getApiUrl = (endpoint) => {
        const base = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:8000';
        return `${base}${endpoint}`;
    };

    // --- Helper: Toast Notification ---
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';
        
        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after animation ends
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    };

    // --- Dynamic Stats Computation ---
    const updateStats = (dataList) => {
        const total = dataList.length;
        const revenue = dataList.reduce((acc, p) => acc + (parseFloat(p.registration_fee) || 0), 0);
        
        // Extract unique counts
        const colleges = new Set(dataList.map(p => p.college.toLowerCase().trim()));
        const events = new Set(dataList.map(p => p.event_name.toLowerCase().trim()));
        
        statTotalRegistrations.textContent = total;
        statTotalRevenue.textContent = `₹${revenue.toLocaleString('en-IN')}`;
        statTotalColleges.textContent = colleges.size;
        statTotalEvents.textContent = events.size;
    };

    // --- Render Participant Records ---
    const renderParticipants = (filterText = '') => {
        participantsListContainer.innerHTML = '';
        const search = filterText.toLowerCase().trim();
        
        const filtered = participants.filter(p => {
            return (
                p.participant_id.toString().includes(search) ||
                p.full_name.toLowerCase().includes(search) ||
                p.email.toLowerCase().includes(search) ||
                p.phone.toLowerCase().includes(search) ||
                p.college.toLowerCase().includes(search) ||
                p.event_name.toLowerCase().includes(search)
            );
        });
        
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        filtered.forEach(p => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.id = `participant-${p.participant_id}`;
            
            // Layout is designed to show the fields cleanly matching user requirements
            item.innerHTML = `
                <div class="participant-main">
                    <div class="participant-details">
                        <span class="participant-id">${p.participant_id}</span>
                        <span class="divider">|</span>
                        <span class="participant-name">${escapeHTML(p.full_name)}</span>
                        <span class="divider">|</span>
                        <span class="participant-event">${escapeHTML(p.event_name)}</span>
                    </div>
                    <span class="fee-badge">₹${parseFloat(p.registration_fee)}</span>
                </div>
                <div class="participant-subinfo">
                    <div class="info-item">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <span>${escapeHTML(p.college)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fa-solid fa-envelope"></i>
                        <span>${escapeHTML(p.email)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fa-solid fa-phone"></i>
                        <span>${escapeHTML(p.phone)}</span>
                    </div>
                </div>
                <div class="participant-actions">
                    <button class="action-btn edit" data-id="${p.participant_id}">
                        <i class="fa-solid fa-pen-to-square"></i> Update
                    </button>
                    <button class="action-btn delete" data-id="${p.participant_id}">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            `;
            
            // Attach Event Listeners to actions
            item.querySelector('.edit').addEventListener('click', () => startEdit(p));
            item.querySelector('.delete').addEventListener('click', () => confirmDelete(p.participant_id, p.full_name));
            
            participantsListContainer.appendChild(item);
        });
    };

    // Helper to escape HTML tags to prevent XSS injection
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    };

    // --- GET API: Fetch Participants ---
    const fetchParticipants = async () => {
        tableLoader.classList.remove('hidden');
        emptyState.classList.add('hidden');
        participantsListContainer.innerHTML = '';
        
        try {
            const response = await fetch(getApiUrl('/participants/'));
            if (!response.ok) {
                throw new Error(`Server returned code ${response.status}`);
            }
            
            participants = await response.json();
            updateStats(participants);
            renderParticipants(searchInput.value);
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Unable to connect to the backend database server.', 'error');
            emptyState.classList.remove('hidden');
        } finally {
            tableLoader.classList.add('hidden');
        }
    };

    // --- POST API: Register Participant ---
    const registerParticipant = async (participantData) => {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Registering...';
        
        try {
            const response = await fetch(getApiUrl('/participants/add/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participantData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast(`Successfully registered ${participantData.full_name}!`, 'success');
                resetForm();
                fetchParticipants();
            } else {
                showToast(result.error || 'Failed to register participant.', 'error');
                if (result.error && result.error.includes('ID')) {
                    setError('participant_id', 'This ID is already registered.');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Network error: Could not complete registration.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtnText.textContent = 'Register Participant';
        }
    };

    // --- PUT API: Update Participant ---
    const updateParticipantDetails = async (participantData) => {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Updating...';
        
        try {
            const response = await fetch(getApiUrl(`/participants/update/${editingId}/`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participantData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast(`Successfully updated details for ${participantData.full_name}`, 'success');
                resetForm();
                fetchParticipants();
            } else {
                showToast(result.error || 'Failed to update participant details.', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('Network error: Could not save details.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtnText.textContent = isEditing ? 'Save Changes' : 'Register Participant';
        }
    };

    // --- DELETE API: Delete Participant ---
    const confirmDelete = (id, name) => {
        if (confirm(`Are you sure you want to delete the registration for ${name} (ID: ${id})?`)) {
            executeDelete(id);
        }
    };

    const executeDelete = async (id) => {
        try {
            const response = await fetch(getApiUrl(`/participants/delete/${id}/`), {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('Registration deleted successfully.', 'success');
                if (isEditing && editingId === id) {
                    resetForm();
                }
                fetchParticipants();
            } else {
                showToast(result.error || 'Failed to delete registration.', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Network error: Could not complete deletion request.', 'error');
        }
    };

    // --- Switch Form to Edit Mode ---
    const startEdit = (participant) => {
        isEditing = true;
        editingId = participant.participant_id;
        
        // Fill form fields
        participantIdInput.value = participant.participant_id;
        participantIdInput.disabled = true; // ID cannot be updated
        fullNameInput.value = participant.full_name;
        emailInput.value = participant.email;
        phoneInput.value = participant.phone;
        collegeInput.value = participant.college;
        eventNameInput.value = participant.event_name;
        registrationFeeInput.value = participant.registration_fee;
        
        // Update Form Headings
        formTitle.textContent = 'Update Participant';
        formSubtitle.textContent = `Modifying registration details for ID: ${participant.participant_id}`;
        submitBtnText.textContent = 'Save Changes';
        
        // Change submit btn layout
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-primary'); // keep standard color or styling
        cancelEditBtn.classList.remove('hidden');
        
        // Clear all form validation error tags
        clearAllErrors();
        
        // Scroll to form panel
        document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
    };

    // --- Reset Form to Standard Registration Mode ---
    const resetForm = () => {
        isEditing = false;
        editingId = null;
        form.reset();
        
        // Restore controls
        participantIdInput.disabled = false;
        formTitle.textContent = 'Register Participant';
        formSubtitle.textContent = 'Enter the participant\'s registration details below';
        submitBtnText.textContent = 'Register Participant';
        cancelEditBtn.classList.add('hidden');
        
        clearAllErrors();
    };

    // --- Form Validations ---
    const clearAllErrors = () => {
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        document.querySelectorAll('.input-wrapper input').forEach(el => el.style.borderColor = '');
    };

    const setError = (fieldId, message) => {
        const errEl = document.getElementById(`err_${fieldId}`);
        const inputEl = document.getElementById(fieldId);
        if (errEl) errEl.textContent = message;
        if (inputEl) inputEl.style.borderColor = 'var(--danger)';
    };

    const clearError = (fieldId) => {
        const errEl = document.getElementById(`err_${fieldId}`);
        const inputEl = document.getElementById(fieldId);
        if (errEl) errEl.textContent = '';
        if (inputEl) inputEl.style.borderColor = '';
    };

    const validateForm = () => {
        let isValid = true;
        clearAllErrors();
        
        // Validate ID
        const idVal = participantIdInput.value.trim();
        if (!isEditing) {
            if (!idVal) {
                setError('participant_id', 'Participant ID is required.');
                isValid = false;
            } else if (isNaN(idVal) || parseInt(idVal) <= 0) {
                setError('participant_id', 'Please enter a valid positive ID.');
                isValid = false;
            }
        }
        
        // Validate Full Name
        if (!fullNameInput.value.trim()) {
            setError('full_name', 'Full Name is required.');
            isValid = false;
        }
        
        // Validate Email
        const emailVal = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
            setError('email', 'Email is required.');
            isValid = false;
        } else if (!emailRegex.test(emailVal)) {
            setError('email', 'Please enter a valid email address.');
            isValid = false;
        }
        
        // Validate Phone
        const phoneVal = phoneInput.value.trim();
        const phoneRegex = /^[0-9]{10}$/; // 10 digit check
        if (!phoneVal) {
            setError('phone', 'Phone Number is required.');
            isValid = false;
        } else if (!phoneRegex.test(phoneVal)) {
            setError('phone', 'Phone number must be exactly 10 digits.');
            isValid = false;
        }
        
        // Validate College
        if (!collegeInput.value.trim()) {
            setError('college', 'College Name is required.');
            isValid = false;
        }
        
        // Validate Event Name
        if (!eventNameInput.value.trim()) {
            setError('event_name', 'Event Name is required.');
            isValid = false;
        }
        
        // Validate Registration Fee
        const feeVal = registrationFeeInput.value.trim();
        if (!feeVal) {
            setError('registration_fee', 'Registration Fee is required.');
            isValid = false;
        } else if (isNaN(feeVal) || parseFloat(feeVal) < 0) {
            setError('registration_fee', 'Fee must be a valid positive number.');
            isValid = false;
        }
        
        return isValid;
    };

    // --- Dynamic Field Validations on Input ---
    const setupFieldValidation = (inputEl, fieldId, validationFn) => {
        inputEl.addEventListener('input', () => {
            if (inputEl.value.trim()) {
                const error = validationFn(inputEl.value.trim());
                if (error) {
                    setError(fieldId, error);
                } else {
                    clearError(fieldId);
                }
            } else {
                clearError(fieldId);
            }
        });
    };

    setupFieldValidation(emailInput, 'email', (val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val) ? null : 'Enter a valid email address.';
    });

    setupFieldValidation(phoneInput, 'phone', (val) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(val) ? null : 'Phone number must be 10 digits.';
    });

    setupFieldValidation(registrationFeeInput, 'registration_fee', (val) => {
        return (isNaN(val) || parseFloat(val) < 0) ? 'Fee must be 0 or higher.' : null;
    });

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Please correct validation errors on the form.', 'error');
            return;
        }
        
        const formData = {
            participant_id: parseInt(participantIdInput.value.trim()),
            full_name: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            college: collegeInput.value.trim(),
            event_name: eventNameInput.value.trim(),
            registration_fee: parseFloat(registrationFeeInput.value.trim())
        };
        
        if (isEditing) {
            updateParticipantDetails(formData);
        } else {
            registerParticipant(formData);
        }
    });
    
    cancelEditBtn.addEventListener('click', resetForm);
    
    searchInput.addEventListener('input', (e) => {
        renderParticipants(e.target.value);
    });
    
    // --- Initial Load ---
    fetchParticipants();
});

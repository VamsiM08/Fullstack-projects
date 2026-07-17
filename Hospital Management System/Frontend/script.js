const API_BASE = "http://127.0.0.1:8000";

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Add visual icons based on type
    let iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    else if (type === "warning") iconName = "help-circle";

    toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- API HELPER FUNCTION ---
async function apiCall(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
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

// --- MODAL UTILITIES ---
function openEditModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("open");
}

function closeEditModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("open");
}

// --- DOM CONTENT INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // Render top bar date if active
    const topBarDate = document.getElementById("topbar-date");
    if (topBarDate) {
        topBarDate.innerText = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    // Initialize Page Controllers
    if (document.getElementById("kpi-total-patients")) {
        initDashboard();
    }
    if (document.getElementById("patients-list")) {
        initPatientsPage();
    }
    if (document.getElementById("doctors-list")) {
        initDoctorsPage();
    }
    if (document.getElementById("appointments-list")) {
        initAppointmentsPage();
    }
    if (document.getElementById("records-list")) {
        initRecordsPage();
    }
    if (document.getElementById("bills-list")) {
        initBillingPage();
    }
});


// ==========================================
// 1. ADMIN DASHBOARD PAGE
// ==========================================
async function initDashboard() {
    try {
        const [patients, doctors, appointments, records, bills] = await Promise.all([
            apiCall("/patients/"),
            apiCall("/doctors/"),
            apiCall("/appointments/"),
            apiCall("/records/"),
            apiCall("/bills/")
        ]);

        // 1. Total Counts
        document.getElementById("kpi-total-patients").innerText = patients.length;
        document.getElementById("kpi-total-doctors").innerText = doctors.length;

        // 2. Today's Appointments Count
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const todayAppointments = appointments.filter(app => app.appointment_date === todayStr);
        document.getElementById("kpi-today-appointments").innerText = todayAppointments.length;

        // 3. Total Revenue
        const totalRevenue = bills
            .filter(b => b.payment_status === "Paid")
            .reduce((sum, b) => sum + b.total_amount, 0);
        document.getElementById("kpi-total-revenue").innerText = `₹${totalRevenue}`;

        // 4. Summary card details
        document.getElementById("summary-records-count").innerText = records.length;
        
        const pendingBillsCount = bills.filter(b => b.payment_status === "Pending").length;
        document.getElementById("summary-pending-bills").innerText = pendingBillsCount;

        const avgExp = doctors.length > 0 
            ? (doctors.reduce((sum, d) => sum + (d.experience || 0), 0) / doctors.length).toFixed(1) 
            : 0;
        document.getElementById("summary-avg-exp").innerText = `${avgExp} yrs`;

        const avgAge = patients.length > 0 
            ? (patients.reduce((sum, p) => sum + (p.age || 0), 0) / patients.length).toFixed(1) 
            : 0;
        document.getElementById("summary-avg-age").innerText = `${avgAge} yrs`;

        // 5. Populate Today's Appointments Table
        const todayTableBody = document.getElementById("today-appointments-list");
        todayTableBody.innerHTML = "";
        
        if (todayAppointments.length === 0) {
            todayTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No appointments booked for today.</td></tr>`;
        } else {
            todayAppointments.forEach(app => {
                const tr = document.createElement("tr");
                let badgeClass = "badge-secondary";
                if (app.appointment_status === "Scheduled") badgeClass = "badge-warning";
                else if (app.appointment_status === "Completed") badgeClass = "badge-success";
                else if (app.appointment_status === "Cancelled") badgeClass = "badge-danger";

                tr.innerHTML = `
                    <td><strong>${app.patient_name}</strong></td>
                    <td>${app.doctor_name}</td>
                    <td>${app.appointment_time}</td>
                    <td><span class="badge ${badgeClass}">${app.appointment_status}</span></td>
                `;
                todayTableBody.appendChild(tr);
            });
        }

        // Trigger icon render
        if (window.lucide) lucide.createIcons();

        // 6. Render Charts
        const appScheduled = appointments.filter(a => a.appointment_status === "Scheduled").length;
        const appCompleted = appointments.filter(a => a.appointment_status === "Completed").length;
        const appCancelled = appointments.filter(a => a.appointment_status === "Cancelled").length;

        new Chart(document.getElementById('appointmentsChart'), {
            type: 'doughnut',
            data: {
                labels: ['Scheduled', 'Completed', 'Cancelled'],
                datasets: [{
                    data: [appScheduled, appCompleted, appCancelled],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        const billsPaid = bills.filter(b => b.payment_status === "Paid").length;
        const billsPending = bills.filter(b => b.payment_status === "Pending").length;

        new Chart(document.getElementById('revenueChart'), {
            type: 'pie',
            data: {
                labels: ['Paid Invoices', 'Pending Invoices'],
                datasets: [{
                    data: [billsPaid, billsPending],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

    } catch (err) {
        showToast("Failed to fetch dashboard data: " + err.message, "error");
    }
}


// ==========================================
// 2. PATIENTS PAGE
// ==========================================
async function initPatientsPage() {
    const listBody = document.getElementById("patients-list");
    const regForm = document.getElementById("patient-registration-form");
    const editForm = document.getElementById("edit-patient-form");

    async function loadPatients() {
        try {
            const patients = await apiCall("/patients/");
            listBody.innerHTML = "";
            if (patients.length === 0) {
                listBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No patients registered yet.</td></tr>`;
                return;
            }
            patients.forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${p.patient_id}</strong></td>
                    <td><strong>${p.patient_name}</strong></td>
                    <td>${p.age || 'N/A'} yrs / ${p.gender || 'N/A'}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.25rem;"><i data-lucide="phone" style="width:0.8rem; height:0.8rem; color:var(--text-muted);"></i> ${p.phone || 'N/A'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); display:flex; align-items:center; gap:0.25rem;"><i data-lucide="mail" style="width:0.8rem; height:0.8rem; color:var(--text-muted);"></i> ${p.email || 'N/A'}</div>
                    </td>
                    <td><span class="badge badge-secondary" style="background-color: var(--primary-subtle); color: var(--primary); font-weight:700;">${p.blood_group || 'N/A'}</span></td>
                    <td>${p.address || 'N/A'}</td>
                    <td style="text-align: center;">
                        <div class="btn-group" style="justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="editPatient(${p.patient_id})">
                                <i data-lucide="edit-2" style="width:0.85rem; height:0.85rem;"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deletePatient(${p.patient_id})">
                                <i data-lucide="trash-2" style="width:0.85rem; height:0.85rem;"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);
            });
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            showToast("Failed to load patients: " + err.message, "error");
        }
    }

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            patient_id: document.getElementById("patient-id").value ? parseInt(document.getElementById("patient-id").value) : null,
            patient_name: document.getElementById("patient-name").value,
            age: document.getElementById("patient-age").value ? parseInt(document.getElementById("patient-age").value) : null,
            gender: document.getElementById("patient-gender").value,
            phone: document.getElementById("patient-phone").value,
            email: document.getElementById("patient-email").value,
            blood_group: document.getElementById("patient-blood-group").value,
            address: document.getElementById("patient-address").value
        };

        try {
            await apiCall("/patients/add/", "POST", payload);
            showToast("Patient registered successfully!");
            regForm.reset();
            loadPatients();
        } catch (err) {
            showToast("Failed to register patient: " + err.message, "error");
        }
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-patient-id").value;
        const payload = {
            patient_name: document.getElementById("edit-patient-name").value,
            age: document.getElementById("edit-patient-age").value ? parseInt(document.getElementById("edit-patient-age").value) : null,
            gender: document.getElementById("edit-patient-gender").value,
            phone: document.getElementById("edit-patient-phone").value,
            email: document.getElementById("edit-patient-email").value,
            blood_group: document.getElementById("edit-patient-blood-group").value,
            address: document.getElementById("edit-patient-address").value
        };

        try {
            await apiCall(`/patients/update/${id}/`, "PUT", payload);
            showToast("Patient details updated successfully!");
            closeEditModal("edit-patient-modal");
            loadPatients();
        } catch (err) {
            showToast("Failed to update patient: " + err.message, "error");
        }
    });

    window.editPatient = async (id) => {
        try {
            const patients = await apiCall("/patients/");
            const p = patients.find(item => item.patient_id === id);
            if (!p) return;

            document.getElementById("edit-patient-id").value = p.patient_id;
            document.getElementById("edit-patient-name").value = p.patient_name;
            document.getElementById("edit-patient-age").value = p.age || '';
            document.getElementById("edit-patient-gender").value = p.gender || '';
            document.getElementById("edit-patient-phone").value = p.phone || '';
            document.getElementById("edit-patient-email").value = p.email || '';
            document.getElementById("edit-patient-blood-group").value = p.blood_group || '';
            document.getElementById("edit-patient-address").value = p.address || '';

            openEditModal("edit-patient-modal");
        } catch (err) {
            showToast("Error retrieving details: " + err.message, "error");
        }
    };

    window.deletePatient = async (id) => {
        if (!confirm("Are you sure you want to delete this patient profile?")) return;
        try {
            await apiCall(`/patients/delete/${id}/`, "DELETE");
            showToast("Patient record deleted successfully.");
            loadPatients();
        } catch (err) {
            showToast("Failed to delete patient: " + err.message, "error");
        }
    };

    loadPatients();
}


// ==========================================
// 3. DOCTORS PAGE
// ==========================================
async function initDoctorsPage() {
    const listGrid = document.getElementById("doctors-list");
    const regForm = document.getElementById("doctor-registration-form");
    const editForm = document.getElementById("edit-doctor-form");

    async function loadDoctors() {
        try {
            const doctors = await apiCall("/doctors/");
            listGrid.innerHTML = "";
            if (doctors.length === 0) {
                listGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); background: white; padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-card);">No doctor profiles found.</div>`;
                return;
            }
            doctors.forEach(d => {
                const card = document.createElement("div");
                card.className = "doctor-card";
                card.innerHTML = `
                    <div class="doctor-avatar">
                        <i data-lucide="user-round"></i>
                    </div>
                    <div class="doctor-name">${d.doctor_name}</div>
                    <div class="doctor-dept">${d.specialization || 'General Practice'}</div>
                    <div class="doctor-details">
                        <div class="doctor-detail-item">
                            <span>Doctor ID:</span>
                            <span>#${d.doctor_id}</span>
                        </div>
                        <div class="doctor-detail-item">
                            <span>Experience:</span>
                            <span>${d.experience || 0} Years</span>
                        </div>
                        <div class="doctor-detail-item">
                            <span>Department:</span>
                            <span>${d.department || 'N/A'}</span>
                        </div>
                        <div class="doctor-detail-item">
                            <span>Consultation Fee:</span>
                            <span style="font-weight:700; color:var(--primary);">₹${d.consultation_fee || 0}</span>
                        </div>
                        <div class="doctor-detail-item">
                            <span>Contact No:</span>
                            <span>${d.phone || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="btn-group" style="width: 100%; margin-top: auto;">
                        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="editDoctor(${d.doctor_id})">
                            <i data-lucide="edit-2" style="width:0.85rem; height:0.85rem;"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="flex:1;" onclick="deleteDoctor(${d.doctor_id})">
                            <i data-lucide="trash-2" style="width:0.85rem; height:0.85rem;"></i> Delete
                        </button>
                    </div>
                `;
                listGrid.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            showToast("Failed to load doctors: " + err.message, "error");
        }
    }

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            doctor_id: document.getElementById("doctor-id").value ? parseInt(document.getElementById("doctor-id").value) : null,
            doctor_name: document.getElementById("doctor-name").value,
            specialization: document.getElementById("doctor-specialization").value,
            department: document.getElementById("doctor-department").value,
            experience: document.getElementById("doctor-experience").value ? parseInt(document.getElementById("doctor-experience").value) : null,
            phone: document.getElementById("doctor-phone").value,
            consultation_fee: document.getElementById("doctor-fee").value ? parseFloat(document.getElementById("doctor-fee").value) : 0
        };

        try {
            await apiCall("/doctors/add/", "POST", payload);
            showToast("Doctor profile added successfully!");
            regForm.reset();
            loadDoctors();
        } catch (err) {
            showToast("Failed to add doctor: " + err.message, "error");
        }
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-doctor-id").value;
        const payload = {
            doctor_name: document.getElementById("edit-doctor-name").value,
            specialization: document.getElementById("edit-doctor-specialization").value,
            department: document.getElementById("edit-doctor-department").value,
            experience: document.getElementById("edit-doctor-experience").value ? parseInt(document.getElementById("edit-doctor-experience").value) : null,
            phone: document.getElementById("edit-doctor-phone").value,
            consultation_fee: document.getElementById("edit-doctor-fee").value ? parseFloat(document.getElementById("edit-doctor-fee").value) : 0
        };

        try {
            await apiCall(`/doctors/update/${id}/`, "PUT", payload);
            showToast("Doctor details updated successfully!");
            closeEditModal("edit-doctor-modal");
            loadDoctors();
        } catch (err) {
            showToast("Failed to update doctor: " + err.message, "error");
        }
    });

    window.editDoctor = async (id) => {
        try {
            const doctors = await apiCall("/doctors/");
            const d = doctors.find(item => item.doctor_id === id);
            if (!d) return;

            document.getElementById("edit-doctor-id").value = d.doctor_id;
            document.getElementById("edit-doctor-name").value = d.doctor_name;
            document.getElementById("edit-doctor-specialization").value = d.specialization || '';
            document.getElementById("edit-doctor-department").value = d.department || '';
            document.getElementById("edit-doctor-experience").value = d.experience || '';
            document.getElementById("edit-doctor-phone").value = d.phone || '';
            document.getElementById("edit-doctor-fee").value = d.consultation_fee || '';

            openEditModal("edit-doctor-modal");
        } catch (err) {
            showToast("Error retrieving doctor details: " + err.message, "error");
        }
    };

    window.deleteDoctor = async (id) => {
        if (!confirm("Are you sure you want to delete this doctor profile?")) return;
        try {
            await apiCall(`/doctors/delete/${id}/`, "DELETE");
            showToast("Doctor profile deleted successfully.");
            loadDoctors();
        } catch (err) {
            showToast("Failed to delete doctor: " + err.message, "error");
        }
    };

    loadDoctors();
}


// ==========================================
// 4. APPOINTMENT MANAGEMENT PAGE
// ==========================================
async function initAppointmentsPage() {
    const listBody = document.getElementById("appointments-list");
    const regForm = document.getElementById("appointment-booking-form");
    const editForm = document.getElementById("edit-appointment-form");
    
    const patSelect = document.getElementById("appointment-patient-name");
    const docSelect = document.getElementById("appointment-doctor-name");
    const editPatSelect = document.getElementById("edit-appointment-patient-name");
    const editDocSelect = document.getElementById("edit-appointment-doctor-name");

    async function loadSelectDropdowns() {
        try {
            const [patients, doctors] = await Promise.all([
                apiCall("/patients/"),
                apiCall("/doctors/")
            ]);

            patSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            editPatSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            docSelect.innerHTML = `<option value="">Select Doctor</option>`;
            editDocSelect.innerHTML = `<option value="">Select Doctor</option>`;

            patients.forEach(p => {
                const opt = `<option value="${p.patient_name}">${p.patient_name} (ID: ${p.patient_id})</option>`;
                patSelect.insertAdjacentHTML("beforeend", opt);
                editPatSelect.insertAdjacentHTML("beforeend", opt);
            });

            doctors.forEach(d => {
                const opt = `<option value="${d.doctor_name}">${d.doctor_name} (${d.specialization})</option>`;
                docSelect.insertAdjacentHTML("beforeend", opt);
                editDocSelect.insertAdjacentHTML("beforeend", opt);
            });
        } catch (err) {
            showToast("Failed to populate dropdowns: " + err.message, "error");
        }
    }

    async function loadAppointments() {
        try {
            const appointments = await apiCall("/appointments/");
            listBody.innerHTML = "";
            if (appointments.length === 0) {
                listBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No appointments booked.</td></tr>`;
                return;
            }
            appointments.forEach(a => {
                const tr = document.createElement("tr");
                let badgeClass = "badge-secondary";
                if (a.appointment_status === "Scheduled") badgeClass = "badge-warning";
                else if (a.appointment_status === "Completed") badgeClass = "badge-success";
                else if (a.appointment_status === "Cancelled") badgeClass = "badge-danger";

                tr.innerHTML = `
                    <td><strong>${a.appointment_id}</strong></td>
                    <td><strong>${a.patient_name}</strong></td>
                    <td>${a.doctor_name}</td>
                    <td>${a.appointment_date} @ ${a.appointment_time}</td>
                    <td><span class="badge ${badgeClass}">${a.appointment_status}</span></td>
                    <td style="text-align: center;">
                        <div class="btn-group" style="justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="editAppointment(${a.appointment_id})">
                                <i data-lucide="edit-2" style="width:0.85rem; height:0.85rem;"></i> Edit
                            </button>
                            <button class="btn btn-primary btn-sm" style="background-color:#0ea5e9; color:white;" onclick="quickStatusAppointment(${a.appointment_id}, 'Completed')">
                                <i data-lucide="check-circle" style="width:0.85rem; height:0.85rem;"></i> Done
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.appointment_id})">
                                <i data-lucide="trash-2" style="width:0.85rem; height:0.85rem;"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);
            });
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            showToast("Failed to load appointments: " + err.message, "error");
        }
    }

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            appointment_id: document.getElementById("appointment-id").value ? parseInt(document.getElementById("appointment-id").value) : null,
            patient_name: patSelect.value,
            doctor_name: docSelect.value,
            appointment_date: document.getElementById("appointment-date").value,
            appointment_time: document.getElementById("appointment-time").value,
            appointment_status: document.getElementById("appointment-status").value
        };

        try {
            await apiCall("/appointments/add/", "POST", payload);
            showToast("Appointment booked successfully!");
            regForm.reset();
            loadAppointments();
        } catch (err) {
            showToast("Failed to book appointment: " + err.message, "error");
        }
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-appointment-id").value;
        const payload = {
            patient_name: editPatSelect.value,
            doctor_name: editDocSelect.value,
            appointment_date: document.getElementById("edit-appointment-date").value,
            appointment_time: document.getElementById("edit-appointment-time").value,
            appointment_status: document.getElementById("edit-appointment-status").value
        };

        try {
            await apiCall(`/appointments/update/${id}/`, "PUT", payload);
            showToast("Appointment updated successfully!");
            closeEditModal("edit-appointment-modal");
            loadAppointments();
        } catch (err) {
            showToast("Failed to update appointment: " + err.message, "error");
        }
    });

    window.editAppointment = async (id) => {
        try {
            const appointments = await apiCall("/appointments/");
            const a = appointments.find(item => item.appointment_id === id);
            if (!a) return;

            document.getElementById("edit-appointment-id").value = a.appointment_id;
            editPatSelect.value = a.patient_name;
            editDocSelect.value = a.doctor_name;
            document.getElementById("edit-appointment-date").value = a.appointment_date;
            document.getElementById("edit-appointment-time").value = a.appointment_time;
            document.getElementById("edit-appointment-status").value = a.appointment_status;

            openEditModal("edit-appointment-modal");
        } catch (err) {
            showToast("Error fetching details: " + err.message, "error");
        }
    };

    window.quickStatusAppointment = async (id, status) => {
        try {
            const appointments = await apiCall("/appointments/");
            const a = appointments.find(item => item.appointment_id === id);
            if (!a) return;
            
            a.appointment_status = status;
            await apiCall(`/appointments/update/${id}/`, "PUT", a);
            showToast(`Appointment status updated to ${status}`);
            loadAppointments();
        } catch (err) {
            showToast("Failed to update status: " + err.message, "error");
        }
    };

    window.deleteAppointment = async (id) => {
        if (!confirm("Cancel & Delete this appointment?")) return;
        try {
            await apiCall(`/appointments/delete/${id}/`, "DELETE");
            showToast("Appointment deleted successfully.");
            loadAppointments();
        } catch (err) {
            showToast("Failed to delete appointment: " + err.message, "error");
        }
    };

    await loadSelectDropdowns();
    loadAppointments();
}


// ==========================================
// 5. MEDICAL RECORD MANAGEMENT PAGE
// ==========================================
async function initRecordsPage() {
    const listBody = document.getElementById("records-list");
    const regForm = document.getElementById("record-registration-form");
    const editForm = document.getElementById("edit-record-form");

    const patSelect = document.getElementById("record-patient-name");
    const docSelect = document.getElementById("record-doctor-name");
    const editPatSelect = document.getElementById("edit-record-patient-name");
    const editDocSelect = document.getElementById("edit-record-doctor-name");

    async function loadSelectDropdowns() {
        try {
            const [patients, doctors] = await Promise.all([
                apiCall("/patients/"),
                apiCall("/doctors/")
            ]);

            patSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            editPatSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            docSelect.innerHTML = `<option value="">Select Doctor</option>`;
            editDocSelect.innerHTML = `<option value="">Select Doctor</option>`;

            patients.forEach(p => {
                const opt = `<option value="${p.patient_name}">${p.patient_name} (ID: ${p.patient_id})</option>`;
                patSelect.insertAdjacentHTML("beforeend", opt);
                editPatSelect.insertAdjacentHTML("beforeend", opt);
            });

            doctors.forEach(d => {
                const opt = `<option value="${d.doctor_name}">${d.doctor_name} (${d.specialization})</option>`;
                docSelect.insertAdjacentHTML("beforeend", opt);
                editDocSelect.insertAdjacentHTML("beforeend", opt);
            });
        } catch (err) {
            showToast("Failed to populate dropdowns: " + err.message, "error");
        }
    }

    async function loadRecords() {
        try {
            const records = await apiCall("/records/");
            listBody.innerHTML = "";
            if (records.length === 0) {
                listBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No records registered.</td></tr>`;
                return;
            }
            records.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${r.record_id}</strong></td>
                    <td><strong>${r.patient_name}</strong></td>
                    <td>${r.doctor_name}</td>
                    <td>${r.diagnosis || 'N/A'}</td>
                    <td>${r.prescription || 'N/A'}</td>
                    <td>${r.treatment || 'N/A'}</td>
                    <td>${r.visit_date}</td>
                    <td style="text-align: center;">
                        <div class="btn-group" style="justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="editRecord(${r.record_id})">
                                <i data-lucide="edit-2" style="width:0.85rem; height:0.85rem;"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRecord(${r.record_id})">
                                <i data-lucide="trash-2" style="width:0.85rem; height:0.85rem;"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);
            });
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            showToast("Failed to load records: " + err.message, "error");
        }
    }

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            record_id: document.getElementById("record-id").value ? parseInt(document.getElementById("record-id").value) : null,
            patient_name: patSelect.value,
            doctor_name: docSelect.value,
            diagnosis: document.getElementById("record-diagnosis").value,
            prescription: document.getElementById("record-prescription").value,
            treatment: document.getElementById("record-treatment").value,
            visit_date: document.getElementById("record-visit-date").value
        };

        try {
            await apiCall("/records/add/", "POST", payload);
            showToast("Medical record saved successfully!");
            regForm.reset();
            loadRecords();
        } catch (err) {
            showToast("Failed to save medical record: " + err.message, "error");
        }
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-record-id").value;
        const payload = {
            patient_name: editPatSelect.value,
            doctor_name: editDocSelect.value,
            diagnosis: document.getElementById("edit-record-diagnosis").value,
            prescription: document.getElementById("edit-record-prescription").value,
            treatment: document.getElementById("edit-record-treatment").value,
            visit_date: document.getElementById("edit-record-visit-date").value
        };

        try {
            await apiCall(`/records/update/${id}/`, "PUT", payload);
            showToast("Medical record updated successfully!");
            closeEditModal("edit-record-modal");
            loadRecords();
        } catch (err) {
            showToast("Failed to update record: " + err.message, "error");
        }
    });

    window.editRecord = async (id) => {
        try {
            const records = await apiCall("/records/");
            const r = records.find(item => item.record_id === id);
            if (!r) return;

            document.getElementById("edit-record-id").value = r.record_id;
            editPatSelect.value = r.patient_name;
            editDocSelect.value = r.doctor_name;
            document.getElementById("edit-record-diagnosis").value = r.diagnosis || '';
            document.getElementById("edit-record-prescription").value = r.prescription || '';
            document.getElementById("edit-record-treatment").value = r.treatment || '';
            document.getElementById("edit-record-visit-date").value = r.visit_date;

            openEditModal("edit-record-modal");
        } catch (err) {
            showToast("Error retrieving medical record: " + err.message, "error");
        }
    };

    window.deleteRecord = async (id) => {
        if (!confirm("Permanently delete this patient medical record?")) return;
        try {
            await apiCall(`/records/delete/${id}/`, "DELETE");
            showToast("Medical record deleted successfully.");
            loadRecords();
        } catch (err) {
            showToast("Failed to delete record: " + err.message, "error");
        }
    };

    await loadSelectDropdowns();
    loadRecords();
}


// ==========================================
// 6. BILLING & INVOICE MANAGEMENT PAGE
// ==========================================
async function initBillingPage() {
    const listBody = document.getElementById("bills-list");
    const regForm = document.getElementById("billing-form");
    const editForm = document.getElementById("edit-bill-form");

    const patSelect = document.getElementById("bill-patient-name");
    const editPatSelect = document.getElementById("edit-bill-patient-name");

    const cFeeInput = document.getElementById("bill-consultation-fee");
    const mFeeInput = document.getElementById("bill-medicine-charge");
    const lFeeInput = document.getElementById("bill-laboratory-charge");

    const editCFeeInput = document.getElementById("edit-bill-consultation-fee");
    const editMFeeInput = document.getElementById("edit-bill-medicine-charge");
    const editLFeeInput = document.getElementById("edit-bill-laboratory-charge");

    function updateLiveTotal() {
        const c = parseFloat(cFeeInput.value) || 0;
        const m = parseFloat(mFeeInput.value) || 0;
        const l = parseFloat(lFeeInput.value) || 0;
        document.getElementById("live-total-fee").innerText = `₹${(c + m + l).toFixed(2)}`;
    }

    function updateEditLiveTotal() {
        const c = parseFloat(editCFeeInput.value) || 0;
        const m = parseFloat(editMFeeInput.value) || 0;
        const l = parseFloat(editLFeeInput.value) || 0;
        document.getElementById("edit-live-total-fee").innerText = `₹${(c + m + l).toFixed(2)}`;
    }

    [cFeeInput, mFeeInput, lFeeInput].forEach(inp => inp.addEventListener("input", updateLiveTotal));
    [editCFeeInput, editMFeeInput, editLFeeInput].forEach(inp => inp.addEventListener("input", updateEditLiveTotal));

    async function loadPatientsDropdown() {
        try {
            const patients = await apiCall("/patients/");
            patSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            editPatSelect.innerHTML = `<option value="">Select Registered Patient</option>`;
            patients.forEach(p => {
                const opt = `<option value="${p.patient_name}">${p.patient_name} (ID: ${p.patient_id})</option>`;
                patSelect.insertAdjacentHTML("beforeend", opt);
                editPatSelect.insertAdjacentHTML("beforeend", opt);
            });
        } catch (err) {
            showToast("Failed to load patients list: " + err.message, "error");
        }
    }

    patSelect.addEventListener("change", async () => {
        const selPatient = patSelect.value;
        if (!selPatient) {
            cFeeInput.value = 0;
            updateLiveTotal();
            return;
        }

        try {
            const [appointments, doctors] = await Promise.all([
                apiCall("/appointments/"),
                apiCall("/doctors/")
            ]);

            const patientApp = appointments
                .filter(a => a.patient_name === selPatient)
                .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];
            
            if (patientApp) {
                const doc = doctors.find(d => d.doctor_name === patientApp.doctor_name);
                if (doc) {
                    cFeeInput.value = doc.consultation_fee;
                    showToast(`Consultation fee auto-filled from ${doc.doctor_name}'s rates.`);
                } else {
                    cFeeInput.value = 0;
                }
            } else {
                cFeeInput.value = 0;
            }
            updateLiveTotal();
        } catch (err) {
            console.error("Failed to lookup doctor rates", err);
        }
    });

    async function loadBills() {
        try {
            const bills = await apiCall("/bills/");
            listBody.innerHTML = "";
            if (bills.length === 0) {
                listBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No invoices logged.</td></tr>`;
                return;
            }
            bills.forEach(b => {
                const tr = document.createElement("tr");
                let badgeClass = b.payment_status === "Paid" ? "badge-success" : "badge-warning";

                tr.innerHTML = `
                    <td><strong>#${b.bill_id}</strong></td>
                    <td><strong>${b.patient_name}</strong></td>
                    <td>₹${b.consultation_fee}</td>
                    <td>₹${b.medicine_charge}</td>
                    <td>₹${b.laboratory_charge}</td>
                    <td><strong style="color:var(--primary)">₹${b.total_amount}</strong></td>
                    <td>${b.payment_method}</td>
                    <td><span class="badge ${badgeClass}">${b.payment_status}</span></td>
                    <td style="text-align: center;">
                        <div class="btn-group" style="justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="editBill(${b.bill_id})">
                                <i data-lucide="edit-2" style="width:0.85rem; height:0.85rem;"></i> Edit
                            </button>
                            <button class="btn btn-primary btn-sm" style="background-color: var(--secondary); color:white;" onclick="printBill(${b.bill_id})">
                                <i data-lucide="printer" style="width:0.85rem; height:0.85rem;"></i> Print
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBill(${b.bill_id})">
                                <i data-lucide="trash-2" style="width:0.85rem; height:0.85rem;"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);
            });
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            showToast("Failed to load bills: " + err.message, "error");
        }
    }

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            bill_id: document.getElementById("bill-id").value ? parseInt(document.getElementById("bill-id").value) : null,
            patient_name: patSelect.value,
            consultation_fee: parseFloat(cFeeInput.value) || 0,
            medicine_charge: parseFloat(mFeeInput.value) || 0,
            laboratory_charge: parseFloat(lFeeInput.value) || 0,
            payment_method: document.getElementById("bill-payment-method").value,
            payment_status: document.getElementById("bill-payment-status").value
        };

        try {
            await apiCall("/bills/add/", "POST", payload);
            showToast("Invoice generated successfully!");
            regForm.reset();
            document.getElementById("live-total-fee").innerText = "₹0.00";
            loadBills();
        } catch (err) {
            showToast("Failed to generate bill: " + err.message, "error");
        }
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-bill-id").value;
        const payload = {
            patient_name: editPatSelect.value,
            consultation_fee: parseFloat(editCFeeInput.value) || 0,
            medicine_charge: parseFloat(editMFeeInput.value) || 0,
            laboratory_charge: parseFloat(editLFeeInput.value) || 0,
            payment_method: document.getElementById("edit-bill-payment-method").value,
            payment_status: document.getElementById("edit-bill-payment-status").value
        };

        try {
            await apiCall(`/bills/update/${id}/`, "PUT", payload);
            showToast("Bill records updated successfully!");
            closeEditModal("edit-bill-modal");
            loadBills();
        } catch (err) {
            showToast("Failed to update bill: " + err.message, "error");
        }
    });

    window.editBill = async (id) => {
        try {
            const bills = await apiCall("/bills/");
            const b = bills.find(item => item.bill_id === id);
            if (!b) return;

            document.getElementById("edit-bill-id").value = b.bill_id;
            editPatSelect.value = b.patient_name;
            editCFeeInput.value = b.consultation_fee;
            editMFeeInput.value = b.medicine_charge;
            editLFeeInput.value = b.laboratory_charge;
            document.getElementById("edit-bill-payment-method").value = b.payment_method;
            document.getElementById("edit-bill-payment-status").value = b.payment_status;

            updateEditLiveTotal();
            openEditModal("edit-bill-modal");
        } catch (err) {
            showToast("Error retrieving invoice: " + err.message, "error");
        }
    };

    window.printBill = async (id) => {
        try {
            const bills = await apiCall("/bills/");
            const b = bills.find(item => item.bill_id === id);
            if (!b) return;

            document.getElementById("print-invoice-id").innerText = `#${b.bill_id}`;
            document.getElementById("print-patient-name").innerText = b.patient_name;
            
            const dateStr = new Date().toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            document.getElementById("print-invoice-date").innerText = dateStr;

            document.getElementById("print-consultation-fee").innerText = b.consultation_fee.toFixed(2);
            document.getElementById("print-medicine-charge").innerText = b.medicine_charge.toFixed(2);
            document.getElementById("print-laboratory-charge").innerText = b.laboratory_charge.toFixed(2);
            
            document.getElementById("print-payment-method").innerText = b.payment_method;
            
            const pStatus = document.getElementById("print-payment-status");
            pStatus.innerText = b.payment_status;
            pStatus.className = b.payment_status === "Paid" ? "badge badge-success" : "badge badge-warning";

            document.getElementById("print-total-amount").innerText = `₹${b.total_amount.toFixed(2)}`;

            openEditModal("print-modal");
        } catch (err) {
            showToast("Invoice print generation failed: " + err.message, "error");
        }
    };

    window.deleteBill = async (id) => {
        if (!confirm("Permanently delete this invoice?")) return;
        try {
            await apiCall(`/bills/delete/${id}/`, "DELETE");
            showToast("Invoice deleted successfully.");
            loadBills();
        } catch (err) {
            showToast("Failed to delete bill: " + err.message, "error");
        }
    };

    await loadPatientsDropdown();
    loadBills();
}

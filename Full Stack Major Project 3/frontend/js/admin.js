// Admin Portal Javascript controller

document.addEventListener("DOMContentLoaded", () => {
    // 1. Guard check: Must be Admin to view
    if (!isAdmin()) {
        showToast("Access denied. Admin privileges required.", "danger");
        setTimeout(() => {
            window.location.href = isLoggedIn() ? "index.html" : "login.html";
        }, 1500);
        return;
    }

    // Initialize global lists
    let movies = [];
    let theatres = [];
    let screens = [];
    let shows = [];
    let bookings = [];
    let users = [];

    // Chart.js references
    let revenueChart = null;
    let moviesChart = null;

    // Panel Switch logic
    const navItems = document.querySelectorAll(".admin-nav-item");
    const panels = document.querySelectorAll(".admin-panel-view");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            const target = item.getAttribute("data-target");
            panels.forEach(panel => {
                panel.classList.remove("active");
                if (panel.id === target) {
                    panel.classList.add("active");
                }
            });

            // Trigger specific load logic
            if (target === "dashboard-panel") {
                loadDashboardData();
            } else if (target === "movies-panel") {
                loadMovies();
            } else if (target === "theatres-panel") {
                loadTheatres();
            } else if (target === "shows-panel") {
                loadShows();
            } else if (target === "bookings-panel") {
                loadBookings();
            } else if (target === "users-panel") {
                loadUsers();
            }
        });
    });

    // --- Tab 1: Dashboard Analytics ---
    async function loadDashboardData() {
        try {
            const summary = await apiRequest("dashboard");
            if (!summary) return;

            // Render KPI widgets
            const kpiContainer = document.getElementById("kpi-container");
            kpiContainer.innerHTML = `
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-film"></i></div>
                    <div class="kpi-details">
                        <h3>Total Movies</h3>
                        <span>${summary.totalMovies}</span>
                    </div>
                </div>
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-building"></i></div>
                    <div class="kpi-details">
                        <h3>Theatres (Screens)</h3>
                        <span>${summary.totalTheatres} (${summary.totalScreens})</span>
                    </div>
                </div>
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-ticket-alt"></i></div>
                    <div class="kpi-details">
                        <h3>Bookings</h3>
                        <span>${summary.totalBookings}</span>
                    </div>
                </div>
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-users"></i></div>
                    <div class="kpi-details">
                        <h3>Customers</h3>
                        <span>${summary.totalUsers}</span>
                    </div>
                </div>
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div>
                    <div class="kpi-details">
                        <h3>Today's Income</h3>
                        <span>Rs. ${summary.todayRevenue}</span>
                    </div>
                </div>
                <div class="glass-panel kpi-card">
                    <div class="kpi-icon"><i class="fas fa-chart-bar"></i></div>
                    <div class="kpi-details">
                        <h3>Monthly Sales</h3>
                        <span>Rs. ${summary.monthlyRevenue}</span>
                    </div>
                </div>
            `;

            // Draw Charts
            drawCharts();

        } catch (err) {
            console.error(err);
        }
    }

    async function drawCharts() {
        try {
            // Revenue Chart
            const revData = await apiRequest("dashboard/revenue");
            const topMovies = await apiRequest("dashboard/top-movies");

            // 1. Line Chart (Revenue)
            const revCtx = document.getElementById("revenueChart").getContext("2d");
            const dailyLabels = revData.dailyRevenue.map(d => d.date);
            const dailyRevenue = revData.dailyRevenue.map(d => d.revenue);

            if (revenueChart) revenueChart.destroy();
            revenueChart = new Chart(revCtx, {
                type: 'line',
                data: {
                    labels: dailyLabels.length > 0 ? dailyLabels : ["No Sales"],
                    datasets: [{
                        label: 'Revenue (Rs.)',
                        data: dailyRevenue.length > 0 ? dailyRevenue : [0],
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });

            // 2. Bar Chart (Top Movies)
            const movieCtx = document.getElementById("moviesChart").getContext("2d");
            const movieTitles = topMovies.map(m => m.title);
            const movieRevenues = topMovies.map(m => m.revenue);

            if (moviesChart) moviesChart.destroy();
            moviesChart = new Chart(movieCtx, {
                type: 'bar',
                data: {
                    labels: movieTitles.length > 0 ? movieTitles : ["No Bookings"],
                    datasets: [{
                        label: 'Earnings (Rs.)',
                        data: movieRevenues.length > 0 ? movieRevenues : [0],
                        backgroundColor: '#EC4899',
                        borderColor: '#EC4899',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
                        x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });

        } catch (err) {
            console.error(err);
        }
    }


    // --- Tab 2: Movie Management ---
    async function loadMovies() {
        try {
            movies = await apiRequest("movies");
            const table = document.getElementById("admin-movies-table");
            table.innerHTML = movies.map(m => `
                <tr>
                    <td><img src="${m.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=50'}" style="width: 42px; height: 56px; object-fit: cover; border-radius: 4px;"></td>
                    <td style="font-weight: 600;">${m.title}</td>
                    <td>${m.genre}</td>
                    <td>${m.language}</td>
                    <td>${m.duration}</td>
                    <td><i class="fas fa-star" style="color: var(--warning);"></i> ${m.rating}</td>
                    <td>
                        <i class="fas fa-edit action-icon action-edit" onclick="editMovie('${m._id}')" title="Edit"></i>
                        <i class="fas fa-trash action-icon action-delete" onclick="deleteMovie('${m._id}')" title="Delete"></i>
                    </td>
                </tr>
            `).join('');
        } catch(e) { console.error(e); }
    }

    // Modal forms toggles
    document.getElementById("add-movie-btn").addEventListener("click", () => {
        document.getElementById("movie-form").reset();
        document.getElementById("movie-form-id").value = "";
        document.getElementById("movie-modal-title").innerText = "Add Movie";
        openModal("movie-modal");
    });

    document.getElementById("movie-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("movie-form-id").value;
        const title = document.getElementById("movie-title").value;
        const genre = document.getElementById("movie-genre").value;
        const language = document.getElementById("movie-language").value;
        const duration = document.getElementById("movie-duration").value;
        const rating = document.getElementById("movie-rating").value;
        const releaseDate = document.getElementById("movie-release").value;
        const poster = document.getElementById("movie-poster").value;
        const banner = document.getElementById("movie-banner").value;
        const trailer = document.getElementById("movie-trailer").value;
        const description = document.getElementById("movie-desc").value;

        const payload = { title, genre, language, duration, rating, releaseDate, poster, banner, trailer, description };

        try {
            let res;
            if (id) {
                // Update
                res = await apiRequest(`movies/${id}`, "PUT", payload);
                if (res) showToast("Movie updated successfully", "success");
            } else {
                // Create
                res = await apiRequest("movies", "POST", payload);
                if (res) showToast("Movie created successfully", "success");
            }
            closeModal("movie-modal");
            loadMovies();
        } catch(err) { console.error(err); }
    });

    // Make functions globally available for inline onclicks
    window.editMovie = function(id) {
        const m = movies.find(x => x._id === id);
        if (!m) return;

        document.getElementById("movie-form-id").value = m._id;
        document.getElementById("movie-title").value = m.title;
        document.getElementById("movie-genre").value = m.genre;
        document.getElementById("movie-language").value = m.language;
        document.getElementById("movie-duration").value = m.duration;
        document.getElementById("movie-rating").value = m.rating;
        document.getElementById("movie-release").value = m.releaseDate || "";
        document.getElementById("movie-poster").value = m.poster || "";
        document.getElementById("movie-banner").value = m.banner || "";
        document.getElementById("movie-trailer").value = m.trailer || "";
        document.getElementById("movie-desc").value = m.description || "";

        document.getElementById("movie-modal-title").innerText = "Edit Movie";
        openModal("movie-modal");
    }

    window.deleteMovie = async function(id) {
        if (confirm("Are you sure you want to delete this movie? All associated show schedules and booking logs will be deleted!")) {
            try {
                const res = await apiRequest(`movies/${id}`, "DELETE");
                if (res) {
                    showToast("Movie deleted successfully", "success");
                    loadMovies();
                }
            } catch(e) { console.error(e); }
        }
    }


    // --- Tab 3: Theatres & Screens ---
    async function loadTheatres() {
        try {
            theatres = await apiRequest("theatres");
            const table = document.getElementById("admin-theatres-table");
            table.innerHTML = theatres.map(t => `
                <tr>
                    <td style="font-weight: 600;">${t.theatreName}</td>
                    <td>${t.city}</td>
                    <td>${t.address}</td>
                    <td><span class="category-chip" style="cursor:default; padding:0.25rem 0.6rem;">${t.screens} Screens</span></td>
                    <td>
                        <i class="fas fa-edit action-icon action-edit" onclick="editTheatre('${t._id}')" title="Edit"></i>
                        <i class="fas fa-trash action-icon action-delete" onclick="deleteTheatre('${t._id}')" title="Delete"></i>
                    </td>
                </tr>
            `).join('');
        } catch(e) { console.error(e); }
    }

    document.getElementById("add-theatre-btn").addEventListener("click", () => {
        document.getElementById("theatre-form").reset();
        document.getElementById("theatre-form-id").value = "";
        document.getElementById("theatre-modal-title").innerText = "Add Theatre";
        document.getElementById("theatre-screens").disabled = false; // allow setting screens initially
        openModal("theatre-modal");
    });

    document.getElementById("theatre-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("theatre-form-id").value;
        const theatreName = document.getElementById("theatre-name").value;
        const city = document.getElementById("theatre-city").value;
        const address = document.getElementById("theatre-address").value;
        const screensCount = document.getElementById("theatre-screens").value;

        const payload = { theatreName, city, address, screens: screensCount };

        try {
            let res;
            if (id) {
                res = await apiRequest(`theatres/${id}`, "PUT", { theatreName, city, address });
                if (res) showToast("Theatre updated successfully", "success");
            } else {
                res = await apiRequest("theatres", "POST", payload);
                if (res) showToast("Theatre created successfully", "success");
            }
            closeModal("theatre-modal");
            loadTheatres();
        } catch(err) { console.error(err); }
    });

    window.editTheatre = function(id) {
        const t = theatres.find(x => x._id === id);
        if (!t) return;

        document.getElementById("theatre-form-id").value = t._id;
        document.getElementById("theatre-name").value = t.theatreName;
        document.getElementById("theatre-city").value = t.city;
        document.getElementById("theatre-address").value = t.address;
        document.getElementById("theatre-screens").value = t.screens;
        document.getElementById("theatre-screens").disabled = true; // disable screens modification here

        document.getElementById("theatre-modal-title").innerText = "Edit Theatre info";
        openModal("theatre-modal");
    }

    window.deleteTheatre = async function(id) {
        if (confirm("Are you sure you want to delete this theatre? This will delete all screens, scheduled shows and booking histories associated with it!")) {
            try {
                const res = await apiRequest(`theatres/${id}`, "DELETE");
                if (res) {
                    showToast("Theatre deleted successfully", "success");
                    loadTheatres();
                }
            } catch(e) { console.error(e); }
        }
    }


    // --- Tab 4: Shows Scheduler ---
    async function loadShows() {
        try {
            shows = await apiRequest("shows");
            const table = document.getElementById("admin-shows-table");
            table.innerHTML = shows.map(s => {
                const movie = s.movie || { title: "Deleted Movie" };
                const theatre = s.theatre || { theatreName: "Deleted Theatre" };
                const screen = s.screen || { screenName: "N/A" };
                const statusStr = s.enabled ? "Active" : "Disabled";
                const statusClass = s.enabled ? "active" : "inactive";

                return `
                    <tr>
                        <td style="font-weight: 600;">${movie.title}</td>
                        <td>${theatre.theatreName}</td>
                        <td>${screen.screenName}</td>
                        <td>${s.showDate}</td>
                        <td>${s.showTime}</td>
                        <td>Rs. ${s.ticketPrice}</td>
                        <td>
                            <span class="status-pill ${statusClass}" style="cursor: pointer;" onclick="toggleShowStatus('${s._id}', ${s.enabled})" title="Click to toggle status">
                                <i class="fas ${s.enabled ? 'fa-check' : 'fa-ban'}"></i> ${statusStr}
                            </span>
                        </td>
                        <td>
                            <i class="fas fa-trash action-icon action-delete" onclick="deleteShow('${s._id}')" title="Delete Schedule"></i>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch(e) { console.error(e); }
    }

    document.getElementById("add-show-btn").addEventListener("click", async () => {
        // Fetch movies and theatres for selector lists
        try {
            const listM = await apiRequest("movies");
            const listT = await apiRequest("theatres");

            const movieSelect = document.getElementById("show-movie-select");
            const theatreSelect = document.getElementById("show-theatre-select");

            movieSelect.innerHTML = listM.map(m => `<option value="${m._id}">${m.title} (${m.language})</option>`).join('');
            theatreSelect.innerHTML = `<option value="">Choose Theatre</option>` + listT.map(t => `<option value="${t._id}">${t.theatreName}</option>`).join('');
            
            // clear screen select
            document.getElementById("show-screen-select").innerHTML = `<option value="">Select Theatre first</option>`;

            openModal("show-modal");
        } catch(e) { console.error(e); }
    });

    // Populate screens when theatre is selected
    document.getElementById("show-theatre-select").addEventListener("change", async (e) => {
        const theatreId = e.target.value;
        const screenSelect = document.getElementById("show-screen-select");
        if (!theatreId) {
            screenSelect.innerHTML = `<option value="">Choose Theatre First</option>`;
            return;
        }

        try {
            const screensList = await apiRequest(`screens?theatreId=${theatreId}`);
            screenSelect.innerHTML = screensList.map(s => `<option value="${s._id}">${s.screenName} (Cap: ${s.totalSeats} seats)</option>`).join('');
        } catch(err) { console.error(err); }
    });

    // Submit show scheduler form
    document.getElementById("show-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const movieId = document.getElementById("show-movie-select").value;
        const theatreId = document.getElementById("show-theatre-select").value;
        const screenId = document.getElementById("show-screen-select").value;
        const showDate = document.getElementById("show-date").value;
        const showTime = document.getElementById("show-time").value;
        const ticketPrice = document.getElementById("show-price").value;

        if (!screenId) {
            showToast("Please choose a valid Screen for scheduling", "warning");
            return;
        }

        try {
            const res = await apiRequest("shows", "POST", {
                movieId, theatreId, screenId, showDate, showTime, ticketPrice
            });
            if (res) {
                showToast("Show scheduled successfully", "success");
                closeModal("show-modal");
                loadShows();
            }
        } catch(err) { console.error(err); }
    });

    window.toggleShowStatus = async function(id, currentStatus) {
        try {
            const res = await apiRequest(`shows/${id}`, "PUT", { enabled: !currentStatus });
            if (res) {
                showToast(`Show status toggled successfully`, "success");
                loadShows();
            }
        } catch(err) { console.error(err); }
    }

    window.deleteShow = async function(id) {
        if (confirm("Are you sure you want to delete this show schedule? All bookings for this show will be deleted!")) {
            try {
                const res = await apiRequest(`shows/${id}`, "DELETE");
                if (res) {
                    showToast("Show deleted successfully", "success");
                    loadShows();
                }
            } catch(e) { console.error(e); }
        }
    }


    // --- Tab 5: Bookings Logs ---
    async function loadBookings() {
        try {
            bookings = await apiRequest("bookings");
            const table = document.getElementById("admin-bookings-table");
            table.innerHTML = bookings.map(b => {
                const user = b.user || { name: "N/A" };
                const show = b.show || {};
                const movie = show.movie || { title: "Deleted Movie" };
                const theatre = show.theatre || { theatreName: "Deleted Theatre" };
                const screen = show.screen || { screenName: "Screen 1" };
                const isCancelled = b.status === "Cancelled";

                return `
                    <tr>
                        <td style="font-size: 0.8rem; font-family: monospace;">${b._id}</td>
                        <td style="font-weight:600;">${user.name}</td>
                        <td>${movie.title}</td>
                        <td>${theatre.theatreName}<br/><span style="font-size:0.75rem; color:var(--text-secondary);">${screen.screenName}</span></td>
                        <td>Date: ${show.showDate}<br/><span style="font-size:0.75rem; color:var(--text-secondary);">Time: ${show.showTime}</span></td>
                        <td><span class="category-chip" style="cursor:default; padding: 0.25rem 0.5rem; font-size:0.8rem;">${b.seats.join(', ')}</span></td>
                        <td>Rs. ${b.totalAmount}</td>
                        <td>
                            <span class="booking-status-badge ${isCancelled ? 'cancelled' : 'confirmed'}">
                                ${b.status}
                            </span>
                        </td>
                        <td>
                            ${!isCancelled ? `<button class="btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.8rem; border-color:rgba(239, 68, 68, 0.3); color:var(--danger);" onclick="cancelBooking('${b._id}')">Cancel</button>` : 'Cancelled'}
                        </td>
                    </tr>
                `;
            }).join('');
        } catch(e) { console.error(e); }
    }

    window.cancelBooking = async function(id) {
        if (confirm("Are you sure you want to cancel this booking?")) {
            try {
                const res = await apiRequest(`bookings/${id}`, "DELETE");
                if (res) {
                    showToast("Booking cancelled successfully", "success");
                    loadBookings();
                }
            } catch(e) { console.error(e); }
        }
    }


    // --- Tab 6: User Management ---
    async function loadUsers() {
        try {
            users = await apiRequest("users");
            const table = document.getElementById("admin-users-table");
            table.innerHTML = users.map(u => {
                // If user is active, active value should be check. We fallback to true if undefined.
                const isActive = u.active !== false;
                const statusStr = isActive ? "Active" : "Blocked";
                const statusClass = isActive ? "active" : "inactive";

                return `
                    <tr>
                        <td style="font-weight: 600;">${u.name}</td>
                        <td>${u.email}</td>
                        <td>${u.phone}</td>
                        <td><span class="category-chip" style="cursor:default; padding:0.25rem 0.5rem; font-size:0.8rem; text-transform:uppercase; ${u.role === 'admin' ? 'background: var(--accent-magenta);' : ''}">${u.role}</span></td>
                        <td>
                            <span class="status-pill ${statusClass}">
                                <i class="fas ${isActive ? 'fa-check-circle' : 'fa-ban'}"></i> ${statusStr}
                            </span>
                        </td>
                        <td>
                            ${u._id !== currentUser._id ? `
                                <button class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem; ${isActive ? 'color: var(--danger); border-color: rgba(239, 68, 68, 0.3);' : 'color: var(--success); border-color: rgba(16, 185, 129, 0.3);'}" onclick="toggleUserStatus('${u._id}', ${isActive})">
                                    ${isActive ? 'Block' : 'Unblock'}
                                </button>
                                <button class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem; border-color: rgba(239, 68, 68, 0.3); color: var(--danger); margin-left: 0.3rem;" onclick="deleteUser('${u._id}')">
                                    Delete
                                </button>
                            ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Self (Cannot Edit)</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        } catch(e) { console.error(e); }
    }

    window.toggleUserStatus = async function(id, currentStatus) {
        try {
            const res = await apiRequest(`users/${id}/status`, "PUT", { active: !currentStatus });
            if (res) {
                showToast(`User account status updated successfully`, "success");
                loadUsers();
            }
        } catch(err) { console.error(err); }
    }

    window.deleteUser = async function(id) {
        if (confirm("Are you sure you want to delete this user? All their bookings will be removed!")) {
            try {
                const res = await apiRequest(`users/${id}`, "DELETE");
                if (res) {
                    showToast("User account deleted successfully", "success");
                    loadUsers();
                }
            } catch(e) { console.error(e); }
        }
    }


    // --- Global Modal helper functions ---
    window.openModal = function(id) {
        document.getElementById(id).style.display = "flex";
    }

    window.closeModal = function(id) {
        document.getElementById(id).style.display = "none";
    }


    // Initial setup
    loadDashboardData();
});

// MediFlow - Eye Hospital Operations Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();

    // Set up event listeners
    setupEventListeners();

    // Load initial data
    loadDashboardData();
    // initialize flow mode from server
    (async () => {
        try {
            const res = await fetch('/api/flow-mode');
            const json = await res.json();
            const auto = json.auto === true;
            // set radios/checkbox accordingly
            const autoRadio = document.getElementById('auto-mode');
            const manualRadio = document.getElementById('manual-mode');
            if (autoRadio && manualRadio) {
                autoRadio.checked = auto;
                manualRadio.checked = !auto;
                document.getElementById('manual-reassignment-section').style.display = auto ? 'none' : 'block';
            }
            if (auto) startAutoFlow();
        } catch (e) {
            console.error('Failed to get flow mode', e);
        }
    })();
});

// Initialize dashboard components
function initializeDashboard() {
    // Initialize charts
    initializeCharts();

    // Set up auto-refresh (every 30 seconds)
    setInterval(loadDashboardData, 30000);
}

// Set up event listeners
function setupEventListeners() {
    // Simulate button
    const simBtn = document.getElementById('simulate-btn');
    if (simBtn) simBtn.addEventListener('click', function() { simulateActivity(); });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', function() {
        resetDashboard();
    });

    // System toggle (checkbox on index) maps to flow-mode manual/auto
    const sysToggle = document.getElementById('system-toggle');
    if (sysToggle) {
        sysToggle.addEventListener('change', function(e) {
            const isManual = e.target.checked;
            // when checkbox is checked we treat as Manual mode
            setFlowMode(!isManual);
            toggleSystemStatus(isManual);
        });
    }

    // Operation mode radio buttons (in dashboard template)
    const opRadios = document.querySelectorAll('input[name="operation-mode"]');
    opRadios.forEach(r => r.addEventListener('change', function(e) {
        const auto = document.getElementById('auto-mode').checked;
        setFlowMode(auto);
        // show/hide manual reassignment section
        document.getElementById('manual-reassignment-section').style.display = auto ? 'none' : 'block';
        if (auto) startAutoFlow(); else stopAutoFlow();
    }));
}

let autoFlowInterval = null;

async function setFlowMode(auto) {
    try {
        await fetch('/api/flow-mode', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({auto: !!auto})
        });
        if (auto) startAutoFlow(); else stopAutoFlow();
    } catch (e) {
        console.error('Failed to set flow mode', e);
    }
}

function startAutoFlow() {
    if (autoFlowInterval) return;
    // call advance every 10 seconds
    autoFlowInterval = setInterval(async () => {
        try {
            const res = await fetch('/api/advance', {method: 'POST'});
            const json = await res.json();
            if (json && json.status === 'success') {
                // reload dashboard data and patients
                await loadDashboardData();
                if (window.fetchPatientsData) window.fetchPatientsData();
            }
        } catch (err) {
            console.error('Auto flow advance failed', err);
        }
    }, 10000);
    if (window.setAutoPolling) window.setAutoPolling(true);
}

function stopAutoFlow() {
    if (!autoFlowInterval) return;
    clearInterval(autoFlowInterval);
    autoFlowInterval = null;
    if (window.setAutoPolling) window.setAutoPolling(false);
}

// Initialize Chart.js charts
function initializeCharts() {
    // Patient Distribution Chart
    const patientCtx = document.getElementById('patientDistributionChart').getContext('2d');
    window.patientChart = new Chart(patientCtx, {
        type: 'bar',
        data: {
            labels: ['Screening', 'Imaging', 'Reception', 'Pharmacy'],
            datasets: [{
                label: 'Patients',
                data: [25, 18, 32, 15],
                backgroundColor: [
                    '#0EA5E9', // Primary Blue
                    '#38BDF8', // Light Blue
                    '#14B8A6', // Secondary Teal
                    '#22C55E'  // Success Green
                ],
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#E5E7EB'
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Load dashboard data from API
async function loadDashboardData() {
    try {
        // Load overview data
        const overviewResponse = await fetch('/api/overview');
        const overviewData = await overviewResponse.json();

        // Update stats cards
        updateStatsCards(overviewData);

        // Load patient distribution data
        const distributionResponse = await fetch('/api/patient-distribution');
        const distributionData = await distributionResponse.json();

        // Update patient distribution chart
        updatePatientDistributionChart(distributionData);

        // Load wait times data
        const waitTimesResponse = await fetch('/api/wait-times');
        const waitTimesData = await waitTimesResponse.json();

        // Update wait time analysis
        updateWaitTimeAnalysis(waitTimesData);

        // Load alerts
        const alertsResponse = await fetch('/api/alerts');
        const alertsData = await alertsResponse.json();
        updateAlerts(alertsData);

        // Load doctors/staff
        const doctorsResponse = await fetch('/api/doctors');
        const doctorsData = await doctorsResponse.json();
        updateDoctorsTable(doctorsData);

        // Load resources
        const resourcesResponse = await fetch('/api/resources');
        const resourcesData = await resourcesResponse.json();
        updateResourcesTable(resourcesData);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Failed to load dashboard data');
    }
}

function updateAlerts(alerts) {
    const container = document.getElementById('alerts');
    if (!container) return;
    container.innerHTML = '';
    alerts.slice(0,5).forEach(a => {
        const el = document.createElement('div');
        el.className = `alert alert-${a.type || 'info'}`;
        el.textContent = a.message;
        container.appendChild(el);
    });
}

function updateDoctorsTable(doctors) {
    const tbody = document.querySelector('#doctor-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    doctors.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${d.name}</td><td><span class="badge bg-${d.status === 'Available' ? 'success' : 'warning'}">${d.status}</span></td>`;
        tbody.appendChild(tr);
    });
}

function updateResourcesTable(resources) {
    const tbody = document.querySelector('#resource-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    resources.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.name}</td><td><span class="badge bg-${r.status === 'Available' ? 'success' : 'warning'}">${r.status}</span></td>`;
        tbody.appendChild(tr);
    });
}

// Update statistics cards
function updateStatsCards(data) {
    document.getElementById('total-patients').textContent = data.total_patients;
    document.getElementById('avg-wait-time').textContent = data.avg_wait_time;
    document.getElementById('active-staff').textContent = data.active_staff;
    document.getElementById('occupancy').textContent = data.occupancy + '%';
}

// Update patient distribution chart
function updatePatientDistributionChart(data) {
    if (window.patientChart) {
        window.patientChart.data.labels = data.labels;
        window.patientChart.data.datasets[0].data = data.data;
        window.patientChart.update();
    }
}

// Update wait time analysis
function updateWaitTimeAnalysis(data) {
    document.getElementById('total-wait-patients').textContent = data.total_patients;
    document.getElementById('avg-wait').textContent = data.avg_wait + ' min';
    document.getElementById('max-wait').textContent = data.max_wait + ' min';
    document.getElementById('min-wait').textContent = data.min_wait + ' min';
}

// Simulate hospital activity
async function simulateActivity() {
    const button = document.getElementById('simulate-btn');
    const originalText = button.innerHTML;

    try {
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';
        button.classList.add('loading');

        // Call simulation API
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Reload data immediately
            await loadDashboardData();
            showSuccessMessage('Simulation completed successfully!');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Simulation error:', error);
        showErrorMessage('Simulation failed: ' + error.message);
    } finally {
        // Reset button state
        button.innerHTML = originalText;
        button.classList.remove('loading');
    }
}

// Reset dashboard data
async function resetDashboard() {
    const button = document.getElementById('reset-btn');
    const originalText = button.innerHTML;

    try {
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        button.classList.add('loading');

        // Call reset API
        const response = await fetch('/api/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Reload data immediately
            await loadDashboardData();
            showSuccessMessage('Dashboard reset successfully!');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Reset error:', error);
        showErrorMessage('Reset failed: ' + error.message);
    } finally {
        // Reset button state
        button.innerHTML = originalText;
        button.classList.remove('loading');
    }
}

// Toggle system status
function toggleSystemStatus(isActive) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    if (isActive) {
        statusDot.style.backgroundColor = '#EF4444';
        statusText.textContent = 'Manual Mode';
        // Disable auto-refresh
        if (window.refreshInterval) {
            clearInterval(window.refreshInterval);
            window.refreshInterval = null;
        }
    } else {
        statusDot.style.backgroundColor = '#22C55E';
        statusText.textContent = 'System Online';
        // Enable auto-refresh
        if (!window.refreshInterval) {
            window.refreshInterval = setInterval(loadDashboardData, 30000);
        }
    }
}

// Show success message
function showSuccessMessage(message) {
    showToast(message, 'success');
}

// Show error message
function showErrorMessage(message) {
    showToast(message, 'error');
}

// Show toast notification
function showToast(message, type) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

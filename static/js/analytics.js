document.addEventListener('DOMContentLoaded', function() {
    loadAnalyticsData();
    setInterval(loadAnalyticsData, 300000); // Update every 5 minutes
});

function loadAnalyticsData() {
    fetch('/api/analytics')
        .then(response => response.json())
        .then(data => {
            updateKPIs(data.kpis);
            updateCharts(data.charts);
        })
        .catch(error => console.error('Error loading analytics data:', error));
}

function updateKPIs(kpis) {
    document.getElementById('satisfaction-score').textContent = kpis.satisfaction_score + '%';
    document.getElementById('avg-treatment-time').textContent = kpis.avg_treatment_time + ' min';
    document.getElementById('resource-utilization').textContent = kpis.resource_utilization + '%';
    document.getElementById('cost-efficiency').textContent = kpis.cost_efficiency + '%';
}

function updateCharts(chartsData) {
    // Patient Flow Trends Chart
    const patientFlowCtx = document.getElementById('patientFlowChart').getContext('2d');
    new Chart(patientFlowCtx, {
        type: 'line',
        data: {
            labels: chartsData.patient_flow.labels,
            datasets: [{
                label: 'Patients',
                data: chartsData.patient_flow.data,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Department Performance Chart
    const departmentCtx = document.getElementById('departmentChart').getContext('2d');
    new Chart(departmentCtx, {
        type: 'bar',
        data: {
            labels: chartsData.department_performance.labels,
            datasets: [{
                label: 'Performance Score',
                data: chartsData.department_performance.data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Waiting Time Distribution Chart
    const waitingTimeCtx = document.getElementById('waitingTimeChart').getContext('2d');
    new Chart(waitingTimeCtx, {
        type: 'doughnut',
        data: {
            labels: chartsData.waiting_time.labels,
            datasets: [{
                data: chartsData.waiting_time.data,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });

    // Resource Usage by Hour Chart
    const resourceUsageCtx = document.getElementById('resourceUsageChart').getContext('2d');
    new Chart(resourceUsageCtx, {
        type: 'radar',
        data: {
            labels: chartsData.resource_usage.labels,
            datasets: [{
                label: 'MRI Scanner',
                data: chartsData.resource_usage.mri,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)'
            }, {
                label: 'CT Scanner',
                data: chartsData.resource_usage.ct,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)'
            }, {
                label: 'X-Ray',
                data: chartsData.resource_usage.xray,
                borderColor: 'rgba(255, 205, 86, 1)',
                backgroundColor: 'rgba(255, 205, 86, 0.2)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });

    // Patient Demographics Chart
    const demographicsCtx = document.getElementById('demographicsChart').getContext('2d');
    new Chart(demographicsCtx, {
        type: 'pie',
        data: {
            labels: chartsData.demographics.labels,
            datasets: [{
                data: chartsData.demographics.data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });

    // Revenue Analytics Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: chartsData.revenue.labels,
            datasets: [{
                label: 'Revenue ($)',
                data: chartsData.revenue.data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function exportAnalytics(format) {
    const url = `/api/export/analytics/${format}`;
    window.open(url, '_blank');
}

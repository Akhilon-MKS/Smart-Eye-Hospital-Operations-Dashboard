document.addEventListener('DOMContentLoaded', function() {
    fetchDoctorsData();
    setInterval(fetchDoctorsData, 10000); // Update every 10 seconds
});

function fetchDoctorsData() {
    fetch('/api/doctors')
        .then(response => response.json())
        .then(data => {
            updateDoctorsTable(data);
        })
        .catch(error => console.error('Error fetching doctors data:', error));
}

function updateDoctorsTable(doctors) {
    const tbody = document.querySelector('#doctors-table tbody');
    tbody.innerHTML = '';
    doctors.forEach(doctor => {
        const statusLabel = doctor.status || 'Unknown';
        const statusClass = getStatusClass(statusLabel);
        const specialization = doctor.role || getDoctorSpecialization(doctor.name);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id ?? '—'}</td>
            <td>${doctor.name ?? 'Unknown'}</td>
            <td><span class="badge bg-${statusClass}">${statusLabel}</span></td>
            <td>${specialization}</td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusClass(status) {
    const classes = {
        'Available': 'success',
        'Busy': 'warning',
        'On Break': 'danger',
        'In Surgery': 'danger'
    };
    return classes[status] || 'secondary';
}

function getDoctorSpecialization(name) {
    // Simple specialization assignment based on doctor name
    const specializations = {
        'Dr. Smith': 'Ophthalmologist',
        'Dr. Johnson': 'Retinal Specialist',
        'Dr. Williams': 'Cornea Specialist',
        'Dr. Brown': 'Glaucoma Specialist',
        'Dr. Jones': 'Pediatric Ophthalmologist'
    };
    return specializations[name] || 'General Ophthalmologist';
}

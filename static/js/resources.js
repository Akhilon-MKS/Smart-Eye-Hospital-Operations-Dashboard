document.addEventListener('DOMContentLoaded', function() {
    fetchResourcesData();
    setInterval(fetchResourcesData, 10000); // Update every 10 seconds
});

function fetchResourcesData() {
    fetch('/api/resources')
        .then(response => response.json())
        .then(data => {
            updateResourcesTable(data);
        })
        .catch(error => console.error('Error fetching resources data:', error));
}

function updateResourcesTable(resources) {
    const tbody = document.querySelector('#resources-table tbody');
    tbody.innerHTML = '';
    resources.forEach(resource => {
        const nameLabel = resource.name || 'Unknown';
        const statusLabel = resource.status || 'Unknown';
        const statusClass = statusLabel === 'Available' ? 'success' : 'warning';
        const type = getResourceType(nameLabel);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${resource.id ?? '—'}</td>
            <td>${nameLabel}</td>
            <td><span class="badge bg-${statusClass}">${statusLabel}</span></td>
            <td>${type}</td>
        `;
        tbody.appendChild(row);
    });
}

function getResourceType(name) {
    if ((name || '').includes('Room')) return 'Room';
    if ((name || '').includes('Scanner') || (name || '').includes('Machine')) return 'Equipment';
    return 'Facility';
}

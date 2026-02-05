document.addEventListener('DOMContentLoaded', function() {
    window.isAutoFlow = false;
    fetchFlowMode();
    fetchPatientsData();
    // Default polling interval
    window.patientsPollInterval = setInterval(fetchPatientsData, 10000); // Update every 10 seconds
    // Fetch auto-config and wire save button
    fetchAutoConfig();
    const saveBtn = document.getElementById('cfg-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const t = document.getElementById('cfg-crowd-threshold');
            const m = document.getElementById('cfg-max-moves');
            const payload = { crowd_threshold: parseInt(t.value, 10), max_moves_per_stage: parseInt(m.value, 10) };
            saveAutoConfig(payload);
        });
    }
});

function setPatientsPollingInterval(ms) {
    if (window.patientsPollInterval) clearInterval(window.patientsPollInterval);
    window.patientsPollInterval = setInterval(fetchPatientsData, ms);
}

function setAutoPolling(enabled) {
    if (enabled) setPatientsPollingInterval(5000);
    else setPatientsPollingInterval(10000);
}

function fetchPatientsData() {
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            updatePatientsTables(data);
            // if in auto flow, ask server to check and balance crowded departments
            if (window.isAutoFlow) {
                fetch('/api/check-balance')
                    .then(r => r.json())
                    .then(res => {
                        if (res.moved && res.moved.length) {
                            console.log('Auto-balance moved:', res.moved);
                            // refresh tables after auto-move
                            fetchPatientsData();
                        }
                    })
                    .catch(e => console.error('Error checking balance:', e));
            }
        })
        .catch(error => console.error('Error fetching patients data:', error));
}

function updatePatientsTables(patients) {
    // Group patients by stage
    const stages = {
        'all': patients,
        'Registration': patients.filter(p => p.stage === 'Registration'),
        'Triage': patients.filter(p => p.stage === 'Triage'),
        'Imaging': patients.filter(p => p.stage === 'Imaging'),
        'Consultation': patients.filter(p => p.stage === 'Consultation'),
        'Diagnosis': patients.filter(p => p.stage === 'Diagnosis'),
        'Treatment': patients.filter(p => p.stage === 'Treatment'),
        'Discharge': patients.filter(p => p.stage === 'Discharge')
    };

    // Update each table
    Object.keys(stages).forEach(stage => {
        const tableId = stage === 'all' ? 'all-patients-table' : `${stage.toLowerCase()}-table`;
        updateTable(tableId, stages[stage], stage === 'all');
    });
}

function updateTable(tableId, patients, isAllTable = false) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = '';
    patients.forEach(patient => {
        const stageLabel = patient.stage || 'N/A';
        const priorityLabel = patient.priority || 'N/A';
        const entryTimeLabel = patient.entry_time || '—';
        const doctorIdLabel = (patient.doctor_id !== undefined && patient.doctor_id !== null) ? patient.doctor_id : '—';
        const waitingTimeLabel = (patient.waiting_time !== undefined && patient.waiting_time !== null) ? patient.waiting_time : 0;

        const priorityClass = getPriorityClass(priorityLabel);
        const stageClass = getStageClass(stageLabel);
        const row = document.createElement('tr');
        // Build standard cells
        const baseCells = isAllTable ? `
                <td>${patient.id ?? '—'}</td>
                <td>${patient.name ?? 'Unknown'}</td>
                <td><span class="badge bg-${stageClass}">${stageLabel}</span></td>
                <td><span class="badge bg-${priorityClass}">${priorityLabel}</span></td>
                <td>${doctorIdLabel}</td>
                <td>${entryTimeLabel}</td>
                <td>${waitingTimeLabel} min</td>
            ` : `
                <td>${patient.id ?? '—'}</td>
                <td>${patient.name ?? 'Unknown'}</td>
                <td><span class="badge bg-${priorityClass}">${priorityLabel}</span></td>
                <td>${doctorIdLabel}</td>
                <td>${entryTimeLabel}</td>
                <td>${waitingTimeLabel} min</td>
            `;

        row.innerHTML = baseCells;

        // Actions column: show move controls only when manual mode (auto disabled)
        const actionsCell = document.createElement('td');
        if (!window.isAutoFlow) {
            const select = document.createElement('select');
            select.className = 'form-select form-select-sm';
            select.style.width = '180px';
            const stageOptions = ['Reception','Registration','Triage','Imaging','Consultation','Diagnosis','Treatment','Pharmacy','Discharge'];
            stageOptions.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.text = s;
                if (s === stageLabel) opt.selected = true;
                select.appendChild(opt);
            });

            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-primary ms-2';
            btn.textContent = 'Move';
            btn.onclick = () => {
                const toStage = select.value;
                movePatient(patient.id, toStage);
            };

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.appendChild(select);
            wrapper.appendChild(btn);
            actionsCell.appendChild(wrapper);
        } else {
            actionsCell.textContent = '-';
        }

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

function fetchFlowMode() {
    fetch('/api/flow-mode')
        .then(r => r.json())
        .then(data => {
            window.isAutoFlow = !!data.auto;
        })
        .catch(e => console.error('Error fetching flow mode:', e));
}

function fetchAutoConfig() {
    fetch('/api/auto-config')
        .then(r => r.json())
        .then(cfg => {
            const t = document.getElementById('cfg-crowd-threshold');
            const m = document.getElementById('cfg-max-moves');
            if (t) t.value = cfg.crowd_threshold ?? 40;
            if (m) m.value = cfg.max_moves_per_stage ?? 3;
        })
        .catch(e => console.error('Error fetching auto config:', e));
}

function saveAutoConfig(payload) {
    fetch('/api/auto-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') {
            alert('Auto-balance settings saved');
        } else {
            alert('Failed to save settings');
        }
    })
    .catch(e => { console.error(e); alert('Failed to save settings'); });
}

function movePatient(id, toStage) {
    fetch('/api/move-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, to_stage: toStage })
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') {
            fetchPatientsData();
        } else {
            console.error('Move failed', res);
            alert('Move failed');
        }
    })
    .catch(e => { console.error(e); alert('Move failed'); });
}

function getStageClass(stage) {
    const classes = {
        'Registration': 'primary',
        'Triage': 'secondary',
        'Imaging': 'info',
        'Consultation': 'warning',
        'Diagnosis': 'light',
        'Treatment': 'danger',
        'Discharge': 'success'
    };
    return classes[stage] || 'secondary';
}

function getPriorityClass(priority) {
    const classes = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger'
    };
    return classes[priority] || 'secondary';
}

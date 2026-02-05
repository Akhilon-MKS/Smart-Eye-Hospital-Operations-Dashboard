from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

# Flow mode: automatic or manual
flow_mode = {'auto': False}

# Auto-balance configuration (crowd threshold and moves per stage)
auto_config = {
    'crowd_threshold': 40,
    'max_moves_per_stage': 3
}

# Define the ordered stages for patient movement
STAGE_ORDER = ['Reception', 'Screening', 'Imaging', 'Consultation', 'Surgery', 'Treatment', 'Pharmacy', 'Discharge']

# Sample data for simulation
sample_data = {
    'total_patients': 143,
    'avg_wait_time': 23.3,
    'active_staff': 14,
    'occupancy': 82,
    'patient_distribution': {
        'Reception': 1,
        'Consultation': 1,
        'Discharge': 1,
        'Imaging': 1,
        'Treatment': 1
    },
    'wait_times': {
        'total_patients': 170,
        'avg_wait': 21,
        'max_wait': 47,
        'min_wait': 5
    }
}

# Sample patient data
sample_patients = [
    {'id': 1, 'name': 'John Doe', 'age': 45, 'condition': 'Cataract', 'status': 'Waiting', 'stage': 'Reception', 'priority': 'Medium', 'doctor_id': 2, 'entry_time': '10:15', 'waiting_time': 25},
    {'id': 2, 'name': 'Jane Smith', 'age': 32, 'condition': 'Glaucoma', 'status': 'In Treatment', 'stage': 'Consultation', 'priority': 'High', 'doctor_id': 2, 'entry_time': '09:50', 'waiting_time': 15},
    {'id': 3, 'name': 'Bob Johnson', 'age': 58, 'condition': 'Retinal Detachment', 'status': 'Completed', 'stage': 'Discharge', 'priority': 'Low', 'doctor_id': 4, 'entry_time': '08:30', 'waiting_time': 0},
    {'id': 4, 'name': 'Alice Brown', 'age': 29, 'condition': 'Dry Eyes', 'status': 'Waiting', 'stage': 'Imaging', 'priority': 'Medium', 'doctor_id': 1, 'entry_time': '10:40', 'waiting_time': 35},
    {'id': 5, 'name': 'Charlie Wilson', 'age': 67, 'condition': 'Macular Degeneration', 'status': 'In Treatment', 'stage': 'Treatment', 'priority': 'High', 'doctor_id': 4, 'entry_time': '11:00', 'waiting_time': 10},
]

# Sample staff data
sample_staff = [
    {'id': 1, 'name': 'Dr. Sarah Johnson', 'role': 'Ophthalmologist', 'status': 'Available', 'patients_today': 8},
    {'id': 2, 'name': 'Dr. Michael Chen', 'role': 'Optometrist', 'status': 'Busy', 'patients_today': 12},
    {'id': 3, 'name': 'Nurse Emily Davis', 'role': 'RN', 'status': 'Available', 'patients_today': 6},
    {'id': 4, 'name': 'Dr. Robert Taylor', 'role': 'Surgeon', 'status': 'In Surgery', 'patients_today': 3},
    {'id': 5, 'name': 'Nurse Lisa Wong', 'role': 'LPN', 'status': 'Available', 'patients_today': 9},
]

# Sample resources data (used by frontend /api/resources)
sample_resources = [
    {'id': 1, 'name': 'Room 1', 'status': 'Available'},
    {'id': 2, 'name': 'Room 2', 'status': 'Busy'},
    {'id': 3, 'name': 'Imaging Scanner', 'status': 'Available'},
    {'id': 4, 'name': 'Surgical Machine', 'status': 'Busy'},
]

# Sample alerts data
sample_alerts = [
    {'id': 1, 'type': 'warning', 'message': 'High patient wait time in Reception', 'time': '2 minutes ago'},
    {'id': 2, 'type': 'info', 'message': 'Dr. Chen completed 12 patient consultations today', 'time': '15 minutes ago'},
    {'id': 3, 'type': 'success', 'message': 'Pharmacy inventory restocked', 'time': '1 hour ago'},
    {'id': 4, 'type': 'danger', 'message': 'Room 3 equipment maintenance required', 'time': '2 hours ago'},
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/patients')
def patients():
    return render_template('patients.html')

@app.route('/doctors')
def doctors():
    return render_template('doctors.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/appointments')
def appointments():
    # Provide a dummy current_user if not using Flask-Login
    class DummyUser:
        is_authenticated = False
        full_name = 'Guest'
        role = 'Guest'
    user = DummyUser()
    return render_template('appointments.html', current_user=user)

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/patient_registration')
def patient_registration():
    return render_template('patient_registration.html')

@app.route('/billing')
def billing():
    return render_template('billing.html')

@app.route('/medicines')
def medicines():
    return render_template('medicines.html')

@app.route('/pending-due')
def pending_due():
    return render_template('pending_due.html')

@app.route('/canteen')
def canteen():
    return render_template('canteen.html')

@app.route('/parking')
def parking():
    return render_template('parking.html')

@app.route('/satisfaction')
def satisfaction():
    return render_template('satisfaction.html')

@app.route('/api/overview')
def get_overview():
    # Return fixed data to match dashboard requirements
    data = sample_data.copy()
    return jsonify(data)

@app.route('/api/patient-distribution')
def get_patient_distribution():
    # Simulate dynamic patient distribution
    distribution = sample_data['patient_distribution'].copy()
    for stage in distribution:
        variation = random.randint(-3, 3)
        distribution[stage] = max(5, distribution[stage] + variation)

    return jsonify({
        'labels': list(distribution.keys()),
        'data': list(distribution.values())
    })

@app.route('/api/patients')
def get_patients():
    # Return patient data with some randomization for demo
    # Deep-ish copy so we don't mutate the originals on each request
    patient_list = [p.copy() for p in sample_patients]
    for patient in patient_list:
        # ensure the frontend fields exist and update waiting_time slightly for demo
        if patient.get('status') == 'Waiting':
            patient['waiting_time'] = max(0, patient.get('waiting_time', 0) + random.randint(-5, 5))
        else:
            patient['waiting_time'] = patient.get('waiting_time', 0)

        # keep keys consistent: frontend expects `stage`, `priority`, `doctor_id`, `entry_time`, `waiting_time`
        patient.setdefault('stage', patient.get('stage', 'undefined'))
        patient.setdefault('priority', patient.get('priority', 'undefined'))
        patient.setdefault('doctor_id', patient.get('doctor_id', 'undefined'))
        patient.setdefault('entry_time', patient.get('entry_time', 'undefined'))

    return jsonify(patient_list)


def advance_patients(auto_wait_threshold=30):
    """Move eligible patients to the next stage based on priority or waiting time.
    Returns list of moved patient details.
    """
    moved = []
    dist = sample_data.get('patient_distribution', {})

    for patient in sample_patients:
        current_stage = patient.get('stage')
        if not current_stage or current_stage == 'Discharge':
            continue

        wait = patient.get('waiting_time', 0)
        priority = patient.get('priority', 'Low')

        if priority == 'High' or wait >= auto_wait_threshold:
            try:
                idx = STAGE_ORDER.index(current_stage)
            except ValueError:
                continue
            if idx < len(STAGE_ORDER) - 1:
                new_stage = STAGE_ORDER[idx + 1]
                patient['stage'] = new_stage
                patient['waiting_time'] = max(0, wait - random.randint(5, 15))

                # adjust distribution counts
                if current_stage in dist:
                    dist[current_stage] = max(0, dist.get(current_stage, 1) - 1)
                if new_stage in dist:
                    dist[new_stage] = dist.get(new_stage, 0) + 1

                moved.append({'id': patient['id'], 'from': current_stage, 'to': new_stage, 'priority': priority})

    return moved


@app.route('/api/flow-mode', methods=['GET', 'POST'])
def flow_mode_api():
    global flow_mode
    from flask import request
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        flow_mode['auto'] = bool(data.get('auto', False))
        return jsonify({'status': 'success', 'auto': flow_mode['auto']})
    return jsonify({'auto': flow_mode['auto']})


@app.route('/api/advance', methods=['POST'])
def api_advance():
    moved = advance_patients()
    alerts = generate_alerts()
    return jsonify({'status': 'success', 'moved': moved, 'alerts': alerts})


@app.route('/api/move-patient', methods=['POST'])
def api_move_patient():
    """Manually move a single patient to a specified stage."""
    from flask import request
    data = request.get_json(silent=True) or {}
    patient_id = data.get('id')
    to_stage = data.get('to_stage')
    if patient_id is None or to_stage is None:
        return jsonify({'status': 'error', 'message': 'Missing id or to_stage'}), 400

    moved = []
    dist = sample_data.get('patient_distribution', {})
    for p in sample_patients:
        if p.get('id') == int(patient_id):
            from_stage = p.get('stage')
            if from_stage == to_stage:
                return jsonify({'status': 'success', 'moved': []})
            p['stage'] = to_stage
            # reduce waiting time slightly when moved manually
            p['waiting_time'] = max(0, p.get('waiting_time', 0) - 5)

            # adjust distribution counts
            if from_stage in dist:
                dist[from_stage] = max(0, dist.get(from_stage, 1) - 1)
            dist[to_stage] = dist.get(to_stage, 0) + 1

            moved.append({'id': p['id'], 'from': from_stage, 'to': to_stage, 'priority': p.get('priority')})
            break

    alerts = generate_alerts()
    return jsonify({'status': 'success', 'moved': moved, 'alerts': alerts})


def auto_balance():
    """When auto flow mode is enabled, detect crowded stages and move some patients
    to less-busy stages to balance load. Returns list of moved patients.
    Uses `auto_config` for parameters."""
    dist = sample_data.get('patient_distribution', {})
    if not dist:
        return []

    crowd_threshold = int(auto_config.get('crowd_threshold', 40))
    max_moves_per_stage = int(auto_config.get('max_moves_per_stage', 3))

    moved = []

    # find least busy stages (candidates to receive patients)
    sorted_stages = sorted(dist.items(), key=lambda kv: kv[1])
    least_busy = [s for s, _ in sorted_stages[:3]] if sorted_stages else []

    for stage, count in list(dist.items()):
        if count >= crowd_threshold:
            # number to move
            to_move = min(max_moves_per_stage, count - crowd_threshold + 1)
            # select candidates from patients in this stage by waiting_time desc
            candidates = [p for p in sample_patients if p.get('stage') == stage]
            candidates.sort(key=lambda x: x.get('waiting_time', 0), reverse=True)
            for i in range(min(to_move, len(candidates))):
                patient = candidates[i]
                # choose a target stage (least busy) that's not the same
                target = None
                for t in least_busy:
                    if t != stage:
                        target = t
                        break
                if not target:
                    # fallback: move to next logical stage if exists
                    try:
                        idx = STAGE_ORDER.index(stage)
                        if idx < len(STAGE_ORDER) - 1:
                            target = STAGE_ORDER[idx + 1]
                    except ValueError:
                        target = None
                if not target:
                    continue

                # perform move
                from_stage = patient.get('stage')
                patient['stage'] = target
                patient['waiting_time'] = max(0, patient.get('waiting_time', 0) - random.randint(5, 15))
                if from_stage in dist:
                    dist[from_stage] = max(0, dist.get(from_stage, 1) - 1)
                dist[target] = dist.get(target, 0) + 1
                moved.append({'id': patient['id'], 'from': from_stage, 'to': target, 'priority': patient.get('priority')})

    return moved


@app.route('/api/check-balance')
def api_check_balance():
    # Only run balancing when auto flow is enabled
    if not flow_mode.get('auto', False):
        return jsonify({'status': 'idle', 'moved': []})

    moved = auto_balance()
    alerts = generate_alerts()
    return jsonify({'status': 'success', 'moved': moved, 'alerts': alerts})


@app.route('/api/auto-config', methods=['GET', 'POST'])
def api_auto_config():
    """Get or update auto-balance configuration."""
    from flask import request
    global auto_config
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            if 'crowd_threshold' in data:
                val = int(data.get('crowd_threshold'))
                auto_config['crowd_threshold'] = max(1, val)
            if 'max_moves_per_stage' in data:
                val = int(data.get('max_moves_per_stage'))
                auto_config['max_moves_per_stage'] = max(1, val)
        except (TypeError, ValueError):
            return jsonify({'status': 'error', 'message': 'Invalid config values'}), 400
        return jsonify({'status': 'success', 'config': auto_config})

    return jsonify(auto_config)


def generate_alerts():
    alerts = []
    for p in sample_patients:
        if p.get('waiting_time', 0) >= 45:
            alerts.append({'id': f'wait-{p["id"]}', 'type': 'warning', 'message': f'Patient {p["name"]} wait time very high ({p.get("waiting_time")} min)', 'time': 'just now'})

    dist = sample_data.get('patient_distribution', {})
    for stage, count in dist.items():
        if count >= 40:
            alerts.append({'id': f'load-{stage}', 'type': 'danger', 'message': f'High load in {stage}: {count} patients', 'time': 'just now'})

    merged = sample_alerts.copy()
    existing_msgs = {a['message'] for a in merged}
    for a in alerts:
        if a['message'] not in existing_msgs:
            merged.insert(0, a)

    return merged[:10]


@app.route('/api/staff')
def get_staff():
    # Return staff data
    return jsonify(sample_staff)


@app.route('/api/doctors')
def get_doctors():
    # Alias to staff endpoint used by frontend
    return jsonify(sample_staff)


@app.route('/api/resources')
def get_resources():
    # Return resources used by the resources page
    return jsonify(sample_resources)

@app.route('/api/alerts')
def get_alerts():
    # Return generated alerts based on current state
    return jsonify(generate_alerts())

@app.route('/api/wait-times')
def get_wait_times():
    # Simulate wait time analysis
    wait_data = sample_data['wait_times'].copy()
    wait_data['total_patients'] = random.randint(120, 180)
    wait_data['avg_wait'] = round(random.uniform(15, 35), 1)
    wait_data['max_wait'] = random.randint(35, 60)
    wait_data['min_wait'] = random.randint(2, 10)

    return jsonify(wait_data)

@app.route('/api/simulate', methods=['POST'])
def simulate():
    # Trigger comprehensive simulation - update all data fields
    global sample_data
    global sample_patients

    # Simulate patient flow changes
    sample_data['total_patients'] += random.randint(-5, 10)
    sample_data['total_patients'] = max(50, sample_data['total_patients'])  # Keep minimum

    sample_data['avg_wait_time'] = round(random.uniform(15, 40), 1)
    sample_data['active_staff'] = max(5, min(20, sample_data['active_staff'] + random.randint(-1, 2)))
    sample_data['occupancy'] = max(40, min(95, sample_data['occupancy'] + random.randint(-5, 8)))

    # Update patient distribution dynamically
    distribution = sample_data['patient_distribution']
    total_dist = sum(distribution.values())

    # Redistribute patients across departments with some randomness
    for stage in distribution:
        change = random.randint(-5, 8)
        distribution[stage] = max(5, distribution[stage] + change)

    # Normalize to maintain total
    current_total = sum(distribution.values())
    if current_total > 0:
        factor = total_dist / current_total
        for stage in distribution:
            distribution[stage] = max(1, int(distribution[stage] * factor))

    # Add random new arrivals to simulate incoming patients
    new_arrivals = random.randint(1, 5)
    max_id = max([p['id'] for p in sample_patients]) if sample_patients else 0
    for i in range(new_arrivals):
        max_id += 1
        # Put new arrivals in Reception or Screening
        start_stage = random.choice(['Reception', 'Screening'])
        new_patient = {
            'id': max_id,
            'name': f'Patient {max_id}',
            'age': random.randint(1, 90),
            'condition': 'General',
            'status': 'Waiting',
            'stage': start_stage,
            'priority': random.choices(['Low', 'Medium', 'High'], weights=[60,30,10])[0],
            'doctor_id': None,
            'entry_time': 'now',
            'waiting_time': random.randint(0, 10)
        }
        sample_patients.append(new_patient)
        # update distribution counts
        if start_stage in distribution:
            distribution[start_stage] = distribution.get(start_stage, 0) + 1
        else:
            distribution[start_stage] = 1

    # Update total patients count
    sample_data['total_patients'] = len(sample_patients)

    # Update wait times data
    wait_times = sample_data['wait_times']
    wait_times['total_patients'] = sample_data['total_patients']
    wait_times['avg_wait'] = sample_data['avg_wait_time']
    wait_times['max_wait'] = random.randint(int(wait_times['avg_wait'] * 1.5), int(wait_times['avg_wait'] * 2.5))
    wait_times['min_wait'] = random.randint(1, int(wait_times['avg_wait'] * 0.3))

    return jsonify({'status': 'success', 'message': 'Hospital activity simulation completed'})

@app.route('/api/reset', methods=['POST'])
def reset():
    # Reset data to initial state
    global sample_data
    sample_data = {
        'total_patients': 145,
        'avg_wait_time': 23.5,
        'active_staff': 12,
        'occupancy': 78,
        'patient_distribution': {
            'Screening': 25,
            'Imaging': 18,
            'Reception': 32,
            'Pharmacy': 15
        },
        'wait_times': {
            'total_patients': 145,
            'avg_wait': 23.5,
            'max_wait': 45,
            'min_wait': 5
        }
    }

    return jsonify({'status': 'success', 'message': 'Data reset to initial state'})

if __name__ == '__main__':
    app.run(debug=True)

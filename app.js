// HELIX - Clinical Workflow System Logic

// State management
let state = {
  currentUser: null,
  patients: [],
  medicines: [],
  prescriptions: [],
  activeBranchFilter: 'All',
  searchQuery: '',
  activeConsultationPatient: null,
  currentPrescriptionMedicines: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  // Ensure the login page is always visible first if no active session
  if (!state.currentUser) {
    showScreen('login-view');
    updateHeaderUser();
  } else {
    updateHeaderUser();
    switchScreenByRole(state.currentUser.role);
  }

  // Populate doctor medicine dropdown
  populateDoctorMedicineSelect();
  renderAllViews();
});

// ==========================================================
// 1. Data Storage & Initialization
// ==========================================================
function loadData() {
  const savedPatients = localStorage.getItem('helix_patients') || localStorage.getItem('cod_patients');
  const savedMedicines = localStorage.getItem('helix_medicines') || localStorage.getItem('cod_medicines');
  const savedPrescriptions = localStorage.getItem('helix_prescriptions') || localStorage.getItem('cod_prescriptions');
  const savedUser = localStorage.getItem('helix_current_user');

  state.patients = savedPatients ? JSON.parse(savedPatients) : [...DEFAULT_PATIENTS];
  state.medicines = savedMedicines ? JSON.parse(savedMedicines) : [...DEFAULT_MEDICINES];
  state.prescriptions = savedPrescriptions ? JSON.parse(savedPrescriptions) : [];
  state.currentUser = savedUser ? JSON.parse(savedUser) : null;
}

function saveData() {
  localStorage.setItem('helix_patients', JSON.stringify(state.patients));
  localStorage.setItem('helix_medicines', JSON.stringify(state.medicines));
  localStorage.setItem('helix_prescriptions', JSON.stringify(state.prescriptions));
  if (state.currentUser) {
    localStorage.setItem('helix_current_user', JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem('helix_current_user');
  }
}

function resetToDemoData() {
  if (confirm("Reset all patients and medicines to default demo dataset?")) {
    state.patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    state.medicines = JSON.parse(JSON.stringify(DEFAULT_MEDICINES));
    state.prescriptions = [];
    state.activeConsultationPatient = null;
    state.currentPrescriptionMedicines = [];
    saveData();
    populateDoctorMedicineSelect();
    renderAllViews();
    showToast("System reset to sample data successfully!");
  }
}

// ==========================================================
// 2. Authentication & Role-Based Navigation
// ==========================================================
function quickLogin(role) {
  loginUser(role);
}

// Only accessible by admin
function quickSwitchRole(role) {
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    showToast("Role switching is restricted to Administrators only.");
    return;
  }
  
  const screenMap = {
    doctor: 'doctor-view',
    nurse: 'nurse-view',
    medical: 'medical-view',
    admin: 'admin-view'
  };

  showScreen(screenMap[role] || 'admin-view');

  // Highlight active role tab in admin switch bar
  document.querySelectorAll('#role-switch-bar .role-tab').forEach(tab => {
    if (tab.getAttribute('data-role') === role) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  renderAllViews();
  showToast(`Admin viewing: ${role.toUpperCase()} workstation`);
}

function loginUser(role) {
  const userData = DEFAULT_USERS[role];
  if (!userData) return;

  state.currentUser = userData;
  saveData();
  updateHeaderUser();
  switchScreenByRole(role);
  showToast(`Welcome, ${userData.name}! Logged in as ${userData.badge}`);
}

function handleManualLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  
  if (DEFAULT_USERS[username]) {
    loginUser(username);
  } else {
    alert("Invalid username. Available demo accounts: doctor, nurse, medical, admin.");
  }
}

function logout() {
  state.currentUser = null;
  saveData();
  
  // Hide user info & role switch bar
  document.getElementById('user-profile').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'none';
  const roleSwitchBar = document.getElementById('role-switch-bar');
  if (roleSwitchBar) roleSwitchBar.style.display = 'none';
  
  // Return directly to login page
  showScreen('login-view');
  showToast("Logged out successfully");
}

function updateHeaderUser() {
  const profileEl = document.getElementById('user-profile');
  const logoutBtn = document.getElementById('logout-btn');
  const rolePill = document.getElementById('user-role-pill');
  const nameEl = document.getElementById('user-display-name');
  const roleSwitchBar = document.getElementById('role-switch-bar');

  if (state.currentUser) {
    profileEl.style.display = 'flex';
    logoutBtn.style.display = 'inline-flex';
    rolePill.textContent = state.currentUser.badge;
    rolePill.className = `role-pill role-${state.currentUser.role}`;
    nameEl.textContent = state.currentUser.name;

    // The role switch bar MUST ONLY be visible to Admin!
    if (state.currentUser.role === 'admin') {
      if (roleSwitchBar) roleSwitchBar.style.display = 'flex';
    } else {
      if (roleSwitchBar) roleSwitchBar.style.display = 'none';
    }
  } else {
    profileEl.style.display = 'none';
    logoutBtn.style.display = 'none';
    if (roleSwitchBar) roleSwitchBar.style.display = 'none';
  }
}

function switchScreenByRole(role) {
  const screenMap = {
    doctor: 'doctor-view',
    nurse: 'nurse-view',
    medical: 'medical-view',
    admin: 'admin-view'
  };

  showScreen(screenMap[role] || 'login-view');
  renderAllViews();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen-view').forEach(view => {
    view.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// ==========================================================
// 3. Nurse View: Patient Queue & Intake Form
// ==========================================================
function renderNurseQueue() {
  const queueListEl = document.getElementById('nurse-queue-list');
  const countBadge = document.getElementById('nurse-queue-count');
  if (!queueListEl) return;

  const activePatients = state.patients.filter(p => p.status !== 'consulted');
  countBadge.textContent = `${activePatients.length} Waiting`;

  if (activePatients.length === 0) {
    queueListEl.innerHTML = `
      <div class="empty-state">
        <p>No patients currently in queue.</p>
        <p style="font-size: 0.8rem;">Register a new patient using the form on the right.</p>
      </div>
    `;
    return;
  }

  queueListEl.innerHTML = activePatients.map(p => {
    const waitMins = Math.max(1, Math.floor((Date.now() - p.entryTime) / 60000));
    let waitClass = 'wait-green';
    let waitText = `${waitMins} min wait`;

    if (waitMins >= 120) {
      waitClass = 'wait-red';
      waitText = `${Math.floor(waitMins / 60)}h ${waitMins % 60}m wait (High)`;
    } else if (waitMins >= 30) {
      waitClass = 'wait-orange';
      waitText = `${waitMins} min wait (Moderate)`;
    }

    const isSent = p.status === 'sent_to_doctor';

    return `
      <div class="queue-item ${isSent ? 'selected' : ''}">
        <div class="queue-item-header">
          <div>
            <span class="patient-badge-id">${p.patientNumber}</span>
            <span class="queue-patient-name" style="margin-left: 0.5rem;">${escapeHtml(p.patientName)}</span>
          </div>
          <span class="wait-badge ${waitClass}">${waitText}</span>
        </div>

        <div class="queue-item-details">
          <span><strong>Age/Sex:</strong> ${p.age}y / ${p.gender || 'N/A'}</span>
          <span><strong>Contact:</strong> ${escapeHtml(p.contactNumber)}</span>
          ${p.bloodPressure ? `<span><strong>BP:</strong> ${escapeHtml(p.bloodPressure)}</span>` : ''}
          ${p.feverLevel ? `<span><strong>Temp:</strong> ${escapeHtml(p.feverLevel)}</span>` : ''}
          ${p.sugarLevel ? `<span><strong>Sugar:</strong> ${escapeHtml(p.sugarLevel)}</span>` : ''}
        </div>

        ${p.allergies ? `<div style="font-size: 0.75rem; color: #b91c1c;">⚠️ Allergies: ${escapeHtml(p.allergies)}</div>` : ''}

        <div class="queue-actions">
          ${isSent ? `
            <span class="badge" style="background: var(--doctor-color); color: white; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Sent to Doctor</span>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="sendPatientToDoctor(${p.id})">👉 Send to Doctor</button>
          `}
          <button class="btn btn-outline btn-sm" onclick="removePatientFromQueue(${p.id})" title="Remove">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function handleRegisterPatient(e) {
  e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const age = parseInt(document.getElementById('reg-age').value) || 0;
  const gender = document.getElementById('reg-gender').value;
  const contact = document.getElementById('reg-contact').value.trim();
  const weight = parseFloat(document.getElementById('reg-weight').value) || null;
  const height = parseFloat(document.getElementById('reg-height').value) || null;

  const bp = document.getElementById('reg-bp').value.trim() || null;
  const sugar = document.getElementById('reg-sugar').value.trim() || null;
  const fever = document.getElementById('reg-fever').value.trim() || null;

  const testsCheckboxes = document.querySelectorAll('input[name="tests"]:checked');
  const testsTaken = Array.from(testsCheckboxes).map(cb => cb.value);

  const allergies = document.getElementById('reg-allergies').value.trim() || null;
  const history = document.getElementById('reg-history').value.trim() || null;

  const newPatient = {
    id: Date.now(),
    patientNumber: `P-${Math.floor(100 + Math.random() * 900)}`,
    patientName: name,
    age: age,
    gender: gender,
    contactNumber: contact,
    weight: weight,
    height: height,
    bloodPressure: bp,
    sugarLevel: sugar,
    feverLevel: fever,
    testsTaken: testsTaken,
    allergies: allergies,
    medicalHistory: history,
    entryTime: Date.now(),
    status: 'waiting',
    queuePosition: state.patients.length + 1
  };

  state.patients.unshift(newPatient);
  saveData();

  e.target.reset();
  renderNurseQueue();
  renderDoctorView();
  renderAdminStats();
  showToast(`Patient ${name} registered into queue!`);
}

function sendPatientToDoctor(patientId) {
  const patient = state.patients.find(p => p.id === patientId);
  if (patient) {
    patient.status = 'sent_to_doctor';
    saveData();
    renderNurseQueue();
    renderDoctorView();
    renderAdminStats();
    showToast(`Patient ${patient.patientName} sent to Doctor!`);
  }
}

function removePatientFromQueue(patientId) {
  if (confirm("Remove this patient from the queue?")) {
    state.patients = state.patients.filter(p => p.id !== patientId);
    if (state.activeConsultationPatient && state.activeConsultationPatient.id === patientId) {
      cancelConsultation();
    }
    saveData();
    renderAllViews();
    showToast("Patient removed from queue");
  }
}

// ==========================================================
// 4. Doctor View: Prescriptions & Medicine Selection
// ==========================================================
function renderDoctorView() {
  const doctorListEl = document.getElementById('doctor-patients-list');
  const countBadge = document.getElementById('doctor-queue-count');
  if (!doctorListEl) return;

  // Show patients sent to doctor or waiting
  const readyPatients = state.patients.filter(p => p.status === 'sent_to_doctor' || p.status === 'waiting');
  countBadge.textContent = `${readyPatients.length} Available`;

  if (readyPatients.length === 0) {
    doctorListEl.innerHTML = `
      <div class="empty-state">
        <p>No patients currently waiting.</p>
        <p style="font-size: 0.8rem;">Patients sent by the nurse will appear here.</p>
      </div>
    `;
    return;
  }

  doctorListEl.innerHTML = readyPatients.map(p => {
    const isSentToDoctor = p.status === 'sent_to_doctor';
    const isSelected = state.activeConsultationPatient && state.activeConsultationPatient.id === p.id;

    return `
      <div class="queue-item ${isSelected ? 'selected' : ''}">
        <div class="queue-item-header">
          <div>
            <span class="patient-badge-id">${p.patientNumber}</span>
            <span class="queue-patient-name" style="margin-left: 0.5rem;">${escapeHtml(p.patientName)}</span>
          </div>
          ${isSentToDoctor ? `<span class="badge" style="background: var(--doctor-color); color: white; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">Ready</span>` : ''}
        </div>

        <div class="queue-item-details">
          <span><strong>Age/Sex:</strong> ${p.age}y / ${p.gender || 'N/A'}</span>
          ${p.bloodPressure ? `<span><strong>BP:</strong> ${escapeHtml(p.bloodPressure)}</span>` : ''}
          ${p.feverLevel ? `<span><strong>Temp:</strong> ${escapeHtml(p.feverLevel)}</span>` : ''}
        </div>

        ${p.allergies ? `<div style="font-size: 0.75rem; color: #b91c1c;">⚠️ Allergies: ${escapeHtml(p.allergies)}</div>` : ''}

        <div class="queue-actions">
          <button class="btn btn-primary btn-sm" onclick="startConsultation(${p.id})">
            ${isSelected ? '✓ Consulting Now' : '🩺 Consult Patient'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function startConsultation(patientId) {
  const patient = state.patients.find(p => p.id === patientId);
  if (!patient) return;

  state.activeConsultationPatient = patient;
  state.currentPrescriptionMedicines = [];

  document.getElementById('no-patient-selected').style.display = 'none';
  document.getElementById('patient-consultation-panel').style.display = 'block';
  document.getElementById('consultation-patient-title').textContent = `Consulting: ${patient.patientName} (${patient.patientNumber})`;
  document.getElementById('prescription-saved-banner').style.display = 'none';

  // Render vitals card
  const vitalsEl = document.getElementById('consultation-vitals');
  vitalsEl.innerHTML = `
    <div class="vital-box">
      <span class="vital-label">Patient</span>
      <span class="vital-value">${escapeHtml(patient.patientName)}</span>
    </div>
    <div class="vital-box">
      <span class="vital-label">Age / Gender</span>
      <span class="vital-value">${patient.age}y / ${patient.gender || 'N/A'}</span>
    </div>
    <div class="vital-box">
      <span class="vital-label">Blood Pressure</span>
      <span class="vital-value">${escapeHtml(patient.bloodPressure || 'N/A')}</span>
    </div>
    <div class="vital-box">
      <span class="vital-label">Sugar Level</span>
      <span class="vital-value">${escapeHtml(patient.sugarLevel || 'N/A')}</span>
    </div>
    <div class="vital-box">
      <span class="vital-label">Temperature</span>
      <span class="vital-value">${escapeHtml(patient.feverLevel || 'Normal')}</span>
    </div>
    <div class="vital-box">
      <span class="vital-label">Allergies</span>
      <span class="vital-value" style="color: ${patient.allergies ? '#dc2626' : 'inherit'}">${escapeHtml(patient.allergies || 'None')}</span>
    </div>
    ${patient.medicalHistory ? `
      <div class="vital-box" style="grid-column: 1 / -1;">
        <span class="vital-label">Medical History</span>
        <span class="vital-value" style="font-weight: 500; font-size: 0.85rem;">${escapeHtml(patient.medicalHistory)}</span>
      </div>
    ` : ''}
    ${patient.testsTaken && patient.testsTaken.length > 0 ? `
      <div class="vital-box" style="grid-column: 1 / -1;">
        <span class="vital-label">Tests Conducted</span>
        <span class="vital-value" style="font-weight: 500; font-size: 0.85rem;">${escapeHtml(patient.testsTaken.join(', '))}</span>
      </div>
    ` : ''}
  `;

  renderPrescribedMedicinesTable();
  renderDoctorView();
}

function cancelConsultation() {
  state.activeConsultationPatient = null;
  state.currentPrescriptionMedicines = [];
  document.getElementById('no-patient-selected').style.display = 'block';
  document.getElementById('patient-consultation-panel').style.display = 'none';
  document.getElementById('consultation-patient-title').textContent = 'No patient selected';
  renderDoctorView();
}

function populateDoctorMedicineSelect() {
  const selectEl = document.getElementById('presc-med-select');
  if (!selectEl) return;

  const activeMedicines = state.medicines.filter(m => m.visible !== false);
  selectEl.innerHTML = activeMedicines.map(m => `
    <option value="${m.id}">[${m.branch}] ${m.name} (${m.power}) - Stock: ${m.stock} - ₹${m.mrp.toFixed(2)}</option>
  `).join('');
}

function handleAddMedicineToPrescription() {
  if (!state.activeConsultationPatient) {
    alert("Please select a patient first.");
    return;
  }

  const selectEl = document.getElementById('presc-med-select');
  const medId = parseInt(selectEl.value);
  const dosage = document.getElementById('presc-dosage').value;
  const duration = document.getElementById('presc-duration').value.trim() || '5 Days';

  const medicine = state.medicines.find(m => m.id === medId);
  if (!medicine) return;

  state.currentPrescriptionMedicines.push({
    medicineId: medicine.id,
    name: medicine.name,
    power: medicine.power,
    branch: medicine.branch,
    dosage: dosage,
    duration: duration
  });

  renderPrescribedMedicinesTable();
  showToast(`Added ${medicine.name} to prescription`);
}

function removePrescribedMedicine(index) {
  state.currentPrescriptionMedicines.splice(index, 1);
  renderPrescribedMedicinesTable();
}

function renderPrescribedMedicinesTable() {
  const tbody = document.getElementById('prescribed-items-tbody');
  const countEl = document.getElementById('prescribed-count');
  if (!tbody || !countEl) return;

  countEl.textContent = state.currentPrescriptionMedicines.length;

  if (state.currentPrescriptionMedicines.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">
          No medicines added yet. Pick a medicine above and click "+ Add to Prescription".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.currentPrescriptionMedicines.map((item, index) => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.power)}</td>
      <td><span class="badge" style="background: var(--surface-alt); padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(item.dosage)}</span></td>
      <td>${escapeHtml(item.duration)}</td>
      <td>
        <button type="button" class="btn btn-outline btn-sm" onclick="removePrescribedMedicine(${index})" title="Remove" style="padding: 0.15rem 0.4rem; color: var(--danger);">✕</button>
      </td>
    </tr>
  `).join('');
}

function savePrescription() {
  if (!state.activeConsultationPatient) {
    alert("No active patient selected.");
    return;
  }

  if (state.currentPrescriptionMedicines.length === 0) {
    alert("Please add at least one medicine to the prescription.");
    return;
  }

  const doctorNotes = document.getElementById('doctor-notes').value.trim();

  const prescription = {
    id: Date.now(),
    patientId: state.activeConsultationPatient.id,
    patientName: state.activeConsultationPatient.patientName,
    patientNumber: state.activeConsultationPatient.patientNumber,
    medicines: [...state.currentPrescriptionMedicines],
    notes: doctorNotes,
    doctorName: state.currentUser ? state.currentUser.name : "Dr. Alexander Brooks",
    date: new Date().toLocaleDateString(),
    timestamp: Date.now()
  };

  // Add prescription
  state.prescriptions.push(prescription);

  // Mark patient consulted
  const patient = state.patients.find(p => p.id === state.activeConsultationPatient.id);
  if (patient) {
    patient.status = 'consulted';
  }

  // Deduct stock
  state.currentPrescriptionMedicines.forEach(item => {
    const med = state.medicines.find(m => m.id === item.medicineId);
    if (med && med.stock > 0) {
      med.stock = Math.max(0, med.stock - 1);
    }
  });

  saveData();

  // Show banner
  document.getElementById('prescription-saved-banner').style.display = 'block';
  showToast("Prescription saved successfully!");

  setTimeout(() => {
    cancelConsultation();
    renderAllViews();
  }, 1000);
}

// ==========================================================
// 5. Medical Staff / Pharmacy View & Stock Reduction
// ==========================================================
function filterMedicines(branch) {
  state.activeBranchFilter = branch;

  document.querySelectorAll('#branch-filters .filter-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-branch') === branch) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderMedicineCatalog();
}

function handleMedicineSearch() {
  const input = document.getElementById('med-search-input');
  state.searchQuery = input ? input.value.trim().toLowerCase() : '';
  renderMedicineCatalog();
}

function adjustMedicineStock(medId, delta) {
  const med = state.medicines.find(m => m.id === medId);
  if (!med) return;

  if (delta < 0 && med.stock <= 0) {
    showToast(`Cannot reduce: ${med.name} is already out of stock!`);
    return;
  }

  const prevStock = med.stock;
  med.stock = Math.max(0, med.stock + delta);
  saveData();

  renderMedicineCatalog();
  renderAdminStats();
  populateDoctorMedicineSelect();

  if (delta < 0) {
    const dispensedCount = Math.min(prevStock, Math.abs(delta));
    showToast(`Dispensed ${dispensedCount} unit(s) of ${med.name}. Stock now: ${med.stock}`);
  } else {
    showToast(`Added ${delta} unit(s) of ${med.name}. Stock now: ${med.stock}`);
  }
}

function renderMedicineCatalog() {
  const tbody = document.getElementById('medicine-table-tbody');
  if (!tbody) return;

  let filtered = state.medicines;

  if (state.activeBranchFilter && state.activeBranchFilter !== 'All') {
    filtered = filtered.filter(m => m.branch.toLowerCase() === state.activeBranchFilter.toLowerCase());
  }

  if (state.searchQuery) {
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(state.searchQuery) ||
      m.manufacturer.toLowerCase().includes(state.searchQuery) ||
      m.branch.toLowerCase().includes(state.searchQuery)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No medicines found matching the current search or branch filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const isLowStock = m.stock <= 30;
    return `
      <tr>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td>${escapeHtml(m.power)}</td>
        <td><span class="badge" style="background: var(--surface-alt); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(m.branch)}</span></td>
        <td>${escapeHtml(m.manufacturer)}</td>
        <td>₹${m.mrp.toFixed(2)}</td>
        <td>
          <span class="stock-badge ${isLowStock ? 'stock-low' : 'stock-high'}">
            ${m.stock} units
          </span>
        </td>
        <td>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustMedicineStock(${m.id}, -1)" title="Dispense 1 unit" style="padding: 0.2rem 0.55rem; font-weight: 700; color: #dc2626; border-color: #fca5a5;">
              -1
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustMedicineStock(${m.id}, -5)" title="Dispense 5 units" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #dc2626;">
              -5
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustMedicineStock(${m.id}, 1)" title="Add 1 unit" style="padding: 0.2rem 0.55rem; font-weight: 700; color: #16a34a; border-color: #86efac;">
              +1
            </button>
          </div>
        </td>
        <td>
          <span style="font-size: 0.75rem; color: ${m.visible ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 600;">
            ${m.visible ? '✓ Active' : 'Hidden'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================
// 6. Admin View: Add Medicine & Stats
// ==========================================================
function renderAdminStats() {
  const queueCountEl = document.getElementById('stat-queue-count');
  const prescCountEl = document.getElementById('stat-prescriptions-count');
  const medCountEl = document.getElementById('stat-medicines-count');
  const patientTotalEl = document.getElementById('stat-patients-total');

  if (queueCountEl) {
    const waiting = state.patients.filter(p => p.status !== 'consulted').length;
    queueCountEl.textContent = waiting;
  }

  if (prescCountEl) {
    prescCountEl.textContent = state.prescriptions.length;
  }

  if (medCountEl) {
    medCountEl.textContent = state.medicines.length;
  }

  if (patientTotalEl) {
    patientTotalEl.textContent = state.patients.length;
  }
}

function handleAddMedicine(e) {
  e.preventDefault();

  const name = document.getElementById('admin-med-name').value.trim();
  const power = document.getElementById('admin-med-power').value.trim();
  const branch = document.getElementById('admin-med-branch').value;
  const mfg = document.getElementById('admin-med-mfg').value.trim();
  const mrp = parseFloat(document.getElementById('admin-med-mrp').value) || 0;
  const stock = parseInt(document.getElementById('admin-med-stock').value) || 0;

  const newMedicine = {
    id: Date.now(),
    name: name,
    power: power,
    branch: branch,
    manufacturer: mfg,
    mrp: mrp,
    stock: stock,
    visible: true
  };

  state.medicines.unshift(newMedicine);
  saveData();

  e.target.reset();
  populateDoctorMedicineSelect();
  renderMedicineCatalog();
  renderAdminStats();
  showToast(`Medicine ${name} registered in catalog!`);
}

// ==========================================================
// Utility Functions
// ==========================================================
function renderAllViews() {
  renderNurseQueue();
  renderDoctorView();
  renderMedicineCatalog();
  renderAdminStats();
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🧬</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

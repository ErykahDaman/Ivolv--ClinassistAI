/* ===============================
   DEMO DATA INITIALIZATION
================================ */

function initializeDemoData() {

    if (!localStorage.getItem("submissions")) {
        localStorage.setItem("submissions", JSON.stringify([
            { name: "John Matthews",  summary: "Chest pain and shortness of breath for 2 days", date: "2026-02-20 09:15 AM" },
            { name: "Sarah Johnson",  summary: "High fever and persistent cough for 3 days",     date: "2026-02-20 11:40 AM" },
            { name: "Peter Williams", summary: "Severe headache and dizziness since morning",    date: "2026-02-21 08:10 AM" }
        ]));
    }

    if (!localStorage.getItem("appointments")) {
        localStorage.setItem("appointments", JSON.stringify([
            { name: "John Matthews",  date: "2026-02-25", type: "Online Consultation", status: "Pending"  },
            { name: "Sarah Johnson",  date: "2026-02-26", type: "Physical Visit",      status: "Approved" },
            { name: "Peter Williams", date: "2026-02-27", type: "Online Consultation", status: "Pending"  }
        ]));
    }
}


/* ===============================
   RISK ENGINE
================================ */

function detectRisk(text) {

    text = text.toLowerCase();
    let possible = [];

    if (text.includes("chest pain") || text.includes("shortness of breath")) {
        possible.push("Acute Coronary Syndrome", "Angina");
        return { level: "HIGH RISK — Possible Cardiac Emergency",        color: "red",    category: possible };
    }

    if (text.includes("fever") || text.includes("cough")) {
        possible.push("Influenza", "Respiratory Infection", "COVID-like Viral Illness");
        return { level: "MODERATE RISK — Possible Infectious Condition", color: "orange", category: possible };
    }

    possible.push("General Medical Evaluation Required");
    return { level: "LOW RISK — Routine Consultation",                   color: "green",  category: possible };
}


/* ===============================
   DOCTOR ANALYSIS
================================ */

function analyzeDoctor() {

    const input = document.getElementById("doctorInput")?.value?.trim();
    if (!input) { alert("Enter consultation notes first."); return; }

    const risk        = detectRisk(input);
    const patientName = document.getElementById("consultPatientSelect")?.value || "Unknown Patient";

    const soapText =
`PATIENT: ${patientName}
DATE: ${new Date().toLocaleString()}

SUBJECTIVE:
Patient reports: ${input}

OBJECTIVE:
Vital signs pending. Clinical examination required.

ASSESSMENT:
- ${risk.category.join("\n- ")}

PLAN:
• Order relevant diagnostic tests
• Monitor vital signs
• Follow up in 48–72 hours
• Refer to specialist if symptoms worsen`;

    document.getElementById("soap").innerText      = soapText;
    document.getElementById("diagnosis").innerText = risk.category.join(", ");

    const riskBox = document.getElementById("risk");
    riskBox.innerText = risk.level;

    if      (risk.color === "red")    { riskBox.style.background = "#7f1d1d"; riskBox.style.color = "#fca5a5"; }
    else if (risk.color === "orange") { riskBox.style.background = "#7c2d12"; riskBox.style.color = "#fdba74"; }
    else                              { riskBox.style.background = "#14532d"; riskBox.style.color = "#86efac"; }

    document.getElementById("doctorOutput").classList.remove("hidden");
}


/* ===============================
   LOAD DOCTOR ACTIVITY
================================ */

function loadDoctorActivity() {

    initializeDemoData();

    const submissions  = JSON.parse(localStorage.getItem("submissions"))  || [];
    const appointments = JSON.parse(localStorage.getItem("appointments")) || [];

    const submissionContainer  = document.getElementById("patientSubmissions");
    const appointmentContainer = document.getElementById("appointments");

    /* --- Patient Submissions --- */
    if (submissionContainer) {
        if (!submissions.length) {
            submissionContainer.innerHTML = '<div class="empty-state">No patient submissions yet</div>';
        } else {
            const enhanced = submissions.map(s => {
                const r = detectRisk(s.summary);
                let pv = 1, label = "LOW", bc = "risk-low", pc = "priority-low";
                if      (r.color === "red")    { pv = 3; label = "HIGH";     bc = "risk-high";     pc = "priority-high";     }
                else if (r.color === "orange") { pv = 2; label = "MODERATE"; bc = "risk-moderate"; pc = "priority-moderate"; }
                return { ...s, pv, label, bc, pc };
            }).sort((a, b) => b.pv - a.pv);

            submissionContainer.innerHTML = enhanced.map(s => `
                <div class="sub-card ${s.pc}">
                    <div class="sub-name">${s.name}</div>
                    <div class="sub-summary">${s.summary}</div>
                    <div class="sub-meta">${s.date}</div>
                    <span class="risk-badge ${s.bc}">${s.label} RISK</span>
                </div>
            `).join("");
        }
    }

    /* --- Appointments --- */
    if (appointmentContainer) {
        if (!appointments.length) {
            appointmentContainer.innerHTML = '<div class="empty-state">No appointment requests yet</div>';
        } else {
            appointmentContainer.innerHTML = appointments.map((a, index) => `
                <div class="appt-card">
                    <div class="appt-name">${a.name}</div>
                    <div class="appt-detail">
                        ${a.type}<br>
                        Date: <strong style="color:#e2e8f0">${a.date}</strong><br>
                        Status: <span class="status-pill status-${a.status.toLowerCase()}">${a.status}</span>
                    </div>
                    <div class="appt-actions">
                        <button class="btn-success" onclick="approveAppointment(${index})">✓ Approve</button>
                        <button class="btn-warn"    onclick="rescheduleAppointment(${index})">↻ Reschedule</button>
                        <button class="btn-danger"  onclick="declineAppointment(${index})">✕ Decline</button>
                    </div>
                </div>
            `).join("");
        }
    }
}

function approveAppointment(index) {
    const appointments = JSON.parse(localStorage.getItem("appointments"));
    appointments[index].status = "Approved";
    localStorage.setItem("appointments", JSON.stringify(appointments));
    loadDoctorActivity();
}

function rescheduleAppointment(index) {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    if (!newDate) return;
    const appointments = JSON.parse(localStorage.getItem("appointments"));
    appointments[index].date   = newDate;
    appointments[index].status = "Rescheduled";
    localStorage.setItem("appointments", JSON.stringify(appointments));
    loadDoctorActivity();
}

function declineAppointment(index) {
    if (!confirm("Decline this appointment request?")) return;
    const appointments = JSON.parse(localStorage.getItem("appointments"));
    appointments[index].status = "Declined";
    localStorage.setItem("appointments", JSON.stringify(appointments));
    loadDoctorActivity();
}


/* ===============================
   VOICE RECOGNITION — DOCTOR
================================ */

let recognition;

function setMode(mode) {
    const typeBtn  = document.getElementById("typeModeBtn");
    const voiceBtn = document.getElementById("voiceModeBtn");
    const status   = document.getElementById("voiceStatus");
    if (!typeBtn || !voiceBtn) return;

    typeBtn.classList.remove("active");
    voiceBtn.classList.remove("active");

    if (mode === "type") {
        typeBtn.classList.add("active");
        if (recognition) recognition.stop();
        if (status) status.classList.add("hidden");
    } else {
        voiceBtn.classList.add("active");
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    const status = document.getElementById("voiceStatus");
    if (status) status.classList.remove("hidden");

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function (event) {
        const input = document.getElementById("doctorInput");
        if (input) input.value = event.results[0][0].transcript;
    };
    recognition.onend = function () {
        if (status) status.classList.add("hidden");
    };
    recognition.onerror = function () {
        if (status) status.classList.add("hidden");
    };
}


/* ===============================
   VOICE RECOGNITION — PATIENT
================================ */

let patientRecognition;

function setPatientMode(mode) {
    const typeBtn  = document.getElementById("patientTypeBtn");
    const voiceBtn = document.getElementById("patientVoiceBtn");
    const status   = document.getElementById("patientVoiceStatus");
    if (!typeBtn || !voiceBtn) return;

    typeBtn.classList.remove("active");
    voiceBtn.classList.remove("active");

    if (mode === "type") {
        typeBtn.classList.add("active");
        if (patientRecognition) patientRecognition.stop();
        if (status) status.classList.add("hidden");
    } else {
        voiceBtn.classList.add("active");
        startPatientVoice();
    }
}

function startPatientVoice() {
    const input  = document.getElementById("patientInput");
    const status = document.getElementById("patientVoiceStatus");

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    patientRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    patientRecognition.lang = "en-US";
    patientRecognition.start();
    if (status) status.classList.remove("hidden");

    patientRecognition.onresult = function (event) {
        if (input) input.value = event.results[0][0].transcript;
    };
    patientRecognition.onend = function () {
        if (status) status.classList.add("hidden");
    };
    patientRecognition.onerror = function () {
        if (status) status.classList.add("hidden");
        alert("Voice recognition error. Please try again.");
    };
}


/* ===============================
   PATIENT LOGIN
   Demo: john123 / patient123
   Real accounts → firebase.js
================================ */

function patientLogin() {

    const username = document.getElementById("patientUsername")?.value.trim();
    const password = document.getElementById("patientPassword")?.value;

    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    // Demo account
    if (username === "john123" && password === "patient123") {
        localStorage.setItem("patientLoggedIn", "true");
        localStorage.setItem("patientUsername", "john123");
        window.location.href = "patientdashboard.html";  // ← fixed
        return;
    }

    // Real Firebase accounts are email-based (handled by firebase.js)
    alert("Invalid credentials.\n\nDemo account:\nUsername: john123\nPassword: patient123\n\nIf you registered with an email, please use the email login.");
}


/* ===============================
   PATIENT LOGOUT
================================ */

function patientLogout() {
    localStorage.removeItem("patientLoggedIn");
    localStorage.removeItem("patientUsername");
    window.location.href = "index.html";
}


/* ===============================
   PROTECT PATIENT DASHBOARD
   Called checkPatientAccess() by
   patient-dashboard.html — also
   kept as protectPatientDashboard()
   for backwards compatibility
================================ */

function checkPatientAccess() {
    if (localStorage.getItem("patientLoggedIn") !== "true") {
        window.location.href = "patient-login.html";
        return;
    }
    const name = localStorage.getItem("patientUsername") || "Patient";
    const el   = document.getElementById("navPatientName");
    if (el) el.textContent = name;
}

// Alias — keep old name working too
function protectPatientDashboard() {
    checkPatientAccess();
}


/* ===============================
   DOCTOR LOGIN
   Demo: doctor@demo.com / doctor123
   Real accounts → firebase.js
================================ */

function loginDoctor() {

    const email    = document.getElementById("doctorEmail")?.value.trim();
    const password = document.getElementById("doctorPassword")?.value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    // Demo account
    if (email === "doctor@demo.com" && password === "doctor123") {
        localStorage.setItem("doctorLoggedIn", "true");
        localStorage.setItem("doctorEmail",    email);
        localStorage.setItem("doctorName",     "Dr. Demo");
        window.location.href = "doctordashboard.html";  // ← fixed
        return;
    }

    // Real Firebase accounts handled by firebase.js
    alert("Invalid credentials.\n\nDemo account:\nEmail: doctor@demo.com\nPassword: doctor123\n\nIf you registered, please use your registered email.");
}


/* ===============================
   DOCTOR LOGOUT
================================ */

function logout() {
    localStorage.removeItem("doctorLoggedIn");
    localStorage.removeItem("doctorEmail");
    localStorage.removeItem("doctorName");
    window.location.href = "index.html";
}


/* ===============================
   PROTECT DOCTOR DASHBOARD
   Called checkDoctorAccess() by
   doctor-dashboard.html
================================ */

function checkDoctorAccess() {
    if (localStorage.getItem("doctorLoggedIn") !== "true") {
        window.location.href = "doctor-login.html";
        return;
    }
    const name = localStorage.getItem("doctorName") || "Doctor";
    const el   = document.getElementById("navDoctorName");
    if (el) el.textContent = name;
}


/* ===============================
   PDF EXPORT — DOCTOR
================================ */

async function downloadDoctorPDF() {
    if (!window.jspdf) { alert("PDF library not loaded."); return; }

    const { jsPDF } = window.jspdf;
    const doc       = new jsPDF();
    const soapText  = document.getElementById("soap")?.innerText || "No SOAP note available.";

    doc.setFontSize(16);
    doc.text("ClinAssist AI — Clinical Report", 20, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(soapText, 170);
    doc.text(lines, 20, 35);
    doc.save("Doctor_Report.pdf");
}


/* ===============================
   PDF EXPORT — PATIENT
================================ */

async function downloadPatientPDF() {
    if (!window.jspdf) { alert("PDF library not loaded."); return; }

    const { jsPDF } = window.jspdf;
    const doc         = new jsPDF();
    const summaryText = document.getElementById("summary")?.innerText || "No summary available.";

    doc.setFontSize(16);
    doc.text("ClinAssist AI — Patient Summary", 20, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(summaryText, 170);
    doc.text(lines, 20, 35);
    doc.save("Patient_Summary.pdf");
}


/* ===============================
   AUTO LOAD ON DOM READY
================================ */

document.addEventListener("DOMContentLoaded", function () {

    // Doctor dashboard
    if (document.getElementById("patientSubmissions")) {
        loadDoctorActivity();
    }

    // Doctor dashboard — protect + show name
    if (document.getElementById("navDoctorName")) {
        checkDoctorAccess();
    }

    // Patient dashboard — protect + show name
    if (document.getElementById("navPatientName")) {
        checkPatientAccess();
    }
});
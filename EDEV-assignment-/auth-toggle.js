/* ===============================
   DEMO DATA INITIALIZATION
================================ */

function initializeDemoData() {

    if (!localStorage.getItem("submissions")) {
        const demoSubmissions = [
            {
                name: "John Matthews",
                summary: "Chest pain and shortness of breath for 2 days",
                date: "2026-02-20 09:15 AM"
            },
            {
                name: "Sarah Johnson",
                summary: "High fever and persistent cough for 3 days",
                date: "2026-02-20 11:40 AM"
            },
            {
                name: "Peter Williams",
                summary: "Severe headache and dizziness since morning",
                date: "2026-02-21 08:10 AM"
            }
        ];
        localStorage.setItem("submissions", JSON.stringify(demoSubmissions));
    }

    if (!localStorage.getItem("appointments")) {
        const demoAppointments = [
            {
                name: "John Matthews",
                date: "2026-02-25",
                type: "Online Consultation",
                status: "Pending"
            },
            {
                name: "Sarah Johnson",
                date: "2026-02-26",
                type: "Physical Visit",
                status: "Approved"
            },
            {
                name: "Peter Williams",
                date: "2026-02-27",
                type: "Online Consultation",
                status: "Pending"
            }
        ];
        localStorage.setItem("appointments", JSON.stringify(demoAppointments));
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
        return { level: "HIGH RISK - Possible Cardiac Emergency", color: "red", category: possible };
    }

    if (text.includes("fever") || text.includes("cough")) {
        possible.push("Influenza", "Respiratory Infection", "COVID-like Viral Illness");
        return { level: "MODERATE RISK - Possible Infectious Condition", color: "orange", category: possible };
    }

    possible.push("General Medical Evaluation Required");
    return { level: "LOW RISK - Routine Consultation", color: "green", category: possible };
}


/* ===============================
   DOCTOR ANALYSIS
================================ */

function analyzeDoctor() {

    const input = document.getElementById("doctorInput")?.value;
    if (!input) return;

    const risk = detectRisk(input);

    const soapText = `
SUBJECTIVE:
Patient reports: ${input}

OBJECTIVE:
Vital signs pending. Clinical examination required.

ASSESSMENT:
- ${risk.category.join("\n- ")}

PLAN:
• Order diagnostic tests
• Monitor vitals
• Refer if symptoms worsen
`;

    document.getElementById("soap").innerText = soapText;
    document.getElementById("diagnosis").innerText = risk.category.join(", ");

    const riskBox = document.getElementById("risk");
    riskBox.innerText = risk.level;

    if (risk.color === "red")         riskBox.style.background = "#7f1d1d";
    else if (risk.color === "orange") riskBox.style.background = "#7c2d12";
    else                              riskBox.style.background = "#14532d";

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

    /* PATIENT SUBMISSIONS */
    if (submissionContainer) {

        const enhanced = submissions.map(s => {

            const riskData = detectRisk(s.summary);

            let priorityValue = 1;
            let label         = "LOW";
            let badgeClass    = "risk-low";
            let priorityClass = "priority-low";

            if (riskData.color === "red") {
                priorityValue = 3;
                label         = "HIGH";
                badgeClass    = "risk-high";
                priorityClass = "priority-high";
            } else if (riskData.color === "orange") {
                priorityValue = 2;
                label         = "MODERATE";
                badgeClass    = "risk-moderate";
                priorityClass = "priority-moderate";
            }

            return { ...s, priorityValue, label, badgeClass, priorityClass };
        });

        enhanced.sort((a, b) => b.priorityValue - a.priorityValue);

        submissionContainer.innerHTML = enhanced.map(s => `
            <div class="appointment-card ${s.priorityClass}">
                <strong>${s.name}</strong><br>
                ${s.summary}<br>
                <small>${s.date}</small><br>
                <span class="risk-badge ${s.badgeClass}">${s.label} RISK</span>
            </div>
        `).join("");
    }

    /* APPOINTMENTS */
    if (appointmentContainer) {

        appointmentContainer.innerHTML = appointments.map((a, index) => `
            <div class="appointment-card">
                <strong>${a.name}</strong><br>
                ${a.type}<br>
                Date: ${a.date}<br>
                Status:
                <span class="status-${a.status.toLowerCase()}">${a.status}</span><br>
                <div class="appt-buttons">
                    <button onclick="approveAppointment(${index})">Approve</button>
                    <button onclick="rescheduleAppointment(${index})">Reschedule</button>
                </div>
            </div>
        `).join("");
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


/* ===============================
   VOICE RECOGNITION (DOCTOR)
================================ */

let recognition;

function setMode(mode) {

    const typeBtn  = document.getElementById("typeModeBtn");
    const voiceBtn = document.getElementById("voiceModeBtn");

    if (!typeBtn || !voiceBtn) return;

    typeBtn.classList.remove("active");
    voiceBtn.classList.remove("active");

    if (mode === "type") {
        typeBtn.classList.add("active");
        if (recognition) recognition.stop();
    } else {
        voiceBtn.classList.add("active");
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function (event) {
        const input = document.getElementById("doctorInput");
        if (input) input.value = event.results[0][0].transcript;
    };
}


/* ===============================
   VOICE RECOGNITION (PATIENT)
================================ */

let patientRecognition;

function startPatientVoice() {

    const input = document.getElementById("patientInput");

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    patientRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    patientRecognition.lang = "en-US";
    patientRecognition.start();

    patientRecognition.onstart = function () {
        alert("Listening...");
    };

    patientRecognition.onresult = function (event) {
        if (input) input.value = event.results[0][0].transcript;
    };

    patientRecognition.onerror = function () {
        alert("Voice recognition error. Please try again.");
    };
}


/* ===============================
   PATIENT LOGIN (DEMO)
   Real login handled by firebase.js
   This covers the hardcoded demo
   account: john123 / patient123
================================ */

function patientLogin() {

    const username = document.getElementById("patientUsername")?.value.trim();
    const password = document.getElementById("patientPassword")?.value;

    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    // Demo account fallback
    if (username === "john123" && password === "patient123") {
        localStorage.setItem("patientLoggedIn", "true");
        localStorage.setItem("patientUsername", "john123");
        window.location.href = "patientdashboard.html";
        return;
    }

    // For real accounts registered via Firebase,
    // login is handled by firebase.js (email-based).
    // Username-only login is demo-only.
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
================================ */

function protectPatientDashboard() {
    if (localStorage.getItem("patientLoggedIn") !== "true") {
        window.location.href = "patient-login.html";
    }
}


/* ===============================
   PDF EXPORT (DOCTOR)
================================ */

async function downloadDoctorPDF() {

    if (!window.jspdf) {
        alert("PDF library not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const soapText = document.getElementById("soap")?.innerText || "No SOAP note available.";

    doc.setFontSize(16);
    doc.text("ClinAssist AI - Clinical Report", 20, 20);

    doc.setFontSize(12);
    doc.text(soapText, 20, 35);

    doc.save("Doctor_Report.pdf");
}


/* ===============================
   AUTO LOAD ON DOM READY
================================ */

document.addEventListener("DOMContentLoaded", function () {

    // Load doctor dashboard activity
    if (document.getElementById("patientSubmissions")) {
        loadDoctorActivity();
    }

    // Protect patient dashboard
    if (window.location.pathname.includes("patientdashboard.html")) {
        protectPatientDashboard();
    }
});
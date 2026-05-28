/* ================================================
   CLINASSIST AI — profile.js
   Handles Patient & Doctor profile pages
================================================ */

/* ── Shared: Toast ── */
let _toastTimer;
function profileToast(msg, type = "info") {
  const el = document.getElementById("toastEl");
  if (!el) return;
  const icons = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" };
  el.innerHTML = `<span>${icons[type] || "ℹ"}</span> ${msg}`;
  el.className = "toast " + type;
  clearTimeout(_toastTimer);
  requestAnimationFrame(() => el.classList.add("show"));
  _toastTimer = setTimeout(() => el.classList.remove("show"), 3400);
}

/* ── Shared: Initials ── */
function getProfileInitials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name || "?").slice(0, 2).toUpperCase();
}

/* ── Shared: Password strength ── */
function checkPasswordStrength(val, fillId, textId) {
  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!fill || !text) return;
  if (!val) { fill.style.width = "0"; text.textContent = "Enter a new password"; return; }
  let score = 0;
  if (val.length >= 8)  score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: "20%",  bg: "#ef4444", t: "Very weak" },
    { w: "40%",  bg: "#f97316", t: "Weak" },
    { w: "60%",  bg: "#eab308", t: "Fair" },
    { w: "80%",  bg: "#22c55e", t: "Strong" },
    { w: "100%", bg: "#38bdf8", t: "Very strong" },
  ];
  const l = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = l.w;
  fill.style.background = l.bg;
  text.textContent = l.t;
}

/* ── Shared: Toggle password eye ── */
function togglePasswordEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  btn.innerHTML = show
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ─────────────────────────────────────────────
   PATIENT PROFILE
───────────────────────────────────────────── */

const PATIENT_PROFILE_KEY = "clinassist_patient_profile";
const PATIENT_DOCS_KEY    = "clinassist_patient_docs";
const PATIENT_AVATAR_KEY  = "clinassist_patient_avatar";

function patientProfileInit() {
  if (localStorage.getItem("patientLoggedIn") !== "true") {
    window.location.href = "patient-login.html";
    return;
  }
  patientLoadProfile();
  patientLoadDocuments();
  patientUpdateStats();
  patientPopulateAccountPanel();
  patientLoadPrefs();
  patientPopulateSessionInfo();

  // Panel switching
  document.querySelectorAll("[data-panel]").forEach(el => {
    el.addEventListener("click", function () {
      showPatientPanel(this.dataset.panel, this);
    });
  });

  // Avatar upload
  const avatarInput = document.getElementById("avatarUploadInput");
  if (avatarInput) avatarInput.addEventListener("change", patientHandleAvatarUpload);

  // Password strength
  const newPw = document.getElementById("secNew");
  if (newPw) newPw.addEventListener("input", () => checkPasswordStrength(newPw.value, "strengthFill", "strengthText"));

  // Document upload
  const docInput = document.getElementById("docUploadInput");
  if (docInput) docInput.addEventListener("change", patientHandleDocUpload);
}

function showPatientPanel(name, el) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("[data-panel]").forEach(n => n.classList.remove("active"));
  const panel = document.getElementById("panel-" + name);
  if (panel) panel.classList.add("active");
  if (el) el.classList.add("active");
  else document.querySelector(`[data-panel="${name}"]`)?.classList.add("active");
}

function patientLoadProfile() {
  const username = localStorage.getItem("patientUsername") || "patient";
  const stored   = JSON.parse(localStorage.getItem(PATIENT_PROFILE_KEY) || "{}");
  const avatar   = localStorage.getItem(PATIENT_AVATAR_KEY) || "";

  // Sidebar avatar
  const avatarCircle = document.getElementById("avatarCircle");
  if (avatarCircle) {
    if (avatar) {
      avatarCircle.innerHTML = `<img src="${avatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    } else {
      avatarCircle.innerHTML = `<span id="avatarInitials">${getProfileInitials(stored.firstName ? stored.firstName + " " + (stored.lastName || "") : username)}</span><div class="avatar-edit-overlay">✎</div>`;
    }
  }
  const nameEl = document.getElementById("avatarName");
  if (nameEl) nameEl.textContent = stored.firstName ? `${stored.firstName} ${stored.lastName || ""}`.trim() : username;
  const joinedEl = document.getElementById("avatarJoined");
  if (joinedEl) joinedEl.textContent = stored.joinedDate ? `Joined ${stored.joinedDate}` : "Patient";

  // Avatar preview in edit section
  const avatarPreview = document.getElementById("avatarPreview");
  if (avatarPreview) {
    avatarPreview.innerHTML = avatar
      ? `<img src="${avatar}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`
      : `<span style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;">${getProfileInitials(stored.firstName ? stored.firstName + " " + (stored.lastName || "") : username)}</span>`;
  }

  // Personal fields
  const fields = {
    pFirstName: stored.firstName    || "",
    pLastName:  stored.lastName     || "",
    pEmail:     stored.email        || "",
    pPhone:     stored.phone        || "",
    pDOB:       stored.dob          || "",
    pGender:    stored.gender       || "",
    pBlood:     stored.blood        || "",
    pAddress:   stored.address      || "",
    pIDNumber:  stored.idNumber     || "",
    pMedNotes:  stored.medNotes     || "",
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  // Medical aid
  const maid = document.getElementById("pMedicalAid");
  if (maid) maid.value = stored.medicalAid || "";
  const maidNum = document.getElementById("pMedicalAidNumber");
  if (maidNum) maidNum.value = stored.medicalAidNumber || "";
  const maidMember = document.getElementById("pMedicalAidMember");
  if (maidMember) maidMember.value = stored.medicalAidMember || "";
  const maidDepend = document.getElementById("pDependants");
  if (maidDepend) maidDepend.value = stored.dependants || "0";

  // Username (read-only)
  const usernameEl = document.getElementById("pUsername");
  if (usernameEl) usernameEl.value = username;

  // Emergency contact
  const ecName   = document.getElementById("pECName");
  const ecPhone  = document.getElementById("pECPhone");
  const ecRelate = document.getElementById("pECRelation");
  if (ecName)   ecName.value   = stored.ecName     || "";
  if (ecPhone)  ecPhone.value  = stored.ecPhone    || "";
  if (ecRelate) ecRelate.value = stored.ecRelation || "";
}

function patientSaveProfile() {
  const firstName = document.getElementById("pFirstName")?.value.trim();
  if (!firstName) { profileToast("First name is required.", "error"); return; }

  const stored = JSON.parse(localStorage.getItem(PATIENT_PROFILE_KEY) || "{}");
  const profile = {
    ...stored,
    firstName,
    lastName:         document.getElementById("pLastName")?.value.trim()          || "",
    email:            document.getElementById("pEmail")?.value.trim()             || "",
    phone:            document.getElementById("pPhone")?.value.trim()             || "",
    dob:              document.getElementById("pDOB")?.value                      || "",
    gender:           document.getElementById("pGender")?.value                   || "",
    blood:            document.getElementById("pBlood")?.value                    || "",
    address:          document.getElementById("pAddress")?.value.trim()           || "",
    idNumber:         document.getElementById("pIDNumber")?.value.trim()          || "",
    medNotes:         document.getElementById("pMedNotes")?.value.trim()          || "",
    medicalAid:       document.getElementById("pMedicalAid")?.value               || "",
    medicalAidNumber: document.getElementById("pMedicalAidNumber")?.value.trim()  || "",
    medicalAidMember: document.getElementById("pMedicalAidMember")?.value.trim()  || "",
    dependants:       document.getElementById("pDependants")?.value               || "0",
    ecName:           document.getElementById("pECName")?.value.trim()            || "",
    ecPhone:          document.getElementById("pECPhone")?.value.trim()           || "",
    ecRelation:       document.getElementById("pECRelation")?.value               || "",
    joinedDate:       stored.joinedDate || new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
  };

  localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
  patientLoadProfile();
  profileToast("Profile saved successfully.", "success");
}

function patientHandleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { profileToast("Please select an image file.", "error"); return; }
  if (file.size > 2 * 1024 * 1024) { profileToast("Image must be under 2 MB.", "error"); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    localStorage.setItem(PATIENT_AVATAR_KEY, ev.target.result);
    patientLoadProfile();
    profileToast("Profile photo updated.", "success");
  };
  reader.readAsDataURL(file);
}

function patientRemoveAvatar() {
  if (!confirm("Remove your profile photo?")) return;
  localStorage.removeItem(PATIENT_AVATAR_KEY);
  patientLoadProfile();
  profileToast("Profile photo removed.", "info");
}

/* Documents */
function patientLoadDocuments() {
  const docs = JSON.parse(localStorage.getItem(PATIENT_DOCS_KEY) || "[]");
  const container = document.getElementById("docsList");
  if (!container) return;
  if (!docs.length) {
    container.innerHTML = `<div class="empty-docs">No documents uploaded yet. Upload your medical records, test results, or insurance documents above.</div>`;
    return;
  }
  container.innerHTML = docs.map((doc, i) => `
    <div class="doc-card">
      <div class="doc-icon">${docIcon(doc.type)}</div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}</div>
        <div class="doc-meta">${doc.category} · ${doc.size} · ${doc.date}</div>
      </div>
      <div class="doc-actions">
        <button class="doc-btn doc-btn-dl" onclick="patientDownloadDoc(${i})" title="Download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <button class="doc-btn doc-btn-del" onclick="patientDeleteDoc(${i})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

function docIcon(type) {
  if (type.includes("pdf"))   return "📄";
  if (type.includes("image")) return "🖼️";
  if (type.includes("word") || type.includes("doc")) return "📝";
  return "📎";
}

function patientHandleDocUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const category = document.getElementById("docCategory")?.value || "General";
  const docs = JSON.parse(localStorage.getItem(PATIENT_DOCS_KEY) || "[]");
  let processed = 0;

  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { profileToast(`${file.name} is too large (max 10 MB).`, "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      docs.push({
        name:     file.name,
        type:     file.type,
        size:     formatBytes(file.size),
        category,
        date:     new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        data:     ev.target.result,
      });
      processed++;
      if (processed === files.length) {
        localStorage.setItem(PATIENT_DOCS_KEY, JSON.stringify(docs));
        patientLoadDocuments();
        patientUpdateStats();
        profileToast(`${files.length} document${files.length > 1 ? "s" : ""} uploaded.`, "success");
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  });
}

function patientDownloadDoc(index) {
  const docs = JSON.parse(localStorage.getItem(PATIENT_DOCS_KEY) || "[]");
  const doc  = docs[index];
  if (!doc) return;
  const a    = document.createElement("a");
  a.href     = doc.data;
  a.download = doc.name;
  a.click();
  profileToast(`Downloading ${doc.name}…`, "info");
}

function patientDeleteDoc(index) {
  if (!confirm("Delete this document? This cannot be undone.")) return;
  const docs = JSON.parse(localStorage.getItem(PATIENT_DOCS_KEY) || "[]");
  docs.splice(index, 1);
  localStorage.setItem(PATIENT_DOCS_KEY, JSON.stringify(docs));
  patientLoadDocuments();
  patientUpdateStats();
  profileToast("Document deleted.", "info");
}

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function patientUpdateStats() {
  const username     = localStorage.getItem("patientUsername") || "john123";
  const appts        = JSON.parse(localStorage.getItem("appointments")  || "[]");
  const rxs          = JSON.parse(localStorage.getItem("prescriptions") || "[]");
  const docs         = JSON.parse(localStorage.getItem(PATIENT_DOCS_KEY) || "[]");
  const myAppts      = appts.filter(a => a.name === username || a.name === "John Matthews");
  const myRx         = rxs.filter(p => p.patient === username || p.patient === "John Matthews");

  const sa = document.getElementById("statAppts");
  const sr = document.getElementById("statRx");
  const sd = document.getElementById("statDocs");
  if (sa) sa.textContent = myAppts.length;
  if (sr) sr.textContent = myRx.length;
  if (sd) sd.textContent = docs.length;
}

function patientPopulateAccountPanel() {
  const username = localStorage.getItem("patientUsername") || "—";
  const el1 = document.getElementById("accUsername");
  const el2 = document.getElementById("accType");
  const el3 = document.getElementById("accId");
  if (el1) el1.value = username;
  if (el2) el2.value = "Patient";
  if (el3) el3.value = "CA-PAT-" + Date.now().toString().slice(-6);
}

function patientPopulateSessionInfo() {
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox"))                   browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg"))                       browser = "Edge";
  const el = document.getElementById("sessionDevice");
  if (el) el.textContent = browser + " — " + (localStorage.getItem("patientUsername") || "Patient");
}

function patientLoadPrefs() {
  const prefs = JSON.parse(localStorage.getItem("clinassist_prefs") || "{}");
  const map = {
    notifAppt: "notifAppt", notifRx: "notifRx", notifMsg: "notifMsg",
    notifWeekly: "notifWeekly", shareRecords: "privShare",
    analytics: "privAnalytics", compact: "prefCompact",
    reduceMotion: "prefReduceMotion", "24h": "pref24h",
    loginAlerts: "toggleLoginAlerts", "2fa": "toggle2FA",
  };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && prefs[key] !== undefined) el.checked = prefs[key];
  });
}

function patientSavePref(key, val) {
  const prefs = JSON.parse(localStorage.getItem("clinassist_prefs") || "{}");
  prefs[key] = val;
  localStorage.setItem("clinassist_prefs", JSON.stringify(prefs));
  profileToast("Preference saved.", "info");
}

function patientChangePassword() {
  const curr    = document.getElementById("secCurrent")?.value;
  const newPw   = document.getElementById("secNew")?.value;
  const confirm = document.getElementById("secConfirm")?.value;
  if (!curr)             { profileToast("Enter your current password.", "error"); return; }
  if (!newPw)            { profileToast("Enter a new password.", "error"); return; }
  if (newPw !== confirm) { profileToast("Passwords do not match.", "error"); return; }
  if (newPw.length < 8)  { profileToast("Password must be at least 8 characters.", "error"); return; }
  document.getElementById("secCurrent").value = "";
  document.getElementById("secNew").value     = "";
  document.getElementById("secConfirm").value = "";
  document.getElementById("strengthFill").style.width = "0";
  document.getElementById("strengthText").textContent = "Enter a new password";
  profileToast("Password updated successfully.", "success");
}

function patientExportData() {
  const data = {
    profile:       JSON.parse(localStorage.getItem(PATIENT_PROFILE_KEY) || "{}"),
    appointments:  JSON.parse(localStorage.getItem("appointments")  || "[]"),
    prescriptions: JSON.parse(localStorage.getItem("prescriptions") || "[]"),
    preferences:   JSON.parse(localStorage.getItem("clinassist_prefs") || "{}"),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: "clinassist_patient_data.json" });
  a.click();
  URL.revokeObjectURL(url);
  profileToast("Data exported.", "success");
}

function patientSignOut() {
  localStorage.removeItem("patientLoggedIn");
  localStorage.removeItem("patientUsername");
  window.location.href = "index.html";
}

function patientConfirmDelete() {
  if (!confirm("Permanently delete your account? All data will be erased. This cannot be undone.")) return;
  ["clinassist_patient_profile","clinassist_prefs","clinassist_patient_docs","clinassist_patient_avatar",
   "appointments","prescriptions","submissions","patientLoggedIn","patientUsername"
  ].forEach(k => localStorage.removeItem(k));
  profileToast("Account deleted. Redirecting…", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 1800);
}


/* ─────────────────────────────────────────────
   DOCTOR PROFILE
───────────────────────────────────────────── */

const DOCTOR_PROFILE_KEY = "clinassist_doctor_profile";
const DOCTOR_DOCS_KEY    = "clinassist_doctor_docs";
const DOCTOR_AVATAR_KEY  = "clinassist_doctor_avatar";

function doctorProfileInit() {
  if (localStorage.getItem("doctorLoggedIn") !== "true") {
    window.location.href = "doctor-login.html";
    return;
  }
  doctorLoadProfile();
  doctorLoadDocuments();
  doctorUpdateStats();
  doctorPopulateAccountPanel();
  doctorLoadPrefs();
  doctorPopulateSessionInfo();

  document.querySelectorAll("[data-panel]").forEach(el => {
    el.addEventListener("click", function () {
      showDoctorPanel(this.dataset.panel, this);
    });
  });

  const avatarInput = document.getElementById("avatarUploadInput");
  if (avatarInput) avatarInput.addEventListener("change", doctorHandleAvatarUpload);

  const newPw = document.getElementById("secNew");
  if (newPw) newPw.addEventListener("input", () => checkPasswordStrength(newPw.value, "strengthFill", "strengthText"));

  const docInput = document.getElementById("docUploadInput");
  if (docInput) docInput.addEventListener("change", doctorHandleDocUpload);
}

function showDoctorPanel(name, el) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("[data-panel]").forEach(n => n.classList.remove("active"));
  const panel = document.getElementById("panel-" + name);
  if (panel) panel.classList.add("active");
  if (el) el.classList.add("active");
  else document.querySelector(`[data-panel="${name}"]`)?.classList.add("active");
}

function doctorLoadProfile() {
  const email    = localStorage.getItem("doctorEmail") || "doctor@demo.com";
  const docName  = localStorage.getItem("doctorName")  || "Doctor";
  const stored   = JSON.parse(localStorage.getItem(DOCTOR_PROFILE_KEY) || "{}");
  const avatar   = localStorage.getItem(DOCTOR_AVATAR_KEY) || "";

  const displayName = stored.firstName ? `${stored.title ? stored.title + " " : ""}${stored.firstName} ${stored.lastName || ""}`.trim() : docName;

  const avatarCircle = document.getElementById("avatarCircle");
  if (avatarCircle) {
    if (avatar) {
      avatarCircle.innerHTML = `<img src="${avatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    } else {
      avatarCircle.innerHTML = `<span>${getProfileInitials(displayName)}</span><div class="avatar-edit-overlay">✎</div>`;
    }
  }

  const nameEl = document.getElementById("avatarName");
  if (nameEl) nameEl.textContent = displayName;
  const roleEl = document.getElementById("avatarSpec");
  if (roleEl) roleEl.textContent = stored.specialization || "General Practitioner";
  const joinedEl = document.getElementById("avatarJoined");
  if (joinedEl) joinedEl.textContent = stored.joinedDate ? `Registered ${stored.joinedDate}` : "Doctor";

  const avatarPreview = document.getElementById("avatarPreview");
  if (avatarPreview) {
    avatarPreview.innerHTML = avatar
      ? `<img src="${avatar}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`
      : `<span style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;">${getProfileInitials(displayName)}</span>`;
  }

  const fields = {
    pTitle:         stored.title           || "",
    pFirstName:     stored.firstName       || "",
    pLastName:      stored.lastName        || "",
    pEmail:         stored.email           || email,
    pPhone:         stored.phone           || "",
    pSpecialization: stored.specialization || "",
    pLicenseNumber: stored.licenseNumber   || "",
    pLicenseIssuer: stored.licenseIssuer   || "",
    pLicenseExpiry: stored.licenseExpiry   || "",
    pHospitalName:  stored.hospitalName    || "",
    pPracticeCity:  stored.practiceCity    || "",
    pPracticeCountry: stored.practiceCountry || "Botswana",
    pYearsExp:      stored.yearsExp        || "",
    pLanguages:     stored.languages       || "",
    pBio:           stored.bio             || "",
    pConsultFee:    stored.consultFee      || "",
    pAvailability:  stored.availability    || "",
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function doctorSaveProfile() {
  const firstName = document.getElementById("pFirstName")?.value.trim();
  if (!firstName) { profileToast("First name is required.", "error"); return; }

  const stored = JSON.parse(localStorage.getItem(DOCTOR_PROFILE_KEY) || "{}");
  const profile = {
    ...stored,
    title:           document.getElementById("pTitle")?.value             || "",
    firstName,
    lastName:        document.getElementById("pLastName")?.value.trim()   || "",
    email:           document.getElementById("pEmail")?.value.trim()      || "",
    phone:           document.getElementById("pPhone")?.value.trim()      || "",
    specialization:  document.getElementById("pSpecialization")?.value    || "",
    licenseNumber:   document.getElementById("pLicenseNumber")?.value.trim() || "",
    licenseIssuer:   document.getElementById("pLicenseIssuer")?.value     || "",
    licenseExpiry:   document.getElementById("pLicenseExpiry")?.value     || "",
    hospitalName:    document.getElementById("pHospitalName")?.value.trim() || "",
    practiceCity:    document.getElementById("pPracticeCity")?.value.trim() || "",
    practiceCountry: document.getElementById("pPracticeCountry")?.value   || "",
    yearsExp:        document.getElementById("pYearsExp")?.value          || "",
    languages:       document.getElementById("pLanguages")?.value.trim()  || "",
    bio:             document.getElementById("pBio")?.value.trim()        || "",
    consultFee:      document.getElementById("pConsultFee")?.value.trim() || "",
    availability:    document.getElementById("pAvailability")?.value      || "",
    joinedDate:      stored.joinedDate || new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
  };

  localStorage.setItem(DOCTOR_PROFILE_KEY, JSON.stringify(profile));
  // Update shared name
  const fullName = `${profile.title ? profile.title + " " : ""}${profile.firstName} ${profile.lastName}`.trim();
  localStorage.setItem("doctorName", fullName);
  doctorLoadProfile();
  profileToast("Profile saved successfully.", "success");
}

function doctorHandleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { profileToast("Please select an image file.", "error"); return; }
  if (file.size > 2 * 1024 * 1024)    { profileToast("Image must be under 2 MB.", "error"); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    localStorage.setItem(DOCTOR_AVATAR_KEY, ev.target.result);
    doctorLoadProfile();
    profileToast("Profile photo updated.", "success");
  };
  reader.readAsDataURL(file);
}

function doctorRemoveAvatar() {
  if (!confirm("Remove your profile photo?")) return;
  localStorage.removeItem(DOCTOR_AVATAR_KEY);
  doctorLoadProfile();
  profileToast("Profile photo removed.", "info");
}

/* Doctor Documents */
function doctorLoadDocuments() {
  const docs = JSON.parse(localStorage.getItem(DOCTOR_DOCS_KEY) || "[]");
  const container = document.getElementById("docsList");
  if (!container) return;
  if (!docs.length) {
    container.innerHTML = `<div class="empty-docs">No documents uploaded yet. Upload your license, certifications, or credentials above.</div>`;
    return;
  }
  container.innerHTML = docs.map((doc, i) => `
    <div class="doc-card">
      <div class="doc-icon">${docIcon(doc.type)}</div>
      <div class="doc-info">
        <div class="doc-name">${doc.name}</div>
        <div class="doc-meta">${doc.category} · ${doc.size} · ${doc.date}</div>
      </div>
      <div class="doc-actions">
        <button class="doc-btn doc-btn-dl" onclick="doctorDownloadDoc(${i})" title="Download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </button>
        <button class="doc-btn doc-btn-del" onclick="doctorDeleteDoc(${i})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

function doctorHandleDocUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const category = document.getElementById("docCategory")?.value || "General";
  const docs = JSON.parse(localStorage.getItem(DOCTOR_DOCS_KEY) || "[]");
  let processed = 0;

  files.forEach(file => {
    if (file.size > 15 * 1024 * 1024) { profileToast(`${file.name} too large (max 15 MB).`, "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      docs.push({
        name: file.name, type: file.type, size: formatBytes(file.size),
        category, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        data: ev.target.result,
      });
      processed++;
      if (processed === files.length) {
        localStorage.setItem(DOCTOR_DOCS_KEY, JSON.stringify(docs));
        doctorLoadDocuments();
        doctorUpdateStats();
        profileToast(`${files.length} document${files.length > 1 ? "s" : ""} uploaded.`, "success");
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  });
}

function doctorDownloadDoc(index) {
  const docs = JSON.parse(localStorage.getItem(DOCTOR_DOCS_KEY) || "[]");
  const doc  = docs[index];
  if (!doc) return;
  const a = Object.assign(document.createElement("a"), { href: doc.data, download: doc.name });
  a.click();
  profileToast(`Downloading ${doc.name}…`, "info");
}

function doctorDeleteDoc(index) {
  if (!confirm("Delete this document?")) return;
  const docs = JSON.parse(localStorage.getItem(DOCTOR_DOCS_KEY) || "[]");
  docs.splice(index, 1);
  localStorage.setItem(DOCTOR_DOCS_KEY, JSON.stringify(docs));
  doctorLoadDocuments();
  doctorUpdateStats();
  profileToast("Document deleted.", "info");
}

function doctorUpdateStats() {
  const appts = JSON.parse(localStorage.getItem("appointments")  || "[]");
  const rxs   = JSON.parse(localStorage.getItem("prescriptions") || "[]");
  const subs  = JSON.parse(localStorage.getItem("submissions")   || "[]");
  const docs  = JSON.parse(localStorage.getItem(DOCTOR_DOCS_KEY) || "[]");

  const sa = document.getElementById("statPatients");
  const sr = document.getElementById("statRx");
  const ss = document.getElementById("statSubs");
  const sd = document.getElementById("statDocs");
  if (sa) sa.textContent = new Set(appts.map(a => a.name)).size;
  if (sr) sr.textContent = rxs.length;
  if (ss) ss.textContent = subs.length;
  if (sd) sd.textContent = docs.length;
}

function doctorPopulateAccountPanel() {
  const email = localStorage.getItem("doctorEmail") || "—";
  const el1 = document.getElementById("accEmail");
  const el2 = document.getElementById("accType");
  const el3 = document.getElementById("accId");
  if (el1) el1.value = email;
  if (el2) el2.value = "Doctor / Practitioner";
  if (el3) el3.value = "CA-DOC-" + Date.now().toString().slice(-6);
}

function doctorPopulateSessionInfo() {
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox"))                   browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg"))                       browser = "Edge";
  const el = document.getElementById("sessionDevice");
  if (el) el.textContent = browser + " — " + (localStorage.getItem("doctorName") || "Doctor");
}

function doctorLoadPrefs() {
  const prefs = JSON.parse(localStorage.getItem("clinassist_prefs") || "{}");
  const map = {
    notifAppt: "notifAppt", notifRx: "notifRx", notifMsg: "notifMsg",
    loginAlerts: "toggleLoginAlerts", "2fa": "toggle2FA",
    analytics: "privAnalytics", compact: "prefCompact",
    reduceMotion: "prefReduceMotion", "24h": "pref24h",
  };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && prefs[key] !== undefined) el.checked = prefs[key];
  });
}

function doctorSavePref(key, val) {
  const prefs = JSON.parse(localStorage.getItem("clinassist_prefs") || "{}");
  prefs[key] = val;
  localStorage.setItem("clinassist_prefs", JSON.stringify(prefs));
  profileToast("Preference saved.", "info");
}

function doctorChangePassword() {
  const curr    = document.getElementById("secCurrent")?.value;
  const newPw   = document.getElementById("secNew")?.value;
  const confirm = document.getElementById("secConfirm")?.value;
  if (!curr)             { profileToast("Enter your current password.", "error"); return; }
  if (!newPw)            { profileToast("Enter a new password.", "error"); return; }
  if (newPw !== confirm) { profileToast("Passwords do not match.", "error"); return; }
  if (newPw.length < 8)  { profileToast("Password must be at least 8 characters.", "error"); return; }
  document.getElementById("secCurrent").value = "";
  document.getElementById("secNew").value     = "";
  document.getElementById("secConfirm").value = "";
  document.getElementById("strengthFill").style.width = "0";
  document.getElementById("strengthText").textContent = "Enter a new password";
  profileToast("Password updated successfully.", "success");
}

function doctorExportData() {
  const data = {
    profile:       JSON.parse(localStorage.getItem(DOCTOR_PROFILE_KEY) || "{}"),
    appointments:  JSON.parse(localStorage.getItem("appointments")  || "[]"),
    prescriptions: JSON.parse(localStorage.getItem("prescriptions") || "[]"),
    submissions:   JSON.parse(localStorage.getItem("submissions")   || "[]"),
    preferences:   JSON.parse(localStorage.getItem("clinassist_prefs") || "{}"),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: "clinassist_doctor_data.json" });
  a.click();
  URL.revokeObjectURL(url);
  profileToast("Data exported.", "success");
}

function doctorSignOut() {
  localStorage.removeItem("doctorLoggedIn");
  localStorage.removeItem("doctorEmail");
  localStorage.removeItem("doctorName");
  window.location.href = "index.html";
}

function doctorConfirmDelete() {
  if (!confirm("Permanently delete your practitioner account? All data will be erased.")) return;
  ["clinassist_doctor_profile","clinassist_prefs","clinassist_doctor_docs","clinassist_doctor_avatar",
   "appointments","prescriptions","submissions","doctorLoggedIn","doctorEmail","doctorName"
  ].forEach(k => localStorage.removeItem(k));
  profileToast("Account deleted. Redirecting…", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 1800);
}
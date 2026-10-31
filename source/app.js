
"use strict";

/* =================================
   SWASTHYA SENSE
   Offline-ready application
================================= */

const STORAGE_KEY = "swasthyaSenseData";
const SESSION_KEY = "swasthyaSenseSession";

const $ = id => document.getElementById(id);

const roles = {
  patient: "Patient",
  worker: "Healthcare Worker",
  clinician: "Clinician",
  admin: "Administrator"
};

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      checkins: [],
      appointments: [
        {
          id: 1,
          title: "Routine follow-up",
          date: getDateOffset(3),
          status: "Upcoming"
        }
      ],
      alerts: [],
      reminders: [],
      timeline: [],
      profile: {
        language: "English",
        consent: true,
        communication: "SMS"
      },
      audit: []
    };
  } catch (error) {
    console.error("Storage error:", error);
    return {
      checkins: [],
      appointments: [],
      alerts: [],
      reminders: [],
      timeline: [],
      profile: {
        language: "English",
        consent: true,
        communication: "SMS"
      },
      audit: []
    };
  }
}

let data = loadData();
let currentUser = null;
let currentSection = "overview";

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    alert("Could not save data. Browser storage may be full.");
  }
}

function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateText(date) {
  if (!date) return "Not scheduled";
  return new Date(date + "T00:00:00").toLocaleDateString();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function audit(action) {
  data.audit.push({
    action,
    user: currentUser?.name || "Unknown",
    time: new Date().toISOString()
  });
  saveData();
}

/* =================================
   LOGIN - NO SUPABASE REQUIRED
================================= */

$("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const name = $("username").value.trim();
  const password = $("password").value;
  const role = $("userRole").value;

  if (!name || !password) {
    $("loginError").textContent = "Please enter your username and password.";
    return;
  }

  currentUser = {
    name,
    role,
    id: name.toLowerCase().replace(/[^a-z0-9]/g, "-")
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));

  audit("Logged in as " + roles[role]);

  showApplication();
});

function showApplication() {
  if (!currentUser) return;

  $("loginPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");

  $("sidebarName").textContent = currentUser.name;
  $("welcomeName").textContent = currentUser.name;
  $("sidebarRole").textContent = roles[currentUser.role];
  $("sidebarAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("topAvatar").textContent = currentUser.name.charAt(0).toUpperCase();

  $("currentDate").textContent = new Date().toLocaleDateString(
    undefined,
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  setupNavigation();
  configureRoleNavigation();
  renderSection("overview");
}

/* =================================
   ROLE BASED NAVIGATION
================================= */

const navigationByRole = {
  patient: [
    "overview", "checkin", "appointments",
    "alerts", "history", "reminders", "profile"
  ],
  worker: [
    "overview", "appointments", "alerts",
    "history", "reminders", "profile"
  ],
  clinician: [
    "overview", "alerts", "history",
    "appointments", "profile"
  ],
  admin: [
    "overview", "appointments", "alerts",
    "history", "reminders", "profile"
  ]
};

function configureRoleNavigation() {
  const allowed = navigationByRole[currentUser.role];

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.style.display =
      allowed.includes(button.dataset.section) ? "block" : "none";
  });
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.onclick = () => {
      renderSection(button.dataset.section);
    };
  });
}

function renderSection(section) {
  const allowed = navigationByRole[currentUser.role];

  if (!allowed.includes(section)) return;

  currentSection = section;

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.section === section
    );
  });

  const headings = {
    overview: "Dashboard Overview",
    checkin: "Health Check-in",
    appointments: "Appointments & Follow-ups",
    alerts: "Patient Attention Engine",
    history: "Health Timeline",
    reminders: "Reminders & Communication",
    profile: "My Profile"
  };

  $("pageHeading").textContent = headings[section] || "Dashboard";

  if (section === "overview") renderOverview();
  if (section === "checkin") renderCheckinPage();
  if (section === "appointments") renderAppointments();
  if (section === "alerts") renderAlerts();
  if (section === "history") renderHistory();
  if (section === "reminders") renderReminders();
  if (section === "profile") renderProfile();
}

/* =================================
   COMMON DASHBOARD COMPONENTS
================================= */

function stat(title, value, description) {
  return `
    <div class="stat-card">
      <small>${title}</small>
      <h2>${value}</h2>
      <p>${description}</p>
    </div>`;
}

function panel(title, content) {
  return `
    <section class="panel">
      <h3>${title}</h3>
      ${content}
    </section>`;
}

function welcome() {
  return `
    <div class="welcome-banner">
      <h2>Hello, ${escapeHTML(currentUser.name)}! 👋</h2>
      <p>Welcome to SWASTHYA SENSE. Your health journey matters to us.</p>
      <p style="margin-top:10px">No Patient Lost in the Follow-up Process.</p>
    </div>`;
}

/* =================================
   ROLE DASHBOARDS
================================= */

function renderOverview() {
  if (currentUser.role === "patient") return patientDashboard();
  if (currentUser.role === "worker") return workerDashboard();
  if (currentUser.role === "clinician") return clinicianDashboard();
  if (currentUser.role === "admin") return adminDashboard();
}

function patientDashboard() {
  const pending = data.appointments.filter(a => a.status === "Upcoming").length;
  const completed = data.checkins.length;
  const unresolved = data.alerts.filter(a => a.status !== "Resolved").length;
  const next = data.appointments
    .filter(a => a.status === "Upcoming")
    .sort((a,b) => a.date.localeCompare(b.date))[0];

  $("dashboardContent").innerHTML = `
    ${welcome()}

    <div class="stats-grid">
      ${stat("Health Check-ins", completed, "Your submitted check-ins")}
      ${stat("Upcoming Follow-ups", pending, "Appointments to remember")}
      ${stat("Attention Alerts", unresolved, "Items requiring attention")}
      ${stat("Patient ID", "SS-" + currentUser.id.slice(0,6).toUpperCase(), "Demo patient identifier")}
    </div>

    <div class="section-grid">
      ${panel("Your Next Follow-up", next ? `
        <div class="record">
          <div>
            <strong>${escapeHTML(next.title)}</strong>
            <small>${dateText(next.date)}</small>
          </div>
          <span class="status warning">Upcoming</span>
        </div>
        <p>Keep track of your scheduled follow-up.</p>
        <div class="action-row">
          <button class="action-btn" onclick="renderSection('appointments')">View appointments</button>
        </div>
      ` : `<p class="empty">No upcoming follow-up scheduled.</p>`)}

      ${panel("Patient Attention Engine", `
        <p>Your submitted check-ins can be compared with previous entries using configured demonstration rules.</p>
        <p style="margin-top:10px">Clinical alerts are for qualified clinical review, not a diagnosis.</p>
        <div class="action-row">
          <button class="action-btn" onclick="renderSection('alerts')">View alerts</button>
        </div>
      `)}
    </div>

    <div class="section-grid">
      ${panel("Quick Actions", `
        <div class="action-row">
          <button class="action-btn" onclick="openCheckin()">＋ Health check-in</button>
          <button class="action-btn" onclick="renderSection('appointments')">▣ Appointments</button>
          <button class="action-btn" onclick="renderSection('history')">◷ Health history</button>
        </div>
      `)}

      ${panel("Recent Activity", recentActivity())}
    </div>

    ${panel("Health Information", `
      <p>Remember to submit your check-ins regularly and keep your follow-up appointments.</p>
      <p style="margin-top:8px">For severe or rapidly worsening symptoms, seek appropriate urgent medical care rather than relying on this demonstration dashboard.</p>
    `)}
  `;
}

function workerDashboard() {
  const overdue = data.appointments.filter(a =>
    a.status === "Upcoming" && a.date < getDateOffset(0)
  ).length;

  $("dashboardContent").innerHTML = `
    ${welcome()}
    <div class="stats-grid">
      ${stat("Registered Demo Users", "1", "Local demo account")}
      ${stat("Upcoming Follow-ups", data.appointments.length, "All recorded appointments")}
      ${stat("Overdue Follow-ups", overdue, "Administrative tracking")}
      ${stat("Pending Reviews", data.alerts.filter(a => a.status !== "Resolved").length, "Unresolved demo alerts")}
    </div>
    <div class="section-grid">
      ${panel("High-Priority Action Queue", alertList())}
      ${panel("Follow-up Management", `
        <p>Track upcoming and overdue follow-ups separately from clinical warnings.</p>
        <div class="action-row">
          <button class="action-btn" onclick="renderSection('appointments')">Manage follow-ups</button>
          <button class="action-btn" onclick="renderSection('alerts')">Review alerts</button>
        </div>
      `)}
    </div>
    ${panel("Recent Patient Check-ins", checkinList())}
  `;
}

function clinicianDashboard() {
  const pending = data.alerts.filter(a => a.status !== "Resolved").length;

  $("dashboardContent").innerHTML = `
    ${welcome()}
    <div class="stats-grid">
      ${stat("Pending Clinical Reviews", pending, "Unresolved demonstration alerts")}
      ${stat("Total Check-ins", data.checkins.length, "Patient-reported entries")}
      ${stat("Referrals", pending, "Demo cases requiring review")}
      ${stat("Resolved Alerts", data.alerts.filter(a => a.status === "Resolved").length, "Recorded resolutions")}
    </div>
    <div class="section-grid">
      ${panel("Referred Cases", alertList())}
      ${panel("Clinical Review Workflow", `
        <p>Review the original patient-reported information and configured alert rule before recording a decision.</p>
        <p style="margin-top:8px">This prototype does not provide diagnosis or treatment recommendations.</p>
        <div class="action-row">
          <button class="action-btn" onclick="renderSection('alerts')">Open clinical reviews</button>
        </div>
      `)}
    </div>
    ${panel("Patient Check-in History", checkinList())}
  `;
}

function adminDashboard() {
  $("dashboardContent").innerHTML = `
    ${welcome()}
    <div class="stats-grid">
      ${stat("Demo Patient Accounts", "1", "Local browser data")}
      ${stat("Check-ins", data.checkins.length, "Recorded check-ins")}
      ${stat("Follow-ups", data.appointments.length, "All appointments")}
      ${stat("System Alerts", data.alerts.length, "Generated demo alerts")}
    </div>
    <div class="section-grid">
      ${panel("System Overview", `
        <p>SWASTHYA SENSE offline demonstration environment.</p>
        <p style="margin-top:8px">Data storage: Browser localStorage</p>
        <p>Authentication: Local demo login</p>
        <p>Supabase: Not required</p>
      `)}
      ${panel("Audit Trail", `
        <p>${data.audit.length} recorded demo actions.</p>
        <div class="action-row">
          <button class="action-btn" onclick="downloadReport()">Export report</button>
        </div>
      `)}
    </div>
    ${panel("Recent System Activity", recentActivity())}
  `;
}

/* =================================
   CHECK-IN SYSTEM
================================= */

function renderCheckinPage() {
  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Submit Your Health Check-in", `
      <p>Record how you are feeling and enter any available measurements.</p>
      <div class="action-row">
        <button class="action-btn" onclick="openCheckin()">＋ Start Check-in</button>
      </div>
    `)}
    ${panel("Previous Check-ins", checkinList())}
  `;
}

function openCheckin() {
  $("checkinModal").classList.remove("hidden");
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    $(button.dataset.close).classList.add("hidden");
  });
});

$("checkinForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const bp = $("bp").value;
  const heart = $("heartRate").value;
  const temp = $("temperature").value;

  if (bp && (+bp < 50 || +bp > 300)) {
    alert("Please enter a valid systolic blood pressure value.");
    return;
  }

  if (heart && (+heart < 20 || +heart > 250)) {
    alert("Please enter a valid heart rate.");
    return;
  }

  if (temp && (+temp < 30 || +temp > 45)) {
    alert("Please enter a valid temperature.");
    return;
  }

  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    symptoms: $("symptoms").value,
    bp: bp || "Not entered",
    heart: heart || "Not entered",
    temp: temp || "Not entered",
    notes: $("healthNotes").value,
    reportedBy: currentUser.name
  };

  data.checkins.unshift(entry);

  // Prototype examples only, not clinically validated rules.
  const symptomFlag = [
    "Breathing difficulty",
    "Chest pain"
  ].includes(entry.symptoms);

  if (symptomFlag) {
    const duplicate = data.alerts.some(a =>
      a.entryId === entry.id && a.status !== "Resolved"
    );

    if (!duplicate) {
      data.alerts.unshift({
        id: Date.now() + 1,
        entryId: entry.id,
        type: "Clinical review",
        reason: "The patient reported: " + entry.symptoms,
        rule: "Prototype symptom flag",
        status: "Pending",
        date: entry.date
      });
    }
  }

  data.timeline.unshift({
    title: "Health check-in submitted",
    date: entry.date,
    detail: entry.symptoms
  });

  saveData();
  audit("Submitted health check-in");

  $("checkinForm").reset();
  $("checkinModal").classList.add("hidden");

  alert("Your check-in has been saved successfully.");
  renderSection("overview");
});

/* =================================
   APPOINTMENTS
================================= */

function renderAppointments() {
  const rows = data.appointments.map(a => `
    <div class="record">
      <div>
        <strong>${escapeHTML(a.title)}</strong>
        <small>${dateText(a.date)}</small>
      </div>
      <div>
        <span class="status ${a.status === "Missed" ? "danger" : a.status === "Completed" ? "" : "warning"}">${escapeHTML(a.status)}</span>
        ${a.status !== "Completed" ? `<button class="action-btn" onclick="completeAppointment(${a.id})">Complete</button>` : ""}
      </div>
    </div>
  `).join("");

  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Follow-up Appointments", `
      ${rows || '<p class="empty">No appointments found.</p>'}
      <div class="action-row">
        <button class="action-btn" onclick="addAppointment()">＋ Add appointment</button>
      </div>
    `)}
  `;
}

function addAppointment() {
  const title = prompt("Enter appointment title:");
  if (!title) return;

  const date = prompt("Enter appointment date (YYYY-MM-DD):");
  if (!date || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date + "T00:00:00"))) {
    alert("Enter a valid date in YYYY-MM-DD format.");
    return;
  }

  data.appointments.push({
    id: Date.now(),
    title,
    date,
    status: "Upcoming"
  });

  saveData();
  audit("Added appointment");
  renderSection("appointments");
}

function completeAppointment(id) {
  const item = data.appointments.find(a => a.id === id);
  if (!item) return;

  item.status = "Completed";
  saveData();
  audit("Completed appointment");
  renderSection("appointments");
}

/* =================================
   PATIENT ATTENTION ENGINE
================================= */

function alertList() {
  if (!data.alerts.length) {
    return '<p class="empty">No active alerts. No clinical conclusion is implied.</p>';
  }

  return data.alerts.map(a => `
    <div class="record">
      <div>
        <strong>${escapeHTML(a.type)}</strong>
        <small>${escapeHTML(a.reason)}</small><br>
        <small>Rule: ${escapeHTML(a.rule)} | ${new Date(a.date).toLocaleString()}</small>
      </div>
      <div>
        <span class="status ${a.status === "Resolved" ? "" : "danger"}">${escapeHTML(a.status)}</span>
        ${a.status !== "Resolved" ? `<button class="action-btn" onclick="resolveAlert(${a.id})">Mark reviewed</button>` : ""}
      </div>
    </div>
  `).join("");
}

function renderAlerts() {
  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Patient Attention Engine", `
      <p>Transparent demonstration alerts generated from submitted check-in information.</p>
      <p style="margin-top:8px">Administrative overdue tasks and clinical-review alerts are tracked separately.</p>
    `)}
    ${panel("Active and Historical Alerts", alertList())}
  `;
}

function resolveAlert(id) {
  if (currentUser.role !== "clinician" && currentUser.role !== "admin") {
    alert("Only an authorised clinician or administrator can resolve this demo alert.");
    return;
  }

  const item = data.alerts.find(a => a.id === id);
  if (!item) return;

  const note = prompt("Enter clinical review outcome or resolution note:");
  if (!note) return;

  item.status = "Resolved";
  item.reviewNote = note;
  item.reviewedBy = currentUser.name;
  item.reviewedAt = new Date().toISOString();

  saveData();
  audit("Reviewed alert " + id);
  renderSection("alerts");
}

/* =================================
   CHECK-IN HISTORY / TIMELINE
================================= */

function checkinList() {
  if (!data.checkins.length) {
    return '<p class="empty">No health check-ins submitted yet.</p>';
  }

  return data.checkins.map(c => `
    <div class="record">
      <div>
        <strong>${escapeHTML(c.symptoms)}</strong>
        <small>${new Date(c.date).toLocaleString()}</small>
        <small>BP: ${escapeHTML(c.bp)} | Heart rate: ${escapeHTML(c.heart)} | Temperature: ${escapeHTML(c.temp)}</small>
        <small>Patient-reported by ${escapeHTML(c.reportedBy)}</small>
        ${c.notes ? `<p>${escapeHTML(c.notes)}</p>` : ""}
      </div>
    </div>
  `).join("");
}

function recentActivity() {
  const activities = [
    ...data.timeline.map(t => ({
      title: t.title,
      date: t.date,
      detail: t.detail
    })),
    ...data.appointments.map(a => ({
      title: a.title,
      date: a.date,
      detail: a.status
    }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  return activities.length ? activities.slice(0,5).map(a => `
    <div class="record">
      <div>
        <strong>${escapeHTML(a.title)}</strong>
        <small>${escapeHTML(a.detail || "")}</small>
      </div>
      <small>${new Date(a.date).toLocaleDateString()}</small>
    </div>
  `).join("") : '<p class="empty">Your activity will appear here.</p>';
}

function renderHistory() {
  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Your Complete Health Timeline", `
      ${recentActivity()}
    `)}
    ${panel("Check-in Records", checkinList())}
    ${panel("Clinical Review History", alertList())}
  `;
}

/* =================================
   REMINDERS
================================= */

function renderReminders() {
  const items = data.reminders.map(r => `
    <div class="record">
      <div>
        <strong>${escapeHTML(r.channel)} Reminder</strong>
        <small>${escapeHTML(r.message)}</small>
        <small>${new Date(r.date).toLocaleString()}</small>
      </div>
      <span class="status">${escapeHTML(r.status)}</span>
    </div>
  `).join("");

  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Communication Preferences", `
      <p>Reminders in this demo are simulated. No SMS or WhatsApp message is actually sent.</p>
      <div class="action-row">
        <button class="action-btn" onclick="sendReminder('SMS')">Simulate SMS</button>
        <button class="action-btn" onclick="sendReminder('WhatsApp')">Simulate WhatsApp</button>
      </div>
    `)}
    ${panel("Reminder History", items || '<p class="empty">No reminders yet.</p>')}
  `;
}

function sendReminder(channel) {
  if (!data.profile.consent) {
    alert("Communication consent is not enabled.");
    return;
  }

  const next = data.appointments.find(a => a.status === "Upcoming");

  const message = next
    ? "Reminder: Your follow-up is scheduled for " + next.date
    : "Remember to keep your health check-ins up to date.";

  data.reminders.unshift({
    id: Date.now(),
    channel,
    message,
    date: new Date().toISOString(),
    status: "Simulated"
  });

  saveData();
  audit("Generated simulated " + channel + " reminder");
  renderSection("reminders");
}

/* =================================
   PROFILE
================================= */

function renderProfile() {
  $("dashboardContent").innerHTML = `
    ${welcome()}
    ${panel("Your Account", `
      <p><strong>Username:</strong> ${escapeHTML(currentUser.name)}</p>
      <p><strong>Role:</strong> ${roles[currentUser.role]}</p>
      <p><strong>Demo ID:</strong> SS-${currentUser.id.slice(0,6).toUpperCase()}</p>

      <label>Preferred Language</label>
      <select id="profileLanguage">
        <option>English</option>
        <option>Hindi</option>
        <option>Assamese</option>
        <option>Bengali</option>
      </select>

      <label>Communication Preference</label>
      <select id="communication">
        <option>SMS</option>
        <option>WhatsApp</option>
        <option>None</option>
      </select>

      <label>
        <input id="consent" type="checkbox" style="width:auto">
        I consent to simulated communication reminders.
      </label>

      <button class="action-btn" onclick="saveProfile()">Save Preferences</button>
    `)}
  `;

  $("profileLanguage").value = data.profile.language;
  $("communication").value = data.profile.communication;
  $("consent").checked = data.profile.consent;
}

function saveProfile() {
  data.profile.language = $("profileLanguage").value;
  data.profile.communication = $("communication").value;
  data.profile.consent = $("consent").checked;

  saveData();
  audit("Updated profile preferences");
  alert("Profile preferences saved.");
}

/* =================================
   REPORT EXPORT
================================= */

function downloadReport() {
  const report = {
    exportedAt: new Date().toISOString(),
    checkins: data.checkins,
    appointments: data.appointments,
    alerts: data.alerts,
    reminders: data.reminders,
    audit: data.audit
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "swasthya-sense-demo-report.json";
  a.click();
  URL.revokeObjectURL(url);
}

/* =================================
   LOGOUT AND SESSION RESTORE
================================= */

$("logoutBtn").addEventListener("click", function() {
  audit("Logged out");
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;

  $("appPage").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("loginForm").reset();
});

try {
  const savedSession = sessionStorage.getItem(SESSION_KEY);
  if (savedSession) {
    const parsed = JSON.parse(savedSession);

    if (parsed.name && roles[parsed.role]) {
      currentUser = parsed;
      showApplication();
    }
  }
} catch (error) {
  sessionStorage.removeItem(SESSION_KEY);
  console.error("Could not restore session:", error);
}
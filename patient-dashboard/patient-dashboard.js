
"use strict";

/* =========================================
   SWASTHYA SENSE - PATIENT DASHBOARD
   Browser demo using localStorage.
   Uses synthetic demonstration records.
========================================= */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "swasthyaSensePatientPortal";
let appData;
let toastTimer;

/* ---------- Login identity ---------- */

function getLoginIdentity() {
  const nameKeys = ["userName", "fullName", "loggedInUserName", "patientName"];
  const emailKeys = ["userEmail", "email", "loggedInUserEmail"];

  let name = "";
  let email = "";

  for (const key of nameKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      name = value.trim();
      break;
    }
  }

  for (const key of emailKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      email = value.trim();
      break;
    }
  }

  return {
    name: name || "Patient",
    email: email || "patient@example.com"
  };
}

/* ---------- Demo data ---------- */

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createInitialData() {
  const identity = getLoginIdentity();

  return {
    patientId: "SS-" + Math.floor(100000 + Math.random() * 900000),
    name: identity.name,
    email: identity.email,
    channel: "SMS",
    language: "English",
    consent: false,

    appointments: [
      {
        id: crypto.randomUUID(),
        date: dateOffset(5),
        reason: "Routine follow-up",
        notes: "",
        status: "Scheduled",
        createdAt: new Date().toISOString()
      }
    ],

    followups: [
      {
        id: crypto.randomUUID(),
        title: "Routine scheduled follow-up",
        date: dateOffset(5),
        status: "Pending",
        assignedTo: "Healthcare team"
      },
      {
        id: crypto.randomUUID(),
        title: "Previous follow-up",
        date: dateOffset(-12),
        status: "Completed",
        assignedTo: "Healthcare team"
      },
      {
        id: crypto.randomUUID(),
        title: "Follow-up confirmation",
        date: dateOffset(-2),
        status: "Pending",
        assignedTo: "Healthcare team"
      }
    ],

    checkins: [],

    reminders: [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        message: "Welcome to SWASTHYA SENSE. Your patient portal is ready.",
        channel: "In-app",
        status: "Demo"
      }
    ],

    timeline: [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        title: "Patient portal activated",
        detail: "Your demonstration patient dashboard was opened."
      },
      {
        id: crypto.randomUUID(),
        date: new Date(Date.now() - 86400000).toISOString(),
        title: "Patient account registered",
        detail: "Your synthetic patient account was created."
      }
    ],

    audit: []
  };
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && typeof saved === "object") {
      const identity = getLoginIdentity();

      return {
        ...createInitialData(),
        ...saved,
        appointments: Array.isArray(saved.appointments) ? saved.appointments : [],
        followups: Array.isArray(saved.followups) ? saved.followups : [],
        checkins: Array.isArray(saved.checkins) ? saved.checkins : [],
        reminders: Array.isArray(saved.reminders) ? saved.reminders : [],
        timeline: Array.isArray(saved.timeline) ? saved.timeline : [],
        audit: Array.isArray(saved.audit) ? saved.audit : [],

        // Prefer the name entered during the current login.
        name: identity.name !== "Patient" ? identity.name : (saved.name || "Patient"),
        email: identity.email !== "patient@example.com" ? identity.email : (saved.email || identity.email)
      };
    }
  } catch (error) {
    console.warn("Unable to load saved demo data.", error);
  }

  return createInitialData();
}

appData = loadData();

/* ---------- Utilities ---------- */

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (error) {
    showToast("Could not save data in this browser.");
    console.error(error);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function displayDate(value) {
  if (!value) return "Date not available";

  const date = new Date(value.length === 10 ? value + "T00:00:00" : value);

  if (Number.isNaN(date.getTime())) return escapeHTML(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function displayDateTime(value) {
  if (!value) return "Date not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHTML(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isPast(date) {
  if (!date) return false;

  const deadline = new Date(date + "T23:59:59");
  return !Number.isNaN(deadline.getTime()) && deadline < new Date();
}

function getFollowupStatus(item) {
  if (item.status === "Completed") return "Completed";
  if (item.status === "Reschedule requested") return "Reschedule requested";
  if (isPast(item.date)) return "Overdue";
  return "Pending";
}

function statusClass(status) {
  if (status === "Completed") return "completed";
  if (status === "Overdue") return "overdue";
  if (status === "Cancelled") return "cancelled";
  if (status === "Requested" || status === "Reschedule requested") return "requested";
  return "pending";
}

function addTimeline(title, detail) {
  appData.timeline.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    title,
    detail
  });
}

function addAudit(action, detail) {
  appData.audit.unshift({
    date: new Date().toISOString(),
    action,
    detail
  });
}

/* ---------- Identity ---------- */

function renderIdentity() {
  const name = appData.name || "Patient";
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  if ($("sideName")) $("sideName").textContent = name;
  if ($("topName")) $("topName").textContent = name;
  if ($("welcomeName")) $("welcomeName").textContent = name;

  ["sideAvatar", "topAvatar", "profileAvatar"].forEach(id => {
    if ($(id)) $(id).textContent = initial;
  });

  if ($("profileDisplayName")) $("profileDisplayName").textContent = name;
  if ($("profileName")) $("profileName").value = name;
  if ($("profileEmail")) $("profileEmail").value = appData.email || "";
  if ($("profilePatientId")) $("profilePatientId").value = appData.patientId || "";

  if ($("headerPatientId")) {
    $("headerPatientId").textContent = "Patient ID: " + (appData.patientId || "—");
  }

  if ($("channel")) $("channel").value = appData.channel || "SMS";
  if ($("language")) $("language").value = appData.language || "English";
  if ($("consent")) $("consent").checked = Boolean(appData.consent);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if ($("pageHeading")) {
    $("pageHeading").textContent = `${greeting}, ${name}`;
  }

  if ($("todayLabel")) {
    $("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}

/* ---------- Dashboard statistics ---------- */

function renderMetrics() {
  const completed = appData.followups.filter(
    item => getFollowupStatus(item) === "Completed"
  ).length;

  const overdue = appData.followups.filter(
    item => getFollowupStatus(item) === "Overdue"
  ).length;

  const pending = appData.followups.filter(
    item => !["Completed"].includes(getFollowupStatus(item))
  ).length;

  const total = appData.followups.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const values = {
    metricAppointments: appData.appointments.filter(x => x.status !== "Cancelled").length,
    metricCheckins: appData.checkins.length,
    metricPending: pending,
    metricCompleted: completed,
    followPendingCount: pending - overdue,
    followOverdueCount: overdue,
    followCompletedCount: completed,
    progressPercent: percentage + "%",
    summaryPending: pending + " pending",
    summaryCompleted: completed + " completed"
  };

  Object.entries(values).forEach(([id, value]) => {
    if ($(id)) $(id).textContent = value;
  });

  if ($("progressBar")) $("progressBar").style.width = percentage + "%";

  if ($("progressText")) {
    $("progressText").textContent = `${completed} of ${total} follow-ups completed`;
  }
}

/* ---------- Attention section ---------- */

function renderAttention() {
  const container = $("attentionList");
  if (!container) return;

  const overdue = appData.followups.filter(
    item => getFollowupStatus(item) === "Overdue"
  );

  const pendingRequests = appData.appointments.filter(
    item => item.status === "Requested"
  );

  const items = [];

  overdue.forEach(item => {
    items.push({
      type: "admin",
      title: "Administrative follow-up overdue",
      description: `${item.title} was scheduled for ${displayDate(item.date)}. Please contact your healthcare team to confirm the next step.`,
      date: item.date,
      id: item.id,
      action: "Request reschedule"
    });
  });

  pendingRequests.forEach(item => {
    items.push({
      type: "admin",
      title: "Appointment request awaiting review",
      description: `Your request for ${displayDate(item.date)} has been recorded and is awaiting healthcare team review.`,
      date: item.date,
      id: item.id,
      action: "View appointments"
    });
  });

  if (!items.length) {
    container.innerHTML = `
      <div class="alert-card">
        <div>
          <strong>No pending administrative alerts</strong>
          <p>No overdue follow-ups or appointment requests awaiting review are currently recorded.</p>
        </div>
        <span class="status completed">Up to date</span>
      </div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="alert-card">
      <div>
        <strong>
          <span class="alert-tag admin">FOLLOW-UP</span>
          ${escapeHTML(item.title)}
        </strong>
        <p>${escapeHTML(item.description)}</p>
        <small>Scheduled date: ${displayDate(item.date)}</small>
      </div>
      <div class="alert-action">
        <button class="secondary" data-alert-action="${escapeHTML(item.id)}">
          ${escapeHTML(item.action)}
        </button>
      </div>
    </div>
  `).join("");
}

/* ---------- Appointments ---------- */

function renderAppointments() {
  const appointments = [...appData.appointments]
    .filter(item => item.status !== "Cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));

  const preview = $("appointmentPreview");
  const list = $("appointmentsList");

  const appointmentHTML = item => `
    <div class="item-row">
      <div>
        <strong>${escapeHTML(item.reason)}</strong>
        <small>${displayDate(item.date)}${item.notes ? " · " + escapeHTML(item.notes) : ""}</small>
      </div>
      <div>
        <span class="status ${statusClass(item.status)}">${escapeHTML(item.status)}</span>
        ${item.status !== "Cancelled" ? `
          <button class="small-link" data-cancel-appointment="${escapeHTML(item.id)}">Cancel request</button>
        ` : ""}
      </div>
    </div>`;

  if (preview) {
    preview.innerHTML = appointments.length
      ? appointments.slice(0, 3).map(appointmentHTML).join("")
      : `<p class="empty-state">No appointments recorded yet.</p>`;
  }

  if (list) {
    list.innerHTML = appointments.length
      ? appointments.map(appointmentHTML).join("")
      : `<p class="empty-state">No appointments recorded yet. Use Request appointment to create one.</p>`;
  }
}

/* ---------- Follow-ups ---------- */

function renderFollowups() {
  const container = $("followupsList");
  if (!container) return;

  const items = [...appData.followups].sort((a, b) => a.date.localeCompare(b.date));

  container.innerHTML = items.length ? items.map(item => {
    const status = getFollowupStatus(item);

    return `
      <div class="item-row">
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>Scheduled: ${displayDate(item.date)} · Assigned team: ${escapeHTML(item.assignedTo || "Healthcare team")}</small>
        </div>
        <div>
          <span class="status ${statusClass(status)}">${escapeHTML(status)}</span>
          ${status !== "Completed" ? `
            <button class="small-link" data-reschedule-followup="${escapeHTML(item.id)}">Request change</button>
          ` : ""}
        </div>
      </div>`;
  }).join("") : `<p class="empty-state">No follow-ups have been recorded yet.</p>`;
}

/* ---------- Timeline ---------- */

function getTimelineItems() {
  const events = [...appData.timeline];

  appData.checkins.forEach(item => {
    events.push({
      date: item.date,
      title: "Health check-in submitted",
      detail: `Patient-reported wellbeing: ${item.feeling}`
    });
  });

  appData.appointments.forEach(item => {
    events.push({
      date: item.createdAt || item.date,
      title: "Appointment " + item.status.toLowerCase(),
      detail: item.reason + " · Preferred date: " + displayDate(item.date)
    });
  });

  appData.followups.filter(item => item.status === "Completed").forEach(item => {
    if (item.completedAt) {
      events.push({
        date: item.completedAt,
        title: "Follow-up recorded as completed",
        detail: item.title
      });
    }
  });

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTimeline() {
  const events = getTimelineItems();

  const html = events.length ? events.map(item => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.detail || "")}</p>
      </div>
      <time>${displayDateTime(item.date)}</time>
    </div>
  `).join("") : `<p class="empty-state">Your timeline is empty.</p>`;

  if ($("timelinePreview")) {
    $("timelinePreview").innerHTML = events.slice(0, 5).map(item => `
      <div class="timeline-entry">
        <div class="timeline-dot"></div>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.detail || "")}</p>
        </div>
        <time>${displayDate(item.date)}</time>
      </div>
    `).join("") || `<p class="empty-state">No activity yet.</p>`;
  }

  if ($("fullTimeline")) $("fullTimeline").innerHTML = html;
}

/* ---------- Reminders ---------- */

function renderReminders() {
  const reminders = appData.reminders;

  const html = reminders.length ? reminders.map(item => `
    <div class="item-row">
      <div>
        <strong>${escapeHTML(item.message)}</strong>
        <small>${displayDateTime(item.date)} · ${escapeHTML(item.channel)}</small>
      </div>
      <span class="status requested">${escapeHTML(item.status)}</span>
    </div>
  `).join("") : `<p class="empty-state">No reminders have been recorded.</p>`;

  if ($("remindersList")) $("remindersList").innerHTML = html;

  if ($("reminderPreview")) {
    $("reminderPreview").innerHTML = reminders.slice(0, 3).map(item => `
      <div class="item-row">
        <div>
          <strong>${escapeHTML(item.message)}</strong>
          <small>${displayDate(item.date)} · ${escapeHTML(item.channel)}</small>
        </div>
        <span class="status requested">${escapeHTML(item.status)}</span>
      </div>
    `).join("") || `<p class="empty-state">No reminders yet.</p>`;
  }
}

/* ---------- Check-in history ---------- */

function renderCheckinHistory() {
  const container = $("checkinHistory");
  if (!container) return;

  container.innerHTML = appData.checkins.length
    ? appData.checkins.map(item => `
      <div class="item-row">
        <div>
          <strong>${escapeHTML(item.feeling)}</strong>
          <small>${displayDateTime(item.date)} · Patient-reported</small>
          <small>${item.symptoms ? "Concern: " + escapeHTML(item.symptoms) : "No additional concern entered."}</small>
        </div>
        <span class="status requested">Submitted</span>
      </div>
    `).join("")
    : `<p class="empty-state">You have not submitted a check-in yet.</p>`;
}

/* ---------- Personal summary ---------- */

function renderPersonalBrief() {
  const container = $("personalBrief");
  if (!container) return;

  const pending = appData.followups.filter(
    item => getFollowupStatus(item) !== "Completed"
  ).length;

  const overdue = appData.followups.filter(
    item => getFollowupStatus(item) === "Overdue"
  ).length;

  const checkins = appData.checkins.length;

  container.textContent =
    `Your account has ${checkins} submitted check-in(s), ${pending} follow-up item(s) awaiting completion, and ${overdue} overdue follow-up item(s). ` +
    (overdue
      ? "Please contact your healthcare team to discuss the overdue follow-up."
      : "There are no overdue follow-ups recorded at this time.") +
    " This summary describes administrative records only.";
}

/* ---------- Render everything ---------- */

function renderAll() {
  renderIdentity();
  renderMetrics();
  renderAttention();
  renderAppointments();
  renderFollowups();
  renderTimeline();
  renderReminders();
  renderCheckinHistory();
  renderPersonalBrief();
}

/* ---------- Page navigation ---------- */

const pageHeadings = {
  dashboard: ["Dashboard", "Here's your personal health and follow-up overview"],
  checkin: ["Health check-in", "Share an update with your healthcare team"],
  appointments: ["My appointments", "Your scheduled visits and appointment requests"],
  followups: ["My follow-ups", "Track your follow-up schedule"],
  timeline: ["My health timeline", "Your chronological care journey"],
  reminders: ["Reminders", "Your communication and reminder history"],
  profile: ["My profile", "Your patient account details"]
};

function openPage(pageId) {
  const page = $(pageId);
  if (!page) return;

  document.querySelectorAll(".page").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));

  page.classList.add("active");

  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add("active");

  const heading = pageHeadings[pageId];

  if (heading) {
    if ($("pageHeading")) $("pageHeading").textContent = heading[0] + (pageId === "dashboard" ? "" : "");
    if ($("pageSubheading")) $("pageSubheading").textContent = heading[1];
  }

  $("sidebar")?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => openPage(button.dataset.page));
});

document.querySelectorAll("[data-open-page]").forEach(button => {
  button.addEventListener("click", () => openPage(button.dataset.openPage));
});

$("mobileMenu")?.addEventListener("click", () => {
  $("sidebar")?.classList.toggle("open");
});

$("notificationBtn")?.addEventListener("click", () => openPage("reminders"));

/* ---------- Submit health check-in ---------- */

$("checkinForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const feeling = $("feeling")?.value || "";
  const bp = $("bp")?.value.trim() || "";
  const pulse = $("pulse")?.value || "";
  const temperature = $("temperature")?.value || "";
  const weight = $("weight")?.value || "";

  if (!feeling) {
    showToast("Please select your overall wellbeing.");
    return;
  }

  if (bp && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(bp)) {
    showToast("Enter blood pressure in the format 120/80.");
    return;
  }

  if (pulse && (+pulse < 1 || +pulse > 250)) {
    showToast("Please check the pulse value.");
    return;
  }

  if (temperature && (+temperature < 30 || +temperature > 45)) {
    showToast("Please check the temperature value.");
    return;
  }

  if (weight && (+weight < 1 || +weight > 500)) {
    showToast("Please check the weight value.");
    return;
  }

  const record = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    feeling,
    symptoms: $("symptoms")?.value.trim() || "",
    bp,
    pulse,
    temperature,
    weight,
    notes: $("checkinNotes")?.value.trim() || "",
    source: "Patient-reported"
  };

  appData.checkins.unshift(record);

  addTimeline(
    "Health check-in submitted",
    "Patient-reported wellbeing: " + feeling
  );

  addAudit("Check-in submitted", "Patient submitted a new check-in.");

  saveData();
  renderAll();

  event.target.reset();

  if ($("checkinFeedback")) {
    $("checkinFeedback").textContent = "Your check-in has been saved successfully in this demo.";
  }

  showToast("Health check-in submitted.");
});

/* ---------- Appointment request modal ---------- */

function showAppointmentModal() {
  const modal = $("appointmentModal");
  if (!modal) return;

  if ($("appointmentDate")) {
    $("appointmentDate").min = dateOffset(0);
  }

  modal.hidden = false;
}

function closeAppointmentModal() {
  if ($("appointmentModal")) $("appointmentModal").hidden = true;
}

$("newAppointmentBtn")?.addEventListener("click", showAppointmentModal);
$("closeModal")?.addEventListener("click", closeAppointmentModal);

$("appointmentModal")?.addEventListener("click", event => {
  if (event.target === $("appointmentModal")) closeAppointmentModal();
});

$("appointmentForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const date = $("appointmentDate")?.value;
  const reason = $("appointmentReason")?.value;
  const notes = $("appointmentNotes")?.value.trim() || "";

  if (!date || !reason) {
    showToast("Please complete the appointment request.");
    return;
  }

  if (date < dateOffset(0)) {
    showToast("Please choose today or a future date.");
    return;
  }

  const item = {
    id: crypto.randomUUID(),
    date,
    reason,
    notes,
    status: "Requested",
    createdAt: new Date().toISOString()
  };

  appData.appointments.unshift(item);

  addTimeline("Appointment request submitted", reason);
  addAudit("Appointment requested", reason);

  saveData();
  renderAll();

  event.target.reset();
  closeAppointmentModal();
  showToast("Appointment request saved for review.");
});

/* ---------- Appointment cancellation ---------- */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-cancel-appointment]");
  if (!button) return;

  const id = button.dataset.cancelAppointment;
  const appointment = appData.appointments.find(item => item.id === id);

  if (!appointment) return;

  if (!confirm("Cancel this appointment request in the demo?")) return;

  appointment.status = "Cancelled";

  addTimeline("Appointment cancelled", appointment.reason);
  addAudit("Appointment cancelled", appointment.reason);

  saveData();
  renderAll();
  showToast("Appointment request cancelled.");
});

/* ---------- Follow-up reschedule request ---------- */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-reschedule-followup]");
  if (!button) return;

  const item = appData.followups.find(
    followup => followup.id === button.dataset.rescheduleFollowup
  );

  if (!item) return;

  const newDate = prompt(
    "Enter your preferred new follow-up date (YYYY-MM-DD):",
    dateOffset(7)
  );

  if (!newDate) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || newDate < dateOffset(0)) {
    showToast("Please enter a valid future date in YYYY-MM-DD format.");
    return;
  }

  // A patient request does not directly change the official schedule.
  // It is recorded for healthcare team review.
  item.requestedDate = newDate;
  item.status = "Reschedule requested";

  addTimeline(
    "Follow-up reschedule requested",
    `Requested preferred date: ${displayDate(newDate)}. Awaiting healthcare team review.`
  );

  addAudit("Follow-up change requested", item.title);

  saveData();
  renderAll();
  showToast("Your reschedule request has been recorded.");
});

/* ---------- Attention action ---------- */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-alert-action]");
  if (!button) return;

  const id = button.dataset.alertAction;
  const followup = appData.followups.find(item => item.id === id);

  if (followup) {
    openPage("followups");
    showToast("You can request a follow-up date change here.");
    return;
  }

  openPage("appointments");
});

/* ---------- Communication preferences ---------- */

$("preferencesForm")?.addEventListener("submit", event => {
  event.preventDefault();

  appData.channel = $("channel")?.value || "SMS";
  appData.language = $("language")?.value || "English";
  appData.consent = Boolean($("consent")?.checked);

  addTimeline(
    "Communication preferences updated",
    `${appData.channel} · ${appData.language} · Reminder consent: ${appData.consent ? "Yes" : "No"}`
  );

  addAudit("Communication preferences updated", appData.channel);

  saveData();
  renderAll();

  if ($("preferencesFeedback")) {
    $("preferencesFeedback").textContent = "Your communication preferences have been saved.";
  }

  showToast("Preferences saved.");
});

/* ---------- Simulated reminders ---------- */

$("simulateReminderBtn")?.addEventListener("click", () => {
  if (!appData.consent) {
    showToast("Please enable reminder consent before simulating a reminder.");
    return;
  }

  const message = {
    English: "SWASTHYA SENSE: This is a demonstration follow-up reminder. Please review your scheduled care activity.",
    Hindi: "SWASTHYA SENSE: यह एक डेमो फॉलो-अप रिमाइंडर है। कृपया अपनी निर्धारित देखभाल गतिविधि देखें।",
    Assamese: "SWASTHYA SENSE: এইটো এটা ডেমো ফ'ল'-আপ সোঁৱৰনী। অনুগ্ৰহ কৰি আপোনাৰ নিৰ্ধাৰিত যত্নৰ তথ্য চাওক।"
  };

  appData.reminders.unshift({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    message: message[appData.language] || message.English,
    channel: appData.channel,
    status: "Simulated"
  });

  addTimeline("Reminder simulated", `A demo ${appData.channel} reminder was created.`);

  addAudit("Reminder simulated", appData.channel);

  saveData();
  renderAll();

  showToast("Demo reminder created. No SMS or WhatsApp message was sent.");
});

/* ---------- Profile editing ---------- */

$("profileForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("profileName")?.value.trim();
  const email = $("profileEmail")?.value.trim();

  if (!name || !email) {
    showToast("Please enter your name and email.");
    return;
  }

  appData.name = name;
  appData.email = email;

  // Keep the login identity in sync for the next dashboard visit.
  localStorage.setItem("userName", name);
  localStorage.setItem("userEmail", email);

  addTimeline("Patient profile updated", "Basic profile information was updated.");
  addAudit("Profile updated", "Patient updated their name or email.");

  saveData();
  renderAll();

  if ($("profileFeedback")) {
    $("profileFeedback").textContent = "Your profile has been updated.";
  }

  showToast("Profile updated.");
});

/* ---------- Export patient demo records ---------- */

$("exportBtn")?.addEventListener("click", () => {
  const exportData = {
    product: "SWASTHYA SENSE",
    exportType: "Synthetic patient demonstration data",
    exportedAt: new Date().toISOString(),
    patient: {
      patientId: appData.patientId,
      name: appData.name,
      email: appData.email
    },
    appointments: appData.appointments,
    followups: appData.followups,
    checkins: appData.checkins,
    reminders: appData.reminders,
    timeline: getTimelineItems()
  };

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "swasthya-sense-patient-demo.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  showToast("Your demo records have been exported.");
});

/* ---------- Logout ---------- */

$("logoutBtn")?.addEventListener("click", () => {
  if (!confirm("Are you sure you want to log out?")) return;

  // Keep the saved demo records, but clear the login identity.
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  window.location.href = "index.html";
});

/* ---------- Start dashboard ---------- */

saveData();
renderAll();
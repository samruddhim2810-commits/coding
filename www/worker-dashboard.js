
document.addEventListener("DOMContentLoaded", function () {

    // Get worker name from login
    const user = JSON.parse(localStorage.getItem("swasthyaUser") || "{}");
    const workerName = user.name || user.fullName || "Healthcare Worker";

    document.getElementById("workerName").textContent = workerName;
    document.getElementById("topWorkerName").textContent = workerName;

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric",
            month: "long", year: "numeric"
        });

    // DEMO DATA ONLY - replace with your backend later
    let patients = JSON.parse(localStorage.getItem("ssWorkerPatients")) || [
        { name: "Aarav Sharma", id: "SS1001", last: "28 Oct 2026", next: "02 Nov 2026", status: "Upcoming" },
        { name: "Priya Das", id: "SS1002", last: "20 Oct 2026", next: "27 Oct 2026", status: "Overdue" },
        { name: "Rohan Mehta", id: "SS1003", last: "29 Oct 2026", next: "05 Nov 2026", status: "Upcoming" },
        { name: "Ananya Roy", id: "SS1004", last: "25 Oct 2026", next: "30 Oct 2026", status: "Upcoming" },
        { name: "Kabir Singh", id: "SS1005", last: "15 Oct 2026", next: "24 Oct 2026", status: "Overdue" }
    ];

    let alerts = [
        { name: "Priya Das", reason: "Scheduled follow-up is overdue.", type: "Administrative follow-up" },
        { name: "Kabir Singh", reason: "A configured symptom response requires clinician review.", type: "Clinical review" }
    ];

    let reminders = JSON.parse(localStorage.getItem("ssReminders")) || [];

    const $ = id => document.getElementById(id);

    function save() {
        localStorage.setItem("ssWorkerPatients", JSON.stringify(patients));
        localStorage.setItem("ssReminders", JSON.stringify(reminders));
    }

    function render() {
        $("totalPatients").textContent = patients.length;
        $("upcomingCount").textContent = patients.filter(p => p.status === "Upcoming").length;
        $("overdueCount").textContent = patients.filter(p => p.status === "Overdue").length;
        $("clinicalCount").textContent = alerts.filter(a => a.type === "Clinical review").length;

        $("patientTable").innerHTML = patients.map((p, index) => `
            <tr>
                <td class="patient-name">${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.id)}</td>
                <td>${escapeHTML(p.last)}</td>
                <td>${escapeHTML(p.next)}</td>
                <td><span class="status ${p.status}">${p.status}</span></td>
                <td><button class="view-btn" data-view="${index}">View</button></td>
            </tr>
        `).join("");

        $("alertList").innerHTML = alerts.length ? alerts.map(a => `
            <div class="alert-item">
                <div class="alert-symbol"><i class="fa-solid fa-bell"></i></div>
                <div>
                    <strong>${escapeHTML(a.name)} — ${escapeHTML(a.type)}</strong>
                    <p>${escapeHTML(a.reason)}</p>
                </div>
            </div>
        `).join("") : "<p>No pending alerts.</p>";

        const upcoming = patients.filter(p => p.status === "Upcoming");
        $("followupList").innerHTML = upcoming.length ? upcoming.map(p => `
            <div class="followup-item">
                <div class="date-icon"><i class="fa-regular fa-calendar"></i></div>
                <div><strong>${escapeHTML(p.name)}</strong><p>Follow-up: ${escapeHTML(p.next)}</p></div>
            </div>
        `).join("") : "<p>No upcoming follow-ups.</p>";

        $("activityList").innerHTML = patients.slice(-4).reverse().map(p => `
            <div class="activity-item">
                <div class="activity-icon"><i class="fa-solid fa-user-check"></i></div>
                <div><strong>${escapeHTML(p.name)}</strong><p>Patient record available • ${escapeHTML(p.id)}</p></div>
            </div>
        `).join("");

        $("reminderHistory").innerHTML = reminders.length
            ? reminders.map(r => `<p class="activity-item">${escapeHTML(r)}</p>`).join("")
            : "No reminders generated yet.";
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#039;"
        })[char]);
    }

    function openModal(title, fields, callback) {
        $("modalTitle").textContent = title;
        $("modalContent").innerHTML = fields;
        $("modal").classList.add("show");

        $("modalForm").onsubmit = function (event) {
            event.preventDefault();
            callback(new FormData(event.target));
            $("modal").classList.remove("show");
        };
    }

    function form(content, buttonText = "Save") {
        return `<form id="modalForm">${content}<button class="modal-submit">${buttonText}</button></form>`;
    }

    $("closeModal").onclick = () => $("modal").classList.remove("show");

    $("modal").addEventListener("click", e => {
        if (e.target === $("modal")) $("modal").classList.remove("show");
    });

    $("addPatientBtn").onclick = () => openModal(
        "Register New Patient",
        form(`
            <label>Patient Name</label><input name="name" required>
            <label>Patient ID</label><input name="id" placeholder="SS1006" required>
            <label>Next Follow-up</label><input name="next" type="date" required>
        `),
        data => {
            const name = data.get("name").trim();
            const id = data.get("id").trim();
            if (patients.some(p => p.id.toLowerCase() === id.toLowerCase())) {
                alert("Patient ID already exists.");
                return;
            }
            patients.push({
                name, id, last: "Not checked in",
                next: new Date(data.get("next") + "T00:00:00").toLocaleDateString("en-IN"),
                status: "Upcoming"
            });
            save(); render();
        }
    );

    $("checkinBtn").onclick = () => openModal(
        "Record Patient Check-in",
        form(`
            <label>Patient</label>
            <select name="index" required>
                ${patients.map((p, i) => `<option value="${i}">${escapeHTML(p.name)}</option>`).join("")}
            </select>
            <label>Patient-reported update</label>
            <textarea name="note" required placeholder="Enter reported symptoms or updates"></textarea>
        `),
        data => {
            const p = patients[Number(data.get("index"))];
            if (!p) return;
            p.last = new Date().toLocaleDateString("en-IN");
            alerts.push({
                name: p.name,
                reason: "New patient-reported check-in recorded. Review the submitted information.",
                type: "Check-in recorded"
            });
            reminders.push("Check-in recorded for " + p.name);
            save(); render();
            alert("Check-in saved in this browser demo.");
        }
    );

    $("scheduleBtn").onclick = () => openModal(
        "Schedule Follow-up",
        form(`
            <label>Patient</label>
            <select name="index">${patients.map((p,i) => `<option value="${i}">${escapeHTML(p.name)}</option>`).join("")}</select>
            <label>Follow-up Date</label><input name="date" type="date" required>
        `),
        data => {
            const p = patients[Number(data.get("index"))];
            if (!p) return;
            const date = new Date(data.get("date") + "T00:00:00");
            p.next = date.toLocaleDateString("en-IN");
            p.status = date < new Date(new Date().setHours(0,0,0,0)) ? "Overdue" : "Upcoming";
            save(); render();
        }
    );

    $("reminderBtn").onclick = () => openModal(
        "Generate Reminder",
        form(`
            <label>Patient</label>
            <select name="index">${patients.map((p,i) => `<option value="${i}">${escapeHTML(p.name)}</option>`).join("")}</select>
            <label>Channel</label>
            <select name="channel"><option>SMS (simulated)</option><option>WhatsApp (simulated)</option></select>
        `),
        data => {
            const p = patients[Number(data.get("index"))];
            if (!p) return;
            reminders.unshift(
                `${data.get("channel")} reminder prepared for ${p.name} — ${new Date().toLocaleString("en-IN")}`
            );
            save(); render();
            alert("Demo reminder generated. No real message was sent.");
        }
    );

    $("patientTable").addEventListener("click", e => {
        const button = e.target.closest("[data-view]");
        if (!button) return;
        const p = patients[Number(button.dataset.view)];
        if (!p) return;

        openModal("Patient Profile", `
            <p><strong>Name:</strong> ${escapeHTML(p.name)}</p>
            <p><strong>Patient ID:</strong> ${escapeHTML(p.id)}</p>
            <p><strong>Last Check-in:</strong> ${escapeHTML(p.last)}</p>
            <p><strong>Next Follow-up:</strong> ${escapeHTML(p.next)}</p>
            <p><strong>Follow-up Status:</strong> ${escapeHTML(p.status)}</p>
            <p class="reminder-note">Synthetic demonstration record. Patient information has not been verified.</p>
            <button type="button" class="modal-submit" id="completeFollowup">Mark Follow-up Completed</button>
        `, () => {});

        $("completeFollowup").onclick = () => {
            p.status = "Completed";
            $("modal").classList.remove("show");
            save(); render();
        };
    });

    $("patientSearch").addEventListener("input", filterPatients);
    $("statusFilter").addEventListener("change", filterPatients);

    function filterPatients() {
        const query = $("patientSearch").value.toLowerCase();
        const status = $("statusFilter").value;

        document.querySelectorAll("#patientTable tr").forEach(row => {
            const matchesText = row.textContent.toLowerCase().includes(query);
            const matchesStatus = status === "all" || row.textContent.includes(status);
            row.style.display = matchesText && matchesStatus ? "" : "none";
        });
    }

    $("exportBtn").onclick = () => {
        const csv = [
            ["Name", "Patient ID", "Last Check-in", "Next Follow-up", "Status"],
            ...patients.map(p => [p.name, p.id, p.last, p.next, p.status])
        ].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "swasthya-patients-demo.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    $("notificationBtn").onclick = () => {
        alert(`${alerts.length} demonstration attention alerts are currently listed.`);
    };

    $("logoutBtn").onclick = () => {
        if (!confirm("Are you sure you want to logout?")) return;
        localStorage.removeItem("swasthyaUser");
        window.location.href = "index.html";
    };

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
            link.classList.add("active");
        });
    });

    // Initial render
    render();
});
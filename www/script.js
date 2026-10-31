
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // SWASTHYA SENSE AUTHENTICATION SYSTEM
    // =====================================

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    const goLogin = document.getElementById("goLogin");
    const goSignup = document.getElementById("goSignup");

    const signupMessage = document.getElementById("signupMessage");
    const loginMessage = document.getElementById("loginMessage");

    let signupRole = "patient";
    let loginRole = "patient";

    // =====================================
    // DASHBOARD ROUTES
    // =====================================

    const dashboardRoutes = {
        patient: "patient-dashboard.html",
        doctor: "doctor-dashboard.html",
        worker: "worker-dashboard.html"
    };

    // =====================================
    // SHOW LOGIN / SIGNUP
    // =====================================

    function showLogin() {
        if (signupForm) signupForm.classList.add("hidden");
        if (loginForm) loginForm.classList.remove("hidden");

        loginTab?.classList.add("active");
        signupTab?.classList.remove("active");

        clearMessages();
    }

    function showSignup() {
        if (loginForm) loginForm.classList.add("hidden");
        if (signupForm) signupForm.classList.remove("hidden");

        signupTab?.classList.add("active");
        loginTab?.classList.remove("active");

        clearMessages();
    }

    loginTab?.addEventListener("click", showLogin);
    signupTab?.addEventListener("click", showSignup);
    goLogin?.addEventListener("click", e => {
        e.preventDefault();
        showLogin();
    });

    goSignup?.addEventListener("click", e => {
        e.preventDefault();
        showSignup();
    });

    // =====================================
    // ROLE SELECTION - SIGNUP
    // =====================================

    const signupRoleCards = document.querySelectorAll(
        "[data-signup-role]"
    );

    signupRoleCards.forEach(card => {

        function selectRole() {
            signupRole = card.dataset.signupRole;

            signupRoleCards.forEach(c => {
                c.classList.remove("selected");
                c.setAttribute("aria-pressed", "false");
            });

            card.classList.add("selected");
            card.setAttribute("aria-pressed", "true");

            const radio = card.querySelector('input[name="role"]');
            if (radio) radio.checked = true;

            updateSignupFields();
        }

        card.addEventListener("click", selectRole);

        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectRole();
            }
        });
    });

    // =====================================
    // ROLE SELECTION - LOGIN
    // =====================================

    const loginRoleCards = document.querySelectorAll(
        "[data-login-role]"
    );

    loginRoleCards.forEach(card => {

        function selectRole() {
            loginRole = card.dataset.loginRole;

            loginRoleCards.forEach(c => {
                c.classList.remove("selected");
                c.setAttribute("aria-pressed", "false");
            });

            card.classList.add("selected");
            card.setAttribute("aria-pressed", "true");
        }

        card.addEventListener("click", selectRole);

        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectRole();
            }
        });
    });

    // =====================================
    // SHOW ROLE-SPECIFIC SIGNUP FIELDS
    // =====================================

    function updateSignupFields() {

        const patientFields = document.getElementById("patientFields");
        const doctorFields = document.getElementById("doctorFields");
        const workerFields = document.getElementById("workerFields");

        if (patientFields) {
            patientFields.classList.toggle(
                "hidden", signupRole !== "patient"
            );
        }

        if (doctorFields) {
            doctorFields.classList.toggle(
                "hidden", signupRole !== "doctor"
            );
        }

        if (workerFields) {
            workerFields.classList.toggle(
                "hidden", signupRole !== "worker"
            );
        }

        // Update required fields
        setRequired(patientFields, signupRole === "patient");
        setRequired(doctorFields, signupRole === "doctor");
        setRequired(workerFields, signupRole === "worker");
    }

    function setRequired(container, required) {
        if (!container) return;

        container.querySelectorAll("input, select").forEach(field => {
            field.required = required;
        });
    }

    // =====================================
    // MESSAGE DISPLAY
    // =====================================

    function showMessage(element, message, success = false) {
        if (!element) return;

        element.textContent = message;
        element.style.color = success ? "#16865c" : "#d64545";
    }

    function clearMessages() {
        if (signupMessage) signupMessage.textContent = "";
        if (loginMessage) loginMessage.textContent = "";
    }

    // =====================================
    // STORAGE
    // DEMO ONLY - NOT SECURE FOR REAL USERS
    // =====================================

    function getUsers() {
        try {
            return JSON.parse(
                localStorage.getItem("swasthyaUsers")
            ) || [];
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(
            "swasthyaUsers",
            JSON.stringify(users)
        );
    }

    // =====================================
    // SIGNUP
    // =====================================

    signupForm?.addEventListener("submit", function(e) {

        e.preventDefault();

        const name = document.getElementById("fullName")?.value.trim();
        const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
        const phone = document.getElementById("phone")?.value.trim();

        const password = document.getElementById("signupPassword")?.value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;

        if (!name || !email || !phone || !password) {
            showMessage(signupMessage, "Please fill in all required fields.");
            return;
        }

        if (password.length < 8) {
            showMessage(signupMessage, "Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(signupMessage, "Passwords do not match.");
            return;
        }

        if (!document.getElementById("terms")?.checked) {
            showMessage(signupMessage, "Please accept the terms and conditions.");
            return;
        }

        const users = getUsers();

        if (users.some(user => user.email === email)) {
            showMessage(signupMessage, "This email is already registered. Please sign in.");
            return;
        }

        // Role-specific details
        let extraDetails = {};

        if (signupRole === "patient") {

            extraDetails.dob =
                document.getElementById("dob")?.value || "";

            extraDetails.gender =
                document.getElementById("gender")?.value || "";

        } else if (signupRole === "doctor") {

            extraDetails.professionalType =
                document.getElementById("professionalType")?.value || "";

            extraDetails.hospital =
                document.getElementById("hospital")?.value.trim() || "";

            extraDetails.license =
                document.getElementById("license")?.value.trim() || "";

            if (!extraDetails.professionalType ||
                !extraDetails.hospital ||
                !extraDetails.license) {
                showMessage(signupMessage, "Complete all professional verification fields.");
                return;
            }

        } else if (signupRole === "worker") {

            extraDetails.workerType =
                document.getElementById("staffType")?.value || "";

            extraDetails.hospital =
                document.getElementById("workerHospital")?.value.trim() || "";

            extraDetails.staffId =
                document.getElementById("staffId")?.value.trim() || "";

            if (!extraDetails.workerType ||
                !extraDetails.hospital ||
                !extraDetails.staffId) {
                showMessage(signupMessage, "Complete all healthcare worker fields.");
                return;
            }
        }

        // Demo account record
        const newUser = {
            id: "SS-" + Date.now(),
            name,
            email,
            phone,
            role: signupRole,
            password,
            details: extraDetails,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        showMessage(
            signupMessage,
            "Registration successful! Please sign in.",
            true
        );

        signupForm.reset();

        setTimeout(() => {
            showLogin();

            const loginEmail = document.getElementById("loginEmail");
            if (loginEmail) loginEmail.value = email;

            loginRole = signupRole;

            loginRoleCards.forEach(card => {
                const selected = card.dataset.loginRole === loginRole;
                card.classList.toggle("selected", selected);
                card.setAttribute("aria-pressed", String(selected));
            });

        }, 1000);
    });

    // =====================================
    // LOGIN
    // =====================================

    loginForm?.addEventListener("submit", function(e) {

        e.preventDefault();

        const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
        const password = document.getElementById("loginPassword")?.value;

        const users = getUsers();

        const user = users.find(account =>
            account.email === email &&
            account.password === password &&
            account.role === loginRole
        );

        if (!user) {
            showMessage(
                loginMessage,
                "Invalid email, password or selected account type."
            );
            return;
        }

        // Store active demo session
        sessionStorage.setItem(
            "swasthyaCurrentUser",
            JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                details: user.details
            })
        );

        showMessage(loginMessage, "Login successful!", true);

        setTimeout(() => {
            window.location.href = dashboardRoutes[user.role];
        }, 500);
    });

    // =====================================
    // FORGOT PASSWORD - DEMO
    // =====================================

    document.getElementById("forgotPassword")?.addEventListener("click", e => {
        e.preventDefault();
        alert("For the demo, please contact the administrator to reset your password. Connect a secure password-reset service for production.");
    });

    // =====================================
    // PASSWORD SHOW / HIDE
    // =====================================

    document.querySelectorAll(".eye-icon").forEach(icon => {

        icon.addEventListener("click", () => {

            const target = document.getElementById(
                icon.dataset.target
            );

            if (!target) return;

            target.type =
                target.type === "password" ? "text" : "password";

            icon.classList.toggle("fa-eye");
            icon.classList.toggle("fa-eye-slash");
        });
    });

    // =====================================
    // INITIAL SETUP
    // =====================================

    updateSignupFields();
    showLogin();

});


// =========================================
// DASHBOARD FUNCTIONS
// Include this script in all 3 dashboards
// =========================================

function loadSwasthyaDashboard() {

    let user;

    try {
        user = JSON.parse(
            sessionStorage.getItem("swasthyaCurrentUser")
        );
    } catch {
        user = null;
    }

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const expectedPage = {
        patient: "patient-dashboard.html",
        doctor: "doctor-dashboard.html",
        worker: "worker-dashboard.html"
    };

    const currentPage = window.location.pathname.split("/").pop();

    if (expectedPage[user.role] !== currentPage) {
        window.location.href = expectedPage[user.role];
        return;
    }

    // Display logged-in user's name
    document.querySelectorAll("[data-user-name]").forEach(element => {
        element.textContent = user.name;
    });

    // Display email
    document.querySelectorAll("[data-user-email]").forEach(element => {
        element.textContent = user.email;
    });

    // Logout
    document.querySelectorAll("[data-logout]").forEach(button => {
        button.addEventListener("click", () => {
            sessionStorage.removeItem("swasthyaCurrentUser");
            window.location.href = "index.html";
        });
    });

}

document.addEventListener("DOMContentLoaded", () => {
    if (
        document.body.dataset.dashboard === "patient" ||
        document.body.dataset.dashboard === "doctor" ||
        document.body.dataset.dashboard === "worker"
    ) {
        loadSwasthyaDashboard();
    }
});




// Get saved language or default English


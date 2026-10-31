
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
        "[data-role]"
    );

    signupRoleCards.forEach(card => {

        function selectRole() {
            signupRole = card.dataset.role;

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
                document.getElementById("workerType")?.value || "";

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

const translations = {
    en: {
        dashboard: "Dashboard",
        home: "Home",
        profile: "My Profile",
        appointments: "Appointments",
        healthRecords: "Health Records",
        checkin: "Health Check-in",
        followup: "Follow-up",
        reminders: "Reminders",
        notifications: "Notifications",
        settings: "Settings",
        logout: "Logout",
        welcome: "Welcome",
        patient: "Patient",
        doctor: "Doctor",
        healthStatus: "Health Status",
        upcomingAppointments: "Upcoming Appointments",
        completedAppointments: "Completed Appointments",
        pendingFollowups: "Pending Follow-ups",
        overdueFollowups: "Overdue Follow-ups",
        clinicalAlerts: "Clinical Alerts",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save Changes",
        search: "Search",
        language: "Select Language",
        symptoms: "Report Symptoms",
        measurements: "Health Measurements",
        history: "Health History",
        contact: "Contact Healthcare Team",
        noData: "No records available",
        patientAttention: "Patient Attention Engine",
        referral: "Referrals",
        timeline: "Patient Timeline"
    },

    hi: {
        dashboard: "डैशबोर्ड",
        home: "होम",
        profile: "मेरी प्रोफ़ाइल",
        appointments: "अपॉइंटमेंट",
        healthRecords: "स्वास्थ्य रिकॉर्ड",
        checkin: "स्वास्थ्य जांच",
        followup: "फॉलो-अप",
        reminders: "रिमाइंडर",
        notifications: "सूचनाएं",
        settings: "सेटिंग्स",
        logout: "लॉग आउट",
        welcome: "स्वागत है",
        patient: "मरीज",
        doctor: "डॉक्टर",
        healthStatus: "स्वास्थ्य स्थिति",
        upcomingAppointments: "आगामी अपॉइंटमेंट",
        completedAppointments: "पूर्ण अपॉइंटमेंट",
        pendingFollowups: "लंबित फॉलो-अप",
        overdueFollowups: "समय से लंबित फॉलो-अप",
        clinicalAlerts: "चिकित्सकीय अलर्ट",
        submit: "जमा करें",
        cancel: "रद्द करें",
        save: "बदलाव सहेजें",
        search: "खोजें",
        language: "भाषा चुनें",
        symptoms: "लक्षण बताएं",
        measurements: "स्वास्थ्य माप",
        history: "स्वास्थ्य इतिहास",
        contact: "स्वास्थ्य टीम से संपर्क करें",
        noData: "कोई रिकॉर्ड उपलब्ध नहीं",
        patientAttention: "रोगी ध्यान प्रणाली",
        referral: "रेफरल",
        timeline: "रोगी की समयरेखा"
    },

    mr: {
        dashboard: "डॅशबोर्ड",
        home: "मुख्यपृष्ठ",
        profile: "माझे प्रोफाइल",
        appointments: "अपॉइंटमेंट",
        healthRecords: "आरोग्य नोंदी",
        checkin: "आरोग्य तपासणी",
        followup: "फॉलो-अप",
        reminders: "स्मरणपत्रे",
        notifications: "सूचना",
        settings: "सेटिंग्ज",
        logout: "लॉग आउट",
        welcome: "स्वागत आहे",
        patient: "रुग्ण",
        doctor: "डॉक्टर",
        healthStatus: "आरोग्य स्थिती",
        upcomingAppointments: "आगामी अपॉइंटमेंट",
        completedAppointments: "पूर्ण झालेल्या अपॉइंटमेंट",
        pendingFollowups: "प्रलंबित फॉलो-अप",
        overdueFollowups: "मुदत संपलेले फॉलो-अप",
        clinicalAlerts: "वैद्यकीय सूचना",
        submit: "सबमिट करा",
        cancel: "रद्द करा",
        save: "बदल जतन करा",
        search: "शोधा",
        language: "भाषा निवडा",
        symptoms: "लक्षणे नोंदवा",
        measurements: "आरोग्य मोजमाप",
        history: "आरोग्य इतिहास",
        contact: "आरोग्य टीमशी संपर्क साधा",
        noData: "कोणतीही नोंद उपलब्ध नाही",
        patientAttention: "रुग्ण लक्ष प्रणाली",
        referral: "रेफरल",
        timeline: "रुग्णाची कालरेषा"
    },

    as: {
        dashboard: "ডেশ্বব'ৰ্ড",
        home: "ঘৰ",
        profile: "মোৰ প্ৰ'ফাইল",
        appointments: "এপইণ্টমেণ্ট",
        healthRecords: "স্বাস্থ্যৰ তথ্য",
        checkin: "স্বাস্থ্য পৰীক্ষা",
        followup: "ফ'ল'-আপ",
        reminders: "সোঁৱৰাই দিয়া",
        notifications: "জাননী",
        settings: "ছেটিংছ",
        logout: "লগ আউট",
        welcome: "স্বাগতম",
        patient: "ৰোগী",
        doctor: "চিকিৎসক",
        healthStatus: "স্বাস্থ্যৰ অৱস্থা",
        upcomingAppointments: "আগন্তুক এপইণ্টমেণ্ট",
        completedAppointments: "সম্পূৰ্ণ হোৱা এপইণ্টমেণ্ট",
        pendingFollowups: "বাকী থকা ফ'ল'-আপ",
        overdueFollowups: "সময় পাৰ হোৱা ফ'ল'-আপ",
        clinicalAlerts: "চিকিৎসা সম্পৰ্কীয় সতৰ্কবাণী",
        submit: "দাখিল কৰক",
        cancel: "বাতিল কৰক",
        save: "পৰিৱৰ্তন সংৰক্ষণ কৰক",
        search: "সন্ধান কৰক",
        language: "ভাষা বাছনি কৰক",
        symptoms: "লক্ষণসমূহ জনাওক",
        measurements: "স্বাস্থ্যৰ পৰিমাপ",
        history: "স্বাস্থ্যৰ ইতিহাস",
        contact: "স্বাস্থ্য সেৱা দলৰ সৈতে যোগাযোগ কৰক",
        noData: "কোনো তথ্য উপলব্ধ নাই",
        patientAttention: "ৰোগীৰ প্ৰতি মনোযোগ ব্যৱস্থা",
        referral: "ৰেফাৰেল",
        timeline: "ৰোগীৰ সময়ৰেখা"
    },

    bn: {
        dashboard: "ড্যাশবোর্ড",
        home: "হোম",
        profile: "আমার প্রোফাইল",
        appointments: "অ্যাপয়েন্টমেন্ট",
        healthRecords: "স্বাস্থ্য রেকর্ড",
        checkin: "স্বাস্থ্য পরীক্ষা",
        followup: "ফলো-আপ",
        reminders: "রিমাইন্ডার",
        notifications: "বিজ্ঞপ্তি",
        settings: "সেটিংস",
        logout: "লগ আউট",
        welcome: "স্বাগতম",
        patient: "রোগী",
        doctor: "ডাক্তার",
        healthStatus: "স্বাস্থ্যের অবস্থা",
        upcomingAppointments: "আসন্ন অ্যাপয়েন্টমেন্ট",
        completedAppointments: "সম্পন্ন অ্যাপয়েন্টমেন্ট",
        pendingFollowups: "বাকি ফলো-আপ",
        overdueFollowups: "সময় পেরিয়ে যাওয়া ফলো-আপ",
        clinicalAlerts: "চিকিৎসা সংক্রান্ত সতর্কতা",
        submit: "জমা দিন",
        cancel: "বাতিল করুন",
        save: "পরিবর্তন সংরক্ষণ করুন",
        search: "অনুসন্ধান করুন",
        language: "ভাষা নির্বাচন করুন",
        symptoms: "উপসর্গ জানান",
        measurements: "স্বাস্থ্য পরিমাপ",
        history: "স্বাস্থ্য ইতিহাস",
        contact: "স্বাস্থ্যসেবা দলের সঙ্গে যোগাযোগ করুন",
        noData: "কোনো তথ্য উপলব্ধ নেই",
        patientAttention: "রোগীর প্রতি নজরদারি ব্যবস্থা",
        referral: "রেফারেল",
        timeline: "রোগীর সময়রেখা"
    }
};


// Get saved language or default English
let currentLanguage =
    localStorage.getItem("swasthyaLanguage") || "en";


// Translation function
function t(key) {
    return translations[currentLanguage]?.[key]
        || translations.en[key]
        || key;
}


// Apply translations to page
function applyLanguage() {

    document.documentElement.lang = currentLanguage;

    // Translate normal text
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;

        if (translations[currentLanguage][key]) {
            element.textContent = t(key);
        }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        element.placeholder = t(key);
    });

    // Translate titles
    document.querySelectorAll("[data-i18n-title]").forEach(element => {
        const key = element.dataset.i18nTitle;
        element.title = t(key);
    });

    // Update dropdown
    const selector = document.getElementById("languageSelect");

    if (selector) {
        selector.value = currentLanguage;
    }
}


// Change language
function changeLanguage(language) {

    if (!translations[language]) return;

    currentLanguage = language;

    localStorage.setItem("swasthyaLanguage", language);

    applyLanguage();

    // Notify other app components
    document.dispatchEvent(
        new CustomEvent("languageChanged", {
            detail: { language }
        })
    );
}


// Initialise language system
document.addEventListener("DOMContentLoaded", () => {

    const selector = document.getElementById("languageSelect");

    if (selector) {
        selector.value = currentLanguage;

        selector.addEventListener("change", function () {
            changeLanguage(this.value);
        });
    }

    applyLanguage();
});
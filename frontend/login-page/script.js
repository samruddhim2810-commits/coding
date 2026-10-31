

// =====================================
// SWASTHYA SENSE - FRONTEND JAVASCRIPT
// =====================================

// GET ELEMENTS

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const patientFields = document.getElementById("patientFields");
const doctorFields = document.getElementById("doctorFields");

const heroHeading = document.getElementById("heroHeading");
const heroDescription = document.getElementById("heroDescription");

let selectedSignupRole = "patient";
let selectedLoginRole = "patient";

// =====================================
// SIGN IN / SIGN UP SWITCHING
// =====================================

function showSignup() {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    signupTab.classList.add("active");
    loginTab.classList.remove("active");
}

function showLogin() {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");
}

loginTab.addEventListener("click", showLogin);
signupTab.addEventListener("click", showSignup);

document.getElementById("goLogin").addEventListener("click", function(e) {
    e.preventDefault();
    showLogin();
});

document.getElementById("goSignup").addEventListener("click", function(e) {
    e.preventDefault();
    showSignup();
});

// =====================================
// ROLE SELECTION - SIGN UP
// =====================================

const signupRoleCards = document.querySelectorAll(
    "[data-role]"
);

function updateSignupRole(role) {

    selectedSignupRole = role;

    signupRoleCards.forEach(card => {

        const selected = card.dataset.role === role;

        card.classList.toggle("selected", selected);

        card.setAttribute("aria-pressed", String(selected));

        card.querySelector("input").checked = selected;
    });

    const isPatient = role === "patient";

    patientFields.classList.toggle("hidden", !isPatient);
    doctorFields.classList.toggle("hidden", isPatient);

    document.getElementById("dob").required = isPatient;
    document.getElementById("gender").required = isPatient;

    document.getElementById("professionalType").required = !isPatient;
    document.getElementById("hospital").required = !isPatient;
    document.getElementById("license").required = !isPatient;

    if (isPatient) {

        heroHeading.innerHTML = "Your Health,<br>Our Priority";

        heroDescription.innerHTML =
            "Access quality healthcare,<br>" +
            "manage appointments,<br>" +
            "and stay connected with<br>" +
            "your medical team — anytime,<br>" +
            "anywhere.";

    } else {

        heroHeading.innerHTML = "Care Better,<br>Work Smarter";

        heroDescription.innerHTML =
            "Manage patients,<br>" +
            "access clinical tools,<br>" +
            "and deliver quality healthcare<br>" +
            "with Swasthya Sense.";

    }
}

signupRoleCards.forEach(card => {

    card.addEventListener("click", () => {
        updateSignupRole(card.dataset.role);
    });

    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            updateSignupRole(card.dataset.role);
        }
    });
});

// =====================================
// ROLE SELECTION - SIGN IN
// =====================================

const loginRoleCards = document.querySelectorAll(
    "[data-login-role]"
);

loginRoleCards.forEach(card => {

    card.addEventListener("click", () => {

        selectedLoginRole = card.dataset.loginRole;

        loginRoleCards.forEach(item => {

            const selected =
                item.dataset.loginRole === selectedLoginRole;

            item.classList.toggle("selected", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

    });

    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            card.click();
        }
    });
});

// =====================================
// PASSWORD VISIBILITY
// =====================================

document.querySelectorAll(".eye-icon").forEach(icon => {

    icon.addEventListener("click", () => {

        const target = document.getElementById(
            icon.dataset.target
        );

        const isPassword = target.type === "password";

        target.type = isPassword ? "text" : "password";

        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);

    });

});

// =====================================
// MESSAGE DISPLAY
// =====================================

function showMessage(elementId, text, type) {

    const element = document.getElementById(elementId);

    element.textContent = text;
    element.className = "message " + type;

}

function clearMessage(elementId) {

    const element = document.getElementById(elementId);

    element.textContent = "";
    element.className = "message";

}

// =====================================
// SIGN UP FORM VALIDATION
// =====================================

signupForm.addEventListener("submit", function(event) {

    event.preventDefault();

    clearMessage("signupMessage");

    const fullName = document.getElementById("fullName").value.trim();

    const email = document.getElementById("signupEmail").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const password = document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (fullName.length < 2) {

        showMessage(
            "signupMessage",
            "Please enter your full name.",
            "error"
        );

        return;
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {

        showMessage(
            "signupMessage",
            "Please enter a valid 10-digit Indian mobile number.",
            "error"
        );

        return;
    }

    if (password.length < 8) {

        showMessage(
            "signupMessage",
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }

    if (password !== confirmPassword) {

        showMessage(
            "signupMessage",
            "Passwords do not match.",
            "error"
        );

        return;
    }

    if (selectedSignupRole === "doctor") {

        const hospital =
            document.getElementById("hospital").value.trim();

        const license =
            document.getElementById("license").value.trim();

        const professionalType =
            document.getElementById("professionalType").value;

        if (!hospital || !license || !professionalType) {

            showMessage(
                "signupMessage",
                "Please complete all professional registration fields.",
                "error"
            );

            return;
        }

    }

    // FRONTEND DEMONSTRATION ONLY
    // Connect Supabase to create real accounts.

    showMessage(
        "signupMessage",
        "Form validated successfully! Connect Supabase to complete account registration.",
        "success"
    );

});

// =====================================
// SIGN IN FORM
// =====================================

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    clearMessage("loginMessage");

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!email || !password) {

        showMessage(
            "loginMessage",
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    // FRONTEND DEMONSTRATION ONLY
    // Connect Supabase for real authentication.

    showMessage(
        "loginMessage",
        "Login form validated! Connect Supabase to authenticate your account.",
        "success"
    );

});

// =====================================
// FORGOT PASSWORD
// =====================================

document.getElementById("forgotPassword").addEventListener(
    "click",
    function(event) {

        event.preventDefault();

        showMessage(
            "loginMessage",
            "Password recovery will be available after connecting Supabase.",
            "success"
        );

    }
);

// =====================================
// INITIALIZE
// =====================================

updateSignupRole("patient");

console.log("Swasthya Sense authentication UI loaded successfully!");

localStorage.setItem("swasthyaUserName", fullName);
localStorage.setItem("swasthyaUserEmail", email);
localStorage.setItem("swasthyaUserPhone", phone);
localStorage.setItem("swasthyaUserRole", "patient");

window.location.href = "patient-dashboard.html";
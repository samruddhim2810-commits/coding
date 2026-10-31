// SWASTHYA SENSE - Local Authentication

const USERS_KEY = "swasthya_users";
const SESSION_KEY = "swasthya_session";

// Get registered users
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

// SIGN UP
document.getElementById("signupForm")?.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!name || !email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
        alert("User already registered. Please login.");
        return;
    }

    users.push({
        id: "SS-" + Date.now(),
        name,
        email,
        password,
        role
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    alert("Registration successful! Please login.");

    this.reset();
});

// LOGIN
document.getElementById("loginForm")?.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getUsers();

    const user = users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        alert("Invalid login. Please register first.");
        return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }));

    if (user.role === "patient") {
        window.location.href = "patient-dashboard.html";
    } else if (user.role === "doctor") {
        window.location.href = "doctor-dashboard.html";
    } else {
        alert("Invalid user role");
    }
});

// LOGOUT
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {

    const session = JSON.parse(
        localStorage.getItem("swasthya_session") || "null"
    );

    if (session && session.role === "patient") {
        window.location.replace("patient-dashboard.html");
    }

    else if (session && session.role === "doctor") {
        window.location.replace("doctor-dashboard.html");
    }

});
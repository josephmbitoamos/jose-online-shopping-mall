// Check if the user is logged in
const accessToken = localStorage.getItem("access");

const logoutBtn = document.getElementById("logoutBtn");
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");

if (accessToken) {
    // User is logged in
    logoutBtn.style.display = "inline-block";

    loginLink.style.display = "none";
    registerLink.style.display = "none";
} else {
    // User is not logged in
    logoutBtn.style.display = "none";

    loginLink.style.display = "inline-block";
    registerLink.style.display = "inline-block";
}
logoutBtn.addEventListener("click", function () {

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.href = "login.html";

});
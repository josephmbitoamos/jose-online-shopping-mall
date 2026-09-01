const API_URL = "http://127.0.0.1:8000";

document.getElementById("loginForm").addEventListener("submit", loginUser);

async function loginUser(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const response = await fetch(`${API_URL}/auth/jwt/create/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);

            message.style.color = "green";
            message.innerHTML = "Login successful.";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } else {
            message.style.color = "red";
            message.innerHTML = data.detail || "Invalid username or password.";
        }

    } catch (error) {
        message.style.color = "red";
        message.innerHTML = "Unable to connect to server.";
    }
}
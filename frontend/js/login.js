const API_URL = "http://127.0.0.1:8000";

document.getElementById("loginForm").addEventListener("submit", loginUser);

async function loginUser(e) {

    e.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("message");

    message.style.color = "blue";
    message.innerHTML = "Logging in...";

    try {

        const response = await fetch(
            `${API_URL}/auth/jwt/create/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        // Get response as text first
        const responseText = await response.text();

        console.log("HTTP Status:", response.status);
        console.log("Django Response:", responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {

            console.error(
                "Django did not return JSON:",
                jsonError
            );

            message.style.color = "red";
            message.innerHTML =
                "Django returned an unexpected response. Check F12 Console.";

            return;
        }


        // ==============================
        // SUCCESS
        // ==============================

        if (response.ok) {

            console.log("LOGIN SUCCESS:", data);

            localStorage.setItem(
                "access",
                data.access
            );

            localStorage.setItem(
                "refresh",
                data.refresh
            );

            message.style.color = "green";

            message.innerHTML =
                "Login successful. Redirecting to dashboard...";

            setTimeout(function () {

               window.location.href = "http://127.0.0.1:5500/frontend/user_dashboard.html";

            }, 1000);

        }


        // ==============================
        // LOGIN FAILED
        // ==============================

        else {

            console.error(
                "LOGIN FAILED:",
                data
            );

            message.style.color = "red";

            message.innerHTML =
                data.detail ||
                "Invalid username or password.";
        }

    }


    // ==============================
    // CONNECTION ERROR
    // ==============================

    catch (error) {

        console.error(
            "FETCH ERROR:",
            error
        );

        message.style.color = "red";

        message.innerHTML =
            "Unable to connect to Django server. Check F12 Console.";
    }
}
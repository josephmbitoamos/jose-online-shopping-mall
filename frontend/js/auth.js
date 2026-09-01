function register(username, email, phone, password) {
    fetch("http://127.0.0.1:8000/users/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password })
    })
    .then(res => res.json())
    .then(data => console.log("Registered:", data))
    .catch(err => console.error(err));
}

function login(username, password) {
    fetch("http://127.0.0.1:8000/users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Logged in:", data);
        localStorage.setItem("access_token", data.access);
        fetchCart(); // load cart after login
    })
    .catch(err => console.error(err));
}

const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {

    setYear();
    checkLoggedIn();
    fetchProducts();

    // Fetch cart only if logged in
    if (localStorage.getItem("access")) {
        fetchCart();
    }

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }

});

// ================= FOOTER =================

function setYear() {

    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

}

// ================= LOGIN STATUS =================

function checkLoggedIn() {

    const token = localStorage.getItem("access");

    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginLink && registerLink && logoutBtn) {

        if (token) {

            loginLink.style.display = "none";
            registerLink.style.display = "none";
            logoutBtn.style.display = "inline-block";

        } else {

            loginLink.style.display = "inline-block";
            registerLink.style.display = "inline-block";
            logoutBtn.style.display = "none";

        }

    }

}

// ================= AUTH FETCH =================

async function authFetchJSON(url, options = {}) {

    const token = localStorage.getItem("access");

    options.headers = options.headers || {};

    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, options);

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;

}

// ================= PRODUCTS =================

async function fetchProducts() {

    try {

        const response = await fetch(`${API_URL}/shop/products/`);

        const products = await response.json();

        const container = document.getElementById("product-list");

        if (!container) return;

        container.innerHTML = "";

        products.forEach(product => {

            const div = document.createElement("div");

            div.classList.add("product-card");

            div.innerHTML = `
                <h3>${product.name}</h3>

                <p>${product.description}</p>

                <p><strong>KSh ${product.price}</strong></p>

                <button onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            `;

            container.appendChild(div);

        });

    }

    catch (error) {

        console.error("Failed to load products:", error);

    }

}

// ================= ADD TO CART =================

async function addToCart(productId) {

    try {

        await authFetchJSON(`${API_URL}/shop/cart/`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                product_id: productId,
                quantity: 1

            })

        });

        alert("Product added to cart.");

        fetchCart();

    }

    catch (error) {

        console.error(error);

        alert("Please login first.");

    }

}

// ================= FETCH CART =================

async function fetchCart() {

    const container = document.getElementById("cart-list");

    if (!container) return;

    try {

        const cartItems = await authFetchJSON(`${API_URL}/shop/cart/`);

        container.innerHTML = "";

        if (cartItems.length === 0) {

            container.innerHTML = "<p>Your cart is empty.</p>";

            return;

        }

        cartItems.forEach(item => {

            const div = document.createElement("div");

            div.classList.add("cart-item");

            div.innerHTML = `
                <p>
                    ${item.product.name}
                    - KSh ${item.product.price}
                    × ${item.quantity}
                </p>
            `;

            container.appendChild(div);

        });

    }

    catch (error) {

        console.error("Cart error:", error);

        container.innerHTML =
            "<p>Please login to view your cart.</p>";

    }

}

// ================= LOGOUT =================

function logoutUser() {

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    alert("Logged out successfully.");

    window.location.href = "login.html";

}

// ================= ADD PRODUCT =================

async function addProduct() {

    const name = document.getElementById("product-name").value;
    const description = document.getElementById("product-description").value;
    const price = parseFloat(document.getElementById("product-price").value);

    if (!name || !description || isNaN(price)) {

        alert("Please fill all product fields.");

        return;

    }

    try {

        await authFetchJSON(`${API_URL}/shop/products/`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                name,
                description,
                price

            })

        });

        alert("Product added successfully.");

        fetchProducts();

    }

    catch (error) {

        console.error(error);

        alert("Failed to add product.");

    }

}

// ================= CHECKOUT =================

async function checkout() {

    try {

        await authFetchJSON(`${API_URL}/shop/checkout/`, {

            method: "POST"

        });

        alert("Checkout successful.");

        fetchCart();

    }

    catch (error) {

        console.error(error);

        alert("Checkout failed.");

    }

}
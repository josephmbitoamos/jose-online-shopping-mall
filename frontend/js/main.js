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

javascript
// =====================================================
// PRODUCT SEARCH
// =====================================================

async function searchProducts() {

    const searchBox = document.getElementById("searchBox");
    const container = document.getElementById("searchResults");
    const noResults = document.getElementById("noResults");
    const searchTitle = document.getElementById("searchTitle");

    if (!searchBox || !container) {
        console.error("Search elements were not found.");
        return;
    }

    const searchText = searchBox.value.toLowerCase().trim();

    try {

        const response = await fetch(
            `${API_URL}/shop/products/`
        );

        if (!response.ok) {
            throw new Error("Failed to load products.");
        }

        const products = await response.json();

        container.innerHTML = "";

        const filteredProducts = products.filter(product => {

            const name =
                (product.name || "").toLowerCase();

            const description =
                (product.description || "").toLowerCase();

            const category =
                product.category &&
                product.category.name
                    ? product.category.name.toLowerCase()
                    : "";

            return (
                name.includes(searchText) ||
                description.includes(searchText) ||
                category.includes(searchText)
            );

        });

        if (searchTitle) {

            if (searchText === "") {
                searchTitle.textContent = "Available Products";
            } else {
                searchTitle.textContent =
                    "Search Results for: " + searchText;
            }

        }

        if (filteredProducts.length === 0) {

            noResults.style.display = "block";
            return;

        }

        noResults.style.display = "none";

        filteredProducts.forEach(product => {

            const div = document.createElement("div");

            div.classList.add("product-card");

            const categoryName =
                product.category &&
                product.category.name
                    ? product.category.name
                    : "Uncategorized";

            div.innerHTML = `

                <h3>${product.name}</h3>

                <p>
                    ${product.description}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${categoryName}
                </p>

                <p>
                    <strong>Price:</strong>
                    KSh ${product.price}
                </p>

                <p>
                    <strong>Stock:</strong>
                    ${product.stock}
                </p>

                <button
                    class="cart-btn"
                    onclick="addToCart(${product.id})">
                    Add to Cart
                </button>

            `;

            container.appendChild(div);

        });

    } catch (error) {

        console.error("Search error:", error);

        container.innerHTML =
            "<p>Unable to load products.</p>";

    }

}


// =====================================================
// NAVIGATION SEARCH
// =====================================================

function performNavbarSearch() {

    const searchInput =
        document.getElementById("navbarSearch");

    if (!searchInput) {
        return;
    }

    const searchText =
        searchInput.value.trim();

    if (searchText === "") {

        alert("Please enter a product name.");
        return;

    }

    window.location.href =
        "search_results.html?search=" +
        encodeURIComponent(searchText);

}


// =====================================================
// LOAD SEARCH FROM URL
// =====================================================

function loadSearchFromURL() {

    const parameters =
        new URLSearchParams(window.location.search);

    const searchText =
        parameters.get("search");

    const searchBox =
        document.getElementById("searchBox");

    if (!searchBox) {
        return;
    }

    if (searchText) {
        searchBox.value = searchText;
    }

    searchProducts();

}


// =====================================================
// SEARCH PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {
        loadSearchFromURL();
    }
);
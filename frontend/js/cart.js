// =====================================================
// JOSE' ONLINE SHOPPING MALL
// GLOBAL CART + AUTHENTICATION FUNCTIONS
// =====================================================


// =====================================================
// API URL
// =====================================================

const API_URL = "http://127.0.0.1:8000";


// =====================================================
// CART FUNCTIONS
// =====================================================


// -----------------------------------------------------
// Get the current user's cart
// -----------------------------------------------------

async function fetchCart() {

    const accessToken =
        localStorage.getItem("access");


    // User is not logged in
    if (!accessToken) {

        updateCartCount({
            items: []
        });

        return null;
    }


    try {

        const response = await fetch(
            API_URL + "/shop/cart/",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + accessToken
                }
            }
        );


        // Token expired or invalid
        if (response.status === 401) {

            updateCartCount({
                items: []
            });

            return null;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to fetch cart."
            );
        }


        const cart = await response.json();


        // Update global cart count
        updateCartCount(cart);


        return cart;


    } catch (error) {

        console.error(
            "Error fetching cart:",
            error
        );

        return null;
    }
}


// =====================================================
// GLOBAL CART COUNT
// =====================================================


// -----------------------------------------------------
// Calculate and display total cart quantity
// -----------------------------------------------------

function updateCartCount(cart) {

    let totalQuantity = 0;


    if (
        cart &&
        cart.items &&
        Array.isArray(cart.items)
    ) {

        cart.items.forEach(function(item) {

            totalQuantity +=
                Number(item.quantity) || 0;

        });

    }


    // Find all cart counters on the current page
    const counters =
        document.querySelectorAll(
            "#cartCount"
        );


    // Update all counters
    counters.forEach(function(counter) {

        counter.textContent =
            totalQuantity;

    });


    // Also support .cart-count
    const classCounters =
        document.querySelectorAll(
            ".cart-count"
        );


    classCounters.forEach(function(counter) {

        counter.textContent =
            totalQuantity;

    });


    // Store count only as a convenience
    // The Django database remains the real source
    localStorage.setItem(
        "cartCount",
        totalQuantity
    );
}


// -----------------------------------------------------
// Load global cart count
// -----------------------------------------------------

async function loadGlobalCartCount() {

    await fetchCart();

}


// =====================================================
// DISPLAY CART
// =====================================================


// This function is kept for simple cart-list pages.
// Your main shopping_cart.html can continue using
// its own displayCart() function.

function showCart(cart) {

    const container =
        document.getElementById(
            "cart-list"
        );


    // If this page doesn't have #cart-list,
    // simply update the global count.
    if (!container) {

        updateCartCount(cart);

        return;
    }


    container.innerHTML = "";


    if (
        !cart ||
        !cart.items ||
        cart.items.length === 0
    ) {

        container.innerHTML =
            "<p>Your cart is empty</p>";

        updateCartCount(cart);

        return;
    }


    cart.items.forEach(function(item) {

        const div =
            document.createElement("div");

        div.classList.add(
            "cart-item"
        );


        div.innerHTML = `
            <p>
                ${item.product.name}
                -
                Quantity: ${item.quantity}
                -
                Subtotal: KSh ${item.subtotal}
            </p>

            <button
                onclick="removeCartProduct(${item.product.id})"
            >
                Remove
            </button>
        `;


        container.appendChild(div);

    });


    // Update global counter
    updateCartCount(cart);
}


// =====================================================
// REMOVE CART PRODUCT
// =====================================================


// We use a different name from your shopping_cart.html
// removeItem() function to avoid conflicts.

async function removeCartProduct(productId) {

    const accessToken =
        localStorage.getItem("access");


    if (!accessToken) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        const response = await fetch(
            API_URL +
            `/shop/cart/remove/${productId}/`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        "Bearer " + accessToken
                }
            }
        );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "access"
            );

            localStorage.removeItem(
                "refresh"
            );

            window.location.href =
                "login.html";

            return;
        }


        if (
            !response.ok &&
            response.status !== 204
        ) {

            throw new Error(
                "Unable to remove item."
            );
        }


        // Reload cart and counter
        const cart =
            await fetchCart();


        // Update simple cart display if present
        if (cart) {

            showCart(cart);

        }


    } catch (error) {

        console.error(
            "Remove cart error:",
            error
        );

    }
}


// =====================================================
// REGISTRATION FORM
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const registerForm =
            document.getElementById(
                "register-form"
            );


        if (!registerForm) {

            return;
        }


        registerForm.addEventListener(
            "submit",
            async function(e) {

                e.preventDefault();


                const username =
                    document.getElementById(
                        "username"
                    ).value;

                const email =
                    document.getElementById(
                        "email"
                    ).value;

                const phone =
                    document.getElementById(
                        "phone"
                    ).value;

                const password =
                    document.getElementById(
                        "password"
                    ).value;


                try {

                    const response =
                        await fetch(
                            API_URL +
                            "/users/register/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        username,
                                        email,
                                        phone,
                                        password
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    console.log(data);


                    if (
                        response.status === 201
                    ) {

                        alert(
                            "Registration successful!"
                        );


                        if (data.access) {

                            localStorage.setItem(
                                "access",
                                data.access
                            );

                        }

                    } else {

                        alert(
                            "Error: " +
                            JSON.stringify(data)
                        );

                    }


                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Request failed"
                    );

                }

            }
        );

    }
);


// =====================================================
// LOGIN FORM
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loginForm =
            document.getElementById(
                "login-form"
            );


        if (!loginForm) {

            return;
        }


        loginForm.addEventListener(
            "submit",
            async function(e) {

                e.preventDefault();


                const username =
                    document.getElementById(
                        "login-username"
                    ).value;

                const password =
                    document.getElementById(
                        "login-password"
                    ).value;


                try {

                    const response =
                        await fetch(
                            API_URL +
                            "/auth/jwt/create/",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        username,
                                        password
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        response.status === 200
                    ) {

                        // Save tokens using the names
                        // used by your current project
                        localStorage.setItem(
                            "access",
                            data.access
                        );

                        localStorage.setItem(
                            "refresh",
                            data.refresh
                        );


                        alert(
                            "Login successful!"
                        );


                        // Load user's cart
                        await fetchCart();


                        // Go to dashboard
                        window.location.href =
                            "user_dashboard.html";


                    } else {

                        alert(
                            "Login failed: " +
                            JSON.stringify(data)
                        );

                    }


                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Request failed"
                    );

                }

            }
        );

    }
);


// =====================================================
// LOAD CART COUNT WHEN ANY PAGE OPENS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadGlobalCartCount();

    }
);
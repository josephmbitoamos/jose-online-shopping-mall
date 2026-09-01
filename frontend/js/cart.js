// ======================
// CART FUNCTIONS
// ======================

// Fetch the current user's cart
function fetchCart() {
    fetch("http://127.0.0.1:8000/shop/cart/", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    })
    .then(res => res.json())
    .then(cart => showCart(cart))
    .catch(err => console.error(err));
}

// Display cart items in #cart-list div
function showCart(cart) {
    const container = document.getElementById("cart-list");
    container.innerHTML = "";
    if (!cart.items || cart.items.length === 0) {
        container.innerHTML = "<p>Your cart is empty</p>";
        return;
    }
    cart.items.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <p>${item.product.name} - Quantity: ${item.quantity} - Subtotal: $${item.subtotal}</p>
            <button onclick="removeFromCart(${item.product.id})">Remove</button>
        `;
        container.appendChild(div);
    });
}

// Add a product to cart
function addToCart(productId) {
    fetch("http://127.0.0.1:8000/shop/cart/add/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
    })
    .then(res => res.json())
    .then(cart => showCart(cart))
    .catch(err => console.error(err));
}

// Remove a product from cart
function removeFromCart(productId) {
    fetch(`http://127.0.0.1:8000/shop/cart/remove/${productId}/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    })
    .then(() => fetchCart())
    .catch(err => console.error(err));
}

// ======================
// REGISTRATION FORM
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();  // Prevent default form submission

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("password").value;

        try {
          const response = await fetch("http://127.0.0.1:8000/users/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, phone, password }),
          });

          const data = await response.json();
          console.log(data);

          if (response.status === 201) {
            alert("Registration successful!");
            if (data.access) {  // save JWT if returned
                localStorage.setItem("access_token", data.access);
            }
          } else {
            alert("Error: " + JSON.stringify(data));
          }
        } catch (error) {
          console.error(error);
          alert("Request failed");
        }
    });
  }
});

// ======================
// LOGIN FORM
// ======================
const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("http://127.0.0.1:8000/users/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.status === 200) {
                localStorage.setItem("access_token", data.access);
                alert("Login successful!");
                console.log("Access token saved:", data.access);

                // Fetch and display cart immediately after login
                fetchCart();
            } else {
                alert("Login failed: " + JSON.stringify(data));
            }
        } catch (error) {
            console.error(error);
            alert("Request failed");
        }
    });
}

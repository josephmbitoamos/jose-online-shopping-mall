const API_URL = "http://127.0.0.1:8000";

const accessToken = localStorage.getItem("access");

let orders = [];


/* ================================
   LOGIN CHECK
================================ */

if (!accessToken) {
    window.location.href = "login.html";
}


/* ================================
   YEAR
================================ */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


/* ================================
   FORMAT CURRENCY
================================ */

function formatCurrency(amount) {

    const value = Number(amount) || 0;

    return "KSh " + value.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* ================================
   FORMAT DATE
================================ */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* ================================
   STATUS CLASS
================================ */

function getStatusClass(status) {

    const value =
        String(status || "pending").toLowerCase();

    if (value === "delivered") {
        return "status-delivered";
    }

    if (value === "shipped") {
        return "status-shipped";
    }

    if (
        value === "paid" ||
        value === "processing"
    ) {
        return "status-processing";
    }

    if (value === "cancelled") {
        return "status-cancelled";
    }

    return "status-pending";
}


/* ================================
   LOAD ORDERS
================================ */

async function loadOrders() {

    const loading =
        document.getElementById("loadingOrders");

    const empty =
        document.getElementById("emptyOrders");

    const error =
        document.getElementById("errorOrders");

    const tableContainer =
        document.getElementById(
            "ordersTableContainer"
        );

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    try {

        console.log("Loading orders...");


        const response = await fetch(
            API_URL + "/shop/orders/",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + accessToken,

                    "Content-Type":
                        "application/json"
                }
            }
        );


        console.log(
            "ORDERS API STATUS:",
            response.status
        );


        if (response.status === 401) {

            console.error(
                "Authentication failed."
            );

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        console.log(
            "ORDERS API RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load orders."
            );
        }


        orders =
            Array.isArray(data)
                ? data
                : [];


        window.djangoOrders =
            orders;


        if (loading) {
            loading.style.display = "none";
        }


        /* ================================
           NO ORDERS
        ================================ */

        if (orders.length === 0) {

            if (empty) {
                empty.style.display = "block";
            }

            if (tableContainer) {
                tableContainer.style.display = "none";
            }

            return;
        }


        /* ================================
           SHOW TABLE
        ================================ */

        if (empty) {
            empty.style.display = "none";
        }

        if (tableContainer) {
            tableContainer.style.display = "block";
        }

        if (tableBody) {
            tableBody.innerHTML = "";
        }


        let totalSpent = 0;

        let completedOrders = 0;


        /* ================================
           DISPLAY EACH ORDER
        ================================ */

        orders.forEach(function(order, index) {

            const total =
                Number(order.total_amount) || 0;

            totalSpent += total;


            if (
                String(order.status)
                    .toLowerCase() === "delivered"
            ) {

                completedOrders++;
            }


            let productCount = 0;


            if (Array.isArray(order.items)) {

                order.items.forEach(function(item) {

                    productCount +=
                        Number(item.quantity) || 0;

                });
            }


            const row =
                document.createElement("tr");


            row.innerHTML =
                "<td>#"
                + order.id
                + "</td>"

                + "<td>"
                + formatDate(order.created)
                + "</td>"

                + "<td>"
                + productCount
                + " item(s)"
                + "</td>"

                + "<td>"
                + formatCurrency(total)
                + "</td>"

                + "<td>"
                + "<span class=\"status "
                + getStatusClass(order.status)
                + "\">"
                + (order.status || "Pending")
                + "</span>"
                + "</td>"

                + "<td>"
                + "<button "
                + "class=\"view-btn\" "
                + "onclick=\"viewOrder("
                + index
                + ")\">"
                + "View"
                + "</button>"
                + "</td>";


            if (tableBody) {
                tableBody.appendChild(row);
            }

        });


        /* ================================
           SUMMARY
        ================================ */

        const totalOrdersElement =
            document.getElementById(
                "totalOrders"
            );

        if (totalOrdersElement) {
            totalOrdersElement.textContent =
                orders.length;
        }


        const completedOrdersElement =
            document.getElementById(
                "completedOrders"
            );

        if (completedOrdersElement) {
            completedOrdersElement.textContent =
                completedOrders;
        }


        const totalSpentElement =
            document.getElementById(
                "totalSpent"
            );

        if (totalSpentElement) {
            totalSpentElement.textContent =
                formatCurrency(totalSpent);
        }

    }


    catch (errorObject) {

        console.error(
            "ORDER ERROR:",
            errorObject
        );


        if (loading) {
            loading.style.display = "none";
        }


        if (error) {

            error.style.display = "block";

            error.innerHTML =
                "<h3>Unable to Load Orders</h3>"
                + "<p>"
                + errorObject.message
                + "</p>";
        }

    }
}


/* ================================
   VIEW ORDER
================================ */

function viewOrder(index) {

    const order = orders[index];


    if (!order) {

        alert(
            "Order details could not be found."
        );

        return;
    }


    let productsHTML = "";


    if (Array.isArray(order.items)) {

        order.items.forEach(function(item) {

            const productName =
                item.product
                    ? item.product.name
                    : "Product";


            productsHTML +=
                "<tr>"
                + "<td>"
                + productName
                + "</td>"
                + "<td>"
                + item.quantity
                + "</td>"
                + "<td>"
                + formatCurrency(item.price)
                + "</td>"
                + "<td>"
                + formatCurrency(item.subtotal)
                + "</td>"
                + "</tr>";

        });
    }


    const detailsWindow =
        window.open(
            "",
            "_blank",
            "width=800,height=700"
        );


    if (!detailsWindow) {

        alert(
            "Please allow pop-ups to view order details."
        );

        return;
    }


    detailsWindow.document.write(
        "<!DOCTYPE html>"
        + "<html>"
        + "<head>"
        + "<title>Order #"
        + order.id
        + "</title>"
        + "<style>"
        + "body{font-family:Arial,sans-serif;"
        + "padding:30px;background:#f9f5ff;}"
        + ".container{max-width:700px;"
        + "margin:auto;background:white;"
        + "padding:30px;border-radius:10px;}"
        + "h1{color:#6a1b9a;}"
        + "table{width:100%;"
        + "border-collapse:collapse;"
        + "margin-top:20px;}"
        + "th,td{padding:10px;"
        + "border-bottom:1px solid #ddd;"
        + "text-align:left;}"
        + "th{background:#f3e8ff;}"
        + "</style>"
        + "</head>"
        + "<body>"
        + "<div class=\"container\">"
        + "<h1>Jose' Online Shopping Mall</h1>"
        + "<h2>Order #"
        + order.id
        + "</h2>"
        + "<p><strong>Date:</strong> "
        + formatDate(order.created)
        + "</p>"
        + "<p><strong>Status:</strong> "
        + (order.status || "Pending")
        + "</p>"
        + "<hr>"
        + "<h3>Products</h3>"
        + "<table>"
        + "<thead>"
        + "<tr>"
        + "<th>Product</th>"
        + "<th>Quantity</th>"
        + "<th>Price</th>"
        + "<th>Total</th>"
        + "</tr>"
        + "</thead>"
        + "<tbody>"
        + productsHTML
        + "</tbody>"
        + "</table>"
        + "<h3>Total: "
        + formatCurrency(order.total_amount)
        + "</h3>"
        + "</div>"
        + "</body>"
        + "</html>"
    );


    detailsWindow.document.close();
}


/* ================================
   LOGOUT
================================ */

function logoutUser() {

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");

    window.location.href =
        "login.html";
}


const logoutButton =
    document.getElementById("logoutBtn");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutUser
    );
}


/* ================================
   START
================================ */

loadOrders();
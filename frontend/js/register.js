const API_URL = "http://127.0.0.1:8000";

document
.getElementById("registerForm")
.addEventListener("submit", registerUser);

async function registerUser(e){

    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;

    const message = document.getElementById("message");

    if(password !== confirmPassword){

        message.style.color = "red";
        message.innerHTML = "Passwords do not match.";

        return;
    }

    try{

        const response = await fetch(
            `${API_URL}/auth/users/`,
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    username:username,
                    email:email,
                    phone:phone,
                    password:password,
                    re_password:confirmPassword

                })

            }
        );

        const data = await response.json();

        if(response.ok){

            message.style.color="green";

            message.innerHTML="Registration successful. Redirecting to Login...";

            setTimeout(()=>{

                window.location.href="login.html";

            },2000);

        }

        else{

            message.style.color="red";

            message.innerHTML=JSON.stringify(data);

        }

    }

    catch(error){

        message.style.color="red";

        message.innerHTML="Unable to connect to server.";

    }

}
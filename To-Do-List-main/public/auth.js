// ============================================
// TASKFLOW - AUTHENTICATION
// ============================================


// ============================================
// REGISTER
// ============================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const message =
            document.getElementById("registerMessage");


        // ----------------------------------------
        // VALIDATION
        // ----------------------------------------

        if (!name || !email || !password || !confirmPassword) {

            message.textContent =
                "Please fill in all fields.";

            message.className =
                "auth-message error";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            message.className =
                "auth-message error";

            return;
        }


        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match.";

            message.className =
                "auth-message error";

            return;
        }


        // ----------------------------------------
        // SEND REGISTER REQUEST
        // ----------------------------------------

        try {

            message.textContent =
                "Creating your account...";

            message.className =
                "auth-message";


            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );


            const data = await response.json();


            // ----------------------------------------
            // ERROR RESPONSE
            // ----------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message || "Registration failed"
                );
            }


            // ----------------------------------------
            // SUCCESS
            // ----------------------------------------

            message.textContent =
                "Account created successfully! Redirecting to login...";

            message.className =
                "auth-message success";


            registerForm.reset();


            setTimeout(() => {

                window.location.href = "login.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            message.textContent =
                error.message ||
                "Something went wrong. Please try again.";

            message.className =
                "auth-message error";
        }

    });

}

// ============================================
// LOGIN
// ============================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");


        if (!email || !password) {

            message.textContent =
                "Please enter email and password.";

            message.className =
                "auth-message error";

            return;
        }


        try {

            message.textContent =
                "Logging in...";

            message.className =
                "auth-message";


            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Login failed"
                );
            }


            // Save login information
            localStorage.setItem(
                "taskflowToken",
                data.token
            );

            localStorage.setItem(
                "taskflowUser",
                JSON.stringify(data.user)
            );


            message.textContent =
                "Login successful!";

            message.className =
                "auth-message success";


            // Temporary redirect
            setTimeout(() => {

                window.location.href = "index.html";

            }, 1000);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                error.message ||
                "Something went wrong.";

            message.className =
                "auth-message error";
        }

    });

}
// ============================================
// TASKFLOW PROFILE
// ============================================

const token =
    localStorage.getItem("taskflowToken");


// ============================================
// LOGIN PROTECTION
// ============================================

if (!token) {

    window.location.href =
        "login.html";
}


// ============================================
// DOM ELEMENTS
// ============================================

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profileNameInput =
    document.getElementById(
        "profileNameInput"
    );

const profileEmailInput =
    document.getElementById(
        "profileEmailInput"
    );

const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );

const profileLogoutBtn =
    document.getElementById(
        "profileLogoutBtn"
    );

const profileToast =
    document.getElementById(
        "profileToast"
    );

const profileToastMessage =
    document.getElementById(
        "profileToastMessage"
    );


// ============================================
// API REQUEST
// ============================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const currentToken =
        localStorage.getItem(
            "taskflowToken"
        );


    if (!currentToken) {

        window.location.href =
            "login.html";

        throw new Error(
            "Authentication required"
        );
    }


    return fetch(
        url,
        {
            ...options,

            headers: {
                ...(options.headers || {}),

                "Authorization":
                    `Bearer ${currentToken}`
            }
        }
    );
}


// ============================================
// LOAD PROFILE FROM DATABASE
// ============================================

async function loadProfile() {

    try {

        const response =
            await authenticatedFetch(
                "/api/users/me"
            );


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        const user =
            await response.json();


        if (!response.ok) {

            throw new Error(
                user.message ||
                "Failed to load profile"
            );
        }


        displayUser(
            user
        );


        // Keep localStorage updated

        localStorage.setItem(
            "taskflowUser",
            JSON.stringify({
                name: user.name,
                email: user.email
            })
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showProfileToast(
            error.message ||
            "Failed to load profile"
        );
    }
}


// ============================================
// DISPLAY USER
// ============================================

function displayUser(user) {

    const name =
        user.name || "User";

    const email =
        user.email || "";


    profileName.textContent =
        name;

    profileEmail.textContent =
        email;


    profileNameInput.value =
        name;

    profileEmailInput.value =
        email;


    profileAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();
}


// ============================================
// SAVE PROFILE TO DATABASE
// ============================================

saveProfileBtn.addEventListener(
    "click",
    async () => {

        const name =
            profileNameInput.value.trim();

        const email =
            profileEmailInput.value
                .trim()
                .toLowerCase();


        if (!name) {

            showProfileToast(
                "Name cannot be empty"
            );

            return;
        }


        if (!email) {

            showProfileToast(
                "Email cannot be empty"
            );

            return;
        }


        saveProfileBtn.disabled =
            true;

        saveProfileBtn.textContent =
            "Saving...";


        try {

            const response =
                await authenticatedFetch(
                    "/api/users/me",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name: name,
                                email: email
                            })
                    }
                );


            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update profile"
                );
            }


            // Update UI

            displayUser(
                data.user
            );


            // Update localStorage

            localStorage.setItem(
                "taskflowUser",
                JSON.stringify({
                    name:
                        data.user.name,

                    email:
                        data.user.email
                })
            );


            showProfileToast(
                "Profile updated successfully"
            );


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            showProfileToast(
                error.message ||
                "Failed to update profile"
            );


        } finally {

            saveProfileBtn.disabled =
                false;

            saveProfileBtn.textContent =
                "Save Changes";
        }
    }
);


// ============================================
// LOGOUT
// ============================================

profileLogoutBtn.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmed) return;


        logout();
    }
);


// ============================================
// LOGOUT FUNCTION
// ============================================

function logout() {

    localStorage.removeItem(
        "taskflowToken"
    );

    localStorage.removeItem(
        "taskflowUser"
    );


    window.location.href =
        "login.html";
}


// ============================================
// TOAST
// ============================================

function showProfileToast(
    message
) {

    profileToastMessage.textContent =
        message;


    profileToast.classList.add(
        "show"
    );


    clearTimeout(
        window.profileToastTimer
    );


    window.profileToastTimer =
        setTimeout(
            () => {

                profileToast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


// ============================================
// INITIAL LOAD
// ============================================

loadProfile();

const changePasswordBtn = document.getElementById("changePasswordBtn");

if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {

        const currentPassword =
            document.getElementById("currentPassword").value.trim();

        const newPassword =
            document.getElementById("newPassword").value.trim();

        const confirmPassword =
            document.getElementById("confirmPassword").value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showProfileToast("Please fill all password fields.");
            return;
        }

        if (newPassword.length < 6) {
            showProfileToast("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showProfileToast("New passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            showProfileToast("New password must be different from current password.");
            return;
        }

        try {

            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = "Changing...";

            const response = await authenticatedFetch(
                "/api/users/change-password",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showProfileToast(data.message || "Failed to change password.");
                return;
            }

            showProfileToast("Password changed successfully!");

            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";

        } catch (error) {

            console.error("Change password error:", error);
            showProfileToast("Something went wrong.");

        } finally {

            changePasswordBtn.disabled = false;
            changePasswordBtn.textContent = "Change Password";
        }
    });
}

// ============================================
// PASSWORD SHOW / HIDE
// ============================================

const passwordToggleButtons =
    document.querySelectorAll(".password-toggle");

passwordToggleButtons.forEach(button => {

    button.addEventListener("click", function () {

        const targetId =
            this.getAttribute("data-target");

        const passwordInput =
            document.getElementById(targetId);

        if (!passwordInput) return;


        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            this.textContent = "👁️";

            this.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            this.textContent = "🙈";

            this.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

});

// ============================================
// PASSWORD STRENGTH
// ============================================

const newPasswordInput =
    document.getElementById("newPassword");

const passwordStrengthFill =
    document.getElementById("passwordStrengthFill");

const passwordStrengthText =
    document.getElementById("passwordStrengthText");


if (
    newPasswordInput &&
    passwordStrengthFill &&
    passwordStrengthText
) {

    newPasswordInput.addEventListener(
        "input",
        function () {

            const password = this.value;

            // Empty password
            if (password.length === 0) {

                passwordStrengthFill.style.width = "0%";

                passwordStrengthText.textContent =
                    "Password strength";

                passwordStrengthText.style.color = "";

                return;
            }


            let score = 0;


            // Length
            if (password.length >= 6) {
                score++;
            }

            if (password.length >= 10) {
                score++;
            }


            // Lowercase
            if (/[a-z]/.test(password)) {
                score++;
            }


            // Uppercase
            if (/[A-Z]/.test(password)) {
                score++;
            }


            // Number
            if (/[0-9]/.test(password)) {
                score++;
            }


            // Special character
            if (/[^A-Za-z0-9]/.test(password)) {
                score++;
            }


            // WEAK
            if (password.length < 8 || score <= 2) {

                passwordStrengthFill.style.width =
                    "33%";

                passwordStrengthFill.style.background =
                    "#ef4444";

                passwordStrengthText.textContent =
                    "Weak password";

                passwordStrengthText.style.color =
                    "#ef4444";
            }


            // MEDIUM
            else if (
                password.length < 10 ||
                score <= 4
            ) {

                passwordStrengthFill.style.width =
                    "66%";

                passwordStrengthFill.style.background =
                    "#f59e0b";

                passwordStrengthText.textContent =
                    "Medium password";

                passwordStrengthText.style.color =
                    "#f59e0b";
            }


            // STRONG
            else {

                passwordStrengthFill.style.width =
                    "100%";

                passwordStrengthFill.style.background =
                    "#22c55e";

                passwordStrengthText.textContent =
                    "Strong password";

                passwordStrengthText.style.color =
                    "#22c55e";
            }

        }
    );

}
const resetPasswordForm = document.getElementById("resetPasswordForm");

resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        alert("Invalid or missing reset token.");
        return;
    }

    const button = resetPasswordForm.querySelector("button");

    button.disabled = true;
    button.textContent = "Resetting...";

    try {
        const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to reset password.");
            return;
        }

        alert(data.message);

        window.location.href = "login.html";

    } catch (error) {
        console.error("Reset password error:", error);

        alert("Unable to connect to the server.");

    } finally {
        button.disabled = false;
        button.textContent = "Reset Password";
    }
});
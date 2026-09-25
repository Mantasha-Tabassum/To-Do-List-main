const forgotPasswordForm = document.getElementById("forgotPasswordForm");

forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Please enter your email.");
        return;
    }

    const button = forgotPasswordForm.querySelector("button");

    button.disabled = true;
    button.textContent = "Sending...";

    try {
        const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Something went wrong.");
            return;
        }

        alert(data.message);

        forgotPasswordForm.reset();

    } catch (error) {
        console.error("Forgot password error:", error);

        alert("Unable to connect to the server.");
    } finally {
        button.disabled = false;
        button.textContent = "Send Reset Link";
    }
});
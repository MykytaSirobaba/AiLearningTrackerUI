document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("tempToken");

  if (tokenFromUrl) {
    localStorage.setItem("temp2FaToken", tokenFromUrl);

    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const storedToken = localStorage.getItem("temp2FaToken");

  if (!storedToken) {
    alert("Помилка сесії. Будь ласка, авторизуйтесь.");
    window.location.href = "index.html";
  }
});

document
  .getElementById("verifyForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const code = document.getElementById("codeTwfa").value.trim();
    const tempToken = localStorage.getItem("temp2FaToken");

    if (!tempToken) {
      alert("Помилка сесії. Час вичерпано, увійдіть знову.");
      window.location.href = "index.html";
      return;
    }

    if (!code) {
      alert("Будь ласка, введіть код.");
      return;
    }

    const requestBody = {
      twoFactorToken: tempToken,
      code: code,
    };

    try {
      const response = await fetch("http://localhost:8080/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        if (data.user && data.user.username) {
          localStorage.setItem("username", data.user.username);
        }

        localStorage.removeItem("temp2FaToken");

        window.location.href = "dashboard.html";
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Невірний код. Спробуйте ще раз.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Сталася помилка з'єднання");
    }
  });

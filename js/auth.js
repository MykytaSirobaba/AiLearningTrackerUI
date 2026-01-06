document
  .querySelector("form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
      const response = await fetch("http://localhost:8080/auth/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        console.log("Успішний вхід:", data);

        localStorage.setItem("accessToken", data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.tokens.refreshToken);

        if (data.tokens.user && data.tokens.user.username) {
          localStorage.setItem("username", data.tokens.user.username);
        }

        window.location.href = "dashboard.html";
      } else if (response.status === 202) {
        console.log("Потрібна 2FA:", data);

        if (data.twoFactorToken) {
          localStorage.setItem("temp2FaToken", data.twoFactorToken);
          window.location.href = "2fa-verify.html";
        } else {
          alert("Помилка: сервер вимагає 2FA, але не надав токен");
        }
      } else {
        alert("Невірний логін або пароль");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Сервер не відповідає");
    }
  });

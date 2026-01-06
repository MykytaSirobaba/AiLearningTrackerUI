// js/register.js

document
  .querySelector("form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("nameInput").value;
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    const confirmPassword = document.getElementById(
      "confirmPasswordInput"
    ).value;
    const termsCheck = document.getElementById("termsCheck").checked;

    if (password !== confirmPassword) {
      alert("Паролі не співпадають!");
      return;
    }

    if (!termsCheck) {
      alert("Будь ласка, погодьтесь з умовами.");
      return;
    }

    const registerRequestDto = {
      username: username,
      email: email,
      password: password,
    };

    try {
      const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerRequestDto),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("username", username);

        alert("Реєстрація успішна!");
        window.location.href = "dashboard.html";
      } else {
        alert("Помилка реєстрації. Можливо, такий користувач вже існує.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Сталася помилка з'єднання з сервером.");
    }
  });

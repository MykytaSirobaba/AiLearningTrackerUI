// js/2fa-settings.js

document.addEventListener("DOMContentLoaded", async function () {
  const mfaEnabled = localStorage.getItem("mfaEnabled") === "true";
  update2faUI(mfaEnabled);
});

function update2faUI(isEnabled) {
  const setupItem = document.getElementById("accordionItemSetup");
  const activateItem = document.getElementById("accordionItemActivate");
  const disableItem = document.getElementById("accordionItemDisable");

  if (!setupItem || !activateItem || !disableItem) return;

  if (isEnabled) {
    setupItem.style.display = "none";
    activateItem.style.display = "none";
    disableItem.style.display = "block";

    const collapseDisable = document.getElementById("collapseDisable");
    if (collapseDisable)
      new bootstrap.Collapse(collapseDisable, { toggle: false }).show();
  } else {
    setupItem.style.display = "block";
    activateItem.style.display = "block";
    disableItem.style.display = "none";

    const collapseSetup = document.getElementById("collapseSetup");
    if (collapseSetup)
      new bootstrap.Collapse(collapseSetup, { toggle: false }).show();
  }
}

// Setup Listener
const setup2faBtn = document.getElementById("setup2faBtn");
if (setup2faBtn) {
  setup2faBtn.addEventListener("click", async () => {
    const qrContainer = document.getElementById("qrCodeContainer");

    qrContainer.innerHTML = "";

    try {
      const response = await request("/user/2fa/setup", "GET");

      if (response.status === 200) {
        const data = response.data;
        console.log("Дані 2FA:", data);

        const qrUri = data.qrCodeImageUrl;

        if (qrUri) {
          new QRCode(qrContainer, {
            text: qrUri,
            width: 180,
            height: 180,
          });
        } else {
          alert("Помилка: Сервер не повернув посилання для QR.");
        }
      } else {
        alert("Не вдалося отримати налаштування 2FA.");
      }
    } catch (error) {
      console.error("Помилка при генерації QR:", error);
    }
  });
}

const activate2faBtn = document.getElementById("activate2faBtn");
if (activate2faBtn) {
  activate2faBtn.addEventListener("click", async () => {
    const inputField = document.getElementById("verify2faInput");
    const code = inputField.value.trim();

    if (!code) {
      alert("Будь ласка, введіть код із Google Authenticator");
      return;
    }

    try {
      const response = await request("/user/2fa/activate", "PATCH", {
        code: code,
      });

      console.log("Результат активації:", response);

      if (response.status === 200) {
        alert("2FA успішно активовано! Тепер ваш акаунт захищено.");

        inputField.value = "";

        if (typeof update2faUI === "function") {
          update2faUI(true);
        }
      } else {
        alert("Невірний код. Спробуйте ще раз.");
      }
    } catch (error) {
      console.error("Помилка активації:", error);
      alert("Помилка з'єднання із сервером.");
    }
  });
}

// Disable Listener
const disable2faBtn = document.getElementById("disable2faBtn");
if (disable2faBtn) {
  disable2faBtn.addEventListener("click", async () => {
    const input = document.getElementById("disable2faInput");
    const code = input.value.trim();

    if (!code) {
      alert("Введіть код для підтвердження вимкнення!");
      return;
    }

    if (!confirm("Ви точно хочете вимкнути двофакторну аутентифікацію?")) {
      return;
    }

    try {
      const response = await request("/user/2fa/disable", "PATCH", {
        code: code,
      });

      if (response.status === 200) {
        alert("2FA успішно вимкнено.");
        input.value = "";
        update2faUI(false);
      } else {
        alert("Помилка вимкнення. Перевірте код.");
      }
    } catch (error) {
      console.error("Помилка:", error);
      alert("Сталася помилка з'єднання.");
    }
  });
}

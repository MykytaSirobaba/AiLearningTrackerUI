// js/dashboard.js

(function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("accessToken");
  const refreshToken = urlParams.get("refreshToken");
  const username = urlParams.get("username");

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (username)
      localStorage.setItem("username", decodeURIComponent(username));

    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

const token = localStorage.getItem("accessToken");

if (!token) {
  window.location.href = "index.html";
  throw new Error("Access Denied: Redirecting to login");
}

document.addEventListener("DOMContentLoaded", async function () {
  const username = localStorage.getItem("username");
  const usernameDisplay = document.getElementById("usernameDisplay");
  if (username && usernameDisplay) {
    usernameDisplay.textContent = username;
  }

  if (
    typeof loadGoals === "function" &&
    document.getElementById("goalsContainer")
  ) {
    loadGoals();
    if (typeof loadCompletedGoals === "function") loadCompletedGoals();
  }

  await check2faStatus();
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "index.html";
  });
}

const setup2faBtn = document.getElementById("setup2faBtn");
if (setup2faBtn) {
  setup2faBtn.addEventListener("click", async () => {
    const qrContainer = document.getElementById("qrCodeContainer");
    qrContainer.innerHTML = "";

    try {
      const response = await request("/user/2fa/setup", "GET");

      if (response.status === 200) {
        const data = response.data;
        const qrUri = data.qrCodeImageUrl || data.secretImageUri;

        if (qrUri) {
          new QRCode(qrContainer, { text: qrUri, width: 180, height: 180 });
        } else {
          alert("Помилка: Сервер не повернув QR-код.");
        }
      } else {
        alert("Не вдалося отримати налаштування 2FA.");
      }
    } catch (error) {
      console.error("QR Error:", error);
    }
  });
}

const activate2faBtn = document.getElementById("activate2faBtn");
if (activate2faBtn) {
  activate2faBtn.addEventListener("click", async () => {
    const input = document.getElementById("verify2faInput");
    const code = input.value.trim();

    if (!code) return alert("Введіть код з Google Authenticator");

    try {
      const response = await request("/user/2fa/activate", "PATCH", {
        code: code,
      });

      if (response.status === 200) {
        alert("2FA успішно активовано!");
        input.value = "";
        update2faUI(true);
      } else {
        alert("Невірний код.");
      }
    } catch (error) {
      console.error("Activation Error:", error);
    }
  });
}

const disable2faBtn = document.getElementById("disable2faBtn");
if (disable2faBtn) {
  disable2faBtn.addEventListener("click", async () => {
    const input = document.getElementById("disable2faInput");
    const code = input.value.trim();

    if (!code) return alert("Введіть код підтвердження");
    if (!confirm("Вимкнути 2FA?")) return;

    try {
      const response = await request("/user/2fa/disable", "PATCH", {
        code: code,
      });

      if (response.status === 200) {
        alert("2FA вимкнено.");
        input.value = "";
        update2faUI(false);
      } else {
        alert("Помилка. Перевірте код.");
      }
    } catch (error) {
      console.error("Disable Error:", error);
    }
  });
}

async function check2faStatus() {
  try {
    const response = await request("/user/me", "GET");
    if (response.status === 200) {
      const user = response.data;
      const isEnabled =
        user.twoFactorEnabled !== undefined
          ? user.twoFactorEnabled
          : user.mfaEnabled;
      update2faUI(isEnabled);
    }
  } catch (error) {
    console.error("Status Error:", error);
  }
}

function update2faUI(isEnabled) {
  const setup = document.getElementById("accordionItemSetup");
  const activate = document.getElementById("accordionItemActivate");
  const disable = document.getElementById("accordionItemDisable");

  if (!setup || !activate || !disable) return;

  if (isEnabled) {
    setup.style.display = "none";
    activate.style.display = "none";
    disable.style.display = "block";

    const collapseDisable = document.getElementById("collapseDisable");
    if (collapseDisable)
      new bootstrap.Collapse(collapseDisable, { toggle: false }).show();
  } else {
    setup.style.display = "block";
    activate.style.display = "block";
    disable.style.display = "none";

    const collapseSetup = document.getElementById("collapseSetup");
    if (collapseSetup)
      new bootstrap.Collapse(collapseSetup, { toggle: false }).show();
  }
}

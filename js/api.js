// js/api.js
const API_BASE_URL = "http://localhost:8080";

async function request(endpoint, method = "GET", body = null) {
  let token = localStorage.getItem("accessToken");

  console.log(
    `API Request] ${method} ${endpoint}`,
    token ? "Токен є" : "БЕЗ ТОКЕНА"
  );

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: method,
    headers: headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      console.warn(`Отримано 401 на ${endpoint}. Пробуємо оновити токен...`);

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log("Токен оновлено успішно! Повторюємо оригінальний запит...");

        headers["Authorization"] = `Bearer ${newToken}`;
        config.headers = headers;

        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      } else {
        console.error("Не вдалося оновити токен. Робимо Logout.");
        logout();
        return { status: 401, data: null };
      }
    }

    if (response.status === 204) {
      return { status: 204, data: null };
    }

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data: data };
  } catch (error) {
    console.error("[Network Error]", error);
    return { status: 500, error: error };
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.warn("No refresh token found in storage.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.accessToken;
    } else {
      console.error(
        "Refresh token request failed with status:",
        response.status
      );
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

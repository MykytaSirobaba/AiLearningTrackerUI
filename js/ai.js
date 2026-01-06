// js/ai.js

let currentAiGoalId = null;
const AI_PAGE_SIZE = 5;

document.addEventListener("DOMContentLoaded", () => {
  loadGoalsForAiSelector();

  const selector = document.getElementById("aiGoalSelector");
  if (selector) {
    selector.addEventListener("change", (e) => {
      const goalId = e.target.value;
      if (goalId) {
        currentAiGoalId = goalId;
        const panel = document.getElementById("aiConfigPanel");
        panel.classList.remove("opacity-50");
        panel.style.pointerEvents = "auto";

        loadAiAnalyses(currentAiGoalId, 0);
      }
    });
  }

  const form = document.getElementById("createAiAnalysisForm");
  if (form) {
    form.addEventListener("submit", handleCreateAiAnalysis);
  }
});

async function loadGoalsForAiSelector() {
  try {
    const response = await request("/goal/goals?size=100");
    const selector = document.getElementById("aiGoalSelector");

    if (response.status === 200) {
      const goals = response.data.content;
      if (goals.length === 0) {
        selector.innerHTML = "<option disabled selected>Немає цілей</option>";
        return;
      }
      selector.innerHTML =
        '<option value="" selected disabled>Оберіть ціль...</option>';
      goals.forEach((goal) => {
        const option = document.createElement("option");
        option.value = goal.id;
        option.textContent = goal.title;
        selector.appendChild(option);
      });
    }
  } catch (e) {
    console.error("AI Selector Error:", e);
  }
}

async function loadAiAnalyses(goalId, page = 0) {
  const container = document.getElementById("aiListContainer");
  container.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

  try {
    const response = await request(
      `/aiAnalysis/${goalId}/analysis/?page=${page}&size=${AI_PAGE_SIZE}&sort=createdAt,desc`
    );

    if (response.status === 200) {
      const pageData = response.data;
      const analyses = pageData.content;

      container.innerHTML = "";

      if (analyses.length === 0) {
        container.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-clipboard-data display-4"></i>
                        <p class="mt-3">Аналізів ще немає. Натисніть "Генерувати", щоб отримати перший звіт.</p>
                    </div>`;
        document.getElementById("aiPagination").classList.add("d-none");
        return;
      }

      analyses.forEach((item) => {
        const dateObj = new Date(item.createdAt);
        const dateStr =
          dateObj.toLocaleDateString() +
          " " +
          dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

        const html = `
                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3">
                        <div class="d-flex align-items-center overflow-hidden">
                            <div class="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>
                            <div style="min-width: 0;">
                                <h6 class="mb-0 text-truncate">${
                                  item.title || "AI Analysis"
                                }</h6>
                                <small class="text-muted"><i class="bi bi-clock"></i> ${dateStr}</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <button onclick="viewAiDetails(${goalId}, ${
          item.id
        })" class="btn btn-sm btn-primary me-2">
                                Читати
                            </button>
                            <button onclick="deleteAiAnalysis(${goalId}, ${
          item.id
        })" class="btn btn-sm btn-outline-danger">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
        container.insertAdjacentHTML("beforeend", html);
      });

      renderAiPagination(pageData, goalId);
    }
  } catch (e) {
    console.error("AI List Error:", e);
    container.innerHTML =
      '<p class="text-danger text-center">Помилка завантаження списку.</p>';
  }
}

async function handleCreateAiAnalysis(e) {
  e.preventDefault();
  if (!currentAiGoalId) return;

  const limitInput = document.getElementById("aiLimit");
  const limit = parseInt(limitInput.value);

  if (limit < 1 || limit > 50) {
    alert("Ліміт має бути від 1 до 50.");
    return;
  }

  setAiLoading(true);

  try {
    const requestBody = { limit: limit };
    const response = await request(
      `/aiAnalysis/${currentAiGoalId}/analysis`,
      "POST",
      requestBody
    );

    if (response.status === 201) {
      const newAnalysis = response.data;
      viewAiDetails(currentAiGoalId, newAnalysis.id);
      loadAiAnalyses(currentAiGoalId, 0);
    } else {
      alert(
        "Не вдалося створити аналіз. Перевірте, чи є у вас достатньо логів."
      );
    }
  } catch (err) {
    console.error(err);
    alert("Помилка з'єднання.");
  } finally {
    setAiLoading(false);
  }
}

window.viewAiDetails = async function (goalId, analysisId) {
  try {
    const response = await request(
      `/aiAnalysis/${goalId}/analysis/${analysisId}`,
      "GET"
    );

    if (response.status === 200) {
      const data = response.data;

      document.getElementById("aiModalTitle").textContent = data.title;
      const dateObj = new Date(data.createdAt);
      document.getElementById("aiModalDate").textContent =
        dateObj.toLocaleString();

      document.getElementById("aiModalText").textContent = data.analysisText;

      const modal = new bootstrap.Modal(
        document.getElementById("aiDetailsModal")
      );
      modal.show();
    }
  } catch (e) {
    console.error(e);
    alert("Не вдалося завантажити деталі.");
  }
};

window.deleteAiAnalysis = async function (goalId, analysisId) {
  if (!confirm("Видалити цей звіт?")) return;

  try {
    const response = await request(
      `/aiAnalysis/${goalId}/analysis/${analysisId}`,
      "DELETE"
    );

    if (response.status === 204) {
      loadAiAnalyses(goalId, 0);
    } else {
      alert("Помилка видалення.");
    }
  } catch (e) {
    console.error(e);
  }
};

function renderAiPagination(pageData, goalId) {
  const nav = document.getElementById("aiPagination");
  const ul = nav.querySelector("ul");
  ul.innerHTML = "";

  if (pageData.totalPages <= 1) {
    nav.classList.add("d-none");
    return;
  }
  nav.classList.remove("d-none");

  const curr = pageData.number;

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${curr === 0 ? "disabled" : ""}`;
  prevLi.innerHTML = `<button class="page-link">&laquo;</button>`;
  prevLi.onclick = () => {
    if (curr > 0) loadAiAnalyses(goalId, curr - 1);
  };
  ul.appendChild(prevLi);

  for (let i = 0; i < pageData.totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === curr ? "active" : ""}`;
    li.innerHTML = `<button class="page-link">${i + 1}</button>`;
    li.onclick = () => {
      if (i !== curr) loadAiAnalyses(goalId, i);
    };
    ul.appendChild(li);
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    curr === pageData.totalPages - 1 ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<button class="page-link">&raquo;</button>`;
  nextLi.onclick = () => {
    if (curr < pageData.totalPages - 1) loadAiAnalyses(goalId, curr + 1);
  };
  ul.appendChild(nextLi);
}

function setAiLoading(isLoading) {
  const btn = document.getElementById("generateAiBtn");
  const spinner = document.getElementById("aiBtnSpinner");
  const text = document.getElementById("aiBtnText");

  if (isLoading) {
    btn.disabled = true;
    spinner.classList.remove("d-none");
    text.textContent = " Аналізуємо...";
  } else {
    btn.disabled = false;
    spinner.classList.add("d-none");
    text.innerHTML = '<i class="bi bi-stars"></i> Генерувати аналіз';
  }
}

window.refreshAiList = function () {
  if (currentAiGoalId) loadAiAnalyses(currentAiGoalId, 0);
};

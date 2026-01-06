// js/logs.js

const PAGE_SIZE = 10;
let currentGoalId = null;
let currentPage = 0;

document.addEventListener("DOMContentLoaded", () => {
  loadGoalsForSelector();

  const goalSelector = document.getElementById("progressGoalSelector");
  if (goalSelector) {
    goalSelector.addEventListener("change", (e) => {
      const goalId = e.target.value;
      if (goalId) {
        currentGoalId = goalId;
        currentPage = 0;

        document.getElementById("addLogBtn").disabled = false;
        loadLogs(currentGoalId, currentPage);
      }
    });
  }

  const createLogForm = document.getElementById("createLogForm");
  if (createLogForm) {
    createLogForm.addEventListener("submit", handleCreateLog);
  }
});

async function loadGoalsForSelector() {
  try {
    const response = await request("/goal/goals?size=100");
    const selector = document.getElementById("progressGoalSelector");

    if (response.status === 200) {
      const goals = response.data.content;

      if (goals.length === 0) {
        selector.innerHTML =
          "<option disabled selected>У вас ще немає цілей</option>";
        return;
      }

      selector.innerHTML =
        '<option value="" selected disabled>Оберіть ціль зі списку...</option>';
      goals.forEach((goal) => {
        const option = document.createElement("option");
        option.value = goal.id;
        option.textContent = `${goal.completed ? "✅" : "🔥"} ${goal.title}`;
        selector.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading goals:", error);
  }
}

async function loadLogs(goalId, page = 0) {
  const tableBody = document.getElementById("logsTableBody");
  const paginationNav = document.getElementById("logsPagination");

  tableBody.innerHTML =
    '<tr><td colspan="4" class="text-center">Завантаження...</td></tr>';

  try {
    const response = await request(
      `/progressLog/${goalId}/logs?page=${page}&size=${PAGE_SIZE}&sort=logTime,desc`
    );

    if (response.status === 200) {
      const pageData = response.data;
      const logs = pageData.content;

      tableBody.innerHTML = "";

      if (logs.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="4" class="text-center text-muted">Історія порожня. Додайте перший запис!</td></tr>';
        paginationNav.classList.add("d-none");
        return;
      }

      logs.forEach((log) => {
        const dateObj = new Date(log.logTime);
        const dateStr =
          dateObj.toLocaleDateString("uk-UA") +
          " " +
          dateObj.toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
          });

        const row = `
                    <tr>
                        <td class="small">${dateStr}</td>
                        <td class="fw-bold text-break" style="max-width: 200px;">${log.title}</td>
                        <td><span class="badge bg-info text-dark">${log.formattedTime}</span></td>
                        <td class="text-end">
                            <button onclick="viewLogDetails(${goalId}, ${log.progressLogId})" class="btn btn-sm btn-outline-primary me-1" title="Деталі">
                                <i class="bi bi-info-circle"></i>
                            </button>
                            <button onclick="deleteLog(${goalId}, ${log.progressLogId})" class="btn btn-sm btn-outline-danger" title="Видалити">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      renderPagination(pageData, goalId);
    }
  } catch (error) {
    console.error("Error loading logs:", error);
    tableBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-danger">Помилка завантаження</td></tr>';
  }
}

function renderPagination(pageData, goalId) {
  const paginationNav = document.getElementById("logsPagination");
  const ul = paginationNav.querySelector("ul");
  ul.innerHTML = "";

  if (pageData.totalPages <= 1) {
    paginationNav.classList.add("d-none");
    return;
  }

  paginationNav.classList.remove("d-none");

  const currentPage = pageData.number;
  const totalPages = pageData.totalPages;

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 0 ? "disabled" : ""}`;
  prevLi.innerHTML = `<button class="page-link" aria-label="Previous"><span aria-hidden="true">&laquo;</span></button>`;
  prevLi.onclick = () => {
    if (currentPage > 0) loadLogs(goalId, currentPage - 1);
  };
  ul.appendChild(prevLi);

  for (let i = 0; i < totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<button class="page-link">${i + 1}</button>`;
    li.onclick = () => {
      if (i !== currentPage) loadLogs(goalId, i);
    };
    ul.appendChild(li);
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === totalPages - 1 ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<button class="page-link" aria-label="Next"><span aria-hidden="true">&raquo;</span></button>`;
  nextLi.onclick = () => {
    if (currentPage < totalPages - 1) loadLogs(goalId, currentPage + 1);
  };
  ul.appendChild(nextLi);
}

async function handleCreateLog(e) {
  e.preventDefault();

  if (!currentGoalId) {
    alert("Будь ласка, спочатку оберіть ціль!");
    return;
  }

  const title = document.getElementById("logTitle").value.trim();
  const hours = parseInt(document.getElementById("logHours").value) || 0;
  const minutes = parseInt(document.getElementById("logMinutes").value) || 0;
  const note = document.getElementById("logNote").value.trim();

  if (hours === 0 && minutes === 0) {
    alert("Час не може бути нульовим.");
    return;
  }
  if (note.length > 0 && note.length < 20) {
    alert("Нотатка має бути мінімум 20 символів.");
    return;
  }

  const requestBody = {
    title: title,
    hours: hours,
    minutes: minutes,
    note: note || null,
  };

  try {
    const response = await request(
      `/progressLog/${currentGoalId}/log`,
      "POST",
      requestBody
    );

    if (response.status === 201) {
      document.getElementById("createLogForm").reset();
      document.getElementById("logHours").value = 0;
      document.getElementById("logMinutes").value = 30;

      loadLogs(currentGoalId, 0);
      alert("Прогрес збережено!");
    } else {
      alert("Помилка при збереженні.");
    }
  } catch (error) {
    console.error("Error creating log:", error);
  }
}

window.viewLogDetails = async function (goalId, logId) {
  try {
    const response = await request(`/progressLog/${goalId}/${logId}`, "GET");

    if (response.status === 200) {
      const details = response.data;

      document.getElementById("modalLogTitle").textContent = details.title;
      document.getElementById("modalLogTime").textContent =
        details.formattedTime;
      document.getElementById("modalLogDate").textContent = details.logTime;

      const noteEl = document.getElementById("modalLogNote");
      if (details.note) {
        noteEl.textContent = details.note;
        noteEl.classList.remove("text-muted", "fst-italic");
      } else {
        noteEl.textContent = "Нотатки відсутні";
        noteEl.classList.add("text-muted", "fst-italic");
      }

      const modal = new bootstrap.Modal(
        document.getElementById("logDetailsModal")
      );
      modal.show();
    }
  } catch (error) {
    console.error("Error details:", error);
  }
};

window.deleteLog = async function (goalId, logId) {
  if (!confirm("Видалити цей запис?")) return;

  try {
    const response = await request(`/progressLog/${goalId}/${logId}`, "DELETE");
    if (response.status === 204) {
      loadLogs(goalId, currentPage);
    } else {
      alert("Не вдалося видалити запис.");
    }
  } catch (error) {
    console.error("Error deleting log:", error);
  }
};

window.refreshLogs = function () {
  if (currentGoalId) {
    loadLogs(currentGoalId, currentPage);
  }
};

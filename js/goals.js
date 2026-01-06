document.addEventListener("DOMContentLoaded", () => {
  const goalsContainer = document.getElementById("goalsContainer");
  if (goalsContainer) {
    loadGoals();
    loadCompletedGoals();
  }
});

async function loadGoals() {
  try {
    const result = await request("/goal/goals");
    const goalsContainer = document.getElementById("goalsContainer");
    if (!goalsContainer) return;

    goalsContainer.innerHTML = "";
    const goals = result.data.content;

    if (!goals || goals.length === 0) {
      goalsContainer.innerHTML =
        '<p class="text-center mt-3">Активних цілей немає. Створіть нову!</p>';
      return;
    }

    goals.forEach((goal) => {
      const statusColor = goal.completed ? "success" : "warning";
      const statusText = goal.completed ? "Завершено" : "В процесі";

      const card = `
                <div class="col-md-6 mb-3">
                    <div class="card card-custom h-100 shadow-sm">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title d-flex justify-content-between align-items-start">
                                <div>
                                    <small class="text-secondary me-1">#${
                                      goal.id
                                    }</small>
                                    ${goal.title}
                                </div>
                                <span class="badge bg-${statusColor} text-dark ms-2">${statusText}</span>
                            </h5>
                            
                            <p class="card-text text-muted small mt-2">
                                <i class="bi bi-calendar-event"></i> Дедлайн: ${
                                  goal.deadline
                                }
                            </p>
                            
                            <p class="card-text flex-grow-1">${
                              goal.description || "Опису немає"
                            }</p>
                            
                            <div class="d-flex gap-2 mt-3">
                                <button onclick="openGoalDetails(${
                                  goal.id
                                })" class="btn btn-sm btn-primary">
                                    <i class="bi bi-eye"></i> Деталі
                                </button>
                                
                                <button onclick="completeGoal(${
                                  goal.id
                                })" class="btn btn-sm btn-success" title="Завершити">
                                    <i class="bi bi-check-lg"></i>
                                </button>

                                <button onclick="deleteGoal(${
                                  goal.id
                                })" class="btn btn-sm btn-outline-danger" title="Видалити">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      goalsContainer.insertAdjacentHTML("beforeend", card);
    });
  } catch (error) {
    console.error("Не вдалося завантажити активні цілі", error);
  }
}

async function loadCompletedGoals() {
  try {
    const result = await request("/goal/goals/completed");
    const container = document.getElementById("completedGoalsContainer");
    if (!container) return;

    container.innerHTML = "";
    const goals = result.data.content;

    if (!goals || goals.length === 0) {
      container.innerHTML =
        '<p class="text-muted text-center small">Завершених цілей поки немає.</p>';
      return;
    }

    goals.forEach((goal) => {
      const card = `
                <div class="list-group-item list-group-item-light text-muted mb-2 border-0 shadow-sm" style="background-color: #f8f9fa;">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1 text-decoration-line-through">
                            <i class="bi bi-check-circle-fill text-success"></i> 
                            <small class="text-secondary">#${goal.id}</small> ${
        goal.title
      }
                        </h6>
                        <small>Дедлайн: ${goal.deadline}</small>
                    </div>
                    <p class="mb-1 small">${
                      goal.description || "Опису немає"
                    }</p>
                    <small class="text-success fw-bold">Успішно виконано!</small>
                </div>
            `;
      container.insertAdjacentHTML("beforeend", card);
    });
  } catch (error) {
    console.error("Не вдалося завантажити завершені цілі", error);
  }
}

window.openGoalDetails = async function (goalId) {
  try {
    const modalEl = document.getElementById("goalDetailsModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const response = await request(`/goal/${goalId}`, "GET");

    if (response.status === 200) {
      renderGoalDetails(response.data);
    } else {
      alert("Не вдалося завантажити деталі.");
    }
  } catch (error) {
    console.error("Error details:", error);
  }
};

function renderGoalDetails(goal) {
  document.getElementById(
    "detailGoalTitle"
  ).textContent = `#${goal.id} ${goal.title}`;

  document.getElementById("detailGoalDescription").textContent =
    goal.description || "Без опису";
  document.getElementById("detailDifficulty").textContent =
    goal.difficulty || "NORMAL";
  document.getElementById("detailDeadline").textContent = goal.deadline;

  const listContainer = document.getElementById("subgoalsList");
  listContainer.innerHTML = "";

  if (!goal.subgoals || goal.subgoals.length === 0) {
    listContainer.innerHTML =
      '<p class="text-center text-muted">Підцілей немає.</p>';
    return;
  }

  const sortedSubgoals = goal.subgoals.sort(
    (a, b) => a.completed - b.completed
  );

  sortedSubgoals.forEach((sub) => {
    const isDone = sub.completed;
    const itemClass = isDone ? "list-group-item-success" : "";
    const btnHtml = isDone
      ? `<span class="badge bg-success"><i class="bi bi-check-lg"></i> Виконано</span>`
      : `<button onclick="markSubgoalDone(${sub.id}, ${goal.id})" class="btn btn-sm btn-outline-primary">Завершити</button>`;

    const html = `
            <div class="list-group-item ${itemClass} d-flex justify-content-between align-items-center">
                <div class="ms-2 me-auto">
                    <div class="fw-bold ${
                      isDone ? "text-decoration-line-through" : ""
                    }">
                        <small class="text-muted me-1">#${sub.id}</small> ${
      sub.title
    }
                    </div>
                    <small class="text-muted">${sub.description || ""}</small>
                </div>
                <div class="ms-3">
                    ${btnHtml}
                </div>
            </div>
        `;
    listContainer.insertAdjacentHTML("beforeend", html);
  });
}

window.markSubgoalDone = async function (subgoalId, parentGoalId) {
  try {
    const response = await request(`/subgoal/${subgoalId}`, "PATCH");

    if (response.status === 200) {
      const updatedGoalResponse = await request(`/goal/${parentGoalId}`, "GET");

      if (updatedGoalResponse.status === 200) {
        const goalData = updatedGoalResponse.data;
        renderGoalDetails(goalData);

        if (goalData.completed) {
          loadGoals();
          loadCompletedGoals();
        }
      }
    } else {
      alert("Помилка при завершенні підцілі.");
    }
  } catch (error) {
    console.error("Error completing subgoal:", error);
  }
};

window.completeGoal = async function (id) {
  if (!confirm("Ви впевнені, що хочете завершити цю ціль?")) {
    return;
  }

  try {
    const response = await request(`/goal/${id}/completed`, "PATCH");

    if (response.status === 200) {
      loadGoals();
      loadCompletedGoals();
    } else {
      alert("Не вдалося завершити ціль. Спробуйте пізніше.");
    }
  } catch (error) {
    console.error("Error completing goal:", error);
    alert("Сталася помилка з'єднання.");
  }
};

window.deleteGoal = async function (id) {
  if (confirm("Видалити ціль безповоротно?")) {
    await request(`/goal/${id}`, "DELETE");
    loadGoals();
    loadCompletedGoals();
  }
};

const createGoalBtn = document.getElementById("createGoalBtn");
if (createGoalBtn) {
  createGoalBtn.addEventListener("click", async () => {
    const title = document.getElementById("goalTitle").value.trim();
    const prompt = document.getElementById("goalPrompt").value.trim();
    const deadline = document.getElementById("goalDeadline").value;
    const hoursInput = document.getElementById("goalHours").value;
    const hoursPerWeek = parseInt(hoursInput);

    if (title.length < 10 || title.length > 100) {
      alert("Назва цілі має бути від 10 до 100 символів.");
      return;
    }
    if (prompt.length < 10 || prompt.length > 200) {
      alert("Промпт має бути від 10 до 200 символів.");
      return;
    }
    if (!deadline) {
      alert("Будь ласка, вкажіть дедлайн.");
      return;
    }
    if (!hoursPerWeek || hoursPerWeek < 1 || hoursPerWeek > 100) {
      alert("Кількість годин на тиждень має бути від 1 до 100.");
      return;
    }

    setLoadingState(true);
    try {
      const response = await request("/goal/create", "POST", {
        title: title,
        prompt: prompt,
        deadline: deadline,
        hoursPerWeek: hoursPerWeek,
      });
      if (response.status === 201) {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("createGoalModal")
        );
        modal.hide();
        document.getElementById("createGoalForm").reset();

        alert("Ціль створено! AI генерує план...");
        loadGoals();
      } else {
        alert("Помилка створення. Перевірте дані.");
      }
    } catch (e) {
      console.error(e);
      alert("Помилка з'єднання.");
    } finally {
      setLoadingState(false);
    }
  });
}

function setLoadingState(isLoading) {
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  const btn = document.getElementById("createGoalBtn");
  if (isLoading) {
    btnText.textContent = "AI генерує...";
    btnSpinner.classList.remove("d-none");
    btn.disabled = true;
  } else {
    btnText.textContent = "Створити";
    btnSpinner.classList.add("d-none");
    btn.disabled = false;
  }
}

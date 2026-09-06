const STORAGE_KEY = "monthly-task-planner-state";

const nameInput = document.getElementById("person-name");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const summaryCard = document.getElementById("summary-card");
const summaryText = document.getElementById("summary-text");
const progressFill = document.getElementById("progress-fill");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: "", tasks: [] };
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || "",
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return { name: "", tasks: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function render() {
  nameInput.value = state.name;

  taskList.innerHTML = "";
  emptyState.hidden = state.tasks.length > 0;

  state.tasks.forEach((task) => {
    const row = document.createElement("tr");

    const taskCell = document.createElement("td");
    taskCell.className = "task-cell";
    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;
    taskCell.appendChild(taskText);
    row.appendChild(taskCell);

    let allWeeksDone = true;
    for (let week = 1; week <= 4; week++) {
      const cell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(task.weeks[week - 1]);
      checkbox.setAttribute("aria-label", `${task.text} - Week ${week}`);
      checkbox.addEventListener("change", () => {
        task.weeks[week - 1] = checkbox.checked;
        saveState();
        render();
      });
      if (!checkbox.checked) allWeeksDone = false;
      cell.appendChild(checkbox);
      row.appendChild(cell);
    }
    taskText.classList.toggle("done", allWeeksDone);

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Delete "${task.text}"`);
    deleteBtn.addEventListener("click", () => {
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      saveState();
      render();
    });
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    taskList.appendChild(row);
  });

  renderSummary();
}

function renderSummary() {
  const totalTasks = state.tasks.length;
  if (totalTasks === 0) {
    summaryCard.hidden = true;
    return;
  }
  const totalCells = totalTasks * 4;
  const checkedCells = state.tasks.reduce(
    (sum, task) => sum + task.weeks.filter(Boolean).length,
    0
  );
  const percent = Math.round((checkedCells / totalCells) * 100);
  const namePart = state.name ? `${state.name}'s` : "Your";
  summaryText.textContent = `${namePart} progress: ${checkedCells} of ${totalCells} weekly check-ins complete (${percent}%)`;
  progressFill.style.width = `${percent}%`;
  summaryCard.hidden = false;
}

nameInput.addEventListener("input", () => {
  state.name = nameInput.value;
  saveState();
  renderSummary();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  state.tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text,
    weeks: [false, false, false, false],
  });
  taskInput.value = "";
  saveState();
  render();
});

render();

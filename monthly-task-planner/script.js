const STORAGE_KEY = "monthly-task-planner-state";

const nameInput = document.getElementById("person-name");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const summaryCard = document.getElementById("summary-card");
const summaryText = document.getElementById("summary-text");
const progressFill = document.getElementById("progress-fill");

// Task ids whose "add subtask" inline form is currently open (not persisted).
const openSubtaskForms = new Set();

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeTask(text) {
  return { id: makeId(), text, weeks: [false, false, false, false], subtasks: [] };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: "", tasks: [] };
    const parsed = JSON.parse(raw);
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    tasks.forEach((task) => {
      if (!Array.isArray(task.subtasks)) task.subtasks = [];
    });
    return { name: parsed.name || "", tasks };
  } catch {
    return { name: "", tasks: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function buildWeekCells(row, item, onChange) {
  let allWeeksDone = true;
  for (let week = 1; week <= 4; week++) {
    const cell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(item.weeks[week - 1]);
    checkbox.setAttribute("aria-label", `${item.text} - Week ${week}`);
    checkbox.addEventListener("change", () => {
      item.weeks[week - 1] = checkbox.checked;
      onChange();
    });
    if (!checkbox.checked) allWeeksDone = false;
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  return allWeeksDone;
}

function buildDeleteButton(label, onDelete) {
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", label);
  deleteBtn.addEventListener("click", onDelete);
  return deleteBtn;
}

function renderTaskRow(task) {
  const row = document.createElement("tr");

  const taskCell = document.createElement("td");
  taskCell.className = "task-cell";

  const taskText = document.createElement("span");
  taskText.className = "task-text";
  taskText.textContent = task.text;
  taskCell.appendChild(taskText);

  const addSubtaskBtn = document.createElement("button");
  addSubtaskBtn.type = "button";
  addSubtaskBtn.className = "add-subtask-btn";
  addSubtaskBtn.textContent = "+ Subtask";
  addSubtaskBtn.setAttribute("aria-label", `Add subtask to "${task.text}"`);
  addSubtaskBtn.addEventListener("click", () => {
    if (openSubtaskForms.has(task.id)) {
      openSubtaskForms.delete(task.id);
    } else {
      openSubtaskForms.add(task.id);
    }
    render();
  });
  taskCell.appendChild(addSubtaskBtn);

  row.appendChild(taskCell);

  const allWeeksDone = buildWeekCells(row, task, () => {
    saveState();
    render();
  });
  taskText.classList.toggle("done", allWeeksDone);

  const actionCell = document.createElement("td");
  actionCell.appendChild(
    buildDeleteButton(`Delete "${task.text}"`, () => {
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      openSubtaskForms.delete(task.id);
      saveState();
      render();
    })
  );
  row.appendChild(actionCell);

  return row;
}

function renderSubtaskRow(task, subtask) {
  const row = document.createElement("tr");
  row.className = "subtask-row";

  const taskCell = document.createElement("td");
  taskCell.className = "task-cell subtask-cell";
  const taskText = document.createElement("span");
  taskText.className = "task-text";
  taskText.textContent = subtask.text;
  taskCell.appendChild(taskText);
  row.appendChild(taskCell);

  const allWeeksDone = buildWeekCells(row, subtask, () => {
    saveState();
    render();
  });
  taskText.classList.toggle("done", allWeeksDone);

  const actionCell = document.createElement("td");
  actionCell.appendChild(
    buildDeleteButton(`Delete "${subtask.text}"`, () => {
      task.subtasks = task.subtasks.filter((s) => s.id !== subtask.id);
      saveState();
      render();
    })
  );
  row.appendChild(actionCell);

  return row;
}

function renderAddSubtaskFormRow(task) {
  const row = document.createElement("tr");
  row.className = "subtask-row";

  const cell = document.createElement("td");
  cell.colSpan = 6;

  const form = document.createElement("form");
  form.className = "subtask-form";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Subtask name";
  input.required = true;
  form.appendChild(input);

  const addBtn = document.createElement("button");
  addBtn.type = "submit";
  addBtn.textContent = "Add";
  form.appendChild(addBtn);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    task.subtasks.push(makeTask(text));
    saveState();
    render();
  });

  cell.appendChild(form);
  row.appendChild(cell);
  return row;
}

function render() {
  nameInput.value = state.name;

  taskList.innerHTML = "";
  emptyState.hidden = state.tasks.length > 0;

  state.tasks.forEach((task) => {
    taskList.appendChild(renderTaskRow(task));
    task.subtasks.forEach((subtask) => {
      taskList.appendChild(renderSubtaskRow(task, subtask));
    });
    if (openSubtaskForms.has(task.id)) {
      taskList.appendChild(renderAddSubtaskFormRow(task));
    }
  });

  renderSummary();
}

function renderSummary() {
  let totalCells = 0;
  let checkedCells = 0;
  state.tasks.forEach((task) => {
    totalCells += 4;
    checkedCells += task.weeks.filter(Boolean).length;
    task.subtasks.forEach((subtask) => {
      totalCells += 4;
      checkedCells += subtask.weeks.filter(Boolean).length;
    });
  });

  if (totalCells === 0) {
    summaryCard.hidden = true;
    return;
  }
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
  state.tasks.push(makeTask(text));
  taskInput.value = "";
  saveState();
  render();
});

render();

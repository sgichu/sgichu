const STORAGE_KEY = "monthly-task-planner-state";

const nameInput = document.getElementById("person-name");
const monthLabel = document.getElementById("month-label");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const headerRow = document.getElementById("header-row");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const summaryCard = document.getElementById("summary-card");
const summaryText = document.getElementById("summary-text");
const progressFill = document.getElementById("progress-fill");
const journalDateSelect = document.getElementById("journal-date");
const journalBrainDump = document.getElementById("journal-braindump");
const promptGroups = document.getElementById("prompt-groups");
const cadenceButtons = document.querySelectorAll(".cadence-btn");

const resetFields = {
  vision: document.getElementById("reset-vision"),
  goals: document.getElementById("reset-goals"),
  improve: document.getElementById("reset-improve"),
  forward: document.getElementById("reset-forward"),
  habit: document.getElementById("reset-habit"),
};

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

const PROMPT_LIBRARY = [
  { cadence: "daily", category: "Gratitude", text: "Today I am grateful for…" },
  { cadence: "daily", category: "Gratitude", text: "Today I accomplished…" },
  { cadence: "daily", category: "Gratitude", text: "Tomorrow I want to focus on…" },
  { cadence: "daily", category: "Mindset", text: "What's one thought I want to let go of today?" },
  { cadence: "daily", category: "Mindset", text: "What's something I'm proud of from today?" },
  { cadence: "daily", category: "Relationships", text: "Who made my day better, and why?" },
  { cadence: "daily", category: "Relationships", text: "Is there a message I've been meaning to send?" },
  { cadence: "daily", category: "Finances", text: "Did I stick to my spending plan today?" },
  { cadence: "daily", category: "Finances", text: "What's one dollar I spent well today?" },
  { cadence: "daily", category: "Career", text: "What's one thing I moved forward at work today?" },
  { cadence: "daily", category: "Career", text: "What slowed me down today, and why?" },
  { cadence: "daily", category: "Self-growth", text: "What did I learn about myself today?" },
  { cadence: "daily", category: "Self-growth", text: "What's one small win I can celebrate?" },

  { cadence: "weekly", category: "Mindset", text: "What mindset shift do I need heading into next week?" },
  { cadence: "weekly", category: "Mindset", text: "What's draining my energy lately?" },
  { cadence: "weekly", category: "Relationships", text: "Who do I want to make time for this week?" },
  { cadence: "weekly", category: "Relationships", text: "What relationship deserves more honesty from me?" },
  { cadence: "weekly", category: "Finances", text: "How did my spending align with my values this week?" },
  { cadence: "weekly", category: "Finances", text: "What financial goal needs attention this week?" },
  { cadence: "weekly", category: "Career", text: "What's the biggest lesson from this week at work?" },
  { cadence: "weekly", category: "Career", text: "What do I want to accomplish next week?" },
  { cadence: "weekly", category: "Self-growth", text: "What pattern did I notice in myself this week?" },
  { cadence: "weekly", category: "Self-growth", text: "What's one habit I want to strengthen next week?" },
];

let currentCadence = "daily";

// Task ids whose "add subtask" inline form is currently open (not persisted).
const openSubtaskForms = new Set();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getMonthInfo(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthKey = `${year}-${pad2(month + 1)}`;
  const monthLabelText = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = `${year}-${pad2(month + 1)}-${pad2(date.getDate())}`;
  return { year, month, daysInMonth, monthKey, monthLabelText, todayKey, todayDate: date.getDate() };
}

function dayKey(monthKey, day) {
  return `${monthKey}-${pad2(day)}`;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeTask(text, daysInMonth) {
  return { id: makeId(), text, days: new Array(daysInMonth).fill(false), subtasks: [] };
}

function emptyMonthlyReset() {
  return { vision: "", goals: "", improve: "", forward: "", habit: "" };
}

function emptyJournalEntry() {
  return { brainDump: "" };
}

let monthInfo = getMonthInfo();

function freshState() {
  return { name: "", monthKey: monthInfo.monthKey, monthlyReset: emptyMonthlyReset(), tasks: [], journal: {} };
}

function loadState() {
  let state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : freshState();
  } catch {
    state = freshState();
  }

  if (!state.monthKey) state.monthKey = monthInfo.monthKey;
  if (!Array.isArray(state.tasks)) state.tasks = [];
  if (typeof state.journal !== "object" || state.journal === null) state.journal = {};
  if (typeof state.monthlyReset !== "object" || state.monthlyReset === null) {
    state.monthlyReset = emptyMonthlyReset();
  }

  // A new month resets the sheet, reset notes, and journal; the name carries over.
  if (state.monthKey !== monthInfo.monthKey) {
    state = { name: state.name || "", monthKey: monthInfo.monthKey, monthlyReset: emptyMonthlyReset(), tasks: [], journal: {} };
  } else {
    state.tasks.forEach((task) => normalizeTask(task));
    Object.keys(emptyMonthlyReset()).forEach((key) => {
      if (typeof state.monthlyReset[key] !== "string") state.monthlyReset[key] = "";
    });
  }

  return state;
}

function normalizeTask(task) {
  if (!Array.isArray(task.days) || task.days.length !== monthInfo.daysInMonth) {
    const old = Array.isArray(task.days) ? task.days : [];
    task.days = new Array(monthInfo.daysInMonth).fill(false).map((v, i) => Boolean(old[i]));
  }
  if (!Array.isArray(task.subtasks)) task.subtasks = [];
  task.subtasks.forEach((subtask) => normalizeTask(subtask));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
saveState();

function renderHeader() {
  headerRow.innerHTML = "";

  const taskTh = document.createElement("th");
  taskTh.className = "task-col";
  taskTh.textContent = "Goal";
  headerRow.appendChild(taskTh);

  for (let day = 1; day <= monthInfo.daysInMonth; day++) {
    const th = document.createElement("th");
    th.className = "day-col";
    if (day === monthInfo.todayDate) th.classList.add("today-col");
    const weekday = new Date(monthInfo.year, monthInfo.month, day).getDay();
    th.innerHTML = `<span class="day-num">${day}</span><span class="day-dow">${WEEKDAY_LETTERS[weekday]}</span>`;
    headerRow.appendChild(th);
  }

  const actionTh = document.createElement("th");
  actionTh.className = "action-col";
  headerRow.appendChild(actionTh);
}

function buildDayCells(row, item, onChange) {
  let allDone = true;
  for (let day = 1; day <= monthInfo.daysInMonth; day++) {
    const cell = document.createElement("td");
    cell.className = "day-cell";
    if (day === monthInfo.todayDate) cell.classList.add("today-col");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(item.days[day - 1]);
    checkbox.setAttribute("aria-label", `${item.text} - Day ${day}`);
    checkbox.addEventListener("change", () => {
      item.days[day - 1] = checkbox.checked;
      onChange();
    });
    if (!checkbox.checked) allDone = false;
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  return allDone;
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

  const allDaysDone = buildDayCells(row, task, () => {
    saveState();
    render();
  });
  taskText.classList.toggle("done", allDaysDone);

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

  const allDaysDone = buildDayCells(row, subtask, () => {
    saveState();
    render();
  });
  taskText.classList.toggle("done", allDaysDone);

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
  cell.colSpan = monthInfo.daysInMonth + 2;

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
    task.subtasks.push(makeTask(text, monthInfo.daysInMonth));
    saveState();
    render();
  });

  cell.appendChild(form);
  row.appendChild(cell);
  return row;
}

function renderPrompts() {
  promptGroups.innerHTML = "";

  const byCategory = new Map();
  PROMPT_LIBRARY.filter((p) => p.cadence === currentCadence).forEach((prompt) => {
    if (!byCategory.has(prompt.category)) byCategory.set(prompt.category, []);
    byCategory.get(prompt.category).push(prompt.text);
  });

  byCategory.forEach((prompts, category) => {
    const group = document.createElement("div");
    group.className = "prompt-category";

    const heading = document.createElement("h3");
    heading.className = "prompt-category-title";
    heading.textContent = category;
    group.appendChild(heading);

    const list = document.createElement("div");
    list.className = "prompt-chip-list";
    prompts.forEach((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "prompt-chip";
      chip.textContent = text;
      chip.addEventListener("click", () => insertPrompt(text));
      list.appendChild(chip);
    });
    group.appendChild(list);

    promptGroups.appendChild(group);
  });
}

function insertPrompt(text) {
  const entry = currentJournalEntry();
  const trimmed = entry.brainDump.replace(/\n+$/, "");
  const prefix = trimmed ? "\n\n" : "";
  entry.brainDump = `${trimmed}${prefix}${text}\n`;
  journalBrainDump.value = entry.brainDump;
  journalBrainDump.focus();
  journalBrainDump.scrollTop = journalBrainDump.scrollHeight;
  saveState();
}

function render() {
  nameInput.value = state.name;
  monthLabel.textContent = `${monthInfo.monthLabelText} — tap a day to mark it done.`;

  Object.keys(resetFields).forEach((key) => {
    resetFields[key].value = state.monthlyReset[key] || "";
  });

  renderHeader();

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
  renderPrompts();
  renderJournalDateOptions();
  renderJournalEntry();
}

function renderSummary() {
  let totalCells = 0;
  let checkedCells = 0;

  function tally(item) {
    totalCells += monthInfo.daysInMonth;
    checkedCells += item.days.filter(Boolean).length;
    item.subtasks.forEach(tally);
  }
  state.tasks.forEach(tally);

  if (totalCells === 0) {
    summaryCard.hidden = true;
    return;
  }
  const percent = Math.round((checkedCells / totalCells) * 100);
  const namePart = state.name ? `${state.name}'s` : "Your";
  summaryText.textContent = `${namePart} progress: ${checkedCells} of ${totalCells} daily check-ins complete (${percent}%)`;
  progressFill.style.width = `${percent}%`;
  summaryCard.hidden = false;
}

function renderJournalDateOptions() {
  const previouslySelected = journalDateSelect.value;
  journalDateSelect.innerHTML = "";
  for (let day = 1; day <= monthInfo.daysInMonth; day++) {
    const key = dayKey(monthInfo.monthKey, day);
    const option = document.createElement("option");
    option.value = key;
    const weekday = new Date(monthInfo.year, monthInfo.month, day).toLocaleDateString(undefined, { weekday: "short" });
    option.textContent = `${weekday} ${day}${day === monthInfo.todayDate ? " (Today)" : ""}`;
    journalDateSelect.appendChild(option);
  }
  journalDateSelect.value = previouslySelected || monthInfo.todayKey;
}

function currentJournalEntry() {
  const key = journalDateSelect.value || monthInfo.todayKey;
  if (!state.journal[key]) state.journal[key] = emptyJournalEntry();
  if (typeof state.journal[key].brainDump !== "string") state.journal[key].brainDump = "";
  return state.journal[key];
}

function renderJournalEntry() {
  journalBrainDump.value = currentJournalEntry().brainDump;
}

nameInput.addEventListener("input", () => {
  state.name = nameInput.value;
  saveState();
  renderSummary();
});

Object.keys(resetFields).forEach((key) => {
  resetFields[key].addEventListener("input", () => {
    state.monthlyReset[key] = resetFields[key].value;
    saveState();
  });
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  state.tasks.push(makeTask(text, monthInfo.daysInMonth));
  taskInput.value = "";
  saveState();
  render();
});

cadenceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentCadence = btn.dataset.cadence;
    cadenceButtons.forEach((b) => b.classList.toggle("active", b === btn));
    renderPrompts();
  });
});

journalDateSelect.addEventListener("change", () => {
  renderJournalEntry();
});

journalBrainDump.addEventListener("input", () => {
  currentJournalEntry().brainDump = journalBrainDump.value;
  saveState();
});

function checkForMonthChange() {
  const freshInfo = getMonthInfo();
  if (freshInfo.monthKey !== monthInfo.monthKey) {
    monthInfo = freshInfo;
    state = { name: state.name, monthKey: monthInfo.monthKey, monthlyReset: emptyMonthlyReset(), tasks: [], journal: {} };
    saveState();
    render();
  }
}

// Catches the month rolling over while the page stays open.
setInterval(checkForMonthChange, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkForMonthChange();
});

render();

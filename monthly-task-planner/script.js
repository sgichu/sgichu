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

const quarterLabel = document.getElementById("quarter-label");
const qTaskForm = document.getElementById("qtask-form");
const qTaskInput = document.getElementById("qtask-input");
const qHeaderRow = document.getElementById("qheader-row");
const qTaskList = document.getElementById("qtask-list");
const qEmptyState = document.getElementById("qempty-state");
const qSummaryCard = document.getElementById("qsummary-card");
const qSummaryText = document.getElementById("qsummary-text");
const qProgressFill = document.getElementById("qprogress-fill");

document.getElementById("copyright-year").textContent = new Date().getFullYear();

const resetFields = {
  vision: document.getElementById("reset-vision"),
  goals: document.getElementById("reset-goals"),
  improve: document.getElementById("reset-improve"),
  forward: document.getElementById("reset-forward"),
  habit: document.getElementById("reset-habit"),
};

const qResetFields = {
  vision: document.getElementById("qreset-vision"),
  goals: document.getElementById("qreset-goals"),
  milestones: document.getElementById("qreset-milestones"),
  risks: document.getElementById("qreset-risks"),
  habit: document.getElementById("qreset-habit"),
};

const themePicker = document.getElementById("theme-picker");

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Accent color is a per-browser display preference, not part of the monthly
// state — it isn't reset when the month rolls over.
const ACCENT_STORAGE_KEY = "monthly-task-planner-accent";
const ACCENTS = [
  { id: "indigo", label: "Classic", swatch: "#4f46e5" },
  { id: "teal", label: "Calm", swatch: "#0f8a7c" },
  { id: "rose", label: "Bold", swatch: "#d1477a" },
  { id: "amber", label: "Sunny", swatch: "#b5730b" },
  { id: "violet", label: "Dreamy", swatch: "#7c3fbf" },
  { id: "slate", label: "Minimal", swatch: "#3f4756" },
];

function initThemePicker() {
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY) || "indigo";
  document.documentElement.dataset.accent = saved;

  ACCENTS.forEach((accent) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-swatch" + (accent.id === saved ? " active" : "");
    btn.style.setProperty("--swatch-color", accent.swatch);
    btn.title = accent.label;
    btn.setAttribute("aria-label", `${accent.label} accent color`);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(accent.id === saved));
    btn.addEventListener("click", () => {
      localStorage.setItem(ACCENT_STORAGE_KEY, accent.id);
      document.documentElement.dataset.accent = accent.id;
      themePicker.querySelectorAll(".theme-swatch").forEach((el) => {
        el.classList.remove("active");
        el.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
    });
    themePicker.appendChild(btn);
  });
}

initThemePicker();

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
const openQuarterSubtaskForms = new Set();

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

function daysBetween(a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

function getQuarterInfo(date = new Date()) {
  const year = date.getFullYear();
  const quarterIndex = Math.floor(date.getMonth() / 3); // 0-3
  const startMonth = quarterIndex * 3;
  const quarterStart = new Date(year, startMonth, 1);
  const quarterEnd = new Date(year, startMonth + 3, 0);
  const daysInQuarter = daysBetween(quarterStart, quarterEnd) + 1;
  const weeksInQuarter = Math.ceil(daysInQuarter / 7);
  const todayOffsetDays = daysBetween(quarterStart, date);
  const todayWeek = Math.min(weeksInQuarter, Math.floor(todayOffsetDays / 7) + 1);
  const quarterKey = `${year}-Q${quarterIndex + 1}`;
  const startLabel = quarterStart.toLocaleDateString(undefined, { month: "short" });
  const endLabel = quarterEnd.toLocaleDateString(undefined, { month: "short" });
  const quarterLabelText = `Q${quarterIndex + 1} ${year} (${startLabel}–${endLabel})`;
  return { year, quarterIndex, weeksInQuarter, todayWeek, quarterKey, quarterLabelText };
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeTask(text, daysInMonth) {
  return { id: makeId(), text, days: new Array(daysInMonth).fill(false), subtasks: [] };
}

function makeQuarterTask(text, weeksInQuarter) {
  return { id: makeId(), text, weeks: new Array(weeksInQuarter).fill(false), subtasks: [] };
}

function emptyMonthlyReset() {
  return { vision: "", goals: "", improve: "", forward: "", habit: "" };
}

function emptyQuarterlyReset() {
  return { vision: "", goals: "", milestones: "", risks: "", habit: "" };
}

function emptyJournalEntry() {
  return { brainDump: "" };
}

let monthInfo = getMonthInfo();
let quarterInfo = getQuarterInfo();

function freshState() {
  return {
    name: "",
    monthKey: monthInfo.monthKey,
    monthlyReset: emptyMonthlyReset(),
    tasks: [],
    journal: {},
    quarterKey: quarterInfo.quarterKey,
    quarterlyReset: emptyQuarterlyReset(),
    quarterlyTasks: [],
  };
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
  if (!state.quarterKey) state.quarterKey = quarterInfo.quarterKey;
  if (!Array.isArray(state.quarterlyTasks)) state.quarterlyTasks = [];
  if (typeof state.quarterlyReset !== "object" || state.quarterlyReset === null) {
    state.quarterlyReset = emptyQuarterlyReset();
  }

  // A new month resets the sheet, reset notes, and journal; a new quarter
  // resets the quarterly goals and reset notes — independently of each
  // other. The name always carries over.
  if (state.monthKey !== monthInfo.monthKey) {
    state.monthKey = monthInfo.monthKey;
    state.monthlyReset = emptyMonthlyReset();
    state.tasks = [];
    state.journal = {};
  } else {
    state.tasks.forEach((task) => normalizeTask(task));
    Object.keys(emptyMonthlyReset()).forEach((key) => {
      if (typeof state.monthlyReset[key] !== "string") state.monthlyReset[key] = "";
    });
  }

  if (state.quarterKey !== quarterInfo.quarterKey) {
    state.quarterKey = quarterInfo.quarterKey;
    state.quarterlyReset = emptyQuarterlyReset();
    state.quarterlyTasks = [];
  } else {
    state.quarterlyTasks.forEach((task) => normalizeQuarterTask(task));
    Object.keys(emptyQuarterlyReset()).forEach((key) => {
      if (typeof state.quarterlyReset[key] !== "string") state.quarterlyReset[key] = "";
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

function normalizeQuarterTask(task) {
  if (!Array.isArray(task.weeks) || task.weeks.length !== quarterInfo.weeksInQuarter) {
    const old = Array.isArray(task.weeks) ? task.weeks : [];
    task.weeks = new Array(quarterInfo.weeksInQuarter).fill(false).map((v, i) => Boolean(old[i]));
  }
  if (!Array.isArray(task.subtasks)) task.subtasks = [];
  task.subtasks.forEach((subtask) => normalizeQuarterTask(subtask));
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

function renderQuarterHeader() {
  qHeaderRow.innerHTML = "";

  const taskTh = document.createElement("th");
  taskTh.className = "task-col";
  taskTh.textContent = "Goal";
  qHeaderRow.appendChild(taskTh);

  for (let week = 1; week <= quarterInfo.weeksInQuarter; week++) {
    const th = document.createElement("th");
    th.className = "day-col";
    if (week === quarterInfo.todayWeek) th.classList.add("today-col");
    th.innerHTML = `<span class="day-num">${week}</span><span class="day-dow">WK</span>`;
    qHeaderRow.appendChild(th);
  }

  const actionTh = document.createElement("th");
  actionTh.className = "action-col";
  qHeaderRow.appendChild(actionTh);
}

function buildWeekCells(row, item, onChange) {
  let allDone = true;
  for (let week = 1; week <= quarterInfo.weeksInQuarter; week++) {
    const cell = document.createElement("td");
    cell.className = "day-cell";
    if (week === quarterInfo.todayWeek) cell.classList.add("today-col");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(item.weeks[week - 1]);
    checkbox.setAttribute("aria-label", `${item.text} - Week ${week}`);
    checkbox.addEventListener("change", () => {
      item.weeks[week - 1] = checkbox.checked;
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

function renderQuarterTaskRow(task) {
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
    if (openQuarterSubtaskForms.has(task.id)) {
      openQuarterSubtaskForms.delete(task.id);
    } else {
      openQuarterSubtaskForms.add(task.id);
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
      state.quarterlyTasks = state.quarterlyTasks.filter((t) => t.id !== task.id);
      openQuarterSubtaskForms.delete(task.id);
      saveState();
      render();
    })
  );
  row.appendChild(actionCell);

  return row;
}

function renderQuarterSubtaskRow(task, subtask) {
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

function renderAddQuarterSubtaskFormRow(task) {
  const row = document.createElement("tr");
  row.className = "subtask-row";

  const cell = document.createElement("td");
  cell.colSpan = quarterInfo.weeksInQuarter + 2;

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
    task.subtasks.push(makeQuarterTask(text, quarterInfo.weeksInQuarter));
    saveState();
    render();
  });

  cell.appendChild(form);
  row.appendChild(cell);
  return row;
}

function renderQuarterSummary() {
  let totalCells = 0;
  let checkedCells = 0;

  function tally(item) {
    totalCells += quarterInfo.weeksInQuarter;
    checkedCells += item.weeks.filter(Boolean).length;
    item.subtasks.forEach(tally);
  }
  state.quarterlyTasks.forEach(tally);

  if (totalCells === 0) {
    qSummaryCard.hidden = true;
    return;
  }
  const percent = Math.round((checkedCells / totalCells) * 100);
  const namePart = state.name ? `${state.name}'s` : "Your";
  qSummaryText.textContent = `${namePart} quarter progress: ${checkedCells} of ${totalCells} weekly check-ins complete (${percent}%)`;
  qProgressFill.style.width = `${percent}%`;
  qSummaryCard.hidden = false;
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
  quarterLabel.textContent = `${quarterInfo.quarterLabelText} — fill this in once to set the direction, then revisit anytime.`;

  Object.keys(resetFields).forEach((key) => {
    resetFields[key].value = state.monthlyReset[key] || "";
  });
  Object.keys(qResetFields).forEach((key) => {
    qResetFields[key].value = state.quarterlyReset[key] || "";
  });

  renderHeader();
  renderQuarterHeader();

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

  qTaskList.innerHTML = "";
  qEmptyState.hidden = state.quarterlyTasks.length > 0;

  state.quarterlyTasks.forEach((task) => {
    qTaskList.appendChild(renderQuarterTaskRow(task));
    task.subtasks.forEach((subtask) => {
      qTaskList.appendChild(renderQuarterSubtaskRow(task, subtask));
    });
    if (openQuarterSubtaskForms.has(task.id)) {
      qTaskList.appendChild(renderAddQuarterSubtaskFormRow(task));
    }
  });

  renderSummary();
  renderQuarterSummary();
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
  renderQuarterSummary();
});

Object.keys(resetFields).forEach((key) => {
  resetFields[key].addEventListener("input", () => {
    state.monthlyReset[key] = resetFields[key].value;
    saveState();
  });
});

Object.keys(qResetFields).forEach((key) => {
  qResetFields[key].addEventListener("input", () => {
    state.quarterlyReset[key] = qResetFields[key].value;
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

qTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = qTaskInput.value.trim();
  if (!text) return;
  state.quarterlyTasks.push(makeQuarterTask(text, quarterInfo.weeksInQuarter));
  qTaskInput.value = "";
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
    state.monthKey = monthInfo.monthKey;
    state.monthlyReset = emptyMonthlyReset();
    state.tasks = [];
    state.journal = {};
    saveState();
    render();
  }
}

function checkForQuarterChange() {
  const freshInfo = getQuarterInfo();
  if (freshInfo.quarterKey !== quarterInfo.quarterKey) {
    quarterInfo = freshInfo;
    state.quarterKey = quarterInfo.quarterKey;
    state.quarterlyReset = emptyQuarterlyReset();
    state.quarterlyTasks = [];
    saveState();
    render();
  }
}

// Catches the month or quarter rolling over while the page stays open.
setInterval(() => {
  checkForMonthChange();
  checkForQuarterChange();
}, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkForMonthChange();
    checkForQuarterChange();
  }
});

render();

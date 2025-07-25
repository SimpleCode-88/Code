// == LocalStorage Keys ==
const WORK_MINUTES_KEY = 'pomodoroWorkMinutes';
const BREAK_MINUTES_KEY = 'pomodoroBreakMinutes';
const CYCLE_LENGTH_KEY = 'pomodoroCycleLength';
const LONG_BREAK_MINUTES_KEY = 'pomodoroLongBreakMinutes';
const TASKS_KEY = 'engagePomodoroTasks';

// == Helpers: Safe Get/Set localStorage ==
function safeLocalStorageGetItem(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}
function getWorkMinutes() {
  return Number(safeLocalStorageGetItem(WORK_MINUTES_KEY, '30'));
}
function getBreakMinutes() {
  return Number(safeLocalStorageGetItem(BREAK_MINUTES_KEY, '5'));
}
function setWorkMinutes(val) {
  try { localStorage.setItem(WORK_MINUTES_KEY, String(val)); } catch {}
}
function setBreakMinutes(val) {
  try { localStorage.setItem(BREAK_MINUTES_KEY, String(val)); } catch {}
}
function getCycleLength() {
  return Number(safeLocalStorageGetItem(CYCLE_LENGTH_KEY, '4'));
}
function setCycleLength(val) {
  try { localStorage.setItem(CYCLE_LENGTH_KEY, String(val)); } catch {}
}
function getLongBreakMinutes() {
  return Number(safeLocalStorageGetItem(LONG_BREAK_MINUTES_KEY, '15'));
}
function setLongBreakMinutes(val) {
  try { localStorage.setItem(LONG_BREAK_MINUTES_KEY, String(val)); } catch {}
}

// == Audio Chime ==
function playChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 880;

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

// == State ==
let WORK_MINUTES = getWorkMinutes();
let BREAK_MINUTES = getBreakMinutes();
let CYCLE_LENGTH = getCycleLength();
let LONG_BREAK_MINUTES = getLongBreakMinutes();
let WORK_DURATION = WORK_MINUTES * 60;
let BREAK_DURATION = BREAK_MINUTES * 60;
let LONG_BREAK_DURATION = LONG_BREAK_MINUTES * 60;

let isWorkSession = true;
let timer = WORK_DURATION;
let interval = null;
let isPaused = false;
let isTransitioning = false;

let sessionCount = 0;
let cycleLength = CYCLE_LENGTH;
let isLongBreak = false;

let endTime = null;

// == DOM Elements ==
const timerDisplay = document.getElementById('timer-display');
const sessionTypeDisplay = document.getElementById('session-type');
const sessionCounter = document.getElementById('session-counter');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('toast');

const settingsBtn = document.getElementById('open-settings');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsWorkInput = document.getElementById('settings-work');
const settingsBreakInput = document.getElementById('settings-break');
const settingsCycleInput = document.getElementById('settings-cycle');
const settingsLongBreakInput = document.getElementById('settings-long-break');

const themeToggleBtn = document.getElementById('theme-toggle-btn');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const submitBtn = taskForm.querySelector('button[type="submit"]');

// == Theme Functions ==
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try { localStorage.setItem('theme', theme); } catch {}
}
function updateThemeToggleBtn(theme) {
  if (theme === 'dark') {
    themeToggleBtn.textContent = '☀️';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    themeToggleBtn.textContent = '🌙';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}
const savedTheme = safeLocalStorageGetItem('theme', 'light');
applyTheme(savedTheme);
updateThemeToggleBtn(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  updateThemeToggleBtn(newTheme);
});

// == Button State Helpers ==
function setAllButtonsDisabled(disabled) {
  startBtn.disabled = disabled;
  pauseBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  [startBtn, pauseBtn, resetBtn].forEach(btn => {
    disabled ? btn.classList.add('disabled') : btn.classList.remove('disabled');
  });
}

// == Toast Notifications ==
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.style.display = 'none', 300);
  }, 3000);
}

// == Timer Utilities ==
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}
function renderTimer() {
  timerDisplay.textContent = formatTime(timer);
  sessionTypeDisplay.textContent = isWorkSession ? (isLongBreak ? 'Long Break' : 'Work') : 'Break';
}
function updateSessionDisplay() {
  sessionCounter.textContent = isLongBreak
    ? `On your long break! Cycle complete.`
    : `Session: ${isWorkSession ? sessionCount + 1 : sessionCount} / ${cycleLength}`;
}

// == Session End Handling ==
function handleSessionEnd() {
  setAllButtonsDisabled(true);
  isTransitioning = true;
  clearInterval(interval);
  interval = null;
  playChime();

  setTimeout(() => {
    if (isWorkSession) {
      sessionCount++;
      if (sessionCount >= cycleLength) {
        isLongBreak = true;
        showToast('Cycle complete! Time for a long break.');
        timer = LONG_BREAK_DURATION;
        sessionCount = 0;
      } else {
        showToast(`Work session complete! ${BREAK_MINUTES}-minute break starting.`);
        timer = BREAK_DURATION;
        isLongBreak = false;
      }
      isWorkSession = false;
    } else {
      isWorkSession = true;
      isLongBreak = false;
      showToast('Break over! Time to focus again.');
      timer = WORK_DURATION;
    }
    renderTimer();
    updateSessionDisplay();
    setAllButtonsDisabled(false);
    isTransitioning = false;
    startTimer();
  }, 700);
}

// == Timer Controls (timestamp precision) ==
function startTimer() {
  if (interval || isTransitioning) return;
  setAllButtonsDisabled(false);
  endTime = Date.now() + timer * 1000;
  interval = setInterval(() => {
    if (!isPaused) {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      timer = remaining > 0 ? remaining : 0;
      renderTimer();
      if (timer === 0) {
        handleSessionEnd();
      }
    }
  }, 1000);
}
function pauseTimer() {
  if (isTransitioning) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}
function resetTimer() {
  if (isTransitioning) return;
  clearInterval(interval);
  interval = null;
  isPaused = false;
  pauseBtn.textContent = 'Pause';
  timer = isWorkSession ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION) : BREAK_DURATION;
  renderTimer();
  updateSessionDisplay();
}

// == Settings Modal with Focus Management ==
settingsBtn.addEventListener('click', () => {
  settingsWorkInput.value = WORK_MINUTES;
  settingsBreakInput.value = BREAK_MINUTES;
  settingsCycleInput.value = cycleLength;
  settingsLongBreakInput.value = LONG_BREAK_MINUTES;
  settingsModal.showModal();
  settingsWorkInput.focus();
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.close();
  settingsBtn.focus();
});

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const w = parseInt(settingsWorkInput.value, 10);
  const b = parseInt(settingsBreakInput.value, 10);
  const c = parseInt(settingsCycleInput.value, 10);
  const l = parseInt(settingsLongBreakInput.value, 10);

  if (
    isNaN(w) || w < 1 || w > 90 ||
    isNaN(b) || b < 1 || b > 30 ||
    isNaN(c) || c < 1 || c > 10 ||
    isNaN(l) || l < 1 || l > 60
  ) {
    showToast('Please enter valid values for all settings.');
    return;
  }

  setWorkMinutes(w);
  setBreakMinutes(b);
  setCycleLength(c);
  setLongBreakMinutes(l);

  WORK_MINUTES = w;
  BREAK_MINUTES = b;
  cycleLength = c;
  LONG_BREAK_MINUTES = l;
  LONG_BREAK_DURATION = l * 60;
  WORK_DURATION = WORK_MINUTES * 60;
  BREAK_DURATION = BREAK_MINUTES * 60;

  timer = isWorkSession ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION) : BREAK_DURATION;
  renderTimer();
  updateSessionDisplay();

  settingsModal.close();
});

settingsModal.addEventListener("click", (event) => {
  const rect = settingsModal.getBoundingClientRect();
  if (
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
  ) {
    settingsModal.close();
    settingsBtn.focus();
  }
});

// == Controls Event Listeners ==
startBtn.addEventListener('click', () => {
  if (!isTransitioning) startTimer();
});
pauseBtn.addEventListener('click', () => {
  if (!isTransitioning) pauseTimer();
});
resetBtn.addEventListener('click', () => {
  if (!isTransitioning) resetTimer();
});

// == Task Tracker Logic ==
let tasks = JSON.parse(safeLocalStorageGetItem(TASKS_KEY, '[]'));

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {}
}

function removeTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '0.5rem';

    const taskName = document.createElement('span');
    taskName.style.cursor = 'pointer';
    taskName.style.flexGrow = '1';
    taskName.style.outline = 'none';
    taskName.tabIndex = 0;
    taskName.textContent = task.name;
    if (task.completed) {
      taskName.style.textDecoration = 'line-through';
      taskName.style.color = 'gray';
      li.classList.add('completed');
    } else {
      li.classList.remove('completed');
    }

    taskName.addEventListener('click', () => toggleTaskCompletion(index));
    taskName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTaskCompletion(index);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove task: ${task.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTask(index);
    });

    li.appendChild(taskName);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
}

function toggleTaskCompletion(i) {
  tasks[i].completed = !tasks[i].completed;
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTaskName = taskInput.value.trim();
  if (!newTaskName) return;

  const existingIndex = tasks.findIndex(t => t.name.toLowerCase() === newTaskName.toLowerCase());
  if (existingIndex >= 0) {
    tasks[existingIndex].completed = false;
  } else {
    tasks.push({ name: newTaskName, completed: false });
  }
  saveTasks();
  renderTasks();
  taskInput.value = '';
  submitBtn.disabled = true;
});

submitBtn.disabled = taskInput.value.trim() === '';
taskInput.addEventListener('input', () => {
  submitBtn.disabled = taskInput.value.trim() === '';
});

startBtn.addEventListener('click', () => {
  const currentTask = taskInput.value.trim();
  if (currentTask) {
    let index = tasks.findIndex(t => t.name.toLowerCase() === currentTask.toLowerCase());
    if (index === -1) {
      tasks.push({ name: currentTask, completed: false });
      saveTasks();
      renderTasks();
    }
  }
});

// == Initialize App ==
renderTimer();
updateSessionDisplay();
setAllButtonsDisabled(false);
renderTasks();

// == Service Worker Registration ==
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registered with scope:', registration.scope);
    }).catch(error => {
      console.error('ServiceWorker registration failed:', error);
    });
  });
}
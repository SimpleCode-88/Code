// ======= LocalStorage Keys =======
const WORK_MINUTES_KEY = 'pomodoroWorkMinutes';
const BREAK_MINUTES_KEY = 'pomodoroBreakMinutes';
const CYCLE_LENGTH_KEY = 'pomodoroCycleLength';
const LONG_BREAK_MINUTES_KEY = 'pomodoroLongBreakMinutes';

// ======= Helpers: Get/Set from localStorage =======
function getWorkMinutes() {
  return Number(localStorage.getItem(WORK_MINUTES_KEY)) || 30;
}
function getBreakMinutes() {
  return Number(localStorage.getItem(BREAK_MINUTES_KEY)) || 5;
}
function setWorkMinutes(val) {
  localStorage.setItem(WORK_MINUTES_KEY, String(val));
}
function setBreakMinutes(val) {
  localStorage.setItem(BREAK_MINUTES_KEY, String(val));
}
function getCycleLength() {
  return Number(localStorage.getItem(CYCLE_LENGTH_KEY)) || 4;
}
function setCycleLength(val) {
  localStorage.setItem(CYCLE_LENGTH_KEY, String(val));
}
function getLongBreakMinutes() {
  return Number(localStorage.getItem(LONG_BREAK_MINUTES_KEY)) || 15;
}
function setLongBreakMinutes(val) {
  localStorage.setItem(LONG_BREAK_MINUTES_KEY, String(val));
}

// ======= Inline audio chime using Web Audio API =======
function playChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 880; // frequency in Hz

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

// ======= State =======
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

// ======= DOM Elements =======
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

// ======= Theme Functions =======
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// ======= Button State Helpers =======
function setAllButtonsDisabled(disabled) {
  startBtn.disabled = disabled;
  pauseBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  [startBtn, pauseBtn, resetBtn].forEach(btn => {
    if (disabled) btn.classList.add('disabled');
    else btn.classList.remove('disabled');
  });
}

// ======= Toast Notifications =======
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.style.display = 'none', 300);
  }, 3000);
}

// ======= Timer Utilities =======
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timer);
  sessionTypeDisplay.textContent = isWorkSession
    ? (isLongBreak ? 'Long Break' : 'Work')
    : 'Break';
}

function updateSessionDisplay() {
  sessionCounter.textContent =
    isLongBreak
      ? `On your long break! Cycle complete.`
      : `Session: ${isWorkSession ? sessionCount + 1 : sessionCount} / ${cycleLength}`;
}

// ======= Session End Handling =======
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

// ======= Timer Control Functions =======
function startTimer() {
  if (interval || isTransitioning) return;
  setAllButtonsDisabled(false);
  interval = setInterval(() => {
    if (!isPaused && timer > 0) {
      timer--;
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
  timer = isWorkSession
    ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION)
    : BREAK_DURATION;
  renderTimer();
  updateSessionDisplay();
}

// ======= Settings Modal Logic =======
settingsBtn.addEventListener('click', () => {
  settingsWorkInput.value = WORK_MINUTES;
  settingsBreakInput.value = BREAK_MINUTES;
  settingsCycleInput.value = cycleLength;
  settingsLongBreakInput.value = LONG_BREAK_MINUTES;
  settingsModal.showModal();
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.close();
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

  timer = isWorkSession
    ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION)
    : BREAK_DURATION;
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
  }
});

// ======= Controls Event Listeners =======
startBtn.addEventListener('click', () => {
  if (!isTransitioning) startTimer();
});
pauseBtn.addEventListener('click', () => {
  if (!isTransitioning) pauseTimer();
});
resetBtn.addEventListener('click', () => {
  if (!isTransitioning) resetTimer();
});

// ======= Initialize App =======
renderTimer();
updateSessionDisplay();
setAllButtonsDisabled(false);

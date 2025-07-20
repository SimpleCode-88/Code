// ======= LocalStorage: Session and Cycle Lengths =======
const WORK_MINUTES_KEY = 'pomodoroWorkMinutes';
const BREAK_MINUTES_KEY = 'pomodoroBreakMinutes';
const CYCLE_LENGTH_KEY = 'pomodoroCycleLength';
const LONG_BREAK_MINUTES_KEY = 'pomodoroLongBreakMinutes';

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

// New state/cycle variables
let sessionCount = 0;
let cycleLength = CYCLE_LENGTH;
let isLongBreak = false;

// ======= DOM =======
const alarmAudio = document.getElementById('alarm-audio');
const timerDisplay = document.getElementById('timer-display');
const sessionTypeDisplay = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionCounter = document.getElementById('session-counter');

// ======= SETTINGS MODAL DOM =======
const settingsBtn = document.getElementById('open-settings');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsWorkInput = document.getElementById('settings-work');
const settingsBreakInput = document.getElementById('settings-break');
const settingsCycleInput = document.getElementById('settings-cycle');
const settingsLongBreakInput = document.getElementById('settings-long-break');

// ======= Button State =======
function setAllButtonsDisabled(disabled) {
  startBtn.disabled = disabled;
  pauseBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  [startBtn, pauseBtn, resetBtn].forEach(btn => {
    if (disabled) btn.classList.add('disabled');
    else btn.classList.remove('disabled');
  });
}

// ======= Utilities =======
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
      : `Pomodoro: ${isWorkSession ? sessionCount + 1 : sessionCount} / ${cycleLength}`;
}

// ======= Session Control =======
function handleSessionEnd() {
  setAllButtonsDisabled(true);
  isTransitioning = true;
  clearInterval(interval);
  interval = null;
  alarmAudio.play();

  setTimeout(() => {
    if (isWorkSession) {
      sessionCount++;
      if (sessionCount >= cycleLength) {
        isLongBreak = true;
        alert(`Cycle complete! Time for a long break.`);
        timer = LONG_BREAK_DURATION;
        sessionCount = 0; // Reset for next cycle
      } else {
        alert(`Work session complete! ${BREAK_MINUTES}-minute break starting.`);
        timer = BREAK_DURATION;
        isLongBreak = false;
      }
      isWorkSession = false;
    } else {
      isWorkSession = true;
      isLongBreak = false;
      timer = WORK_DURATION;
      alert("Break over! Time to focus again.");
    }
    renderTimer();
    updateSessionDisplay();
    setAllButtonsDisabled(false);
    isTransitioning = false;
    startTimer();
  }, 700);
}

// ======= Timer Logic =======
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
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  updateSessionDisplay();
}

// ======= SETTINGS MODAL LOGIC =======
// Open the modal, fill with current values
settingsBtn.addEventListener('click', () => {
  settingsWorkInput.value = WORK_MINUTES;
  settingsBreakInput.value = BREAK_MINUTES;
  settingsCycleInput.value = cycleLength;
  settingsLongBreakInput.value = LONG_BREAK_MINUTES;
  settingsModal.showModal();
});

// Close modal with cancel
closeSettingsBtn.addEventListener('click', () => {
  settingsModal.close();
});

// Save and apply settings from modal
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
    alert('Please enter valid values for all settings.');
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

  // Update current timer and UI
  timer = isWorkSession 
    ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION) 
    : BREAK_DURATION;
  renderTimer();
  updateSessionDisplay();

  settingsModal.close();
});

// Close modal when clicking outside
settingsModal.addEventListener("click", (event) => {
  const rect = settingsModal.getBoundingClientRect();
  if (
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
  ) {
    settingsModal.close();
  }
});

// ======= Controls =======
startBtn.addEventListener('click', function () {
  if (!isTransitioning) startTimer();
});
pauseBtn.addEventListener('click', function () {
  if (!isTransitioning) pauseTimer();
});
resetBtn.addEventListener('click', function () {
  if (!isTransitioning) resetTimer();
});

// ======= Init =======
renderTimer();
updateSessionDisplay();

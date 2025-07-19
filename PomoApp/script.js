// ========== LocalStorage: Session Lengths ==========
const WORK_MINUTES_KEY = 'pomodoroWorkMinutes';
const BREAK_MINUTES_KEY = 'pomodoroBreakMinutes';

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

// ========== State ==========
let WORK_MINUTES = getWorkMinutes();
let BREAK_MINUTES = getBreakMinutes();
let WORK_DURATION = WORK_MINUTES * 60;
let BREAK_DURATION = BREAK_MINUTES * 60;

let isWorkSession = true;
let timer = WORK_DURATION;
let interval = null;
let isPaused = false;
let isTransitioning = false;

// ========== DOM ==========
const alarmAudio = document.getElementById('alarm-audio');
const timerDisplay = document.getElementById('timer-display');
const sessionTypeDisplay = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const customLengthsForm = document.getElementById('custom-lengths-form');
const workLengthInput = document.getElementById('work-length-input');
const breakLengthInput = document.getElementById('break-length-input');

// Populate number inputs from localStorage or default
workLengthInput.value = WORK_MINUTES;
breakLengthInput.value = BREAK_MINUTES;

// ========== Button State ==========
function setAllButtonsDisabled(disabled) {
  startBtn.disabled = disabled;
  pauseBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  [startBtn, pauseBtn, resetBtn].forEach(btn => {
    if (disabled) {
      btn.classList.add('disabled');
    } else {
      btn.classList.remove('disabled');
    }
  });
}

// ========== Utilities ==========
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timer);
  sessionTypeDisplay.textContent = isWorkSession ? 'Work' : 'Break';
}

// ========== Session Control ==========
function handleSessionEnd() {
  setAllButtonsDisabled(true);
  isTransitioning = true;
  clearInterval(interval);
  interval = null;
  alarmAudio.play();

  setTimeout(() => {
    if (isWorkSession) {
      alert(`Work session complete! ${BREAK_MINUTES}-minute break starting.`);
      isWorkSession = false;
      timer = BREAK_DURATION;
    } else {
      alert("Break over! Time to focus again.");
      isWorkSession = true;
      timer = WORK_DURATION;
    }
    renderTimer();
    setAllButtonsDisabled(false);
    isTransitioning = false;
    startTimer();
  }, 700);
}

// ========== Timer Logic ==========
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
  timer = isWorkSession ? WORK_DURATION : BREAK_DURATION;
  renderTimer();
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
}

// ========== Custom Session Length Logic ==========
function updateSessionLengths(workMin, breakMin) {
  // Validate
  if (
    typeof workMin !== 'number' || typeof breakMin !== 'number' ||
    isNaN(workMin) || isNaN(breakMin) ||
    workMin < 1 || workMin > 90 || breakMin < 1 || breakMin > 30
  ) {
    alert('Invalid session lengths.');
    return;
  }
  setWorkMinutes(workMin);
  setBreakMinutes(breakMin);

  WORK_MINUTES = workMin;
  BREAK_MINUTES = breakMin;
  WORK_DURATION = workMin * 60;
  BREAK_DURATION = breakMin * 60;

  timer = isWorkSession ? WORK_DURATION : BREAK_DURATION;
  renderTimer();
}

customLengthsForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (isTransitioning) return;
  const workMin = parseInt(workLengthInput.value, 10);
  const breakMin = parseInt(breakLengthInput.value, 10);

  if (
    isNaN(workMin) || workMin < 1 || workMin > 90 ||
    isNaN(breakMin) || breakMin < 1 || breakMin > 30
  ) {
    alert('Please enter valid session lengths.');
    // Reset to last valid if invalid
    workLengthInput.value = WORK_MINUTES;
    breakLengthInput.value = BREAK_MINUTES;
    return;
  }

  updateSessionLengths(workMin, breakMin);
  // Confirmation alert has been removed
});

// ========== Controls ==========
startBtn.addEventListener('click', function () {
  if (!isTransitioning) startTimer();
});
pauseBtn.addEventListener('click', function () {
  if (!isTransitioning) pauseTimer();
});
resetBtn.addEventListener('click', function () {
  if (!isTransitioning) resetTimer();
});

// ========== Init ==========
renderTimer();

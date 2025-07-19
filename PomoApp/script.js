// ================= Configuration ================= //
const WORK_MINUTES = 30;
const BREAK_MINUTES = 5;

const WORK_DURATION = WORK_MINUTES * 60;
const BREAK_DURATION = BREAK_MINUTES * 60;

// ================= State Variables ================= //
let isWorkSession = true; // Tracks session type: true = Work, false = Break
let timer = WORK_DURATION; // Current timer in seconds
let interval = null;       // setInterval ID
let isPaused = false;      // Pause/resume flag

// ================= DOM Elements ================= //
const alarmAudio = document.getElementById('alarm-audio');
const timerDisplay = document.getElementById('timer-display');
const sessionTypeDisplay = document.getElementById('session-type');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// ================= Utilities ================= //

/**
 * Formats seconds into MM:SS format
 * @param {number} seconds
 * @returns {string} "MM:SS"
 */
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

/**
 * Updates timer and session type on UI
 */
function renderTimer() {
  timerDisplay.textContent = formatTime(timer);
  sessionTypeDisplay.textContent = isWorkSession ? 'Work' : 'Break';
}

/**
 * Handles end-of-session events: alarm, alert, transition
 */
function handleSessionEnd() {
  clearInterval(interval);
  interval = null;
  alarmAudio.play();

  if (isWorkSession) {
    alert("Work session complete! 5-minute break starting.");
    isWorkSession = false;
    timer = BREAK_DURATION;
  } else {
    alert("Break over! Time to focus again.");
    isWorkSession = true;
    timer = WORK_DURATION;
  }
  renderTimer();
  startTimer();
}

// ================= Core Timer Logic ================= //

/**
 * Starts the countdown if not already running
 */
function startTimer() {
  if (interval) return;

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

/**
 * Pauses or resumes timer, updates button text
 */
function pauseTimer() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

/**
 * Stops timer, resets state, prepares for new start
 */
function resetTimer() {
  clearInterval(interval);
  interval = null;
  isPaused = false;
  pauseBtn.textContent = 'Pause';
  timer = isWorkSession ? WORK_DURATION : BREAK_DURATION;
  renderTimer();
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
}

// ================= Event Listeners ================= //

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initial UI setup
renderTimer();

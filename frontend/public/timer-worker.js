// Timer Web Worker - Handles precise timing in background
// This prevents browser tab throttling from affecting timer accuracy

let timers = new Map();
let timerCounter = 0;

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'START_TIMER':
      startTimer(payload);
      break;
    case 'STOP_TIMER':
      stopTimer(payload.id);
      break;
    case 'PAUSE_TIMER':
      pauseTimer(payload.id);
      break;
    case 'RESUME_TIMER':
      resumeTimer(payload.id);
      break;
    case 'GET_TIMER_STATE':
      getTimerState(payload.id);
      break;
    case 'PING':
      // Health check to ensure worker is responsive
      self.postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
    default:
      console.warn('[Timer Worker] Unknown message type:', type);
  }
};

function startTimer({ id, duration, startTime, type = 'countdown' }) {
  // Stop existing timer if any
  if (timers.has(id)) {
    stopTimer(id);
  }
  
  const timer = {
    id,
    type, // 'countdown' or 'stopwatch'
    startTime: startTime || Date.now(),
    duration: duration || 0,
    remainingTime: duration || 0,
    elapsedTime: 0,
    isRunning: true,
    isPaused: false,
    intervalId: null,
    lastTickTime: Date.now()
  };
  
  // For countdown timers, calculate remaining time if resuming
  if (type === 'countdown' && startTime) {
    const elapsed = Date.now() - startTime;
    timer.remainingTime = Math.max(0, duration - elapsed);
    timer.elapsedTime = elapsed;
  }
  
  timer.intervalId = setInterval(() => {
    updateTimer(timer);
  }, 100); // Update every 100ms for better accuracy
  
  timers.set(id, timer);
  
  // Send initial state
  self.postMessage({
    type: 'TIMER_UPDATE',
    payload: {
      id: timer.id,
      remainingTime: Math.ceil(timer.remainingTime / 1000),
      elapsedTime: Math.ceil(timer.elapsedTime / 1000),
      isRunning: timer.isRunning,
      isPaused: timer.isPaused
    }
  });
}

function updateTimer(timer) {
  const now = Date.now();
  const deltaTime = now - timer.lastTickTime;
  timer.lastTickTime = now;
  
  if (!timer.isRunning || timer.isPaused) {
    return;
  }
  
  timer.elapsedTime += deltaTime;
  
  if (timer.type === 'countdown') {
    timer.remainingTime = Math.max(0, timer.duration - timer.elapsedTime);
    
    // Check if countdown finished
    if (timer.remainingTime <= 0) {
      timer.isRunning = false;
      clearInterval(timer.intervalId);
      
      self.postMessage({
        type: 'TIMER_FINISHED',
        payload: {
          id: timer.id,
          elapsedTime: Math.ceil(timer.elapsedTime / 1000)
        }
      });
    }
  }
  
  // Send update every second
  if (Math.floor(timer.elapsedTime / 1000) !== Math.floor((timer.elapsedTime - deltaTime) / 1000)) {
    self.postMessage({
      type: 'TIMER_UPDATE',
      payload: {
        id: timer.id,
        remainingTime: Math.ceil(timer.remainingTime / 1000),
        elapsedTime: Math.ceil(timer.elapsedTime / 1000),
        isRunning: timer.isRunning,
        isPaused: timer.isPaused
      }
    });
  }
}

function stopTimer(id) {
  const timer = timers.get(id);
  if (timer) {
    timer.isRunning = false;
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }
    timers.delete(id);
    
    self.postMessage({
      type: 'TIMER_STOPPED',
      payload: { id }
    });
  }
}

function pauseTimer(id) {
  const timer = timers.get(id);
  if (timer) {
    timer.isPaused = true;
    
    self.postMessage({
      type: 'TIMER_PAUSED',
      payload: {
        id: timer.id,
        remainingTime: Math.ceil(timer.remainingTime / 1000),
        elapsedTime: Math.ceil(timer.elapsedTime / 1000)
      }
    });
  }
}

function resumeTimer(id) {
  const timer = timers.get(id);
  if (timer) {
    timer.isPaused = false;
    timer.lastTickTime = Date.now();
    
    self.postMessage({
      type: 'TIMER_RESUMED',
      payload: {
        id: timer.id,
        remainingTime: Math.ceil(timer.remainingTime / 1000),
        elapsedTime: Math.ceil(timer.elapsedTime / 1000)
      }
    });
  }
}

function getTimerState(id) {
  const timer = timers.get(id);
  if (timer) {
    self.postMessage({
      type: 'TIMER_STATE',
      payload: {
        id: timer.id,
        remainingTime: Math.ceil(timer.remainingTime / 1000),
        elapsedTime: Math.ceil(timer.elapsedTime / 1000),
        isRunning: timer.isRunning,
        isPaused: timer.isPaused,
        startTime: timer.startTime,
        duration: timer.duration
      }
    });
  } else {
    self.postMessage({
      type: 'TIMER_NOT_FOUND',
      payload: { id }
    });
  }
}

// Send periodic heartbeat
setInterval(() => {
  self.postMessage({
    type: 'HEARTBEAT',
    payload: {
      activeTimers: Array.from(timers.keys()),
      timestamp: Date.now()
    }
  });
}, 5000);

// Send initialization confirmation
console.log('[Timer Worker] Initialized successfully');
self.postMessage({
  type: 'WORKER_READY',
  timestamp: Date.now()
});

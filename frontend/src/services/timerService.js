// Timer Service - Manages Web Worker timers and provides fallback
class TimerService {
  constructor() {
    this.worker = null;
    this.fallbackTimers = new Map();
    this.listeners = new Map();
    this.isWorkerSupported = false;
    this.workerReady = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.initPromise = null;
    
    this.initPromise = this.init();
  }

  async init() {
    try {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        console.warn('[Timer Service] Web Workers not supported, using fallback');
        this.isWorkerSupported = false;
        return;
      }

      // Create Web Worker
      this.worker = new Worker('/timer-worker.js');
      this.workerReady = false;

      // Set up worker message handling
      this.worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (error) => {
        console.error('[Timer Service] Worker error:', error);
        this.handleWorkerError();
      };

      // Test worker connectivity with promise-based approach
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[Timer Service] Worker not responding, using fallback');
          this.isWorkerSupported = false;
          this.worker = null;
          resolve();
        }, 2000);

        // Listen for PONG response and WORKER_READY
        const originalHandler = this.handleWorkerMessage.bind(this);
        this.handleWorkerMessage = (data) => {
          if (data.type === 'PONG' || data.type === 'WORKER_READY') {
            clearTimeout(timeout);
            this.isWorkerSupported = true;
            this.workerReady = true;
            this.connectionRetries = 0;
            console.log('[Timer Service] Web Worker initialized successfully');
            resolve();
          }
          originalHandler(data);
        };

        // Send ping to test connectivity
        this.worker.postMessage({ type: 'PING' });
      });

    } catch (error) {
      console.error('[Timer Service] Failed to initialize worker:', error);
      this.isWorkerSupported = false;
      this.worker = null;
    }
  }

  handleWorkerMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'PONG':
        // Worker is responsive
        this.connectionRetries = 0;
        break;
      case 'TIMER_UPDATE':
      case 'TIMER_FINISHED':
      case 'TIMER_STOPPED':
      case 'TIMER_PAUSED':
      case 'TIMER_RESUMED':
      case 'TIMER_STATE':
        this.notifyListeners(payload.id, type, payload);
        break;
      case 'HEARTBEAT':
        // Worker health check
        break;
      default:
        console.log('[Timer Service] Received:', type, payload);
    }
  }

  handleWorkerError() {
    this.connectionRetries++;
    if (this.connectionRetries >= this.maxRetries) {
      console.warn('[Timer Service] Worker failed, switching to fallback');
      this.isWorkerSupported = false;
      this.worker = null;
    }
  }

  // Public API
  async startTimer(id, options = {}) {
    const {
      duration = 0,
      type = 'countdown',
      onUpdate = null,
      onFinished = null,
      onPaused = null,
      onResumed = null
    } = options;

    // Store listeners
    this.listeners.set(id, {
      onUpdate,
      onFinished,
      onPaused,
      onResumed
    });

    // Wait for worker initialization to complete
    if (this.initPromise) {
      await this.initPromise;
    }

    if (this.isWorkerSupported && this.worker && this.workerReady) {
      // Use Web Worker
      try {
        this.worker.postMessage({
          type: 'START_TIMER',
          payload: {
            id,
            duration: duration * 1000, // Convert to milliseconds
            startTime: Date.now(),
            type
          }
        });
        console.log(`[Timer Service] Started Web Worker timer: ${id}`);
      } catch (error) {
        console.warn('[Timer Service] Worker failed, using fallback:', error);
        this.startFallbackTimer(id, duration, type);
      }
    } else {
      // Use fallback
      console.log(`[Timer Service] Using fallback timer: ${id}`);
      this.startFallbackTimer(id, duration, type);
    }

    // Save timer state to localStorage for persistence
    this.saveTimerState(id, {
      duration,
      startTime: Date.now(),
      type,
      isRunning: true
    });
  }

  stopTimer(id) {
    if (this.isWorkerSupported && this.worker) {
      this.worker.postMessage({
        type: 'STOP_TIMER',
        payload: { id }
      });
    } else {
      this.stopFallbackTimer(id);
    }

    // Clean up
    this.listeners.delete(id);
    this.removeTimerState(id);
  }

  pauseTimer(id) {
    if (this.isWorkerSupported && this.worker) {
      this.worker.postMessage({
        type: 'PAUSE_TIMER',
        payload: { id }
      });
    } else {
      this.pauseFallbackTimer(id);
    }

    // Update saved state
    const state = this.getTimerState(id);
    if (state) {
      this.saveTimerState(id, { ...state, isPaused: true });
    }
  }

  resumeTimer(id) {
    if (this.isWorkerSupported && this.worker) {
      this.worker.postMessage({
        type: 'RESUME_TIMER',
        payload: { id }
      });
    } else {
      this.resumeFallbackTimer(id);
    }

    // Update saved state
    const state = this.getTimerState(id);
    if (state) {
      this.saveTimerState(id, { ...state, isPaused: false });
    }
  }

  // Fallback timer implementation
  startFallbackTimer(id, duration, type) {
    const timer = {
      id,
      type,
      startTime: Date.now(),
      duration: duration * 1000,
      intervalId: null,
      isRunning: true,
      isPaused: false
    };

    timer.intervalId = setInterval(() => {
      if (timer.isPaused) return;

      const elapsed = Date.now() - timer.startTime;
      const remaining = Math.max(0, timer.duration - elapsed);

      const payload = {
        id,
        remainingTime: Math.ceil(remaining / 1000),
        elapsedTime: Math.ceil(elapsed / 1000),
        isRunning: timer.isRunning,
        isPaused: timer.isPaused
      };

      this.notifyListeners(id, 'TIMER_UPDATE', payload);

      if (type === 'countdown' && remaining <= 0) {
        timer.isRunning = false;
        clearInterval(timer.intervalId);
        this.fallbackTimers.delete(id);
        this.notifyListeners(id, 'TIMER_FINISHED', payload);
      }
    }, 1000);

    this.fallbackTimers.set(id, timer);
  }

  stopFallbackTimer(id) {
    const timer = this.fallbackTimers.get(id);
    if (timer) {
      clearInterval(timer.intervalId);
      this.fallbackTimers.delete(id);
      this.notifyListeners(id, 'TIMER_STOPPED', { id });
    }
  }

  pauseFallbackTimer(id) {
    const timer = this.fallbackTimers.get(id);
    if (timer) {
      timer.isPaused = true;
      const elapsed = Date.now() - timer.startTime;
      const remaining = Math.max(0, timer.duration - elapsed);
      
      this.notifyListeners(id, 'TIMER_PAUSED', {
        id,
        remainingTime: Math.ceil(remaining / 1000),
        elapsedTime: Math.ceil(elapsed / 1000)
      });
    }
  }

  resumeFallbackTimer(id) {
    const timer = this.fallbackTimers.get(id);
    if (timer) {
      timer.isPaused = false;
      const elapsed = Date.now() - timer.startTime;
      const remaining = Math.max(0, timer.duration - elapsed);
      
      this.notifyListeners(id, 'TIMER_RESUMED', {
        id,
        remainingTime: Math.ceil(remaining / 1000),
        elapsedTime: Math.ceil(elapsed / 1000)
      });
    }
  }

  notifyListeners(id, eventType, payload) {
    const listeners = this.listeners.get(id);
    if (!listeners) return;

    switch (eventType) {
      case 'TIMER_UPDATE':
        listeners.onUpdate?.(payload);
        break;
      case 'TIMER_FINISHED':
        listeners.onFinished?.(payload);
        break;
      case 'TIMER_PAUSED':
        listeners.onPaused?.(payload);
        break;
      case 'TIMER_RESUMED':
        listeners.onResumed?.(payload);
        break;
    }
  }

  // Persistence methods
  saveTimerState(id, state) {
    try {
      const key = `timer_${id}`;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn('[Timer Service] Failed to save timer state:', error);
    }
  }

  getTimerState(id) {
    try {
      const key = `timer_${id}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[Timer Service] Failed to get timer state:', error);
      return null;
    }
  }

  removeTimerState(id) {
    try {
      const key = `timer_${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[Timer Service] Failed to remove timer state:', error);
    }
  }

  // Recovery method for page refresh/tab reactivation
  async recoverTimers() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('timer_'));
    
    for (const key of keys) {
      try {
        const state = JSON.parse(localStorage.getItem(key));
        const id = key.replace('timer_', '');
        
        if (state.isRunning && !state.isPaused) {
          const elapsed = Date.now() - state.startTime;
          const remaining = Math.max(0, (state.duration * 1000) - elapsed);
          
          if (remaining > 0) {
            console.log(`[Timer Service] Recovering timer ${id}`);
            // Restart timer with adjusted duration
            this.startTimer(id, {
              duration: Math.ceil(remaining / 1000),
              type: state.type
            });
          } else {
            // Timer should have finished
            this.removeTimerState(id);
          }
        }
      } catch (error) {
        console.warn('[Timer Service] Failed to recover timer:', key, error);
        localStorage.removeItem(key);
      }
    }
  }

  // Health check
  isHealthy() {
    return this.isWorkerSupported ? (this.worker !== null) : true;
  }
}

// Create singleton instance
const timerService = new TimerService();

// Auto-recover timers on page load
document.addEventListener('DOMContentLoaded', () => {
  timerService.recoverTimers();
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Tab became visible, check for timer recovery
    setTimeout(() => {
      timerService.recoverTimers();
    }, 100);
  }
});

export default timerService;

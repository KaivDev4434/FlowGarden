// API Service with error handling and retry logic
class ApiService {
  constructor() {
    this.baseUrl = '';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.listeners = new Set();
    this.isOnline = navigator.onLine;
    this.connectionStatus = 'unknown'; // 'connected', 'disconnected', 'error', 'unknown'
    
    this.setupEventListeners();
    this.checkConnection();
  }

  setupEventListeners() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
      this.checkConnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionStatus = 'disconnected';
      this.notifyListeners('offline');
    });
  }

  // Connection status management
  addConnectionListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus, this.isOnline);
    
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, status = this.connectionStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status, this.isOnline, event);
      } catch (error) {
        console.warn('[API Service] Listener error:', error);
      }
    });
  }

  async checkConnection() {
    try {
      const response = await this.request('/api/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        this.connectionStatus = 'connected';
        this.notifyListeners('connected');
        return true;
      } else {
        this.connectionStatus = 'error';
        this.notifyListeners('error');
        return false;
      }
    } catch (error) {
      this.connectionStatus = this.isOnline ? 'error' : 'disconnected';
      this.notifyListeners(this.connectionStatus);
      return false;
    }
  }

  // Enhanced fetch with retry logic
  async request(url, options = {}) {
    const {
      retryAttempts = this.retryAttempts,
      retryDelay = this.retryDelay,
      timeout = 10000,
      ...fetchOptions
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(this.baseUrl + url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers
          }
        });

        clearTimeout(timeoutId);

        // Update connection status based on response
        if (response.ok) {
          this.connectionStatus = 'connected';
        } else if (response.status >= 500) {
          this.connectionStatus = 'error';
        }

        return response;

      } catch (error) {
        lastError = error;
        console.warn(`[API Service] Request attempt ${attempt}/${retryAttempts} failed:`, error.message);

        // Update connection status
        if (error.name === 'AbortError') {
          this.connectionStatus = 'error';
        } else if (error.message.includes('fetch')) {
          this.connectionStatus = this.isOnline ? 'error' : 'disconnected';
        }

        // Don't retry on the last attempt
        if (attempt === retryAttempts) {
          this.notifyListeners('error');
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // High-level API methods with error handling
  async getSettings() {
    try {
      const response = await this.get('/api/settings');
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[API Service] Error fetching settings:', error);
      
      // Return cached settings if available
      const cached = this.getCachedSettings();
      if (cached) {
        console.log('[API Service] Using cached settings');
        return cached;
      }
      
      // Return default settings as fallback
      console.log('[API Service] Using default settings');
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings) {
    try {
      const response = await this.put('/api/settings', settings);
      if (response.ok) {
        const saved = await response.json();
        this.cacheSettings(saved);
        return saved;
      } else {
        throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[API Service] Error saving settings:', error);
      
      // Cache settings locally for when connection is restored
      this.cacheSettings(settings, true);
      throw error;
    }
  }

  async startSession(projectId, sessionType) {
    try {
      const response = await this.post('/api/sessions/start', {
        projectId,
        sessionType
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to start session: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[API Service] Error starting session:', error);
      
      // Return offline session
      return this.createOfflineSession(projectId, sessionType);
    }
  }

  async completeSession(sessionId, durationMinutes) {
    try {
      const response = await this.put(`/api/sessions/${sessionId}/complete`, {
        durationMinutes
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to complete session: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[API Service] Error completing session:', error);
      
      // Queue for retry when connection is restored
      this.queueOperation('completeSession', { sessionId, durationMinutes });
      throw error;
    }
  }

  async createBreakSession(projectId, breakType, sessionNumber) {
    try {
      const response = await this.post('/api/break-sessions', {
        projectId,
        breakType,
        sessionNumber
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to create break session: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[API Service] Error creating break session:', error);
      
      // Return offline break session
      return this.createOfflineBreakSession(projectId, breakType, sessionNumber);
    }
  }

  // Caching and offline support
  getCachedSettings() {
    try {
      const cached = localStorage.getItem('settings_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('[API Service] Error reading cached settings:', error);
      return null;
    }
  }

  cacheSettings(settings, isPending = false) {
    try {
      localStorage.setItem('settings_cache', JSON.stringify(settings));
      if (isPending) {
        localStorage.setItem('settings_pending', JSON.stringify(settings));
      }
    } catch (error) {
      console.warn('[API Service] Error caching settings:', error);
    }
  }

  getDefaultSettings() {
    return {
      defaultFocusTime: 25,
      defaultFocusTimeUnit: 'minutes',
      shortBreakTime: 5,
      shortBreakTimeUnit: 'minutes',
      longBreakTime: 15,
      longBreakTimeUnit: 'minutes',
      autoStartBreaks: true,
      autoStartPomodoros: false,
      shortBreaksBeforeLong: 3,
      maxSessionsPerDay: 8,
      longBreakInterval: 4,
      soundsEnabled: true,
      notificationSounds: true,
      ambientSounds: true,
      volume: 70,
      themePreference: 'zen',
      animationsEnabled: true,
      reducedMotion: false,
      plantAnimationSpeed: 'normal',
      clockFormat: '24h',
      browserNotifications: true,
      sessionReminders: true,
      plantCareReminders: true,
      autoSaveEnabled: true,
      dataCollection: true,
      betaFeatures: false
    };
  }

  createOfflineSession(projectId, sessionType) {
    return {
      id: `offline_${Date.now()}`,
      projectId,
      sessionType,
      startTime: new Date().toISOString(),
      offline: true
    };
  }

  createOfflineBreakSession(projectId, breakType, sessionNumber) {
    return {
      id: `offline_break_${Date.now()}`,
      projectId,
      breakType,
      sessionNumber,
      startTime: new Date().toISOString(),
      offline: true
    };
  }

  queueOperation(operation, data) {
    try {
      const queue = JSON.parse(localStorage.getItem('api_queue') || '[]');
      queue.push({
        operation,
        data,
        timestamp: Date.now()
      });
      localStorage.setItem('api_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('[API Service] Error queuing operation:', error);
    }
  }

  async processQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem('api_queue') || '[]');
      if (queue.length === 0) return;

      console.log(`[API Service] Processing ${queue.length} queued operations`);
      
      for (const item of queue) {
        try {
          switch (item.operation) {
            case 'completeSession':
              await this.completeSession(item.data.sessionId, item.data.durationMinutes);
              break;
            // Add other operations as needed
          }
        } catch (error) {
          console.warn('[API Service] Failed to process queued operation:', item, error);
        }
      }

      // Clear queue on success
      localStorage.removeItem('api_queue');
    } catch (error) {
      console.warn('[API Service] Error processing queue:', error);
    }
  }

  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      isOnline: this.isOnline
    };
  }

  async retryPendingOperations() {
    // Process any pending settings
    try {
      const pending = localStorage.getItem('settings_pending');
      if (pending) {
        const settings = JSON.parse(pending);
        await this.saveSettings(settings);
        localStorage.removeItem('settings_pending');
      }
    } catch (error) {
      console.warn('[API Service] Error retrying pending settings:', error);
    }

    // Process operation queue
    await this.processQueue();
  }
}

// Create singleton instance
const apiService = new ApiService();

// Auto-retry pending operations when connection is restored
apiService.addConnectionListener((status) => {
  if (status === 'connected') {
    setTimeout(() => {
      apiService.retryPendingOperations();
    }, 1000);
  }
});

export default apiService;


// Simple Sound Service using Web Audio API
// No external dependencies, just generated tones and white noise

class SoundService {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.audioContext = null;
    this.currentAmbient = null;
    this.ambientGainNode = null;
    this.ambientSource = null;
    
    // Initialize Web Audio Context on first user interaction
    this.initializeAudioContext();
  }

  initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  // Ensure audio context is running (handle browser autoplay policies)
  async ensureAudioContext() {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }

  // Generate a simple tone
  generateTone(frequency, duration, type = 'sine', volume = 1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      const finalVolume = this.volume * volume * 0.1; // Keep volume low
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration - 0.01);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio generation failed:', error);
    }
  }

  // Generate white noise for ambient sounds
  generateWhiteNoise(duration = null, volume = 0.1) {
    if (!this.enabled || !this.audioContext) return null;

    try {
      const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds buffer
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.value = this.volume * volume;

      return { source, gainNode };
    } catch (error) {
      console.warn('White noise generation failed:', error);
      return null;
    }
  }

  // Basic sound effects
  async playSessionStart() {
    await this.ensureAudioContext();
    // Ascending chime
    this.generateTone(523.25, 0.2); // C5
    setTimeout(() => this.generateTone(659.25, 0.2), 100); // E5
  }

  async playSessionComplete() {
    await this.ensureAudioContext();
    // Success melody
    this.generateTone(523.25, 0.3); // C5
    setTimeout(() => this.generateTone(659.25, 0.3), 150); // E5
    setTimeout(() => this.generateTone(783.99, 0.5), 300); // G5
  }

  async playPlantGrowth() {
    await this.ensureAudioContext();
    // Gentle growth chime
    this.generateTone(659.25, 0.3, 'triangle'); // E5 with softer tone
    setTimeout(() => this.generateTone(783.99, 0.4, 'triangle'), 150); // G5
  }

  async playNotification() {
    await this.ensureAudioContext();
    // Simple notification beep
    this.generateTone(880, 0.2); // A5
  }

  // Zen chime sound
  async playZenChime() {
    await this.ensureAudioContext();
    this.generateTone(523.25, 0.5); // C5
    setTimeout(() => this.generateTone(659.25, 0.5), 200); // E5
    setTimeout(() => this.generateTone(783.99, 0.8), 400); // G5
  }

  // Focus completion celebration
  async playCelebration() {
    await this.ensureAudioContext();
    this.generateTone(523.25, 0.3); // C5
    setTimeout(() => this.generateTone(659.25, 0.3), 150); // E5
    setTimeout(() => this.generateTone(783.99, 0.3), 300); // G5
    setTimeout(() => this.generateTone(1046.50, 0.5), 450); // C6
  }

  // Ambient sounds
  async playAmbient(type = 'forest') {
    this.stopAmbient();
    await this.ensureAudioContext();
    
    if (!this.enabled) return;

    if (type === 'forest') {
      // Simulate forest sounds with filtered white noise
      const noise = this.generateWhiteNoise(null, 0.03);
      if (noise) {
        this.ambientSource = noise.source;
        this.ambientGainNode = noise.gainNode;
        this.currentAmbient = type;
        this.ambientSource.start();
      }
    } else if (type === 'rain') {
      // Simulate rain with higher frequency white noise
      const noise = this.generateWhiteNoise(null, 0.05);
      if (noise) {
        this.ambientSource = noise.source;
        this.ambientGainNode = noise.gainNode;
        this.currentAmbient = type;
        this.ambientSource.start();
      }
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (error) {
        // Source might already be stopped
      }
      this.ambientSource = null;
      this.ambientGainNode = null;
      this.currentAmbient = null;
    }
  }

  // Settings
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update ambient volume if playing
    if (this.ambientGainNode) {
      this.ambientGainNode.gain.value = this.volume * 0.05;
    }
  }

  getVolume() {
    return this.volume;
  }

  isEnabled() {
    return this.enabled;
  }

  // Get current ambient type
  getCurrentAmbient() {
    return this.currentAmbient;
  }
}

// Create and export a singleton instance
const soundService = new SoundService();

export default soundService;
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import soundService from '../services/soundService';
import timerService from '../services/timerService';
import apiService from '../services/apiService';
import { PlantFactory } from '../plants/PlantFactory';
import { PlantAnimationManager } from '../animations/plantAnimations';

const FocusSession = ({ project, sessionNumber = 1, onComplete, onCancel, refreshSettings = false, autoStart = false }) => {
  
  
  const [userSettings, setUserSettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes default
  const [originalTimeLeft, setOriginalTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('TIMED');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [timerHealth, setTimerHealth] = useState(true);
  
  const intervalRef = useRef(null);
  const timerIdRef = useRef(null);
  const plantContainerRef = useRef(null);
  const plantInstanceRef = useRef(null);
  const animationManagerRef = useRef(null);

  // Initialize plant animation
  useEffect(() => {
    const initializePlant = () => {
      if (!plantContainerRef.current) return;

      try {
        // Create plant instance
        const plantInstance = PlantFactory.createPlant(project.plantType || 'generic', plantContainerRef.current);
        plantContainerRef.current.innerHTML = plantInstance.createSVG();
        
        // Create animation manager
        const animationManager = new PlantAnimationManager({ current: plantContainerRef.current });
        
        // Store references
        plantInstanceRef.current = plantInstance;
        animationManagerRef.current = animationManager;
        
        // Initialize to current health stage
        setTimeout(() => {
          const currentStage = plantInstance.calculateStage(project.health);
          plantInstance.animateToStage(currentStage);
          
          // Start idle animations
          setTimeout(() => {
            if (plantInstance.startIdleAnimations) {
              plantInstance.startIdleAnimations();
            }
          }, 1000);
        }, 100);
        
      } catch (error) {
        console.error('Failed to initialize plant:', error);
      }
    };
    
    initializePlant();
    
    // Cleanup function
    return () => {
      if (animationManagerRef.current && animationManagerRef.current.stopAllAnimations) {
        animationManagerRef.current.stopAllAnimations();
      }
      if (plantInstanceRef.current && plantInstanceRef.current.stopAnimations) {
        plantInstanceRef.current.stopAnimations();
      }
    };
  }, [project.plantType, project.health]);

  // Helper function to convert time to seconds
  const convertToSeconds = (value, unit) => {
    switch (unit) {
      case 'seconds': return value;
      case 'minutes': return value * 60;
      case 'hours': return value * 3600;
      default: return value * 60; // Default to minutes for backward compatibility
    }
  };

  // Load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        setUserSettings(settings);
        
        // Convert focus time to seconds using the time unit
        const focusTimeValue = settings.defaultFocusTime || 25;
        const focusTimeUnit = settings.defaultFocusTimeUnit || 'minutes';
        const timerDuration = convertToSeconds(focusTimeValue, focusTimeUnit);
        
        setTimeLeft(timerDuration);
        setOriginalTimeLeft(timerDuration);
      } catch (error) {
        console.error('Error loading user settings:', error);
        // Fallback to default 25 minutes
        setTimeLeft(1500);
        setOriginalTimeLeft(1500);
      }
    };

    loadUserSettings();
  }, []);

  // Auto-start the focus timer if requested (e.g., after a break)
  useEffect(() => {
    if (autoStart && !isRunning) {
      handleStart();
    }
  }, [autoStart]);

  // Auto-create session when component mounts
  useEffect(() => {
    const createSession = async () => {
      if (!sessionCreated && !sessionId) {
        try {
          const sessionData = await apiService.startSession(project.id, sessionType);
          setSessionId(sessionData.id);
          setSessionStartTime(new Date());
          setSessionCreated(true);
        } catch (error) {
          console.error('Error creating session:', error);
          // Create offline session
          const offlineSession = {
            id: `offline_${Date.now()}`,
            offline: true
          };
          setSessionId(offlineSession.id);
          setSessionStartTime(new Date());
          setSessionCreated(true);
        }
      }
    };

    createSession();
  }, [project.id, sessionType, sessionCreated, sessionId]);

  // Initialize timer service and setup
  useEffect(() => {
    // Generate unique timer ID for this session
    timerIdRef.current = `focus-${sessionId || Date.now()}`;
    
    // Check timer service health
    setTimerHealth(timerService.isHealthy());
    
    return () => {
      // Cleanup timer on unmount
      if (timerIdRef.current) {
        timerService.stopTimer(timerIdRef.current);
      }
    };
  }, [sessionId]);

  // Timer service integration
  const startTimerService = async () => {
    if (!timerIdRef.current) return;

    const timerId = timerIdRef.current;
    
    if (sessionType === 'TIMED') {
      // Start countdown timer
      await timerService.startTimer(timerId, {
        duration: timeLeft,
        type: 'countdown',
        onUpdate: (payload) => {
          setTimeLeft(payload.remainingTime);
          setElapsedTime(payload.elapsedTime);
        },
        onFinished: (payload) => {
          setIsRunning(false);
          setTimeLeft(0);
          setElapsedTime(payload.elapsedTime);
          handleComplete();
        },
        onPaused: () => {
          setIsRunning(false);
        },
        onResumed: () => {
          setIsRunning(true);
        }
      });
    } else {
      // Start stopwatch timer for open sessions
      await timerService.startTimer(timerId, {
        duration: 0,
        type: 'stopwatch',
        onUpdate: (payload) => {
          setElapsedTime(payload.elapsedTime);
        }
      });
    }
  };

  const stopTimerService = () => {
    if (timerIdRef.current) {
      timerService.stopTimer(timerIdRef.current);
    }
  };

  const pauseTimerService = () => {
    if (timerIdRef.current) {
      timerService.pauseTimer(timerIdRef.current);
    }
  };

  const resumeTimerService = () => {
    if (timerIdRef.current) {
      timerService.resumeTimer(timerIdRef.current);
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (timeLeft <= 0 && sessionType === 'TIMED' && isRunning) {
      handleComplete();
    }
  }, [timeLeft, sessionType, isRunning]);

  const handleStart = async () => {
    if (!isRunning) {
      setIsRunning(true);
      
      // Play start sound
      soundService.playSessionStart();
      
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
        
        // Start focus session on backend
        try {
          const sessionData = await apiService.startSession(project.id, sessionType);
          setSessionId(sessionData.id);
        } catch (error) {
          console.error('Error starting session:', error);
          // Will work offline
        }
      }
      
      // Start timer service
      await startTimerService();
    } else {
      setIsRunning(false);
      pauseTimerService();
    }
  };

  // Calculate next break type based on session number and settings
  const calculateNextBreakType = async () => {
    if (!userSettings) return 'SHORT';
    
    try {
      // Get today's completed focus sessions for this project
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch(`/api/projects/${project.id}/sessions?since=${today.toISOString()}`);
      const sessions = response.ok ? await response.json() : [];
      
      const completedSessions = sessions.filter(s => s.completed).length;
      const sessionNumber = completedSessions + 1; // Current session will be completed
      
      // Long break after every N sessions (default 4)
      const longBreakInterval = userSettings.longBreakInterval || 4;
      
      return sessionNumber % longBreakInterval === 0 ? 'LONG' : 'SHORT';
    } catch (error) {
      console.error('Error calculating break type:', error);
      return 'SHORT'; // Default fallback
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);
    stopTimerService();

    const durationMinutes = Math.floor(elapsedTime / 60);
    
    // Play completion sounds
    soundService.playSessionComplete();
    soundService.playCelebration();
    
    // Stop ambient sounds
    soundService.stopAmbient();
    setAmbientPlaying(false);
    
    // Complete session on backend
    if (sessionId) {
      try {
        await apiService.completeSession(sessionId, durationMinutes);
      } catch (error) {
        console.error('Error completing session:', error);
        // Session completion will be retried when connection is restored
      }
    } else {
      console.warn('No session ID available, cannot complete session on backend');
    }

    // Always go to the break screen. Auto-start of the timer is handled inside BreakSession
    // based on the user setting `autoStartBreaks`.
    try {
      const breakType = await calculateNextBreakType();
      
      const sessionData = {
        projectId: project.id,
        durationMinutes,
        completed: true,
        startBreak: true,
        breakType,
        sessionNumber
      };
      onComplete(sessionData);
      
    } catch (error) {
      console.error('Error preparing break session:', error);
      // As a fallback, still navigate to a short break screen
      onComplete({
        projectId: project.id,
        durationMinutes,
        completed: true,
        startBreak: true,
        breakType: 'SHORT',
        sessionNumber
      });
    }
  };

  const handleSkip = () => {
    if (sessionType === 'TIMED') {
      setTimeLeft(0);
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    stopTimerService();
    setTimeLeft(originalTimeLeft); // Reset to the settings-based duration
    setElapsedTime(0);
    setSessionStartTime(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (sessionType === 'TIMED') {
      const totalTime = originalTimeLeft || 1;
      return ((totalTime - timeLeft) / totalTime) * 100;
    } else {
      // For open sessions, show a gentle pulse
      return Math.abs(Math.sin(elapsedTime / 10)) * 100;
    }
  };

  const getHealthBoost = () => {
    const minutes = Math.floor(elapsedTime / 60);
    return Math.min(20, Math.floor(minutes / 5));
  };

  const toggleAmbientSound = () => {
    if (ambientPlaying) {
      soundService.stopAmbient();
      setAmbientPlaying(false);
    } else {
      soundService.playAmbient('forest');
      setAmbientPlaying(true);
    }
  };

  const toggleSounds = () => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    soundService.setEnabled(newState);
    
    if (!newState) {
      soundService.stopAmbient();
      setAmbientPlaying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="zen-card max-w-lg w-full p-8 text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-zen-800">
              Focusing on {project.name}
            </h1>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              Session {sessionNumber}
            </span>
          </div>
          <p className="text-zen-600">
            Stay focused and watch your plant grow 🌱
          </p>
          {userSettings && (
            <div className="mt-3 text-sm text-nature-600 bg-nature-50 rounded-lg px-3 py-1 inline-block">
              Timer Setting: {userSettings.defaultFocusTime} {userSettings.defaultFocusTimeUnit}
            </div>
          )}
          
          {/* Timer Health Indicator */}
          {!timerHealth && (
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1 inline-block">
              ⚠️ Using fallback timer (Web Worker unavailable)
            </div>
          )}
        </div>

        {/* Plant Animation */}
        <div className="mb-8 flex justify-center">
          <motion.div
            animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="focus-plant-container"
          >
            <div 
              ref={plantContainerRef}
              className="plant-anime-container"
              style={{ 
                width: '200px', 
                height: '200px',
                position: 'relative'
              }}
            />
          </motion.div>
        </div>

        {/* Timer Display */}
        <div className="mb-8">
          <div className="relative w-48 h-48 mx-auto mb-4">
            {/* Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-zen-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className="text-nature-500 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Timer Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <div className="text-3xl font-mono font-bold text-zen-800">
                  {sessionType === 'TIMED' ? formatTime(timeLeft) : formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-zen-600 mt-1">
                  {sessionType === 'TIMED' ? 'remaining' : 'elapsed'}
                </div>
              </div>
            </div>
          </div>

          {/* Session Type Selector */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setSessionType('TIMED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sessionType === 'TIMED'
                  ? 'bg-nature-500 text-white'
                  : 'bg-zen-100 text-zen-600 hover:bg-zen-200'
              }`}
              disabled={isRunning}
            >
{userSettings ? 
                `${userSettings.defaultFocusTime} ${userSettings.defaultFocusTimeUnit} Timer` : 
                'Timer (Loading...)'
              }
            </button>
            <button
              onClick={() => setSessionType('OPEN')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sessionType === 'OPEN'
                  ? 'bg-nature-500 text-white'
                  : 'bg-zen-100 text-zen-600 hover:bg-zen-200'
              }`}
              disabled={isRunning}
            >
              Open Session
            </button>
          </div>
        </div>

        {/* Session Stats */}
        <div className="mb-8 p-4 bg-nature-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-nature-700">Time Focused:</span>
            <span className="font-medium text-nature-800">
              {Math.floor(elapsedTime / 60)} minutes
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-nature-700">Health Boost:</span>
            <span className="font-medium text-nature-800">
              +{getHealthBoost()} health
            </span>
          </div>
        </div>

        {/* Sound Controls */}
        <div className="mb-6 flex justify-center gap-2">
          <motion.button
            onClick={toggleSounds}
            className={`p-3 rounded-xl transition-colors ${
              soundsEnabled
                ? 'bg-nature-100 text-nature-700 hover:bg-nature-200'
                : 'bg-zen-100 text-zen-500 hover:bg-zen-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={soundsEnabled ? 'Disable sounds' : 'Enable sounds'}
          >
            {soundsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>

          {soundsEnabled && (
            <motion.button
              onClick={toggleAmbientSound}
              className={`p-3 rounded-xl transition-colors ${
                ambientPlaying
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-zen-100 text-zen-600 hover:bg-zen-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={ambientPlaying ? 'Stop ambient sounds' : 'Play forest sounds'}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              🌲
            </motion.button>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleStart}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'zen-button'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                {sessionStartTime ? 'Resume' : 'Start'}
              </>
            )}
          </button>

          {sessionStartTime && (
            <>
              <button
                onClick={handleReset}
                className="zen-button-secondary flex items-center gap-2 px-6 py-3"
              >
                <RotateCcw size={20} />
                Reset
              </button>
              <button
                onClick={handleSkip}
                className="zen-button-secondary flex items-center gap-2 px-6 py-3"
              >
                <SkipForward size={20} />
                {sessionType === 'TIMED' ? 'Skip' : 'Complete'}
              </button>
            </>
          )}
        </div>

        {/* Exit Button */}
        <button
          onClick={onCancel}
          className="text-zen-500 hover:text-zen-700 transition-colors text-sm flex items-center gap-2 mx-auto"
        >
          <Square size={16} />
          Exit Session
        </button>

        {/* Focus Tips */}
        <div className="mt-8 p-4 bg-zen-50 rounded-lg text-left">
          <h4 className="font-medium text-zen-800 mb-2">💡 Focus Tips</h4>
          <ul className="text-sm text-zen-600 space-y-1">
            <li>• Turn off notifications and close distracting tabs</li>
            <li>• Take deep breaths and set a clear intention</li>
            <li>• Break large tasks into smaller, manageable steps</li>
            <li>• Stay hydrated and maintain good posture</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FocusSession;

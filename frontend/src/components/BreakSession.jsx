import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Coffee, TreePine, RotateCcw, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import soundService from '../services/soundService';
import timerService from '../services/timerService';
import apiService from '../services/apiService';

const BreakSession = ({ project, onComplete, onSkip, onCancel, breakType = 'SHORT', sessionNumber = 1 }) => {
  const [userSettings, setUserSettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // Default 5 minutes
  const [originalTimeLeft, setOriginalTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakId, setBreakId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerHealth, setTimerHealth] = useState(true);
  
  const intervalRef = useRef(null);
  const timerIdRef = useRef(null);

  // Helper function to convert time to seconds
  const convertToSeconds = (value, unit) => {
    switch (unit) {
      case 'seconds': return value;
      case 'minutes': return value * 60;
      case 'hours': return value * 3600;
      default: return value * 60; // Default to minutes for backward compatibility
    }
  };

  // Load user settings and set break duration
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        setUserSettings(settings);
        
        // Set break duration based on type and settings with time units
        const breakDurationValue = breakType === 'LONG' 
          ? (settings.longBreakTime || 5) 
          : (settings.shortBreakTime || 2);
        const breakDurationUnit = breakType === 'LONG'
          ? (settings.longBreakTimeUnit || 'minutes')
          : (settings.shortBreakTimeUnit || 'minutes');
        
        const timerDuration = convertToSeconds(breakDurationValue, breakDurationUnit);
          
        setTimeLeft(timerDuration);
        setOriginalTimeLeft(timerDuration);
        
        // Auto-start break if enabled
        if (settings.autoStartBreaks) {
          setTimeout(() => {
            handleStart();
          }, 1000); // 1 second delay for user to see the break screen
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        setTimeLeft(breakType === 'LONG' ? 900 : 300);
        setOriginalTimeLeft(breakType === 'LONG' ? 900 : 300);
      }
    };

    loadUserSettings();
  }, [breakType]);

  // Initialize timer service
  useEffect(() => {
    // Generate unique timer ID for this break session
    timerIdRef.current = `break-${breakId || Date.now()}`;
    
    // Check timer service health
    setTimerHealth(timerService.isHealthy());
    
    return () => {
      // Cleanup timer on unmount
      if (timerIdRef.current) {
        timerService.stopTimer(timerIdRef.current);
      }
    };
  }, [breakId]);

  // Auto-create break session when component mounts
  useEffect(() => {
    let isCancelled = false; // Flag to prevent race conditions
    
    const createBreakSession = async () => {
      if (!breakId && !isCancelled) {
        try {
          const breakSession = await apiService.createBreakSession(
            project.id, 
            breakType, 
            sessionNumber
          );
          
          if (!isCancelled) {
            setBreakId(breakSession.id);
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('Error creating break session:', error);
            // Create offline break session
            const offlineBreak = {
              id: `offline_break_${Date.now()}`,
              offline: true
            };
            setBreakId(offlineBreak.id);
          }
        }
      } else if (breakId) {
      }
    };

    createBreakSession();
    
    // Cleanup function to cancel async operations
    return () => {
      isCancelled = true;
    };
  }, []); // Empty dependency array to run only once

  // If auto-start breaks is disabled, don't auto-start here.
  // Start is handled by settings-based effect above.

  // Timer service integration
  const startTimerService = async () => {
    if (!timerIdRef.current) return;

    const timerId = timerIdRef.current;
    
    // Start countdown timer for break
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
    if (timeLeft <= 0 && isRunning) {
      handleComplete();
    }
  }, [timeLeft, isRunning]);

  const handleStart = async () => {
    setIsRunning(true);
    if (!breakStartTime) {
      setBreakStartTime(new Date());
    }
    
    // Play start sound
    if (userSettings?.soundsEnabled && userSettings?.notificationSounds) {
      soundService.playBreakStart();
    }
    
    // Start timer service
    await startTimerService();
  };

  const handlePause = () => {
    setIsRunning(false);
    pauseTimerService();
  };

  const handleComplete = async () => {
    setIsRunning(false);
    stopTimerService();
    
    // Play completion sound
    if (userSettings?.soundsEnabled && userSettings?.notificationSounds) {
      soundService.playBreakComplete();
    }

    // Update break session in backend
    if (breakId && breakStartTime) {
      try {
        const durationMinutes = elapsedTime / 60;
        
        await fetch(`/api/break-sessions/${breakId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            durationMinutes,
            completed: true
          }),
        });
        
        
      } catch (error) {
        console.error('Error completing break session:', error);
      }
    }

    onComplete();
    
  };

  const handleSkipBreak = () => {
    setIsRunning(false);
    stopTimerService();
    
    // Mark break as skipped
    if (breakId) {
      fetch(`/api/break-sessions/${breakId}/skip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skipped: true
        }),
      }).catch(console.error);
    }
    
    onSkip();
  };

  const handleReset = () => {
    setIsRunning(false);
    stopTimerService();
    setTimeLeft(originalTimeLeft);
    setElapsedTime(0);
    setBreakStartTime(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakIcon = () => {
    return breakType === 'LONG' ? <TreePine size={48} /> : <Coffee size={48} />;
  };

  const getBreakColor = () => {
    return breakType === 'LONG' ? 'from-blue-400 to-purple-500' : 'from-orange-400 to-yellow-500';
  };

  const getBreakDescription = () => {
    return breakType === 'LONG' 
      ? 'Take a longer break, stretch, walk around, or do something refreshing!'
      : 'Take a short break, hydrate, breathe, or look away from the screen!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Background ambient animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-30"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl font-light text-blue-800">
              {breakType === 'LONG' ? 'Take a Deep Break' : 'Breathe & Relax'}
            </h1>
            <span className="bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              After Session {sessionNumber}
            </span>
          </div>
          <p className="text-blue-600 text-lg font-light">
            {getBreakDescription()}
          </p>
        </motion.div>

        {/* Central animated circle with timer */}
        <div className="relative mb-12 flex items-center justify-center">
          {/* Radiating rings */}
          <motion.div
            className="absolute w-96 h-96 rounded-full border-2 border-blue-300 opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full border-2 border-blue-400 opacity-30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full border border-blue-500 opacity-40"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          {/* Main blue circle with timer */}
          <motion.div
            className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl flex items-center justify-center"
            animate={isRunning ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 25px 50px -12px rgba(59, 130, 246, 0.5)",
                "0 25px 50px -12px rgba(59, 130, 246, 0.8)",
                "0 25px 50px -12px rgba(59, 130, 246, 0.5)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (timeLeft / originalTimeLeft)}
                transition={{ duration: 0.3 }}
              />
            </svg>

            {/* Timer display */}
            <div className="text-center text-white">
              <motion.div
                className="text-3xl font-light mb-1"
                animate={isRunning ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <div className="text-xs opacity-80 uppercase tracking-wide">
                {breakType === 'LONG' ? 'Long Break' : 'Short Break'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Session info */}
        {userSettings && (
          <motion.div 
            className="mb-8 text-blue-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-sm opacity-80">
              Session {sessionNumber} • {breakType === 'LONG' 
                ? `${userSettings.longBreakTime} ${userSettings.longBreakTimeUnit} break` 
                : `${userSettings.shortBreakTime} ${userSettings.shortBreakTimeUnit} break`}
            </div>
            
            {/* Timer Health Indicator */}
            {!timerHealth && (
              <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1 inline-block">
                ⚠️ Using fallback timer (Web Worker unavailable)
              </div>
            )}
          </motion.div>
        )}

        {/* Minimal controls */}
        <motion.div 
          className="flex justify-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={isRunning ? handlePause : handleStart}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-blue-700 hover:bg-white/30 transition-all duration-300 group"
          >
            {isRunning ? (
              <Pause size={20} className="group-hover:scale-110 transition-transform" />
            ) : (
              <Play size={20} className="ml-1 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {breakStartTime && (
            <>
              <button
                onClick={handleReset}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-blue-700 hover:bg-white/30 transition-all duration-300 group"
              >
                <RotateCcw size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={handleSkipBreak}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-blue-700 hover:bg-white/30 transition-all duration-300 group"
              >
                <SkipForward size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </motion.div>

        {/* Breathing guide and next session info */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {isRunning ? (
            <div className="space-y-4">
              <div className="text-blue-600 text-sm font-light">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  Breathe in... and out...
                </motion.div>
              </div>
              <div className="text-blue-500 text-xs opacity-70">
                Next: Focus Session {sessionNumber + 1}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-blue-600 text-sm font-medium">
                🎯 Ready for Focus Session {sessionNumber + 1}
              </div>
              {userSettings?.autoStartPomodoros ? (
                <div className="text-blue-500 text-xs opacity-70">
                  Next session will start automatically...
                </div>
              ) : (
                <button
                  onClick={onComplete}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Next Session
                </button>
              )}
              <button
                onClick={onCancel}
                className="text-blue-500 hover:text-blue-700 transition-colors text-sm flex items-center gap-2 mx-auto opacity-60 hover:opacity-100"
              >
                <Square size={14} />
                Exit Pomodoro Cycle
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BreakSession;

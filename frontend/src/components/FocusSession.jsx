import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import soundService from '../services/soundService';
import { PlantFactory } from '../plants/PlantFactory';
import { PlantAnimationManager } from '../animations/plantAnimations';

const FocusSession = ({ project, onComplete, onCancel }) => {
  console.log('FocusSession rendered with project:', project);
  
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds for testing (was 25 * 60)
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('TIMED');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  
  const intervalRef = useRef(null);
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

  // Auto-create session when component mounts
  useEffect(() => {
    const createSession = async () => {
      if (!sessionCreated && !sessionId) {
        try {
          console.log('Creating session for project:', project.id);
          const response = await fetch('http://localhost:3001/api/sessions/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: project.id,
              sessionType
            }),
          });
          
          if (response.ok) {
            const sessionData = await response.json();
            console.log('Session created:', sessionData);
            setSessionId(sessionData.id);
            setSessionStartTime(new Date());
            setSessionCreated(true);
          } else {
            console.error('Failed to create session:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    createSession();
  }, [project.id, sessionType, sessionCreated, sessionId]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (sessionType === 'TIMED') {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleComplete();
              return 0;
            }
            return prev - 1;
          });
        }
        
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, sessionType]);

  const handleStart = async () => {
    if (!isRunning) {
      setIsRunning(true);
      
      // Play start sound
      soundService.playSessionStart();
      
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
        
        // Start focus session on backend
        try {
          const response = await fetch('http://localhost:3001/api/sessions/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: project.id,
              sessionType
            }),
          });
          
          if (response.ok) {
            const sessionData = await response.json();
            setSessionId(sessionData.id);
          }
        } catch (error) {
          console.error('Error starting session:', error);
        }
      }
    } else {
      setIsRunning(false);
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);

    const durationMinutes = Math.floor(elapsedTime / 60);
    console.log('Completing session:', { sessionId, durationMinutes, elapsedTime });
    
    // Play completion sounds
    soundService.playSessionComplete();
    soundService.playCelebration();
    
    // Stop ambient sounds
    soundService.stopAmbient();
    setAmbientPlaying(false);
    
    // Complete session on backend
    if (sessionId) {
      try {
        console.log('Sending completion request for session:', sessionId);
        const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            durationMinutes
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Session completed successfully:', result);
        } else {
          console.error('Failed to complete session:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    } else {
      console.warn('No session ID available, cannot complete session on backend');
    }

    onComplete({
      projectId: project.id,
      durationMinutes,
      completed: true
    });
  };

  const handleSkip = () => {
    if (sessionType === 'TIMED') {
      setTimeLeft(0);
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (sessionType === 'TIMED') {
      const totalTime = 10; // 10 seconds for testing (was 25 * 60)
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
          <h1 className="text-2xl font-bold text-zen-800 mb-2">
            Focusing on {project.name}
          </h1>
          <p className="text-zen-600">
            Stay focused and watch your plant grow 🌱
          </p>
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
              10 sec Timer (Testing)
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
            <button
              onClick={handleSkip}
              className="zen-button-secondary flex items-center gap-2 px-6 py-3"
            >
              <SkipForward size={20} />
              {sessionType === 'TIMED' ? 'Skip' : 'Complete'}
            </button>
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

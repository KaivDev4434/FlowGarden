import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';

const FocusSession = ({ project, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('TIMED');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationData, setAnimationData] = useState(null);
  
  const intervalRef = useRef(null);
  const playerRef = useRef(null);

  // Load plant animation
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await import(`../assets/lottie/plants/${project.lottieFileName}.json`);
        setAnimationData(response.default);
      } catch (error) {
        console.error('Failed to load animation:', error);
      }
    };
    
    loadAnimation();
  }, [project.lottieFileName]);

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
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
        
        // Start focus session on backend
        try {
          await fetch('http://localhost:3001/api/sessions/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: project.id,
              sessionType
            }),
          });
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
    
    // Complete session on backend
    try {
      await fetch(`http://localhost:3001/api/sessions/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          durationMinutes,
          projectId: project.id
        }),
      });
    } catch (error) {
      console.error('Error completing session:', error);
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
      const totalTime = 25 * 60;
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
          {animationData && (
            <Player
              ref={playerRef}
              autoplay
              loop
              src={animationData}
              style={{ height: '200px', width: '200px' }}
              className={isRunning ? 'animate-gentle-pulse' : ''}
            />
          )}
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
              25 min Timer
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

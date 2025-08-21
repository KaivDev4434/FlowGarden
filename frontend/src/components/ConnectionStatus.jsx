import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = apiService.addConnectionListener((newStatus, online, event) => {
      setStatus(newStatus);
      setIsOnline(online);
      setLastEvent(event);
      
      // Show status indicator for a few seconds when status changes
      if (event && newStatus !== 'unknown') {
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 5000);
      }
    });

    // Initial status check
    const initialStatus = apiService.getConnectionStatus();
    setStatus(initialStatus.status);
    setIsOnline(initialStatus.isOnline);

    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'Connected to server',
          pulse: false
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'No internet connection',
          pulse: true
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          message: 'Server connection error',
          pulse: true
        };
      default:
        return {
          icon: Wifi,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          message: 'Checking connection...',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Only show if there's an issue or user needs to see status
  const shouldShow = showStatus || !isOnline || status === 'error';

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div 
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg
              ${config.bgColor} ${config.borderColor}
            `}
          >
            <motion.div
              animate={config.pulse ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Icon size={16} className={config.color} />
            </motion.div>
            
            <span className={`text-sm font-medium ${config.color}`}>
              {config.message}
            </span>

            {/* Additional info for offline mode */}
            {!isOnline && (
              <span className="text-xs text-gray-500 ml-2">
                • Working offline
              </span>
            )}
          </div>

          {/* Detailed status for errors */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-white rounded-lg border border-orange-200 shadow-sm"
            >
              <p className="text-xs text-gray-600 mb-2">
                Can't reach the server. Your progress is being saved locally.
              </p>
              <button
                onClick={() => apiService.checkConnection()}
                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors"
              >
                Retry Connection
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;


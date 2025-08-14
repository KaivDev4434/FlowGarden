import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Heart, AlertTriangle, X } from 'lucide-react';

const PlantCareReminder = ({ projects, onWaterPlant }) => {
  const [needingCare, setNeedingCare] = useState([]);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    checkPlantsNeedingCare();
  }, [projects]);

  const checkPlantsNeedingCare = () => {
    const now = new Date();
    const plantsNeedingCare = projects.filter(plant => {
      const minutesSinceWatered = (now - new Date(plant.lastWateredAt)) / (1000 * 60);
      return minutesSinceWatered > 1 || plant.health < 30; // Show reminder after 1 minute for testing
    });

    setNeedingCare(plantsNeedingCare);
    setShowReminder(plantsNeedingCare.length > 0);
  };

  const handleWaterPlant = async (plantId) => {
    await onWaterPlant(plantId);
    // Remove from reminder list
    setNeedingCare(prev => prev.filter(p => p.id !== plantId));
    
    // Hide reminder if no more plants need care
    if (needingCare.length <= 1) {
      setShowReminder(false);
    }
  };

  const getCareUrgency = (plant) => {
    const minutesSinceWatered = (new Date() - new Date(plant.lastWateredAt)) / (1000 * 60);
    
    if (plant.health < 20 || minutesSinceWatered > 5) return 'critical'; // 5 minutes for testing
    if (plant.health < 40 || minutesSinceWatered > 3) return 'urgent'; // 3 minutes for testing
    return 'attention';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle size={16} className="text-red-500" />;
      case 'urgent': return <Droplets size={16} className="text-orange-500" />;
      default: return <Heart size={16} className="text-yellow-500" />;
    }
  };

  if (!showReminder || needingCare.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 max-w-sm z-50"
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="zen-card p-4 shadow-xl border-l-4 border-l-nature-500">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="text-nature-600" size={20} />
              <h3 className="font-semibold text-zen-800">Plant Care Reminder</h3>
            </div>
            <button
              onClick={() => setShowReminder(false)}
              className="text-zen-400 hover:text-zen-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Plants needing care */}
          <div className="space-y-2">
            {needingCare.slice(0, 3).map((plant) => {
              const urgency = getCareUrgency(plant);
              return (
                <motion.div
                  key={plant.id}
                  className={`p-3 rounded-lg border ${getUrgencyColor(urgency)}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getUrgencyIcon(urgency)}
                      <div>
                        <p className="font-medium text-sm">{plant.name}</p>
                        <p className="text-xs opacity-75">
                          Health: {plant.health}% • {plant.plantType.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => handleWaterPlant(plant.id)}
                      className="zen-button-secondary text-xs px-3 py-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Water
                    </motion.button>
                  </div>
                  
                  {/* Urgency message */}
                  <p className="text-xs mt-2 opacity-75">
                    {urgency === 'critical' && "🚨 Needs immediate attention!"}
                    {urgency === 'urgent' && "⚠️ Hasn't been watered in a while"}
                    {urgency === 'attention' && "💡 Could use some care"}
                  </p>
                </motion.div>
              );
            })}
            
            {needingCare.length > 3 && (
              <p className="text-xs text-zen-600 text-center">
                ...and {needingCare.length - 3} more plants
              </p>
            )}
          </div>

          {/* Care tips */}
          <div className="mt-4 p-3 bg-nature-50 rounded-lg">
            <h4 className="text-xs font-medium text-nature-800 mb-1">💡 Quick Care Tips</h4>
            <ul className="text-xs text-nature-700 space-y-1">
              <li>• Complete focus sessions to boost plant health</li>
              <li>• Water withering plants with the water button</li>
              <li>• Healthy plants (80%+) are less likely to wither</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlantCareReminder;

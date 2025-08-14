import { useState, useEffect, useRef } from 'react';
import { Edit3, Play, Trash2, Heart, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import soundService from '../services/soundService';
import { PlantFactory } from '../plants/PlantFactory';
import { PlantAnimationManager } from '../animations/plantAnimations';

const PlantCard = ({ plant, onFocusStart, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [plantName, setPlantName] = useState(plant.name);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isWithering, setIsWithering] = useState(false);
  const [lastHealthUpdate, setLastHealthUpdate] = useState(plant.health);
  const plantContainerRef = useRef(null);
  const plantInstanceRef = useRef(null);
  const animationManagerRef = useRef(null);

  // Initialize Anime.js plant
  useEffect(() => {
    const initializePlant = () => {
      if (!plantContainerRef.current) return;

      try {
        // Create plant instance
        const plantInstance = PlantFactory.createPlant(plant.plantType || 'generic', plantContainerRef.current);
        plantContainerRef.current.innerHTML = plantInstance.createSVG();
        
        // Create animation manager
        const animationManager = new PlantAnimationManager({ current: plantContainerRef.current });
        
        // Store references
        plantInstanceRef.current = plantInstance;
        animationManagerRef.current = animationManager;
        
        // Initialize to current health stage
        setTimeout(() => {
          const currentStage = plantInstance.calculateStage(plant.health);
          plantInstance.animateToStage(currentStage);
          
          // Start idle animations
          setTimeout(() => {
            if (plantInstance.startIdleAnimation) {
              plantInstance.startIdleAnimation();
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
      if (animationManagerRef.current) {
        animationManagerRef.current.destroy();
      }
      if (plantInstanceRef.current) {
        plantInstanceRef.current.destroy();
      }
    };
  }, [plant.plantType]);

  // Health change detection for celebrations and stage updates
  useEffect(() => {
    if (plant.health !== lastHealthUpdate && plantInstanceRef.current && animationManagerRef.current) {
      const oldStage = plantInstanceRef.current.calculateStage(lastHealthUpdate);
      const newStage = plantInstanceRef.current.calculateStage(plant.health);
      
      // Handle health increase
      if (plant.health > lastHealthUpdate) {
        setShowCelebration(true);
        soundService.playPlantGrowth();
        animationManagerRef.current.celebrate();
        setTimeout(() => setShowCelebration(false), 2000);
      }
      
      // Handle stage change
      if (newStage !== oldStage) {
        plantInstanceRef.current.animateToStage(newStage);
      }
      
      // Handle withering
      if (plant.health < 20 && lastHealthUpdate >= 20) {
        animationManagerRef.current.startWithering();
      } else if (plant.health >= 20 && lastHealthUpdate < 20) {
        animationManagerRef.current.revive();
      }
      
      // Add glow for very healthy plants
      if (plant.health >= 90 && lastHealthUpdate < 90) {
        animationManagerRef.current.addGlowEffect();
      }
    }
    setLastHealthUpdate(plant.health);
  }, [plant.health, lastHealthUpdate]);

  // Withering detection (reduced for testing)
  useEffect(() => {
    const minutesSinceWatered = (new Date() - new Date(plant.lastWateredAt)) / (1000 * 60);
    setIsWithering(minutesSinceWatered > 2 && plant.health < 30); // 2 minutes for testing (was 24 hours)
  }, [plant.lastWateredAt, plant.health]);

  // Handle watering action
  const handleWater = () => {
    if (animationManagerRef.current) {
      animationManagerRef.current.createWaterDrops();
    }
    onEdit(plant.id, { health: Math.min(100, plant.health + 10) });
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-nature-600';
    if (health >= 60) return 'text-nature-500';
    if (health >= 40) return 'text-yellow-500';
    if (health >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStageLabel = (health) => {
    const stage = Math.floor(health / 20);
    const labels = ['Seed', 'Sprout', 'Young', 'Mature', 'Blooming'];
    return labels[Math.min(stage, labels.length - 1)];
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (plantName.trim() && plantName !== plant.name) {
      onEdit(plant.id, { name: plantName.trim() });
    }
    setIsEditing(false);
  };

  const handleFocusClick = () => {
    onFocusStart(plant.id);
  };

  const timeSinceWatered = () => {
    const now = new Date();
    const lastWatered = new Date(plant.lastWateredAt);
    const diffInHours = Math.floor((now - lastWatered) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just watered';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <motion.div 
      className="plant-card group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Plant Animation Container */}
      <div className="relative mb-4">
        {/* Main Plant Animation */}
        <motion.div
          animate={isWithering ? { rotate: [-1, 1, -1], scale: [1, 0.98, 1] } : {}}
          transition={{ duration: 3, repeat: isWithering ? Infinity : 0 }}
          className={`transition-all duration-500 ${isWithering ? 'opacity-70' : ''}`}
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
        
        {/* Health indicator overlay */}
        <motion.div 
          className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
          animate={plant.health < 20 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: plant.health < 20 ? Infinity : 0 }}
        >
          <div className={`text-sm font-bold ${getHealthColor(plant.health)}`}>
            {plant.health}%
          </div>
        </motion.div>

        {/* Withering Warning */}
        <AnimatePresence>
          {isWithering && (
            <motion.div
              className="absolute top-2 left-2 bg-red-100 text-red-600 rounded-full p-2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Droplets size={16} className="animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons (visible on hover) */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
              title="Edit name"
            >
              <Edit3 size={16} className="text-zen-600" />
            </button>
            <button
              onClick={() => onDelete(plant.id)}
              className="bg-white/90 hover:bg-red-100 p-2 rounded-full transition-colors"
              title="Delete plant"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Plant Info */}
      <div className="space-y-3">
        {/* Name */}
        {isEditing ? (
          <form onSubmit={handleNameSubmit} className="mb-2">
            <input
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="w-full text-lg font-semibold text-zen-800 bg-transparent border-b-2 border-nature-300 focus:border-nature-500 outline-none"
              autoFocus
            />
          </form>
        ) : (
          <h3 
            className="text-lg font-semibold text-zen-800 cursor-pointer hover:text-nature-600 transition-colors"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {plant.name}
          </h3>
        )}

        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-zen-600">
            <span>Health</span>
            <span className={getHealthColor(plant.health)}>
              {getStageLabel(plant.health)}
            </span>
          </div>
          <div className="w-full bg-zen-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                plant.health >= 80 
                  ? 'bg-nature-500' 
                  : plant.health >= 60 
                  ? 'bg-nature-400' 
                  : plant.health >= 40 
                  ? 'bg-yellow-400' 
                  : plant.health >= 20 
                  ? 'bg-orange-400' 
                  : 'bg-red-400'
              }`}
              style={{ width: `${plant.health}%` }}
            />
          </div>
        </div>

        {/* Plant Type & Last Watered */}
        <div className="flex justify-between text-sm text-zen-500">
          <span className="capitalize">{plant.plantType.toLowerCase()}</span>
          <span>{timeSinceWatered()}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {/* Water Plant Button (if withering) */}
          {isWithering && (
            <motion.button
              onClick={handleWater}
              className="zen-button-secondary flex items-center justify-center gap-2 flex-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Droplets size={16} />
              Water
            </motion.button>
          )}
          
          {/* Focus Button */}
          <motion.button
            onClick={handleFocusClick}
            className="zen-button flex items-center justify-center gap-2 flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={16} />
            Start Focus
          </motion.button>
        </div>

        {/* Plant Status Indicators */}
        <div className="flex justify-center gap-1 mt-2">
          {plant.health >= 80 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-nature-500"
            >
              <Heart size={12} fill="currentColor" />
            </motion.div>
          )}
          {isWithering && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-red-500"
            >
              <Droplets size={12} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlantCard;

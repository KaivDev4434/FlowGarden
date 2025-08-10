import { useState, useEffect, useRef } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { Edit3, Play, Trash2 } from 'lucide-react';

const PlantCard = ({ plant, onFocusStart, onEdit, onDelete }) => {
  const [animationData, setAnimationData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [plantName, setPlantName] = useState(plant.name);
  const playerRef = useRef(null);

  // Load animation based on plant type
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await import(`../assets/lottie/plants/${plant.lottieFileName}.json`);
        setAnimationData(response.default);
      } catch (error) {
        console.error('Failed to load animation:', error);
        // Fallback to a simple animation
        setAnimationData({
          v: "5.8.1",
          fr: 30,
          ip: 0,
          op: 60,
          w: 200,
          h: 200,
          nm: "Simple Plant",
          layers: []
        });
      }
    };
    
    loadAnimation();
  }, [plant.lottieFileName]);

  // Calculate animation segments based on health
  const getCurrentSegments = (health) => {
    const stage = Math.floor(health / 20);
    const progress = (health % 20) / 20;
    
    const stages = [
      [0, 30],   // Seed (0-20 health)
      [30, 60],  // Sprout (21-40 health)
      [60, 90],  // Young (41-60 health)
      [90, 120], // Mature (61-80 health)
      [120, 150] // Blooming (81-100 health)
    ];
    
    if (stage >= stages.length) return stages[stages.length - 1];
    
    const [start, end] = stages[stage];
    const currentFrame = start + (progress * (end - start));
    
    return [start, currentFrame];
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
    <div className="plant-card group relative">
      {/* Plant Animation */}
      <div className="relative mb-4">
        {animationData && (
          <Player
            ref={playerRef}
            autoplay
            loop
            src={animationData}
            style={{ height: '200px', width: '200px' }}
            className="animate-plant-sway"
          />
        )}
        
        {/* Health indicator overlay */}
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-2">
          <div className={`text-sm font-bold ${getHealthColor(plant.health)}`}>
            {plant.health}%
          </div>
        </div>

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

        {/* Focus Button */}
        <button
          onClick={handleFocusClick}
          className="zen-button w-full flex items-center justify-center gap-2 mt-4"
        >
          <Play size={16} />
          Start Focus
        </button>
      </div>
    </div>
  );
};

export default PlantCard;

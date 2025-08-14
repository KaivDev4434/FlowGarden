import React, { useEffect, useRef } from 'react';
import PlantSVG from './PlantSVG';

const PlantController = ({ plant, onPlantClick }) => {
  const plantInstanceRef = useRef(null);
  const previousHealth = useRef(plant.health);
  
  // Growth stage calculation - matches the plant classes
  const getGrowthStage = (health) => {
    if (health <= 0) return 'dead';
    if (health <= 20) return 'seed';
    if (health <= 40) return 'sprout';
    if (health <= 60) return 'young';
    if (health <= 80) return 'mature';
    return 'blooming';
  };

  // Handle plant click
  const handlePlantClick = () => {
    if (onPlantClick) {
      onPlantClick(plant);
    }
  };

  // Handle health changes and stage transitions
  useEffect(() => {
    if (!plantInstanceRef.current) return;
    
    const currentStage = getGrowthStage(plant.health);
    const previousStage = getGrowthStage(previousHealth.current);
    
    if (currentStage !== previousStage) {
      console.log(`Plant transitioning from ${previousStage} to ${currentStage} (health: ${plant.health})`);
      
      // Use the plant instance's animation methods
      plantInstanceRef.current.animateToStage(currentStage);
    }
    
    previousHealth.current = plant.health;
  }, [plant.health]);

  return (
    <div 
      className="plant-controller cursor-pointer hover:scale-105 transition-transform duration-200 zen-card p-4"
      onClick={handlePlantClick}
      title={`Click to start focus session for ${plant.name}`}
    >
      <PlantSVG 
        ref={plantInstanceRef}
        health={plant.health} 
        plantType={plant.plantType || 'generic'}
        className="plant-display"
      />
      
      {/* Plant Info */}
      <div className="plant-info mt-3 text-center">
        <h3 className="text-lg font-semibold text-zen-800 mb-1">{plant.name}</h3>
        <div className="text-sm text-zen-600 mb-2">
          Stage: {getGrowthStage(plant.health).charAt(0).toUpperCase() + getGrowthStage(plant.health).slice(1)}
        </div>
        
        {/* Health Bar */}
        <div className="w-full bg-zen-200 rounded-full h-2 mb-2">
          <div 
            className="bg-nature-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${plant.health}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-zen-500">
          Health: {plant.health}%
        </div>
        
        {/* Click to focus hint */}
        <div className="text-xs text-zen-400 mt-1 opacity-75">
          Click to start focus session
        </div>
      </div>
    </div>
  );
};

export default PlantController;

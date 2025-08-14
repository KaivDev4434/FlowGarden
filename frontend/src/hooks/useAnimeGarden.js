// hooks/useAnimeGarden.js
import { useEffect, useRef, useState } from 'react';
import { PlantFactory } from '../plants/PlantFactory';
import { PlantAnimationManager } from '../animations/plantAnimations';

export const useAnimeGarden = (plants) => {
  const gardenRef = useRef(null);
  const plantInstances = useRef(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const initializePlant = (plant) => {
    const container = document.createElement('div');
    container.className = 'plant-container relative';
    container.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 200px;
      height: 200px;
      margin: 10px;
    `;
    
    const plantInstance = PlantFactory.createPlant(plant.plantType || 'generic', container);
    container.innerHTML = plantInstance.createSVG();
    
    const animationManager = new PlantAnimationManager({ current: container });
    plantInstance.animationManager = animationManager;
    
    // Set initial health
    plantInstance.updateHealth(plant.health);
    
    plantInstances.current.set(plant.id, { 
      plant: plantInstance, 
      container, 
      animationManager 
    });
    
    return container;
  };

  const updatePlantHealth = (plantId, newHealth, oldHealth) => {
    const instance = plantInstances.current.get(plantId);
    if (!instance) return;

    const { plant, animationManager } = instance;
    
    // Determine animation based on health change
    if (newHealth > oldHealth + 15) {
      animationManager.celebrate();
    } else if (newHealth < 20 && oldHealth >= 20) {
      animationManager.startWithering();
    } else if (newHealth >= 20 && oldHealth < 20) {
      animationManager.revive();
    }

    // Update plant stage
    plant.updateHealth(newHealth, oldHealth);
  };

  const triggerCompletionEffect = (plantId) => {
    const instance = plantInstances.current.get(plantId);
    if (!instance) return;

    const { animationManager } = instance;
    animationManager.completionPulse();
  };

  const calculateHealthFromFocusTime = (totalMinutes, daysSinceLastSession = 0) => {
    // Start at 30% health
    let health = 30;
    
    // Increase health based on total focus time
    // Every 25 minutes of focus adds 10% health (up to 100%)
    const focusBonus = Math.min(70, Math.floor(totalMinutes / 25) * 10);
    health += focusBonus;
    
    // Decrease health for consecutive days without focus
    const decayPenalty = daysSinceLastSession * 10;
    health -= decayPenalty;
    
    // Ensure health stays within bounds
    return Math.max(0, Math.min(100, health));
  };

  const getPlantGrowthStage = (health) => {
    if (health <= 0) return 0; // dead
    if (health <= 20) return 1; // seed
    if (health <= 40) return 2; // sprout
    if (health <= 60) return 3; // young
    if (health <= 80) return 4; // mature
    return 5; // blooming
  };

  const cleanup = () => {
    plantInstances.current.forEach(({ plant, animationManager }) => {
      if (plant && plant.stopAnimations) {
        plant.stopAnimations();
      }
      if (animationManager && animationManager.stopAllAnimations) {
        animationManager.stopAllAnimations();
      }
    });
    plantInstances.current.clear();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    gardenRef,
    initializePlant,
    updatePlantHealth,
    triggerCompletionEffect,
    calculateHealthFromFocusTime,
    getPlantGrowthStage,
    cleanup,
    isInitialized,
    setIsInitialized
  };
};
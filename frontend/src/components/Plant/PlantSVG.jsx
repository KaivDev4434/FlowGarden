// components/Plant/PlantSVG.jsx
import React, { useRef, useEffect, forwardRef } from 'react';
import { PlantFactory } from '../../plants/PlantFactory';

const PlantSVG = forwardRef(({ health = 30, plantType = 'generic', className = '' }, ref) => {
  const containerRef = useRef(null);
  const plantInstanceRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create plant instance
      const plantInstance = PlantFactory.createPlant(plantType, containerRef.current);
      plantInstanceRef.current = plantInstance;
      
      // Set the SVG content
      containerRef.current.innerHTML = plantInstance.createSVG();
      
      // Initialize at current health stage
      const stage = plantInstance.calculateStage(health);
      plantInstance.animateToStage(stage);
      
      // Forward the plant instance to parent if ref is provided
      if (ref) {
        ref.current = plantInstance;
      }
    }

    return () => {
      // Cleanup animations on unmount
      if (plantInstanceRef.current) {
        plantInstanceRef.current.stopAnimations();
      }
    };
  }, [plantType, ref]);

  useEffect(() => {
    // Update health when prop changes
    if (plantInstanceRef.current) {
      const previousHealth = plantInstanceRef.current.health;
      plantInstanceRef.current.updateHealth(health, previousHealth);
    }
  }, [health]);

  return (
    <div 
      ref={containerRef}
      className={`plant-container relative ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '200px',
        height: '200px'
      }}
    />
  );
});

PlantSVG.displayName = 'PlantSVG';

export default PlantSVG;
# Anime.js Integration Plan for FlowGarden Plant Animations

## 🌟 Why Anime.js is Perfect for FlowGarden

**Anime.js is actually a superior choice** to Lottie for your plant animations because:
- **Complete programmatic control** over animation timing and progression
- **Smaller bundle size** (~17KB vs Lottie's larger JSON files)
- **Better performance** for DOM/SVG animations
- **Health-responsive animations** - can dynamically adjust based on plant health
- **Infinite customization** - perfect for your zen aesthetic

## 🏗️ Updated Tech Stack Integration

Replace your Lottie setup with:
```bash
npm install animejs
# Remove: @lottiefiles/react-lottie-player
```

## 📋 Incremental Development Plan

### **Phase 1: Simple Generic Plant Foundation** (2 hours)
Create a basic SVG plant with Anime.js growth animation

### **Phase 2: Growth System Integration** (1.5 hours)  
Connect plant growth to health/focus data

### **Phase 3: Lifecycle Phases** (2 hours)
Add withering, blooming, and revival animations

### **Phase 4: Multiple Plant Types** (2 hours)
Create modular system for different plant species

### **Phase 5: Advanced Effects** (1.5 hours)
Polish with particle effects and environmental animations

***

# Phase 1: Simple Generic Plant Foundation

## 🌱 Basic Plant SVG Structure

Create a modular SVG plant component:

```javascript
// components/Plant/PlantSVG.jsx
import React, { useRef, useEffect } from 'react';
import anime from 'animejs';

const PlantSVG = ({ health = 50, plantType = 'generic' }) => {
  const plantRef = useRef(null);
  const stemRef = useRef(null);
  const leavesRef = useRef([]);
  const flowersRef = useRef([]);

  return (
    <div className="plant-container" ref={plantRef}>
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200"
        className="plant-svg"
      >
        {/* Pot */}
        <rect
          x="70" y="160" width="60" height="30"
          fill="#8B4513" rx="5"
          className="plant-pot"
        />
        
        {/* Soil */}
        <ellipse
          cx="100" cy="165" rx="25" ry="8"
          fill="#4A4A4A"
          className="plant-soil"
        />
        
        {/* Main Stem */}
        <path
          ref={stemRef}
          d="M100 160 Q100 140 100 120"
          stroke="#228B22"
          strokeWidth="4"
          fill="none"
          className="plant-stem"
          style={{
            strokeDasharray: 40,
            strokeDashoffset: 40
          }}
        />
        
        {/* Leaves - will be populated dynamically */}
        <g className="plant-leaves">
          {[...Array(4)].map((_, i) => (
            <ellipse
              key={i}
              ref={el => leavesRef.current[i] = el}
              cx={100 + (i % 2 === 0 ? -15 : 15)}
              cy={140 - (i * 8)}
              rx="8" ry="12"
              fill="#32CD32"
              className="plant-leaf"
              style={{
                transformOrigin: `${100 + (i % 2 === 0 ? -15 : 15)}px ${140 - (i * 8)}px`,
                opacity: 0,
                transform: 'scale(0)'
              }}
            />
          ))}
        </g>
        
        {/* Flowers - for mature stage */}
        <g className="plant-flowers">
          {[...Array(2)].map((_, i) => (
            <circle
              key={i}
              ref={el => flowersRef.current[i] = el}
              cx={100 + (i === 0 ? -10 : 10)}
              cy={105 - (i * 5)}
              r="6"
              fill="#FF69B4"
              className="plant-flower"
              style={{
                opacity: 0,
                transform: 'scale(0)'
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default PlantSVG;
```

## 🎬 Basic Growth Animation System

```javascript
// hooks/usePlantAnimation.js
import { useRef, useEffect } from 'react';
import anime from 'animejs';

export const usePlantAnimation = (health, plantRef) => {
  const currentHealth = useRef(health);
  
  const growStem = (progress = 1) => {
    anime({
      targets: plantRef.current?.querySelector('.plant-stem'),
      strokeDashoffset: 40 - (40 * progress),
      duration: 1500,
      easing: 'easeOutQuart'
    });
  };

  const growLeaves = (count = 4) => {
    const leaves = plantRef.current?.querySelectorAll('.plant-leaf');
    if (!leaves) return;

    anime({
      targets: Array.from(leaves).slice(0, count),
      opacity: [0, 1],
      scale: [0, 1],
      delay: anime.stagger(200, {start: 500}),
      duration: 800,
      easing: 'easeOutElastic(1, .8)'
    });
  };

  const addIdleAnimation = () => {
    const leaves = plantRef.current?.querySelectorAll('.plant-leaf');
    if (!leaves) return;

    anime({
      targets: leaves,
      rotate: [-2, 2],
      duration: 3000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(100)
    });
  };

  return {
    growStem,
    growLeaves,
    addIdleAnimation
  };
};
```

***

# Phase 2: Growth System Integration

## 🔄 Health-Based Animation Controller

```javascript
// components/Plant/PlantController.jsx
import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import PlantSVG from './PlantSVG';

const PlantController = ({ plant }) => {
  const plantRef = useRef(null);
  const previousHealth = useRef(plant.health);
  
  // Growth stage calculation
  const getGrowthStage = (health) => {
    if (health <= 20) return 'seed';
    if (health <= 40) return 'sprout';
    if (health <= 60) return 'young';
    if (health <= 80) return 'mature';
    return 'blooming';
  };

  const animateToStage = (newStage, oldStage) => {
    const animations = {
      seed: () => resetPlant(),
      sprout: () => growToSprout(),
      young: () => growToYoung(),
      mature: () => growToMature(),
      blooming: () => growToBlooming()
    };

    // Determine if growing or withering
    const stageOrder = ['seed', 'sprout', 'young', 'mature', 'blooming'];
    const newIndex = stageOrder.indexOf(newStage);
    const oldIndex = stageOrder.indexOf(oldStage);
    
    if (newIndex > oldIndex) {
      // Growing - play forward animation
      animations[newStage]();
    } else if (newIndex < oldIndex) {
      // Withering - play reverse animation
      witherToStage(newStage);
    }
  };

  const resetPlant = () => {
    anime({
      targets: plantRef.current?.querySelectorAll('.plant-stem, .plant-leaf, .plant-flower'),
      opacity: 0,
      scale: 0,
      duration: 500
    });
  };

  const growToSprout = () => {
    // Animate stem growing
    anime({
      targets: plantRef.current?.querySelector('.plant-stem'),
      strokeDashoffset: 30,
      duration: 1500,
      easing: 'easeOutQuart'
    });
  };

  const growToYoung = () => {
    // Continue stem + add first leaves
    anime.timeline()
      .add({
        targets: plantRef.current?.querySelector('.plant-stem'),
        strokeDashoffset: 15,
        duration: 1000
      })
      .add({
        targets: plantRef.current?.querySelectorAll('.plant-leaf').slice(0, 2),
        opacity: [0, 1],
        scale: [0, 1],
        duration: 800,
        delay: anime.stagger(200),
        easing: 'easeOutElastic(1, .8)'
      });
  };

  const growToMature = () => {
    // Full stem + all leaves
    anime.timeline()
      .add({
        targets: plantRef.current?.querySelector('.plant-stem'),
        strokeDashoffset: 0,
        duration: 1000
      })
      .add({
        targets: plantRef.current?.querySelectorAll('.plant-leaf'),
        opacity: [0, 1],
        scale: [0, 1],
        duration: 600,
        delay: anime.stagger(150),
        easing: 'easeOutElastic(1, .8)'
      });
  };

  const growToBlooming = () => {
    // Add flowers on top of mature plant
    anime({
      targets: plantRef.current?.querySelectorAll('.plant-flower'),
      opacity: [0, 1],
      scale: [0, 1.2, 1],
      duration: 1200,
      delay: anime.stagger(300),
      easing: 'easeOutElastic(1, .6)'
    });
  };

  const witherToStage = (targetStage) => {
    const elements = {
      blooming: '.plant-flower',
      mature: '.plant-leaf:nth-child(n+3)',
      young: '.plant-leaf:nth-child(n+2)',
      sprout: '.plant-leaf',
      seed: '.plant-stem, .plant-leaf, .plant-flower'
    };

    anime({
      targets: plantRef.current?.querySelectorAll(elements[targetStage]),
      opacity: [null, 0],
      scale: [null, 0.8, 0],
      duration: 1000,
      easing: 'easeInQuart'
    });
  };

  // React to health changes
  useEffect(() => {
    const currentStage = getGrowthStage(plant.health);
    const previousStage = getGrowthStage(previousHealth.current);
    
    if (currentStage !== previousStage) {
      animateToStage(currentStage, previousStage);
    }
    
    previousHealth.current = plant.health;
  }, [plant.health]);

  // Start idle animations after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      startIdleAnimations();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const startIdleAnimations = () => {
    // Gentle swaying for leaves
    anime({
      targets: plantRef.current?.querySelectorAll('.plant-leaf'),
      rotate: [-1, 1],
      duration: 4000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(200)
    });

    // Subtle stem movement
    anime({
      targets: plantRef.current?.querySelector('.plant-stem'),
      d: [
        'M100 160 Q100 140 100 120',
        'M100 160 Q102 140 100 120',
        'M100 160 Q98 140 100 120',
        'M100 160 Q100 140 100 120'
      ],
      duration: 8000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine'
    });
  };

  return <PlantSVG ref={plantRef} health={plant.health} />;
};

export default PlantController;
```

***

# Phase 3: Advanced Lifecycle Phases

## 🌸 Enhanced Animation States

```javascript
// animations/plantAnimations.js
import anime from 'animejs';

export class PlantAnimationManager {
  constructor(plantRef) {
    this.plantRef = plantRef;
    this.currentAnimations = [];
  }

  // Celebration animation when health increases significantly
  celebrate() {
    this.createSparkleEffect();
    this.bounceAnimation();
  }

  createSparkleEffect() {
    // Create temporary sparkle elements
    const sparkles = [];
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FFD700;
        border-radius: 50%;
        pointer-events: none;
      `;
      this.plantRef.current.appendChild(sparkle);
      sparkles.push(sparkle);
    }

    // Animate sparkles
    anime({
      targets: sparkles,
      translateX: () => anime.random(-30, 30),
      translateY: () => anime.random(-40, -10),
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      duration: 1500,
      delay: anime.stagger(100),
      easing: 'easeOutQuart',
      complete: () => {
        sparkles.forEach(sparkle => sparkle.remove());
      }
    });
  }

  bounceAnimation() {
    anime({
      targets: this.plantRef.current?.querySelector('.plant-svg'),
      scale: [1, 1.05, 1],
      duration: 600,
      easing: 'easeOutElastic(1, .8)'
    });
  }

  // Withering animation for neglected plants
  startWithering() {
    const leaves = this.plantRef.current?.querySelectorAll('.plant-leaf');
    const flowers = this.plantRef.current?.querySelectorAll('.plant-flower');

    // Change colors to brown/yellow
    anime({
      targets: [...leaves, ...flowers],
      fill: '#8B4513',
      duration: 2000,
      easing: 'easeInOutQuad'
    });

    // Drooping effect
    anime({
      targets: leaves,
      rotate: (el, i) => i % 2 === 0 ? -15 : 15,
      scale: 0.8,
      duration: 1500,
      delay: anime.stagger(200),
      easing: 'easeInQuart'
    });
  }

  // Revival animation when plant recovers
  revive() {
    const leaves = this.plantRef.current?.querySelectorAll('.plant-leaf');
    
    anime({
      targets: leaves,
      fill: '#32CD32',
      rotate: 0,
      scale: 1,
      duration: 2000,
      delay: anime.stagger(150),
      easing: 'easeOutElastic(1, .6)'
    });

    this.celebrate();
  }

  // Breathing effect for healthy plants
  startBreathing() {
    const plant = this.plantRef.current?.querySelector('.plant-svg');
    
    anime({
      targets: plant,
      scale: [1, 1.02, 1],
      duration: 4000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine'
    });
  }

  stopAllAnimations() {
    this.currentAnimations.forEach(animation => animation.pause());
    this.currentAnimations = [];
  }
}
```

***

# Phase 4: Multiple Plant Types (Modular System)

## 🌿 Plant Factory Pattern

```javascript
// plants/PlantFactory.js
import { GenericPlant } from './GenericPlant';
import { BonsaiPlant } from './BonsaiPlant';
import { SucculentPlant } from './SucculentPlant';
import { FlowerPlant } from './FlowerPlant';

export class PlantFactory {
  static createPlant(type, container) {
    const plants = {
      generic: GenericPlant,
      bonsai: BonsaiPlant,
      succulent: SucculentPlant,
      flower: FlowerPlant
    };

    const PlantClass = plants[type] || GenericPlant;
    return new PlantClass(container);
  }
}

// Base plant class
export class BasePlant {
  constructor(container) {
    this.container = container;
    this.health = 50;
    this.stage = 'sprout';
    this.animationManager = null;
  }

  // Abstract methods to be implemented by each plant type
  createSVG() {
    throw new Error('createSVG must be implemented by plant subclass');
  }

  getStageDefinitions() {
    throw new Error('getStageDefinitions must be implemented by plant subclass');
  }

  animateToStage(stage) {
    const stages = this.getStageDefinitions();
    if (stages[stage]) {
      stages[stage].call(this);
    }
  }
}
```

## 🌳 Bonsai Plant Implementation

```javascript
// plants/BonsaiPlant.js
import anime from 'animejs';
import { BasePlant } from './BasePlant';

export class BonsaiPlant extends BasePlant {
  createSVG() {
    return `
      <svg width="200" height="200" viewBox="0 0 200 200">
        <!-- Bonsai Pot -->
        <rect x="60" y="150" width="80" height="40" 
              fill="#654321" rx="8" class="bonsai-pot"/>
        
        <!-- Main Trunk -->
        <path d="M100 150 Q95 130 90 110 Q85 90 95 70" 
              stroke="#8B4513" strokeWidth="8" fill="none" 
              class="bonsai-trunk"/>
        
        <!-- Branches -->
        <g class="bonsai-branches">
          <path d="M95 100 Q85 95 75 100" stroke="#8B4513" 
                strokeWidth="4" fill="none" class="branch-left"/>
          <path d="M90 80 Q100 75 110 80" stroke="#8B4513" 
                strokeWidth="4" fill="none" class="branch-right"/>
        </g>
        
        <!-- Leaf Clusters -->
        <g class="bonsai-leaves">
          <circle cx="70" cy="100" r="15" fill="#228B22" class="leaf-cluster-1"/>
          <circle cx="115" cy="80" r="12" fill="#228B22" class="leaf-cluster-2"/>
          <circle cx="95" cy="65" r="10" fill="#228B22" class="leaf-cluster-3"/>
        </g>
      </svg>
    `;
  }

  getStageDefinitions() {
    return {
      seed: () => this.animateToSeed(),
      sprout: () => this.animateToSprout(),
      young: () => this.animateToYoung(),
      mature: () => this.animateToMature(),
      blooming: () => this.animateToBlooming()
    };
  }

  animateToSprout() {
    anime({
      targets: this.container.querySelector('.bonsai-trunk'),
      strokeDasharray: '50',
      strokeDashoffset: [50, 25],
      duration: 1500,
      easing: 'easeOutQuart'
    });
  }

  animateToYoung() {
    const timeline = anime.timeline();
    
    timeline
      .add({
        targets: this.container.querySelector('.bonsai-trunk'),
        strokeDashoffset: 0,
        duration: 1000
      })
      .add({
        targets: this.container.querySelectorAll('.bonsai-branches path'),
        strokeDasharray: '30',
        strokeDashoffset: [30, 0],
        duration: 800,
        delay: anime.stagger(200)
      });
  }

  animateToMature() {
    anime({
      targets: this.container.querySelectorAll('.leaf-cluster-1, .leaf-cluster-2'),
      scale: [0, 1],
      opacity: [0, 1],
      duration: 1000,
      delay: anime.stagger(300),
      easing: 'easeOutElastic(1, .8)'
    });
  }

  animateToBlooming() {
    anime({
      targets: this.container.querySelector('.leaf-cluster-3'),
      scale: [0, 1],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    });

    // Add zen particles
    this.addZenParticles();
  }

  addZenParticles() {
    // Create floating zen particles around the bonsai
    const particles = [];
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(34, 139, 34, 0.6);
        border-radius: 50%;
      `;
      this.container.appendChild(particle);
      particles.push(particle);
    }

    anime({
      targets: particles,
      translateY: -60,
      translateX: () => anime.random(-20, 20),
      opacity: [0, 0.8, 0],
      duration: 4000,
      delay: anime.stagger(800),
      loop: true,
      easing: 'easeOutSine'
    });
  }
}
```

## 🌵 Succulent Plant Implementation

```javascript
// plants/SucculentPlant.js
export class SucculentPlant extends BasePlant {
  createSVG() {
    return `
      <svg width="200" height="200" viewBox="0 0 200 200">
        <!-- Small pot for succulent -->
        <rect x="75" y="160" width="50" height="25" 
              fill="#D2691E" rx="5" class="succulent-pot"/>
        
        <!-- Center rosette -->
        <g class="succulent-center">
          ${this.createRosetteLeaves()}
        </g>
        
        <!-- Baby shoots -->
        <g class="succulent-shoots">
          <g class="shoot-left" transform="translate(85,150)">
            ${this.createSmallRosette(0.6)}
          </g>
          <g class="shoot-right" transform="translate(115,155)">
            ${this.createSmallRosette(0.5)}
          </g>
        </g>
      </svg>
    `;
  }

  createRosetteLeaves() {
    let leaves = '';
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) - 90;
      leaves += `
        <ellipse cx="100" cy="140" rx="6" ry="20" 
                 fill="#32CD32" opacity="0" 
                 transform="rotate(${angle} 100 140)"
                 class="rosette-leaf leaf-${i}"/>
      `;
    }
    return leaves;
  }

  createSmallRosette(scale) {
    let leaves = '';
    for (let i = 0; i < 6; i++) {
      const angle = i * 60;
      leaves += `
        <ellipse cx="0" cy="0" rx="${4 * scale}" ry="${12 * scale}" 
                 fill="#90EE90" opacity="0" 
                 transform="rotate(${angle})"
                 class="small-rosette-leaf"/>
      `;
    }
    return leaves;
  }

  animateToSprout() {
    // Grow center rosette leaves one by one
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutElastic(1, .8)'
    });
  }

  animateToYoung() {
    // Add first baby shoot
    anime({
      targets: this.container.querySelector('.shoot-left .small-rosette-leaf'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: 800,
      delay: anime.stagger(80),
      easing: 'easeOutElastic(1, .6)'
    });
  }

  animateToMature() {
    // Add second baby shoot
    anime({
      targets: this.container.querySelector('.shoot-right .small-rosette-leaf'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: 800,
      delay: anime.stagger(80),
      easing: 'easeOutElastic(1, .6)'
    });
  }

  animateToBlooming() {
    // Change color to indicate flowering
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf'),
      fill: '#FF69B4',
      duration: 1500,
      direction: 'alternate',
      loop: 3,
      easing: 'easeInOutSine'
    });
  }
}
```

***

# Phase 5: Integration with React Components

## 🔧 React Integration Hook

```javascript
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
    container.className = 'plant-container';
    container.innerHTML = PlantFactory.createPlant(plant.type, container).createSVG();
    
    const plantInstance = PlantFactory.createPlant(plant.type, container);
    const animationManager = new PlantAnimationManager(container);
    
    plantInstance.animationManager = animationManager;
    plantInstances.current.set(plant.id, { plant: plantInstance, container, animationManager });
    
    return container;
  };

  const updatePlantHealth = (plantId, newHealth, oldHealth) => {
    const instance = plantInstances.current.get(plantId);
    if (!instance) return;

    const { plant, animationManager } = instance;
    
    // Determine animation based on health change
    if (newHealth > oldHealth + 10) {
      animationManager.celebrate();
    } else if (newHealth < 20 && oldHealth >= 20) {
      animationManager.startWithering();
    } else if (newHealth >= 20 && oldHealth < 20) {
      animationManager.revive();
    }

    // Update plant stage
    const newStage = calculateStage(newHealth);
    plant.animateToStage(newStage);
  };

  const calculateStage = (health) => {
    if (health <= 20) return 'seed';
    if (health <= 40) return 'sprout';
    if (health <= 60) return 'young';
    if (health <= 80) return 'mature';
    return 'blooming';
  };

  return {
    gardenRef,
    initializePlant,
    updatePlantHealth,
    isInitialized
  };
};
```

## 🌻 Final Garden Component

```javascript
// components/Garden.jsx
import React, { useEffect } from 'react';
import { useAnimeGarden } from '../hooks/useAnimeGarden';

const Garden = ({ plants, onPlantClick }) => {
  const { gardenRef, initializePlant, updatePlantHealth } = useAnimeGarden(plants);

  useEffect(() => {
    if (!gardenRef.current) return;

    // Clear existing plants
    gardenRef.current.innerHTML = '';

    // Initialize all plants
    plants.forEach(plant => {
      const container = initializePlant(plant);
      container.addEventListener('click', () => onPlantClick(plant));
      gardenRef.current.appendChild(container);
    });
  }, [plants]);

  return (
    <div 
      ref={gardenRef}
      className="garden-grid grid grid-cols-3 gap-4 p-6"
      style={{
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
        minHeight: '400px',
        borderRadius: '12px'
      }}
    />
  );
};

export default Garden;
```

***

# 🚀 Implementation Checklist

## **Weekend Priority Order:**
1. ✅ **Phase 1**: Basic generic plant with stem/leaves (2 hours)
2. ✅ **Phase 2**: Health-responsive growth system (1.5 hours)
3. ✅ **Phase 3**: Celebration and withering animations (2 hours)
4. ⏰ **Phase 4**: Add 2-3 plant types (bonsai, succulent) (2 hours)
5. 🎯 **Phase 5**: Polish and particle effects (1.5 hours)

## **Dependencies Update:**
```bash
# Remove Lottie dependencies
npm uninstall @lottiefiles/react-lottie-player

# Add Anime.js
npm install animejs
```

## **File Structure:**
```
src/
  components/
    Garden.jsx
    Plant/
      PlantSVG.jsx
      PlantController.jsx
  plants/
    BasePlant.js
    PlantFactory.js
    BonsaiPlant.js
    SucculentPlant.js
    GenericPlant.js
  animations/
    plantAnimations.js
  hooks/
    useAnimeGarden.js
    usePlantAnimation.js
```

This modular approach lets you easily add new plant types by extending `BasePlant` and implementing the required methods. Each plant can have unique SVG structures and animation behaviors while sharing the same health-responsive system!

Sources
[1] Documentation https://animejs.com/documentation/

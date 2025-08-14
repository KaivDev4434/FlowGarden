// plants/BasePlant.js
import anime from 'animejs';

export class BasePlant {
  constructor(container) {
    this.container = container;
    this.health = 30; // Starting health at 30%
    this.stage = 'seed';
    this.animationManager = null;
    this.timeline = null;
  }

  // Abstract methods to be implemented by each plant type
  createSVG() {
    throw new Error('createSVG must be implemented by plant subclass');
  }

  getStageDefinitions() {
    throw new Error('getStageDefinitions must be implemented by plant subclass');
  }

  // Calculate growth stage based on health
  calculateStage(health) {
    if (health <= 0) return 'dead';
    if (health <= 20) return 'seed';
    if (health <= 40) return 'sprout';
    if (health <= 60) return 'young';
    if (health <= 80) return 'mature';
    return 'blooming';
  }

  // Update health and trigger appropriate animations
  updateHealth(newHealth, previousHealth = this.health) {
    const oldStage = this.calculateStage(previousHealth);
    const newStage = this.calculateStage(newHealth);
    
    this.health = newHealth;
    
    if (oldStage !== newStage) {
      this.animateToStage(newStage, oldStage);
    }
    
    // Trigger special effects based on health changes
    if (newHealth > previousHealth + 15) {
      this.celebrate();
    } else if (newHealth < 20 && previousHealth >= 20) {
      this.startWithering();
    } else if (newHealth >= 20 && previousHealth < 20) {
      this.revive();
    }
  }

  // Animate to a specific stage
  animateToStage(newStage, oldStage) {
    const stages = this.getStageDefinitions();
    if (stages[newStage]) {
      stages[newStage].call(this, oldStage);
    }
  }

  // Base celebration animation
  celebrate() {
    if (this.animationManager && this.animationManager.celebrate) {
      this.animationManager.celebrate();
    }
  }

  // Base withering animation
  startWithering() {
    if (this.animationManager && this.animationManager.startWithering) {
      this.animationManager.startWithering();
    }
  }

  // Base revival animation
  revive() {
    if (this.animationManager && this.animationManager.revive) {
      this.animationManager.revive();
    }
  }

  // Stop all animations
  stopAnimations() {
    if (this.timeline) {
      this.timeline.pause();
    }
    anime.remove(this.container.querySelectorAll('*'));
  }

  // Reset plant to initial state
  reset() {
    this.stopAnimations();
    this.health = 30;
    this.stage = 'seed';
    
    // Reset all elements to initial state
    const elements = this.container.querySelectorAll('*');
    anime.set(elements, {
      opacity: 0,
      scale: 1,
      rotate: 0,
      translateX: 0,
      translateY: 0
    });
    
    // Show only basic elements
    anime.set(this.container.querySelectorAll('.plant-pot, .plant-soil'), {
      opacity: 1
    });
  }
}
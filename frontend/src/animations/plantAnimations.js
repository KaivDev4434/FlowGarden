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
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FFD700;
        border-radius: 50%;
        pointer-events: none;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
      `;
      this.plantRef.current.appendChild(sparkle);
      sparkles.push(sparkle);
    }

    // Animate sparkles
    anime({
      targets: sparkles,
      translateX: () => anime.random(-40, 40),
      translateY: () => anime.random(-50, -15),
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      duration: 2000,
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
      scale: [1, 1.1, 1],
      duration: 800,
      easing: 'easeOutElastic(1, .8)'
    });
  }

  // Withering animation for neglected plants
  startWithering() {
    const leaves = this.plantRef.current?.querySelectorAll('.plant-leaf');
    const flowers = this.plantRef.current?.querySelectorAll('.plant-petal');

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
      rotate: (el, i) => i % 2 === 0 ? -20 : 20,
      scale: 0.85,
      duration: 1500,
      delay: anime.stagger(200),
      easing: 'easeInQuart'
    });

    // Add wilting particles
    this.createWiltingEffect();
  }

  createWiltingEffect() {
    const particles = [];
    for (let i = 0; i < 4; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 8px;
        background: #8B4513;
        border-radius: 1px;
        pointer-events: none;
        left: 50%;
        top: 40%;
      `;
      this.plantRef.current.appendChild(particle);
      particles.push(particle);
    }

    anime({
      targets: particles,
      translateX: () => anime.random(-15, 15),
      translateY: [0, 60],
      rotate: () => anime.random(-180, 180),
      opacity: [0.8, 0],
      duration: 3000,
      delay: anime.stagger(300),
      easing: 'easeInQuart',
      complete: () => {
        particles.forEach(particle => particle.remove());
      }
    });
  }

  // Revival animation when plant recovers
  revive() {
    const leaves = this.plantRef.current?.querySelectorAll('.plant-leaf');
    const petals = this.plantRef.current?.querySelectorAll('.plant-petal');
    
    anime({
      targets: [...leaves, ...petals],
      fill: function(el) {
        return el.classList.contains('plant-leaf') ? '#2E8B57' : '#FFD700';
      },
      rotate: 0,
      scale: 1,
      duration: 2000,
      delay: anime.stagger(150),
      easing: 'easeOutElastic(1, .6)'
    });

    this.celebrate();
    this.createRevivalEffect();
  }

  createRevivalEffect() {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('div');
      heart.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: #FF69B4;
        border-radius: 50%;
        pointer-events: none;
        left: 50%;
        top: 60%;
      `;
      this.plantRef.current.appendChild(heart);
      hearts.push(heart);
    }

    anime({
      targets: hearts,
      translateY: [-10, -40],
      translateX: () => anime.random(-10, 10),
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      duration: 1800,
      delay: anime.stagger(400),
      easing: 'easeOutQuart',
      complete: () => {
        hearts.forEach(heart => heart.remove());
      }
    });
  }

  // Breathing effect for healthy plants
  startBreathing() {
    const plant = this.plantRef.current?.querySelector('.plant-svg');
    
    const breathing = anime({
      targets: plant,
      scale: [1, 1.02, 1],
      duration: 4000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine'
    });

    this.currentAnimations.push(breathing);
  }

  // Pulsing effect for focus session completion
  completionPulse() {
    const plant = this.plantRef.current?.querySelector('.plant-svg');
    
    anime({
      targets: plant,
      scale: [1, 1.15, 1],
      duration: 600,
      easing: 'easeOutElastic(1, .6)',
      loop: 3
    });

    // Add completion sparkles
    this.createCompletionEffect();
  }

  createCompletionEffect() {
    const sparkles = [];
    for (let i = 0; i < 12; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        width: 5px;
        height: 5px;
        background: linear-gradient(45deg, #FFD700, #FFA500);
        border-radius: 50%;
        pointer-events: none;
        left: 50%;
        top: 50%;
      `;
      this.plantRef.current.appendChild(sparkle);
      sparkles.push(sparkle);
    }

    anime({
      targets: sparkles,
      translateX: function(el, i) {
        return Math.cos(i * 30 * Math.PI / 180) * anime.random(30, 50);
      },
      translateY: function(el, i) {
        return Math.sin(i * 30 * Math.PI / 180) * anime.random(30, 50);
      },
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      duration: 2500,
      delay: anime.stagger(80),
      easing: 'easeOutQuart',
      complete: () => {
        sparkles.forEach(sparkle => sparkle.remove());
      }
    });
  }

  stopAllAnimations() {
    this.currentAnimations.forEach(animation => animation.pause());
    this.currentAnimations = [];
    
    // Remove any temporary elements
    const temporaryElements = this.plantRef.current?.querySelectorAll('.sparkle');
    temporaryElements?.forEach(el => el.remove());
  }
}
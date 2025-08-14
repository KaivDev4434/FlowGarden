// plants/GenericPlant.js
import anime from 'animejs';
import { BasePlant } from './BasePlant';

export class GenericPlant extends BasePlant {
  constructor(container) {
    super(container);
    this.config = {
      colors: {
        seed: '#5B3A29',
        stem: '#228B22',
        stemWilted: '#8B7355',
        leaves: '#2E8B57',
        leavesWilted: '#8FBC8F',
        petals: '#FFD700',
        petalsWilted: '#DEB887',
        flowerCenter: '#8B4513'
      },
      timing: {
        seedStage: 1500,
        sproutStage: 2000,
        leafStage: 2000,
        bloomStage: 2500,
        wiltStage: 1500,
        deathStage: 1500
      }
    };
  }

  createSVG() {
    return `
      <svg width="200" height="200" viewBox="0 0 200 200" class="plant-svg">
        <!-- Pot -->
        <path class="plant-pot" d="M 50 160 L 60 190 L 140 190 L 150 160 Z" 
              fill="#8B4513" stroke="#654321" stroke-width="1"/>
        
        <!-- Soil -->
        <ellipse class="plant-soil" cx="100" cy="160" rx="45" ry="8" fill="#5D4037"/>
        
        <!-- Seed -->
        <ellipse class="plant-seed" cx="100" cy="155" rx="2" ry="3" 
                 fill="${this.config.colors.seed}" opacity="0"/>
        
        <!-- Stem -->
        <rect class="plant-stem" x="98" y="155" width="4" height="0" 
              fill="${this.config.colors.stem}" rx="2"/>
        
        <!-- Lower Leaves -->
        <path class="plant-leaf leaf-1" d="M 100 135 Q 80 130 70 140 Q 80 150 100 135" 
              fill="${this.config.colors.leaves}" opacity="0" style="transform-origin: 100px 135px"/>
        <path class="plant-leaf leaf-2" d="M 100 135 Q 120 130 130 140 Q 120 150 100 135" 
              fill="${this.config.colors.leaves}" opacity="0" style="transform-origin: 100px 135px"/>
        
        <!-- Upper Leaves -->
        <path class="plant-leaf leaf-3" d="M 100 115 Q 85 110 77 118 Q 85 125 100 115" 
              fill="${this.config.colors.leaves}" opacity="0" style="transform-origin: 100px 115px"/>
        <path class="plant-leaf leaf-4" d="M 100 115 Q 115 110 123 118 Q 115 125 100 115" 
              fill="${this.config.colors.leaves}" opacity="0" style="transform-origin: 100px 115px"/>
        
        <!-- Flower Center -->
        <circle class="plant-flower-center" cx="100" cy="80" r="18" 
                fill="${this.config.colors.flowerCenter}" opacity="0"/>
        
        <!-- Petals -->
        <g class="plant-petals" opacity="0">
          <!-- 12 petals, 30° apart for simpler animation -->
          <ellipse class="plant-petal" cx="100" cy="62" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px"/>
          <ellipse class="plant-petal" cx="109" cy="65" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(30deg)"/>
          <ellipse class="plant-petal" cx="115" cy="72" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(60deg)"/>
          <ellipse class="plant-petal" cx="118" cy="80" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(90deg)"/>
          <ellipse class="plant-petal" cx="115" cy="88" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(120deg)"/>
          <ellipse class="plant-petal" cx="109" cy="95" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(150deg)"/>
          <ellipse class="plant-petal" cx="100" cy="98" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(180deg)"/>
          <ellipse class="plant-petal" cx="91" cy="95" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(210deg)"/>
          <ellipse class="plant-petal" cx="85" cy="88" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(240deg)"/>
          <ellipse class="plant-petal" cx="82" cy="80" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(270deg)"/>
          <ellipse class="plant-petal" cx="85" cy="72" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(300deg)"/>
          <ellipse class="plant-petal" cx="91" cy="65" rx="4" ry="10" fill="${this.config.colors.petals}" style="transform-origin: 100px 80px; transform: rotate(330deg)"/>
        </g>
      </svg>
    `;
  }

  getStageDefinitions() {
    return {
      dead: () => this.animateToDeath(),
      withering: () => this.animateWithering(),
      seed: () => this.animateToSeed(),
      sprout: () => this.animateToSprout(),
      young: () => this.animateToYoung(),
      mature: () => this.animateToMature(),
      blooming: () => this.animateToBlooming()
    };
  }

  animateToSeed() {
    // Stop any existing animations
    this.stopAnimations();
    
    // Reset everything to initial state
    this.resetPlant();
    
    // Show seed with proper animation
    anime({
      targets: this.container.querySelector('.plant-seed'),
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: this.config.timing.seedStage,
      easing: 'easeOutElastic(1, 0.5)',
      transformOrigin: 'center'
    });
  }

  resetPlant() {
    // Hide leaves and flower center
    anime.set(this.container.querySelectorAll('.plant-leaf, .plant-flower-center'), {
      opacity: 0,
      scale: 0
    });
    
    // Hide petals group
    anime.set(this.container.querySelector('.plant-petals'), {
      opacity: 0
    });
    
    // Reset individual petals to scale 0 for animation (but keep other properties ready)
    anime.set(this.container.querySelectorAll('.plant-petal'), {
      scale: 0,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      fill: this.config.colors.petals
    });
    
    // Reset stem to initial state but keep it visible
    anime.set(this.container.querySelector('.plant-stem'), {
      height: 0,
      y: 155,
      opacity: 1,  // Keep stem visible!
      fill: this.config.colors.stem,
      rotate: 0
    });
    
    // Reset seed
    anime.set(this.container.querySelector('.plant-seed'), { 
      opacity: 0, 
      scale: 0.5 
    });
    
    // Reset leaves
    anime.set(this.container.querySelectorAll('.plant-leaf'), {
      opacity: 0,
      scale: 0,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      fill: this.config.colors.leaves
    });
  }

  animateToSprout() {
    // Ensure we start from proper seed state
    anime.set(this.container.querySelector('.plant-seed'), { opacity: 1, scale: 1 });
    
    // Animate stem growth (stem is already visible from reset)
    anime({
      targets: this.container.querySelector('.plant-stem'),
      height: [0, 45],
      y: [155, 110],
      duration: this.config.timing.sproutStage,
      easing: 'easeOutElastic(1, 0.3)',
      transformOrigin: 'bottom'
    });
  }

  animateToYoung() {
    // Ensure stem is at sprout stage first
    anime.set(this.container.querySelector('.plant-seed'), { opacity: 1, scale: 1 });
    anime.set(this.container.querySelector('.plant-stem'), { 
      height: 45, 
      y: 110 
    });
    
    // Continue stem growth and add first leaves
    const timeline = anime.timeline();
    
    timeline.add({
      targets: this.container.querySelector('.plant-stem'),
      height: [45, 75],
      y: [110, 80],
      duration: this.config.timing.leafStage / 2,
      easing: 'easeOutQuad'
    });
    
    timeline.add({
      targets: this.container.querySelectorAll('.leaf-1, .leaf-2'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: this.config.timing.leafStage / 2,
      easing: 'easeOutElastic(1, 0.5)',
      delay: anime.stagger(200)
    }, '-=500');
  }

  animateToMature() {
    // Ensure we have young stage elements visible
    anime.set(this.container.querySelector('.plant-seed'), { opacity: 1, scale: 1 });
    anime.set(this.container.querySelector('.plant-stem'), { 
      height: 75, 
      y: 80 
    });
    anime.set(this.container.querySelectorAll('.leaf-1, .leaf-2'), { 
      opacity: 1, 
      scale: 1 
    });
    
    // Add upper leaves
    anime({
      targets: this.container.querySelectorAll('.leaf-3, .leaf-4'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: this.config.timing.leafStage,
      easing: 'easeOutElastic(1, 0.5)',
      delay: anime.stagger(150)
    });
    
    // Start idle leaf swaying after a delay
    setTimeout(() => {
      this.startIdleAnimations();
    }, this.config.timing.leafStage + 500);
  }

  animateToBlooming() {
    // Ensure we have ALL mature stage elements visible
    anime.set(this.container.querySelector('.plant-seed'), { opacity: 1, scale: 1 });
    anime.set(this.container.querySelector('.plant-stem'), { 
      height: 75, 
      y: 80 
    });
    anime.set(this.container.querySelectorAll('.plant-leaf'), { 
      opacity: 1, 
      scale: 1 
    });
    
    // Ensure petals are reset to scale 0 for animation
    anime.set(this.container.querySelector('.plant-petals'), { opacity: 0 });
    anime.set(this.container.querySelectorAll('.plant-petal'), { scale: 0 });
    
    const timeline = anime.timeline();
    
    // Show flower center
    timeline.add({
      targets: this.container.querySelector('.plant-flower-center'),
      opacity: [0, 1],
      scale: [0, 1],
      duration: 800,
      easing: 'easeOutElastic(1, 0.6)',
      transformOrigin: 'center'
    });
    
    // Show petals container
    timeline.add({
      targets: this.container.querySelector('.plant-petals'),
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad'
    }, '-=400');
    
    // Animate individual petals - they already have proper rotation in SVG
    timeline.add({
      targets: this.container.querySelectorAll('.plant-petal'),
      scale: [0, 1],
      duration: this.config.timing.bloomStage,
      easing: 'easeOutElastic(1, 0.4)',
      delay: anime.stagger(80)
    }, '-=1200');
    
    // Celebration effect after blooming completes
    setTimeout(() => {
      this.addBloomingEffect();
    }, 800 + this.config.timing.bloomStage);
  }

  animateWithering() {
    const timeline = anime.timeline();
    
    // Wilt petals - change color and droop slightly
    const petalsGroup = this.container.querySelector('.plant-petals');
    if (petalsGroup && window.getComputedStyle(petalsGroup).opacity > 0) {
      timeline.add({
        targets: this.container.querySelectorAll('.plant-petal'),
        fill: this.config.colors.petalsWilted,
        rotate: function() {
          return anime.random(-15, 15);
        },
        scale: [1, 0.9],
        duration: this.config.timing.wiltStage,
        easing: 'easeInOutQuad',
        delay: anime.stagger(100)
      });
    }
    
    // Wilt leaves - change color and droop
    timeline.add({
      targets: this.container.querySelectorAll('.plant-leaf'),
      fill: this.config.colors.leavesWilted,
      rotate: function() {
        return anime.random(-15, 15);
      },
      scale: [1, 0.85],
      duration: this.config.timing.wiltStage,
      easing: 'easeInOutQuad',
      delay: anime.stagger(150)
    }, '-=1500');
    
    // Wilt stem - slight lean and color change
    timeline.add({
      targets: this.container.querySelector('.plant-stem'),
      fill: this.config.colors.stemWilted,
      rotate: anime.random(-3, 3),
      duration: this.config.timing.wiltStage,
      easing: 'easeInOutQuad'
    }, '-=1500');
    
    // Flower center dulls
    timeline.add({
      targets: this.container.querySelector('.plant-flower-center'),
      fill: '#654321',
      scale: [1, 0.9],
      duration: this.config.timing.wiltStage,
      easing: 'easeInOutQuad'
    }, '-=1000');
  }

  animateToDeath() {
    const timeline = anime.timeline();
    
    // Petals fall off
    const petalsGroup = this.container.querySelector('.plant-petals');
    if (petalsGroup && window.getComputedStyle(petalsGroup).opacity > 0) {
      timeline.add({
        targets: this.container.querySelectorAll('.plant-petal'),
        translateY: function() {
          return anime.random(60, 120);
        },
        translateX: function() {
          return anime.random(-30, 30);
        },
        rotate: function() {
          return anime.random(0, 360);
        },
        opacity: [1, 0.2],
        scale: [1, 0.6],
        duration: this.config.timing.deathStage * 1.5,
        easing: 'easeInQuad',
        delay: anime.stagger(150)
      });
    }
    
    // Leaves fall and fade
    timeline.add({
      targets: this.container.querySelectorAll('.plant-leaf'),
      translateY: function() {
        return anime.random(40, 100);
      },
      translateX: function() {
        return anime.random(-25, 25);
      },
      rotate: function() {
        return anime.random(-180, 180);
      },
      opacity: [1, 0.1],
      duration: this.config.timing.deathStage,
      easing: 'easeInQuad',
      delay: anime.stagger(200)
    }, '-=2000');
    
    // Stem collapses
    timeline.add({
      targets: this.container.querySelector('.plant-stem'),
      rotate: anime.random(-25, 25),
      fill: '#5D4037',
      opacity: [1, 0.3],
      height: function(el) {
        return el.getAttribute('height') * 0.6; // Shrink to 60%
      },
      duration: this.config.timing.deathStage,
      easing: 'easeInQuad',
      transformOrigin: 'bottom'
    }, '-=1500');
    
    // Flower center fades
    timeline.add({
      targets: this.container.querySelector('.plant-flower-center'),
      opacity: [1, 0.2],
      translateY: 15,
      scale: [1, 0.7],
      duration: this.config.timing.deathStage,
      easing: 'easeInQuad'
    }, '-=1800');
    
    // Add some debris particles
    this.createDeathParticles();
  }

  createDeathParticles() {
    const particles = [];
    for (let i = 0; i < 4; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 6px;
        background: #8B4513;
        border-radius: 1px;
        pointer-events: none;
        left: 100px;
        top: 80px;
      `;
      this.container.appendChild(particle);
      particles.push(particle);
    }

    anime({
      targets: particles,
      translateY: [0, anime.random(40, 80)],
      translateX: function() {
        return anime.random(-15, 15);
      },
      rotate: function() {
        return anime.random(-180, 180);
      },
      opacity: [0.8, 0],
      duration: 3000,
      delay: anime.stagger(200),
      easing: 'easeInQuart',
      complete: () => {
        particles.forEach(particle => particle.remove());
      }
    });
  }

  startIdleAnimations() {
    // Gentle leaf swaying
    anime({
      targets: this.container.querySelectorAll('.plant-leaf'),
      rotate: [-1, 1],
      duration: 4000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(200)
    });
    
    // Subtle stem movement
    anime({
      targets: this.container.querySelector('.plant-stem'),
      rotate: [-0.5, 0.5],
      duration: 6000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });
  }

  addBloomingEffect() {
    // Create sparkle particles
    const sparkles = [];
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: absolute;
        width: 3px;
        height: 3px;
        background: #FFD700;
        border-radius: 50%;
        pointer-events: none;
        left: 100px;
        top: 80px;
      `;
      this.container.appendChild(sparkle);
      sparkles.push(sparkle);
    }

    anime({
      targets: sparkles,
      translateX: () => anime.random(-25, 25),
      translateY: () => anime.random(-30, -10),
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      duration: 2000,
      delay: anime.stagger(150),
      easing: 'easeOutQuart',
      complete: () => {
        sparkles.forEach(sparkle => sparkle.remove());
      }
    });
  }
}
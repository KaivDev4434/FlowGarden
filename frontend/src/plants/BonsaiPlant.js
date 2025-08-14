// plants/BonsaiPlant.js
import anime from 'animejs';
import { BasePlant } from './BasePlant';

export class BonsaiPlant extends BasePlant {
  constructor(container) {
    super(container);
    this.config = {
      colors: {
        pot: '#654321',
        trunk: '#8B4513',
        trunkWilted: '#A0522D',
        leaves: '#228B22',
        leavesWilted: '#8FBC8F'
      },
      timing: {
        seedStage: 1500,
        sproutStage: 2000,
        leafStage: 2500,
        bloomStage: 2000,
        wiltStage: 1500
      }
    };
  }

  createSVG() {
    return `
      <svg width="200" height="200" viewBox="0 0 200 200" class="plant-svg">
        <!-- Bonsai Pot -->
        <rect class="plant-pot" x="60" y="150" width="80" height="40" 
              fill="${this.config.colors.pot}" rx="8"/>
        
        <!-- Soil -->
        <ellipse class="plant-soil" cx="100" cy="155" rx="35" ry="6" fill="#5D4037"/>
        
        <!-- Main Trunk -->
        <path class="plant-trunk" d="M100 150 Q95 130 90 110 Q85 90 95 70" 
              stroke="${this.config.colors.trunk}" strokeWidth="8" fill="none" opacity="0"/>
        
        <!-- Branches -->
        <g class="plant-branches" opacity="0">
          <path class="branch-left" d="M95 100 Q85 95 75 100" stroke="${this.config.colors.trunk}" 
                strokeWidth="4" fill="none"/>
          <path class="branch-right" d="M90 80 Q100 75 110 80" stroke="${this.config.colors.trunk}" 
                strokeWidth="4" fill="none"/>
        </g>
        
        <!-- Leaf Clusters -->
        <g class="plant-leaves" opacity="0">
          <circle class="leaf-cluster-1" cx="70" cy="100" r="15" fill="${this.config.colors.leaves}"/>
          <circle class="leaf-cluster-2" cx="115" cy="80" r="12" fill="${this.config.colors.leaves}"/>
          <circle class="leaf-cluster-3" cx="95" cy="65" r="10" fill="${this.config.colors.leaves}"/>
        </g>
      </svg>
    `;
  }

  getStageDefinitions() {
    return {
      dead: () => this.animateToDeath(),
      seed: () => this.animateToSeed(),
      sprout: () => this.animateToSprout(),
      young: () => this.animateToYoung(),
      mature: () => this.animateToMature(),
      blooming: () => this.animateToBlooming()
    };
  }

  animateToSeed() {
    this.stopAnimations();
    anime.set(this.container.querySelectorAll('.plant-trunk, .plant-branches, .plant-leaves'), {
      opacity: 0
    });
  }

  animateToSprout() {
    anime({
      targets: this.container.querySelector('.plant-trunk'),
      opacity: [0, 1],
      strokeDasharray: '100',
      strokeDashoffset: [100, 50],
      duration: this.config.timing.sproutStage,
      easing: 'easeOutQuart'
    });
  }

  animateToYoung() {
    const timeline = anime.timeline();
    
    timeline.add({
      targets: this.container.querySelector('.plant-trunk'),
      strokeDashoffset: [50, 0],
      duration: 1000,
      easing: 'easeOutQuad'
    });
    
    timeline.add({
      targets: this.container.querySelector('.plant-branches'),
      opacity: [0, 1],
      duration: 800
    }, '-=500');
    
    timeline.add({
      targets: this.container.querySelectorAll('.branch-left, .branch-right'),
      strokeDasharray: '30',
      strokeDashoffset: [30, 0],
      duration: 800,
      delay: anime.stagger(200)
    }, '-=800');
  }

  animateToMature() {
    anime({
      targets: this.container.querySelector('.plant-leaves'),
      opacity: [0, 1],
      duration: 500
    });
    
    anime({
      targets: this.container.querySelectorAll('.leaf-cluster-1, .leaf-cluster-2'),
      scale: [0, 1],
      duration: 1000,
      delay: anime.stagger(300),
      easing: 'easeOutElastic(1, .8)'
    });
    
    this.startIdleAnimations();
  }

  animateToBlooming() {
    anime({
      targets: this.container.querySelector('.leaf-cluster-3'),
      scale: [0, 1],
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    });

    this.addZenParticles();
  }

  animateToDeath() {
    // Wilt leaves
    anime({
      targets: this.container.querySelectorAll('.leaf-cluster-1, .leaf-cluster-2, .leaf-cluster-3'),
      fill: this.config.colors.leavesWilted,
      scale: 0.7,
      duration: this.config.timing.wiltStage,
      easing: 'easeInQuad'
    });
    
    // Wilt trunk
    anime({
      targets: this.container.querySelector('.plant-trunk'),
      stroke: this.config.colors.trunkWilted,
      opacity: 0.6,
      duration: this.config.timing.wiltStage,
      easing: 'easeInQuad'
    });
  }

  startIdleAnimations() {
    // Gentle swaying for leaf clusters
    anime({
      targets: this.container.querySelectorAll('.leaf-cluster-1, .leaf-cluster-2, .leaf-cluster-3'),
      scale: [1, 1.05, 1],
      duration: 6000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine',
      delay: anime.stagger(800)
    });
  }

  addZenParticles() {
    const particles = [];
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(34, 139, 34, 0.6);
        border-radius: 50%;
        left: ${70 + (i * 15)}px;
        top: 100px;
      `;
      this.container.appendChild(particle);
      particles.push(particle);
    }

    anime({
      targets: particles,
      translateY: -60,
      translateX: () => anime.random(-10, 10),
      opacity: [0, 0.8, 0],
      duration: 4000,
      delay: anime.stagger(800),
      loop: true,
      easing: 'easeOutSine'
    });
  }
}
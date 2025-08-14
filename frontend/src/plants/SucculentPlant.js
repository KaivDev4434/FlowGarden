// plants/SucculentPlant.js
import anime from 'animejs';
import { BasePlant } from './BasePlant';

export class SucculentPlant extends BasePlant {
  constructor(container) {
    super(container);
    this.config = {
      colors: {
        pot: '#D2691E',
        leaves: '#32CD32',
        leavesWilted: '#90EE90',
        bloom: '#FF69B4'
      },
      timing: {
        seedStage: 1200,
        sproutStage: 1800,
        leafStage: 2000,
        bloomStage: 1500,
        wiltStage: 1200
      }
    };
  }

  createSVG() {
    return `
      <svg width="200" height="200" viewBox="0 0 200 200" class="plant-svg">
        <!-- Small pot for succulent -->
        <rect class="plant-pot" x="75" y="160" width="50" height="25" 
              fill="${this.config.colors.pot}" rx="5"/>
        
        <!-- Soil -->
        <ellipse class="plant-soil" cx="100" cy="165" rx="22" ry="5" fill="#5D4037"/>
        
        <!-- Center rosette -->
        <g class="succulent-center" opacity="0">
          ${this.createRosetteLeaves()}
        </g>
        
        <!-- Baby shoots -->
        <g class="succulent-shoots" opacity="0">
          <g class="shoot-left" transform="translate(85,155)">
            ${this.createSmallRosette(0.6)}
          </g>
          <g class="shoot-right" transform="translate(115,160)">
            ${this.createSmallRosette(0.5)}
          </g>
        </g>
        
        <!-- Bloom indicators -->
        <g class="succulent-blooms" opacity="0">
          <circle class="bloom-1" cx="95" cy="140" r="3" fill="${this.config.colors.bloom}"/>
          <circle class="bloom-2" cx="105" cy="135" r="3" fill="${this.config.colors.bloom}"/>
          <circle class="bloom-3" cx="100" cy="130" r="3" fill="${this.config.colors.bloom}"/>
        </g>
      </svg>
    `;
  }

  createRosetteLeaves() {
    let leaves = '';
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) - 90;
      leaves += `
        <ellipse cx="100" cy="145" rx="6" ry="15" 
                 fill="${this.config.colors.leaves}" 
                 transform="rotate(${angle} 100 145)"
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
        <ellipse cx="0" cy="0" rx="${4 * scale}" ry="${10 * scale}" 
                 fill="${this.config.colors.leaves}" 
                 transform="rotate(${angle})"
                 class="small-rosette-leaf"/>
      `;
    }
    return leaves;
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
    anime.set(this.container.querySelectorAll('.succulent-center, .succulent-shoots, .succulent-blooms'), {
      opacity: 0
    });
  }

  animateToSprout() {
    anime({
      targets: this.container.querySelector('.succulent-center'),
      opacity: [0, 1],
      duration: 500
    });
    
    // Grow center rosette leaves one by one
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf'),
      scale: [0, 1],
      duration: this.config.timing.sproutStage,
      delay: anime.stagger(150),
      easing: 'easeOutElastic(1, .8)'
    });
  }

  animateToYoung() {
    // Add first baby shoot
    anime({
      targets: this.container.querySelector('.shoot-left'),
      opacity: [0, 1],
      duration: 300
    });
    
    anime({
      targets: this.container.querySelectorAll('.shoot-left .small-rosette-leaf'),
      scale: [0, 1],
      duration: this.config.timing.leafStage,
      delay: anime.stagger(100),
      easing: 'easeOutElastic(1, .6)'
    });
  }

  animateToMature() {
    // Add second baby shoot
    anime({
      targets: this.container.querySelector('.shoot-right'),
      opacity: [0, 1],
      duration: 300
    });
    
    anime({
      targets: this.container.querySelectorAll('.shoot-right .small-rosette-leaf'),
      scale: [0, 1],
      duration: this.config.timing.leafStage,
      delay: anime.stagger(80),
      easing: 'easeOutElastic(1, .6)'
    });
    
    this.startIdleAnimations();
  }

  animateToBlooming() {
    // Show blooms
    anime({
      targets: this.container.querySelector('.succulent-blooms'),
      opacity: [0, 1],
      duration: 500
    });
    
    // Animate individual blooms
    anime({
      targets: this.container.querySelectorAll('.bloom-1, .bloom-2, .bloom-3'),
      scale: [0, 1],
      duration: this.config.timing.bloomStage,
      delay: anime.stagger(200),
      easing: 'easeOutElastic(1, .6)'
    });
    
    // Change main rosette color to indicate flowering
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf'),
      fill: this.config.colors.bloom,
      duration: 1500,
      direction: 'alternate',
      loop: 2,
      easing: 'easeInOutSine'
    });
  }

  animateToDeath() {
    // Wilt all parts
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf, .small-rosette-leaf'),
      fill: this.config.colors.leavesWilted,
      scale: 0.8,
      duration: this.config.timing.wiltStage,
      easing: 'easeInQuad'
    });
    
    // Hide blooms
    anime({
      targets: this.container.querySelectorAll('.bloom-1, .bloom-2, .bloom-3'),
      scale: 0,
      opacity: 0,
      duration: this.config.timing.wiltStage / 2,
      easing: 'easeInQuad'
    });
  }

  startIdleAnimations() {
    // Gentle pulsing for succulent
    anime({
      targets: this.container.querySelectorAll('.rosette-leaf'),
      scale: [1, 1.02, 1],
      duration: 5000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine',
      delay: anime.stagger(100)
    });
  }
}
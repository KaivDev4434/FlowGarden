import { useRef, useCallback } from 'react';
import anime from 'animejs';

export const usePlantAnimation = (plantRef) => {
  const currentHealth = useRef(50);
  
  const growStem = useCallback((progress = 1) => {
    if (!plantRef.current) return;
    
    anime({
      targets: plantRef.current.querySelector('.plant-stem'),
      strokeDashoffset: 40 - (40 * progress),
      duration: 1500,
      easing: 'easeOutQuart'
    });
  }, [plantRef]);

  const growLeaves = useCallback((count = 4) => {
    if (!plantRef.current) return;
    
    const leaves = plantRef.current.querySelectorAll('.plant-leaf');
    if (!leaves) return;

    anime({
      targets: Array.from(leaves).slice(0, count),
      opacity: [0, 1],
      scale: [0, 1],
      delay: anime.stagger(200, {start: 500}),
      duration: 800,
      easing: 'easeOutElastic(1, .8)'
    });
  }, [plantRef]);

  const addIdleAnimation = useCallback(() => {
    if (!plantRef.current) return;
    
    const leaves = plantRef.current.querySelectorAll('.plant-leaf');
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
  }, [plantRef]);

  const growFlowers = useCallback((count = 2) => {
    if (!plantRef.current) return;
    
    const flowers = plantRef.current.querySelectorAll('.plant-flower');
    if (!flowers) return;

    anime({
      targets: Array.from(flowers).slice(0, count),
      opacity: [0, 1],
      scale: [0, 1.2, 1],
      duration: 1200,
      delay: anime.stagger(300),
      easing: 'easeOutElastic(1, .6)'
    });
  }, [plantRef]);

  return {
    growStem,
    growLeaves,
    addIdleAnimation,
    growFlowers
  };
};

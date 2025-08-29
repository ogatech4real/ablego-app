import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const fadeInUp = (element: string | Element, delay = 0) => {
  gsap.fromTo(element, 
    { opacity: 0, y: 50 },
    { 
      opacity: 1, 
      y: 0, 
      duration: 0.8, 
      delay,
      ease: "power2.out"
    }
  );
};

export const slideInFromLeft = (element: string | Element, delay = 0) => {
  gsap.fromTo(element,
    { opacity: 0, x: -50 },
    { 
      opacity: 1, 
      x: 0, 
      duration: 0.8, 
      delay,
      ease: "power2.out"
    }
  );
};

export const slideInFromRight = (element: string | Element, delay = 0) => {
  gsap.fromTo(element,
    { opacity: 0, x: 50 },
    { 
      opacity: 1, 
      x: 0, 
      duration: 0.8, 
      delay,
      ease: "power2.out"
    }
  );
};

export const scaleIn = (element: string | Element, delay = 0) => {
  gsap.fromTo(element,
    { opacity: 0, scale: 0.8 },
    { 
      opacity: 1, 
      scale: 1, 
      duration: 0.6, 
      delay,
      ease: "back.out(1.7)"
    }
  );
};

export const setupScrollAnimations = () => {
  try {
    gsap.utils.toArray('.animate-on-scroll').forEach((element: Element) => {
      gsap.fromTo(element, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  } catch (error) {
    console.warn('Scroll animations setup failed:', error);
  }
};

export const animateCounter = (element: Element, endValue: number, duration = 2) => {
  const counter = { value: 0 };
  gsap.to(counter, {
    value: endValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = `£${Math.round(counter.value)}`;
    }
  });
};
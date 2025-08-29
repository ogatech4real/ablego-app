import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Animate icon change
    if (iconRef.current) {
      gsap.fromTo(iconRef.current,
        { scale: 0.8, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [theme]);

  const handleToggle = () => {
    // Animate button press
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }
    
    toggleTheme();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={`theme-toggle fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      <div 
        ref={iconRef}
        className="flex items-center justify-center w-full h-full"
      >
        {isDark ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
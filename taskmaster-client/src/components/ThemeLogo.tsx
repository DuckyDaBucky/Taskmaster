import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeLogoProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * A theme-aware logo component that changes colors based on the current theme
 */
const ThemeLogo: React.FC<ThemeLogoProps> = ({ 
  width = 'auto', 
  height = 'auto', 
  className = '' 
}) => {
  const { theme } = useTheme();
  

  // CSS filter approach for the PNG logo
  const getFilterStyle = () => {
    // These filter values are approximations and can be fine-tuned
    switch (theme) {
      case 'light':
        return 'brightness(1) saturate(1)';
      case 'dark':
        return 'brightness(1.2) saturate(0.8) hue-rotate(10deg)';
      default:
        return 'brightness(1) saturate(1)';
    }
  };

  return (
    <div className={`theme-logo ${className}`}>
      {/* Simple version - Using CSS filters on the PNG logo */}
      <img 
        src="/LogoMaster.png" 
        alt="TaskMaster.ai Logo" 
        style={{ 
          width, 
          height,
          filter: getFilterStyle(),
          transition: 'filter 0.3s ease-in-out'
        }}
      />

      {/* 
      // Alternate SVG implementation could be added here if needed
      // SVG allows more precise control over individual color elements
      */}
    </div>
  );
};

export default ThemeLogo; 
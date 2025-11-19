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
  
  // Define theme-specific colors for different parts of the logo
  const getLogoColors = () => {
    switch (theme) {
      case 'light':
        return {
          primary: '#4f46e5', // indigo-600
          secondary: '#6366f1', // indigo-500
          accent: '#818cf8', // indigo-400
          text: '#1e293b', // slate-800
        };
      case 'dark':
        return {
          primary: '#818cf8', // indigo-400
          secondary: '#6366f1', // indigo-500
          accent: '#a5b4fc', // indigo-300
          text: '#f8fafc', // slate-50
        };
      case 'clean': // Beige theme
        return {
          primary: '#a16207', // amber-700
          secondary: '#b45309', // amber-600
          accent: '#d97706', // amber-600
          text: '#292524', // stone-800
        };
      default:
        return {
          primary: '#4f46e5', // indigo-600
          secondary: '#6366f1', // indigo-500
          accent: '#818cf8', // indigo-400
          text: '#1e293b', // slate-800
        };
    }
  };

  const colors = getLogoColors();

  // CSS filter approach for the PNG logo
  const getFilterStyle = () => {
    // These filter values are approximations and can be fine-tuned
    switch (theme) {
      case 'light':
        return 'brightness(1) saturate(1)';
      case 'dark':
        return 'brightness(1.2) saturate(0.8) hue-rotate(10deg)';
      case 'clean': // Beige theme
        return 'brightness(0.9) saturate(0.7) hue-rotate(30deg) sepia(0.3)';
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
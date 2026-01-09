/**
 * Badge - Reusable badge/tag component
 * Used for status indicators, tags, labels
 * 
 * Updated with better color contrast for accessibility
 */

import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  solid?: boolean; // Use solid background with white text
}

// Light variant styles (colored text on light bg)
const lightStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-green-500/15 text-green-600',
  warning: 'bg-amber-500/15 text-amber-600',
  danger: 'bg-red-500/15 text-red-600',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'bg-transparent border border-border text-foreground',
};

// Solid variant styles (white text on colored bg)
const solidStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'bg-transparent border border-primary text-primary',
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  solid = false,
  className = '' 
}) => {
  const styles = solid ? solidStyles : lightStyles;
  
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

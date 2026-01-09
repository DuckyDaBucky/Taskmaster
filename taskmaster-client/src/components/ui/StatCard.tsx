/**
 * StatCard - Reusable stat display component
 * Used for displaying metrics like task counts, scores, etc.
 */

import React from 'react';

export type StatCardVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatCardProps {
  value: number | string;
  label: string;
  variant?: StatCardVariant;
  className?: string;
}

const variantStyles: Record<StatCardVariant, string> = {
  success: 'bg-green-500/10 border-green-500/20 text-green-500',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  danger: 'bg-red-500/10 border-red-500/20 text-red-500',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  neutral: 'bg-secondary/20 border-border text-foreground',
};

export const StatCard: React.FC<StatCardProps> = ({ 
  value, 
  label, 
  variant = 'neutral',
  className = '' 
}) => {
  return (
    <div className={`border rounded-lg p-3 text-center ${variantStyles[variant]} ${className}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export default StatCard;

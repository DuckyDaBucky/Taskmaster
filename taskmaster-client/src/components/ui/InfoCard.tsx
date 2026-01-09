/**
 * InfoCard - Reusable info display component
 * Used for showing labeled information like schedule, location, contact
 */

import React from 'react';

interface InfoCardProps {
  label: string;
  value: string;
  className?: string;
  fullWidth?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = ({ 
  label, 
  value, 
  className = '',
  fullWidth = false 
}) => {
  return (
    <div
      className={`bg-secondary/10 border border-border rounded-xl p-3 h-full ${fullWidth ? 'col-span-2' : ''} ${className}`}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground break-words whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
};

export default InfoCard;

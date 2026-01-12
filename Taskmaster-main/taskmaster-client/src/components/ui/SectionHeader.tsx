/**
 * SectionHeader - Reusable section header with optional icon and action
 * Used for consistent section headings across the app
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  icon: Icon,
  count,
  action,
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-normal">({count})</span>
        )}
      </h3>
      {action}
    </div>
  );
};

export default SectionHeader;

/**
 * Task View Toggle - Switch between list and timeline views
 */

import React from 'react';
import { List, Clock } from 'lucide-react';

interface TaskViewToggleProps {
  currentView: "list" | "timeline";
  onViewChange: (view: "list" | "timeline") => void;
}

export const TaskViewToggle: React.FC<TaskViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex bg-secondary/30 rounded-lg p-1">
      <button
        onClick={() => onViewChange("list")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
          currentView === "list"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List size={16} />
        List
      </button>
      <button
        onClick={() => onViewChange("timeline")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
          currentView === "timeline"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Clock size={16} />
        Timeline
      </button>
    </div>
  );
};

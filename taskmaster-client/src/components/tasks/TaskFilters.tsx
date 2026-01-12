/**
 * Task Filters - Filter buttons for task status
 */

import React from 'react';

interface TaskFiltersProps {
  currentFilter: "today" | "upcoming" | "overdue" | "unscheduled" | "history";
  onFilterChange: (filter: "today" | "upcoming" | "overdue" | "unscheduled" | "history") => void;
  counts: {
    today: number;
    upcoming: number;
    overdue: number;
    unscheduled: number;
    history: number;
  };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ currentFilter, onFilterChange, counts }) => {
  const filters: Array<{ value: "today" | "upcoming" | "overdue" | "unscheduled" | "history"; label: string }> = [
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
    { value: "overdue", label: "Overdue" },
    { value: "unscheduled", label: "Unscheduled" },
    { value: "history", label: "History" },
  ];

  return (
    <div className="flex gap-2 border-b border-border pb-1">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onFilterChange(value)}
          className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-lg relative ${
            currentFilter === value
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
          }`}
        >
          {label}
          <span className="ml-1.5 text-xs opacity-75">({counts[value]})</span>
          {currentFilter === value && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
          )}
        </button>
      ))}
    </div>
  );
};

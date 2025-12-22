import React from "react";
import type { TasksData } from "../../services/types";

interface ProgressChartProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ tasks, isLoading }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No tasks yet</p>
          <p className="text-sm text-muted-foreground">Create your first task to see progress!</p>
        </div>
      </div>
    );
  }

  // Calculate angles for donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const completedLength = (completedTasks / totalTasks) * circumference;
  const pendingLength = (pendingTasks / totalTasks) * circumference;
  const overdueLength = (overdueTasks / totalTasks) * circumference;

  return (
    <div className="bg-card border border-border rounded-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Task Progress</h3>
      <div className="flex items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative" style={{ width: '140px', height: '140px' }}>
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Completed (Green/Success) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--color-success, #10b981)"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - completedLength}
              strokeLinecap="round"
            />
            {/* Pending (Primary/Waiting) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--color-warning, #f59e0b)"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - completedLength - pendingLength}
              strokeLinecap="round"
            />
            {/* Overdue (Destructive/Error) */}
            {overdueTasks > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="var(--color-destructive, #ef4444)"
                strokeWidth="20"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - completedLength - pendingLength - overdueLength}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <div>
              <div className="text-sm font-medium text-foreground">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <div>
              <div className="text-sm font-medium text-foreground">{pendingTasks}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div>
                <div className="text-sm font-medium text-foreground">{overdueTasks}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


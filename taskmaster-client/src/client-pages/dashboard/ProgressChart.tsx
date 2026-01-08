import React from "react";
import type { TasksData } from "../../services/types";

interface ProgressChartProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ tasks, isLoading }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed' && t.status !== 'overdue').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-64 flex items-center justify-center">
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
  
  // Calculate segment lengths
  const completedPct = completedTasks / totalTasks;
  const pendingPct = pendingTasks / totalTasks;
  const overduePct = overdueTasks / totalTasks;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Task Progress</h3>
      <div className="flex items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative" style={{ width: '140px', height: '140px' }}>
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--border, #333)"
              strokeWidth="20"
              opacity="0.2"
            />
            {/* Overdue (Red) - drawn first as base if exists */}
            {overduePct > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray={`${overduePct * circumference} ${circumference}`}
                strokeDashoffset={-(completedPct + pendingPct) * circumference}
              />
            )}
            {/* Pending (Amber) */}
            {pendingPct > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${pendingPct * circumference} ${circumference}`}
                strokeDashoffset={-completedPct * circumference}
              />
            )}
            {/* Completed (Green) - drawn last on top */}
            {completedPct > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${completedPct * circumference} ${circumference}`}
                strokeDashoffset={0}
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


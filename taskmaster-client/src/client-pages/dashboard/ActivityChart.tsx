import React from "react";
import type { TasksData } from "../../services/types";

interface ActivityChartProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ tasks, isLoading }) => {
  // Group tasks by date (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  // Count tasks created/completed per day
  const dailyActivity = last7Days.map(date => {
    const tasksOnDate = tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split('T')[0];
      return taskDate === date;
    });
    
    return {
      date,
      created: tasksOnDate.length,
      completed: tasksOnDate.filter(t => t.status === 'completed').length,
    };
  });

  const maxValue = Math.max(...dailyActivity.map(d => Math.max(d.created, d.completed)), 1);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Task Activity (Last 7 Days)</h3>
      <div className="flex items-end justify-between h-48 gap-2">
        {dailyActivity.map((day, idx) => {
          const dateObj = new Date(day.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end h-full w-full">
                <div
                  className="flex-1 bg-primary/60 rounded-t transition-all"
                  style={{
                    height: `${(day.created / maxValue) * 100}%`,
                    minHeight: day.created > 0 ? '4px' : '0',
                  }}
                  title={`${day.created} tasks`}
                />
                <div
                  className="flex-1 bg-green-500/60 rounded-t transition-all"
                  style={{
                    height: `${(day.completed / maxValue) * 100}%`,
                    minHeight: day.completed > 0 ? '4px' : '0',
                  }}
                  title={`${day.completed} completed`}
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1">{dayName}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary/60 rounded"></div>
          <span className="text-xs text-muted-foreground">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/60 rounded"></div>
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
      </div>
    </div>
  );
};


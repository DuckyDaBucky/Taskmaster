import React from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import type { TasksData } from "../../services/types";

interface ActivityChartProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ tasks, isLoading }) => {
  const completedTasks = tasks.filter(t => t.completed || t.status === 'completed');
  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed');
  const totalTasks = tasks.length;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-48 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Your Progress</h3>
      
      {/* Task completion visual */}
      <div className="space-y-4">
        {/* Completed tasks row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[100px]">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">Done</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 flex-wrap">
            {completedTasks.length > 0 ? (
              completedTasks.slice(0, 12).map((task) => (
                <div
                  key={task._id}
                  className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                  title={task.title}
                >
                  <span className="text-[10px] font-bold text-white">✓</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">No tasks completed yet</span>
            )}
            {completedTasks.length > 12 && (
              <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-500">+{completedTasks.length - 12}</span>
              </div>
            )}
          </div>
          <span className="text-2xl font-bold text-emerald-500 min-w-[40px] text-right">{completedTasks.length}</span>
        </div>

        {/* Pending tasks row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[100px]">
            <Circle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-foreground">To Do</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 flex-wrap">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 12).map((task) => (
                <div
                  key={task._id}
                  className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/40"
                  title={task.title}
                >
                  <span className="text-[10px] text-amber-500">○</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                <Flame className="w-4 h-4" /> All done!
              </span>
            )}
            {pendingTasks.length > 12 && (
              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-500">+{pendingTasks.length - 12}</span>
              </div>
            )}
          </div>
          <span className="text-2xl font-bold text-amber-500 min-w-[40px] text-right">{pendingTasks.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round((completedTasks.length / totalTasks) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedTasks.length / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};


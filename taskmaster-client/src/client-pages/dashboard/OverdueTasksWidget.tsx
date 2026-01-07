/**
 * OverdueTasksWidget - Shows overdue tasks with urgency styling
 */

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { TasksData } from '../../services/types';

interface OverdueTasksWidgetProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const OverdueTasksWidget: React.FC<OverdueTasksWidgetProps> = ({ tasks, isLoading }) => {
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter(t => !t.completed && t.deadline && new Date(t.deadline) < now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }, [tasks]);

  const getDaysOverdue = (deadline: string): number => {
    const now = new Date();
    const dueDate = new Date(deadline);
    return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 h-64 animate-pulse" />
    );
  }

  if (overdueTasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Clock size={18} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-foreground">All Caught Up!</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No overdue tasks. Keep up the great work! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-red-500/30 rounded-xl p-5 shadow-lg shadow-red-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Overdue Tasks</h3>
            <p className="text-xs text-red-500">{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} need attention</p>
          </div>
        </div>
        <Link 
          href="/tasks" 
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {overdueTasks.map(task => {
          const daysOverdue = getDaysOverdue(task.deadline!);
          return (
            <div 
              key={task._id}
              className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(task.deadline!).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  daysOverdue >= 7 
                    ? 'bg-red-500 text-white' 
                    : daysOverdue >= 3 
                    ? 'bg-orange-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}>
                  {daysOverdue === 0 ? 'Today' : `${daysOverdue}d late`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverdueTasksWidget;

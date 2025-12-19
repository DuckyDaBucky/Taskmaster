/**
 * Task Timeline View - Hourly day schedule
 * Shows tasks organized by hour in a timeline format
 */

import React, { useState, useMemo } from 'react';
import { Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { TasksData } from '../../services/types';

interface TaskTimelineProps {
  tasks: TasksData[];
  onTaskClick?: (task: TasksData) => void;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks, onTaskClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate hours array (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Filter and organize tasks by hour for selected date
  const tasksByHour = useMemo(() => {
    const organized: Record<number, TasksData[]> = {};
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    tasks.forEach(task => {
      if (!task.deadline) return;
      
      const taskDate = new Date(task.deadline);
      if (taskDate >= startOfDay && taskDate <= endOfDay) {
        const hour = taskDate.getHours();
        if (!organized[hour]) organized[hour] = [];
        organized[hour].push(task);
      }
    });

    return organized;
  }, [tasks, selectedDate]);

  // Get all tasks for the selected day (for summary)
  const dayTasks = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  }, [tasks, selectedDate]);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getTaskStatusColor = (task: TasksData) => {
    if (task.completed) return 'bg-green-500/10 border-green-500/30 text-green-700';
    if (task.status === 'overdue') return 'bg-red-500/10 border-red-500/30 text-red-700';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-700';
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <button
          onClick={goToPreviousDay}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-sm text-muted-foreground">
              {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} scheduled
            </div>
          </div>
          {!isToday(selectedDate) && (
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-1"
            >
              <Calendar size={14} />
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourTasks = tasksByHour[hour] || [];
            const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour;

            return (
              <div
                key={hour}
                className={`flex border-b border-border last:border-b-0 ${
                  isCurrentHour ? 'bg-primary/5' : ''
                }`}
              >
                {/* Time column */}
                <div className={`w-24 flex-shrink-0 p-3 border-r border-border ${
                  isCurrentHour ? 'bg-primary/10' : 'bg-secondary/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {isCurrentHour && <Clock size={14} className="text-primary" />}
                    <span className={`text-sm font-medium ${
                      isCurrentHour ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {formatTime(hour)}
                    </span>
                  </div>
                </div>

                {/* Tasks column */}
                <div className="flex-1 p-2 min-h-[60px]">
                  {hourTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                      {isCurrentHour && 'No tasks scheduled for this hour'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hourTasks.map(task => (
                        <div
                          key={task._id}
                          onClick={() => onTaskClick?.(task)}
                          className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getTaskStatusColor(task)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{task.title}</div>
                              {task.topic && (
                                <div className="text-xs opacity-75 truncate">{task.topic}</div>
                              )}
                              <div className="text-xs opacity-60 mt-1">
                                {new Date(task.deadline!).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            {task.completed && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-700">
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {dayTasks.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-foreground mb-2">Day Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{dayTasks.length}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {dayTasks.filter(t => t.completed).length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {dayTasks.filter(t => !t.completed).length}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

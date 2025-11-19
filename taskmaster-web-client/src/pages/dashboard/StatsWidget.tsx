import React from "react";
import { CheckSquare, Zap, TrendingUp } from "lucide-react";
import type { TasksData } from "../../services/mockDatabase";

interface StatsWidgetProps {
  tasks: TasksData[];
  isLoading?: boolean;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ tasks = [], isLoading = false }) => {
  // Calculate real stats from tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  
  // Calculate completion percentage (avoid NaN)
  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  // Get user streak from localStorage or default to 0
  const userData = localStorage.getItem("userData");
  const user = userData ? JSON.parse(userData) : null;
  const streak = user?.streak || 0;

  const stats = [
    { 
      label: "Total Tasks", 
      value: isLoading ? "..." : totalTasks.toString(), 
      change: `${pendingTasks} pending`, 
      icon: CheckSquare, 
      color: "text-blue-500" 
    },
    { 
      label: "Completed", 
      value: isLoading ? "..." : completedTasks.toString(), 
      change: `${overdueTasks} overdue`, 
      icon: CheckSquare, 
      color: "text-green-500" 
    },
    { 
      label: "Streak", 
      value: isLoading ? "..." : `${streak} Days`, 
      change: streak > 0 ? "🔥" : "Start your streak!", 
      icon: Zap, 
      color: "text-orange-500" 
    },
    { 
      label: "Completion", 
      value: isLoading ? "..." : `${completionPercentage}%`, 
      change: totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : "No tasks yet", 
      icon: TrendingUp, 
      color: "text-purple-500" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              <span className={`text-xs mt-1 block ${stat.change.includes("🔥") || stat.change.includes("pending") || stat.change.includes("overdue") ? "text-muted-foreground" : "text-green-500"}`}>
                {stat.change}
              </span>
            </div>
            <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
              <Icon size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

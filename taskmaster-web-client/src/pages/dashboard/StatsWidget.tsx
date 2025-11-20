import React, { useState, useEffect } from "react";
import { CheckSquare, Zap, TrendingUp, X } from "lucide-react";
import { apiService } from "../../services/apiService";
import { useUser } from "../../context/UserContext";
import type { TasksData } from "../../services/types";

interface StatsWidgetProps {
  tasks: TasksData[];
  isLoading?: boolean;
  user?: any;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ tasks = [], isLoading = false, user }) => {
  const { user: contextUser } = useUser();
  const currentUser = user || contextUser;
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [loginDates, setLoginDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);

  // Calculate real stats from tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  
  // Calculate completion percentage (avoid NaN)
  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  // Get user streak from user prop or context
  const currentStreak = currentUser?.streak || 0;

  useEffect(() => {
    if (showStreakModal && !isLoadingStreak) {
      const fetchLoginDates = async () => {
        setIsLoadingStreak(true);
        try {
          const data = await apiService.getLoginDates();
          setLoginDates(data.loginDates || []);
          setStreak(data.streak || 0);
        } catch (error) {
          console.error("Error fetching login dates:", error);
        } finally {
          setIsLoadingStreak(false);
        }
      };
      fetchLoginDates();
    }
  }, [showStreakModal]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get last 30 days for calendar view
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last30Days = getLast30Days();
  const loginDatesSet = new Set(loginDates.map(d => new Date(d).toISOString().split('T')[0]));

  const stats = [
    { 
      label: "Total Tasks", 
      value: isLoading ? "..." : totalTasks.toString(), 
      change: `${pendingTasks} pending`, 
      icon: CheckSquare, 
      color: "text-blue-500",
      onClick: undefined
    },
    { 
      label: "Completed", 
      value: isLoading ? "..." : completedTasks.toString(), 
      change: `${overdueTasks} overdue`, 
      icon: CheckSquare, 
      color: "text-green-500",
      onClick: undefined
    },
    { 
      label: "Streak", 
      value: isLoading ? "..." : `${currentStreak} Days`, 
      change: currentStreak > 0 ? "Keep it going!" : "Start your streak!", 
      icon: Zap, 
      color: "text-orange-500",
      onClick: () => setShowStreakModal(true)
    },
    { 
      label: "Completion", 
      value: isLoading ? "..." : `${completionPercentage}%`, 
      change: totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : "No tasks yet", 
      icon: TrendingUp, 
      color: "text-purple-500",
      onClick: undefined
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className={`bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors ${stat.onClick ? 'cursor-pointer' : ''}`}
              onClick={stat.onClick}
            >
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                <span className={`text-xs mt-1 block ${stat.change.includes("pending") || stat.change.includes("overdue") || stat.change.includes("Keep it going") ? "text-muted-foreground" : "text-green-500"}`}>
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

      {/* Streak Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Login Streak</h2>
              <button
                onClick={() => setShowStreakModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            {isLoadingStreak ? (
              <div className="text-center text-muted-foreground py-8">Loading login history...</div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-foreground mb-2">{streak} Day Streak</div>
                  <p className="text-muted-foreground">Keep logging in daily to maintain your streak!</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Last 30 Days</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {last30Days.map((day) => {
                      const isLoggedIn = loginDatesSet.has(day);
                      const date = new Date(day);
                      const dayOfWeek = date.getDay();
                      const dayNumber = date.getDate();
                      const isToday = day === new Date().toISOString().split('T')[0];
                      
                      return (
                        <div
                          key={day}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs ${
                            isLoggedIn
                              ? 'bg-green-500 text-white'
                              : isToday
                              ? 'bg-primary/20 text-primary border-2 border-primary'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                          title={formatDate(day)}
                        >
                          <div className="text-[10px] opacity-70">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek]}
                          </div>
                          <div className="font-semibold">{dayNumber}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {loginDates.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">All Login Dates</h3>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {loginDates
                        .map(d => new Date(d))
                        .sort((a, b) => b.getTime() - a.getTime())
                        .map((date, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground py-1">
                            {formatDate(date.toISOString())}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

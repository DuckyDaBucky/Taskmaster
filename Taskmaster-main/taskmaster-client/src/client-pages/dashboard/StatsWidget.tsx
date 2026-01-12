import React, { useState, useEffect } from "react";
import { CheckSquare, Trophy, Zap, TrendingUp, X } from "lucide-react";
import { apiService } from "../../services/api";
import { useUser } from "../../context/UserContext";
import type { TasksData } from "../../services/types";
import { RANKS, getRankProgress } from "../../lib/gamification";

interface StatsWidgetProps {
  tasks: TasksData[];
  isLoading?: boolean;
  user?: any;
}

type StatItem = {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  changeClass?: string;
  progress?: number;
  progressLabel?: string;
  progressLeftLabel?: string;
  progressRightLabel?: string;
  progressBarColor?: string;
};

export const StatsWidget: React.FC<StatsWidgetProps> = ({ tasks = [], isLoading = false, user }) => {
  const { user: contextUser } = useUser();
  const currentUser = user || contextUser;
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [loginDates, setLoginDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);

  // Calculate real stats from tasks (check both completed flag and status for compatibility)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed' && t.status !== 'overdue').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const dueTodayTasks = tasks.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    return (
      deadline.getFullYear() === now.getFullYear() &&
      deadline.getMonth() === now.getMonth() &&
      deadline.getDate() === now.getDate()
    );
  });
  const dueTodayTotal = dueTodayTasks.length;
  const dueTodayCompleted = dueTodayTasks.filter(t => t.completed || t.status === 'completed').length;
  const dueTodayPending = dueTodayTasks.filter(t => !t.completed && t.status !== 'completed').length;
  
  // Calculate completion percentage (avoid NaN)
  const completionPercentage = dueTodayTotal > 0 
    ? Math.round((dueTodayCompleted / dueTodayTotal) * 100) 
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

  const taskPoints = tasks.reduce((total, task) => {
    const isComplete = task.completed || task.status === "completed";
    if (!isComplete) return total;
    const points = task.earnedPoints ?? task.points ?? 0;
    return total + (Number.isFinite(points) ? points : 0);
  }, 0);
  const userPoints = Math.max(taskPoints, currentUser?.points || 0);
  const { currentRank, nextRank, progress, targetPoints, pointsToNext } = getRankProgress(userPoints);
  const getRankStyle = (rankName?: string) => {
    switch (rankName) {
      case "Bronze":
        return { text: "text-amber-700", bar: "bg-amber-700/70", chip: "bg-amber-700/10 text-amber-700 border-amber-700/30" };
      case "Silver":
        return { text: "text-gray-400", bar: "bg-gray-400/70", chip: "bg-gray-400/10 text-gray-400 border-gray-400/30" };
      case "Gold":
        return { text: "text-yellow-500", bar: "bg-yellow-500/70", chip: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" };
      case "Diamond":
        return { text: "text-blue-400", bar: "bg-blue-400/70", chip: "bg-blue-400/10 text-blue-400 border-blue-400/30" };
      case "Study Expert":
        return { text: "text-emerald-500", bar: "bg-emerald-500/70", chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" };
      case "Task Master":
        return { text: "text-rose-500", bar: "bg-rose-500/70", chip: "bg-rose-500/10 text-rose-500 border-rose-500/30" };
      default:
        return { text: "text-yellow-500", bar: "bg-yellow-500/70", chip: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" };
    }
  };
  const rankStyle = getRankStyle(currentRank.name);
  const pointsValue = userPoints.toString();
  const pointsTarget = nextRank ? `${targetPoints}` : `${userPoints}`;
  const modalPointsLabel = nextRank ? `${userPoints} / ${targetPoints}` : `${userPoints}`;

  const stats: StatItem[] = [
    { 
      label: "Due Today", 
      value: isLoading ? "..." : dueTodayTotal.toString(), 
      change: `${dueTodayPending} pending`, 
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
      label: "Points", 
      value: isLoading ? "..." : pointsValue, 
      change: `Rank ${currentRank.name}`, 
      icon: Trophy, 
      color: rankStyle.text,
      onClick: () => setShowRankModal(true),
      changeClass: "text-muted-foreground",
      progress: isLoading ? undefined : progress,
      progressLeftLabel: `${userPoints}`,
      progressRightLabel: pointsTarget,
      progressBarColor: rankStyle.bar,
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
      change: dueTodayTotal > 0 ? `${dueTodayCompleted}/${dueTodayTotal} due today` : "No tasks due today", 
      icon: TrendingUp, 
      color: "text-purple-500",
      onClick: undefined,
      changeClass: dueTodayTotal > 0 ? "text-green-500" : "text-muted-foreground",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPoints = stat.label === "Points";
          return (
            <div 
              key={stat.label} 
              className={`bg-card border border-border rounded-md p-4 ${isPoints ? 'relative' : 'flex items-center justify-between'} hover:border-primary/50 transition-colors ${stat.onClick ? 'cursor-pointer' : ''}`}
              onClick={stat.onClick}
            >
              <div className={isPoints ? "w-full pr-12" : ""}>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                {isPoints && (
                  <div className={`text-lg font-semibold mt-1 ${stat.color}`}>
                    {stat.change}
                  </div>
                )}
                {typeof stat.progress === "number" && (
                  <div className="mt-2">
                    {stat.progressRightLabel && (
                      <div className="text-[11px] text-muted-foreground flex justify-end">
                        <span>{stat.progressRightLabel}</span>
                      </div>
                    )}
                    <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden border border-border relative">
                      <div
                        className={`h-full ${stat.progressBarColor}`}
                        style={{ width: `${Math.round(stat.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!isPoints && (
                  <span className={`text-xs mt-2 block ${stat.changeClass || "text-muted-foreground"}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className={`p-3 rounded-full bg-secondary ${stat.color} ${isPoints ? "absolute right-4 top-4" : ""}`}>
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

      {/* Rank Modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 pr-3">
                <h2 className="text-2xl font-bold text-foreground">Rank Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {nextRank ? `${pointsToNext} points to reach ${nextRank.name}` : "You reached the top rank"}
                </p>
              </div>
              <button
                onClick={() => setShowRankModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{modalPointsLabel} points</span>
                <span>{currentRank.name}</span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-secondary overflow-hidden border border-border">
                <div
                  className={`h-full ${rankStyle.bar}`}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {RANKS.map((rank, index) => {
                const next = RANKS[index + 1];
                const maxPoints = next ? next.minPoints - 1 : null;
                const rangeLabel = maxPoints !== null ? `${rank.minPoints} - ${maxPoints}` : `${rank.minPoints}+`;
                const isCurrent = rank.name === currentRank.name;
                const style = getRankStyle(rank.name);
                return (
                  <div
                    key={rank.name}
                    className={`flex items-center justify-between rounded-md border px-4 py-3 ${
                      isCurrent ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-secondary ${style.text}`}>
                        <Trophy size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{rank.name}</div>
                        <div className="text-xs text-muted-foreground">{rangeLabel} pts</div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className={`text-xs border rounded-full px-2 py-1 ${style.chip}`}>Current</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

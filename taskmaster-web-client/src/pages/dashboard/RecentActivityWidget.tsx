import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";

interface Activity {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  metadata?: {
    streak?: number;
    streakChange?: number;
    previousStreak?: number;
  };
}

export const RecentActivityWidget: React.FC = () => {
  const { user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await apiService.getActivities(20); // Get more to filter
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user?._id]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString();
  };

  // Filter and process activities
  const processedActivities = React.useMemo(() => {
    const seenLoginDates = new Set<string>();
    const result: Activity[] = [];

    for (const activity of activities) {
      const activityDate = new Date(activity.createdAt);
      const dateKey = activityDate.toISOString().split('T')[0];

      // For login activities, only show once per day
      if (activity.type === 'login') {
        if (!seenLoginDates.has(dateKey)) {
          seenLoginDates.add(dateKey);
          result.push(activity);
        }
        // Skip duplicate logins for the same day
        continue;
      }

      // For streak activities, always include
      if (activity.type === 'streak_achieved') {
        result.push(activity);
        continue;
      }

      // For all other activities, include them
      result.push(activity);
    }

    // Sort by date (newest first) and limit to 10
    return result
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [activities]);

  const getActivityDisplay = (activity: Activity) => {
    // Handle login activities with streak indicator
    if (activity.type === 'login') {
      const streakChange = activity.metadata?.streakChange;
      const streak = activity.metadata?.streak || 0;
      
      if (streakChange === 1 && streak > 1) {
        // Consecutive login - show +1
        return {
          text: "Logged in",
          badge: { text: "+1", color: "text-green-500" },
          streak: streak
        };
      } else if (streakChange === 1 && streak === 1) {
        // First login or new streak
        return {
          text: "Logged in",
          badge: streak > 0 ? { text: `Streak: ${streak}`, color: "text-primary" } : null,
          streak: streak
        };
      } else {
        // Same day login (shouldn't happen after filtering, but just in case)
        return {
          text: "Logged in",
          badge: streak > 0 ? { text: `Streak: ${streak}`, color: "text-primary" } : null,
          streak: streak
        };
      }
    }

    // Handle streak lost activities
    if (activity.type === 'streak_achieved' && activity.metadata?.streakChange && activity.metadata.streakChange < 0) {
      const previousStreak = activity.metadata.previousStreak || Math.abs(activity.metadata.streakChange);
      return {
        text: "Streak lost",
        badge: { text: `-${previousStreak}`, color: "text-red-500" },
        streak: activity.metadata.streak || 0
      };
    }

    // Handle streak increased activities
    if (activity.type === 'streak_achieved' && activity.metadata?.streakChange && activity.metadata.streakChange > 0) {
      return {
        text: "Streak increased",
        badge: { text: `+${activity.metadata.streakChange}`, color: "text-green-500" },
        streak: activity.metadata.streak || 0
      };
    }

    // Default: show description as-is
    return {
      text: activity.description,
      badge: null,
      streak: null
    };
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (processedActivities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-muted-foreground text-sm">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-md p-6 h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {processedActivities.map((activity) => {
          const display = getActivityDisplay(activity);
          return (
            <div key={activity._id} className="flex gap-3 items-start">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                activity.type === 'streak_achieved' && activity.metadata?.streakChange && activity.metadata.streakChange < 0
                  ? 'bg-red-500'
                  : activity.type === 'login' && display.badge?.color === 'text-green-500'
                  ? 'bg-green-500'
                  : 'bg-primary'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{display.text}</p>
                  {display.badge && (
                    <span className={`text-xs font-semibold ${display.badge.color}`}>
                      {display.badge.text}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

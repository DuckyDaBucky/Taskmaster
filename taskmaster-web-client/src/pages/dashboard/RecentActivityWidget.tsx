import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";

interface Activity {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  metadata?: any;
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
        const data = await apiService.getActivities(10);
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

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-6 h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (activities.length === 0) {
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
        {activities.map((activity) => (
          <div key={activity._id} className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <div>
              <p className="text-sm text-foreground">{activity.description}</p>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

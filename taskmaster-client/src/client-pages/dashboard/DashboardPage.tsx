"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { streakService } from "../../services/streakService";
import type { TasksData } from "../../services/types";

// Lazy load heavy widgets
const StatsWidget = dynamic(() => import("./StatsWidget").then(mod => mod.StatsWidget), {
  loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
  ssr: false // Client-side only for charts
});
const RecentActivityWidget = dynamic(() => import("./RecentActivityWidget").then(mod => mod.RecentActivityWidget), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
});
const ActivityChart = dynamic(() => import("./ActivityChart").then(mod => mod.ActivityChart), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
  ssr: false
});
const ProgressChart = dynamic(() => import("./ProgressChart").then(mod => mod.ProgressChart), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
  ssr: false
});


interface DashboardPageProps {
  initialTasks?: TasksData[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ initialTasks }) => {
  const { user, refreshUser } = useUser();
  const [tasks, setTasks] = useState<TasksData[]>(initialTasks || []);
  const [isLoading, setIsLoading] = useState(!initialTasks);

  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Update streak on dashboard load
        const streakResult = await streakService.updateStreak();
        if (streakResult.isNewLogin && refreshUser) {
          refreshUser(); // Refresh user context with new streak
        }
        
        // Fetch all tasks (includes personal tasks)
        const allTasks = await apiService.getAllTasks();
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();
    
    // Check for midnight every minute
    const midnightInterval = setInterval(() => {
      streakService.checkMidnightUpdate();
    }, 60000); // Check every minute

    return () => clearInterval(midnightInterval);
  }, [user?._id]);

  const displayName = user?.firstName || user?.username || user?.email || "User";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {displayName}!</p>
        </div>
        <button className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors">
          + New Task
        </button>
      </div>

      <StatsWidget tasks={tasks} isLoading={isLoading} user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart tasks={tasks} isLoading={isLoading} />
          <ProgressChart tasks={tasks} isLoading={isLoading} />
        </div>
        
        <div>
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

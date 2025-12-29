"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { streakService } from "../../services/streakService";
import { taskEvents } from "../../lib/taskEvents";
import type { TasksData } from "../../services/types";

// Lazy load heavy widgets
const StatsWidget = dynamic(() => import("./StatsWidget").then(mod => mod.StatsWidget), {
  loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
  ssr: false
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

  const fetchTasks = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const allTasks = await apiService.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [user?._id]);

  useEffect(() => {
    const init = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Update streak on dashboard load
        const streakResult = await streakService.updateStreak();
        if (streakResult.isNewLogin && refreshUser) {
          refreshUser();
        }
        
        // Fetch tasks
        await fetchTasks();
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?._id, fetchTasks, refreshUser]);

  // Listen for task updates from other components
  useEffect(() => {
    const unsubscribe = taskEvents.subscribe(() => {
      fetchTasks();
    });
    return () => { unsubscribe(); };
  }, [fetchTasks]);

  // Refresh when page becomes visible (e.g., after navigating back from tasks page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTasks]);

  // Midnight check
  useEffect(() => {
    const interval = setInterval(() => {
      streakService.checkMidnightUpdate();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.firstName || user?.username || user?.email || "User";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {displayName}!</p>
        </div>
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

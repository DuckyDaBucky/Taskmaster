"use client";

import React, { useEffect, useState } from "react";
import { StatsWidget } from "./StatsWidget";
import { RecentActivityWidget } from "./RecentActivityWidget";
import { ActivityChart } from "./ActivityChart";
import { ProgressChart } from "./ProgressChart";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { streakService } from "../../services/streakService";
import type { TasksData } from "../../services/types";

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

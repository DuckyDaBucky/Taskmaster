import React, { useEffect, useState } from "react";
import { StatsWidget } from "./StatsWidget";
import { RecentActivityWidget } from "./RecentActivityWidget";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import type { TasksData } from "../../services/mockDatabase";

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Get all classes for the user
        const classes = await apiService.getClassesByUserId(user._id);
        
        // Fetch tasks for each class
        const allTasks: TasksData[] = [];
        for (const classItem of classes) {
          try {
            const classTasks = await apiService.getTasksByClassId(classItem._id);
            allTasks.push(...classTasks);
          } catch (error) {
            console.error(`Error fetching tasks for class ${classItem._id}:`, error);
          }
        }
        
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTasks();
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

      <StatsWidget tasks={tasks} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border-color rounded-md p-6 h-64 flex items-center justify-center text-muted-foreground">
            Chart Placeholder (Activity)
          </div>
          <div className="bg-surface border border-border-color rounded-md p-6 h-64 flex items-center justify-center text-muted-foreground">
            Chart Placeholder (Progress)
          </div>
        </div>
        
        <div>
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

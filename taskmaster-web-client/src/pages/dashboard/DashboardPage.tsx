import React from "react";
import { StatsWidget } from "./StatsWidget";
import { RecentActivityWidget } from "./RecentActivityWidget";

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, User!</p>
        </div>
        <button className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors">
          + New Task
        </button>
      </div>

      <StatsWidget />

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

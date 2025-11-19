import React from "react";
import { CheckSquare, Clock, Zap, TrendingUp } from "lucide-react";

const stats = [
  { label: "Tasks Completed", value: "12", change: "+2", icon: CheckSquare, color: "text-blue-500" },
  { label: "Study Hours", value: "24h", change: "+4h", icon: Clock, color: "text-purple-500" },
  { label: "Streak", value: "5 Days", change: "🔥", icon: Zap, color: "text-orange-500" },
  { label: "Productivity", value: "85%", change: "+5%", icon: TrendingUp, color: "text-green-500" },
];

export const StatsWidget: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              <span className="text-xs text-green-500 mt-1 block">{stat.change} this week</span>
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

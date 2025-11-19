import React from "react";

const activities = [
  { id: 1, text: "Completed 'Math Assignment'", time: "2 hours ago" },
  { id: 2, text: "Added new resource 'History Notes'", time: "4 hours ago" },
  { id: 3, text: "Joined study group 'Physics 101'", time: "Yesterday" },
  { id: 4, text: "Achieved 5 day streak!", time: "Yesterday" },
];

export const RecentActivityWidget: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-md p-6 h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <div>
              <p className="text-sm text-foreground">{activity.text}</p>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 text-sm text-primary hover:text-primary/80 font-medium border border-border rounded hover:bg-secondary transition-colors">
        View All Activity
      </button>
    </div>
  );
};

import React from "react";
import { Edit2, Trash2 } from "lucide-react";

const TASKS_DATA = [
  { id: 1, title: "Complete Math Assignment", subject: "Math 101", status: "pending", deadline: "Tomorrow" },
  { id: 2, title: "Read Chapter 4", subject: "History 202", status: "in-progress", deadline: "Wed, Oct 24" },
  { id: 3, title: "Physics Lab Report", subject: "Physics 301", status: "completed", deadline: "Yesterday" },
];

const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors">
          + New Task
        </button>
      </div>

      {/* Task Filters */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button className="px-3 py-1 text-sm font-medium text-primary border-b-2 border-primary">All Tasks</button>
        <button className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">Pending</button>
        <button className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">Completed</button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {TASKS_DATA.map((task) => (
          <div key={task.id} className="bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full border-2 ${
                task.status === "completed" ? "bg-green-500 border-green-500" : "border-muted-foreground"
              }`} />
              <div>
                <h4 className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.title}
                </h4>
                <p className="text-xs text-muted-foreground">{task.subject} • Due {task.deadline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 text-muted-foreground hover:text-primary">
                <Edit2 size={16} />
              </button>
              <button className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;

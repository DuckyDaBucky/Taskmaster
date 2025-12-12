import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import type { TasksData, ClassData } from "../../services/types";

interface TaskListProps {
  tasks: TasksData[];
  classes: ClassData[];
  filter: "all" | "pending" | "completed";
  onEdit: (task: TasksData) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  classes,
  filter,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "completed") return task.completed;
    return !task.completed;
  });

  const handleToggle = async (task: TasksData) => {
    if (!onToggleComplete) return;
    setCompletingTaskId(task._id);
    await onToggleComplete(task._id, !task.completed);
    setTimeout(() => setCompletingTaskId(null), 600);
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
        <p>No tasks found. Create your first task!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => {
        const taskClass = task.class ? classes.find((c) => c._id === task.class) : null;
        return (
          <div
            key={task._id}
            className="bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggle(task)}
                disabled={!onToggleComplete}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all relative group/checkbox ${
                  task.completed
                    ? "bg-green-500 border-green-500"
                    : "border-muted-foreground hover:border-primary"
                } ${completingTaskId === task._id ? 'animate-bounce' : ''}`}
              >
                {task.completed ? (
                  <svg 
                    className="w-3 h-3 text-white" 
                    fill="none" 
                    strokeWidth="2" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover/checkbox:bg-primary/30 transition-colors" />
                )}
              </button>
              <div>
                <h4
                  className={`font-medium ${
                    task.status === "completed"
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {task.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {taskClass?.name || "Personal"} • Due{" "}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : "No deadline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-muted-foreground hover:text-primary"
                aria-label="Edit task"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(task._id)}
                className="p-1 text-muted-foreground hover:text-destructive"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};


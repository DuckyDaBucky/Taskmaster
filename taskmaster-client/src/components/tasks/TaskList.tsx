import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import type { TasksData, ClassData } from "../../services/types";
import { getClassColor } from "../../utils/classColors";

interface TaskListProps {
  tasks: TasksData[];
  classes: ClassData[];
  filter: "today" | "upcoming" | "history";
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
  const [selectedHistoryDate, setSelectedHistoryDate] = React.useState<string | null>(null);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const isToday = (deadline?: string) => {
    if (!deadline) return false;
    const date = new Date(deadline);
    return date >= startOfDay && date < endOfDay;
  };

  const isUpcoming = (deadline?: string) => {
    if (!deadline) return false;
    const date = new Date(deadline);
    return date >= endOfDay;
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    const date = new Date(deadline);
    return date < startOfDay;
  };

  const todayTasks = tasks
    .filter((task) => task.deadline && isToday(task.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const overdueTasks = tasks
    .filter((task) => !task.completed && task.deadline && isOverdue(task.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const upcomingTasks = tasks
    .filter((task) => !task.completed && isUpcoming(task.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const historyTasks = tasks
    .filter((task) => task.completed || task.status === "completed")
    .sort((a, b) => {
      const aTime = taskDateSortValue(a.deadline);
      const bTime = taskDateSortValue(b.deadline);
      return bTime - aTime;
    });

  const filteredTasks =
    filter === "today" ? [...overdueTasks, ...todayTasks] : filter === "upcoming" ? upcomingTasks : historyTasks;

  function taskDateSortValue(deadline?: string) {
    if (!deadline) return 0;
    return new Date(deadline).getTime();
  }

  const handleToggle = async (task: TasksData) => {
    if (!onToggleComplete) return;
    setCompletingTaskId(task._id);
    await onToggleComplete(task._id, !task.completed);
    setTimeout(() => setCompletingTaskId(null), 600);
  };

  React.useEffect(() => {
    if (filter !== "history") return;
    if (selectedHistoryDate) return;
    const dateKeys = historyTasks.reduce<string[]>((acc, task) => {
      const dateKey = task.deadline
        ? new Date(task.deadline).toISOString().split("T")[0]
        : "No date";
      if (!acc.includes(dateKey)) acc.push(dateKey);
      return acc;
    }, []);
    const next = dateKeys.sort((a, b) => {
      if (a === "No date") return 1;
      if (b === "No date") return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    })[0];
    if (next) setSelectedHistoryDate(next);
  }, [filter, historyTasks, selectedHistoryDate]);

  if (filteredTasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
        <p>No tasks found. Create your first task!</p>
      </div>
    );
  }

  if (filter === "history") {
    const groupedByDate = historyTasks.reduce<Record<string, TasksData[]>>((acc, task) => {
      const dateKey = task.deadline
        ? new Date(task.deadline).toISOString().split("T")[0]
        : "No date";
      acc[dateKey] = acc[dateKey] ? [...acc[dateKey], task] : [task];
      return acc;
    }, {});

    const dateTabs = Object.keys(groupedByDate).sort((a, b) => {
      if (a === "No date") return 1;
      if (b === "No date") return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    });

    const activeDate = selectedHistoryDate || dateTabs[0];

    const tasksForDate = groupedByDate[activeDate] || [];
    const tasksByClass = tasksForDate.reduce<Record<string, TasksData[]>>((acc, task) => {
      const classId = task.class || "personal";
      acc[classId] = acc[classId] ? [...acc[classId], task] : [task];
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto border-b border-border pb-1">
          {dateTabs.map((dateKey) => (
            <button
              key={dateKey}
              onClick={() => setSelectedHistoryDate(dateKey)}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-lg relative ${
                activeDate === dateKey
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              {dateKey === "No date"
                ? "No date"
                : new Date(dateKey).toLocaleDateString()}
              <span className="ml-1.5 text-xs opacity-75">
                ({groupedByDate[dateKey].length})
              </span>
              {activeDate === dateKey && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {Object.entries(tasksByClass).map(([classId, classTasks]) => {
            const taskClass = classId !== "personal"
              ? classes.find((c) => c._id === classId)
              : null;

            return (
              <div key={classId} className="bg-card border border-border rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getClassColor(classId) }}
                  />
                  <h4 className="text-sm font-semibold text-foreground">
                    {taskClass?.name || "Personal"}
                  </h4>
                </div>
                <div className="space-y-2">
                  {classTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getClassColor(task.class || "personal") }}
                        />
                        <div>
                          <p className="text-sm text-foreground line-through">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {task.deadline
                              ? new Date(task.deadline).toLocaleDateString()
                              : "No deadline"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const renderTaskRow = (task: TasksData, highlightOverdue: boolean = false) => {
    const taskClass = task.class ? classes.find((c) => c._id === task.class) : null;
    const isTaskOverdue = !task.completed && task.deadline && isOverdue(task.deadline);
    return (
      <div
        key={task._id}
        className={`bg-card border rounded-md p-4 flex items-center justify-between transition-colors group ${
          highlightOverdue || isTaskOverdue
            ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
            : "border-border hover:border-primary/50"
        }`}
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
            {isTaskOverdue && (
              <span className="inline-block px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-semibold rounded mb-1">
                OVERDUE
              </span>
            )}
            <h4
              className={`font-medium ${
                task.completed
                  ? "text-muted-foreground line-through"
                  : isTaskOverdue
                  ? "text-red-500"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getClassColor(task.class || "personal") }}
              />
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
  };

  if (filter === "today") {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Due Today</h4>
          {todayTasks.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-4 text-sm text-muted-foreground">
              No tasks due today.
            </div>
          ) : (
            todayTasks.map((task) => renderTaskRow(task))
          )}
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Overdue</h4>
          {overdueTasks.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-4 text-sm text-muted-foreground">
              No overdue tasks.
            </div>
          ) : (
            overdueTasks.map((task) => renderTaskRow(task, true))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => renderTaskRow(task))}
    </div>
  );
};


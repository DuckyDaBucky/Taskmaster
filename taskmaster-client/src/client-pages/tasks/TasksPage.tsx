/**
 * Tasks Page - Optimized and modular
 */

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { streakService } from "../../services/streakService";
import { TaskModal } from "../../components/tasks/TaskModal";
import { TaskList } from "../../components/tasks/TaskList";
import { TaskTimeline } from "../../components/tasks/TaskTimeline";
import { TaskFilters } from "../../components/tasks/TaskFilters";
import { TaskViewToggle } from "../../components/tasks/TaskViewToggle";
import type { TasksData, ClassData } from "../../services/types";
import { calculateEarnedPoints } from "../../lib/gamification";

const TasksPage: React.FC = () => {
  const { user, isLoadingUser, setUserState } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"today" | "upcoming" | "overdue" | "unscheduled" | "history">("today");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingUser) {
      fetchData();
    }
  }, [user?._id, isLoadingUser]);

  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get("newTask") === "1") {
      setEditingTaskId(null);
      setShowModal(true);
      router.replace("/tasks");
    }
  }, [searchParams, router]);

  const fetchData = async () => {
    if (!user?._id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [allClasses, allTasks] = await Promise.all([
        apiService.getAllClasses(),
        apiService.getAllTasks(),
      ]);
      
      setClasses(allClasses || []);
      setTasks(allTasks || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setError(error.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await apiService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setError(error.message || "Failed to delete task");
    }
  };

  const handleTaskSaved = () => {
    fetchData();
    setShowModal(false);
    setEditingTaskId(null);
  };

  const handleOpenEditModal = (task: TasksData) => {
    setEditingTaskId(task._id);
    setShowModal(true);
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    const targetTask = tasks.find((task) => task._id === taskId);
    if (!targetTask) return;
    const taskPoints = Number.isFinite(targetTask.points ?? 0) ? (targetTask.points ?? 0) : 0;
    const earnedPoints = completed
      ? calculateEarnedPoints(taskPoints, targetTask.deadline)
      : 0;
    const status = completed ? 'completed' : 'pending';
    const previousTasks = tasks;

    setTasks(prev => prev.map(t =>
      t._id === taskId ? { ...t, completed, status, earnedPoints } : t
    ));

    try {
      await apiService.updateTask(taskId, { completed, status, earnedPoints });

      if (taskPoints > 0 && targetTask) {
        const previousEarned = Number.isFinite(targetTask.earnedPoints ?? taskPoints)
          ? targetTask.earnedPoints ?? taskPoints
          : taskPoints;
        const pointsDelta = completed ? earnedPoints : -1 * previousEarned;

        if (pointsDelta !== 0) {
          try {
            const nextPoints = await apiService.updateUserPoints(pointsDelta);
            setUserState({ points: nextPoints });
          } catch (pointsError) {
            console.error("Error updating points:", pointsError);
          }
        }
      }
      
      // Notify other components
      const { taskEvents } = await import('../../lib/taskEvents');
      taskEvents.emit('task-updated', taskId);
      
      // Update streak on task completion
      if (completed) {
        await streakService.updateStreak();
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      setTasks(previousTasks);
      setError(error.message || "Failed to update task");
    }
  };

  // Calculate filter counts
  const filterCounts = useMemo(() => {
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

    const isOverdueTask = (task: TasksData) => {
      const isComplete = task.completed || task.status === "completed";
      if (isComplete) return false;
      if (task.status === "overdue") return true;
      if (!task.deadline) return false;
      const date = new Date(task.deadline);
      return date < startOfDay;
    };

    const isUnscheduledTask = (task: TasksData) => {
      const isComplete = task.completed || task.status === "completed";
      return !task.deadline && !isComplete;
    };

    return {
      today: tasks.filter(t => t.deadline && isToday(t.deadline)).length,
      upcoming: tasks.filter(t => !t.completed && isUpcoming(t.deadline)).length,
      overdue: tasks.filter(t => isOverdueTask(t)).length,
      unscheduled: tasks.filter(t => isUnscheduledTask(t)).length,
      history: tasks.filter(t => t.completed || t.status === "completed").length,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your assignments and deadlines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TaskViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => {
              setEditingTaskId(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-sm underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters - Only in list view */}
      {viewMode === "list" && tasks.length > 0 && (
        <TaskFilters
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
        />
      )}

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first task to get started with managing your assignments
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create First Task
            </button>
          </div>
        </div>
      ) : viewMode === "timeline" ? (
        <TaskTimeline tasks={tasks} onTaskClick={handleOpenEditModal} />
      ) : (
        <TaskList
          tasks={tasks}
          classes={classes}
          filter={filter}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          editingTaskId={editingTaskId}
          onClose={() => {
            setShowModal(false);
            setEditingTaskId(null);
          }}
          onTaskSaved={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default TasksPage;

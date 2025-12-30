/**
 * Tasks Page - Optimized and modular
 */

import React, { useState, useEffect, useMemo } from "react";
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

const TasksPage: React.FC = () => {
  const { user, isLoadingUser } = useUser();
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingUser) {
      fetchData();
    }
  }, [user?._id, isLoadingUser]);

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
    try {
      const status = completed ? 'completed' : 'pending';
      await apiService.updateTask(taskId, { completed, status });
      setTasks(prev => prev.map(t => 
        t._id === taskId ? { ...t, completed, status } : t
      ));
      
      // Notify other components
      const { taskEvents } = await import('../../lib/taskEvents');
      taskEvents.emit('task-updated', taskId);
      
      // Update streak on task completion
      if (completed) {
        await streakService.updateStreak();
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      setError(error.message || "Failed to update task");
    }
  };

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  }), [tasks]);

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
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
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

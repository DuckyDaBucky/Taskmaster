import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import { TaskModal } from "../../components/tasks/TaskModal";
import { TaskList } from "../../components/tasks/TaskList";
import type { TasksData, ClassData } from "../../services/types";

const TasksPage: React.FC = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [resources, setResources] = useState<any[]>([]);
  const [personalClassId, setPersonalClassId] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    deadline: "",
    topic: "",
    status: "pending" as "pending" | "completed" | "overdue",
    points: "",
    textbook: "",
    classId: "",
    selectedResources: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch classes
        const userClasses = await apiService.getAllClasses();
        setClasses(userClasses);

        // Fetch all tasks (includes personal tasks)
        const allTasks = await apiService.getAllTasks();
        setTasks(allTasks);

        // Fetch all resources for selection
        const allResources = await apiService.getAllResources();
        setResources(allResources);

        // Fetch Personal class ID
        try {
          const personalClass = await apiService.getPersonalClassId();
          setPersonalClassId(personalClass.personalClassId);
        } catch (error) {
          console.error("Error fetching personal class:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setFormData({
      title: "",
      deadline: "",
      topic: "",
      status: "pending",
      points: "",
      textbook: "",
      classId: "",
      selectedResources: [],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (task: TasksData) => {
    setEditingTaskId(task._id);
    const taskClassId = task.class || "";
    const isTaskPersonal = !taskClassId || taskClassId === personalClassId;
    setIsPersonal(isTaskPersonal);
    setFormData({
      title: task.title || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
      topic: task.topic || "",
      status: task.status || "pending",
      points: task.points?.toString() || "",
      textbook: task.textbook || "",
      classId: isTaskPersonal ? "" : taskClassId,
      selectedResources: [],
    });
    setShowModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setError("Please enter a title");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const taskData = {
        title: formData.title,
        deadline: formData.deadline || undefined,
        topic: formData.topic || undefined,
        status: formData.status,
        points: formData.points ? parseInt(formData.points) : undefined,
        textbook: formData.textbook || undefined,
        resources: formData.selectedResources.length > 0 ? formData.selectedResources : undefined,
      };

      if (editingTaskId) {
        // Check if task is being marked as completed
        const oldTask = tasks.find(t => t._id === editingTaskId);
        const isCompletingTask = oldTask && oldTask.status !== 'completed' && taskData.status === 'completed';
        
        // Update existing task
        await apiService.updateTask(editingTaskId, taskData);
        
        // If task was just completed, call Flask API for gamification
        if (isCompletingTask && user?._id) {
          try {
            const result = await apiService.completeTask(editingTaskId, user._id);
            console.log("Task completed! Points earned:", result);
            // Optionally show a notification or update UI with points
          } catch (error) {
            console.error("Error updating points:", error);
            // Don't fail the task update if gamification fails
          }
        }
      } else {
        // Create new task
        const classId = isPersonal && personalClassId ? personalClassId : formData.classId;
        if (!classId) {
          setError("Please select a class or use Personal");
          setIsSubmitting(false);
          return;
        }
        await apiService.createTask(classId, taskData);
      }

      // Refresh tasks
      const allTasks = await apiService.getAllTasks();
      setTasks(allTasks);

      // Reset form
      setFormData({
        title: "",
        deadline: "",
        topic: "",
        status: "pending",
        points: "",
        textbook: "",
        classId: "",
        selectedResources: [],
      });
      setIsPersonal(false);
      setShowModal(false);
      setEditingTaskId(null);
    } catch (error: any) {
      console.error("Error saving task:", error);
      setError(error.response?.data?.message || `Failed to ${editingTaskId ? "update" : "create"} task`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await apiService.deleteTask(taskId);
      // Refresh tasks
      const allTasks = await apiService.getAllTasks();
      setTasks(allTasks);
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setError(error.response?.data?.message || "Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        </div>
        <div className="text-center text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} className="inline mr-1" />
          New Task
        </button>
      </div>

      {/* Task Filters */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            filter === "all"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            filter === "pending"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            filter === "completed"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <TaskList
        tasks={tasks}
        classes={classes}
        filter={filter}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTask}
      />

      <TaskModal
        isOpen={showModal}
        isEditing={!!editingTaskId}
        formData={formData}
        isPersonal={isPersonal}
        classes={classes}
        resources={resources}
        isSubmitting={isSubmitting}
        onClose={() => {
          setShowModal(false);
          setEditingTaskId(null);
          setIsPersonal(false);
        }}
        onSubmit={handleSaveTask}
        onFormChange={(updates) => setFormData({ ...formData, ...updates })}
        onPersonalToggle={(isPersonal) => {
          setIsPersonal(isPersonal);
          if (isPersonal) {
            setFormData({ ...formData, classId: "" });
          }
        }}
      />
    </div>
  );
};

export default TasksPage;

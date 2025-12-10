import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
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
  const [isPersonal, setIsPersonal] = useState(true); // Default to Personal
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

      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel for speed
      const results = await Promise.allSettled([
        apiService.getAllClasses(),
        apiService.getAllTasks(),
        apiService.getAllResources(),
        apiService.getPersonalClassId(),
      ]);

      // Handle classes
      if (results[0].status === 'fulfilled') {
        setClasses(results[0].value);
      }

      // Handle tasks
      if (results[1].status === 'fulfilled') {
        setTasks(results[1].value);
      }

      // Handle resources
      if (results[2].status === 'fulfilled') {
        setResources(results[2].value);
      }

      // Handle personal class ID
      if (results[3].status === 'fulfilled') {
        setPersonalClassId(results[3].value.personalClassId);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user?._id]);

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setIsPersonal(true); // Default to Personal
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
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const taskData = {
        title: formData.title.trim(),
        deadline: formData.deadline || undefined,
        topic: formData.topic || undefined,
        status: formData.status,
        points: formData.points ? parseInt(formData.points) : undefined,
        textbook: formData.textbook || undefined,
      };

      if (editingTaskId) {
        await apiService.updateTask(editingTaskId, taskData);
      } else {
        // Use Personal class if selected, otherwise use selected class, or null
        const classId = isPersonal ? personalClassId : (formData.classId || null);
        await apiService.createTask(classId, taskData);
      }

      // Refresh tasks
      const allTasks = await apiService.getAllTasks();
      setTasks(allTasks);

      // Reset and close
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
      setIsPersonal(true);
      setShowModal(false);
      setEditingTaskId(null);
    } catch (error: any) {
      console.error("Error saving task:", error);
      setError(error.message || "Failed to save task");
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
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setError(error.message || "Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
        {["all", "pending", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All Tasks" : f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks yet. Click "New Task" to create one!</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          classes={classes}
          filter={filter}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteTask}
        />
      )}

      <TaskModal
        isOpen={showModal}
        isEditing={!!editingTaskId}
        formData={formData}
        isPersonal={isPersonal}
        classes={classes.filter(c => !c.isPersonal)}
        resources={resources}
        isSubmitting={isSubmitting}
        onClose={() => {
          setShowModal(false);
          setEditingTaskId(null);
          setIsPersonal(true);
          setError(null);
        }}
        onSubmit={handleSaveTask}
        onFormChange={(updates) => setFormData({ ...formData, ...updates })}
        onPersonalToggle={(personal) => {
          setIsPersonal(personal);
          if (personal) {
            setFormData({ ...formData, classId: "" });
          }
        }}
      />
    </div>
  );
};

export default TasksPage;

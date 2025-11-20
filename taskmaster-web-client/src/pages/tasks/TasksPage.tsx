import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, X } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
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
        // Update existing task
        await apiService.updateTask(editingTaskId, taskData);
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

      {/* Task List */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No tasks found. Create your first task!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const taskClass = task.class ? classes.find((c) => c._id === task.class) : null;
            return (
              <div
                key={task._id}
                className="bg-card border border-border rounded-md p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      task.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : "border-muted-foreground"
                    }`}
                  />
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
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {editingTaskId ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTaskId(null);
                  setIsPersonal(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Class
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPersonal(true);
                      setFormData({ ...formData, classId: "" });
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isPersonal
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Personal
                  </button>
                </div>
                <select
                  value={formData.classId}
                  onChange={(e) => {
                    setIsPersonal(false);
                    setFormData({ ...formData, classId: e.target.value });
                  }}
                  disabled={isPersonal}
                  className={`w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    isPersonal ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "pending" | "completed" | "overdue",
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({ ...formData, points: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Textbook
                </label>
                <input
                  type="text"
                  value={formData.textbook}
                  onChange={(e) =>
                    setFormData({ ...formData, textbook: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Resources (Select multiple)
                </label>
                <select
                  multiple
                  value={formData.selectedResources}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, selectedResources: selected });
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  size={5}
                >
                  {resources
                    .filter((r) => !formData.classId || r.class === formData.classId || !r.class)
                    .flatMap((r) => (r.urls || []).map((url: string, idx: number) => ({ url, resourceId: r._id, idx })))
                    .map((item) => (
                      <option key={`${item.resourceId}-${item.idx}`} value={item.url}>
                        {item.url.length > 60 ? item.url.substring(0, 60) + "..." : item.url}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Hold Ctrl/Cmd to select multiple resources. Resources are filtered by selected class.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTaskId(null);
                    setIsPersonal(false);
                  }}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingTaskId
                      ? "Updating..."
                      : "Creating..."
                    : editingTaskId
                    ? "Update Task"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;

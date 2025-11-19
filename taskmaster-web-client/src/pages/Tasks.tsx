import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { setTasks as setTasksStore } from "../components/tasksStore";
import { PageContainer } from "../components/ui/PageContainer";
import { Button } from "../components/ui/Button";
import { TaskCard } from "../components/ui/TaskCard";
import { theme, getStatusColor } from "../constants/theme";

// Interfaces remain the same from the first snippet
export interface TasksData {
  _id: string;
  deadline: string;
  topic: string;
  title: string;
  status: "pending" | "completed" | "overdue";
  points: number | null;
  textbook: string | null;
  class: string; // classId
  className?: string; // Added by fetching logic
  classLocation?: string; // Added by fetching logic
}

export interface ClassData {
  _id: string;
  name: string;
  professor: string;
  timing: string;
  examDates: string[];
  topics: string[];
  gradingPolicy: string;
  contactInfo: string;
  textbooks: string[];
  location: string;
  user: string;
}

// Interface for user data from /me endpoint
interface UserData {
  _id: string;
}

const Tasks = () => {
  // State variables remain the same from the first snippet
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TasksData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // Add token from localStorage (as used in the second snippet)
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState<string | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [showXPPopup, setShowXPPopup] = useState<boolean>(false);

  // useEffect updated with backend integration logic
  useEffect(() => {
    const fetchTaskData = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // 1) Update task points
        await apiService.setPoints();

        // 2) Get user ID from /me endpoint
        const userRes = await apiService.getUserMe(token);
        const userId = userRes._id;
        setUserId(userId);

        // 3) Fetch classes for that user
        const classes = await apiService.getClassesByUserId(userId, token);

        if (classes.length === 0) {
          setTasks([]);
          setTasksStore([]); // Update store as well
          setLoading(false);
          return;
        }

        // 4) Fetch tasks for each class in parallel, tagging with className and location
        const taskRequests = classes.map(async (c) => {
          try {
            const ts = await apiService.getTasksByClassId(c._id, token);
            // Add className and classLocation from the class data
            return ts.map((t) => ({
              ...t,
              className: c.name,
              classLocation: c.location,
            }));
          } catch (taskErr: any) {
            console.warn(
              `Failed to fetch tasks for class ${c.name} (${c._id}): ${taskErr.message}`
            );
            return []; // Return empty array if tasks for a class fail
          }
        });

        const nestedTasks = await Promise.all(taskRequests);
        const tasksData = nestedTasks.flat(); // Flatten the array of arrays

        // 5) Auto-patch any overdue "pending" tasks
        const now = new Date();
        const patchCalls = tasksData
          .filter((t) => t.status === "pending" && new Date(t.deadline) < now)
          .map((t) => {
            return apiService
              .updateTask(t._id, { status: "overdue" }, token)
              .then(() => {
                t.status = "overdue"; // Update status locally after successful patch
              })
              .catch((patchErr) => {
                console.error(
                  `Failed to update task ${t._id} to overdue:`,
                  patchErr
                );
                // Decide if you want to proceed without patching or throw error
              });
          });

        // Wait for all patch calls to complete (or fail gracefully)
        await Promise.all(patchCalls);

        // Sort tasks by deadline (earliest first)
        const sortedTasks = tasksData.sort((a, b) => {
          // First, push completed to the end
          if (a.status === "completed" && b.status !== "completed") return 1;
          if (a.status !== "completed" && b.status === "completed") return -1;

          // If both are the same status (or both not completed), sort by deadline
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        });

        setTasks(sortedTasks); // Set the potentially updated and sorted tasks
        setTasksStore(sortedTasks); // Update the tasks store
      } catch (err: unknown) {
        // Handle errors from user/class fetch or major issues
        let message = "An unexpected error occurred.";
        if (err instanceof Error) {
          message = err.message || "Failed to load tasks.";
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          message = String((err as any).message) || "Failed to load tasks.";
        }
        setError(message);
        console.error("Error in fetchTaskData:", err);
        setTasks([]); // Clear tasks on major error
        setTasksStore([]); // Clear store as well
      } finally {
        setLoading(false);
      }
    };
    fetchTaskData();
    // Depend on token - if token changes, refetch
  }, [token]);

  // updateTaskStatus function updated with backend endpoint and token
  const updateTaskStatus = async (
    taskId: string,
    newStatus: TasksData["status"]
  ) => {
    if (!token) {
      setError("Authentication required to update task status.");
      return; // Prevent update without token
    }
    try {
      // Use port 3000 and add token header
      await apiService.updateTask(taskId, { status: newStatus }, token);
      // Update local state optimistically or after confirmation
      const updatedTasks = tasks.map((t) =>
        t._id === taskId ? { ...t, status: newStatus } : t
      );
      setTasks(updatedTasks);
      setTasksStore(updatedTasks); // Update store
      setError(null); // Clear previous errors on success
    } catch (err: unknown) {
      let message = "An unexpected error occurred while updating task.";
      if (err instanceof Error) {
        message = err.message || "Failed to update task.";
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as any).message) || "Failed to update task.";
      }
      setError(message);
      console.error(`Error updating task ${taskId}:`, err);
    }
  };

  // Handlers for modal buttons remain largely the same, using the updated updateTaskStatus
  const handleComplete = async () => {
    if (!selectedTask || !userId) return;

    setSelectedTask(null); // Close modal immediately to avoid blocking UI
    try {
      await updateTaskStatus(selectedTask._id, "completed");

      // XP Logic
      await apiService.completeTask(selectedTask._id, userId);
      
      // For mock, set some points (in real API this would come from response)
      setEarnedPoints(selectedTask.points || 50);
      setShowXPPopup(true);
      setTimeout(() => {
        setShowXPPopup(false);
      }, 2000); // hide popup after 2s
    } catch (err) {
      console.error("Error completing task or fetching points:", err);
    }
  };

  const handlePending = () => {
    if (!selectedTask) return;
    const now = new Date();
    const due = new Date(selectedTask.deadline);
    // Determine if it should be pending or overdue
    const newStatus: TasksData["status"] =
      selectedTask.status !== "completed" && due < now ? "overdue" : "pending";
    updateTaskStatus(selectedTask._id, newStatus).then(
      () => setSelectedTask(null) // Close modal after update
    );
  };

  // Status label function remains the same
  const statusLabel = (status: TasksData["status"]) => {
    if (status === "completed") return "Completed";
    if (status === "overdue") return "Overdue";
    return "Pending";
  };

  // Filter logic remains the same
  const filteredTasks =
    filterStatus === "all"
      ? [...tasks].sort((a, b) => {
          // Push completed to bottom
          if (a.status === "completed" && b.status !== "completed") return 1;
          if (a.status !== "completed" && b.status === "completed") return -1;
          // Sort by deadline otherwise
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        })
      : tasks.filter((task) => task.status === filterStatus);

  // --- Original JSX Structure and Styling (Unaltered) ---

  // Loading state
  if (loading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
            style={{ 
              borderColor: theme.colors.accentPrimary,
              borderTopColor: "transparent"
            }}
          />
        </div>
      </PageContainer>
    );

  // Error state
  if (error && tasks.length === 0 && !loading)
    return (
      <PageContainer>
        <div className="text-center p-6" style={{ color: theme.colors.error }}>
          {error}
        </div>
      </PageContainer>
    );

  // Main component return
  return (
    <PageContainer className="relative">
      <div className="relative z-10">
        {/* Display non-critical errors */}
        {error && (
          <div 
            className="p-3 mb-4 rounded-md"
            style={{ 
              backgroundColor: `rgba(239, 68, 68, 0.1)`,
              color: theme.colors.error,
              border: `1px solid rgba(239, 68, 68, 0.3)`
            }}
          >
            {error}
          </div>
        )}

        <div className="w-full space-y-5">
          {/* Header and Filter - Compact spacing */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-4">
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
              Tasks
            </h1>
            <div className="flex items-center gap-3">
              <label
                htmlFor="filter"
                className="text-sm font-medium whitespace-nowrap"
                style={{ color: theme.colors.textPrimary }}
              >
                Filter by Status:
              </label>
              <select
                id="filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 rounded-lg border appearance-none transition-colors"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: "#FFFFFF",
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.accentPrimary;
                  e.currentTarget.style.outline = "none";
                  e.currentTarget.style.boxShadow = `0 0 0 2px rgba(107, 107, 255, 0.2)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="all">All ({tasks.length})</option>
                <option value="pending">
                  Pending ({tasks.filter((t) => t.status === "pending").length})
                </option>
                <option value="completed">
                  Completed (
                  {tasks.filter((t) => t.status === "completed").length})
                </option>
                <option value="overdue">
                  Overdue ({tasks.filter((t) => t.status === "overdue").length})
                </option>
              </select>
            </div>
          </div>

          {/* Task Grid */}
          {filteredTasks.length === 0 ? (
            <p className="py-10 text-center" style={{ color: theme.colors.textSecondary }}>
              {tasks.length === 0
                ? "No tasks found. Upload a syllabus to potentially add tasks."
                : "No tasks match the selected filter."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
              {filteredTasks.map((task, i) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={i}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Task Modal - Original Structure & Styling */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Use motion for modal appearance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-lg p-6 w-full max-w-sm border"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadows.modal,
            }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>
              Update Task Status
            </h2>
            <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
              <strong style={{ color: theme.colors.textPrimary }}>Task:</strong>{" "}
              <span style={{ color: theme.colors.textPrimary }}>{selectedTask.title}</span>
            </p>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              <strong style={{ color: theme.colors.textPrimary }}>Class:</strong>{" "}
              <span style={{ color: theme.colors.textPrimary }}>
                {selectedTask.className || "N/A"}
              </span>
            </p>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleComplete}
                disabled={selectedTask.status === "completed"}
              >
                Mark as Completed
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handlePending}
                disabled={
                  selectedTask.status === "pending" ||
                  selectedTask.status === "overdue"
                }
              >
                {new Date(selectedTask.deadline) < new Date()
                  ? "Mark as Overdue"
                  : "Mark as Pending"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedTask(null)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showXPPopup && earnedPoints !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50"
          >
            🎉 You earned <strong>{earnedPoints}</strong> XP!
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Tasks;

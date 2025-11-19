import axios from "axios";
import { TASKS, Task } from "../database/tasksDB";

const API_URL = "http://localhost:5000";

export const taskService = {
    getTasks: async (): Promise<Task[]> => {
        try {
            const response = await axios.get<Task[]>(`${API_URL}/tasks`);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static data:", error);
            return TASKS;
        }
    },

    getTasksByClassId: async (classId: string): Promise<Task[]> => {
        try {
            const response = await axios.get<Task[]>(`${API_URL}/tasks/class/${classId}`);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static data:", error);
            return TASKS.filter((task) => task.class === classId);
        }
    },

    createTask: async (task: Partial<Task>): Promise<Task> => {
        try {
            const response = await axios.post<Task>(`${API_URL}/tasks`, task);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static mock:", error);
            // Return a mock task for now since we can't persist to static array
            return {
                _id: `mock-task-${Date.now()}`,
                deadline: task.deadline || new Date().toISOString(),
                topic: task.topic || "General",
                title: task.title || "New Task",
                status: task.status || "pending",
                points: task.points || 0,
                textbook: task.textbook || null,
                class: task.class || "",
            };
        }
    },
};

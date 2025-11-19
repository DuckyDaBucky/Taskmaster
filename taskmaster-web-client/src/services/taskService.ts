import { apiClient } from "./apiService";
import { Task } from "../database/tasksDB";

export const taskService = {
    getTasks: async (): Promise<Task[]> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.get<Task[]>("/tasks");
        return response.data;
    },

    getTasksByClassId: async (classId: string): Promise<Task[]> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.get<Task[]>(`/tasks/class/${classId}`);
        return response.data;
    },

    createTask: async (task: Partial<Task>): Promise<Task> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.post<Task>("/tasks", task);
        return response.data;
    },
};

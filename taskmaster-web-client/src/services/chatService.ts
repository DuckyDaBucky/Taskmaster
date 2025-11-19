import { apiClient } from "./apiService";
import { Message } from "../database/messagesDB";
import { Friend } from "../database/friendsDB";

export const chatService = {
    getMessages: async (userId: string): Promise<Message[]> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.get<Message[]>(`/messages/${userId}`);
        return response.data;
    },

    sendMessage: async (message: Partial<Message>): Promise<Message> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.post<Message>("/messages", message);
        return response.data;
    },

    getFriends: async (userId: string): Promise<Friend[]> => {
        // Use apiClient which has token injection and 401 handling
        const response = await apiClient.get<Friend[]>(`/friends/${userId}`);
        return response.data;
    },
};

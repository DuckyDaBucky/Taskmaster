import axios from "axios";
import { MESSAGES, Message } from "../database/messagesDB";
import { FRIENDS, Friend } from "../database/friendsDB";

const API_URL = "http://localhost:5000";

export const chatService = {
    getMessages: async (userId: string): Promise<Message[]> => {
        try {
            const response = await axios.get<Message[]>(`${API_URL}/messages/${userId}`);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static data:", error);
            return MESSAGES.filter(
                (msg) => msg.senderId === userId || msg.receiverId === userId
            );
        }
    },

    sendMessage: async (message: Partial<Message>): Promise<Message> => {
        try {
            const response = await axios.post<Message>(`${API_URL}/messages`, message);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static mock:", error);
            return {
                id: `mock-msg-${Date.now()}`,
                senderId: message.senderId || "",
                receiverId: message.receiverId || "",
                content: message.content || "",
                timestamp: new Date().toISOString(),
                isRead: false,
            };
        }
    },

    getFriends: async (userId: string): Promise<Friend[]> => {
        try {
            const response = await axios.get<Friend[]>(`${API_URL}/friends/${userId}`);
            return response.data;
        } catch (error) {
            console.warn("Backend failed, falling back to static data:", error);
            // In a real app we might filter by userId if the static list was huge
            // For now, return all friends as if they are friends of the current user
            return FRIENDS;
        }
    },
};

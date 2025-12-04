import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";

export interface EventData {
  title: string;
  start: Date | string;
  end: Date | string;
  taskInput?: string;
  classInput?: string;
  repeatWeekly?: boolean;
  notes?: string[];
  color?: string;
}

export const eventService = {
  async createEvent(eventData: EventData, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { id: `event-${Date.now()}`, ...eventData };
    }

    const payload = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
    };

    const response = await apiClient.post("/event", payload, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getEvents(userId: string, token?: string): Promise<any[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get(`/event/getAllEvents/${userId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async updateEvent(eventId: string, eventData: Partial<EventData>, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { id: eventId, ...eventData };
    }

    const payload = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
    };

    const response = await apiClient.post(`/event/editEvent/${eventId}`, payload, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async deleteEvent(eventId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await apiClient.get(`/event/deleteEvent/${eventId}`, {
      headers: { "x-auth-token": authToken },
    });
  },
};


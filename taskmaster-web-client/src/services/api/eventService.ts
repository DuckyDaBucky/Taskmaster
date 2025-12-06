import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";

export interface EventData {
  title: string;
  start: Date | string;
  end: Date | string;
  description?: string;
  location?: string;
  classInput?: string;
  repeatWeekly?: boolean;
  color?: string;
}

export const eventService = {
  async createEvent(eventData: EventData): Promise<any> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        start_time: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
        end_time: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
        description: eventData.description || null,
        location: eventData.location || null,
        class_id: eventData.classInput || null,
        recurrence: eventData.repeatWeekly ? 'weekly' : null,
        color: eventData.color || '#6B6BFF',
        user_id: userId,
      })
      .select('id, title, start_time, end_time, description, location, class_id, recurrence, color')
      .single();

    if (error) throw new Error(error.message);

    return {
      _id: data.id,
      id: data.id,
      title: data.title,
      start: new Date(data.start_time),
      end: data.end_time ? new Date(data.end_time) : new Date(data.start_time),
      description: data.description,
      location: data.location,
      color: data.color,
    };
  },

  async getEvents(): Promise<any[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('events')
      .select('id, title, start_time, end_time, description, location, class_id, recurrence, color')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data || []).map(event => ({
      _id: event.id,
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: event.end_time ? new Date(event.end_time) : new Date(event.start_time),
      description: event.description,
      location: event.location,
      color: event.color,
    }));
  },

  async updateEvent(eventId: string, eventData: Partial<EventData>): Promise<any> {
    const userId = await getCachedUserId();

    const updateData: any = {};
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.start !== undefined) {
      updateData.start_time = eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start;
    }
    if (eventData.end !== undefined) {
      updateData.end_time = eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end;
    }
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.classInput !== undefined) updateData.class_id = eventData.classInput;
    if (eventData.repeatWeekly !== undefined) updateData.recurrence = eventData.repeatWeekly ? 'weekly' : null;
    if (eventData.color !== undefined) updateData.color = eventData.color;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select('id, title, start_time, end_time, description, location, class_id, recurrence, color')
      .single();

    if (error) throw new Error(error.message);

    return {
      _id: data.id,
      id: data.id,
      title: data.title,
      start: new Date(data.start_time),
      end: data.end_time ? new Date(data.end_time) : new Date(data.start_time),
      description: data.description,
      location: data.location,
      color: data.color,
    };
  },

  async deleteEvent(eventId: string): Promise<void> {
    const userId = await getCachedUserId();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },
};

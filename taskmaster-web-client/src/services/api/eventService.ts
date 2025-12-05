import { supabase } from "../../lib/supabase";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        start_time: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
        end_time: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
        description: eventData.notes?.[0] || null,
        class_id: eventData.classInput || null,
        recurrence: eventData.repeatWeekly ? 'weekly' : null,
        color: eventData.color || '#6B6BFF',
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'event_created',
      description: `Created event: ${eventData.title}`,
      metadata: { eventId: data.id },
    }).then(() => {}).catch(console.warn);

    return {
      ...data,
      start: data.start_time,
      end: data.end_time,
    };
  },

  async getEvents(userId: string, token?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(event => ({
      ...event,
      _id: event.id,
      start: new Date(event.start_time),
      end: event.end_time ? new Date(event.end_time) : new Date(event.start_time),
      notes: event.description ? [event.description] : [],
    }));
  },

  async updateEvent(eventId: string, eventData: Partial<EventData>, token?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: any = {};
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.start !== undefined) {
      updateData.start_time = eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start;
    }
    if (eventData.end !== undefined) {
      updateData.end_time = eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end;
    }
    if (eventData.classInput !== undefined) updateData.class_id = eventData.classInput;
    if (eventData.repeatWeekly !== undefined) updateData.recurrence = eventData.repeatWeekly ? 'weekly' : null;
    if (eventData.notes !== undefined) updateData.description = eventData.notes?.[0] || null;
    if (eventData.color !== undefined) updateData.color = eventData.color;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'event_updated',
      description: `Updated event: ${data.title}`,
      metadata: { eventId: data.id },
    }).then(() => {}).catch(console.warn);

    return {
      ...data,
      _id: data.id,
      start: new Date(data.start_time),
      end: data.end_time ? new Date(data.end_time) : new Date(data.start_time),
    };
  },

  async deleteEvent(eventId: string, token?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  },
};

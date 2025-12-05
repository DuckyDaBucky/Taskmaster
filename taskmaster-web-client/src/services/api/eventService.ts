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
        start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
        end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
        task_id: eventData.taskInput || null,
        course_id: eventData.classInput || null,
        repeat_weekly: eventData.repeatWeekly || false,
        notes: eventData.notes || [],
        color: eventData.color || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'event_created',
      description: `Created event: ${eventData.title}`,
      metadata: { eventId: data.id },
    });

    return data;
  },

  async getEvents(userId: string, token?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('start', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  },

  async updateEvent(eventId: string, eventData: Partial<EventData>, token?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: any = {};
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.start !== undefined) {
      updateData.start = eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start;
    }
    if (eventData.end !== undefined) {
      updateData.end = eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end;
    }
    if (eventData.taskInput !== undefined) updateData.task_id = eventData.taskInput;
    if (eventData.classInput !== undefined) updateData.course_id = eventData.classInput;
    if (eventData.repeatWeekly !== undefined) updateData.repeat_weekly = eventData.repeatWeekly;
    if (eventData.notes !== undefined) updateData.notes = eventData.notes;
    if (eventData.color !== undefined) updateData.color = eventData.color;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'event_updated',
      description: `Updated event: ${data.title}`,
      metadata: { eventId: data.id },
    });

    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
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

import { supabase } from "../../lib/supabase";
import type { TasksData } from "../types";

export const taskService = {
  async getAllTasks(token?: string): Promise<TasksData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('tasks')
      .select('*, class:classes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    return (data || []).map(task => ({
      _id: task.id,
      title: task.title || '',
      topic: task.topic || '',
      description: task.description,
      status: task.status as 'pending' | 'completed' | 'overdue',
      points: task.points || 0,
      taskType: task.task_type || '',
      deadline: task.deadline || undefined,
      earnedPoints: task.earned_points || 0,
      completed: task.completed || false,
      textbook: task.textbook || '',
      class: task.class_id || undefined,
      classData: task.class ? {
        _id: task.class.id,
        name: task.class.name || '',
      } : undefined,
    }));
  },

  async getTasksByClassId(classId: string, token?: string): Promise<TasksData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('tasks')
      .select('*, class:classes(*)')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    return (data || []).map(task => ({
      _id: task.id,
      title: task.title || '',
      topic: task.topic || '',
      description: task.description,
      status: task.status as 'pending' | 'completed' | 'overdue',
      points: task.points || 0,
      taskType: task.task_type || '',
      deadline: task.deadline || undefined,
      earnedPoints: task.earned_points || 0,
      completed: task.completed || false,
      textbook: task.textbook || '',
      class: task.class_id || undefined,
      classData: task.class ? {
        _id: task.class.id,
        name: task.class.name || '',
      } : undefined,
    }));
  },

  async createTask(
    classId: string | null,
    taskData: {
      title: string;
      deadline?: string;
      topic?: string;
      status?: "pending" | "completed" | "overdue";
      points?: number;
      textbook?: string;
    },
    token?: string
  ): Promise<TasksData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        topic: taskData.topic || null,
        status: taskData.status || 'pending',
        points: taskData.points || null,
        deadline: taskData.deadline || null,
        textbook: taskData.textbook || null,
        class_id: classId || null,
        user_id: user.id,
        completed: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'task_created',
      description: `Created task: ${taskData.title}`,
      metadata: { taskId: data.id },
    }).then(() => {}).catch(() => {});

    return {
      _id: data.id,
      title: data.title || '',
      topic: data.topic || '',
      description: data.description,
      status: data.status as 'pending' | 'completed' | 'overdue',
      points: data.points || 0,
      taskType: data.task_type || '',
      deadline: data.deadline || undefined,
      earnedPoints: data.earned_points || 0,
      completed: data.completed || false,
      textbook: data.textbook || '',
      class: data.class_id || undefined,
    };
  },

  async updateTask(taskId: string, updates: Partial<TasksData>, token?: string): Promise<TasksData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.topic !== undefined) updateData.topic = updates.topic;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.points !== undefined) updateData.points = updates.points;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.textbook !== undefined) updateData.textbook = updates.textbook;
    if (updates.completed !== undefined) updateData.completed = updates.completed;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'task_updated',
      description: `Updated task: ${data.title}`,
      metadata: { taskId: data.id },
    }).then(() => {}).catch(() => {});

    return {
      _id: data.id,
      title: data.title || '',
      topic: data.topic || '',
      description: data.description,
      status: data.status as 'pending' | 'completed' | 'overdue',
      points: data.points || 0,
      taskType: data.task_type || '',
      deadline: data.deadline || undefined,
      earnedPoints: data.earned_points || 0,
      completed: data.completed || false,
      textbook: data.textbook || '',
      class: data.class_id || undefined,
    };
  },

  async deleteTask(taskId: string, token?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  },
};

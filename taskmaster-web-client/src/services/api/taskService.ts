import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { TasksData } from "../types";

export const taskService = {
  async getAllTasks(): Promise<TasksData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, topic, description, status, points, task_type, deadline, earned_points, completed, textbook, class_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

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
    }));
  },

  async getTasksByClassId(classId: string): Promise<TasksData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, topic, description, status, points, task_type, deadline, earned_points, completed, textbook, class_id')
      .eq('user_id', userId)
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
    }));
  },

  async createTask(classId: string | null, taskData: {
    title: string;
    deadline?: string;
    topic?: string;
    status?: "pending" | "completed" | "overdue";
    points?: number;
    textbook?: string;
  }): Promise<TasksData> {
    const userId = await getCachedUserId();

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
        user_id: userId,
        completed: false,
      })
      .select('id, title, topic, description, status, points, task_type, deadline, earned_points, completed, textbook, class_id')
      .single();

    if (error) throw new Error(error.message);

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

  async updateTask(taskId: string, updates: Partial<TasksData>): Promise<TasksData> {
    const userId = await getCachedUserId();

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
      .eq('user_id', userId)
      .select('id, title, topic, description, status, points, task_type, deadline, earned_points, completed, textbook, class_id')
      .single();

    if (error) throw new Error(error.message);

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

  async deleteTask(taskId: string): Promise<void> {
    const userId = await getCachedUserId();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },
};

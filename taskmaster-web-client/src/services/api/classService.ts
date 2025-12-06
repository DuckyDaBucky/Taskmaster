import { supabase } from "../../lib/supabase";
import type { ClassData } from "../types";

export const classService = {
  async getAllClasses(token?: string): Promise<ClassData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(cls => ({
      _id: cls.id,
      name: cls.name || '',
      professor: cls.professor || '',
      timing: cls.timing || '',
      examDates: cls.exam_dates?.map((d: string) => new Date(d)) || [],
      topics: cls.topics || [],
      gradingPolicy: cls.grading_policy || '',
      contactInfo: cls.contact_info || '',
      textbooks: cls.textbooks || [],
      location: cls.location || '',
      description: cls.description,
      isPersonal: cls.is_personal || false,
    }));
  },

  async getClassesByUserId(userId: string, token?: string): Promise<ClassData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(cls => ({
      _id: cls.id,
      name: cls.name || '',
      professor: cls.professor || '',
      timing: cls.timing || '',
      examDates: cls.exam_dates?.map((d: string) => new Date(d)) || [],
      topics: cls.topics || [],
      gradingPolicy: cls.grading_policy || '',
      contactInfo: cls.contact_info || '',
      textbooks: cls.textbooks || [],
      location: cls.location || '',
      description: cls.description,
      isPersonal: cls.is_personal || false,
    }));
  },

  async getPersonalClassId(token?: string): Promise<{ personalClassId: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_personal', true)
      .single();

    if (error) throw new Error(error.message || "Personal class not found");

    return { personalClassId: data.id };
  },

  async createClass(
    classData: {
      name: string;
      professor?: string;
      timing?: string;
      location?: string;
      topics?: string[];
      textbooks?: string[];
      gradingPolicy?: string;
      contactInfo?: string;
    },
    token?: string
  ): Promise<ClassData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: classData.name,
        professor: classData.professor || null,
        timing: classData.timing || null,
        location: classData.location || null,
        topics: classData.topics || [],
        textbooks: classData.textbooks || [],
        grading_policy: classData.gradingPolicy || null,
        contact_info: classData.contactInfo || null,
        user_id: user.id,
        is_personal: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'class_created',
      description: `Created class: ${classData.name}`,
      metadata: { classId: data.id },
    }).then(() => {}).catch(() => {});

    return {
      _id: data.id,
      name: data.name || '',
      professor: data.professor || '',
      timing: data.timing || '',
      examDates: data.exam_dates?.map((d: string) => new Date(d)) || [],
      topics: data.topics || [],
      gradingPolicy: data.grading_policy || '',
      contactInfo: data.contact_info || '',
      textbooks: data.textbooks || [],
      location: data.location || '',
      description: data.description,
      isPersonal: data.is_personal || false,
    };
  },

  async updateClass(
    classId: string,
    classData: {
      name?: string;
      professor?: string;
      timing?: string;
      location?: string;
      topics?: string[];
      textbooks?: string[];
      gradingPolicy?: string;
      contactInfo?: string;
    },
    token?: string
  ): Promise<ClassData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: any = {};
    if (classData.name !== undefined) updateData.name = classData.name;
    if (classData.professor !== undefined) updateData.professor = classData.professor;
    if (classData.timing !== undefined) updateData.timing = classData.timing;
    if (classData.location !== undefined) updateData.location = classData.location;
    if (classData.topics !== undefined) updateData.topics = classData.topics;
    if (classData.textbooks !== undefined) updateData.textbooks = classData.textbooks;
    if (classData.gradingPolicy !== undefined) updateData.grading_policy = classData.gradingPolicy;
    if (classData.contactInfo !== undefined) updateData.contact_info = classData.contactInfo;

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity (non-blocking)
    supabase.from('activities').insert({
      user_id: user.id,
      type: 'class_updated',
      description: `Updated class: ${data.name}`,
      metadata: { classId: data.id },
    }).then(() => {}).catch(() => {});

    return {
      _id: data.id,
      name: data.name || '',
      professor: data.professor || '',
      timing: data.timing || '',
      examDates: data.exam_dates?.map((d: string) => new Date(d)) || [],
      topics: data.topics || [],
      gradingPolicy: data.grading_policy || '',
      contactInfo: data.contact_info || '',
      textbooks: data.textbooks || [],
      location: data.location || '',
      description: data.description,
      isPersonal: data.is_personal || false,
    };
  },

  async deleteClass(classId: string, token?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  },

  async uploadSyllabus(userId: string, file: File, token?: string): Promise<{ message: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/syllabus-${Date.now()}.${fileExt}`;
    const filePath = `syllabi/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('syllabi')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    return { message: "Syllabus uploaded successfully" };
  },
};

import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { ClassData } from "../types";

export const classService = {
  async getAllClasses(): Promise<ClassData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('classes')
      .select('id, name, professor, timing, exam_dates, topics, grading_policy, contact_info, textbooks, location, description, is_personal')
      .eq('user_id', userId)
      .order('is_personal', { ascending: false })
      .order('name', { ascending: true });

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

  async getClassesByUserId(userId: string): Promise<ClassData[]> {
    // Use provided userId instead of cached one (for viewing other users' classes)
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, professor, timing, exam_dates, topics, grading_policy, contact_info, textbooks, location, description, is_personal')
      .eq('user_id', userId)
      .order('name', { ascending: true });

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

  async getPersonalClassId(): Promise<{ personalClassId: string }> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .eq('user_id', userId)
      .eq('is_personal', true)
      .limit(1)
      .single();

    if (error) throw new Error(error.message || "Personal class not found");

    return { personalClassId: data.id };
  },

  async createClass(classData: {
    name: string;
    professor?: string;
    timing?: string;
    location?: string;
    topics?: string[];
    textbooks?: string[];
    gradingPolicy?: string;
    contactInfo?: string;
  }): Promise<ClassData> {
    const userId = await getCachedUserId();

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
        user_id: userId,
        is_personal: false,
      })
      .select('id, name, professor, timing, exam_dates, topics, grading_policy, contact_info, textbooks, location, description, is_personal')
      .single();

    if (error) throw new Error(error.message);

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

  async updateClass(classId: string, classData: {
    name?: string;
    professor?: string;
    timing?: string;
    location?: string;
    topics?: string[];
    textbooks?: string[];
    gradingPolicy?: string;
    contactInfo?: string;
  }): Promise<ClassData> {
    const userId = await getCachedUserId();

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
      .eq('user_id', userId)
      .select('id, name, professor, timing, exam_dates, topics, grading_policy, contact_info, textbooks, location, description, is_personal')
      .single();

    if (error) throw new Error(error.message);

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

  async deleteClass(classId: string): Promise<void> {
    const userId = await getCachedUserId();

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async uploadSyllabus(userId: string, file: File): Promise<{ message: string }> {
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

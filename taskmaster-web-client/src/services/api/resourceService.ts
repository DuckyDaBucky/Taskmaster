import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { ResourceData } from "../types";

export const resourceService = {
  async getAllResources(): Promise<ResourceData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('resources')
      .select('id, title, urls, websites, files, summary, description, class_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data || []).map(resource => ({
      _id: resource.id,
      title: resource.title || '',
      urls: resource.urls || [],
      websites: resource.websites || [],
      files: resource.files || [],
      summary: resource.summary,
      description: resource.description,
      class: resource.class_id || undefined,
    }));
  },

  async getResourcesByClassId(classId: string): Promise<ResourceData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('resources')
      .select('id, title, urls, websites, files, summary, description, class_id')
      .eq('user_id', userId)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(resource => ({
      _id: resource.id,
      title: resource.title || '',
      urls: resource.urls || [],
      websites: resource.websites || [],
      files: resource.files || [],
      summary: resource.summary,
      description: resource.description,
      class: resource.class_id || undefined,
    }));
  },

  async createResource(
    classId: string | null,
    resourceData: { urls?: string[]; websites?: string[]; title?: string }
  ): Promise<ResourceData> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: resourceData.title || 'Untitled Resource',
        urls: resourceData.urls || [],
        websites: resourceData.websites || [],
        files: [],
        class_id: classId || null,
        user_id: userId,
      })
      .select('id, title, urls, websites, files, summary, description, class_id')
      .single();

    if (error) throw new Error(error.message);

    return {
      _id: data.id,
      title: data.title || '',
      urls: data.urls || [],
      websites: data.websites || [],
      files: data.files || [],
      summary: data.summary,
      description: data.description,
      class: data.class_id || undefined,
    };
  },

  async smartUploadResource(file: File): Promise<any> {
    const userId = await getCachedUserId();

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    const fileRecord = {
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: filePath,
      url: urlData.publicUrl,
    };

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title: file.name,
        files: [fileRecord],
        class_id: null,
        user_id: userId,
      })
      .select('id, title, urls, websites, files, summary, description, class_id')
      .single();

    if (resourceError) {
      await supabase.storage.from('resources').remove([filePath]);
      throw new Error(resourceError.message);
    }

    return resource;
  },
};

import { supabase } from "../../lib/supabase";
import type { ResourceData } from "../types";

export const resourceService = {
  async getAllResources(token?: string): Promise<ResourceData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get resources for user's classes OR personal resources (class_id is null)
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('user_id', user.id);

    const classIds = classes?.map(c => c.id) || [];

    const { data, error } = await supabase
      .from('resources')
      .select('*, class:classes(*)')
      .or(`class_id.in.(${classIds.join(',')}),and(class_id.is.null,user_id.eq.${user.id})`)
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
      classData: resource.class ? {
        _id: resource.class.id,
        name: resource.class.name || '',
      } : undefined,
    }));
  },

  async getResourcesByClassId(classId: string, token?: string): Promise<ResourceData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('resources')
      .select('*, class:classes(*)')
      .eq('user_id', user.id)
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
      classData: resource.class ? {
        _id: resource.class.id,
        name: resource.class.name || '',
      } : undefined,
    }));
  },

  async createResource(
    classId: string | null,
    resourceData: { urls?: string[]; websites?: string[]; title?: string },
    token?: string
  ): Promise<ResourceData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: resourceData.title || 'Untitled Resource',
        urls: resourceData.urls || [],
        websites: resourceData.websites || [],
        files: [],
        class_id: classId || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'resource_added',
      description: `Added resource: ${data.title}`,
      metadata: { resourceId: data.id },
    });

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

  async smartUploadResource(file: File, token?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    // Upload to Supabase Storage bucket 'resources'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Create resource record in database
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
        class_id: null, // Personal resource
        user_id: user.id,
      })
      .select()
      .single();

    if (resourceError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('resources').remove([filePath]);
      throw new Error(resourceError.message);
    }

    // Create activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'resource_added',
      description: `Uploaded resource: ${file.name}`,
      metadata: { resourceId: resource.id },
    });

    return resource;
  },
};

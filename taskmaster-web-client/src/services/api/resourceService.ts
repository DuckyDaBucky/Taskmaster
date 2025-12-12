import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { ResourceData } from "../types";

export const resourceService = {
  async getAllResources(): Promise<ResourceData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('resources')
      .select('id, title, urls, websites, files, summary, description, class_id, processing_status')
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
      processing_status: resource.processing_status,
    }));
  },

  async getResourcesByClassId(classId: string): Promise<ResourceData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('resources')
      .select('id, title, urls, websites, files, summary, description, class_id, processing_status, classification')
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
      processing_status: resource.processing_status,
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
      .select('id, title, urls, websites, files, summary, description, class_id, classification')
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

  /**
   * Upload a file and trigger document processing for RAG + Nebula verification
   */
  async smartUploadResource(file: File, classId?: string): Promise<any> {
    const userId = await getCachedUserId();
    console.log("smartUploadResource:", file.name);

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(fileName);

    const fileRecord = {
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: fileName,
      url: urlData.publicUrl,
    };

    // 3. Create resource record (trigger will auto-extract course number)
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title: file.name,
        files: [fileRecord],
        class_id: classId || null,
        user_id: userId,
        processing_status: 'pending',
      })
      .select('id, title, urls, websites, files, summary, description, class_id, processing_status, classification, verified_course_number, verification_status')
      .single();

    if (resourceError) {
      await supabase.storage.from('resources').remove([fileName]);
      throw new Error(resourceError.message);
    }

    // 4. Trigger document processing (non-blocking)
    resourceService.triggerProcessing(resource.id, userId, urlData.publicUrl, classId).catch(e => {
      console.error("Processing trigger failed:", e);
    });

    // 5. Verify with Nebula if it looks like a syllabus (non-blocking)
    const isSyllabus = file.name.toLowerCase().includes('syllabus') || 
                       file.name.toLowerCase().includes('sylabi');
    if (isSyllabus || resource.verified_course_number) {
      import('../syllabusService').then(({ syllabusService }) => {
        syllabusService.verifySyllabus(resource.id, file.name).then(result => {
          if (result.verified) {
            console.log(`✅ Syllabus verified: ${result.courseNumber}`, result.nebulaData?.title);
          } else {
            // Note: Not setting processing_status='failed' here
            // Verification can be 'manual' (course not in Nebula yet) but file is fine
            // Only document processing errors should set processing_status='failed'
            console.log(`📝 Syllabus: ${result.error}`);
          }
        });
      });
    }

    // 6. Log activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'resource_uploaded',
      description: `Uploaded ${file.name}`,
      metadata: { resourceId: resource.id, fileName: file.name }
    });

    return resource;
  },

  /**
   * Trigger document processing API
   */
  async triggerProcessing(resourceId: string, userId: string, fileUrl: string, classId?: string): Promise<void> {
    try {
      const response = await fetch('/api/process/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resourceId,
          user_id: userId,
          file_url: fileUrl,
          class_id: classId,
          document_type: 'other',
        }),
      });

      if (!response.ok) {
        // Mark as failed so user can delete
        await supabase
          .from('resources')
          .update({ processing_status: 'failed' })
          .eq('id', resourceId);
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.error("Processing failed:", data.error);
        } else {
          console.error("Processing failed with status:", response.status);
        }
      }
    } catch (e) {
      // Also mark as failed on network/exception errors
      await supabase
        .from('resources')
        .update({ processing_status: 'failed' })
        .eq('id', resourceId);
      
      console.error("Processing request failed:", e);
      // Don't throw - processing is background task, shouldn't fail upload
    }
  },

  /**
   * Delete a resource (handles archiving if user allows)
   */
  async deleteResource(resourceId: string): Promise<void> {
    const userId = await getCachedUserId();

    // Get resource info first
    const { data: resource } = await supabase
      .from('resources')
      .select('files')
      .eq('id', resourceId)
      .eq('user_id', userId)
      .single();

    // Archive chunks if user allows (handled by DB function)
    await supabase.rpc('archive_user_chunks', {
      p_resource_id: resourceId,
      p_user_id: userId,
    });

    // Delete storage files
    if (resource?.files?.length) {
      const paths = resource.files.map((f: any) => f.path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from('resources').remove(paths);
      }
    }

    // Delete resource record
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },
};

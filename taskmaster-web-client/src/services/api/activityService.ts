import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";

export const activityService = {
  async getActivities(limit: number = 20): Promise<any[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('activities')
      .select('id, type, description, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map(activity => ({
      _id: activity.id,
      type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.created_at,
    }));
  },
};

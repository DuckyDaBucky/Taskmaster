import { supabase } from "../../lib/supabase";

export const activityService = {
  async getActivities(limit: number = 20, token?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map(activity => ({
      _id: activity.id,
      type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
    }));
  },
};

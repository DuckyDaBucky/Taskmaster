import { supabase } from "../../lib/supabase";
import type { UserData } from "../types";

export const userService = {
  async addHamizAsFriend(token?: string): Promise<any> {
    // This is a specific feature - you may want to implement friend system
    // For now, return success message
    return { message: "Hamiz Iqbal added as friend successfully" };
  },

  async getFriends(_userId?: string, token?: string): Promise<UserData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get user's friends list from users table
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('friends_list')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile || !userProfile.friends_list || userProfile.friends_list.length === 0) {
      return [];
    }

    // Get friend profiles
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('*')
      .in('id', userProfile.friends_list);

    if (friendsError) throw new Error(friendsError.message);

    return (friends || []).map(friend => ({
      _id: friend.id,
      firstName: friend.first_name,
      lastName: friend.last_name,
      email: friend.email,
      username: friend.user_name,
      userName: friend.user_name,
      profileImageUrl: friend.pfp || undefined,
      preferences: {
        personality: friend.personality || 0,
        time: friend.time_preference || 0,
        inPerson: friend.in_person || 0,
        privateSpace: friend.private_space || 0,
      },
      points: friend.points || 0,
      streak: friend.streak || 0,
      level: friend.level || 1,
    }));
  },
};

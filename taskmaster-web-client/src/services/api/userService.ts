import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { UserData } from "../types";

export const userService = {
  async addHamizAsFriend(): Promise<any> {
    return { message: "Hamiz Iqbal added as friend successfully" };
  },

  async getFriends(): Promise<UserData[]> {
    const userId = await getCachedUserId();

    // Get user's friends list from users table
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('friends_list')
      .eq('id', userId)
      .single();

    if (userError || !userProfile || !userProfile.friends_list || userProfile.friends_list.length === 0) {
      return [];
    }

    // Get friend profiles
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, user_name, display_name, pfp, personality, time_preference, in_person, private_space, points, streak, level')
      .in('id', userProfile.friends_list);

    if (friendsError) throw new Error(friendsError.message);

    return (friends || []).map(friend => ({
      _id: friend.id,
      firstName: friend.first_name,
      lastName: friend.last_name,
      email: friend.email,
      username: friend.display_name || friend.user_name,
      displayName: friend.display_name || friend.user_name,
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

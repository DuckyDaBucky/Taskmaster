import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { UserData } from "../types";

function updateYear(
  highYear: number,
  lowYear: number,
  updatedHigh: boolean
): { highYear: number; lowYear: number; noChange: boolean } {
  if (updatedHigh) {
    if (lowYear > 1) {
      return { highYear, lowYear: lowYear - 1, noChange: false };
    }

    if (highYear < 4) {
      return { highYear: highYear + 1, lowYear, noChange: false };
    }
  }

  if (highYear < 4) {
    return { highYear: highYear + 1, lowYear, noChange: false };
  }

  if (lowYear > 1) {
    return { highYear, lowYear: lowYear - 1, noChange: false };
  }

  return { highYear, lowYear, noChange: true };
}

async function findQueries(
  lowYear: number,
  highYear: number,
  filters: Record<string, any>,
  userId: string
): Promise<{ users: UserData[]; count: number }> {
  let query = supabase
    .from("users")
    .select("*")
    .gte("year", lowYear.toString())
    .lte("year", highYear.toString())
    .neq("_id", userId);

  for (const [key, value] of Object.entries(filters)) {
    if (value?.nin) {
      query = query.not(key, "in", `(${value.nin.join(",")})`);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query;

  if (error || !data) return { users: [], count: 0 };
  return { users: data as UserData[], count: data.length };
}

async function findSortYears(
  targetUser: UserData,
  filters: Record<string, any>
): Promise<UserData[]> {
  const startYear = parseInt(targetUser.year || "1", 10);

  let highYear = startYear;
  let lowYear = startYear;

  let { users, count } = await findQueries(lowYear, highYear, filters, targetUser._id);

  let updatedHigh = false;

  while (count < 20) {
    updatedHigh = !updatedHigh;

    const result = updateYear(highYear, lowYear, updatedHigh);
    highYear = result.highYear;
    lowYear = result.lowYear;

    if (result.noChange) break;

    const res = await findQueries(lowYear, highYear, filters, targetUser._id);
    users = res.users;
    count = res.count;
  }

  return users.sort(() => Math.random() - 0.5).slice(0, 19);
}


export const userService = {
  async addHamizAsFriend(): Promise<any> {
    return { message: "Hamiz Iqbal added as friend successfully" };
  },

  async findUsers(userId: string): Promise<{ users: string[] }> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("_id", userId)
      .single();

    if (error || !data) return { users: [] };

    const targetUser = data as UserData;

    if (!targetUser.preferences) {
      return { users: [] };
    }

    const { searchLevel, section, course } = targetUser.preferences;

    let querySearchLevel: Record<string, any> = {};

    switch (searchLevel) {
      case "section":
        querySearchLevel["preferences->section"] = section;
        break;
      case "course":
        querySearchLevel["preferences->course"] = course;
        break;
      case "major":
        querySearchLevel["major"] = targetUser.major;
        break;
      case "school":
        querySearchLevel["school"] = targetUser.school;
        break;
    }

    const queryMatches = { friendsList: userId };
    const queryNotMatches = { friendsList: { nin: [userId] } };

    const matched = await findSortYears(targetUser, { ...querySearchLevel, ...queryMatches });
    const notMatched = await findSortYears(targetUser, { ...querySearchLevel, ...queryNotMatches });

    const combined = [...matched, ...notMatched];

    return {
      users: combined.map(u => u.displayName || u.username || u.name || "Unknown User")
    };
  },

  async matchFriends(userId: string): Promise<{ users: string[] }> {
    // Find users with similar preferences for friend matching
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('current_year, search_level, search_sections, search_courses, major, school')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return { users: [] };
    }

    const { data: matches, error: matchError } = await supabase
      .from('users')
      .select('display_name, user_name')
      .neq('id', userId)
      .limit(5);

    if (matchError || !matches) {
      return { users: [] };
    }

    return {
      users: matches.map(m => m.display_name || m.user_name || 'Unknown User')
    };
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
      .select('id, first_name, last_name, email, user_name, display_name, pfp, major, school, current_year, search_level, course, section, points, streak, level')
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
      major: friend.major,
      school: friend.school,
      year: friend.current_year,
      preferences: {
        searchLevel: friend.search_level,
        section: friend.section,
        course: friend.course,
      },
      points: friend.points || 0,
      streak: friend.streak || 0,
      level: friend.level || 1,
    }));
  },
};

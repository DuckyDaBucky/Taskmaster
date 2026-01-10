import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { UserData } from "../types";

function mapYearToNumber(year: string | number | null | undefined): string {
  if (!year) return "1";

  const yearStr = String(year).toLowerCase().trim();

  const yearMap: Record<string, string> = {
    freshman: "1",
    sophomore: "2",
    junior: "3",
    senior: "4",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
  };

  return yearMap[yearStr] || "1";
}

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
  console.log("🔍 findQueries called with:", { lowYear, highYear, filters, userId });

  let query = supabase
    .from("users")
    .select("*")
    .gte("current_year", lowYear.toString())
    .lte("current_year", highYear.toString())
    .neq("id", userId);

  for (const [key, value] of Object.entries(filters)) {
    if (value?.nin) {
      query = query.not(key, "in", `(${value.nin.join(",")})`);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query;

  console.log("📊 findQueries result:", { error, count: data?.length || 0, data });

  if (error || !data) {
    console.warn("⚠️ findQueries error or no data:", error);
    return { users: [], count: 0 };
  }
  return { users: data as UserData[], count: data.length };
}

async function findSortYears(
  targetUser: UserData,
  filters: Record<string, any>
): Promise<UserData[]> {
  console.log("📅 findSortYears called for user:", targetUser._id, "with filters:", filters);

  const startYear = parseInt(targetUser.year || "1", 10);
  console.log("📅 Start year:", startYear);

  let highYear = startYear;
  let lowYear = startYear;

  let { users, count } = await findQueries(lowYear, highYear, filters, targetUser._id);
  console.log(`📅 Initial query (year ${lowYear}-${highYear}): Found ${count} users`);

  let updatedHigh = false;

  while (count < 20) {
    updatedHigh = !updatedHigh;

    const result = updateYear(highYear, lowYear, updatedHigh);
    highYear = result.highYear;
    lowYear = result.lowYear;

    console.log(`📅 Expanding year range to ${lowYear}-${highYear}...`);

    if (result.noChange) {
      console.log("📅 Year range cannot expand further");
      break;
    }

    const res = await findQueries(lowYear, highYear, filters, targetUser._id);
    users = res.users;
    count = res.count;
    console.log(`📅 Expanded query (year ${lowYear}-${highYear}): Found ${count} users`);
  }

  console.log(`📅 findSortYears returning ${users.length} randomized users`);
  return users.sort(() => Math.random() - 0.5).slice(0, 19);
}

export const userService = {
  // ✅ FINISH THIS FUNCTION so it doesn't break the object literal
  async findUsers(
    userId: string
  ): Promise<{ users: { _id: string; displayName: string; requestSent?: boolean }[] }> {
    console.log("🎯 findUsers called for userId:", userId);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("❌ Error in findUsers:", error);
      return { users: [] };
    }

    // You didn't include the intended logic here, so returning empty list keeps behavior safe.
    return { users: [] };
  },

  async updatePoints(delta: number): Promise<number> {
    const userId = await getCachedUserId();

    const { data: current, error: fetchError } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const nextPoints = Math.max(0, (current?.points || 0) + delta);

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({ points: nextPoints })
      .eq("id", userId)
      .select("points")
      .single();

    if (updateError) throw new Error(updateError.message);

    return updated?.points ?? nextPoints;
  },

  // ✅ Return type updated to match what you actually return (array of user objects)
  async matchFriends(
    userId: string
  ): Promise<{
    users: {
      _id: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
      requestSent?: boolean;
    }[];
  }> {
    // Find users with similar preferences for friend matching
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("personality, time_preference, in_person, private_space")
      .eq("id", userId)
      .single();

    // ✅ fix bad variables: use currentUser/userError instead of data/error
    console.log("🔍 Query result:", { found: !!currentUser, error: userError, rawData: currentUser });

    if (userError) {
      console.error("❌ Error fetching user:", userError);
      return { users: [] };
    }

    if (!currentUser) {
      console.warn("⚠️ No user data found for userId:", userId);
      return { users: [] };
    }

    // ⚠️ Your code below references `data.*` heavily, which implies you meant to query `*`
    // If you truly only select those 4 fields above, mapping will fail at runtime.
    // Minimal safe fix: re-fetch full row exactly the way your mapping expects.
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Error fetching full user row:", error);
      return { users: [] };
    }

    if (!data) {
      console.warn("⚠️ No full user row found for userId:", userId);
      return { users: [] };
    }

    // Properly map database response to UserData
    const targetUser: UserData = {
      _id: data.id,
      name: data.name,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      username: data.display_name || data.user_name || "",
      displayName: data.display_name || data.user_name || "",
      profileImageUrl: data.pfp,
      major: data.major,
      school: data.school,
      year: mapYearToNumber(data.current_year),
      preferences: {
        searchLevel: data.search_level || "",
        section: data.section || "",
        course: data.search_course || "",
      },
      theme: data.theme,
      settings: data.settings,
      points: data.points || 0,
      streak: data.streak || 0,
      level: data.level || 1,
      password: data.password,
      friendsList: data.friends_list || [],
    };

    console.log("👤 Mapped target user:", {
      id: targetUser._id,
      name: targetUser.displayName,
      major: targetUser.major,
      school: targetUser.school,
      preferences: targetUser.preferences,
    });

    if (!targetUser.preferences || !targetUser.preferences.searchLevel) {
      console.warn("⚠️ No preferences or search level found for user");
      return { users: [] };
    }

    const { searchLevel, course } = targetUser.preferences;
    console.log("🔍 Search preferences:", { searchLevel, course });

    let querySearchLevel: Record<string, any> = {};
    const searchLevels: Array<"class" | "major" | "school"> = [];

    switch (searchLevel) {
      case "class":
        querySearchLevel["search_course"] = course;
        searchLevels.push("class", "major", "school");
        console.log("📚 Searching by class with course:", course);
        break;
      case "major":
        querySearchLevel["major"] = targetUser.major;
        searchLevels.push("major", "school", "class");
        console.log("🎓 Searching by major:", targetUser.major);
        break;
      case "school":
        querySearchLevel["school"] = targetUser.school;
        searchLevels.push("school", "major", "class");
        console.log("🏫 Searching by school:", targetUser.school);
        break;
      default:
        console.warn("⚠️ Unknown search level:", searchLevel);
        searchLevels.push("major", "school", "class");
    }

    console.log("🔎 Query filters:", querySearchLevel);

    const queryMatches = { friends_list: userId };
    const queryNotMatches = { friends_list: { nin: [userId] } };

    let matched = await findSortYears(targetUser, { ...querySearchLevel, ...queryMatches });
    let notMatched = await findSortYears(targetUser, { ...querySearchLevel, ...queryNotMatches });

    console.log(`✅ Matched users (${searchLevel}): ${matched.length}`);
    console.log(`✅ Not matched users (${searchLevel}): ${notMatched.length}`);

    let combined = [...matched, ...notMatched];

    // If no results, try fallback search levels
    if (combined.length === 0) {
      for (let i = 1; i < searchLevels.length; i++) {
        const fallbackLevel = searchLevels[i];
        console.log(`⚠️ No results for ${searchLevel}, trying ${fallbackLevel} as fallback...`);

        let fallbackFilters: Record<string, any> = {};

        switch (fallbackLevel) {
          case "class":
            fallbackFilters["search_course"] = course;
            break;
          case "major":
            fallbackFilters["major"] = targetUser.major;
            break;
          case "school":
            fallbackFilters["school"] = targetUser.school;
            break;
        }

        matched = await findSortYears(targetUser, { ...fallbackFilters, ...queryMatches });
        notMatched = await findSortYears(targetUser, { ...fallbackFilters, ...queryNotMatches });

        combined = [...matched, ...notMatched];
        console.log(`✅ Fallback search (${fallbackLevel}): ${combined.length} users found`);

        if (combined.length > 0) {
          console.log(`✅ Found results using ${fallbackLevel} fallback`);
          break;
        }
      }
    }

    // If still no results, search for ANY users regardless of search level
    if (combined.length === 0) {
      console.log("⚠️ No results from specific search levels, searching for ANY users...");
      matched = await findSortYears(targetUser, { ...queryMatches });
      notMatched = await findSortYears(targetUser, { ...queryNotMatches });
      combined = [...matched, ...notMatched];
      console.log(`✅ Unrestricted search: ${combined.length} users found`);
    }

    // If still no results, list EVERY user in the database with search level set
    if (combined.length === 0) {
      console.log("⚠️ No results from any search, fetching ALL users with search level from database...");
      try {
        const { data: allUsers, error } = await supabase.from("users").select("*");

        if (error) {
          console.error("❌ Error fetching all users:", error);
        } else if (allUsers && allUsers.length > 0) {
          combined = allUsers
            .filter((u: any) => u.id !== userId && u.search_level)
            .map((u: any) => ({
              _id: u.id,
              name: u.name,
              firstName: u.first_name || "",
              lastName: u.last_name || "",
              email: u.email || "",
              username: u.display_name || u.user_name || "",
              displayName: u.display_name || u.user_name || "",
              profileImageUrl: u.pfp,
              major: u.major,
              school: u.school,
              year: mapYearToNumber(u.current_year),
              preferences: {
                searchLevel: u.search_level || "",
                section: u.section || "",
                course: u.search_course || "",
              },
              theme: u.theme,
              settings: u.settings,
              points: u.points || 0,
              streak: u.streak || 0,
              level: u.level || 1,
              password: u.password,
              friendsList: u.friends_list || [],
            })) as any;
          console.log(`✅ Database dump (with search level set): ${combined.length} users found`);
        }
      } catch (err) {
        console.error("❌ Error in all users fallback:", err);
      }
    }

    console.log(`✅ Total results: ${combined.length}`);
    console.log("📋 Result names:", combined.map((u) => u.displayName || u.username || u.name || "Unknown User"));

    // Fetch current user's friends_list and outgoing_friend_requests to filter/flag results
    try {
      const { data: currentUserRow } = await supabase
        .from("users")
        .select("friends_list, outgoing_friend_requests")
        .eq("id", userId)
        .single();

      const friendsIds: string[] = Array.isArray(currentUserRow?.friends_list) ? currentUserRow.friends_list : [];
      const outgoingIds: string[] = Array.isArray(currentUserRow?.outgoing_friend_requests)
        ? currentUserRow.outgoing_friend_requests
        : [];

      const filtered = (combined || []).filter((u) => !friendsIds.includes(u._id) && !outgoingIds.includes(u._id));

      return {
        users: filtered.map((u) => ({
          _id: u._id,
          displayName: u.displayName || u.username || u.name || "Unknown User",
          firstName: (u as any).firstName || (u as any).first_name || "",
          lastName: (u as any).lastName || (u as any).last_name || "",
          username: (u as any).username || (u as any).user_name || "",
          profileImageUrl: (u as any).profileImageUrl || (u as any).pfp || undefined,
          requestSent: outgoingIds.includes(u._id),
        })),
      };
    } catch (err) {
      return {
        users: (combined || []).map((u) => ({
          _id: u._id,
          displayName: u.displayName || u.username || u.name || "Unknown User",
          firstName: (u as any).firstName || (u as any).first_name || "",
          lastName: (u as any).lastName || (u as any).last_name || "",
          username: (u as any).username || (u as any).user_name || "",
          profileImageUrl: (u as any).profileImageUrl || (u as any).pfp || undefined,
        })),
      };
    }
  },

  async getFriends(): Promise<UserData[]> {
    const userId = await getCachedUserId();

    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("friends_list")
      .eq("id", userId)
      .single();

    if (userError || !userProfile || !userProfile.friends_list || userProfile.friends_list.length === 0) {
      return [];
    }

    const { data: friends, error: friendsError } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, user_name, display_name, pfp, major, school, current_year, search_level, search_course, search_section, points, streak, level"
      )
      .in("id", userProfile.friends_list);

    if (friendsError) throw new Error(friendsError.message);

    return (friends || []).map((friend) => ({
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
        section: friend.search_section,
        course: friend.search_course,
      },
      points: friend.points || 0,
      streak: friend.streak || 0,
      level: friend.level || 1,
    }));
  },

  async setSearchLevel(searchLevel: "class" | "major" | "school", selectedCourse?: string): Promise<any> {
    const userId = await getCachedUserId();

    const updateData: any = { search_level: searchLevel };
    if (selectedCourse) {
      updateData.search_course = selectedCourse;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async sendFriendRequest(fromUserId: string, toUserId: string) {
    if (!fromUserId || !toUserId) {
      throw new Error("Invalid user ids for friend request");
    }

    const { data: fromUser, error: fromErr } = await supabase
      .from("users")
      .select("outgoing_friend_requests")
      .eq("id", fromUserId)
      .single();

    if (fromErr) throw new Error(fromErr.message);

    const outgoing: string[] = Array.isArray(fromUser?.outgoing_friend_requests) ? fromUser.outgoing_friend_requests : [];

    if (!outgoing.includes(toUserId)) {
      outgoing.push(toUserId);
      const { error: updateErr } = await supabase
        .from("users")
        .update({ outgoing_friend_requests: outgoing })
        .eq("id", fromUserId);

      if (updateErr) throw new Error(updateErr.message);
    }

    for (const recipientId of outgoing) {
      try {
        const { data: recipient, error: recErr } = await supabase
          .from("users")
          .select("incoming_friend_requests")
          .eq("id", recipientId)
          .single();

        if (recErr) continue;

        const incoming: string[] = Array.isArray(recipient?.incoming_friend_requests)
          ? recipient.incoming_friend_requests
          : [];

        if (!incoming.includes(fromUserId)) {
          incoming.push(fromUserId);
          await supabase.from("users").update({ incoming_friend_requests: incoming }).eq("id", recipientId);
        }
      } catch (err) {
        console.warn("Error updating recipient incoming requests", recipientId, err);
      }
    }

    return { success: true };
  },

  async getIncomingRequests(userId?: string) {
    const uid = userId || (await getCachedUserId());
    if (!uid) return [];

    const { data: user, error } = await supabase
      .from("users")
      .select("incoming_friend_requests")
      .eq("id", uid)
      .single();

    if (error) throw new Error(error.message);

    const incomingIds: string[] = Array.isArray(user?.incoming_friend_requests) ? user.incoming_friend_requests : [];
    if (incomingIds.length === 0) return [];

    const { data: senders, error: sendersErr } = await supabase
      .from("users")
      .select("id, first_name, last_name, display_name, user_name, pfp, email")
      .in("id", incomingIds);

    if (sendersErr) throw new Error(sendersErr.message);

    return (senders || []).map((s: any) => ({
      _id: s.id,
      displayName: s.display_name || s.user_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email,
      firstName: s.first_name || "",
      lastName: s.last_name || "",
      username: s.user_name || s.display_name || "",
      profileImageUrl: s.pfp,
    }));
  },

  async getOutgoingRequests(userId?: string) {
    const uid = userId || (await getCachedUserId());
    if (!uid) return [];

    const { data: user, error } = await supabase
      .from("users")
      .select("outgoing_friend_requests")
      .eq("id", uid)
      .single();

    if (error) throw new Error(error.message);

    const outgoingIds: string[] = Array.isArray(user?.outgoing_friend_requests) ? user.outgoing_friend_requests : [];
    if (outgoingIds.length === 0) return [];

    const { data: recipients, error: recErr } = await supabase
      .from("users")
      .select("id, first_name, last_name, display_name, user_name, pfp, email")
      .in("id", outgoingIds);

    if (recErr) throw new Error(recErr.message);

    return (recipients || []).map((s: any) => ({
      _id: s.id,
      displayName: s.display_name || s.user_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email,
      firstName: s.first_name || "",
      lastName: s.last_name || "",
      username: s.user_name || s.display_name || "",
      profileImageUrl: s.pfp,
    }));
  },

  async acceptFriendRequest(currentUserId?: string, fromUserId?: string) {
    const uid = currentUserId || (await getCachedUserId());
    if (!uid || !fromUserId) throw new Error("Invalid user ids for acceptFriendRequest");

    try {
      const { data: currentRow, error: curErr } = await supabase
        .from("users")
        .select("incoming_friend_requests, friends_list")
        .eq("id", uid)
        .single();

      if (curErr) throw curErr;

      const incoming: string[] = Array.isArray(currentRow?.incoming_friend_requests)
        ? currentRow.incoming_friend_requests
        : [];

      const newIncoming = incoming.filter((id: string) => id !== fromUserId);

      const currentFriends: string[] = Array.isArray(currentRow?.friends_list) ? currentRow.friends_list : [];
      const updatedCurrentFriends = currentFriends.includes(fromUserId) ? currentFriends : [...currentFriends, fromUserId];

      await supabase
        .from("users")
        .update({ incoming_friend_requests: newIncoming, friends_list: updatedCurrentFriends })
        .eq("id", uid);
    } catch (err) {
      console.warn("Error updating current user on acceptFriendRequest", err);
      throw err;
    }

    try {
      const { data: fromRow, error: fromErr } = await supabase
        .from("users")
        .select("outgoing_friend_requests, friends_list")
        .eq("id", fromUserId)
        .single();

      if (fromErr) throw fromErr;

      const outgoing: string[] = Array.isArray(fromRow?.outgoing_friend_requests) ? fromRow.outgoing_friend_requests : [];
      const newOutgoing = outgoing.filter((id: string) => id !== uid);

      const fromFriends: string[] = Array.isArray(fromRow?.friends_list) ? fromRow.friends_list : [];
      const updatedFromFriends = fromFriends.includes(uid) ? fromFriends : [...fromFriends, uid];

      await supabase
        .from("users")
        .update({ outgoing_friend_requests: newOutgoing, friends_list: updatedFromFriends })
        .eq("id", fromUserId);
    } catch (err) {
      console.warn("Error updating requester on acceptFriendRequest", err);
      throw err;
    }

    return { success: true };
  },
};

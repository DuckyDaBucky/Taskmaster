/**
 * Optimized Supabase Authentication Service
 * Uses Supabase's built-in session management and auth state
 */

import { supabase } from "../../lib/supabase";
import type { UserData } from "../types";

export const authService = {
  /**
   * Login with email or username and password
   * Supabase Auth uses email, so username is resolved to email first
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    let email = emailOrUsername;
    
    // If username provided, resolve it to email
    if (!isEmail) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('user_name', emailOrUsername)
        .single();
      
      if (userError || !userData) {
        throw new Error("Invalid username or password");
      }
      email = userData.email;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password");
    }

    if (!data.session) {
      throw new Error("Failed to create session");
    }

    // Update login streak and track login date
    await this.updateLoginStreak(data.user.id);
  },

  /**
   * Sign up a new user
   * Creates auth user and profile in a single transaction where possible
   */
  async signup(userData: {
    email: string;
    password: string;
    userName: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    // Check if username or email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, user_name, email')
      .or(`user_name.eq.${userData.userName},email.eq.${userData.email}`)
      .maybeSingle();

    if (existingUser) {
      throw new Error("Username or email is already taken");
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          user_name: userData.userName,
          first_name: userData.firstName,
          last_name: userData.lastName,
          display_name: userData.userName,
        },
      },
    });

    if (authError) {
      // Handle specific Supabase errors
      const errorMsg = authError.message?.toLowerCase() || "";
      
      if (errorMsg.includes("already") || errorMsg.includes("exists") || errorMsg.includes("registered")) {
        throw new Error("Username or email is already taken");
      }
      
      throw new Error(authError.message || "Failed to create account");
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // If email confirmation is required, session might be null
    if (!authData.session) {
      throw new Error("Please check your email to confirm your account");
    }

    // Create user profile in public.users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        user_name: userData.userName,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        streak: 0,
        points: 0,
        level: 1,
        role: 'user',
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      
      // Check if it's a unique constraint violation
      const errorCode = profileError.code;
      const errorMsg = (profileError.message || "").toLowerCase();
      
      if (errorCode === '23505' || 
          errorMsg.includes("unique") || 
          errorMsg.includes("duplicate") || 
          errorMsg.includes("already exists")) {
        throw new Error("Username or email is already taken");
      }
      
      // If profile creation fails but auth user exists, user can still log in
      // But we should throw an error to let them know something went wrong
      throw new Error("Account created but profile setup failed. Please contact support.");
    }

    // Create default "Personal" class
    const { error: classError } = await supabase
      .from('classes')
      .insert({
        name: "Personal",
        professor: "",
        timing: "",
        location: "",
        topics: [],
        textbooks: [],
        grading_policy: "",
        contact_info: "",
        user_id: authData.user.id,
        is_personal: true,
      });

    if (classError) {
      console.error("Failed to create personal class:", classError);
      // Don't throw - personal class is nice to have but not critical
    }
  },

  /**
   * Get current authenticated user data
   * Uses Supabase session - no token parameter needed
   */
  async getUserMe(): Promise<UserData> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Get username from profile or auth metadata (fallback)
    const usernameFromMetadata = user.user_metadata?.user_name || user.user_metadata?.display_name;
    const username = profile.user_name || usernameFromMetadata;

    // Convert to UserData format
    return {
      _id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      username: username,
      profileImageUrl: profile.pfp || undefined,
      preferences: {
        personality: profile.personality || 0,
        time: profile.time_preference || 0,
        inPerson: profile.in_person || 0,
        privateSpace: profile.private_space || 0,
      },
      points: profile.points || 0,
      streak: profile.streak || 0,
      level: profile.level || 1,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: { 
    firstName?: string; 
    lastName?: string; 
    pfp?: string | File 
  }): Promise<any> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    let pfpUrl = typeof profileData.pfp === 'string' ? profileData.pfp : undefined;

    // If pfp is a File, upload it to Supabase Storage
    if (profileData.pfp instanceof File) {
      const fileExt = profileData.pfp.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profileData.pfp, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload profile picture");
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      pfpUrl = urlData.publicUrl;
    }

    const updateData: any = {};
    if (profileData.firstName) updateData.first_name = profileData.firstName;
    if (profileData.lastName) updateData.last_name = profileData.lastName;
    if (pfpUrl) updateData.pfp = pfpUrl;

    // Update auth user metadata
    if (profileData.firstName || profileData.lastName) {
      const currentMetadata = user.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          first_name: profileData.firstName || currentMetadata.first_name,
          last_name: profileData.lastName || currentMetadata.last_name,
        },
      });
    }

    // Update database profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  /**
   * Get login dates and streak
   */
  async getLoginDates(): Promise<{ loginDates: string[]; streak: number }> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('login_dates, streak')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    return {
      loginDates: profile.login_dates?.map((date: string) => new Date(date).toISOString()) || [],
      streak: profile.streak || 0,
    };
  },

  /**
   * Update login streak when user logs in
   */
  async updateLoginStreak(userId: string): Promise<void> {
    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('streak, last_login_date, login_dates')
      .eq('id', userId)
      .single();

    if (fetchError || !user) return;

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    todayUTC.setUTCHours(0, 0, 0, 0);

    const lastLogin = user.last_login_date ? new Date(user.last_login_date) : null;
    let lastLoginUTC = null;
    if (lastLogin) {
      lastLoginUTC = new Date(Date.UTC(lastLogin.getUTCFullYear(), lastLogin.getUTCMonth(), lastLogin.getUTCDate()));
      lastLoginUTC.setUTCHours(0, 0, 0, 0);
    }

    const daysDiff = lastLoginUTC ? Math.floor((todayUTC.getTime() - lastLoginUTC.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const previousStreak = user.streak || 0;
    let newStreak = previousStreak;
    let loginDates = user.login_dates || [];
    let streakChange = 0;

    const todayStr = todayUTC.toISOString();
    const lastLoginStr = lastLoginUTC ? lastLoginUTC.toISOString() : null;
    const alreadyLoggedInToday = lastLoginStr === todayStr;

    if (!lastLoginUTC) {
      newStreak = 1;
      streakChange = 1;
    } else if (daysDiff === 1) {
      newStreak = previousStreak + 1;
      streakChange = 1;
    } else if (daysDiff === 0) {
      // Already logged in today, no change
      return;
    } else {
      const wasStreakBroken = previousStreak > 0;
      newStreak = 1;
      streakChange = wasStreakBroken ? -previousStreak : 1;
    }

    if (!alreadyLoggedInToday) {
      loginDates.push(todayUTC.toISOString());
      if (loginDates.length > 365) {
        loginDates = loginDates.slice(-365);
      }
    }

    // Update user
    await supabase
      .from('users')
      .update({
        streak: newStreak,
        last_login_date: todayUTC.toISOString(),
        login_dates: loginDates,
      })
      .eq('id', userId);

    // Create login activity
    if (streakChange !== 0) {
      await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'login',
          description: 'Logged in',
          metadata: { streak: newStreak, streakChange },
        });

      // Create streak lost activity if applicable
      if (streakChange < 0) {
        await supabase
          .from('activities')
          .insert({
            user_id: userId,
            type: 'streak_achieved',
            description: 'Streak lost',
            metadata: {
              streak: newStreak,
              previousStreak,
              streakChange,
            },
          });
      }
    }
  },

  /**
   * Logout user
   * Clears Supabase session
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Check if user is authenticated
   * Uses Supabase session
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

/**
 * Complete Supabase Authentication Service
 * Fully optimized and tested for Supabase Auth
 */

import { supabase } from "../../lib/supabase";
import type { UserData } from "../types";

export const authService = {
  /**
   * Login with email or username and password
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    let email = emailOrUsername.trim();
    
    // If username provided, resolve it to email
    if (!isEmail) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('user_name', email)
        .single();
      
      if (userError || !userData) {
        throw new Error("Invalid username or password");
      }
      email = userData.email;
    }

    // Normalize email
    email = email.toLowerCase().trim();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message?.includes("Invalid login credentials") || 
          error.message?.includes("Email not confirmed") ||
          error.message?.includes("Invalid")) {
        throw new Error("Invalid email or password");
      }
      throw new Error(error.message || "Invalid email or password");
    }

    if (!data.session) {
      throw new Error("Failed to create session. Please try again.");
    }

    if (!data.user) {
      throw new Error("Failed to authenticate user");
    }

    // Verify session is actually set
    const { data: { session: verifySession } } = await supabase.auth.getSession();
    if (!verifySession) {
      throw new Error("Session verification failed. Please try again.");
    }

    // Update login streak (non-blocking)
    this.updateLoginStreak(data.user.id).catch(err => {
      console.error("Failed to update login streak:", err);
    });
  },

  /**
   * Sign up a new user
   */
  async signup(userData: {
    email: string;
    password: string;
    userName: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const normalizedEmail = userData.email.trim().toLowerCase();
    const normalizedUserName = userData.userName.trim();

    // Validate input
    if (!normalizedEmail || !normalizedUserName || !userData.password) {
      throw new Error("All fields are required");
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('users')
      .select('id, user_name')
      .eq('user_name', normalizedUserName)
      .maybeSingle();

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error("Error checking username:", usernameCheckError);
      throw new Error("Database error. Please try again.");
    }

    if (existingUsername) {
      throw new Error("Username is already taken");
    }

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.error("Error checking email:", emailCheckError);
      throw new Error("Database error. Please try again.");
    }

    if (existingEmail) {
      throw new Error("Email is already registered");
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: userData.password,
      options: {
        data: {
          user_name: normalizedUserName,
          first_name: userData.firstName.trim(),
          last_name: userData.lastName.trim(),
          display_name: normalizedUserName,
        },
      },
    });

    if (authError) {
      const errorMsg = authError.message?.toLowerCase() || "";
      
      if (errorMsg.includes("already registered") || 
          errorMsg.includes("user already exists") ||
          errorMsg.includes("email address is already")) {
        throw new Error("Email is already registered");
      }
      
      if (errorMsg.includes("password")) {
        throw new Error("Password does not meet requirements");
      }
      
      throw new Error(authError.message || "Failed to create account. Please try again.");
    }

    if (!authData.user) {
      throw new Error("Failed to create user account");
    }

    // If email confirmation is required, session might be null
    if (!authData.session) {
      // Still create profile for email confirmation flow
      try {
        await this.createUserProfile(authData.user.id, {
          userName: normalizedUserName,
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          email: normalizedEmail,
        });
      } catch (profileError: any) {
        console.error("Profile creation error (email confirmation required):", profileError);
        // Don't throw - user can confirm email and profile will be there
      }
      throw new Error("Please check your email to confirm your account");
    }

    // Session exists - create profile
    try {
      await this.createUserProfile(authData.user.id, {
        userName: normalizedUserName,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: normalizedEmail,
      });
    } catch (profileError: any) {
      console.error("Profile creation error:", profileError);
      
      const errorCode = profileError.code;
      const errorMsg = (profileError.message || "").toLowerCase();
      
      if (errorCode === '23505' || 
          errorMsg.includes("unique") || 
          errorMsg.includes("duplicate") || 
          errorMsg.includes("already exists")) {
        throw new Error("Username or email is already taken");
      }
      
      if (errorMsg.includes("row-level security") || 
          errorMsg.includes("policy") || 
          errorMsg.includes("permission denied") ||
          errorCode === '42501') {
        throw new Error("Permission denied. Please contact support.");
      }
      
      throw new Error("Failed to create user profile. Please contact support.");
    }

    // Verify session is set
    const { data: { session: verifySession } } = await supabase.auth.getSession();
    if (!verifySession) {
      throw new Error("Session verification failed. Please try logging in.");
    }
  },

  /**
   * Helper function to create user profile
   */
  async createUserProfile(
    userId: string,
    profileData: {
      userName: string;
      firstName: string;
      lastName: string;
      email: string;
    }
  ): Promise<void> {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        user_name: profileData.userName,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        streak: 0,
        points: 0,
        level: 1,
        role: 'user',
      });

    if (profileError) {
      throw profileError;
    }

    // Create default "Personal" class (non-blocking)
    supabase
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
        user_id: userId,
        is_personal: true,
      })
      .then(({ error: classError }) => {
        if (classError) {
          console.error("Failed to create personal class:", classError);
        }
      });
  },

  /**
   * Get current authenticated user data
   */
  async getUserMe(): Promise<UserData> {
    // First verify we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error("Not authenticated");
    }

    // Get user from auth
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

    if (profileError) {
      // If profile doesn't exist, try to create it from auth metadata
      if (profileError.code === 'PGRST116') {
        const metadata = user.user_metadata || {};
        try {
          await this.createUserProfile(user.id, {
            userName: metadata.user_name || metadata.display_name || user.email?.split('@')[0] || 'user',
            firstName: metadata.first_name || '',
            lastName: metadata.last_name || '',
            email: user.email || '',
          });
          
          // Retry getting profile
          const { data: newProfile, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (retryError || !newProfile) {
            throw new Error("User profile not found");
          }
          
          return this.formatUserData(newProfile, user);
        } catch (createError) {
          console.error("Failed to create profile from metadata:", createError);
          throw new Error("User profile not found. Please contact support.");
        }
      }
      throw new Error("User profile not found");
    }

    if (!profile) {
      throw new Error("User profile not found");
    }

    return this.formatUserData(profile, user);
  },

  /**
   * Format user data from database profile and auth user
   */
  formatUserData(profile: any, authUser: any): UserData {
    const usernameFromMetadata = authUser.user_metadata?.user_name || authUser.user_metadata?.display_name;
    const username = profile.user_name || usernameFromMetadata;

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

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profileData.pfp, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload profile picture");
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      pfpUrl = urlData.publicUrl;
    }

    const updateData: any = {};
    if (profileData.firstName) updateData.first_name = profileData.firstName.trim();
    if (profileData.lastName) updateData.last_name = profileData.lastName.trim();
    if (pfpUrl) updateData.pfp = pfpUrl;

    // Update auth user metadata
    if (profileData.firstName || profileData.lastName) {
      const currentMetadata = user.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          first_name: profileData.firstName?.trim() || currentMetadata.first_name,
          last_name: profileData.lastName?.trim() || currentMetadata.last_name,
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
    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('streak, last_login_date, login_dates')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        console.error("Failed to fetch user for streak update:", fetchError);
        return;
      }

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
        return; // Already logged in today
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

      await supabase
        .from('users')
        .update({
          streak: newStreak,
          last_login_date: todayUTC.toISOString(),
          login_dates: loginDates,
        })
        .eq('id', userId);

      if (streakChange !== 0) {
        supabase
          .from('activities')
          .insert({
            user_id: userId,
            type: 'login',
            description: 'Logged in',
            metadata: { streak: newStreak, streakChange },
          })
          .then(({ error }) => {
            if (error) {
              console.error("Failed to create login activity:", error);
            }
          });

        if (streakChange < 0) {
          supabase
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
            })
            .then(({ error }) => {
              if (error) {
                console.error("Failed to create streak activity:", error);
              }
            });
        }
      }
    } catch (error) {
      console.error("Error updating login streak:", error);
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Check if user is authenticated
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

/**
 * Complete Supabase Authentication Service
 * Fully optimized and tested for Supabase Auth
 * Works with database triggers for automatic profile creation
 */

import { supabase } from "../../lib/supabase";
import type { UserData } from "../types";

export const authService = {
  /**
   * Login with email or username and password
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    let email = emailOrUsername.trim();
    
    console.log("Login attempt:", { emailOrUsername, isEmail });
    
    // If username provided, resolve it to email
    if (!isEmail) {
      console.log("Looking up username in users table...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('user_name', email)
        .single();
      
      if (userError) {
        console.error("Username lookup error:", userError);
        // Check if it's an RLS error
        if (userError.message?.includes("RLS") || userError.code === "PGRST301") {
          throw new Error("Database access error. Please contact support.");
        }
        throw new Error("Username not found");
      }
      
      if (!userData) {
        throw new Error("Username not found");
      }
      
      email = userData.email;
      console.log("Found email for username");
    }

    // Normalize email
    email = email.toLowerCase().trim();
    console.log("Attempting Supabase auth login...");

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error.message, error);
      
      // Handle specific error cases
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        throw new Error("Please check your email and confirm your account before logging in");
      }
      
      if (error.message?.toLowerCase().includes("invalid login credentials") || 
          error.message?.toLowerCase().includes("invalid")) {
        throw new Error("Invalid email or password. Make sure you're using the correct credentials.");
      }
      
      throw new Error(error.message || "Login failed. Please try again.");
    }
    
    console.log("Supabase auth successful, checking profile...");

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
   * Database trigger will auto-create profile, so we just need to sign up
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

    // Check if email already exists in users table
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
    // The database trigger will automatically create the profile
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
        emailRedirectTo: `${window.location.origin}/dashboard`,
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
      
      console.error("Supabase auth error:", authError);
      throw new Error(authError.message || "Failed to create account. Please try again.");
    }

    if (!authData.user) {
      throw new Error("Failed to create user account");
    }

    console.log("Auth user created:", authData.user.id);

    // If email confirmation is required, session will be null
    // But the database trigger will still create the profile
    if (!authData.session) {
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if profile was created by trigger
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();
      
      if (profile) {
        console.log("Profile created by trigger, email confirmation required");
        throw new Error("Please check your email to confirm your account. After confirming, you can log in.");
      } else {
        console.warn("Profile not created by trigger, might need manual creation");
        throw new Error("Please check your email to confirm your account. After confirming, you can log in.");
      }
    }

    // Session exists - user is immediately authenticated
    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify profile was created (by trigger or manually)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found after signup:", profileError);
      
      // Try to create profile manually as fallback
      try {
        const { error: createError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
            user_name: normalizedUserName,
            first_name: userData.firstName.trim(),
            last_name: userData.lastName.trim(),
            email: normalizedEmail,
        streak: 0,
        points: 0,
        level: 1,
            role: 'user',
          });

        if (createError) {
          console.error("Manual profile creation also failed:", createError);
          throw new Error("Account created but profile setup failed. Please contact support.");
        }
        
        console.log("Profile created manually as fallback");
        
        // Create Personal class
        await supabase
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
      } catch (fallbackError: any) {
        console.error("Fallback profile creation failed:", fallbackError);
        throw new Error("Account created but profile setup failed. Please contact support.");
      }
    } else {
      console.log("Profile exists (created by trigger)");
    }

    // Verify session is set
    const { data: { session: verifySession } } = await supabase.auth.getSession();
    if (!verifySession) {
      console.warn("Session not found after signup");
      throw new Error("Account created but session not set. Please try logging in.");
    }

    console.log("Signup completed successfully");
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
          // Try to create profile
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              user_name: metadata.user_name || metadata.display_name || user.email?.split('@')[0] || 'user',
              first_name: metadata.first_name || '',
              last_name: metadata.last_name || '',
              email: user.email || '',
              streak: 0,
              points: 0,
              level: 1,
              role: 'user',
            });

          if (createError) {
            console.error("Failed to create profile from metadata:", createError);
            throw new Error("User profile not found. Please contact support.");
          }
          
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

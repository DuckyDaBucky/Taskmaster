/**
 * Simple Supabase Auth Service
 * Minimal, bulletproof authentication
 */

import { supabase } from "../../lib/supabase";
import type { UserData } from "../types";

export const authService = {
  /**
   * Login with email and password
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    let email = emailOrUsername.trim().toLowerCase();
    
    // If username, look up email
    if (!isEmail) {
      const { data } = await supabase
        .from('users')
        .select('email')
        .or(`user_name.eq.${emailOrUsername},display_name.eq.${emailOrUsername}`)
        .limit(1)
        .single();
      
      if (!data?.email) {
        throw new Error("Username not found");
      }
      email = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.includes("Invalid")) {
        throw new Error("Invalid email or password");
      }
      if (error.message?.includes("confirm")) {
        throw new Error("Please confirm your email first");
      }
      throw new Error(error.message);
    }
  },

  /**
   * Sign up new user
   */
  async signup(userData: {
    email: string;
    password: string;
    userName: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const email = userData.email.trim().toLowerCase();
    const userName = userData.userName.trim();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
        data: {
          user_name: userName,
          display_name: userName,
          first_name: userData.firstName.trim(),
          last_name: userData.lastName.trim(),
        },
      },
    });

    if (error) {
      if (error.message?.includes("already")) {
        throw new Error("Email already registered");
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Failed to create account");
    }

    // Create profile in users table (fire and forget)
    supabase.from('users').upsert({
      id: data.user.id,
      user_name: userName,
      display_name: userName,
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      email: email,
      streak: 0,
      points: 0,
      level: 1,
      theme: 'light',
    }, { onConflict: 'id' }).then(() => {
      // Create Personal class
      supabase.from('classes').upsert({
        name: 'Personal',
        user_id: data.user!.id,
        is_personal: true,
      }, { onConflict: 'user_id,is_personal' });
    });
  },

  /**
   * Get current user data
   */
  async getUserMe(): Promise<UserData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Try to get profile
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // If no profile, create one from auth metadata
    if (!profile) {
      const meta = user.user_metadata || {};
      const newProfile = {
        id: user.id,
        user_name: meta.user_name || meta.display_name || user.email?.split('@')[0] || 'user',
        display_name: meta.display_name || meta.user_name || user.email?.split('@')[0] || 'user',
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        email: user.email || '',
        streak: 0,
        points: 0,
        level: 1,
        theme: 'light',
      };

      await supabase.from('users').upsert(newProfile, { onConflict: 'id' });
      
      // Also create Personal class
      await supabase.from('classes').upsert({
        name: 'Personal',
        user_id: user.id,
        is_personal: true,
      }, { onConflict: 'user_id,is_personal' });

      profile = newProfile as any;
    }

    return {
      _id: user.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || user.email || '',
      username: profile.display_name || profile.user_name || '',
      displayName: profile.display_name || profile.user_name || '',
      profileImageUrl: profile.pfp,
      preferences: {
        personality: profile.personality ?? 0.5,
        time: profile.time_preference ?? 0,
        inPerson: profile.in_person ?? 0,
        privateSpace: profile.private_space ?? 0,
      },
      theme: profile.theme || 'dark',
      settings: profile.settings || { emailNotifications: true, pushNotifications: false, weeklyDigest: true },
      points: profile.points || 0,
      streak: profile.streak || 0,
      level: profile.level || 1,
    };
  },

  /**
   * Update profile
   */
  async updateProfile(data: { firstName?: string; lastName?: string; pfp?: string | File }): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updates: any = {};
    if (data.firstName) updates.first_name = data.firstName;
    if (data.lastName) updates.last_name = data.lastName;
    if (typeof data.pfp === 'string') updates.pfp = data.pfp;

    const { data: profile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return profile;
  },

  /**
   * Get login dates
   */
  async getLoginDates(): Promise<{ loginDates: string[]; streak: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data } = await supabase
      .from('users')
      .select('login_dates, streak')
      .eq('id', user.id)
      .single();

    return {
      loginDates: data?.login_dates || [],
      streak: data?.streak || 0,
    };
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /**
   * Get session
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

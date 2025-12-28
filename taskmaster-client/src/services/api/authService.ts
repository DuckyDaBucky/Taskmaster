import { supabase } from "../../lib/supabase";
import { clearAuthCache, setAuthCache } from "./authCache";
import type { UserData } from "../types";

export class AuthError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    let email = emailOrUsername.trim().toLowerCase();

    if (!isEmail) {
      const { data } = await supabase
        .from('users')
        .select('email')
        .or(`user_name.eq.${emailOrUsername},display_name.eq.${emailOrUsername}`)
        .limit(1)
        .single();

      if (!data?.email) {
        throw new AuthError("Username not found", "USER_NOT_FOUND");
      }
      email = data.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message?.includes("Invalid")) {
        throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
      }
      if (error.message?.includes("confirm")) {
        throw new AuthError("Please confirm your email first", "EMAIL_NOT_CONFIRMED");
      }
      throw new AuthError(error.message, "LOGIN_FAILED");
    }

    if (data.user) {
      setAuthCache(data.user.id);
    }
  },

  async signup(userData: {
    email: string;
    password: string;
    userName: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const email = userData.email.trim().toLowerCase();
    const userName = userData.userName.trim();

    if (!userName || userName.toLowerCase() === 'user') {
      throw new AuthError("Please provide a valid username", "INVALID_USERNAME");
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`user_name.eq.${userName},display_name.eq.${userName}`)
      .limit(1)
      .single();

    if (existingUser) {
      throw new AuthError("Username already taken", "USERNAME_EXISTS");
    }

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
        throw new AuthError("Email already registered", "EMAIL_EXISTS");
      }
      throw new AuthError(error.message, "SIGNUP_FAILED");
    }

    if (!data.user) {
      throw new AuthError("Failed to create account", "SIGNUP_FAILED");
    }

    await supabase.from('users').upsert({
      id: data.user.id,
      user_name: userName,
      display_name: userName,
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      email: email,
      streak: 0,
      points: 0,
      level: 1,
      theme: 'dark',
    }, { onConflict: 'id' });

    await supabase.from('classes').upsert({
      name: 'Personal',
      user_id: data.user.id,
      is_personal: true,
    }, { onConflict: 'user_id,is_personal' });

    setAuthCache(data.user.id);
  },

  async getUserMe(): Promise<UserData> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      clearAuthCache();
      throw new AuthError("Authentication failed: " + authError.message, "AUTH_FAILED");
    }
    
    if (!user) {
      clearAuthCache();
      throw new AuthError("Not authenticated", "NOT_AUTHENTICATED");
    }

    setAuthCache(user.id);

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Profile fetch error:", profileError);
    }

    if (!profile) {
      const meta = user.user_metadata || {};
      const emailPrefix = user.email?.split('@')[0] || '';
      const userName = meta.user_name || meta.display_name || emailPrefix;
      
      if (!userName || userName.toLowerCase() === 'user') {
        return {
          _id: user.id,
          firstName: meta.first_name || '',
          lastName: meta.last_name || '',
          email: user.email || '',
          username: emailPrefix || 'Unknown',
          displayName: emailPrefix || 'Unknown',
          profileImageUrl: undefined,
          preferences: { personality: 0.5, time: 0, inPerson: 0, privateSpace: 0 },
          theme: 'dark',
          settings: { emailNotifications: true, pushNotifications: false, weeklyDigest: true },
          points: 0,
          streak: 0,
          level: 1,
        };
      }

      const newProfile = {
        id: user.id,
        user_name: userName,
        display_name: userName,
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        email: user.email || '',
        streak: 0,
        points: 0,
        level: 1,
        theme: 'dark',
      };

      await supabase.from('users').upsert(newProfile, { onConflict: 'id' });

      await supabase.from('classes').upsert({
        name: 'Personal',
        user_id: user.id,
        is_personal: true,
      }, { onConflict: 'user_id,is_personal' });

      return {
        _id: user.id,
        firstName: meta.first_name || '',
        lastName: meta.last_name || '',
        email: user.email || '',
        username: userName,
        displayName: userName,
        profileImageUrl: undefined,
        preferences: { personality: 0.5, time: 0, inPerson: 0, privateSpace: 0 },
        theme: 'dark',
        settings: { emailNotifications: true, pushNotifications: false, weeklyDigest: true },
        points: 0,
        streak: 0,
        level: 1,
      };
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

  async updateProfile(data: { firstName?: string; lastName?: string; pfp?: string | File }): Promise<any> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      clearAuthCache();
      throw new AuthError("Not authenticated", "NOT_AUTHENTICATED");
    }

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

    if (error) throw new AuthError(error.message, "UPDATE_FAILED");
    return profile;
  },

  async getLoginDates(): Promise<{ loginDates: string[]; streak: number }> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { loginDates: [], streak: 0 };
    }

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

  async logout(): Promise<void> {
    clearAuthCache();
    await supabase.auth.signOut();
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;
    } catch {
      return false;
    }
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async validateAuth(): Promise<{ isValid: boolean; userId: string | null; error?: string }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        clearAuthCache();
        return { isValid: false, userId: null, error: error.message };
      }
      
      if (!user) {
        clearAuthCache();
        return { isValid: false, userId: null, error: 'No user found' };
      }
      
      setAuthCache(user.id);
      return { isValid: true, userId: user.id };
    } catch (err: any) {
      clearAuthCache();
      return { isValid: false, userId: null, error: err.message };
    }
  },
};

/**
 * Authentication Service Wrapper
 * Simplified wrapper that uses Supabase's built-in session management
 * No localStorage token management needed - Supabase handles this
 */

import { supabase } from "../lib/supabase";
import { authService as apiAuthService } from "./api/authService";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

class AuthService {
  /**
   * Login user with email/username and password
   * Supabase handles session storage automatically
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    try {
      await apiAuthService.login(emailOrUsername, password, isEmail);
      // Supabase automatically manages the session
      // No need to store tokens manually
    } catch (error: any) {
      if (error.message?.includes("Invalid") || error.message?.includes("password")) {
        throw new Error("Invalid email or password");
      }
      throw error;
    }
  }

  /**
   * Sign up a new user
   * Supabase handles session storage automatically
   */
  async signup(userData: SignupData): Promise<void> {
    try {
      await apiAuthService.signup({
        email: userData.email,
        password: userData.password,
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      // Supabase automatically manages the session
    } catch (error: any) {
      // Re-throw with user-friendly messages
      const errorMessage = error.message || "";
      
      if (errorMessage.includes("already") || 
          errorMessage.includes("exists") || 
          errorMessage.includes("duplicate") ||
          errorMessage.includes("unique") ||
          errorMessage.includes("taken")) {
        throw new Error("Username or email is already taken");
      }
      
      if (errorMessage.includes("email") && errorMessage.includes("confirm")) {
        throw new Error("Please check your email to confirm your account");
      }
      
      throw error;
    }
  }

  /**
   * Logout user - clears Supabase session
   */
  async logout(): Promise<void> {
    // Sign out from Supabase (clears session automatically)
    await supabase.auth.signOut();
    
    // Clear any legacy localStorage data
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("personalityData");
    
    // Redirect to login
    window.location.replace("/login?logout=true");
  }

  /**
   * Check if user is authenticated
   * Uses Supabase session
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiAuthService.isAuthenticated();
  }

  /**
   * Get current user data
   * Uses Supabase session
   */
  async getUserData() {
    try {
      return await apiAuthService.getUserMe();
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: { 
    firstName?: string; 
    lastName?: string; 
    pfp?: string | File 
  }) {
    return await apiAuthService.updateProfile(profileData);
  }
}

export const authService = new AuthService();

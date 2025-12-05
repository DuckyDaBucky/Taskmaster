/**
 * Authentication Service
 * Handles login, signup, and logout operations using Supabase
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

export interface AuthResponse {
  token: string;
  user?: any;
}

class AuthService {
  /**
   * Login user with email/username and password
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<string> {
    try {
      const token = await apiAuthService.login(emailOrUsername, password, isEmail);
      
      if (!token) {
        throw new Error("No token received");
      }

      // Supabase handles session storage automatically
      // But we'll also store in localStorage for compatibility
      localStorage.setItem("token", token);

      // Fetch user data and save it
      try {
        const user = await apiAuthService.getUserMe(token);
        localStorage.setItem("userData", JSON.stringify(user));
      } catch (error) {
        console.warn("Failed to fetch user data after login:", error);
      }

      return token;
    } catch (error: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      
      if (error.message?.includes("Invalid") || error.message?.includes("password")) {
        throw new Error("Invalid email or password");
      }
      throw error;
    }
  }

  /**
   * Sign up a new user
   */
  async signup(userData: SignupData): Promise<string> {
    try {
      const token = await apiAuthService.signup({
        email: userData.email,
        password: userData.password,
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });

      // If we get a token, signup was successful
      if (token) {
        localStorage.setItem("token", token);

        // Try to fetch user data, but don't fail if it doesn't work immediately
        // The user profile might take a moment to be available
        try {
          const user = await apiAuthService.getUserMe(token);
          localStorage.setItem("userData", JSON.stringify(user));
        } catch (error) {
          console.warn("Failed to fetch user data immediately after signup, but signup was successful:", error);
          // Don't throw - signup was successful, user data can be fetched later
        }

        return token;
      }

      // If no token but no error, might need email confirmation
      throw new Error("Please check your email to confirm your account");
    } catch (error: any) {
      // Only clear storage if signup actually failed
      // Check if the error is about email confirmation (which is actually a success case)
      const isEmailConfirmationError = error.message?.includes("check your email") || 
                                       error.message?.includes("email confirmation") ||
                                       error.message?.includes("confirm your account");
      
      if (!isEmailConfirmationError) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
      }

      // Check for specific Supabase errors
      const errorMessage = error.message || "";
      
      if (errorMessage.includes("already") || 
          errorMessage.includes("exists") || 
          errorMessage.includes("duplicate") ||
          errorMessage.includes("unique") ||
          errorMessage.includes("User already registered")) {
        throw new Error("Username or email is already taken");
      }
      
      if (errorMessage.includes("email") && errorMessage.includes("confirm")) {
        throw new Error("Please check your email to confirm your account");
      }
      
      // Re-throw the original error if it's not one we've handled
      throw error;
    }
  }

  /**
   * Logout user - clears session and localStorage
   */
  async logout(): Promise<void> {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all authentication and user data
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("personalityData");
    
    // Redirect to login
    window.location.replace("/login?logout=true");
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  /**
   * Get current user token
   */
  async getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || localStorage.getItem("token");
  }

  /**
   * Get current user data from localStorage or Supabase
   */
  async getUserData(): Promise<any | null> {
    try {
      const user = await apiAuthService.getUserMe();
      if (user) {
        localStorage.setItem("userData", JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.warn("Failed to fetch user from Supabase, trying localStorage");
    }
    
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: { firstName?: string; lastName?: string; pfp?: string }): Promise<any> {
    try {
      const updatedUser = await apiAuthService.updateProfile(profileData);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();

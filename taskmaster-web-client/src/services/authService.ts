/**
 * Authentication Service
 * Handles login, signup, and logout operations
 */

import { apiService } from "./apiService";

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
   * @param emailOrUsername User email or username
   * @param password User password
   * @param isEmail Whether the input is an email (true) or username (false)
   * @returns Promise<string> JWT token
   */
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<string> {
    try {
      const token = await apiService.login(emailOrUsername, password, isEmail);
      
      if (!token) {
        throw new Error("No token received from server");
      }

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Fetch user data and save it
      try {
        const user = await apiService.getUserMe(token);
        localStorage.setItem("userData", JSON.stringify(user));
      } catch (error) {
        console.warn("Failed to fetch user data after login:", error);
        // Continue anyway - token is saved
      }

      return token;
    } catch (error: any) {
      // Clear any partial data on error
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw new Error("Invalid email or password");
      }
      throw error;
    }
  }

  /**
   * Sign up a new user
   * @param userData User signup data
   * @returns Promise<string> JWT token
   */
  async signup(userData: SignupData): Promise<string> {
    try {
      console.log("Signup attempt with data:", { 
        userName: userData.userName, 
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      });

      const response = await apiService.signup({
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });

      console.log("Signup Response:", response);

      if (!response) {
        throw new Error("No token received from server");
      }

      const token = response;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Fetch user data and save it
      try {
        const user = await apiService.getUserMe(token);
        console.log("User data fetched after signup:", user);
        localStorage.setItem("userData", JSON.stringify(user));
      } catch (error) {
        console.error("Failed to fetch user data after signup:", error);
        // Continue anyway - token is saved
      }

      return token;
    } catch (error: any) {
      console.error("Signup error:", error);
      console.error("Error response:", error.response?.data);
      
      // Clear any partial data on error
      localStorage.removeItem("token");
      localStorage.removeItem("userData");

      if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Username or email is already taken";
        throw new Error(message);
      }
      
      if (error.response?.status === 500) {
        throw new Error("Server error. Please try again later.");
      }
      
      throw error;
    }
  }

  /**
   * Logout user - clears localStorage and redirects to login
   */
  logout(): void {
    // Clear all authentication and user data FIRST
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("personalityData");
    
    // Use replace instead of href to prevent back button issues
    // Add logout parameter to prevent auto-login
    window.location.replace("/login?logout=true");
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  }

  /**
   * Get current user token
   * @returns string | null
   */
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Get current user data from localStorage
   * @returns any | null
   */
  getUserData(): any | null {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Update user profile
   * @param profileData Profile data to update
   * @returns Promise<any> Updated user data
   */
  async updateProfile(profileData: { firstName?: string; lastName?: string; pfp?: string }): Promise<any> {
    try {
      const updatedUser = await apiService.updateProfile(profileData);
      
      // Update localStorage
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();


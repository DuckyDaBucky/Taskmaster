/**
 * Simple Auth Service Wrapper
 */

import { supabase } from "../lib/supabase";
import { authService as apiAuthService } from "./api/authService";

class AuthService {
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<void> {
    await apiAuthService.login(emailOrUsername, password, isEmail);
  }

  async signup(userData: {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    await apiAuthService.signup(userData);
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.replace("/login");
  }

  async isAuthenticated(): Promise<boolean> {
    return await apiAuthService.isAuthenticated();
  }

  async getUserData() {
    try {
      return await apiAuthService.getUserMe();
    } catch {
      return null;
    }
  }

  async updateProfile(data: { firstName?: string; lastName?: string; pfp?: string | File }) {
    return await apiAuthService.updateProfile(data);
  }
}

export const authService = new AuthService();

"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { authService } from "../services/api/authService";

interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  displayName?: string;
  email: string;
  profileImageUrl?: string;
  preferences?: {
    personality: number;
    inPerson: number;
    privateSpace: number;
    time: number;
  };
  theme?: string;
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  };
  points?: number;
  streak?: number;
  level?: number;
}

interface UserContextProps {
  user: UserData | null;
  isLoadingUser: boolean;
  setUserState: (data: Partial<UserData>) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userData = await authService.getUserMe();
        setUser(userData);
        
        // Apply user's saved theme preference
        if (userData.theme) {
          localStorage.setItem('appTheme', userData.theme);
          document.documentElement.setAttribute('data-theme', userData.theme);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserState = (data: Partial<UserData>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.clear();
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <UserContext.Provider value={{ user, isLoadingUser, setUserState, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { authService } from "../services/api/authService";
import { clearAuthCache, setAuthCache } from "../services/api/authCache";

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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const loadUser = useCallback(async (): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (!mountedRef.current) return;
      
      if (error || !authUser) {
        clearAuthCache();
        setUser(null);
        return;
      }

      setAuthCache(authUser.id);
      const userData = await authService.getUserMe();
      
      if (!mountedRef.current) return;

      if (userData && userData.username !== 'user') {
        setUser(userData);
        if (userData.theme && typeof window !== 'undefined') {
          localStorage.setItem('appTheme', userData.theme);
          document.documentElement.setAttribute('data-theme', userData.theme);
        }
      }
    } catch (error) {
      console.error('[UserContext] Error loading user:', error);
      if (!user) setUser(null);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setIsLoadingUser(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAuthCache();
        setUser(null);
        setIsLoadingUser(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setAuthCache(session.user.id);
        loadUser();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setAuthCache(session.user.id);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserState = useCallback((data: Partial<UserData>) => {
    setUser(prev => {
      if (!prev) return null;
      if (data.username === 'user' || data.displayName === 'user') return prev;
      return { ...prev, ...data };
    });
  }, []);

  const logout = useCallback(async () => {
    clearAuthCache();
    await supabase.auth.signOut();
    setUser(null);
    if (typeof window !== 'undefined') localStorage.clear();
  }, []);

  const refreshUser = useCallback(async () => {
    loadingRef.current = false; // Allow refresh
    setIsLoadingUser(true);
    await loadUser();
  }, [loadUser]);

  return (
    <UserContext.Provider value={{ user, isLoadingUser, setUserState, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

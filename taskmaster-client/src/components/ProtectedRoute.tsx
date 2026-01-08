"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { setAuthCache, clearAuthCache } from "../services/api/authCache";

const AUTH_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), AUTH_TIMEOUT_MS);
      });

      const authPromise = supabase.auth.getUser();
      const result = await Promise.race([authPromise, timeoutPromise]);
      
      const { data: { user }, error: authError } = result;
      
      if (authError) {
        clearAuthCache();
        return false;
      }
      
      if (user) {
        setAuthCache(user.id);
        return true;
      } else {
        clearAuthCache();
        return false;
      }
    } catch (err: any) {
      if (retryCount < MAX_RETRIES && err.message?.includes('timeout')) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return checkAuth(retryCount + 1);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const performAuthCheck = async () => {
      const authed = await checkAuth();
      if (!isMounted) return;
      
      setIsAuthenticated(authed);
      setIsLoading(false);
      
      if (!authed) {
        setTimeout(() => {
          if (isMounted) router.replace("/login");
        }, 100);
      }
    };
    
    performAuthCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      switch (event) {
        case 'SIGNED_OUT':
          clearAuthCache();
          setIsAuthenticated(false);
          router.replace("/login");
          break;
        case 'SIGNED_IN':
          if (session?.user) {
            setAuthCache(session.user.id);
            setIsAuthenticated(true);
          }
          break;
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setAuthCache(session.user.id);
          } else {
            const authed = await checkAuth();
            if (!authed && isMounted) {
              setIsAuthenticated(false);
              router.replace("/login");
            }
          }
          break;
        default:
          if (!session) {
            const authed = await checkAuth();
            if (!authed && isMounted) {
              setIsAuthenticated(false);
              router.replace("/login");
            }
          }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

export { ProtectedRoute };

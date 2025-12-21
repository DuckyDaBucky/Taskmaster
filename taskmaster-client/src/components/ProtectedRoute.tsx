"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const AUTH_TIMEOUT_MS = 10000; // 10 second timeout

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT_MS);
      });

      // Race between auth check and timeout
      const authPromise = supabase.auth.getSession();
      const result = await Promise.race([authPromise, timeoutPromise]);
      
      const session = result?.data?.session;
      const authed = !!session;
      setIsAuthenticated(authed);
      
      if (!authed) {
        router.replace("/login");
      }
    } catch (err: any) {
      console.error("Auth check failed:", err.message);
      setError(err.message);
      // On timeout or error, redirect to login
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authed = !!session;
      setIsAuthenticated(authed);
      if (event === "SIGNED_OUT" || !authed) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm text-destructive">Connection error. Redirecting...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

export { ProtectedRoute };


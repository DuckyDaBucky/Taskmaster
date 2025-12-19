import { supabase } from "../../lib/supabase";

// Centralized user ID cache to avoid repeated auth calls
let cachedUserId: string | null = null;
let cachePromise: Promise<string> | null = null;

export async function getCachedUserId(): Promise<string> {
  // Return cached value if available
  if (cachedUserId) return cachedUserId;
  
  // If already fetching, wait for that promise
  if (cachePromise) return cachePromise;
  
  // Fetch and cache
  cachePromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    cachedUserId = session.user.id;
    return cachedUserId;
  })();
  
  try {
    return await cachePromise;
  } finally {
    cachePromise = null;
  }
}

export function clearAuthCache(): void {
  cachedUserId = null;
  cachePromise = null;
}

// Set cached user ID (called after login)
export function setAuthCache(userId: string): void {
  cachedUserId = userId;
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    clearAuthCache();
  } else if (event === 'SIGNED_IN' && session?.user) {
    setAuthCache(session.user.id);
  }
});


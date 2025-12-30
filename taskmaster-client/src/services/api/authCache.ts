import { supabase } from "../../lib/supabase";

const CACHE_TTL_MS = 60000;

let cachedUserId: string | null = null;
let cacheTimestamp: number = 0;
let cachePromise: Promise<string> | null = null;
let isInitialized = false;

export async function getCachedUserId(): Promise<string> {
  const now = Date.now();
  
  if (cachedUserId && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedUserId;
  }
  
  if (cachePromise) {
    return cachePromise;
  }
  
  cachePromise = (async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        clearAuthCache();
        throw new Error("Authentication error: " + error.message);
      }
      
      if (!user) {
        clearAuthCache();
        throw new Error("Not authenticated");
      }
      
      cachedUserId = user.id;
      cacheTimestamp = Date.now();
      
      return user.id;
    } catch (err) {
      clearAuthCache();
      throw err;
    } finally {
      cachePromise = null;
    }
  })();
  
  return cachePromise;
}

export function getCachedUserIdSync(): string | null {
  const now = Date.now();
  if (cachedUserId && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedUserId;
  }
  return null;
}

export function clearAuthCache(): void {
  cachedUserId = null;
  cacheTimestamp = 0;
  cachePromise = null;
}

export function setAuthCache(userId: string): void {
  cachedUserId = userId;
  cacheTimestamp = Date.now();
}

export function isAuthCacheValid(): boolean {
  const now = Date.now();
  return !!(cachedUserId && (now - cacheTimestamp) < CACHE_TTL_MS);
}

export async function refreshAuthCache(): Promise<string | null> {
  clearAuthCache();
  try {
    return await getCachedUserId();
  } catch {
    return null;
  }
}

function initAuthListener() {
  if (isInitialized) return;
  isInitialized = true;
  
  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'SIGNED_OUT':
        clearAuthCache();
        break;
      case 'SIGNED_IN':
        if (session?.user) setAuthCache(session.user.id);
        break;
      case 'TOKEN_REFRESHED':
        if (session?.user && cachedUserId === session.user.id) {
          cacheTimestamp = Date.now();
        } else if (session?.user) {
          setAuthCache(session.user.id);
        }
        break;
      case 'USER_UPDATED':
        if (session?.user) setAuthCache(session.user.id);
        break;
      case 'PASSWORD_RECOVERY':
        clearAuthCache();
        break;
      default:
        if (session?.user && !cachedUserId) {
          setAuthCache(session.user.id);
        }
    }
  });
}

if (typeof window !== 'undefined') {
  initAuthListener();
}

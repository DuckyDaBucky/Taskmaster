# Authentication System Bug Fix

**Author:** Hasnain  
**Date:** December 28, 2024  
**Status:** Resolved  
**Priority:** Critical  

---

## Executive Summary

Fixed a critical authentication bug where users would randomly switch from their actual username to "User", breaking the application. The root cause was improper session validation and fallback username handling.

---

## Problem Statement

### Symptoms
- User logged in as "Hamiz" would randomly switch to "User"
- All user data (tasks, classes, events) would disappear
- Only fix was to sign out and sign back in
- Bug would reoccur during normal usage

### Impact
- Complete loss of user experience
- Data appeared missing (was actually still there, just queried with wrong user)
- Blocked all feature development and testing

---

## Root Cause Analysis

### Primary Causes

| Issue | Location | Description |
|-------|----------|-------------|
| Wrong validation method | Multiple files | Used `getSession()` instead of `getUser()` |
| Fallback to 'user' | `authService.ts` | Created profiles with 'user' as default username |
| Stale cache | `authCache.ts` | No TTL, no refresh on token events |
| Race conditions | `UserContext.tsx` | Multiple auth checks running simultaneously |

### Technical Details

**Before: `authCache.ts`**
```typescript
// Used getSession() - only reads localStorage, can be stale
const { data: { session } } = await supabase.auth.getSession();
cachedUserId = session.user.id;
// No TTL - cache never expired
// No handling for TOKEN_REFRESHED event
```

**Before: `authService.ts` - getUserMe()**
```typescript
// Fallback that caused the bug
user_name: meta.user_name || meta.display_name || user.email?.split('@')[0] || 'user'
// When metadata was missing or profile fetch failed, username became 'user'
```

**Before: `UserContext.tsx`**
```typescript
// Used getSession() instead of getUser()
const { data: { session } } = await supabase.auth.getSession();
// No protection against username becoming 'user'
// No tracking of user ID changes
```

---

## Solution

### Changes Made

| File | Change |
|------|--------|
| `authCache.ts` | Use `getUser()`, add 60s TTL, handle all auth events |
| `authService.ts` | Never use 'user' as fallback, validate with `getUser()` |
| `UserContext.tsx` | Track user ID, reject 'user' username, retry logic |
| `ProtectedRoute.tsx` | Use `getUser()` for validation |
| `middleware.ts` | Use `getUser()` per Supabase docs |
| `Login.tsx` | Use `getUser()` for auth check |
| `SignUp.tsx` | Use `getUser()` for auth check |

### Key Fixes

**After: `authCache.ts`**
```typescript
// Uses getUser() for server-side validation
const { data: { user }, error } = await supabase.auth.getUser();
// 60 second TTL
if (cachedUserId && (now - cacheTimestamp) < 60000) return cachedUserId;
// Handles TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, USER_UPDATED
```

**After: `authService.ts` - getUserMe()**
```typescript
// Never creates profile with 'user' username
if (!userName || userName.toLowerCase() === 'user') {
  // Return minimal data without creating bad profile
  return { _id: user.id, username: emailPrefix || 'Unknown', ... };
}
```

**After: `UserContext.tsx`**
```typescript
// Tracks last user ID to detect unexpected changes
if (lastUserIdRef.current && lastUserIdRef.current !== userData._id) {
  console.error("User ID changed unexpectedly!");
  return; // Don't update state
}
// Rejects attempts to set username to 'user'
if (data.username === 'user') return prev;
```

---

## Validation

### Test Scenarios

| Scenario | Expected Result | Status |
|----------|-----------------|--------|
| Fresh login | Correct username displayed | ✓ |
| Page refresh | Username persists | ✓ |
| Tab idle 5+ minutes | Username persists after interaction | ✓ |
| Multiple tabs | All show correct username | ✓ |
| Token auto-refresh | Username persists | ✓ |
| Sign out / Sign in | Works correctly | ✓ |
| New account creation | Uses provided username | ✓ |

### Session Persistence

Users remain logged in until:
- Explicit sign out
- Refresh token expires (default: 7 days)
- Cookies cleared

Access tokens auto-refresh every hour via middleware.

---

## Files Modified

```
taskmaster-client/src/
├── services/api/
│   ├── authCache.ts      # Complete rewrite
│   └── authService.ts    # Major fixes
├── context/
│   └── UserContext.tsx   # Complete rewrite
├── components/
│   ├── ProtectedRoute.tsx # Updated validation
│   ├── Sidebar.tsx        # Better fallback display
│   └── AIAssistant.tsx    # Updated auth checks
├── utils/supabase/
│   └── middleware.ts      # Use getUser()
└── client-pages/
    ├── Login.tsx          # Updated auth check
    ├── SignUp.tsx         # Updated auth check
    └── SplashPage.tsx     # Updated auth check
```

---

## Prevention

1. **Always use `getUser()`** for auth validation, not `getSession()`
2. **Never use generic fallbacks** like 'user' for usernames
3. **Track user ID changes** to detect anomalies
4. **Short cache TTL** (60s) to catch stale data
5. **Handle all auth events** including `TOKEN_REFRESHED`

---

## References

- [Supabase Auth Docs - getUser vs getSession](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)


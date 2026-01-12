# Authentication Guide

## Overview

Taskmaster uses Supabase Auth with cookie-based sessions for secure, persistent authentication. Users remain logged in across browser sessions without re-entering credentials.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  Cookies                                                         │
│  ├── sb-access-token  (JWT, 1 hour)                             │
│  └── sb-refresh-token (7 days default)                          │
├─────────────────────────────────────────────────────────────────┤
│  Client                                                          │
│  ├── UserContext      → Manages user state                      │
│  ├── ProtectedRoute   → Guards authenticated pages              │
│  ├── authCache        → Caches user ID (60s TTL)                │
│  └── authService      → Login, signup, profile operations       │
├─────────────────────────────────────────────────────────────────┤
│  Middleware (middleware.ts)                                      │
│  └── Refreshes tokens on every request                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                    │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service                                                    │
│  ├── Validates JWTs                                             │
│  ├── Issues new tokens                                          │
│  └── Manages sessions                                           │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                           │
│  ├── auth.users       → Supabase managed                        │
│  └── public.users     → App profile data                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Session Lifecycle

### Login Flow

```
1. User enters email/password
2. authService.login() calls Supabase
3. Supabase validates credentials
4. Supabase returns access + refresh tokens
5. Tokens stored in HTTP-only cookies
6. UserContext loads user profile
7. User redirected to /dashboard
```

### Token Refresh Flow

```
1. User makes request (any page)
2. Middleware intercepts request
3. Middleware calls supabase.auth.getUser()
4. Supabase checks access token:
   - Valid → continues
   - Expired → uses refresh token to get new access token
5. New cookies set in response
6. User never notices (seamless)
```

### Session Duration

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 1 hour | Short-lived JWT for API calls |
| Refresh Token | 7 days | Long-lived token to get new access tokens |

Users stay logged in until:
- Explicit logout
- Refresh token expires (7 days no activity)
- Cookies cleared

---

## Key Files

### `src/lib/supabase.ts`
Browser client singleton. All client-side code imports from here.

```typescript
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(url, key);
```

### `src/services/api/authService.ts`
Authentication operations.

| Method | Purpose |
|--------|---------|
| `login()` | Email/password or username login |
| `signup()` | Create new account |
| `getUserMe()` | Get current user profile |
| `logout()` | Sign out and clear session |
| `validateAuth()` | Check if user is authenticated |

### `src/services/api/authCache.ts`
Caches authenticated user ID to reduce API calls.

| Function | Purpose |
|----------|---------|
| `getCachedUserId()` | Get user ID (validates with server) |
| `setAuthCache()` | Update cache after auth events |
| `clearAuthCache()` | Clear on logout or errors |

Cache TTL: 60 seconds. After expiry, re-validates with server.

### `src/context/UserContext.tsx`
React context providing user state to all components.

```typescript
const { user, isLoadingUser, logout, refreshUser } = useUser();
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | UserData \| null | Current user or null |
| `isLoadingUser` | boolean | True while loading |
| `logout` | function | Signs out user |
| `refreshUser` | function | Reloads user data |

### `src/components/ProtectedRoute.tsx`
Wraps authenticated pages. Redirects to /login if not authenticated.

### `middleware.ts`
Next.js middleware. Optimized for speed:
- **Public routes**: Zero processing, instant response
- **Protected routes**: Cookie check only, no API calls
- **Token refresh**: Only when expiring within 5 minutes

---

## Auth Methods

### `getSession()` vs `getUser()`

| Method | Validation | Speed | Use Case |
|--------|------------|-------|----------|
| `getSession()` | None (reads cookies) | Fast | Quick checks, non-critical |
| `getUser()` | Server-side JWT validation | Slower | Auth decisions, protected data |

**Rule:** Always use `getUser()` when making auth decisions.

---

## Database Schema

### `auth.users` (Supabase Managed)
```sql
id          UUID PRIMARY KEY
email       TEXT UNIQUE
created_at  TIMESTAMP
```

### `public.users` (App Profile)
```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id)
user_name       TEXT
display_name    TEXT
first_name      TEXT
last_name       TEXT
email           TEXT
pfp             TEXT
theme           TEXT DEFAULT 'dark'
streak          INTEGER DEFAULT 0
points          INTEGER DEFAULT 0
level           INTEGER DEFAULT 1
login_dates     TEXT[]
last_login_date TIMESTAMP
```

---

## Auth Events

The app listens for these Supabase auth events:

| Event | Action |
|-------|--------|
| `SIGNED_IN` | Load user profile, set cache |
| `SIGNED_OUT` | Clear user state, clear cache, redirect |
| `TOKEN_REFRESHED` | Update cache timestamp |
| `USER_UPDATED` | Reload user profile |

---

## Security

### Protections
- HTTP-only cookies (not accessible via JavaScript)
- Server-side JWT validation
- Row Level Security (RLS) on all tables
- User ID verified on every database query

### RLS Example
```sql
CREATE POLICY "Users can only access own data"
ON tasks FOR ALL
USING (user_id = auth.uid());
```

---

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Dashboard Settings
- **Authentication → Settings → JWT expiry:** 3600 (1 hour)
- **Authentication → Settings → Refresh token rotation:** Enabled
- **Authentication → Settings → Refresh token reuse interval:** 10 seconds

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| User shows as null | Token expired, network error | Check console, try refresh |
| Redirect loop | Invalid session state | Clear cookies, re-login |
| "Not authenticated" errors | Stale cache | Clears automatically after 60s |
| User data not loading | Profile missing in database | Check `users` table |


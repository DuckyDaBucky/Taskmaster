# Migration to Next.js & Server-Side Rendering (SSR)

## Overview
This document details the validation and repair work performed to ensure the `taskmaster-client` (Next.js) fully replaces functionality from `taskmaster-web-client` (Vite) while leveraging Next.js specific features, particularly Server-Side Rendering (SSR) for improved performance and SEO.

## Status: ✅ Validated & Repaired

## 1. SSR Infrastructure Implementation
To enable SSR on Vercel, we implemented the standard Supabase SSR pattern (using `@supabase/ssr`).

### Files Created:
- **`src/utils/supabase/server.ts`**: Creates a Supabase client for **Server Components** and Server Actions. It handles cookie reading to access the user's session securely on the server.
- **`src/utils/supabase/client.ts`**: Creates a Supabase client for **Client Components**. It fetches the session from the browser's local storage/cookies.
- **`src/utils/supabase/middleware.ts`**: Updates the auth session on every request. This is critical for Next.js middleware to ensure tokens are refreshed.
- **`middleware.ts`**: The root middleware that executes `updateSession` to guard protected routes and manage auth state headers.

## 2. Service Layer Refactoring
The original services (`taskService`, `classService`, `resourceService`) were designed for a purely Client-Side Rendered (CSR) app, relying on a singleton `supabase` instance imported from `lib/supabase.ts`. This breaks in SSR because Server Components need a fresh client instance per request (with the specific request's cookies).

### Changes:
We refactored the core services to accept an **optional** `SupabaseClient` parameter.

**Pattern:**
```typescript
// Before (CSR Only)
async function getAllTasks() {
  const userId = await getCachedUserId();
  const { data } = await supabase.from('tasks')...
}

// After (SSR + CSR Hybrid)
async function getAllTasks(client?: SupabaseClient) {
  let userId: string;
  const supabaseClient = client || supabase; // Use passed client or fallback to global

  if (client) {
    // Server-side: fetch user from the passed client (cookies)
    const { data: { user } } = await client.auth.getUser();
    userId = user?.id;
  } else {
    // Client-side: use cached ID
    userId = await getCachedUserId();
  }

  const { data } = await supabaseClient.from('tasks')...
}
```

**Refactored Services:**
- `taskService.ts`
- `classService.ts`
- `resourceService.ts`

## 3. Page Architecture: Dashboard
The Dashboard (`src/app/(protected)/dashboard/page.tsx`) was converted from a Client Component wrapper to a proper **Server Component**.

- **Fetching Data**: It now initializes the Supabase server client and fetches the user's tasks on the server.
- **Hydration**: It passes the fetched `tasks` as an `initialTasks` prop to the `DashboardPage` client component.
- **Result**: The user sees their dashboard data immediately (SSR), without a loading spinner or "flicker".

## 4. Functionality Parity Verification
We compared `taskmaster-web-client` and `taskmaster-client` to ensure all backend routes were migrated.

- **Nebula API**: Verified implementation at `src/app/api/nebula/courses/route.ts`.
- **Gemini Chat**: Verified implementation at `src/app/api/gemini/chat/route.ts`.
- **Auth**: Confirmed `Login`, `SignUp`, and `AuthContext` are correctly ported to Next.js.
- **Routing**: Removed all traces of `react-router-dom`; the app effectively uses the App Router.

## Conclusion
The application is now correctly configured for deployment on Vercel with full SSR capabilities for its core features. The backend logic has been verified as present and functional.

# DOC-01: Architecture

## Project Structure
```
taskmaster-client/
  src/
    app/                      # Next.js App Router
      (protected)/            # Auth-guarded routes (see below)
        dashboard/
        tasks/
        calendar/
        ...
      api/                    # Backend API Routes (serverless)
        gemini/chat/
        nebula/courses/
        documents/analyze/
      login/
      signup/
      layout.tsx              # Root layout with providers
      providers.tsx           # Client-side context providers
    client-pages/             # Client Component implementations
    components/               # Reusable UI components
    context/                  # React Contexts (User, Theme)
    services/                 # API service layer
      api/                    # Supabase data operations
    lib/                      # Utilities (Supabase client)
    utils/supabase/           # SSR-specific Supabase clients
    constants/                # Theme tokens, design system
  public/                     # Static assets
  middleware.ts               # Auth session refresh
```

## What is `(protected)`?
The `(protected)` folder is a **Next.js Route Group**. The parentheses mean it does not create a URL segment.

**Purpose:** All routes inside share a common authentication guard. The server-side page checks for a valid Supabase session and redirects to `/login` if none exists.

```
/dashboard  -> src/app/(protected)/dashboard/page.tsx
/tasks      -> src/app/(protected)/tasks/page.tsx
```

## Where is the Backend?
Taskmaster has no separate backend server. All "backend" logic lives in:
1. **Next.js API Routes** (`src/app/api/`): Serverless functions for AI, external APIs, and privileged operations.
2. **Supabase**: Database, Authentication, Storage, and Realtime (via their hosted infrastructure).

This is a "serverless-first" architecture optimized for Vercel deployment.

## Data Flow
```
Browser -> Next.js (Vercel Edge) -> Supabase (Database/Auth)
                                 -> Gemini API (AI)
                                 -> Nebula API (Courses)
```

## SSR Authentication
Supabase sessions are stored in cookies (not localStorage) to support Server-Side Rendering.
- `src/utils/supabase/server.ts`: Creates a server-side client for SSR pages.
- `src/utils/supabase/client.ts`: Creates a browser client for client components.
- `middleware.ts`: Refreshes auth tokens on every request.

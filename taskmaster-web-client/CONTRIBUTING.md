# Contributing to TaskMaster

Quick guide for contributors.

## Setup

```bash
cd taskmaster-web-client
npm install
cp .env.example .env.local  # Add your Supabase keys
npm run dev
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages (one folder per page)
├── services/api/   # All API calls (Supabase, external)
├── context/        # React context (auth, theme)
├── hooks/          # Custom hooks
├── lib/            # Config (Supabase client)
└── utils/          # Helper functions
```

## Conventions

- **One component per file**
- **Services handle all API calls** - pages don't call Supabase directly
- **Types in `services/types.ts`**
- **Use existing hooks** before creating new ones

## Key Files

| File | What it does |
|------|--------------|
| `services/api/authService.ts` | Login, signup, logout |
| `services/api/taskService.ts` | CRUD for tasks |
| `services/api/classService.ts` | CRUD for classes |
| `context/UserContext.tsx` | Current user state |
| `context/ThemeContext.tsx` | Light/dark mode |
| `lib/supabase.ts` | Supabase client init |

## Adding a New Feature

1. Create service in `services/api/yourService.ts`
2. Export from `services/api/index.ts`
3. Create page in `pages/yourfeature/YourPage.tsx`
4. Add route in `App.tsx`

## Environment Variables

```
VITE_SUPABASE_URL      # Supabase project URL
VITE_SUPABASE_ANON_KEY # Supabase anon key (public)
```

Server-side only (Vercel):
```
GEMINI_API_KEY         # For AI chat
NEBULA_API_KEY         # For UTD course data (optional)
```


# TaskMaster

AI-powered academic productivity app for UTD students.

## Architecture

```
┌─────────────────────────────────────┐
│         taskmaster-web-client       │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ React App   │  │ Vercel API   │  │
│  │ (Frontend)  │  │ (AI Routes)  │  │
│  └──────┬──────┘  └──────┬───────┘  │
└─────────┼────────────────┼──────────┘
          │                │
          ▼                ▼
     ┌─────────┐      ┌─────────┐
     │Supabase │      │ Gemini  │
     │ (DB)    │      │ (AI)    │
     └─────────┘      └─────────┘
```

**No separate backend needed.** Supabase handles DB/auth, Vercel handles AI.

## Quick Start

```bash
cd taskmaster-web-client
npm install
npm run dev
```

Create `.env.local`:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Set root directory: `taskmaster-web-client`
4. Add env vars in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

## Database Setup

Run SQL scripts in Supabase SQL Editor (in order):
1. `supabase-ALL-TABLES.sql`
2. `supabase-PGVECTOR.sql`
3. `supabase-COURSE-CATALOG.sql`
4. `supabase-STORAGE-BUCKETS.sql`
5. `supabase-INDEXES.sql`
6. `supabase-FIX-RLS.sql`

## Project Structure

```
taskmaster-web-client/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Route pages
│   ├── services/api/   # All DB calls
│   ├── context/        # React context
│   └── lib/            # Supabase client
├── api/                # Vercel serverless (AI)
│   └── gemini/
│       └── chat.ts
└── supabase-*.sql      # DB setup scripts
```

## Future

- Mobile app (React Native) - can reuse `services/api/`
- More AI features via `api/` routes

# Getting Started

## Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase project (free tier works)
- Gemini API key (for AI features)

## Quick Start
```bash
cd taskmaster-client
npm install
npm run dev
```
Open `http://localhost:3000`

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `SUPABASE_SERVICE_KEY` | Server | For privileged operations |

## Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set root directory: `taskmaster-client`
4. Add environment variables in Vercel Settings
5. Deploy

## Database Setup

Run SQL scripts in Supabase SQL Editor (in order):
1. `supabase-ALL-TABLES.sql`
2. `supabase-PGVECTOR.sql`
3. `supabase-COURSE-CATALOG.sql`
4. `supabase-STORAGE-BUCKETS.sql`
5. `supabase-INDEXES.sql`
6. `supabase-FIX-RLS.sql`

## Development Workflow
1. `npm run dev` for local development
2. Make changes (hot-reload enabled)
3. `npm run build` before deploying
4. Push to `main` for automatic Vercel deployment

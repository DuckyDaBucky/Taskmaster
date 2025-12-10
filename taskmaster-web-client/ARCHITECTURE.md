# Architecture

## Stack
- **Frontend:** React + Vite + Tailwind
- **Backend:** Supabase (auth, db, storage) + Vercel API routes
- **AI:** Gemini API (via Vercel serverless)
- **Hosting:** Vercel

## Data Flow

```
User → React Page → Service → Supabase
                  → Vercel API → Gemini/Nebula
```

## Database Tables

| Table | Purpose |
|-------|---------|
| users | Profiles, settings |
| classes | User's courses |
| tasks | Assignments, todos |
| events | Calendar events |
| resources | Uploaded files |
| flashcards | Study cards |
| course_catalog | UTD course data (shared) |
| document_chunks | AI embeddings (pgvector) |

## API Routes (`/api/`)

| Route | Purpose |
|-------|---------|
| `/api/gemini/chat` | AI chat responses |
| `/api/gemini/embed` | Generate embeddings |
| `/api/nebula/courses` | UTD course lookup |

## SQL Scripts (run in order)

1. `supabase-ALL-TABLES.sql`
2. `supabase-PGVECTOR.sql`
3. `supabase-COURSE-CATALOG.sql`
4. `supabase-STORAGE-BUCKETS.sql`
5. `supabase-INDEXES.sql`
6. `supabase-FIX-RLS.sql`

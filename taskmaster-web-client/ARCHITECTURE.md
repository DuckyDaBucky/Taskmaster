# TaskMaster Architecture

## Overview

TaskMaster is a student productivity app for UTD students with AI-powered features.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
│                    React + Vite (Vercel)                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │ Tasks   │ │Calendar │ │ Classes │ │Resources│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────┐
│                    VERCEL API ROUTES                                     │
│           (Serverless functions for AI & external APIs)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │/api/gemini   │ │/api/nebula   │ │/api/process  │                    │
│  │ - chat       │ │ - courses    │ │ - documents  │                    │
│  │ - embeddings │ │ - professors │ │ - parse      │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────┐
│                         SUPABASE                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │   Auth   │ │ Postgres │ │ Storage  │ │ pgvector │                   │
│  │  (users) │ │  (data)  │ │ (files)  │ │(vectors) │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────┐
│                      EXTERNAL APIS                                       │
│  ┌──────────────┐ ┌──────────────┐                                      │
│  │ Gemini API   │ │ Nebula API   │                                      │
│  │ (AI/LLM)     │ │ (UTD data)   │                                      │
│  └──────────────┘ └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Vercel (set in Vercel Dashboard → Settings → Environment Variables)

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://oyvdwqzbuevcbgrmtmvp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# For API Routes (server-side only)
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
NEBULA_API_KEY=your_nebula_key  # Get from Nebula Labs Discord
```

### Local Development (.env.local)
```env
VITE_SUPABASE_URL=https://oyvdwqzbuevcbgrmtmvp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Database Schema (Supabase)

### Core Tables
- `users` - User profiles, settings, preferences
- `classes` - User's classes (linked to Nebula courses)
- `tasks` - Assignments, todos, homework
- `events` - Calendar events
- `resources` - Uploaded files, links
- `flashcards` - Study flashcards

### Vector Tables (pgvector)
- `document_chunks` - Parsed document text + embeddings
- `course_knowledge` - Nebula course data + embeddings (shared)

### Key Relationships
```
users (1) ←→ (n) classes
users (1) ←→ (n) tasks
users (1) ←→ (n) resources
classes (1) ←→ (n) tasks
resources (1) ←→ (n) document_chunks
```

---

## RAG Pipeline

### Document Processing Flow
```
1. User uploads PDF/doc
   │
   ▼
2. File stored in Supabase Storage
   │
   ▼
3. API route /api/process/document triggered
   │
   ├── Extract text (Gemini vision or pdf-parse)
   ├── Chunk into ~500 token segments
   ├── Generate embeddings (Gemini)
   └── Store in document_chunks (pgvector)
   │
   ▼
4. Ready for search/RAG
```

### Search Flow
```
1. User asks question
   │
   ▼
2. Generate query embedding (Gemini)
   │
   ▼
3. Vector search in pgvector
   │
   ├── User's documents
   └── Shared course knowledge (optional)
   │
   ▼
4. Return top-k relevant chunks
   │
   ▼
5. Augment prompt + send to Gemini
   │
   ▼
6. Return AI response
```

---

## Nebula API Integration

### Purpose
Cross-reference user courses with official UTD data:
- Course descriptions, prerequisites
- Professor information
- Section schedules
- Grade distributions

### Data Flow
```
1. User adds class "CS 2340"
   │
   ▼
2. Parse course code → subject_prefix: "CS", course_number: "2340"
   │
   ▼
3. Query Nebula API for course details
   │
   ▼
4. Store in classes table with nebula_course_id
   │
   ▼
5. Optionally embed course info for RAG
```

### Available Endpoints (via Nebula API)
- `/course` - Course catalog
- `/section` - Class sections with schedules
- `/professor` - Professor info
- `/grades` - Grade distributions

---

## Privacy & Security

### User Data Isolation
- All queries filter by `user_id`
- RLS policies enforce at database level
- API routes verify session

### Sharing Controls (user settings)
- `share_resources: boolean` - Opt-in to share documents
- `allow_parsing: boolean` - Allow AI to parse documents

### Sensitive Data
- Never store API keys in frontend
- Use Vercel API routes for external API calls
- Service key only used server-side

---

## File Structure

```
taskmaster-web-client/
├── api/                      # Vercel API routes (serverless)
│   ├── gemini/
│   │   ├── chat.ts          # AI chat endpoint
│   │   └── embed.ts         # Generate embeddings
│   ├── nebula/
│   │   ├── courses.ts       # Course search
│   │   └── professors.ts    # Professor search
│   └── process/
│       └── document.ts      # Document processing
├── src/
│   ├── components/          # React components
│   ├── context/             # React context (user, theme)
│   ├── pages/               # Page components
│   ├── services/
│   │   ├── api/             # API service modules
│   │   │   ├── authService.ts
│   │   │   ├── taskService.ts
│   │   │   ├── nebulaService.ts  # Nebula API client
│   │   │   └── ...
│   │   └── types.ts         # TypeScript types
│   └── lib/
│       └── supabase.ts      # Supabase client
└── supabase-*.sql           # Database setup scripts
```

---

## SQL Scripts to Run (in order)

1. `supabase-ALL-TABLES.sql` - Core tables
2. `supabase-PGVECTOR.sql` - Vector search setup
3. `supabase-STORAGE-BUCKETS.sql` - File storage
4. `supabase-INDEXES.sql` - Performance indexes
5. `supabase-FIX-RLS.sql` - RLS policies

---

## Development Setup

```bash
# Clone and install
cd taskmaster-web-client
npm install

# Create .env.local with Supabase credentials
cp .env.example .env.local

# Run locally
npm run dev
```

---

## Deployment

1. Push to GitHub
2. Vercel auto-deploys from main branch
3. Set environment variables in Vercel dashboard
4. Run SQL scripts in Supabase dashboard

---

## External Resources

- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Nebula API Docs](https://api.utdnebula.com/swagger/index.html)
- [UTD CourseBook](https://coursebook.utdallas.edu/)
- [pgvector Docs](https://github.com/pgvector/pgvector)


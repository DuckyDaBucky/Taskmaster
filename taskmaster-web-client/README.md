# TaskMaster

Student productivity app for UTD with AI-powered study assistant.

## ✨ Recent Updates

**🤖 AI Assistant Enhanced!** The AI is now deeply integrated with your TaskMaster data:
- Knows your tasks, classes, deadlines, and events
- Provides personalized study recommendations  
- Guides you through platform features
- Remembers conversation context

See [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md) for examples and [AI_INTEGRATION_SUMMARY.md](./AI_INTEGRATION_SUMMARY.md) for technical details.

## Setup

```bash
npm install
cp env.example .env.local  # Add your keys
npm run dev
```

## Structure

```
src/
├── components/          # UI components
├── pages/               # Route pages
├── services/api/        # Database calls (Supabase)
├── context/             # User, Theme state
└── lib/supabase.ts      # Supabase client

api/                     # Vercel serverless (AI)
├── gemini/chat.ts       # AI chat
└── gemini/embed.ts      # Embeddings
```

## Database

Run in Supabase SQL Editor (in order):
1. `supabase-ALL-TABLES.sql`
2. `supabase-PGVECTOR.sql`
3. `supabase-COURSE-CATALOG.sql`
4. `supabase-STORAGE-BUCKETS.sql`
5. `supabase-INDEXES.sql`
6. `supabase-FIX-RLS.sql`

## Environment

**Local** (`.env.local`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Vercel Dashboard**:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

## Services

| File | Purpose |
|------|---------|
| `authService.ts` | Login, signup, profile |
| `taskService.ts` | Tasks CRUD |
| `classService.ts` | Classes CRUD |
| `eventService.ts` | Calendar events |
| `resourceService.ts` | File uploads |
| `flashcardService.ts` | Flashcards |
| `courseCatalogService.ts` | UTD courses |

## AI Pipeline

```
User Question
    ↓
/api/gemini/chat (Vercel serverless)
    ↓
[TODO: RAG context from pgvector]
    ↓
Gemini API
    ↓
Response
```

## TODO

- [ ] RAG: Query pgvector for relevant docs
- [ ] Document processing: Extract text from uploads
- [ ] Nebula API: UTD course data (waiting on key)
- [ ] Calendar sync: Google, Microsoft

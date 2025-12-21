# Architecture

## Project Structure
```
taskmaster-client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # Auth-guarded routes
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── classes/
│   │   │   ├── resources/
│   │   │   ├── flashcards/
│   │   │   ├── friends/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── layout.tsx      # Auth wrapper
│   │   ├── api/                # Backend API Routes
│   │   │   ├── gemini/chat/    # AI chatbot
│   │   │   ├── nebula/courses/ # UTD course search
│   │   │   └── documents/      # Document analysis
│   │   ├── login/
│   │   ├── signup/
│   │   ├── layout.tsx          # Root layout
│   │   └── providers.tsx       # Client contexts
│   ├── client-pages/           # Client component implementations
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # Sidebar, PageLayout
│   │   ├── tasks/              # TaskList, TaskModal
│   │   ├── ui/                 # Cards, buttons
│   │   └── AIAssistant.tsx     # AI chat widget
│   ├── context/                # React Contexts
│   │   ├── UserContext.tsx     # User state
│   │   └── ThemeContext.tsx    # Theme state
│   ├── services/               # API service layer
│   │   └── api/                # Supabase operations
│   │       ├── index.ts        # Export all services
│   │       ├── authService.ts
│   │       ├── taskService.ts
│   │       ├── classService.ts
│   │       └── ...
│   ├── lib/                    # Supabase client (browser)
│   ├── utils/supabase/         # SSR Supabase clients
│   └── constants/              # Theme tokens
├── public/                     # Static assets
└── middleware.ts               # Auth session refresh
```

## Route Groups: `(protected)`
The parentheses in `(protected)` create a **Next.js Route Group**. It doesn't appear in URLs but shares a common layout that enforces authentication.

```
URL: /dashboard  → File: src/app/(protected)/dashboard/page.tsx
URL: /tasks      → File: src/app/(protected)/tasks/page.tsx
```

## Data Flow
```
Browser → Next.js (Vercel) → Supabase (Database/Auth)
                           → Gemini API (AI)
                           → Nebula API (Courses)
```

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 16 | SSR, routing, API routes |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS | Utility-first CSS |
| Database | Supabase (Postgres) | Data, auth, storage |
| AI | Google Gemini | Chatbot, document analysis |
| Vectors | pgvector | Similarity search for RAG |
| Hosting | Vercel | Serverless deployment |

## SSR Authentication
Supabase sessions use cookies (not localStorage) for SSR compatibility:
- `lib/supabase.ts` - Browser client for client components
- `utils/supabase/server.ts` - Server client for SSR pages
- `utils/supabase/client.ts` - Browser client factory
- `middleware.ts` - Refreshes auth tokens on every request

## Service Layer Pattern
All Supabase calls go through `src/services/api/`. Never call `supabase.from()` directly in components.

```typescript
// ✓ Correct
import { taskService } from '@/services/api';
const tasks = await taskService.getAllTasks();

// ✗ Avoid
const { data } = await supabase.from('tasks').select('*');
```

# Features

## Authentication
- **Provider**: Supabase Auth (email/password)
- **Service**: `authService.ts`
- **Context**: `UserContext` provides `user`, `logout`, `refreshUser`
- **Flow**: Login → Supabase cookie → Middleware refresh → SSR session

## Dashboard
- **Stats Widget**: Task counts, streak, points
- **Activity Chart**: Weekly task completion
- **Progress Chart**: Completion rates by class
- **Lazy Loading**: Charts load dynamically

## Tasks
- **CRUD**: Create, read, update, delete via `taskService.ts`
- **Fields**: Title, deadline, priority, class, completion status
- **Views**: List view, timeline view
- **Filters**: All, pending, completed

## Classes
- **Purpose**: Organize tasks by course/subject
- **Personal Class**: Auto-created for non-course tasks
- **Syllabus Upload**: AI extracts schedule and deadlines

## Calendar
- **Library**: `react-big-calendar`
- **Events**: Task deadlines + standalone events
- **Views**: Month, week, day

## Resources
- **Purpose**: Upload study materials (PDFs, images, notes)
- **Storage**: Supabase Storage bucket
- **AI Analysis**: Extracts summaries and metadata

## Flashcards
- **Decks**: Grouped by class/topic
- **Player**: Flip-card UI with progress tracking

## Streaks
- **Purpose**: Gamification for daily usage
- **Logic**: `streakService.ts` tracks consecutive login days

---

## AI Features

### AI Assistant (Chatbot)
Floating chat widget with context-aware assistance.

**Components**:
- `AIAssistant.tsx` - UI widget
- `aiContextService.ts` - Builds user context
- `/api/gemini/chat` - Gemini API route

**Flow**:
1. User opens chat
2. System loads tasks, classes, events as context
3. User message + context sent to Gemini
4. Response displayed in chat

### Document Analysis
Upload PDFs/images for AI-powered extraction.

**Endpoint**: `/api/documents/analyze`
- Uses Gemini vision for document understanding
- Extracts dates, topics, key information

### RAG System (In Progress)
Retrieval-Augmented Generation for document Q&A.

**Status**: Partially implemented
- ✓ Document upload and storage
- ✓ Basic AI analysis
- ○ Chunking pipeline (needs work)
- ○ Embedding generation (needs integration)
- ○ Vector search (pgvector ready, RPC needs tuning)

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Profiles, streak, points |
| `classes` | Courses/subjects |
| `tasks` | Assignments |
| `resources` | Uploaded files |
| `flashcards` | Study cards |
| `events` | Calendar events |
| `activities` | Activity log |
| `document_chunks` | RAG vectors |

# Getting Started: Gemini File Search

This guide explains how to set up and work with the Gemini File Search implementation in Taskmaster.

## Prerequisites

1. **Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/apikey)
2. **Supabase Project** - With the database tables created
3. **Node.js 18+** and pnpm/npm

## Environment Setup

Add these to your `.env` or Vercel environment variables:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Supabase (use service role for server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional (for client-side)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Database Setup

Run the migration SQL in Supabase SQL Editor:

```sql
-- Location: Documentation/migrations/001_gemini_file_search.sql
```

This creates two tables:
- `file_search_stores` - One store per user
- `file_search_files` - Tracks indexed files with metadata

## API Endpoints

### 1. Create a Store
Before uploading files, each user needs a File Search Store:

```typescript
// POST /api/files/store
const response = await fetch('/api/files/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'uuid-here',
    display_name: 'My Study Materials'  // optional
  })
});

const { store } = await response.json();
// store.name = "fileSearchStores/abc123..."
```

### 2. Upload & Index a File
After uploading a file to Supabase Storage, trigger indexing:

```typescript
// POST /api/files/upload
const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'uuid-here',
    file_url: 'https://your-bucket.supabase.co/storage/v1/object/public/resources/file.pdf',
    resource_id: 'optional-resource-uuid',
    class_id: 'optional-class-uuid'
  })
});

const { file, metadata } = await response.json();
// file.name = "files/xyz789..."
// metadata = { title, type, dates, topics }
```

### 3. Search Documents
Query the user's knowledge base:

```typescript
// POST /api/files/search
const response = await fetch('/api/files/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'uuid-here',
    query: 'What are the exam dates for this semester?',
    output_format: 'json'  // optional: 'json', 'flashcards', 'schedule'
  })
});

const { response: answer, data, sources } = await response.json();
```

#### Output Formats
| Format | Description |
|--------|-------------|
| `undefined` | Natural language response |
| `json` | Raw JSON extraction |
| `flashcards` | Array of `{front, back, tags}` objects |
| `schedule` | Array of `{date, title, type}` objects |

## Integration with Existing Code

The `resourceService.ts` already calls `/api/files/upload` when a user uploads a document:

```typescript
// src/services/api/resourceService.ts
async triggerProcessing(resourceId, userId, fileUrl, classId) {
  await fetch('/api/files/upload', {
    method: 'POST',
    body: JSON.stringify({ resource_id: resourceId, user_id: userId, file_url: fileUrl, class_id: classId })
  });
}
```

## Local Development

```bash
cd taskmaster-web-client

# Install dependencies
pnpm install

# Start dev server (frontend + API routes via Vite)
pnpm dev

# Or test API routes with Vercel CLI
vercel dev
```

## Testing the Endpoints

### Using cURL

```bash
# Create store
curl -X POST http://localhost:3000/api/files/store \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-uuid"}'

# Upload file
curl -X POST http://localhost:3000/api/files/upload \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-uuid", "file_url": "https://example.com/syllabus.pdf"}'

# Search
curl -X POST http://localhost:3000/api/files/search \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-uuid", "query": "When is the final exam?"}'
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Vercel API      │────▶│  Gemini API     │
│   (React)       │     │  /api/files/*    │     │  File Search    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Supabase       │
                        │   - Storage      │
                        │   - Postgres     │
                        └──────────────────┘
```

1. **Upload Flow**: Frontend → Supabase Storage → `/api/files/upload` → Gemini File Search
2. **Search Flow**: Frontend → `/api/files/search` → Gemini (queries indexed docs) → Response with sources

## Troubleshooting

### "No document store found"
User hasn't uploaded any documents yet. The store is created automatically on first upload.

### "GEMINI_API_KEY not configured"
Add `GEMINI_API_KEY` to your environment variables.

### File upload fails
- Check the file URL is publicly accessible
- Supported formats: PDF, TXT, MD, DOC, DOCX
- Max file size: 20MB per file

### Search returns empty results
- Wait a few seconds after upload for indexing to complete
- Check the file was successfully indexed in `file_search_files` table

## Next Steps

- [ ] Integrate search into the AI chatbot (`AIAssistant.tsx`)
- [ ] Add UI to view indexed files
- [ ] Build flashcard generation flow using `/api/files/search?output_format=flashcards`
- [ ] Add syllabus deadline extraction for calendar integration

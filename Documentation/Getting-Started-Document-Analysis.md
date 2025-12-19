# Getting Started: Document Analysis

This guide explains how to set up and use the document analysis feature in Taskmaster.

## Prerequisites

1. **Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/apikey)
2. **Supabase Project** - With the resources table
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
-- Location: Documentation/migrations/001_document_analysis.sql
```

This adds columns to the `resources` table:
- `ai_summary` - AI-generated summary
- `extracted_data` - JSONB with structured metadata
- `processing_status` - Track analysis progress

## API Endpoints

### 1. Analyze a Document
After uploading a file to Supabase Storage, trigger analysis:

```typescript
// POST /api/documents/analyze
const response = await fetch('/api/documents/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resource_id: 'uuid-of-resource',
    user_id: 'user-uuid',
    file_url: 'https://your-bucket.supabase.co/storage/v1/object/public/resources/file.pdf',
    file_name: 'syllabus.pdf'
  })
});

const { success, analysis } = await response.json();
// analysis = { summary, document_type, course_number, key_topics, due_dates, ... }
```

### 2. Query Documents
Ask questions about your uploaded documents:

```typescript
// POST /api/documents/query
const response = await fetch('/api/documents/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'uuid-here',
    query: 'What are the exam dates for this semester?',
    output_format: 'schedule'  // optional: 'json', 'flashcards', 'schedule'
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
| `schedule` | Array of `{date, title, type, course}` objects |

## Integration with Existing Code

The `resourceService.ts` automatically calls `/api/documents/analyze` when a user uploads a document:

```typescript
// src/services/api/resourceService.ts
async triggerProcessing(resourceId, userId, fileUrl, classId) {
  await fetch('/api/documents/analyze', {
    method: 'POST',
    body: JSON.stringify({ 
      resource_id: resourceId, 
      user_id: userId, 
      file_url: fileUrl 
    })
  });
}
```

## Local Development

```bash
cd taskmaster-web-client

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Or test API routes with Vercel CLI
vercel dev
```

## Testing the Endpoints

### Using cURL

```bash
# Analyze a document
curl -X POST http://localhost:3000/api/documents/analyze \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "uuid", "user_id": "uuid", "file_url": "https://..."}'

# Query documents
curl -X POST http://localhost:3000/api/documents/query \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid", "query": "When is the final exam?"}'
```

## Architecture Overview

```
User uploads file
       |
       v
Supabase Storage (file stored)
       |
       v
/api/documents/analyze
       |
       v
Gemini API (PDF vision analysis)
       |
       v
resources.extracted_data (metadata saved)
       |
       v
/api/documents/query (uses metadata as context)
```

## Troubleshooting

### "GEMINI_API_KEY not configured"
Add `GEMINI_API_KEY` to your environment variables.

### Document analysis fails
- Check the file URL is publicly accessible
- Supported formats: PDF, images, text files
- Max file size: ~20MB (Gemini limit)

### Query returns no context
- Wait for documents to finish processing (status = 'complete')
- Check `processing_status` column in resources table

### Timeout on Vercel
- Hobby plan has 10s limit, Pro has 60s
- Large PDFs may need Pro plan
- Consider chunking very large documents

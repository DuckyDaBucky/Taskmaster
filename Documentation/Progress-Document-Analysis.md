# Progress: Document Analysis

## Abstract
- **STATUS: IMPLEMENTED**
- Uses Gemini's native document understanding (PDF vision) for analysis.
- Stores extracted metadata in the existing `resources` table - no new tables needed.
- Simple, reliable approach that works on Vercel serverless.

## Current Implementation

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents/analyze` | POST | Analyze document and extract metadata |
| `/api/documents/query` | POST | Query user's documents with context |

### How It Works

1. **Upload Flow**:
   - User uploads file via ResourcesPage
   - File stored in Supabase Storage
   - `resourceService.triggerProcessing()` calls `/api/documents/analyze`
   - Gemini analyzes document (PDF vision or text)
   - Extracted data saved to `resources.extracted_data` JSONB column

2. **Query Flow**:
   - User asks a question via `/api/documents/query`
   - Backend fetches user's processed resources with summaries
   - Builds context from extracted metadata
   - Sends to Gemini with context for grounded response

### Database Schema
No new tables needed. Uses existing `resources` table with these columns:
- `ai_summary` (TEXT) - AI-generated summary
- `extracted_data` (JSONB) - Structured metadata
- `processing_status` (TEXT) - pending/processing/complete/failed

### Extracted Data Structure
```json
{
  "document_type": "syllabus|assignment|notes|exam|lecture|project|other",
  "course_number": "CS3305",
  "course_name": "Data Structures",
  "professor": "Dr. Smith",
  "key_topics": ["arrays", "linked lists", "trees"],
  "due_dates": [
    {"date": "2025-01-15", "description": "Homework 1"}
  ],
  "analyzed_at": "2025-01-01T00:00:00Z"
}
```

## Why This Approach?

### Benefits
- Works with standard REST API (no Python SDK needed)
- No new infrastructure or tables
- Faster - single API call vs multi-step process
- Reliable on Vercel (10-60s timeout)
- Easier to debug and maintain

## Legacy Implementations (Deleted)
- `api/search/rag.ts` - pgvector similarity search
- `api/process/document.ts` - manual chunking pipeline
- `api/files/*` - File Search API attempt

## Supported File Types
- PDF (native vision - best quality)
- Images (JPG, PNG, WebP, GIF)
- Text files (TXT, MD, CSV)
- Word documents (basic support)

## Query Output Formats
The `/api/documents/query` endpoint supports:
- Default: Natural language response
- `output_format: 'flashcards'` - JSON array of {front, back, tags}
- `output_format: 'schedule'` - JSON array of {date, title, type, course}
- `output_format: 'json'` - Raw JSON response

## Future Improvements
- Add caching for frequently queried documents
- Implement Gemini context caching for cost savings
- Integrate with AI chatbot for document-aware responses

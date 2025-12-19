# Progress: RAG (Retrieval-Augmented Generation)

## Abstract
- **STATUS: MIGRATED TO GEMINI FILE SEARCH** ✅
- The old pgvector + manual chunking pipeline has been removed and replaced with Google's managed RAG solution.
- Goal: Retrieve relevant content from user documents (syllabi, notes, assignments) using Gemini File Search, then provide grounded context to the LLM for accurate answers.

## Current Implementation (Gemini File Search)

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files/store` | POST | Create a File Search Store for a user |
| `/api/files/store` | GET | Get user's store info |
| `/api/files/store` | DELETE | Delete user's store and all indexed files |
| `/api/files/upload` | POST | Upload & index a file to user's store |
| `/api/files/search` | POST | Query user's knowledge base |

### Database Tables
- `file_search_stores` - One store per user, tracks Gemini store reference
- `file_search_files` - Tracks each indexed file with extracted metadata

### Flow
1. **Upload**: User uploads document → stored in Supabase Storage → `/api/files/upload` sends to Gemini
2. **Index**: Gemini automatically chunks, embeds, and indexes the document
3. **Search**: `/api/files/search` queries with FileSearch tool → returns grounded answers with sources

## Legacy Implementation (Deleted)
The following files were **removed** as part of the migration:
- ~~`api/search/rag.ts`~~ - pgvector similarity search
- ~~`api/process/document.ts`~~ - manual chunking/embedding pipeline

## Why Gemini File Search?
Implementing **Gemini File Search** (Google's managed RAG) eliminates the need to manage vector databases or write complex chunking logic. Google handles embedding, storage, and retrieval behind the scenes—zero maintenance.

#### Why Gemini File Search?
- **Persistent Storage**: Unlike temporary file uploads (48hr expiry), File Search Stores keep documents indexed indefinitely.
- **Automatic Chunking & OCR**: Google handles PDF parsing, table extraction, and optimal chunking strategies.
- **Free Tier**: High rate limits (15 req/min) under AI Studio; supports Gemini 1.5/2.5 Flash with 1M+ token context.
- **Structured Outputs**: JSON mode for extracting schedules, deadlines, and flashcard-ready content.

#### Technical Blueprint

**1. File Search Store Setup (Python SDK)**
```python
from google import genai
import time

client = genai.Client(api_key="YOUR_API_KEY")

# Create persistent store
store = client.file_search_stores.create(
    config={'display_name': 'Taskmaster_Knowledge_Base_2025'}
)

# Upload documents (automatic indexing)
operation = client.file_search_stores.upload_to_file_search_store(
    file='syllabus_cs2336.pdf',
    file_search_store_name=store.name
)

# Wait for indexing
while not operation.done:
    time.sleep(2)
    operation = client.operations.get(name=operation.name)

print("Document indexed and ready for retrieval")
```

**2. Structured Query with JSON Output**
```python
from google.genai import types

# Define File Search tool
tool = types.Tool(
    file_search=types.FileSearch(file_search_store_names=[store.name])
)

# Query for structured data
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents="Extract all exam dates and assignment deadlines. Output ONLY as JSON.",
    config=types.GenerateContentConfig(tools=[tool])
)

print(response.text)  # Returns JSON schedule
```

**3. Flashcard Generation Workflow**
```python
# Dual-source prompt for context-aware flashcards
prompt = """
Using the syllabus as a guide for what's important, and the Lecture 4 notes 
for details, generate 5 Anki-ready flashcards for the upcoming quiz.

Format as JSON:
[
  {"front": "Question", "back": "Answer", "tags": ["lecture4", "midterm"]},
  ...
]
"""

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config=types.GenerateContentConfig(tools=[tool])
)
```

#### Document Type Best Practices
- **Syllabi**: Upload as PDFs. OCR handles tables/dates optimally.
- **Lecture Notes**: Convert to Markdown with `#` headers and `-` bullets for hierarchical parsing.
- **Contextual Queries**: Use "dual-source" prompts (syllabus + notes) for richer flashcards.

#### Resources
- [Gemini File Search API Docs](https://ai.google.dev/gemini-api/docs/file-search)

## Known Limitations
- File Search requires files to be uploaded to Gemini's servers (not just referenced by URL)
- Indexing is asynchronous—large documents may take a few seconds
- Rate limits: 15 requests/min on free tier (AI Studio)
- Maximum 100 files per store (can create multiple stores if needed)

## Future Improvements
- Integrate File Search into the AI chatbot for context-aware responses
- Add support for multiple stores per user (per class/subject)
- Build UI for viewing indexed files and their extracted metadata
- Add reranking layer for improved relevance
- Cache frequent queries for faster responses

## Migration Completed ✅
All integration plan items have been completed:
1. ✅ Replaced `api/process/document.ts` with `/api/files/upload`
2. ✅ Created store management at `/api/files/store`
3. ✅ Created search endpoint at `/api/files/search`
4. ✅ Added structured output support (JSON, flashcards, schedule formats)
5. ⏸️ n8n integration is optional for power users

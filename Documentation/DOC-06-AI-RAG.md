# DOC-06: RAG System

> **STATUS: INCOMPLETE**
> This feature is partially implemented and requires further development.

## What is RAG?
RAG (Retrieval-Augmented Generation) allows the AI to answer questions by retrieving relevant information from your uploaded documents. Instead of relying only on its training data, the AI searches your notes, syllabi, and PDFs for context.

## Intended User Flow
1. User uploads a syllabus or study guide.
2. System chunks the document into smaller pieces.
3. Each chunk is converted to a vector embedding.
4. Embeddings are stored in Supabase (pgvector).
5. User asks: "When is my CS3345 midterm?"
6. System finds the most relevant chunks via similarity search.
7. Chunks are passed to Gemini as context.
8. Gemini provides a grounded answer citing the document.

## Current State

### What Works
- **Document Upload**: Files are stored in Supabase Storage.
- **Basic Analysis**: `POST /api/documents/analyze` uses Gemini's vision to extract metadata.
- **Metadata Storage**: Results saved to `resources.extracted_data` (JSONB).

### What Needs Work
- **Chunking Pipeline**: Code exists but not fully wired.
- **Embedding Generation**: Needs integration with Hugging Face or Gemini embeddings API.
- **Vector Search**: Supabase `pgvector` is set up, but RPC functions need tuning.
- **Query Endpoint**: `/api/documents/query` exists but doesn't use vector search yet.

## Database Schema
```sql
-- document_chunks table
id UUID PRIMARY KEY,
resource_id UUID REFERENCES resources(id),
user_id UUID,
content TEXT,
embedding VECTOR(768),
metadata JSONB,
created_at TIMESTAMP
```

## TODO
1. Complete embedding generation using Hugging Face Inference API.
2. Wire `/api/documents/query` to call `match_user_documents` RPC.
3. Implement chunk overlap for better context retrieval.
4. Add caching for frequently queried documents.
5. Build UI to show document sources in AI responses.

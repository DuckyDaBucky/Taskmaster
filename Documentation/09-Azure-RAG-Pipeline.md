# Azure RAG Pipeline Documentation

> **Last Updated:** January 2026  
> **Stack:** Azure Document Intelligence + Azure OpenAI (GPT-5.2) + Supabase

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   PDF Upload    │────▶│  Azure Doc Intel     │────▶│   GPT-5.2       │
│   (Supabase)    │     │  (prebuilt-layout)   │     │   (Structured   │
│                 │     │  → Markdown Output   │     │    JSON)        │
└─────────────────┘     └──────────────────────┘     └────────┬────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │   Supabase DB   │
                                                     │  (Classes, Tasks)│
                                                     └─────────────────┘
```

---

## Technologies Used

| Component | Technology | Purpose |
|-----------|------------|---------|
| **OCR ("The Eyes")** | Azure Document Intelligence | Extract text + tables from PDFs as Markdown |
| **LLM ("The Brain")** | Azure OpenAI GPT-5.2 | Parse Markdown into structured JSON |
| **Storage** | Supabase Storage | Store uploaded PDF files |
| **Database** | Supabase PostgreSQL | Store classes, tasks, resources |
| **Frontend** | Next.js 16 | React framework with API routes |

---

## Pipeline Flow

### Step 1: Document Upload
- User uploads PDF via `/classes` page
- File stored in Supabase Storage bucket `resources`
- `triggerProcessing()` called to start analysis

### Step 2: Azure Document Intelligence
- **Model:** `prebuilt-layout`
- **Output:** Markdown (preserves tables/structure)
- **Endpoint:** `POST /documentModels/prebuilt-layout:analyze`

```typescript
const result = await client.path("/documentModels/{modelId}:analyze", "prebuilt-layout")
  .post({ urlSource: fileUrl, outputContentFormat: "markdown" });
```

### Step 3: LLM Structured Extraction
- **Model:** GPT-5.2 (via Azure OpenAI)
- **Input:** Markdown from Step 2
- **Output:** Strict JSON matching schema

```json
{
  "document_type": "syllabus",
  "course_info": {
    "course_number": "CS2340",
    "course_name": "Computer Architecture",
    "professor": "Dr. Wang"
  },
  "tasks": [
    { "title": "Midterm Exam", "due_date": "2026-03-15", "priority": "high" }
  ]
}
```

### Step 4: Database Hydration
- Creates/links `Class` record in Supabase
- Inserts `Task` records with deadlines

---

## API Endpoints

### `POST /api/documents/analyze-azure`
Main pipeline endpoint. Analyzes uploaded documents.

**Request:**
```json
{
  "resource_id": "uuid",
  "user_id": "uuid", 
  "file_url": "https://...",
  "file_name": "Syllabus.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "class_id": "uuid",
  "tasks_created": 12,
  "data": { /* structured extraction */ }
}
```

### `POST /api/chat`
AI Assistant chat endpoint.

### `POST /api/documents/query`
Query documents with context (RAG-style Q&A).

---

## Environment Variables

```bash
# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5.2
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## Usage Example

```bash
# Upload a syllabus via curl
curl -X POST http://localhost:3000/api/documents/analyze-azure \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "test-123",
    "user_id": "your-user-id",
    "file_url": "https://your-supabase.co/storage/v1/object/public/resources/syllabus.pdf"
  }'
```

---

## Key Files

| File | Description |
|------|-------------|
| `src/app/api/documents/analyze-azure/route.ts` | Main pipeline |
| `src/app/api/chat/route.ts` | AI Assistant |
| `src/app/api/documents/query/route.ts` | Document Q&A |
| `src/services/api/resourceService.ts` | Frontend upload handler |

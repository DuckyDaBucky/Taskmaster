# DOC-08: Tech Stack Explained

## Overview
This document explains the technologies used in Taskmaster and why they were chosen. If you're new to web development, start here.

---

## Frontend

### Next.js (React Framework)
**What it is**: A framework built on top of React that adds server-side rendering, routing, and API routes.

**Why we use it**:
- Pages load instantly because content is rendered on the server.
- No separate backend server needed; API routes are built-in.
- Automatic code splitting for faster page loads.
- Optimized for Vercel deployment.

**Key files**:
- `src/app/` - Pages and routes (App Router).
- `src/components/` - Reusable UI pieces.

### TypeScript
**What it is**: JavaScript with type annotations.

**Why we use it**:
- Catches errors before runtime.
- Better IDE autocomplete.
- Self-documenting code.

### TailwindCSS
**What it is**: A utility-first CSS framework.

**Why we use it**:
- Fast styling with utility classes.
- No context switching between CSS files.
- Easy dark mode support.

---

## Backend

### Supabase
**What it is**: An open-source Firebase alternative providing Database, Auth, Storage, and Realtime.

**Why we use it** (instead of a custom Node.js server):
- Managed Postgres database with a REST API.
- Built-in authentication (email, OAuth).
- File storage with CDN.
- Row-Level Security for data protection.
- pgvector for AI embeddings.

**Key concepts**:
- **Tables**: Like spreadsheets. We have `users`, `tasks`, `classes`, `resources`.
- **RLS**: Rules that control who can read/write data.
- **Storage**: File uploads (syllabi, notes).

### Next.js API Routes
**What they are**: Serverless functions that run on Vercel.

**Where they live**: `src/app/api/`

**Examples**:
- `/api/gemini/chat` - AI chatbot.
- `/api/nebula/courses` - UTD course search.
- `/api/documents/analyze` - Document AI analysis.

---

## AI

### Google Gemini
**What it is**: Google's large language model API.

**How we use it**:
- Chatbot responses.
- Document analysis (vision for PDFs).
- Flashcard generation (planned).

### pgvector (Supabase)
**What it is**: PostgreSQL extension for vector similarity search.

**How we use it**:
- Store document embeddings.
- Find similar content for RAG.

---

## Deployment

### Vercel
**What it is**: A cloud platform optimized for Next.js.

**Why we use it**:
- One-click deploy from GitHub.
- Automatic HTTPS.
- Serverless functions scale automatically.
- Free tier is generous.

---

## Summary Table

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js | SSR, routing, API routes |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS | Utility-first CSS |
| Database | Supabase (Postgres) | Data storage, auth, storage |
| AI | Google Gemini | Chatbot, document analysis |
| Vectors | pgvector | Similarity search for RAG |
| Hosting | Vercel | Serverless deployment |

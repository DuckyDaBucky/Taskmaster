# TaskMaster Client

Next.js web application for TaskMaster - AI-powered study assistant for university students.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/taskmaster)

### Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Azure OpenAI (Required for AI features)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5-nano
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Azure Document Intelligence (Required for syllabus parsing)
AZURE_DOC_INTEL_ENDPOINT=https://your-di-resource.cognitiveservices.azure.com
AZURE_DOC_INTEL_KEY=your-di-key
```

## Features

- 🤖 **Agentic AI Assistant** - Creates flashcards, completes tasks, queries documents
- 📄 **Syllabus Parsing** - Azure Document Intelligence + GPT-5 for structured extraction
- ✅ **Task Management** - Track assignments with overdue detection
- 📚 **AI Flashcards** - Auto-generate from course materials
- 📅 **Calendar Integration** - Visual task and event scheduling
- 🎨 **Multiple Themes** - Dark, Light, Frost, Retro, and more

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (protected)/  # Auth-guarded pages
│   └── api/          # API routes (serverless)
├── components/       # UI components
├── services/api/     # Database operations
├── context/          # React contexts (User, Theme)
├── lib/              # Supabase client
└── utils/supabase/   # SSR Supabase clients
```

## AI Capabilities

The chatbot can:

- **Create Flashcards** - "Make flashcards about Exam 3"
- **Complete Tasks** - "I finished my homework"
- **Query Documents** - "What's the grading policy?"
- **Get Tasks** - "What's due this week?"
- **Get Classes** - "Show me my classes"

## Documentation

See the main [Documentation](../Documentation) folder for:

- [Getting Started](../Documentation/01-Getting-Started.md)
- [Architecture Overview](../Documentation/02-Architecture.md)
- [Azure RAG Pipeline](../Documentation/09-Azure-RAG-Pipeline.md)

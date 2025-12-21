# TaskMaster

AI-powered academic productivity app for students.

## Architecture

```
┌────────────────────────────────────┐
│         taskmaster-client          │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ Next.js App │  │ API Routes   │ │
│  │ (Frontend)  │  │ (Serverless) │ │
│  └──────┬──────┘  └──────┬───────┘ │
└─────────┼────────────────┼─────────┘
          │                │
          ▼                ▼
     ┌─────────┐      ┌─────────┐
     │Supabase │      │ Gemini  │
     │ (DB)    │      │ (AI)    │
     └─────────┘      └─────────┘
```

**Serverless architecture.** Supabase handles database/auth, Vercel handles hosting/AI.

## Quick Start

```bash
cd taskmaster-client
npm install
npm run dev
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GEMINI_API_KEY=your_gemini_key
```

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Set root directory: `taskmaster-client`
4. Add environment variables in Vercel dashboard

## Project Structure

```
taskmaster-client/
├── src/
│   ├── app/            # Next.js pages + API routes
│   │   ├── (protected)/ # Auth-guarded routes
│   │   └── api/         # Serverless functions
│   ├── components/      # UI components
│   ├── services/api/    # Database operations
│   ├── context/         # React contexts
│   └── lib/             # Supabase client
└── Documentation/       # Project docs
```

## Documentation

See the [Documentation](./Documentation) folder:
- `01-Getting-Started.md` - Setup and deployment
- `02-Architecture.md` - Project structure and tech stack
- `03-Features.md` - All features and AI capabilities
- `04-Contributing.md` - Development workflow
- `Roadmap.md` - Future features

## Features

- 📋 **Tasks** - Create, organize, track assignments
- 📅 **Calendar** - Visual schedule with deadlines
- 📚 **Classes** - Organize by course/subject
- 🗂️ **Resources** - Upload study materials
- 🃏 **Flashcards** - Study and review
- 🤖 **AI Assistant** - Context-aware help
- 🔥 **Streaks** - Gamified daily usage

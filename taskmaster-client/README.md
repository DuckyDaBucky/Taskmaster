# TaskMaster Client

Next.js web application for TaskMaster.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

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

## Documentation

See the main [Documentation](../Documentation) folder for:
- Getting started guide
- Architecture overview
- Feature documentation
- Contributing guide

# DOC-00: Getting Started

## Prerequisites
- Node.js 18+
- npm or pnpm
- A Supabase project (free tier works)
- A Gemini API key (for AI features)

## Quick Start
```bash
# Clone and navigate
cd taskmaster-client

# Install dependencies
npm install

# Configure environment
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key

# Start development server
npm run dev
```
The app runs at `http://localhost:3000`.

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `SUPABASE_SERVICE_KEY` | Server | For privileged server operations |

## Vercel Deployment
1. Push to GitHub.
2. Import project in Vercel.
3. Add all environment variables in Vercel Settings.
4. Deploy.

Next.js App Router and API Routes are automatically configured for Vercel's serverless infrastructure.

## Development Workflow
1. Run `npm run dev` for local development.
2. Make changes and see hot-reload.
3. Run `npm run build` before deploying to catch errors.
4. Push to `main` for automatic Vercel deployment.

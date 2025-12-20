# DOC-02: Development Philosophy

## Why Next.js over Vite?
The original `taskmaster-web-client` was a Vite + React SPA. We migrated to Next.js for:

1. **Server-Side Rendering (SSR)**: Instant page loads with pre-rendered data. Users see content immediately instead of spinners.
2. **Vercel Integration**: Next.js is built by Vercel. Deployment is one-click with automatic serverless functions.
3. **API Routes**: No separate backend needed. `/api/*` routes are serverless functions, eliminating a whole repository.
4. **Image Optimization**: `next/image` automatically resizes, compresses, and serves modern formats (WebP/AVIF).
5. **App Router**: Layouts, nested routes, and server components simplify complex UIs.

## Why Supabase over MongoDB?
The original backend used Node.js + Express + MongoDB. We switched to Supabase (Postgres) for:

| Aspect | MongoDB | Supabase |
|--------|---------|----------|
| Hosting | Self-managed or Atlas | Fully managed, free tier |
| Auth | Custom JWT implementation | Built-in Auth with providers |
| Realtime | Requires Socket.io | Built-in Postgres Realtime |
| Storage | S3 or custom | Built-in Storage with CDN |
| RLS | None | Row-Level Security policies |
| Vectors | Atlas Vector Search | pgvector (native) |

**Key Benefit:** Supabase consolidates Database, Auth, Storage, and Realtime into one SDK, drastically reducing code complexity.

## Design Principles
1. **Serverless-First**: No long-running servers. Functions spin up on demand.
2. **Edge-Optimized**: Middleware runs at the edge for fast auth checks.
3. **Progressive Enhancement**: SSR provides a baseline; client hydration adds interactivity.
4. **Type Safety**: TypeScript everywhere.
5. **Minimal Dependencies**: Use built-in Next.js features over third-party libraries.

## Code Conventions
- **Services**: All Supabase interactions go through `src/services/api/`. Never call `supabase.from()` directly in components.
- **Contexts**: Global state (User, Theme) lives in `src/context/`.
- **Components**: Reusable UI in `src/components/`. Page-specific logic in `src/client-pages/`.
- **API Routes**: Each route file exports `GET`, `POST`, etc. handlers.

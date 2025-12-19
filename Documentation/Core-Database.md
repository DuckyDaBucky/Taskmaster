# Core: Database

## Abstract
- Supabase Postgres is the primary datastore. Client-side reads/writes use the anon key, while serverless functions use the service role key for privileged operations. RAG search relies on pgvector for embeddings.

## Implementation in Code
- Client configuration: `taskmaster-web-client/src/lib/supabase.ts` initializes the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with session handling.
- Tables in use: `users`, `classes`, `tasks`, `resources`, `document_chunks`. Course data is upserted into `course_catalog` via serverless code in `taskmaster-web-client/api/nebula/courses.ts` and `taskmaster-web-client/api/nebula/search.ts`.
- RAG pipeline: `taskmaster-web-client/api/process/document.ts` extracts text, chunks and embeds content, then inserts into `document_chunks`. Queries are performed via RPC (`match_user_documents`, `match_shared_documents`) in `taskmaster-web-client/api/search/rag.ts`.
- Serverless credentials: Functions use `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` environment variables to create a privileged Supabase client.

## Flaws
- Environment inconsistency (mixing `VITE_SUPABASE_URL` in serverless). Prefer `SUPABASE_URL` server-side.
- RLS policies need auditing to ensure proper client access boundaries.
- Limited transactionality and idempotency across multi-step upserts.
- Lacking documented indexes (e.g., pgvector index on `document_chunks`).

## Evolution & Integrations
- Enforce RLS with roles and Views for constrained reads.
- Add vector indexes and scheduled maintenance (VACUUM/ANALYZE).
- Use Supabase Realtime for live updates; add change audit trails.
- Offload heavy ETL to queues/functions; add caching for hot queries.

## TODO
- Standardize env usage (`SUPABASE_URL` in server; `VITE_*` only client).
- Define and verify RLS policies for all key tables.
- Create pgvector index and tune RPC thresholds/limits.
- Document schema (ERD) and migrations.
# Core: Database

- Overview: Supabase Postgres is the primary datastore. Client-side reads/writes use the anon key via `src/lib/supabase.ts`, and serverless functions use the service role key for privileged operations. Vector search uses pgvector in Supabase.

- Current Implementation:
  - Client config in [taskmaster-web-client/src/lib/supabase.ts](taskmaster-web-client/src/lib/supabase.ts).
  - Tables referenced: `users`, `classes`, `tasks`, `resources`, `document_chunks`; course data persisted to `course_catalog` via serverless [taskmaster-web-client/api/nebula/courses.ts](taskmaster-web-client/api/nebula/courses.ts).
  - RAG data flow: `api/process/document` extracts text, chunks, embeds, inserts into `document_chunks`; queries via RPC functions `match_user_documents` and `match_shared_documents` in [taskmaster-web-client/api/search/rag.ts](taskmaster-web-client/api/search/rag.ts).
  - Service role usage for inserts/upserts within serverless functions (`SUPABASE_SERVICE_KEY`).

- Flaws:
  - Env inconsistency: server code reads `SUPABASE_URL` and `VITE_SUPABASE_URL` interchangeably; prefer `SUPABASE_URL` on server.
  - RLS policy audit needed to ensure proper access for client operations.
  - Write paths span multiple functions; limited transactionality and idempotency for upserts.
  - Missing explicit indexing guidelines (e.g., pgvector index on `document_chunks`).

- Evolution & Integrations:
  - Enforce RLS with role-based policies; add Postgres Views for constrained client reads.
  - Add vector indexes and maintenance jobs (VACUUM/ANALYZE, reindex).
  - Use Supabase Realtime for task/event changes; consider logical decoding for audits.
  - Background job queue (e.g., Vercel Queues / Supabase Functions) for heavy ETL and RAG processing.
  - GraphQL or PostgREST filters for structured reads; caching layer for hot queries.

- TODO:
  - Standardize envs: `SUPABASE_URL` in server, `VITE_SUPABASE_URL` only in client.
  - Create/verify RLS policies for `tasks`, `classes`, `resources`, `document_chunks`.
  - Add pgvector index and RPC tuning (thresholds, limits).
  - Document schema (ERD) and migration strategy.

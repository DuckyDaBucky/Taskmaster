# Serverless Philosophy (Vercel)

## Abstract
- Deploy a SPA with Vite and use Vercel Serverless Functions under `api/` for backend capabilities. Keep functions small, stateless, validated, and environment-driven.

## Implementation in Code
- Routing/build: `taskmaster-web-client/vercel.json` rewrites `/api/*` to serverless handlers; all other routes to `index.html`. Specifies `buildCommand`, `installCommand`, and `outputDirectory`.
- Functions: `api/gemini/*`, `api/process/document`, `api/search/rag`, `api/nebula/*`, `api/health` implement chat, document processing, RAG, course data, and health checks.
- Environment: Functions read `GEMINI_API_KEY`, `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`. CORS headers set for POST/OPTIONS.

## Flaws
- Mixed env naming (`VITE_*` in serverless) should be standardized.
- Heavy workloads (extraction/embedding) may exceed cold-start/timeouts.
- No centralized rate-limiting, observability, or retry backoff.

## Evolution & Integrations
- Offload long-running tasks to queues/scheduler (Vercel Queues, Supabase Functions).
- Add edge functions for low-latency read-only endpoints; cache responses.
- Instrument logging/metrics (OpenTelemetry), error tracking, and structured logs.
- Apply request validation, payload limits, and per-user/IP rate limits.

## TODO
- Normalize env usage across all functions.
- Introduce lightweight rate limiter and structured logging.
- Split heavy processing into stepwise jobs with retries.
# Serverless Philosophy (Vercel)

- Overview: Deploy a SPA with Vite and use Vercel Serverless Functions under `api/` for backend capabilities. Keep functions small, stateless, and environment-driven.

- Current Implementation:
  - Routing/build in [taskmaster-web-client/vercel.json](taskmaster-web-client/vercel.json): rewrite `/api/*` to serverless, all else to `index.html`.
  - Functions: `api/gemini/*`, `api/process/document`, `api/search/rag`, `api/nebula/*`, `api/health`.
  - Env: Reads `GEMINI_API_KEY`, `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` inside functions; CORS headers set for POST.

- Flaws:
  - Mixed env names (`VITE_*` used server-side). Standardize to server env (`SUPABASE_URL`) in serverless.
  - Heavy work (document extraction/embedding) may exceed cold-start/timeout budgets.
  - No global rate-limiting, observability, or retries configured.

- Evolution & Integrations:
  - Offload long-running tasks to queues/background jobs (Vercel Queues/Scheduler, Supabase Functions).
  - Add edge functions for low-latency read-only endpoints; cache where feasible.
  - Instrument logging/metrics (OpenTelemetry) and central error tracking.
  - Apply request validation, input limits, and per-IP/user rate limits.

- TODO:
  - Normalize env usage in all functions; update secrets in Vercel.
  - Introduce lightweight rate limiter and structured logs.
  - Split heavy processing into steps with retries.

# Core: Agent (AI Assistant)

## Abstract
- The AI assistant is evolving from a chat widget into an in-app agent with deep context and actionable tools across tasks, classes, calendar, and resources.

## Implementation in Code
- UI: Floating assistant `taskmaster-web-client/src/components/AIAssistant.tsx` with file attachments, conversation history, and context refresh.
- Context: `taskmaster-web-client/src/services/aiContextService.ts` aggregates user data (users, tasks, classes, activities, flashcards) and builds a system prompt.
- Models/Endpoints: Chat via `/api/gemini/chat`; document processing & RAG via `/api/process/document` and `/api/search/rag`.
- Storage: Supabase stores messages/chats and user context; uploads become resources and are chunked for RAG.

## Flaws
- Limited persistent memory beyond stored chats.
- No explicit function/tool-calling pipeline for actions.
- Rate limits and failures surface with limited retries/backoff.

## Evolution & Integrations
- Define tool schema (create task, schedule event, search courses, fetch notes) and implement secure function-calling endpoints.
- Add per-user agent memory: profile, recent context cache, episodic notes.
- Proactive suggestions (deadlines, study plans) and scheduled checks.
- Streaming responses, rich cards, and citations from RAG chunks.

## TODO
- Spec agent actions and tool contracts.
- Implement serverless endpoints per action with auditing.
- Add lightweight memory store for agent context.
# Core: Agent (AI Assistant)

- Overview: The AI assistant is evolving from a chat widget into an in-app agent with deep context and actions across tasks, classes, calendar, and resources.

- Current Implementation:
  - UI: Floating assistant in [taskmaster-web-client/src/components/AIAssistant.tsx](taskmaster-web-client/src/components/AIAssistant.tsx) with file attachment and conversation history.
  - Context: `aiContextService` aggregates user data (users, tasks, classes, activities, flashcards) and builds a system prompt in [taskmaster-web-client/src/services/aiContextService.ts](taskmaster-web-client/src/services/aiContextService.ts).
  - Models: Chat via `/api/gemini/chat` and document processing via `/api/process/document`.
  - Storage: Supabase holds messages/chats and user context; uploads routed to resources and chunked for RAG.

- Flaws:
  - Stateless beyond local history; no persistent agent memory beyond stored chats.
  - No explicit tool/function calling or action execution pipeline.
  - Rate limits and failures bubble up with limited retries/backoff.

- Evolution & Integrations:
  - Define tool schema for capabilities (create task, schedule events, search courses, fetch notes) and implement function-calling endpoints.
  - Add memory: persistent per-user agent profile, recent context cache, episodic notes.
  - Proactive suggestions (deadlines, study plans) and scheduled checks (cron/queues).
  - Streaming responses, rich cards, citations from RAG chunks.

- TODO:
  - Spec agent actions + tool contracts.
  - Implement secure serverless endpoints per action with auditing.
  - Add lightweight memory store for agent context.

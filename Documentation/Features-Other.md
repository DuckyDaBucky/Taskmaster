# Features: Other Overview

## Agent Status (Important)
- The "Agent" is currently a chatbot integrated in-app. It can view and reference your schedule, tasks, classes, and flashcards, but it does not yet execute actions autonomously or perform tool/function-calling workflows.

## Flashcards
- Abstract: Study decks grouped by class/topic with a player UI and generation hooks.
- Implementation in Code:
  - UI: `taskmaster-web-client/src/components/flashcards/CreateDeckModal.tsx`, `FlashcardPlayer.tsx`, `AutoFlashcardForm.tsx`, `ManualFlashcardForm.tsx`.
  - Page: `taskmaster-web-client/src/pages/flashcards/FlashCardsPage.tsx` lists decks and launches the player.
  - Service: `taskmaster-web-client/src/services/api/flashcardService.ts` reads/writes `flashcards` in Supabase; generation is a placeholder requiring ML.

## Resources
- Abstract: Upload and organize study materials; processed into chunks for RAG.
- Implementation in Code:
  - UI: `taskmaster-web-client/src/components/resources/ResourceUpload.tsx`, `ResourceCard.tsx`, `ResourceDetailDialog.tsx`.
  - Page: `taskmaster-web-client/src/pages/resources/ResourcesPage.tsx` manages uploads, listing, and detail view.
  - Serverless: `taskmaster-web-client/api/process/document.ts` extracts text, chunks, embeds, and stores in `document_chunks`.

## Course Search (Nebula)
- Abstract: Search UTD courses and enrich context with professors, grades, and sections.
- Implementation in Code:
  - Serverless: `taskmaster-web-client/api/nebula/courses.ts`, `api/nebula/search.ts`.
  - Client service: `taskmaster-web-client/src/services/nebulaService.ts` wraps endpoints and formats enriched context.
  - UI helpers: `CourseSelector.tsx` in resources and examples under `pages/examples/`.

## Chat & Friends
- Abstract: Basic chat backed by Supabase tables and a friends view with matching.
- Implementation in Code:
  - Chat service: `taskmaster-web-client/src/services/api/chatService.ts` for messages, chats, and friend retrieval.
  - API index wiring: `taskmaster-web-client/src/services/api/index.ts` exposes chat methods.
  - Friends page: `taskmaster-web-client/src/pages/friends/FriendsPage.tsx` fetches and displays friends, supports matching.

## Dashboard & Stats
- Abstract: Overview of progress and stats with charts and summaries.
- Implementation in Code:
  - Widgets: `taskmaster-web-client/src/pages/dashboard/StatsWidget.tsx`, `ProgressChart.tsx`, `RecentActivityWidget.tsx`, `ActivityChart.tsx`.
  - Page: `taskmaster-web-client/src/pages/dashboard/DashboardPage.tsx` composes the widgets; integrates streaks.

## Streaks & Gamification
- Abstract: Tracks login/task streaks and points to motivate usage.
- Implementation in Code:
  - Service: `taskmaster-web-client/src/services/streakService.ts` updates streaks.
  - Usage: Called in `Login.tsx` and `TasksPage.tsx` after actions.

## Profile & Settings
- Abstract: Manage profile information, preferences, and theme.
- Implementation in Code:
  - Context: `taskmaster-web-client/src/context/UserContext.tsx` stores user data and theme.
  - Pages: `taskmaster-web-client/src/pages/profile/` and `src/pages/settings/` (stubs or implementations depending on current state).

## TODO (Other Features)
- Flashcards: Implement ML generation pipeline and deck management.
- Resources: Add metadata extraction, citations, and per-file status.
- Nebula: Expand professor/sections details and caching.
- Chat: Real-time updates, attachments, and moderation.
- Dashboard: More insights, customizable widgets.
- Streaks: Notifications and reward system.
- Agent: Design tool-calling and memory to evolve beyond chatbot.

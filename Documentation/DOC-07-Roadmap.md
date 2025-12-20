# DOC-07: Roadmap and Proposed Features

## Vision
Taskmaster aims to be the ultimate student productivity platform: AI-powered task management, intelligent scheduling, collaborative study, and seamless integrations with university systems.

---

## Proposed Features

### 1. Intelligent Scheduling
**Goal**: Automatically find optimal study times based on class schedule, preferences, and deadlines.
- Analyze current schedule (classes, clubs, work).
- Find free blocks matching user preferences (morning/night, quiet/social).
- Generate study goals per session using syllabus deadlines.

**Implementation**: Create a scheduling algorithm that reads from `tasks`, `classes`, and a new `events` table. Use Gemini to suggest study plans.

### 2. Advanced Flashcard Generation
**Goal**: Auto-generate flashcards from uploaded notes and lecture slides.
- OCR/vision for handwritten notes.
- Extract key terms, definitions, and Q&A pairs.
- Spaced repetition algorithm for review scheduling.

**Implementation**: Extend `/api/documents/analyze` to output flashcard format. Store in `flashcards` table with review metadata.

### 3. TaskCredit Gamification System
**Goal**: Motivate consistent study habits through a credit-based reward system.
- Earn credits for completing tasks (daily/weekly/monthly have different values).
- Lose credits for missed deadlines.
- Unlock features based on credit balance.

**Implementation**: Add `credits` field to `users`. Create `credit_transactions` table for history. Trigger credit changes via database functions.

### 4. Friends and Collaboration
**Goal**: Study groups, shared resources, and friendly competition.
- Match users into study groups using preferences (KNN algorithm).
- Shared task lists for group projects.
- Real-time chat using Supabase Realtime.

**Implementation**: Use `friends` and `friend_requests` tables. Implement matching in an API route. Use Supabase Realtime for chat.

### 5. External Integrations
**Goal**: Sync with university systems and productivity tools.

| Integration | Purpose | Approach |
|-------------|---------|----------|
| Google Calendar | Two-way sync | OAuth + Calendar API |
| Microsoft 365 | Calendar and OneDrive | Microsoft Graph API |
| eLearning (Canvas/Blackboard) | Grades, assignments | LTI or scraping (with caution) |
| Slack/Discord | Notifications | Webhooks |

### 6. Password Recovery and OAuth
**Goal**: Standard auth features.
- "Forgot Password" flow via Supabase email.
- Login with Google/Microsoft/Apple.

**Implementation**: Already supported by Supabase Auth. Enable providers in Supabase dashboard.

---

## Mobile App Strategy

### Why APIs Matter
The current Next.js app exposes RESTful API routes (`/api/*`). A mobile app can consume these same endpoints, avoiding code duplication.

### Proposed Mobile Stack
| Layer | Technology |
|-------|------------|
| Framework | React Native or Expo |
| State | React Query + Context |
| Auth | Supabase JS SDK (works on mobile) |
| Storage | AsyncStorage for tokens |
| Notifications | Expo Push or Firebase |

### Implementation Steps
1. Ensure all API routes return JSON (already done).
2. Add CORS headers for mobile origins if needed.
3. Create a new `taskmaster-mobile` repo using Expo.
4. Reuse TypeScript types from `taskmaster-client`.
5. Implement native UI for core features.

---

## Priority Order (Suggested)
1. Password recovery + OAuth (low effort, high trust).
2. TaskCredit system (gamification drives engagement).
3. Intelligent scheduling (core value proposition).
4. Google Calendar sync (high demand feature).
5. Advanced flashcards (AI showcase).
6. Friends/collaboration (social features).
7. Mobile app (after web is stable).

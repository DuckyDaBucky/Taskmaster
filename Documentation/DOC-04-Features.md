# DOC-04: Core Features

## Authentication
- **Provider**: Supabase Auth (email/password).
- **Service**: `src/services/api/authService.ts` (login, signup, logout, profile).
- **Context**: `UserContext` provides `user`, `logout`, `refreshUser`.
- **Flow**: Login -> Supabase sets cookie -> Middleware refreshes token -> Server Components read session.

## Tasks
- **CRUD**: Create, Read, Update, Delete tasks via `taskService.ts`.
- **Fields**: Title, description, deadline, priority, class association, completion status.
- **UI**: `TaskList`, `TaskModal` in `src/components/tasks/`.
- **Calendar Integration**: Tasks with deadlines appear on the calendar.

## Classes
- **Purpose**: Organize tasks by course/subject.
- **Personal Class**: Auto-created for each user for non-course tasks.
- **Service**: `classService.ts`.
- **Color Coding**: Each class has a color for visual distinction.

## Calendar
- **Library**: `react-big-calendar`.
- **Events**: Task deadlines + standalone events.
- **Features**: Month/Week/Day views, drag-to-edit.

## Resources
- **Purpose**: Upload study materials (PDFs, images, notes).
- **Storage**: Supabase Storage bucket.
- **Processing**: AI analyzes documents for summaries and metadata.
- **Service**: `resourceService.ts`.

## Flashcards
- **Decks**: Grouped by class/topic.
- **Player**: Flip-card UI with progress tracking.
- **Service**: `flashcardService.ts`.

## Dashboard
- **Widgets**: Stats, Activity Chart, Progress Chart, Recent Activity.
- **SSR**: Initial data fetched server-side for instant load.
- **Lazy Loading**: Charts load dynamically to reduce bundle size.

## Streaks
- **Purpose**: Gamification to encourage daily usage.
- **Logic**: `streakService.ts` checks login dates and increments streak.

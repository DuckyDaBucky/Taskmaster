# Features: Tasks & Schedule

## Abstract
- Tasks management and calendar scheduling are linked: task deadlines appear on the calendar alongside user-created events, offering a unified view of work and time.

## Implementation in Code
- Tasks UI: `taskmaster-web-client/src/components/tasks/TaskList.tsx` and `TaskModal.tsx` provide filtering, complete toggle, edit/delete, and form handling.
- Calendar UI: `taskmaster-web-client/src/pages/calendar/CalendarPage.tsx` uses `react-big-calendar`, overlays login streaks, and converts tasks with deadlines into calendar events.
- Data sources: Tasks from Supabase `tasks`; classes from `classes`; events fetched via `apiService`. Class-based color coding maps consistent colors per class in the calendar.
- Interactions: Toggle complete, edit/delete tasks; edit task deadlines directly from calendar (updates persist via `apiService.updateTask`).

## Flaws
- No recurrence rules; limited statuses and no subtask/dependency modeling.
- Calendar edits affect deadlines only; limited bi-directional linking with event details.
- Timezone handling is mixed (string vs ISO parsing) and may cause edge cases.

## Evolution & Integrations
- Add recurring tasks/events, reminders, and notifications (email/push).
- External calendar integration (Google Calendar, ICS import/export).
- Subtasks, Kanban views, priority/snooze, and auto-scheduling.
- Real-time updates and offline-first behavior.

## TODO
- Implement recurrence + reminder model.
- Normalize time handling (UTC + user timezone awareness).
- Add Google Calendar sync and ICS export.
# Features: Tasks & Schedule

- Overview: Tasks management and calendar scheduling are linked; task deadlines appear on the calendar alongside user-created events.

- Current Implementation:
  - UI: Tasks page uses `TaskList` and `TaskModal` in [taskmaster-web-client/src/components/tasks](taskmaster-web-client/src/components/tasks). Calendar uses `react-big-calendar` in [taskmaster-web-client/src/pages/calendar/CalendarPage.tsx](taskmaster-web-client/src/pages/calendar/CalendarPage.tsx).
  - Data: Tasks come from Supabase (`tasks`), classes from `classes`. Events fetched via `apiService`; tasks with deadlines are converted to calendar events with class-based color coding.
  - Interactions: Toggle complete, edit/delete tasks; edit task deadlines directly from calendar; streak indicator overlays from login history.

- Flaws:
  - No recurrence rules; limited statuses; no task dependencies/subtasks.
  - Calendar edits only affect deadlines; no bi-directional linking to event details.
  - Timezone edge cases and inconsistent date handling (string vs ISO parsing).

- Evolution & Integrations:
  - Recurring events/tasks, reminders, notifications (email/push).
  - External calendar integration (Google Calendar, ICS import/export).
  - Subtasks, Kanban views, priority/snooze, and auto-scheduling.
  - Real-time updates and offline support.

- TODO:
  - Add recurrence + reminders model.
  - Normalize time handling (UTC, user TZ).
  - Implement Google Calendar sync and ICS export.

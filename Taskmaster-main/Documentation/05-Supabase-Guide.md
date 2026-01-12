# Supabase Guide

## Overview
Taskmaster uses Supabase as its backend-as-a-service:
- **PostgreSQL Database**: All data storage
- **Authentication**: Email/password login with cookies
- **Storage**: File uploads (syllabi, resources)
- **Row-Level Security (RLS)**: Users only access their own data

## Getting Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create one)
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | id, email, streak, points |
| `classes` | Courses/subjects | name, professor, user_id |
| `tasks` | Assignments | title, deadline, completed, user_id |
| `resources` | Study materials | title, files, summary, user_id |
| `flashcards` | Study cards | question, answer, topic |
| `events` | Calendar events | title, start, end |
| `activities` | Activity log | type, description, metadata |

## Client Setup

We have two Supabase clients:

### Browser Client (`lib/supabase.ts`)
```typescript
import { supabase } from '@/lib/supabase';

// Use in client components
const { data } = await supabase.from('tasks').select('*');
```

### Server Client (`utils/supabase/server.ts`)
```typescript
import { createClient } from '@/utils/supabase/server';

// Use in server components/API routes
const supabase = await createClient();
```

## Authentication Flow

1. User logs in via `authService.login()`
2. Supabase sets HttpOnly cookie with session
3. `middleware.ts` refreshes token on each request
4. Server components read session from cookies
5. Client components use browser client with same session

## Row-Level Security (RLS)

All tables have RLS policies so users only see their own data:

```sql
-- Example policy
CREATE POLICY "Users see own tasks"
ON tasks FOR SELECT
USING (user_id = auth.uid());
```

This means you don't need to filter by `user_id` in every query—the database does it automatically.

## Service Layer

**Never call `supabase.from()` directly in components.**

Use services instead:
```typescript
import { taskService } from '@/services/api';

// Good
const tasks = await taskService.getAllTasks();

// Avoid
const { data } = await supabase.from('tasks').select('*');
```

Services handle:
- Authentication checks
- Data mapping (snake_case → camelCase)
- Error handling
- Type safety

## Adding New Features

### 1. Add a Table
1. Create migration SQL in `Documentation/migrations/`
2. Run in Supabase SQL Editor
3. Add RLS policies

### 2. Add a Service
1. Create `src/services/api/newService.ts`
2. Export from `src/services/api/index.ts`
3. Use in components via `apiService.newMethod()`

### 3. Add Types
1. Update `src/services/types.ts` for API types
2. Update `src/lib/database.types.ts` for DB types

## Common Operations

### Fetch Data
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', userId);
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('table')
  .insert({ field: 'value' })
  .select()
  .single();
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('table')
  .update({ field: 'newValue' })
  .eq('id', recordId);
```

### Delete Data
```typescript
const { error } = await supabase
  .from('table')
  .delete()
  .eq('id', recordId);
```

## Storage

Files are stored in Supabase Storage buckets:

```typescript
// Upload
await supabase.storage
  .from('resources')
  .upload(`${userId}/${filename}`, file);

// Get URL
const { data } = supabase.storage
  .from('resources')
  .getPublicUrl(`${userId}/${filename}`);
```

## Debugging

1. **Check Supabase Dashboard** - Table Editor shows live data
2. **Check RLS** - Temporarily disable to test
3. **Check Logs** - Database logs show query errors
4. **Browser DevTools** - Network tab shows API calls

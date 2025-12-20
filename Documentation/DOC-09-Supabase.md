# DOC-09: Supabase Guide

## What is Supabase?
Supabase is a managed backend platform. It gives you:
- **PostgreSQL Database**: Store your data in tables.
- **Authentication**: User signup, login, OAuth.
- **Storage**: Upload and serve files.
- **Realtime**: Live updates when data changes.
- **Edge Functions**: Serverless TypeScript functions.

Think of it as "Firebase but with a real SQL database."

---

## Accessing the Dashboard
1. Go to [supabase.com](https://supabase.com).
2. Log in and select your project.
3. Use the sidebar to navigate:
   - **Table Editor**: View and edit data.
   - **Authentication**: Manage users.
   - **Storage**: Manage file buckets.
   - **SQL Editor**: Run raw SQL queries.

---

## Key Tables in Taskmaster

| Table | Purpose |
|-------|---------|
| `users` | User profiles (name, email, streak, points) |
| `classes` | Courses/subjects the user is taking |
| `tasks` | Assignments yet to be done |
| `resources` | Uploaded files (syllabi, notes) |
| `flashcards` | Study cards grouped by deck |
| `document_chunks` | Text chunks for RAG (vectors) |

---

## Row-Level Security (RLS)
RLS ensures users can only access their own data.

**Example Policy** (for `tasks` table):
```sql
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (user_id = auth.uid());
```

This means: "Only show tasks where `user_id` matches the logged-in user."

---

## Using Supabase in Code

### Client-Side (Browser)
```typescript
import { supabase } from '@/lib/supabase';

// Fetch tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId);
```

### Server-Side (API Routes)
```typescript
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.from('tasks').select('*');
  return Response.json(data);
}
```

---

## Storage
Files are uploaded to "buckets."

**Upload Example**:
```typescript
const { data, error } = await supabase.storage
  .from('resources')
  .upload(`${userId}/${file.name}`, file);
```

**Get Public URL**:
```typescript
const { data } = supabase.storage
  .from('resources')
  .getPublicUrl(`${userId}/${file.name}`);
```

---

## Authentication
Supabase handles all auth flows.

**Check Current User**:
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**Login**:
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

**Logout**:
```typescript
await supabase.auth.signOut();
```

---

## Migrations
SQL migration files live in `Documentation/migrations/`.

To add new columns or tables:
1. Write SQL in a new file (e.g., `002_add_credits.sql`).
2. Run in Supabase SQL Editor.
3. Commit the file for version control.

# DOC-10: Contributing Guide

## Getting Your Bearings
If you're new to this codebase, read the documentation in order:
1. `DOC-00-Start.md` - Setup your environment.
2. `DOC-01-Architecture.md` - Understand the file structure.
3. `DOC-08-TechStack.md` - Learn what technologies are used.
4. `DOC-09-Supabase.md` - Understand the database layer.

---

## Development Workflow

### 1. Pick a Task
Check GitHub Issues or the roadmap (`DOC-07-Roadmap.md`).

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
Edit files in `src/`. The dev server hot-reloads.

### 4. Test Locally
```bash
npm run dev
```
Visit `http://localhost:3000` and verify your changes.

### 5. Build Check
```bash
npm run build
```
Fix any TypeScript or build errors.

### 6. Commit and Push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 7. Open a Pull Request
Go to GitHub and create a PR against `main`.

---

## Common Tasks

### Adding a New Page
1. Create folder in `src/app/(protected)/your-page/`.
2. Add `page.tsx` with a React component.
3. For client-side logic, create a component in `src/client-pages/`.

### Adding an API Route
1. Create folder in `src/app/api/your-route/`.
2. Add `route.ts` with handlers:
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  // Your logic here
  return Response.json({ success: true });
}
```

### Adding a Service Function
1. Open `src/services/api/yourService.ts`.
2. Add your function to the exported object.
3. Use `supabase.from('table')` for database operations.

### Modifying the Database
1. Write SQL migration in `Documentation/migrations/`.
2. Run in Supabase SQL Editor.
3. Update TypeScript types if needed.

---

## Code Style

### Naming
- **Files**: PascalCase for components (`TaskModal.tsx`), camelCase for services (`taskService.ts`).
- **Functions**: camelCase (`getTaskById`).
- **Types**: PascalCase (`TasksData`).

### Imports
- Use absolute imports: `import { taskService } from '@/services/api'`.
- Group: React, Next, third-party, local.

### Components
- Use `'use client'` directive for client components.
- Keep components small and focused.
- Extract repeated UI into `src/components/`.

---

## Debugging Tips

### Check Browser Console
Open DevTools (F12) and look for errors.

### Check Network Tab
See API requests and responses.

### Check Supabase Dashboard
Use Table Editor to verify data.

### Add Console Logs
```typescript
console.log('Debug:', variable);
```

---

## Getting Help
- Read the relevant DOC file.
- Search existing GitHub Issues.
- Ask in the team chat.

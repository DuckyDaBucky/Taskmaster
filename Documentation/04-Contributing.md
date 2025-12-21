# Contributing

## Setup
1. Read `01-Getting-Started.md` for environment setup
2. Read `02-Architecture.md` for project structure
3. Run `npm run dev` and explore the app

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
Edit files in `src/`. The dev server hot-reloads.

### 3. Build Check
```bash
npm run build
```
Fix any TypeScript or build errors.

### 4. Push and PR
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```
Open a Pull Request on GitHub.

---

## Common Tasks

### Adding a New Page
1. Create folder: `src/app/(protected)/your-page/`
2. Add `page.tsx` with a React component
3. For client logic, create component in `src/client-pages/`

### Adding an API Route
1. Create folder: `src/app/api/your-route/`
2. Add `route.ts`:
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  // Your logic
  return Response.json({ success: true });
}
```

### Adding a Service Function
1. Open `src/services/api/yourService.ts`
2. Add function to the exported object
3. Use `supabase.from('table')` for database calls

### Modifying the Database
1. Write SQL migration in `Documentation/migrations/`
2. Run in Supabase SQL Editor
3. Update TypeScript types if needed

---

## Code Style

### Naming
- **Files**: PascalCase for components (`TaskModal.tsx`), camelCase for services (`taskService.ts`)
- **Functions**: camelCase (`getTaskById`)
- **Types**: PascalCase (`TasksData`)

### Imports
```typescript
// Use absolute imports
import { taskService } from '@/services/api';
import { useUser } from '@/context/UserContext';
```

### Components
- Add `'use client'` for client components
- Keep components small and focused
- Extract reusable UI to `src/components/`

---

## Debugging

| Issue | Solution |
|-------|----------|
| Page not loading | Check browser console (F12) |
| API errors | Check Network tab for response |
| Data issues | Check Supabase Table Editor |
| Auth problems | Clear cookies, check session |

---

## Design System

### Theme
Defined in `src/constants/theme.ts` and `globals.css`. Uses CSS variables for dark/light mode.

### Icons
Use `lucide-react`:
```typescript
import { ChevronRight } from 'lucide-react';
```

### Responsive
Mobile-first with Tailwind breakpoints (`md:`, `lg:`).

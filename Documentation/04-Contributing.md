# Contributing

Ready to contribute? Here's everything you need to know.

---

## Before You Start

1. Read [01-Getting-Started.md](./01-Getting-Started.md) - Get the app running
2. Read [06-Coding-Standards.md](./06-Coding-Standards.md) - Learn our patterns
3. Explore the app at `localhost:3000` to understand what it does

---

## Your First Contribution (Step by Step)

### Step 1: Create a Branch
```bash
git checkout -b feature/your-feature-name
```

Use prefixes: `feature/`, `fix/`, `docs/`

### Step 2: Make Your Changes
Edit files in `src/`. The dev server auto-reloads.

### Step 3: Test Your Build
```bash
npm run build
```

**This must pass with no errors.** Fix any TypeScript or build issues.

### Step 4: Submit
```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

Open a Pull Request on GitHub.

---

## PR Checklist (Read This!)

Before submitting, check these boxes:

- [ ] **Did I use `<Stack>` and `<Text>`?** Not raw `<div>` and `<p>`
- [ ] **Did I use `apiService`?** Not direct Supabase calls
- [ ] **Did I add loading states?** Users shouldn't see blank screens
- [ ] **Did I handle errors?** Wrap API calls in try/catch
- [ ] **Does `npm run build` pass?** No TypeScript errors

---

## How To: Common Tasks

### Add a New Page

1. **Create the route**: `src/app/(protected)/your-page/page.tsx`
   ```tsx
   import YourPage from "@/client-pages/your-page/YourPage";
   export default function Page() {
     return <YourPage />;
   }
   ```

2. **Create the implementation**: `src/client-pages/your-page/YourPage.tsx`
   ```tsx
   "use client";
   import { Stack } from "@/components/ui/Layout";
   import { Text } from "@/components/ui/Text";
   
   export default function YourPage() {
     return (
       <Stack gap={6}>
         <Text variant="h1">Your Page Title</Text>
         {/* Your content */}
       </Stack>
     );
   }
   ```

### Add an API Route

Create `src/app/api/your-route/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Add a Service Function

Open the relevant file in `src/services/api/` and add:

```typescript
async yourNewFunction(param: string): Promise<YourType> {
  const userId = await getCachedUserId();
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw new Error(error.message);
  return data || [];
}
```

---

## Debugging Guide

| Problem | What to Check |
|---------|---------------|
| Page blank/broken | Browser Console (F12) for errors |
| API returning errors | Network tab in DevTools |
| Data not showing | Supabase Table Editor - is the data there? |
| Auth not working | Clear cookies, check `.env.local` |
| Build failing | Read the error message carefully |

### Common Errors

**"Cannot find module..."**
```bash
npm install
```

**"supabase is not defined"**
Check your `.env.local` has the correct variables.

**TypeScript errors about `any`**
Replace `any` with a proper type. See `src/services/types.ts` for existing types.

---

## Quick Reference

### File Locations
| What | Where |
|------|-------|
| Page routes | `src/app/(protected)/` |
| Page logic | `src/client-pages/` |
| UI components | `src/components/ui/` |
| Feature components | `src/components/[feature]/` |
| Database calls | `src/services/api/` |
| Types | `src/services/types.ts` |

### Icons
We use [Lucide React](https://lucide.dev/icons/):
```tsx
import { Plus, Trash2, Check } from 'lucide-react';
```

### Theme Colors
Use these Tailwind classes (they auto-switch for dark mode):
- `text-foreground` - Main text
- `text-muted-foreground` - Gray text
- `bg-card` - Card backgrounds
- `bg-primary` - Accent/button color
- `text-destructive` - Error red

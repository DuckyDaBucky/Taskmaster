# Coding Standards

This document defines how we write code in TaskMaster. Follow these patterns for consistency.

---

## The #1 Rule: Component-Driven Development

We hide complexity inside reusable components. This makes code readable and consistent.

### What This Means in Practice

| Instead of... | Use... |
|---------------|--------|
| `<div className="flex flex-col gap-4">` | `<Stack gap={4}>` |
| `<div className="flex flex-row justify-between">` | `<Stack direction="row" justify="between">` |
| `<p className="text-sm text-gray-500">` | `<Text variant="small" color="muted">` |
| `<h1 className="text-2xl font-bold">` | `<Text variant="h1">` |
| `<input className="px-3 py-2 border...">` | `<Input label="Name" />` |
| `<select className="...">` | `<Select options={[...]} />` |
| `<button className="px-4 py-2 bg-primary...">` | `<Button>Click</Button>` |

---

## Core UI Components (Use These!)

All located in `src/components/ui/`:

### Layout: `<Stack>`
```tsx
import { Stack } from "@/components/ui/Layout";

// Vertical stack with gap
<Stack gap={4}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</Stack>

// Horizontal row with space-between
<Stack direction="row" justify="between" align="center">
  <Text>Left</Text>
  <Button>Right</Button>
</Stack>
```

### Typography: `<Text>`
```tsx
import { Text } from "@/components/ui/Text";

<Text variant="h1">Big Title</Text>
<Text variant="h2">Section Title</Text>
<Text variant="body">Normal text</Text>
<Text variant="small" color="muted">Gray helper text</Text>
```

### Form Inputs
```tsx
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

<Input label="Email" type="email" placeholder="you@example.com" />

<Select 
  label="Status" 
  options={[
    { value: "pending", label: "Pending" },
    { value: "done", label: "Done" }
  ]} 
/>

<Button variant="primary">Save</Button>
<Button variant="outline">Cancel</Button>
```

---

## File & Folder Structure

```
src/
├── app/              # Next.js routing (minimal logic here)
├── client-pages/     # Page implementations
│   ├── dashboard/    # Dashboard feature
│   ├── tasks/        # Tasks feature
│   └── ...
├── components/       
│   ├── ui/           # Core primitives (Stack, Text, Button, etc.)
│   ├── tasks/        # Task-specific components
│   └── ...
├── services/         # Database operations
│   └── api/          # Individual service files
├── context/          # Global state
└── lib/              # Utilities
```

---

## Naming Conventions

### Files
| What | Format | Example |
|------|--------|---------|
| Components | PascalCase | `TaskModal.tsx` |
| Pages | PascalCase + "Page" | `DashboardPage.tsx` |
| Services | camelCase + "Service" | `taskService.ts` |
| Hooks | camelCase + "use" prefix | `useDebounce.ts` |

### Code
| What | Format | Example |
|------|--------|---------|
| Components | PascalCase | `const TaskCard = () => {}` |
| Functions | camelCase | `async function fetchTasks()` |
| Variables | camelCase | `const isLoading = true` |
| Constants | UPPER_SNAKE | `const MAX_RETRIES = 3` |
| Types | PascalCase | `interface TaskData {}` |

---

## Component Template

Copy this when creating new components:

```tsx
import React from "react";
import { Stack } from "@/components/ui/Layout";
import { Text } from "@/components/ui/Text";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <Stack gap={4}>
      <Text variant="h2">{title}</Text>
      {/* Your content here */}
    </Stack>
  );
};
```

---

## Service Template

Copy this when creating new services:

```typescript
import { supabase } from "@/lib/supabase";
import { getCachedUserId } from "./authCache";

export const myService = {
  async getAll(): Promise<MyType[]> {
    const userId = await getCachedUserId();
    
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    return data || [];
  },

  async create(item: Partial<MyType>): Promise<MyType> {
    const userId = await getCachedUserId();
    
    const { data, error } = await supabase
      .from('my_table')
      .insert({ ...item, user_id: userId })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },
};
```

---

## Common Patterns

### Loading States
```tsx
const [isLoading, setIsLoading] = useState(true);

if (isLoading) {
  return <Text color="muted">Loading...</Text>;
}
```

### Error Handling
```tsx
try {
  await apiService.createTask(data);
} catch (error) {
  const message = error instanceof Error ? error.message : "Failed";
  setError(message);
}
```

### Cross-Component Updates
When one component changes data that another component displays:

```tsx
import { taskEvents } from "@/lib/taskEvents";

// After creating/updating/deleting a task
taskEvents.emit('task-updated');
```

---

## CSS Rules

1. **Never write raw Tailwind in pages** - Use our UI components
2. **Tailwind is OK inside `components/ui/`** - That's where we hide it
3. **Use theme colors** - `text-foreground`, `bg-card`, `text-primary`
4. **No hardcoded colors** - Avoid `text-gray-500`, use `text-muted-foreground`

---

## Quick Reference: Do's and Don'ts

| Do | Don't |
|-----|-------|
| Use `<Stack>` and `<Text>` | Write raw `<div>` and `<p>` |
| Use `apiService.method()` | Call `supabase.from()` directly |
| Type your props with interfaces | Use `any` type |
| Handle loading and error states | Assume data is always there |
| Use theme colors (`text-foreground`) | Hardcode colors (`text-gray-800`) |

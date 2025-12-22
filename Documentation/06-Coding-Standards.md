# Coding Standards

## File Organization

### Directory Structure
```
src/
├── app/              # Next.js pages and API routes
├── client-pages/     # Client component page implementations
├── components/       # Reusable UI components
├── context/          # React contexts (UserContext, ThemeContext)
├── services/         # Business logic and API calls
│   └── api/          # Supabase service functions
├── lib/              # Utilities and clients
└── styles/           # CSS files
```

## Naming Conventions

### Files
| Type | Format | Example |
|------|--------|---------|
| Component | PascalCase | `TaskModal.tsx` |
| Page | PascalCase | `DashboardPage.tsx` |
| Service | camelCase | `taskService.ts` |
| Hook | camelCase | `useDebounce.ts` |
| Types | camelCase | `types.ts` |
| CSS | kebab-case | `calendar.css` |

### Code
| Type | Format | Example |
|------|--------|---------|
| Component | PascalCase | `const TaskModal = () => {}` |
| Function | camelCase | `async function getAllTasks()` |
| Variable | camelCase | `const isLoading = true` |
| Constant | UPPER_SNAKE | `const API_TIMEOUT = 10000` |
| Type/Interface | PascalCase | `interface TasksData {}` |

## Component Template

```tsx
"use client";

import React, { useState, useEffect } from "react";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="p-4">
      <h1>{title}</h1>
    </div>
  );
};
```

## Service Template

```typescript
import { supabase } from "@/lib/supabase";
import { getCachedUserId } from "./authCache";

export const myService = {
  async getItems(): Promise<Item[]> {
    const userId = await getCachedUserId();
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    return data || [];
  },
};
```

## Best Practices

### 1. Use Services for Data
```typescript
// ✓ Good
const tasks = await taskService.getAllTasks();

// ✗ Avoid
const { data } = await supabase.from('tasks').select('*');
```

### 2. Handle Loading States
```tsx
if (isLoading) {
  return <LoadingSpinner />;
}
```

### 3. Handle Errors
```typescript
try {
  await apiService.createTask(data);
} catch (error) {
  setError(error.message);
}
```

### 4. Use TypeScript Properly
```typescript
// Define types for props
interface Props {
  title: string;
  count?: number;
}

// Use types for state
const [items, setItems] = useState<Item[]>([]);
```

### 5. Emit Events for Cross-Component Updates
```typescript
import { taskEvents } from '@/lib/taskEvents';

// After modifying a task
taskEvents.emit('task-updated', taskId);
```

## CSS Guidelines

- Use Tailwind utility classes
- Theme variables: `var(--primary)`, `var(--bg-surface)`, etc.
- Component-specific CSS in `/styles/` folder
- Use semantic class names from theme system

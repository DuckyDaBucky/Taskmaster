# DOC-03: Design System

## Overview
Taskmaster uses TailwindCSS with a custom design token system for consistent styling.

## Theme Structure
Defined in `src/constants/theme.ts`:
```typescript
export const theme = {
  colors: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    primary: '#6B6BFF',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    // ...
  },
  shadows: { ... },
  radii: { ... },
};
```

## Dark/Light Mode
- Managed by `ThemeContext` (`src/context/ThemeContext.tsx`).
- Sets a `data-theme` attribute on `<html>`.
- CSS variables in `globals.css` switch palettes based on `data-theme`.

## Component Patterns
1. **Cards**: Rounded corners, subtle border, surface background.
2. **Buttons**: Primary uses accent color; secondary uses muted.
3. **Inputs**: Dark background, subtle border, focus ring.
4. **Modals**: Centered overlay with backdrop blur.

## Typography
- Uses `next/font` for optimized Google Fonts (Geist Sans, Geist Mono).
- Defined in `src/app/layout.tsx` and applied via CSS variables.

## Icons
- `lucide-react` for consistent, tree-shakable icons.
- Import individual icons: `import { ChevronRight } from 'lucide-react'`.

## Responsive Design
- Mobile-first with Tailwind breakpoints (`md:`, `lg:`).
- Sidebar collapses on mobile.
- Grid layouts adapt columns based on screen size.

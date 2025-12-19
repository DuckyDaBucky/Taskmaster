# Core: Styles & Frontend Philosophy

## Abstract
- TailwindCSS underpins styling with centralized design tokens and a theme context. The philosophy is clean, consistent, fast UI built from reusable components.

## Implementation in Code
- Tailwind setup: `taskmaster-web-client/src/index.css` with `@tailwind` directives; config in `taskmaster-web-client/tailwind.config.js` and `postcss.config.js`.
- Tokens: `taskmaster-web-client/src/constants/designSystem.ts` and `taskmaster-web-client/src/constants/theme.ts` define shared spacing, colors, radii, shadows.
- Theming: `taskmaster-web-client/src/context/ThemeContext.tsx` manages current theme via `data-theme` and localStorage.
- Component styles: Tailwind utilities throughout; focused stylesheet for calendar in `taskmaster-web-client/src/styles/calendar.css`.

## Flaws
- Mixed use of tokens vs hardcoded Tailwind utilities reduces consistency.
- Limited CSS variables; dark/light theming can be more systematic.
- Some component duplication; design system not strictly enforced.

## Evolution & Integrations
- Introduce CSS variables mapped to design tokens and unify theming.
- Establish patterns and documentation (Storybook) for shared components.
- Extract shared UI primitives (cards, modals, chips) with strict tokens.
- Accessibility pass (focus states, contrast) and performance budgets.

## TODO
- Audit components for token compliance; refactor hardcoded paddings/radii.
- Add theme variants with variable-driven palettes.
- Create a concise style guide in Documentation.
# Core: Styles & Frontend Philosophy

- Overview: TailwindCSS drives styling, with centralized tokens and a theme context. Aim for a clean, consistent, and fast UI with reusable components.

- Current Implementation:
  - Tailwind setup in [taskmaster-web-client/src/index.css](taskmaster-web-client/src/index.css), config in [taskmaster-web-client/tailwind.config.js](taskmaster-web-client/tailwind.config.js) and [taskmaster-web-client/postcss.config.js](taskmaster-web-client/postcss.config.js).
  - Design tokens in [taskmaster-web-client/src/constants/designSystem.ts](taskmaster-web-client/src/constants/designSystem.ts) and colors/theme in [taskmaster-web-client/src/constants/theme.ts](taskmaster-web-client/src/constants/theme.ts).
  - Theme switch via `ThemeContext` applying `data-theme` attribute in [taskmaster-web-client/src/context/ThemeContext.tsx](taskmaster-web-client/src/context/ThemeContext.tsx).
  - Page/component styles use Tailwind utility classes; calendar has focused CSS in [taskmaster-web-client/src/styles/calendar.css](taskmaster-web-client/src/styles/calendar.css).

- Flaws:
  - Mixed token usage (constants vs hardcoded Tailwind classes) reduces consistency.
  - Limited CSS variables; dark/light theming could be more systematic.
  - Some component-level duplication; design system not strictly enforced.

- Evolution & Integrations:
  - Introduce CSS variables mapped to design tokens; unify theming via vars.
  - Establish component library patterns and Storybook for documentation.
  - Extract common UI patterns (cards, modals, chips) into shared components.
  - Accessibility pass (focus states, contrast, ARIA) and performance budget.

- TODO:
  - Audit components for token compliance; refactor hardcoded paddings/radii.
  - Add theme variants (default/light) with variable-driven palettes.
  - Create a minimal style guide in Documentation.

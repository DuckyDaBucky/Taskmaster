# Core: Auth

## Abstract
- Authentication uses Supabase Auth with email/password. Profiles live in the `users` table; sessions are managed on the client with reactive updates.

## Implementation in Code
- Service layer: `taskmaster-web-client/src/services/api/authService.ts` implements `login`, `signup`, `getUserMe`, `updateProfile`, `logout`, and session helpers.
- Context: `taskmaster-web-client/src/context/UserContext.tsx` loads the current session, listens to `supabase.auth.onAuthStateChange`, applies user theme preferences, and exposes `logout`/`refreshUser`.
- Signup flow: Upserts a profile into `users` and creates a Personal `classes` record for the user.
- Client auth API: All calls route through the Supabase client created in `src/lib/supabase.ts`.

## Flaws
- No MFA/SSO; email/password only with limited confirmation UX.
- Auth0 packages are present but not integrated, creating potential confusion.
- Roles/permissions are minimal; privileged server actions rely on service keys, not per-user scoping.

## Evolution & Integrations
- Add OAuth (Google/Microsoft) and optional MFA.
- Establish roles (admin/user) and enforce RLS policies accordingly.
- Harden sessions (device metadata, invalidations) and add audit logging.
- Either integrate Auth0 fully or remove unused dependencies.

## TODO
- Implement forgot-password and email verification flows.
- Define roles and enforce RLS across all tables.
- Clean up Auth0 dependencies or add SSO.
# Core: Auth

- Overview: Authentication is handled via Supabase Auth. The app uses email/password and profiles in the `users` table, with client-side session management and on-auth change handlers.

- Current Implementation:
  - `authService.ts` provides `login`, `signup`, `getUserMe`, `logout` and profile updates in [taskmaster-web-client/src/services/api/authService.ts](taskmaster-web-client/src/services/api/authService.ts).
  - `UserContext.tsx` initializes session, listens to `supabase.auth.onAuthStateChange`, applies theme preferences, and exposes `logout` in [taskmaster-web-client/src/context/UserContext.tsx](taskmaster-web-client/src/context/UserContext.tsx).
  - Signup upserts into `users` and creates a Personal `classes` record.

- Flaws:
  - No MFA/SSO; password-only with minimal UI flows (email confirmation handling is limited).
  - Auth0 packages exist in dependencies but are not wired; dual systems risk confusion.
  - Limited role/permission model; server actions rely on service keys without per-user scoping.

- Evolution & Integrations:
  - Add OAuth providers (Google/Microsoft) and optional MFA.
  - Define roles (admin/user) and RLS policies accordingly.
  - Session hardening (refresh, device metadata, invalidation flows) and audit logs.
  - Optional Auth0 integration if needed; otherwise remove unused deps.

- TODO:
  - Clean up unused Auth0 deps or implement SSO.
  - Add forgot-password + email verification UX.
  - Implement roles and enforce RLS everywhere.

# The Lab 2.0 — Free Accounts Implementation Plan

Status: design and database schema committed on development branch only. Authentication and cloud sync are NOT live.

## Architecture
- Vercel hosts the React/Vite frontend. Supabase Auth handles sign-up, email verification, login, password reset and sessions.
- Supabase Postgres stores private profiles, training programs and practice sessions.
- The SQL in supabase/schema.sql enables row-level security for every user-data table and limits read/write/delete operations to the authenticated owner.
- Never expose Supabase service-role or secret keys in browser code. Only project URL and publishable key may be in Vite client environment variables.
- Configure Auth redirect URL allowlist for the Vercel preview and future production site. Enable email verification and abuse/rate protections.

## Build sequence
1. Create a separate Supabase development project and apply the SQL schema.
2. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel preview environment settings; do not commit secrets.
3. Implement accessible sign-up, sign-in, verification, sign-out and password reset screens.
4. Connect profile, programs and practice results to authenticated cloud CRUD with loading/error/offline states.
5. Offer explicit migration of localStorage data from thelab-weekly-plans-v1, thelab-practice-v1 and legacy programs. Validate, deduplicate, preview counts and retain local originals until writes succeed.
6. Test two-user isolation by directly attempting unauthorized reads/updates/deletes, session expiry, invalid data, mobile layouts and network failures.
7. Add privacy policy, export, retention and verified server-side account deletion before public release.

## Acceptance criteria
- Every account is free and can save programs and practice results across devices.
- Anonymous visitors can still access public lessons and drills.
- No account can access another user's data through the database API.
- Browser-only saved data is never silently overwritten or deleted.
- No claim that cloud saving works until a backend is configured and end-to-end tested.

Do not merge the lab-2-mobile-first branch into main until approved.

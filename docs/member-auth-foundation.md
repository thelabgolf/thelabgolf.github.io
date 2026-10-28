# Member accounts and private program storage — implementation handoff

**Status:** database schema and row-level-security policies committed; **not deployed or configured**. Existing `programs.html` remains a local-browser prototype. No real sign-in or cloud saving is currently enabled.

## Architecture

Use a hosted Supabase Auth + PostgreSQL project. The migration in `supabase/migrations/20261027_000001_member_programs_and_owner_access.sql` creates:

- `member_programs`: multiple plans per member, with a unique optional primary program; each member can read/write **only their own** rows through PostgreSQL row-level security.
- `lab_owner_accounts`: administrator-provisioned owner allowlist. Members cannot grant themselves owner access.
- `owner_rebuild_content`: private OPERATION REBUILD material, readable only by an authenticated allowlisted owner. It must never be embedded in public JavaScript, HTML, or repository files.

These are server-enforced policies; hiding navigation links alone is **not** authorization.

## Deployment checklist

1. Create the Supabase project, configure email confirmation, allowed redirect URLs, secure password settings, and production domain.
2. Apply the SQL migration from a trusted admin context and inspect policies/grants.
3. Provision the actual owner's authenticated UUID in `lab_owner_accounts` **only through a trusted admin session**; never ship an owner UUID, admin password, or service-role key to the client.
4. Populate OPERATION REBUILD content only in the protected table through a trusted admin process.
5. Configure the browser with the project URL and **publishable/anon key only**. This key is not a substitute for RLS.
6. Implement sign-up/sign-in/sign-out, authenticated program CRUD, and an explicit one-time migration prompt for existing `thelab-programs-v1` local plans. Do not silently overwrite or delete local plans.
7. Implement a public landing/catalog preview and sign-in prompts only when users open interactive lessons/drills/programs.
8. Add tests using two separate non-owner accounts and the owner account. Confirm users cannot read, insert, modify, or delete each other's programs; non-owners cannot read OPERATION REBUILD, including through direct API requests; unauthenticated users cannot access private rows.
9. Verify backups, deletion/export handling, rate limits, session expiry, accessibility, and responsive layouts before deployment.

## Compatibility and privacy constraints

- Do **not** change existing 260 Practice Center drill IDs or the `thelab-practice-v1` local practice history key/schema.
- Members may create **multiple training programs**; a separate custom-lesson authoring feature is out of scope.
- `plan` is an ordered JSON array reserved for existing Academy lesson and Practice Center drill references. Validate IDs against an approved catalog when wiring the UI.
- Keep OPERATION REBUILD private to the owner and entirely separate from member-created programs.
- Never claim secure member accounts are live until Auth is configured, the migration is applied, and multi-account authorization tests pass.

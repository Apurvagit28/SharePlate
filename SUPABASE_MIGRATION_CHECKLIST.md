# SharePlate — Supabase Migration Checklist

This checklist covers migrating SharePlate from the Bolt-managed
Supabase database to your own Supabase project (SharePlate-db) with
secure authentication and authorization in place.

## What changed and why

The previous migration shipped **public RLS policies** (anyone with
the anon key could read, create, update, or delete any row) because
the app originally had no authentication. The app **now has Supabase
email/password authentication** in the frontend — sign-in/sign-up
screen, auth context, protected routes, sign-out — so the database
must enforce the same ownership model server-side.

The revised `MIGRATION_TO_NEW_SUPABASE.sql` ships a secure schema:

- `food_listings` and `donation_requests` have `user_id` columns
  (`NOT NULL DEFAULT auth.uid()`) so every row is owned by the
  authenticated user who created it.
- Row Level Security is enabled on both tables.
- Listings are **publicly readable** (so Find Food / Home browsing
  works without login) but only the owner can edit or delete.
- Requests are **authenticated-only** and visible only to the
  requester or the listing owner — requester contact details and
  messages stay private.
- `status`, `reserved_quantity`, and `user_id` are protected
  columns: clients cannot set them through the Data API. They are
  controlled by three `SECURITY DEFINER` functions that verify the
  caller owns the listing before acting:
  - `accept_donation_request`
  - `reject_donation_request`
  - `complete_donation_request`
- `anon` EXECUTE is revoked on all three functions; only
  `authenticated` can call them.
- Recipients cancel their own requests; donors accept/reject/
  complete requests on their own listings.

## Assumptions (confirm before running)

1. **Target database is empty.** The script adds `user_id` as
   `NOT NULL DEFAULT auth.uid()`. If `food_listings` or
   `donation_requests` already contain rows without a `user_id`,
   the `NOT NULL` constraint will fail. If you have existing data,
   use the safe-with-data sequence at the bottom of this checklist
   instead of running the script directly.
2. **Authorization model:** the listing owner (donor) accepts,
   rejects, and completes requests on their own listings; the
   request owner (recipient) cancels their own requests. Recipients
   do not accept their own requests.
3. **Listings are public to browse; requests are private.**
   Unauthenticated visitors can browse listings but cannot create
   listings or requests, and cannot see any requests.
4. **Email/password auth only.** No social logins, no magic links,
   no custom auth tables. Email confirmation stays OFF (Supabase
   default for this flow).
5. **No edge functions, no storage buckets, no Stripe.** Scope is
   RLS + the three privileged functions.

## 1. Apply the Migration SQL

1. Log in to https://supabase.com and open your **SharePlate-db**
   project.
2. Click **SQL Editor** in the left sidebar.
3. Open `MIGRATION_TO_NEW_SUPABASE.sql` from this project.
4. Copy the entire contents and paste into the SQL Editor.
5. Click **Run**.

If the target database already has rows, stop and use the
"Safe-with-data sequence" at the bottom of this checklist instead.

## 2. Verify the Migration Succeeded

Run each of these in the SQL Editor and confirm the output.

### Tables

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Expected: food_listings, donation_requests
```

### Columns (user_id must be NOT NULL with default auth.uid())

```sql
SELECT table_name, column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('food_listings','donation_requests')
  AND column_name = 'user_id';
-- Expected: is_nullable = NO, column_default = auth.uid()
```

### RLS enabled

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('food_listings','donation_requests');
-- Expected: relrowsecurity = true for both
```

### Policies (8 total: 4 per table)

```sql
SELECT polname, polcmd, polroles::text
FROM pg_policy
WHERE polrelid IN ('food_listings'::regclass, 'donation_requests'::regclass);
-- Expected:
--   food_listings: select_listings_public, insert_own_listings,
--     update_own_listings, delete_own_listings
--   donation_requests: select_requests_as_requester_or_owner,
--     insert_own_requests, update_own_requests, delete_own_requests
```

### Functions (4 SECURITY DEFINER + 1 aggregate, anon revoked)

```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname IN (
  'accept_donation_request',
  'reject_donation_request',
  'complete_donation_request',
  'cancel_donation_request',
  'get_impact_stats',
  'update_updated_at_column'
);
-- Expected: the four request functions have prosecdef = true;
--   get_impact_stats has prosecdef = false (SECURITY INVOKER);
--   update_updated_at_column is the trigger helper (prosecdef = false)
```

### Execute grants on the privileged functions

```sql
SELECT routine_name, grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name IN (
    'accept_donation_request',
    'reject_donation_request',
    'complete_donation_request',
    'cancel_donation_request',
    'get_impact_stats'
  );
-- Expected:
--   accept/reject/complete/cancel: only 'authenticated' has EXECUTE; 'anon' must NOT appear.
--   get_impact_stats: both 'anon' and 'authenticated' have EXECUTE (public aggregate).
```

### Column privileges (protected columns are not client-writable)

```sql
SELECT table_name, column_name, privilege_type, grantee
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND table_name IN ('food_listings','donation_requests')
ORDER BY table_name, column_name, privilege_type;
-- Expected: status, reserved_quantity, user_id, created_at must
--   NOT appear in INSERT or UPDATE grants for authenticated.
```

### Indexes

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: idx_food_listings_status, idx_food_listings_user_id,
--   idx_donation_requests_listing_id, idx_donation_requests_user_id
```

### Trigger

```sql
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'donation_requests'::regclass;
-- Expected: update_donation_requests_updated_at
```

## 3. Enable Email/Password Auth in the new project

The frontend already calls `supabase.auth.signUp` and
`signInWithPassword`, so the only dashboard steps are:

1. In Supabase Dashboard → **Authentication → Providers**, confirm
   **Email** is enabled.
2. In **Authentication → Settings**, confirm **Confirm email** is
   OFF (the app expects immediate login after signup).
3. No social providers, no magic links — leave them off.

## 4. Environment Variables to Update

The app reads exactly two variables from `.env`:

| Variable | Where to find the new value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → **Project API keys** → the `anon` / `public` key (NOT `service_role`) |

Do NOT put the `service_role` key in `.env` — it bypasses RLS and
must never be in frontend code.

## 5. Switch the Connection Safely

1. **Back up the current `.env`** so you can roll back.
2. **Edit `.env`** — replace the two values with your new project's
   URL and anon key.
3. Restart the dev server so the new env vars take effect.

### Roll back if testing fails

Restore the original `.env` values and restart. The app reconnects
to the original Bolt-provisioned database. No data is lost — the
old database is untouched.

## 6. Functional + Security Tests After Switching

Perform these in order. If any step fails, roll back (step 5).

### Auth

1. **Sign up** — create a new account on `/auth`. Confirm you are
   logged in and redirected to the dashboard.
2. **Sign out / sign in** — confirm the navbar shows the email,
   sign out works, and signing back in succeeds.
3. **Protected route** — while signed out, visit `/donate-food` and
   `/dashboard`; confirm you are redirected to `/auth`.

### Browse (public)

4. **Home / Find Food** — without signing in, confirm the home
   page and Find Food load. (The new database starts empty, so you
   should see "no listings" UI, not an error.)

### Donate (owner)

5. **Donate Food** — sign in, fill the form, submit. Confirm the
   success message appears.
6. **Find Food** — the listing you just created appears.
7. **Dashboard** — open the dashboard. Confirm the listing appears
   under "My Food Listings" and that the impact stats update.

### Request (recipient)

8. **Listing detail** — open the listing, submit a food request,
   confirm the success message.
9. **Dashboard (as recipient)** — confirm the request appears under
   "My Requests".

### Owner authorization (the key security check)

10. **Accept Request** — signed in as the listing owner, click
    Accept on the request. Confirm the request status changes to
    "Accepted" and the listing's available quantity decreases.
11. **Over-reservation check** — create a second request for more
    than the remaining quantity, then try to accept it. Confirm
    you get an error, not a success.
12. **Cross-user rejection** — sign in as a *different* user who
    does NOT own the listing. Open the same listing detail page
    and confirm the Accept / Reject / Complete buttons do NOT
    appear (the UI hides them for non-owners). Then try calling
    the functions directly via the browser console / Data API and
    confirm the server returns "Not authorized".

### Requester cancel

13. **Cancel own request** — signed in as the requester, cancel
    your own pending or accepted request. Confirm the status
    changes to "Cancelled".
14. **Cannot cancel others' requests** — signed in as a different
    user, try to cancel a request you did not make. Confirm the
    update is blocked (the row is invisible to you, so it fails).

### Privacy

15. **Request privacy** — signed in as a third user who is neither
    the requester nor the listing owner, try to read
    `donation_requests` via the Data API. Confirm you get zero
    rows for listings you don't own and requests you didn't make.

### Persistence

16. **Refresh** — reload pages and confirm all data and statuses
    survive a page reload.

## 7. Safe-with-data sequence (only if the target DB has rows)

If `SharePlate-db` already contains `food_listings` or
`donation_requests` rows, do NOT run the main script as-is — the
`NOT NULL user_id` constraint will fail. Use this sequence instead:

1. Run a modified version of the script that adds `user_id` as
   **nullable** (drop `NOT NULL`):
   ```sql
   ALTER TABLE food_listings
     ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
   ALTER TABLE donation_requests
     ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
   ```
2. **Backfill `user_id`** for every existing row. You must
   determine which user owns each row. If you cannot map existing
   rows to users, those rows will be invisible under the new
   ownership-scoped policies and should be considered orphaned.
3. Set the columns to `NOT NULL` after all rows have a valid
   `user_id`:
   ```sql
   ALTER TABLE food_listings ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE donation_requests ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE food_listings ALTER COLUMN user_id SET DEFAULT auth.uid();
   ALTER TABLE donation_requests ALTER COLUMN user_id SET DEFAULT auth.uid();
   ```
4. Then apply the grants, policies, column restrictions, and
   functions from the main script (everything after the table
   definitions).

If you are unsure whether the target database is empty, run
`SELECT count(*) FROM food_listings; SELECT count(*) FROM donation_requests;`
first. Zero on both means it is safe to run the main script directly.

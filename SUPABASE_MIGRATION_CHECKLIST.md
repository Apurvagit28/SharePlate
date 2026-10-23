# SharePlate — Supabase Migration Checklist

## 1. Apply the Migration SQL

1. Log in to https://supabase.com and open your **SharePlate-db** project.
2. Click **SQL Editor** in the left sidebar.
3. Open the file `MIGRATION_TO_NEW_SUPABASE.sql` from this project.
4. Copy the entire contents and paste into the SQL Editor.
5. Click **Run**.

## 2. Verify the Migration Succeeded

Run each of these in the SQL Editor and confirm the output:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Expected: food_listings, donation_requests

SELECT polname, polcmd, polroles::text
FROM pg_policy WHERE polrelid IN (
  'food_listings'::regclass, 'donation_requests'::regclass
);
-- Expected: 8 policies (4 per table, one per CRUD verb)

SELECT proname, prosecdef FROM pg_proc
WHERE proname IN ('accept_donation_request', 'update_updated_at_column');
-- Expected: both functions listed, accept_donation_request has prosecdef = true

SELECT indexname FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: idx_donation_requests_listing_id, idx_food_listings_status

SELECT tgname FROM pg_trigger WHERE tgrelid = 'donation_requests'::regclass;
-- Expected: update_donation_requests_updated_at
```

## 3. Environment Variables to Update

The application reads exactly two variables from `.env`:

| Variable | Where to find the new value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → **Project API keys** → the `anon` / `public` key (NOT the `service_role` key) |

Do NOT use the `service_role` key in `.env` — it bypasses RLS and must never be in frontend code.

## 4. Switch the Connection Safely

1. **Back up the current `.env`** — copy the existing values somewhere safe so you can roll back.
2. **Edit `.env`** — replace the two values with your new project's URL and anon key.
3. **Restart the dev server** so the new env vars take effect.

### Roll back if testing fails

Restore the original `.env` values and restart the dev server. The app will reconnect to the original Bolt-provisioned database. No data is lost — the old database is untouched.

## 5. Functional Tests After Switching

Perform these in order. If any step fails, roll back (step 4).

1. **Home page loads** — listings appear (the new database starts empty, so you should see no listings, not an error).
2. **Donate Food** — fill the form and submit. Confirm the success message appears.
3. **Find Food** — the listing you just created appears in the list.
4. **Listing Detail** — open the listing, submit a food request, confirm the success message.
5. **Accept Request** — on the same listing detail page, click Accept on the request. Confirm the request status changes to "Accepted" and the listing's available quantity decreases.
6. **Over-reservation check** — create a second request for more than the remaining quantity, then try to accept it. Confirm you get an error message, not a success.
7. **Dashboard** — open the Dashboard. Confirm the listing and request appear in the tables with correct statuses.
8. **Refresh the page** — confirm all data persists (listings, requests, statuses all survive a page reload).

## 6. Security Limitations (Current Prototype)

The current setup uses **public RLS policies** — anyone with the anon key can read, create, update, or delete any row. This is acceptable for a hackathon demo but **not for production**. Before going to production you must add Supabase authentication and replace the public policies with ownership-scoped ones. The SQL for that is documented in the "FUTURE AUTH MIGRATION" section at the bottom of `MIGRATION_TO_NEW_SUPABASE.sql` — do not run it until you have built sign-in/sign-up screens in the app.

-- ============================================================
-- SharePlate — Complete Migration Script for New Supabase Project
-- ============================================================
--
-- SECURITY WARNING — READ BEFORE RUNNING
--
-- This script creates PUBLIC Row Level Security policies that allow
-- anyone with the anon key to read, create, update, and delete ALL
-- rows in both tables. This is NOT secure for production use.
--
-- The public policies exist because the current application has NO
-- authentication — no sign-in screen, no user sessions. The frontend
-- communicates with Supabase using only the anon (publishable) key.
-- Without public policies, the app would see zero rows and appear
-- broken. These policies are a prototype workaround, not a security
-- model.
--
-- KNOWN LIMITATIONS OF THIS PROTOTYPE SETUP:
--   - Any visitor can delete or modify any listing or request.
--   - There is no way to identify who created a listing or request.
--   - The dashboard shows everyone's data, not a specific user's.
--   - The anon key is embedded in frontend code and is not secret.
--
-- BEFORE PRODUCTION USE, you must:
--   1. Add Supabase email/password authentication to the app.
--   2. Add user_id columns to both tables (see FUTURE section for
--      the safe nullable-then-backfill sequence).
--   3. Replace the public policies with ownership-scoped policies
--      using auth.uid() = user_id on BOTH tables.
--   4. Revoke anon grants and anon EXECUTE on the function.
--   5. Update accept_donation_request to verify the caller owns the
--      listing before accepting a request.
--   6. Build sign-in / sign-up screens in the frontend.
--
-- The "FUTURE AUTH MIGRATION" section at the bottom of this script
-- documents all six steps as GUIDANCE ONLY. It is NOT executable SQL
-- and must NOT be run as-is — it contains partial snippets that
-- require adaptation. Do NOT run that section now.
--
-- HOW TO APPLY THIS SCRIPT:
--
-- Option A — Supabase Dashboard SQL Editor:
--   1. Log in to your Supabase account at https://supabase.com
--   2. Open your new (empty) SharePlate-db project
--   3. Click "SQL Editor" in the left sidebar
--   4. Paste this entire script
--   5. Click "Run"
--
-- Option B — Supabase CLI (if you have it installed):
--   supabase db execute --project-ref <your-project-ref> < this file
--
-- This script is idempotent — safe to run multiple times.
-- It does NOT drop or delete any existing data.
-- ============================================================

-- ============================================================
-- TABLE 1: food_listings
-- ============================================================
-- Stores surplus food posted by donors.
-- Each row represents one food donation listing.

CREATE TABLE IF NOT EXISTS food_listings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name               text NOT NULL,
  quantity                numeric NOT NULL CHECK (quantity > 0),
  unit                    text NOT NULL,
  category                text NOT NULL,
  pickup_location         text NOT NULL,
  availability_deadline   timestamptz NOT NULL,
  handling_info           text NOT NULL,
  allergen_info           text NOT NULL,
  additional_instructions text,
  donor_name              text NOT NULL,
  donor_contact           text,
  status                  text NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available','accepted','completed','cancelled')),
  reserved_quantity       numeric NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  image_url               text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 2: donation_requests
-- ============================================================
-- Stores requests from recipients for specific food listings.
-- Each request references a food_listing and tracks its lifecycle
-- through pending -> accepted/rejected -> completed/cancelled.

CREATE TABLE IF NOT EXISTS donation_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  requested_quantity  numeric NOT NULL CHECK (requested_quantity > 0),
  requester_name      text NOT NULL,
  requester_contact   text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  message             text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Speed up common query patterns used by the application.

CREATE INDEX IF NOT EXISTS idx_donation_requests_listing_id
  ON donation_requests(listing_id);

CREATE INDEX IF NOT EXISTS idx_food_listings_status
  ON food_listings(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- RLS is enabled on both tables.
--
-- WHY PUBLIC POLICIES?
-- The current application has NO authentication (no sign-in screen).
-- The frontend talks to Supabase using the anon key, which means
-- every request runs as the "anon" role. If policies were scoped to
-- "authenticated" only, the app would see zero rows -- it would appear
-- broken even though data exists in the table.
--
-- Since there is no login, all data is intentionally public/shared:
-- any visitor can browse listings, post donations, and submit requests.
-- The USING(true) / WITH CHECK(true) policies reflect this design.
--
-- WHEN YOU ADD AUTHENTICATION LATER:
-- Replace these public policies with ownership-scoped ones using
-- auth.uid(), and add user_id columns to both tables. See the
-- "FUTURE AUTH MIGRATION" section at the bottom of this script.

ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;

-- Grants: allow both anon and authenticated roles to reach the tables.
-- Grants decide WHETHER a role can access a table; RLS policies decide
-- WHICH rows. Both are needed.

GRANT SELECT, INSERT, UPDATE, DELETE ON food_listings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON donation_requests TO anon, authenticated;

-- --- food_listings policies (4 separate, one per CRUD verb) ---

DROP POLICY IF EXISTS "public_select_listings" ON food_listings;
CREATE POLICY "public_select_listings" ON food_listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_listings" ON food_listings;
CREATE POLICY "public_insert_listings" ON food_listings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_listings" ON food_listings;
CREATE POLICY "public_update_listings" ON food_listings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_listings" ON food_listings;
CREATE POLICY "public_delete_listings" ON food_listings FOR DELETE
  TO anon, authenticated USING (true);

-- --- donation_requests policies (4 separate, one per CRUD verb) ---

DROP POLICY IF EXISTS "public_select_requests" ON donation_requests;
CREATE POLICY "public_select_requests" ON donation_requests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_requests" ON donation_requests;
CREATE POLICY "public_insert_requests" ON donation_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_requests" ON donation_requests;
CREATE POLICY "public_update_requests" ON donation_requests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_requests" ON donation_requests;
CREATE POLICY "public_delete_requests" ON donation_requests FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- TRIGGER: auto-update updated_at on donation_requests
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_donation_requests_updated_at ON donation_requests;
CREATE TRIGGER update_donation_requests_updated_at
  BEFORE UPDATE ON donation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: accept_donation_request
-- ============================================================
-- SECURITY DEFINER function that atomically accepts a request.
--
-- This is the core over-reservation prevention mechanism. It runs
-- with elevated privileges (SECURITY DEFINER) so it can update both
-- tables in a single atomic operation, even though the caller (anon
-- role) would normally be limited by RLS.
--
-- Steps:
--   1. Lock the request row (FOR UPDATE) -- prevents concurrent modification.
--   2. Verify the request is still "pending".
--   3. Lock the parent listing row (FOR UPDATE) -- prevents concurrent accepts.
--   4. Verify the listing is still active (available or accepted).
--   5. Calculate available = quantity - reserved_quantity.
--   6. If requested > available, return an error (over-reservation prevented).
--   7. Atomically increment reserved_quantity on the listing.
--   8. If fully reserved, mark listing status as 'accepted'.
--   9. Set request status to 'accepted'.
--  10. Return success.
--
-- The row locking (FOR UPDATE) ensures that two concurrent accept
-- calls cannot both succeed and over-reserve the same listing.

CREATE OR REPLACE FUNCTION accept_donation_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id      uuid;
  v_requested       numeric;
  v_listing_status  text;
  v_quantity        numeric;
  v_reserved        numeric;
  v_available       numeric;
BEGIN
  -- Lock the request row
  SELECT listing_id, requested_quantity, status
    INTO v_listing_id, v_requested, v_listing_status
  FROM donation_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_listing_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Request is not pending (current status: ' || v_listing_status || ')');
  END IF;

  -- Lock the listing row
  SELECT status, quantity, reserved_quantity
    INTO v_listing_status, v_quantity, v_reserved
  FROM food_listings
  WHERE id = v_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  IF v_listing_status NOT IN ('available', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing is no longer active');
  END IF;

  v_available := v_quantity - v_reserved;

  IF v_requested > v_available THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Not enough available quantity. Available: ' || v_available ||
      ', requested: ' || v_requested);
  END IF;

  -- Update reserved quantity and potentially mark listing as fully reserved
  UPDATE food_listings
    SET reserved_quantity = reserved_quantity + v_requested,
        status = CASE
          WHEN (reserved_quantity + v_requested) >= quantity THEN 'accepted'
          ELSE status
        END
  WHERE id = v_listing_id;

  -- Accept the request
  UPDATE donation_requests
    SET status = 'accepted'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Execute permissions for accept_donation_request
--
-- SECURITY RISK: The anon role is granted EXECUTE so that unauthenticated
-- visitors can accept requests. This means ANYONE with the anon key can
-- call this function to accept ANY request on ANY listing — there is no
-- ownership verification. In the current prototype this is by design
-- (there is no login), but it must be locked down before production.
--
-- The standard pattern: revoke the default PUBLIC grant (all roles get
-- EXECUTE by default on new functions), then grant only to the roles
-- the application actually uses.

REVOKE EXECUTE ON FUNCTION accept_donation_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_donation_request(uuid) TO anon, authenticated;

-- ============================================================
-- FUTURE AUTH MIGRATION (DO NOT RUN YET — READ FULLY BEFORE USING)
-- ============================================================
-- When you add Supabase email/password authentication to SharePlate,
-- you must make ALL of the changes below. These are guidelines, not a
-- copy-paste script — the exact order and statements depend on whether
-- you have existing data that must be preserved.
--
-- CRITICAL: You cannot simply run these statements on a table that
-- already has rows. Adding a NOT NULL column with DEFAULT auth.uid()
-- will FAIL because auth.uid() returns NULL for any session-less
-- context (including ALTER TABLE ... ADD COLUMN). The correct
-- sequence for tables with existing data is:
--
--   a. Add the column as NULLABLE (no NOT NULL, no DEFAULT).
--   b. Backfill user_id for every existing row — you must determine
--      which user owns each row. If you cannot map existing rows to
--      users, those rows will be orphaned and invisible under the new
--      ownership-scoped policies.
--   c. Set the column to NOT NULL after all rows have a valid user_id.
--   d. Then proceed with the policy and grant changes below.
--
-- If you are starting with an empty database (no existing rows), you
-- can add the column with NOT NULL DEFAULT auth.uid() directly.
--
-- Step 1 — Add user_id columns (nullable first if data exists):
--
--    ALTER TABLE food_listings ADD COLUMN user_id uuid
--      REFERENCES auth.users(id) ON DELETE CASCADE;
--    ALTER TABLE donation_requests ADD COLUMN user_id uuid
--      REFERENCES auth.users(id) ON DELETE CASCADE;
--
--    -- Backfill existing rows here, then:
--    ALTER TABLE food_listings ALTER COLUMN user_id SET NOT NULL;
--    ALTER TABLE donation_requests ALTER COLUMN user_id SET NOT NULL;
--    ALTER TABLE food_listings ALTER COLUMN user_id SET DEFAULT auth.uid();
--    ALTER TABLE donation_requests ALTER COLUMN user_id SET DEFAULT auth.uid();
--
-- Step 2 — Drop the public policies created in this script and replace
-- with ownership-scoped policies on BOTH tables:
--
--    -- food_listings
--    DROP POLICY IF EXISTS "public_select_listings" ON food_listings;
--    DROP POLICY IF EXISTS "public_insert_listings" ON food_listings;
--    DROP POLICY IF EXISTS "public_update_listings" ON food_listings;
--    DROP POLICY IF EXISTS "public_delete_listings" ON food_listings;
--
--    CREATE POLICY "select_own_listings" ON food_listings FOR SELECT
--      TO authenticated USING (auth.uid() = user_id);
--    CREATE POLICY "insert_own_listings" ON food_listings FOR INSERT
--      TO authenticated WITH CHECK (auth.uid() = user_id);
--    CREATE POLICY "update_own_listings" ON food_listings FOR UPDATE
--      TO authenticated USING (auth.uid() = user_id)
--      WITH CHECK (auth.uid() = user_id);
--    CREATE POLICY "delete_own_listings" ON food_listings FOR DELETE
--      TO authenticated USING (auth.uid() = user_id);
--
--    -- donation_requests (recipient owns their own requests)
--    DROP POLICY IF EXISTS "public_select_requests" ON donation_requests;
--    DROP POLICY IF EXISTS "public_insert_requests" ON donation_requests;
--    DROP POLICY IF EXISTS "public_update_requests" ON donation_requests;
--    DROP POLICY IF EXISTS "public_delete_requests" ON donation_requests;
--
--    CREATE POLICY "select_own_requests" ON donation_requests FOR SELECT
--      TO authenticated USING (auth.uid() = user_id);
--    CREATE POLICY "insert_own_requests" ON donation_requests FOR INSERT
--      TO authenticated WITH CHECK (auth.uid() = user_id);
--    CREATE POLICY "update_own_requests" ON donation_requests FOR UPDATE
--      TO authenticated USING (auth.uid() = user_id)
--      WITH CHECK (auth.uid() = user_id);
--    CREATE POLICY "delete_own_requests" ON donation_requests FOR DELETE
--      TO authenticated USING (auth.uid() = user_id);
--
-- Step 3 — Revoke anon access so only authenticated users reach the tables:
--
--    REVOKE SELECT, INSERT, UPDATE, DELETE ON food_listings FROM anon;
--    REVOKE SELECT, INSERT, UPDATE, DELETE ON donation_requests FROM anon;
--
-- Step 4 — Revoke anon execute on the accept_donation_request function:
--
--    REVOKE EXECUTE ON FUNCTION accept_donation_request(uuid) FROM anon;
--
-- Step 5 — Update accept_donation_request to verify the caller owns the
-- listing before accepting a request. The function is SECURITY DEFINER
-- and bypasses RLS, so it MUST perform its own ownership check.
--
--    -- Add to the DECLARE block:
--    v_listing_owner uuid;
--
--    -- Inside the function, after locking the listing row, add:
--    IF auth.uid() IS NULL THEN
--      RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
--    END IF;
--    -- Verify the caller owns the listing being accepted on:
--    SELECT user_id INTO v_listing_owner
--    FROM food_listings WHERE id = v_listing_id FOR UPDATE;
--    IF v_listing_owner <> auth.uid() THEN
--      RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
--    END IF;
--
--    NOTE: If recipients (not just donors) need to accept requests,
--    adjust the ownership check to match your application's
--    authorization model.
--
-- Step 6 — Build sign-in and sign-up screens in the frontend so users
-- can get an authenticated session before any of the above takes effect.
--
-- WARNING: Steps 1-5 must be applied together. Applying only some of
-- them will either break the app (e.g. revoking anon without adding
-- auth) or leave security holes (e.g. adding user_id without updating
-- the SECURITY DEFINER function's ownership check).

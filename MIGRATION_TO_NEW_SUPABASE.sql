-- ============================================================
-- SharePlate — Secure Migration Script for New Supabase Project
-- Target: SharePlate-db (your own Supabase project)
-- ============================================================
--
-- WHAT THIS SCRIPT DOES
--
-- This script builds the complete SharePlate schema with a secure
-- authentication and authorization model built in from the start.
-- It is designed for an EMPTY new database (no existing rows to
-- preserve), which is why owner columns can be NOT NULL with a
-- DEFAULT of auth.uid().
--
-- The frontend already has Supabase email/password authentication
-- (sign-in/sign-up screen, auth context, protected routes for
-- Donate Food and Dashboard, sign-out). This script makes the
-- database match that auth model so the app is secure end-to-end.
--
-- AUTHORIZATION MODEL
--
--   - Donor (listing owner):  creates listings, and accepts /
--     rejects / completes requests on their own listings.
--   - Recipient (request owner): creates requests on any listing,
--     and cancels their own requests.
--   - Recipients do NOT accept their own requests.
--   - All signed-in users can browse listings (and so can
--     unauthenticated visitors) — Find Food / Home must work
--     without login.
--   - Requester contact details and messages are visible only to
--     the requester and the listing owner, never the public.
--
-- WHAT IS PUBLIC vs. PRIVATE
--
--   food_listings: SELECT is public (anyone can browse). Writes
--     (insert/update/delete) are owner-only.
--   donation_requests: all access is authenticated-only. SELECT
--     is visible to the requester OR the listing owner. Writes
--     are restricted by ownership and by column privileges.
--
-- SECURITY HIGHLIGHTS
--
--   - Row Level Security enabled on every table.
--   - Owner columns default to auth.uid() and are NOT client-set.
--   - Update policies are paired with column-level grants so a
--     client cannot change protected columns (status,
--     reserved_quantity, user_id) through the Data API.
--   - accept_donation_request, reject_donation_request, and
--     complete_donation_request are SECURITY DEFINER functions
--     that verify auth.uid() = the listing's owner before acting.
--   - anon EXECUTE is revoked on all privileged functions.
--   - No USING(true) policies on any write path.
--
-- HOW TO APPLY THIS SCRIPT
--
-- Option A — Supabase Dashboard SQL Editor:
--   1. Log in to https://supabase.com and open SharePlate-db.
--   2. Click "SQL Editor" in the left sidebar.
--   3. Paste this entire script and click "Run".
--
-- Option B — Supabase CLI (if installed):
--   supabase db execute --project-ref <your-project-ref> < this file
--
-- This script is idempotent — safe to run multiple times.
-- It does NOT drop or delete any existing data.
--
-- IMPORTANT: After running this script, also follow the steps in
-- SUPABASE_MIGRATION_CHECKLIST.md to point the app at the new
-- project and verify auth + RLS work together.
-- ============================================================


-- ============================================================
-- TABLE 1: food_listings
-- ============================================================
-- Stores surplus food posted by donors.
-- Each row represents one food donation listing.
--
-- user_id is the donor who owns the listing. It is NOT NULL and
-- defaults to auth.uid() so an authenticated insert that omits
-- user_id is still stamped with the caller. Clients cannot set
-- user_id directly — it is excluded from the INSERT/UPDATE column
-- grants, so a forged value is rejected.

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
  user_id                 uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Index for status-filtered browse queries
CREATE INDEX IF NOT EXISTS idx_food_listings_status
  ON food_listings(status);

-- Index for "my listings" / dashboard queries
CREATE INDEX IF NOT EXISTS idx_food_listings_user_id
  ON food_listings(user_id);


-- ============================================================
-- TABLE 2: donation_requests
-- ============================================================
-- Stores requests from recipients for specific food listings.
-- Each request references a food_listing and tracks its lifecycle
-- through pending -> accepted/rejected -> completed/cancelled.
--
-- user_id is the recipient who made the request. Same ownership
-- pattern as food_listings: NOT NULL, defaults to auth.uid(), not
-- client-set.

CREATE TABLE IF NOT EXISTS donation_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  requested_quantity  numeric NOT NULL CHECK (requested_quantity > 0),
  requester_name      text NOT NULL,
  requester_contact   text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  message             text,
  user_id             uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for "requests on a listing" queries (listing detail page)
CREATE INDEX IF NOT EXISTS idx_donation_requests_listing_id
  ON donation_requests(listing_id);

-- Index for "my requests" / dashboard queries
CREATE INDEX IF NOT EXISTS idx_donation_requests_user_id
  ON donation_requests(user_id);


-- ============================================================
-- ROW LEVEL SECURITY — food_listings
-- ============================================================
-- RLS enabled. SELECT is public so Find Food / Home browsing works
-- without login. All writes are owner-only (authenticated).
--
-- Column privileges (below the policies) ensure that even the owner
-- cannot change status, reserved_quantity, or user_id through the
-- Data API — those columns are controlled by the SECURITY DEFINER
-- accept/reject/complete functions.

ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;

-- Grants:
--   - anon: SELECT only (public browse).
--   - authenticated: SELECT (browse) + INSERT/UPDATE/DELETE on the
--     owner-editable columns only (see column grants below).
GRANT SELECT ON food_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON food_listings TO authenticated;

-- Narrow INSERT/UPDATE to the columns a donor legitimately sets.
-- This prevents a client from setting status, reserved_quantity,
-- user_id, or created_at directly.
REVOKE INSERT ON food_listings FROM authenticated;
GRANT INSERT (
  food_name, quantity, unit, category, pickup_location,
  availability_deadline, handling_info, allergen_info,
  additional_instructions, donor_name, donor_contact, image_url
) ON food_listings TO authenticated;

REVOKE UPDATE ON food_listings FROM authenticated;
GRANT UPDATE (
  food_name, quantity, unit, category, pickup_location,
  availability_deadline, handling_info, allergen_info,
  additional_instructions, donor_name, donor_contact, image_url
) ON food_listings TO authenticated;

-- --- food_listings policies ---

DROP POLICY IF EXISTS "select_listings_public" ON food_listings;
CREATE POLICY "select_listings_public" ON food_listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_listings" ON food_listings;
CREATE POLICY "insert_own_listings" ON food_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_listings" ON food_listings;
CREATE POLICY "update_own_listings" ON food_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_listings" ON food_listings;
CREATE POLICY "delete_own_listings" ON food_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- ROW LEVEL SECURITY — donation_requests
-- ============================================================
-- RLS enabled. All access is authenticated-only — request contact
-- details and messages are private between requester and donor.
--
-- SELECT: visible to the requester OR the listing owner.
-- INSERT: authenticated; the requester is the caller (user_id
--   defaults to auth.uid()).
-- UPDATE/DELETE: requester only, and column-restricted so the
--   client cannot change status, listing_id, user_id, or
--   reserved_quantity — status transitions go through the
--   SECURITY DEFINER functions.

ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;

-- Grants: authenticated only (no anon access to requests at all).
GRANT SELECT, INSERT, UPDATE, DELETE ON donation_requests TO authenticated;

-- Narrow INSERT to the columns a recipient legitimately sets.
REVOKE INSERT ON donation_requests FROM authenticated;
GRANT INSERT (
  listing_id, requested_quantity, requester_name,
  requester_contact, message
) ON donation_requests TO authenticated;

-- Narrow UPDATE to the columns a recipient can edit on their own
-- request (NOT status — status is controlled by the functions).
REVOKE UPDATE ON donation_requests FROM authenticated;
GRANT UPDATE (
  requested_quantity, requester_name, requester_contact, message
) ON donation_requests TO authenticated;

-- --- donation_requests policies ---

-- A request is visible to the requester or to the owner of the
-- listing it targets. The EXISTS subquery checks the parent
-- listing's owner without needing a user_id join column on the
-- request itself for the donor side.
DROP POLICY IF EXISTS "select_requests_as_requester_or_owner" ON donation_requests;
CREATE POLICY "select_requests_as_requester_or_owner" ON donation_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM food_listings
      WHERE food_listings.id = donation_requests.listing_id
        AND food_listings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_requests" ON donation_requests;
CREATE POLICY "insert_own_requests" ON donation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_requests" ON donation_requests;
CREATE POLICY "update_own_requests" ON donation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_requests" ON donation_requests;
CREATE POLICY "delete_own_requests" ON donation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


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
-- AUTHORIZATION: only the owner of the parent listing may accept
-- a request on it. The function derives the caller from
-- auth.uid() (never from a parameter) and verifies
-- auth.uid() = food_listings.user_id. anon is revoked, so an
-- unauthenticated call is rejected by the EXECUTE grant before
-- the body runs.
--
-- Steps:
--   1. Require an authenticated caller.
--   2. Lock the request row (FOR UPDATE).
--   3. Verify the request is still "pending".
--   4. Lock the parent listing row (FOR UPDATE).
--   5. Verify the caller owns the listing.
--   6. Verify the listing is still active (available/accepted).
--   7. Calculate available = quantity - reserved_quantity.
--   8. If requested > available, return an error.
--   9. Atomically increment reserved_quantity; if fully reserved,
--      mark listing status 'accepted'.
--  10. Set request status to 'accepted'.
--  11. Return success.
--
-- The row locking (FOR UPDATE) ensures that two concurrent accepts
-- cannot both succeed and over-reserve the same listing.

CREATE OR REPLACE FUNCTION accept_donation_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id      uuid;
  v_requested       numeric;
  v_request_status  text;
  v_listing_status  text;
  v_quantity        numeric;
  v_reserved        numeric;
  v_available       numeric;
  v_listing_owner   uuid;
BEGIN
  -- Require an authenticated caller. auth.uid() is the only source
  -- of the caller's identity.
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the request row
  SELECT listing_id, requested_quantity, status
    INTO v_listing_id, v_requested, v_request_status
  FROM donation_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request is not pending');
  END IF;

  -- Lock the listing row and read its owner for authorization
  SELECT status, quantity, reserved_quantity, user_id
    INTO v_listing_status, v_quantity, v_reserved, v_listing_owner
  FROM food_listings
  WHERE id = v_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  -- Authorization: only the listing owner may accept requests.
  IF v_listing_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_listing_status NOT IN ('available', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing is no longer active');
  END IF;

  v_available := v_quantity - v_reserved;

  IF v_requested > v_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough available quantity');
  END IF;

  -- Update reserved quantity and mark listing 'accepted' if fully reserved
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

REVOKE EXECUTE ON FUNCTION accept_donation_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION accept_donation_request(uuid) TO authenticated;


-- ============================================================
-- FUNCTION: reject_donation_request
-- ============================================================
-- SECURITY DEFINER function that rejects a pending or accepted
-- request. Only the listing owner may reject.
--
-- Because direct client UPDATE on donation_requests.status is
-- blocked by column privileges, this function is the only path
-- to set status = 'rejected'. It does NOT release reserved
-- quantity (a pending request has not reserved anything; an
-- accepted request that is later rejected would need a release
-- path — see the NOTE below the function).

CREATE OR REPLACE FUNCTION reject_donation_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id      uuid;
  v_request_status  text;
  v_listing_owner   uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT listing_id, status
    INTO v_listing_id, v_request_status
  FROM donation_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request_status NOT IN ('pending', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request cannot be rejected');
  END IF;

  SELECT user_id INTO v_listing_owner
  FROM food_listings
  WHERE id = v_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  IF v_listing_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- If the request was previously accepted, release its reserved
  -- quantity before marking it rejected.
  IF v_request_status = 'accepted' THEN
    UPDATE food_listings
      SET reserved_quantity = GREATEST(reserved_quantity - (
            SELECT requested_quantity FROM donation_requests WHERE id = p_request_id
          ), 0),
          status = CASE
            WHEN reserved_quantity - (SELECT requested_quantity FROM donation_requests WHERE id = p_request_id) < quantity THEN 'available'
            ELSE status
          END
      WHERE id = v_listing_id;
  END IF;

  UPDATE donation_requests
    SET status = 'rejected'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION reject_donation_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION reject_donation_request(uuid) TO authenticated;


-- ============================================================
-- FUNCTION: complete_donation_request
-- ============================================================
-- SECURITY DEFINER function that marks an accepted request as
-- completed. Only the listing owner may complete a request.
-- This is the handover confirmation step.

CREATE OR REPLACE FUNCTION complete_donation_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id      uuid;
  v_request_status  text;
  v_listing_owner   uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT listing_id, status
    INTO v_listing_id, v_request_status
  FROM donation_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request_status <> 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only accepted requests can be completed');
  END IF;

  SELECT user_id INTO v_listing_owner
  FROM food_listings
  WHERE id = v_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  IF v_listing_owner <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE donation_requests
    SET status = 'completed'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION complete_donation_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_donation_request(uuid) TO authenticated;


-- ============================================================
-- END OF SCRIPT
-- ============================================================
-- After running this, complete the steps in
-- SUPABASE_MIGRATION_CHECKLIST.md to point the app at the new
-- project and verify auth + RLS work together.
--
-- REMINDER: This script assumes an EMPTY target database. If your
-- SharePlate-db project already has rows in food_listings or
-- donation_requests, do NOT run this as-is — the NOT NULL
-- user_id columns will fail to backfill. In that case, add the
-- columns as nullable first, backfill user_id per row, then set
-- NOT NULL. See the checklist for the safe-with-data sequence.

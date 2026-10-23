/*
# SharePlate — Food Donation Platform Schema

## Overview
Creates the core database tables for SharePlate, a food donation and redistribution
platform. This is a single-tenant MVP (no authentication yet), so all data is
intentionally public/shared — any visitor can create listings and requests.
The dashboard is labeled as a prototype in the UI since there is no user auth.

## Tables

### 1. food_listings
Stores surplus food posted by donors.
- id (uuid, PK)
- food_name (text, not null) — name of the food
- quantity (numeric, not null) — total amount available
- unit (text, not null) — e.g. "meal packets", "kg", "portions"
- category (text, not null) — e.g. "Cooked Meals", "Produce", "Bakery"
- pickup_location (text, not null) — where to collect
- availability_deadline (timestamptz, not null) — latest pickup time
- handling_info (text, not null) — preparation / storage instructions
- allergen_info (text, not null) — allergen warnings
- additional_instructions (text, nullable) — optional notes
- donor_name (text, not null) — name of the donor (no auth yet)
- donor_contact (text, nullable) — optional contact info
- status (text, not null, default 'available') — available | accepted | completed | cancelled
- reserved_quantity (numeric, not null, default 0) — amount reserved by accepted requests
- image_url (text, nullable) — optional image
- created_at (timestamptz, default now())

### 2. donation_requests
Stores requests from recipients for specific listings.
- id (uuid, PK)
- listing_id (uuid, FK → food_listings.id ON DELETE CASCADE)
- requested_quantity (numeric, not null) — amount requested
- requester_name (text, not null) — name of the recipient (no auth yet)
- requester_contact (text, nullable) — optional contact info
- status (text, not null, default 'pending') — pending | accepted | rejected | completed | cancelled
- message (text, nullable) — optional note from requester
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Both tables are intentionally public/shared (no auth MVP).
- Grants: CRUD on both tables to anon + authenticated.
- Policies: USING (true) / WITH CHECK (true) on all verbs — data is intentionally public.

## Functions
### accept_donation_request(p_request_id uuid)
SECURITY DEFINER function that atomically accepts a request:
1. Locks the parent listing row.
2. Verifies the listing is still active and has enough unreserved quantity.
3. Updates reserved_quantity on the listing.
4. Sets request status to 'accepted'.
5. If fully reserved, marks listing status as 'accepted'.
This enforces the "no over-reservation" rule at the database level, not just the frontend.
*/

-- ============================================================
-- food_listings
-- ============================================================

CREATE TABLE IF NOT EXISTS food_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  category text NOT NULL,
  pickup_location text NOT NULL,
  availability_deadline timestamptz NOT NULL,
  handling_info text NOT NULL,
  allergen_info text NOT NULL,
  additional_instructions text,
  donor_name text NOT NULL,
  donor_contact text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','accepted','completed','cancelled')),
  reserved_quantity numeric NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON food_listings TO anon, authenticated;

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

-- ============================================================
-- donation_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS donation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  requested_quantity numeric NOT NULL CHECK (requested_quantity > 0),
  requester_name text NOT NULL,
  requester_contact text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON donation_requests TO anon, authenticated;

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

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_donation_requests_listing_id ON donation_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_food_listings_status ON food_listings(status);

-- ============================================================
-- updated_at trigger for donation_requests
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
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
-- accept_donation_request — atomic, over-reservation-safe
-- ============================================================

CREATE OR REPLACE FUNCTION accept_donation_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id uuid;
  v_requested numeric;
  v_listing_status text;
  v_quantity numeric;
  v_reserved numeric;
  v_available numeric;
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
    RETURN jsonb_build_object('success', false, 'error', 'Request is not pending (current status: ' || v_listing_status || ')');
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
    RETURN jsonb_build_object('success', false, 'error', 'Not enough available quantity. Available: ' || v_available || ', requested: ' || v_requested);
  END IF;

  -- Update reserved quantity
  UPDATE food_listings
    SET reserved_quantity = reserved_quantity + v_requested,
        status = CASE WHEN (reserved_quantity + v_requested) >= quantity THEN 'accepted' ELSE status END
  WHERE id = v_listing_id;

  -- Accept the request
  UPDATE donation_requests
    SET status = 'accepted'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION accept_donation_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION accept_donation_request(uuid) TO anon, authenticated;

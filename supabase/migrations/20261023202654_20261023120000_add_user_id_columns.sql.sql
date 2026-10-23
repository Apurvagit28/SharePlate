-- Add user_id column to food_listings (nullable to preserve existing rows)
ALTER TABLE food_listings
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to donation_requests (nullable, table is currently empty)
ALTER TABLE donation_requests
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set default for future inserts so authenticated users are auto-stamped
ALTER TABLE food_listings
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE donation_requests
  ALTER COLUMN user_id SET DEFAULT auth.uid();

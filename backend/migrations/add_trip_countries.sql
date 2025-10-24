-- Migration: Add support for multi-country trips
-- Run this in Supabase SQL Editor

-- Step 1: Make country_id nullable (trips can have 0 or many countries now)
ALTER TABLE trips 
ALTER COLUMN country_id DROP NOT NULL;

-- Step 2: Create junction table for trip-country relationships
CREATE TABLE IF NOT EXISTS trip_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id),
  added_at TIMESTAMP DEFAULT now(),
  
  -- Prevent duplicate country entries for same trip
  UNIQUE(trip_id, country_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_countries_trip ON trip_countries(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_countries_country ON trip_countries(country_id);

-- Step 4: Migrate existing data
-- Copy existing trip->country relationships to junction table
INSERT INTO trip_countries (trip_id, country_id)
SELECT id, country_id 
FROM trips 
WHERE country_id IS NOT NULL
ON CONFLICT (trip_id, country_id) DO NOTHING;

-- Step 5: Verify migration
SELECT 
  'trips' as table_name,
  COUNT(*) as count
FROM trips
UNION ALL
SELECT 
  'trip_countries' as table_name,
  COUNT(*) as count
FROM trip_countries;

-- Should show trip_countries count >= trips count (if trips had country_id)


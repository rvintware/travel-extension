-- ============================================================================
-- PHASE 1: DEDUPLICATION - Add Unique Constraint for place_id
-- ============================================================================
-- Created: October 25, 2025
-- Purpose: Prevent duplicate locations with same place_id per user
-- ============================================================================

BEGIN;

-- 1. Add sources column to track all URLs where location was found
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;

-- 2. Create unique constraint on (user_id, place_id)
-- This prevents duplicate locations with same place_id for same user
-- Partial index: only applies WHERE place_id IS NOT NULL
-- Locations without place_id (unverified) can still be duplicated
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_place_id 
  ON locations(user_id, place_id) 
  WHERE place_id IS NOT NULL;

-- 3. Add GIN index for sources array (enables fast JSONB searches)
CREATE INDEX IF NOT EXISTS idx_locations_sources 
  ON locations USING GIN(sources);

-- 4. Backfill sources array with existing source_url
-- Only update rows where sources is empty
UPDATE locations
SET sources = jsonb_build_array(source_url)
WHERE sources = '[]'::jsonb AND source_url IS NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check for any duplicate place_ids (should return 0 rows after migration)
-- SELECT user_id, place_id, COUNT(*) as count
-- FROM locations
-- WHERE place_id IS NOT NULL
-- GROUP BY user_id, place_id
-- HAVING COUNT(*) > 1;

-- Check sources array population
-- SELECT id, name, 
--        jsonb_array_length(sources) as source_count,
--        sources
-- FROM locations
-- WHERE sources != '[]'::jsonb
-- LIMIT 10;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP INDEX IF EXISTS idx_unique_user_place_id;
-- DROP INDEX IF EXISTS idx_locations_sources;
-- ALTER TABLE locations DROP COLUMN IF EXISTS sources;


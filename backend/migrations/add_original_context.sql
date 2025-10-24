-- Migration: Add original_context column for storing rich context from Phase 0.3
-- Run this in Supabase SQL Editor

-- Add column for rich context storage
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS original_context JSONB;

-- Add index for full-text search on location name
CREATE INDEX IF NOT EXISTS idx_locations_name_gin 
ON locations USING gin(to_tsvector('english', name));

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' 
  AND column_name = 'original_context';

-- Should return:
-- column_name        | data_type
-- -------------------|----------
-- original_context   | jsonb


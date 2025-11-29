-- ============================================================================
-- ADD LINK_URL COLUMN TO LOCATIONS TABLE
-- ============================================================================
-- Purpose: Support saving locations via right-click on Google Maps links
-- Phase: Link-First Processing Architecture - Phase 1
-- Date: November 23, 2025
-- ============================================================================

-- Add link_url column to locations table
ALTER TABLE locations 
ADD COLUMN link_url TEXT;

-- Add index for finding locations by link
CREATE INDEX idx_locations_link_url ON locations(link_url);

-- Add comment
COMMENT ON COLUMN locations.link_url IS 'Original link URL if location was saved via right-click on link (e.g., Google Maps URL)';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
-- DROP INDEX idx_locations_link_url;
-- ALTER TABLE locations DROP COLUMN link_url;
-- ============================================================================


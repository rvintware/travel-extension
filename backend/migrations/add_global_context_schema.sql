-- ============================================================================
-- DOCUMENT GLOBAL CONTEXT SCHEMA
-- ============================================================================
-- This migration adds a comment documenting the structure of the original_context
-- JSONB field to support context-first location extraction.
--
-- No schema changes needed - existing JSONB field handles this!
-- ============================================================================

-- Update comment on original_context to document structure
COMMENT ON COLUMN locations.original_context IS 
'JSONB storing extraction context. Structure:
{
  "globalContext": {
    "city": "Qingdao",
    "region": "Shandong Province",
    "country": "China",
    "countryCode": "CN",
    "coordinates": {
      "lat": 36.067,
      "lng": 120.383
    },
    "confidence": 0.95,
    "reasoning": "Screenshot shows Reddit post about Qingdao with multiple location mentions"
  },
  "extractionMethod": "context-first" | "legacy",
  "screenshotAnalyzed": true,
  "coordinateSource": "google" | "ai-estimated" | "not-found"
}';

-- ============================================================================
-- EXAMPLE RECORDS
-- ============================================================================

-- Case 1: Google Places Found (Best Case)
-- {
--   "name": "Tsingtao Brewery Museum",
--   "country_id": "china-uuid",
--   "lat": 36.068123,  // From Google
--   "lng": 120.382456, // From Google
--   "place_id": "ChIJ...",
--   "location_verified": true,
--   "confidence_score": 0.95,
--   "original_context": {
--     "globalContext": {
--       "city": "Qingdao",
--       "country": "China",
--       "coordinates": { "lat": 36.067, "lng": 120.383 }
--     },
--     "coordinateSource": "google"
--   }
-- }

-- Case 2: AI Estimated Coordinates (Fallback)
-- {
--   "name": "pedestrian street on Dabao Island",
--   "country_id": "china-uuid",
--   "lat": 36.067,     // From global context (estimated)
--   "lng": 120.383,    // From global context (estimated)
--   "place_id": null,
--   "location_verified": false,
--   "confidence_score": 0.70,
--   "original_context": {
--     "globalContext": {
--       "city": "Qingdao",
--       "country": "China", 
--       "coordinates": { "lat": 36.067, "lng": 120.383 }
--     },
--     "coordinateSource": "ai-estimated"
--   },
--   "summary": "Location in Qingdao, China (coordinates estimated)"
-- }

-- Case 3: Complete Failure (Rare)
-- {
--   "name": "some vague place",
--   "country_id": "china-uuid",
--   "lat": null,
--   "lng": null,
--   "location_verified": false,
--   "confidence_score": 0.40,
--   "original_context": {
--     "globalContext": null, // No context detected
--     "coordinateSource": "not-found"
--   },
--   "error_message": "Could not determine location or coordinates"
-- }

-- ============================================================================
-- MIGRATION STATUS
-- ============================================================================
-- This is a documentation-only migration. No data migration needed.
-- The original_context field already exists and can store this structure.


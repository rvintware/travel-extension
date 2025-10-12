-- ============================================================================
-- TRAVEL COMPANION - DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Last Updated: October 11, 2025
-- Architecture: Pool + References (many-to-many)
-- 
-- Design Principles:
-- 1. Locations exist in country-grouped pools
-- 2. Trips reference locations (no duplication)
-- 3. Same location can be in multiple trips with different schedules
-- 4. Support both single-saves and bulk imports
-- 5. Future-proof for map visualization and route optimization
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- USERS
-- Simple user management (no auth for Phase 0.2, just user tracking)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Future: Add auth fields (email, password_hash, etc.)
  created_at TIMESTAMP DEFAULT now(),
  last_active TIMESTAMP DEFAULT now(),
  
  -- Preferences (future)
  default_country_id UUID, -- Default country for new saves
  timezone TEXT DEFAULT 'UTC'
);

CREATE INDEX idx_users_created ON users(created_at);

-- ============================================================================
-- LOCATION ORGANIZATION
-- ============================================================================

-- COUNTRIES
-- Top-level grouping for locations (Japan, USA, France, etc.)
-- Locations are grouped by country before being organized into trips
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE, -- ISO 3166-1 alpha-2: JP, US, FR, etc.
  emoji TEXT, -- 🇯🇵, 🇺🇸, 🇫🇷
  
  -- Metadata
  region TEXT, -- Asia, Europe, Americas, etc.
  
  created_at TIMESTAMP DEFAULT now()
);

-- Pre-populate common countries
INSERT INTO countries (name, code, emoji, region) VALUES
  ('Japan', 'JP', '🇯🇵', 'Asia'),
  ('United States', 'US', '🇺🇸', 'Americas'),
  ('France', 'FR', '🇫🇷', 'Europe'),
  ('Italy', 'IT', '🇮🇹', 'Europe'),
  ('Spain', 'ES', '🇪🇸', 'Europe'),
  ('Thailand', 'TH', '🇹🇭', 'Asia'),
  ('United Kingdom', 'GB', '🇬🇧', 'Europe'),
  ('Canada', 'CA', '🇨🇦', 'Americas'),
  ('Australia', 'AU', '🇦🇺', 'Oceania'),
  ('Germany', 'DE', '🇩🇪', 'Europe')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_region ON countries(region);

-- ============================================================================
-- LOCATIONS (THE POOL)
-- ============================================================================

-- LOCATIONS
-- The master pool of all saved locations, grouped by country
-- Locations are saved once and referenced by multiple trips
-- 
-- Key Design Decision (Issue 2):
-- Editing a location updates it everywhere it's referenced
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id),
  
  -- ============================================================================
  -- BASIC INFORMATION
  -- ============================================================================
  name TEXT NOT NULL,
  
  -- Google Places data (from Phase 0.3)
  place_id TEXT, -- Google Places ID for deduplication
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  
  -- Classification
  category TEXT, -- restaurant, bar, cafe, sight, activity, hotel, etc.
  subcategory TEXT, -- italian_restaurant, temple, museum, etc.
  price_level INTEGER, -- 1-4 from Google Places
  
  -- ============================================================================
  -- RICH CONTENT (from AI processing)
  -- ============================================================================
  summary TEXT, -- 1-2 sentence AI-generated description
  tips JSONB DEFAULT '[]'::jsonb, -- ["Arrive before 11am", "Try the ramen"]
  photos TEXT[] DEFAULT ARRAY[]::TEXT[], -- URLs to photos
  
  -- User overrides (can edit these without affecting AI data)
  user_notes TEXT,
  user_rating INTEGER, -- 1-5 stars
  is_favorite BOOLEAN DEFAULT false,
  
  -- ============================================================================
  -- SOURCE TRACKING
  -- ============================================================================
  original_text TEXT NOT NULL, -- The text user highlighted
  source_url TEXT NOT NULL, -- Where they found it
  page_title TEXT,
  html_context TEXT, -- Surrounding HTML for debugging
  
  -- FLAGS (your idea from discussion)
  is_from_itinerary BOOLEAN DEFAULT false, -- Was this imported as part of bulk itinerary?
  source_type TEXT DEFAULT 'single_save', -- 'single_save' | 'bulk_import'
  import_batch_id UUID, -- Groups locations from same bulk import
  
  -- ============================================================================
  -- PROCESSING METADATA
  -- ============================================================================
  processing_status TEXT DEFAULT 'pending',
  location_verified BOOLEAN DEFAULT false, -- Found via Google Places API?
  error_message TEXT,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00 (AI confidence)
  
  -- ============================================================================
  -- TIMESTAMPS
  -- ============================================================================
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (processing_status IN ('pending', 'processing', 'complete', 'error')),
  CONSTRAINT valid_source_type CHECK (source_type IN ('single_save', 'bulk_import')),
  CONSTRAINT valid_price_level CHECK (price_level BETWEEN 1 AND 4),
  CONSTRAINT valid_user_rating CHECK (user_rating BETWEEN 1 AND 5)
);

-- Indexes for common queries
CREATE INDEX idx_locations_user_country ON locations(user_id, country_id);
CREATE INDEX idx_locations_user_status ON locations(user_id, processing_status);
CREATE INDEX idx_locations_place_id ON locations(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_is_from_itinerary ON locations(user_id, is_from_itinerary);
CREATE INDEX idx_locations_import_batch ON locations(import_batch_id) WHERE import_batch_id IS NOT NULL;
CREATE INDEX idx_locations_created ON locations(user_id, created_at DESC);

-- ============================================================================
-- TRIPS (ITINERARIES)
-- ============================================================================

-- TRIPS
-- User-created trip itineraries that reference locations from the pool
-- Multiple trips can reference the same locations
-- 
-- Key Design Decision:
-- Trips don't "own" locations, they just reference them
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id), -- Primary country for this trip
  
  -- ============================================================================
  -- BASIC INFORMATION
  -- ============================================================================
  name TEXT NOT NULL,
  description TEXT,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  duration_days INTEGER, -- Can differ from date range (e.g., "3 days" without specific dates)
  
  -- ============================================================================
  -- FLAGS (your idea from discussion)
  -- ============================================================================
  is_itinerary BOOLEAN DEFAULT false, -- Was this created from bulk import?
  source_url TEXT, -- Original blog URL if imported
  
  -- Organization
  is_active BOOLEAN DEFAULT false, -- Currently active trip for saves
  is_archived BOOLEAN DEFAULT false, -- Hide from main view
  display_order INTEGER DEFAULT 0,
  
  -- ============================================================================
  -- METADATA
  -- ============================================================================
  budget_currency TEXT DEFAULT 'USD',
  estimated_budget DECIMAL(10, 2),
  
  -- Sharing (future)
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- For sharing via link
  
  -- ============================================================================
  -- TIMESTAMPS
  -- ============================================================================
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_viewed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_trips_user_country ON trips(user_id, country_id);
CREATE INDEX idx_trips_user_active ON trips(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_trips_user_archived ON trips(user_id, is_archived);
CREATE INDEX idx_trips_share_token ON trips(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_trips_created ON trips(user_id, created_at DESC);

-- ============================================================================
-- TRIP_LOCATIONS (MANY-TO-MANY JOIN TABLE)
-- ============================================================================

-- TRIP_LOCATIONS
-- Links locations to trips with trip-specific metadata
-- This enables the same location to be in multiple trips with different schedules
-- 
-- Key Design Decision (Issue 1):
-- Same location can have different day_number, time, notes in different trips
CREATE TABLE trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- ============================================================================
  -- TRIP-SPECIFIC SCHEDULING (Issue 1: different schedules in different trips)
  -- ============================================================================
  day_number INTEGER, -- NULL = unscheduled/someday bucket
  display_order INTEGER DEFAULT 0, -- Order within the day
  
  -- Timing (optional, trip-specific)
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening'
  suggested_time TEXT, -- "10:00 AM"
  estimated_duration_minutes INTEGER, -- How long to spend here
  
  -- Trip-specific overrides
  notes TEXT, -- Personal notes for this trip
  priority TEXT DEFAULT 'normal', -- 'must_see', 'normal', 'optional'
  status TEXT DEFAULT 'planned', -- 'planned', 'visited', 'skipped'
  visited_date DATE, -- When did you actually visit (post-trip)
  
  -- ============================================================================
  -- METADATA
  -- ============================================================================
  added_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Constraints
  UNIQUE(trip_id, location_id), -- Same location can't be added twice to same trip
  CONSTRAINT valid_priority CHECK (priority IN ('must_see', 'normal', 'optional')),
  CONSTRAINT valid_status CHECK (status IN ('planned', 'visited', 'skipped'))
);

-- Indexes for common queries
CREATE INDEX idx_trip_locations_trip ON trip_locations(trip_id, day_number, display_order);
CREATE INDEX idx_trip_locations_location ON trip_locations(location_id);
CREATE INDEX idx_trip_locations_day ON trip_locations(trip_id, day_number) WHERE day_number IS NOT NULL;
CREATE INDEX idx_trip_locations_unscheduled ON trip_locations(trip_id) WHERE day_number IS NULL;

-- ============================================================================
-- BULK IMPORT TRACKING
-- ============================================================================

-- IMPORT_JOBS
-- Tracks bulk imports from blogs/itineraries
-- Helps with debugging and analytics
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Source
  source_url TEXT NOT NULL,
  source_html TEXT, -- Store for debugging/re-processing
  source_type TEXT DEFAULT 'blog', -- 'blog', 'youtube', 'reddit'
  
  -- Extraction results
  detected_days INTEGER,
  detected_locations INTEGER,
  created_trip_id UUID REFERENCES trips(id),
  
  -- Processing
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  
  -- Performance metrics
  processing_time_ms INTEGER,
  ai_tokens_used INTEGER,
  
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  
  CONSTRAINT valid_import_status CHECK (status IN ('pending', 'processing', 'complete', 'error'))
);

CREATE INDEX idx_import_jobs_user ON import_jobs(user_id, created_at DESC);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_trip ON import_jobs(trip_id) WHERE trip_id IS NOT NULL;

-- ============================================================================
-- ROUTE OPTIMIZATION & DISTANCE CACHING
-- ============================================================================

-- LOCATION_DISTANCES
-- Caches distances/durations between locations (from Google Maps API)
-- Enables route optimization and "day is too packed" warnings
-- 
-- Key Design Decision:
-- Calculate once, cache forever (or until coordinates change)
CREATE TABLE location_distances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Distance data (from Google Maps Distance Matrix API)
  distance_meters INTEGER NOT NULL,
  distance_text TEXT, -- "2.5 km"
  duration_seconds INTEGER NOT NULL,
  duration_text TEXT, -- "15 mins"
  
  travel_mode TEXT DEFAULT 'walking', -- 'walking', 'driving', 'transit', 'bicycling'
  
  -- Route polyline (for map visualization)
  route_polyline TEXT, -- Encoded polyline from Google
  
  -- Cache management
  calculated_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP, -- Recalculate after this date (optional)
  
  CONSTRAINT valid_travel_mode CHECK (travel_mode IN ('walking', 'driving', 'transit', 'bicycling')),
  UNIQUE(from_location_id, to_location_id, travel_mode)
);

CREATE INDEX idx_location_distances_from ON location_distances(from_location_id);
CREATE INDEX idx_location_distances_to ON location_distances(to_location_id);
CREATE INDEX idx_location_distances_mode ON location_distances(travel_mode);

-- ============================================================================
-- FUTURE: SHARING & COLLABORATION
-- ============================================================================

-- TRIP_COLLABORATORS (future Phase 2.0)
-- Allow multiple users to edit the same trip
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  
  invited_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP,
  
  UNIQUE(trip_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'editor', 'viewer'))
);

CREATE INDEX idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user ON trip_collaborators(user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need auto-updating timestamps
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_locations_updated_at BEFORE UPDATE ON trip_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXAMPLE QUERIES (for reference)
-- ============================================================================

-- Get all locations in a country pool for a user
-- SELECT * FROM locations 
-- WHERE user_id = ? AND country_id = ? 
-- ORDER BY created_at DESC;

-- Get all locations in a trip (with trip-specific scheduling)
-- SELECT l.*, tl.day_number, tl.display_order, tl.suggested_time, tl.notes
-- FROM locations l
-- JOIN trip_locations tl ON l.id = tl.location_id
-- WHERE tl.trip_id = ?
-- ORDER BY tl.day_number, tl.display_order;

-- Get unscheduled locations in a trip (someday bucket)
-- SELECT l.* FROM locations l
-- JOIN trip_locations tl ON l.id = tl.location_id
-- WHERE tl.trip_id = ? AND tl.day_number IS NULL;

-- Get all trips that reference a specific location
-- SELECT t.* FROM trips t
-- JOIN trip_locations tl ON t.id = tl.trip_id
-- WHERE tl.location_id = ?;

-- Calculate total time for a day (with distances)
-- SELECT 
--   SUM(tl.estimated_duration_minutes) as activity_time,
--   SUM(ld.duration_seconds) / 60 as travel_time
-- FROM trip_locations tl
-- LEFT JOIN location_distances ld ON ld.from_location_id = tl.location_id
-- WHERE tl.trip_id = ? AND tl.day_number = ?;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Phase 0.1 → Phase 0.2 Migration:
-- 1. Create all tables above
-- 2. Migrate existing chrome.storage.local data:
--    - captures → locations (with country auto-detection)
--    - Create default "My Trips" trip
--    - Link all locations to default trip
-- 
-- Data Mapping:
--   SavedCapture → Location
--   - id → id
--   - text → original_text
--   - url → source_url
--   - pageTitle → page_title
--   - timestamp → created_at
--   - NEW: country_id (detect from place name or ask user)

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================


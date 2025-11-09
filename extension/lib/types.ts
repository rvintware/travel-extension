// Core data types for Phase 0.2

// ============================================================================
// PHASE 0.1 TYPES (Legacy - for backward compatibility)
// ============================================================================

export interface SavedCapture {
  id: string;
  text: string;
  url: string;
  pageTitle: string;
  timestamp: number;
  tripId: string;
}

// ============================================================================
// PHASE 0.2 TYPES (Backend API)
// ============================================================================

export interface Settings {
  defaultTripId?: string;
  defaultView: 'trips' | 'locations';
  rememberLastTab: boolean;
  openaiApiKey?: string;  // BYOK: API key (stored locally)
  useOwnApiKey?: boolean;  // BYOK: Toggle state
}

export interface Country {
  id: string;
  name: string;
  code: string;
  emoji: string | null;
  region: string | null;
}

export interface TipObject {
  text: string
  source: 'highlight' | 'context' | 'page' | 'google_reviews'
  confidence: number
  review_rating?: number  // Only for google_reviews
}

export interface Location {
  id: string;
  user_id: string;
  country_id: string;
  name: string;
  place_id?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  category?: string | null;
  subcategory?: string | null;
  summary?: string | null;
  tips: TipObject[];  // PHASE 2: Structured tips with source tags
  photos: string[];
  user_notes?: string | null;
  user_rating?: number | null;
  is_favorite: boolean;
  original_text: string;
  source_url: string;
  page_title?: string | null;
  is_from_itinerary: boolean;
  source_type: 'single_save' | 'bulk_import';
  processing_status: 'pending' | 'processing' | 'complete' | 'error';
  location_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  country_id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  is_itinerary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Populated from join
  country?: Country;
  locationCount?: number;
}

export interface TripLocation {
  id: string;
  trip_id: string;
  location_id: string;
  day_number?: number | null;
  display_order: number;
  time_of_day?: string | null;
  suggested_time?: string | null;
  estimated_duration_minutes?: number | null;
  notes?: string | null;
  priority: 'must_see' | 'normal' | 'optional';
  status: 'planned' | 'visited' | 'skipped';
  added_at: string;
}

export interface LocationWithTripData extends Location {
  // Trip-specific data (when viewing in trip context)
  tripLocationId?: string;
  dayNumber?: number | null;
  displayOrder?: number;
  timeOfDay?: string | null;
  suggestedTime?: string | null;
  estimatedDurationMinutes?: number | null;
  tripNotes?: string | null;
  priority?: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  type: 'SHOW_TOAST' | 'CAPTURES_UPDATED' | 'SETTINGS_UPDATED';
  payload?: any;
}

export interface ToastMessage extends Message {
  type: 'SHOW_TOAST';
  payload: {
    message: string;
    duration?: number;
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type ViewType = 'tripList' | 'tripDetail' | 'createTrip' | 'locationList' | 'countryDetail' | 'settings'

export interface NavigationState {
  view: ViewType;
  selectedTripId?: string;
  selectedCountryId?: string;
  selectedDay?: number | 'all' | 'unscheduled';
}


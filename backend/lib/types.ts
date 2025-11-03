// TypeScript types matching the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          last_active: string
        }
        Insert: {
          id: string
          created_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          last_active?: string
        }
      }
      countries: {
        Row: {
          id: string
          name: string
          code: string
          emoji: string | null
          region: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          emoji?: string | null
          region?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          code?: string
          emoji?: string | null
          region?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          user_id: string
          country_id: string
          name: string
          place_id: string | null
          address: string | null
          lat: number | null
          lng: number | null
          category: string | null
          subcategory: string | null
          price_level: number | null
          summary: string | null
          tips: Json
          photos: string[]
          user_notes: string | null
          user_rating: number | null
          is_favorite: boolean
          original_text: string
          source_url: string
          sources: Json  // Array of source URLs
          page_title: string | null
          html_context: string | null
          is_from_itinerary: boolean
          source_type: string
          import_batch_id: string | null
          processing_status: string
          location_verified: boolean
          error_message: string | null
          confidence_score: number | null
          created_at: string
          updated_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          country_id: string
          name: string
          place_id?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          category?: string | null
          subcategory?: string | null
          price_level?: number | null
          summary?: string | null
          tips?: Json
          photos?: string[]
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          original_text: string
          source_url: string
          sources?: Json  // Array of source URLs
          page_title?: string | null
          html_context?: string | null
          is_from_itinerary?: boolean
          source_type?: string
          import_batch_id?: string | null
          processing_status?: string
          location_verified?: boolean
          error_message?: string | null
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Update: {
          name?: string
          place_id?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          category?: string | null
          summary?: string | null
          tips?: Json
          photos?: string[]
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          processing_status?: string
          location_verified?: boolean
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          country_id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          duration_days: number | null
          is_itinerary: boolean
          source_url: string | null
          is_active: boolean
          is_archived: boolean
          display_order: number
          budget_currency: string
          estimated_budget: number | null
          is_public: boolean
          share_token: string | null
          created_at: string
          updated_at: string
          last_viewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          country_id: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          duration_days?: number | null
          is_itinerary?: boolean
          source_url?: string | null
          is_active?: boolean
          is_archived?: boolean
          display_order?: number
          budget_currency?: string
          estimated_budget?: number | null
          is_public?: boolean
          share_token?: string | null
          created_at?: string
          updated_at?: string
          last_viewed_at?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          duration_days?: number | null
          is_active?: boolean
          is_archived?: boolean
          display_order?: number
          updated_at?: string
        }
      }
      trip_locations: {
        Row: {
          id: string
          trip_id: string
          location_id: string
          day_number: number | null
          display_order: number
          time_of_day: string | null
          suggested_time: string | null
          estimated_duration_minutes: number | null
          notes: string | null
          priority: string
          status: string
          visited_date: string | null
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          location_id: string
          day_number?: number | null
          display_order?: number
          time_of_day?: string | null
          suggested_time?: string | null
          estimated_duration_minutes?: number | null
          notes?: string | null
          priority?: string
          status?: string
          visited_date?: string | null
          added_at?: string
          updated_at?: string
        }
        Update: {
          day_number?: number | null
          display_order?: number
          time_of_day?: string | null
          suggested_time?: string | null
          estimated_duration_minutes?: number | null
          notes?: string | null
          priority?: string
          status?: string
          visited_date?: string | null
          updated_at?: string
        }
      }
    }
  }
}

// ============================================================================
// Helper Types for Deduplication (Phase 1)
// ============================================================================

export interface TipObject {
  text: string
  source?: string
  priority?: number
  confidence?: number
  review_rating?: number
}

export interface LocationMergeResult {
  location: any  // Full location object
  merged: boolean
  tipsAdded: number
  message: string
}


# Travel Companion - Full Stack Project

A Chrome extension and backend system for capturing, organizing, and planning travel recommendations from across the web.

## Features

### 🎯 Capture & Organization
- **One-Click Capture**: Right-click any highlighted text to save locations. Two-option right-click (Save Location / Save to Active Trip)
**Two-Tab Interface**: Separate views for "My Locations" library and "My Trips" planning
- **Country-Grouped Library**: Locations automatically organized by country
- **Pokemon-Style Cards**: Rich location cards with photos, addresses, and context specific human tips

### 🗺️ Trip Planning
- **Day-by-Day Organization**: Plan your trips with daily itineraries
- **Time Estimates**: See how long each location takes with comfort levels
- **Flexible Management**: Move locations between days, add from library, remove vs delete
- **Active Trip System**: Set a default trip for quick saves

### ⚙️ Other Features
- **Settings Panel**: Configure default country and default trip
- **API Integration**: All data synced to Supabase backend
- **AI Enrichment**: Automatic location details via Google Places API

## Project Structure

```
travel-companion/
├── extension/              ← Chrome Extension (Plasmo + React + TypeScript)
│   ├── popup.tsx          ← Main popup UI
│   ├── background/        ← Service worker scripts
│   ├── contents/          ← Content scripts
│   ├── components/        ← React components
│   │   ├── ui/           ← Shadcn UI components
│   │   ├── LocationCard.tsx
│   │   ├── TripCard.tsx
│   │   └── Settings.tsx
│   ├── lib/              ← Utilities
│   │   ├── api.ts        ← API client
│   │   ├── storage.ts    ← Chrome storage helpers
│   │   └── types.ts      ← TypeScript types
│   └── assets/           ← Icons and images
│
├── backend/               ← Next.js 15 API + Inngest
│   ├── app/
│   │   └── api/          ← API routes
│   │       ├── health/
│   │       ├── countries/
│   │       ├── locations/
│   │       ├── trips/
│   │       ├── trip-locations/
│   │       └── inngest/  ← Inngest webhook
│   ├── inngest/          ← Background jobs
│   │   ├── client.ts
│   │   └── functions/
│   │       └── enrich-location.ts
│   ├── lib/              ← Utilities
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   └── google-places.ts
│   └── migrations/       ← Database migrations
│
└── artifacts/             ← Design & Documentation
    ├── README.md         ← Documentation index
    ├── problem_exploration.md
    ├── system_design_specification.md
    ├── database_schema.sql
    ├── database_design_decisions.md
    ├── UIUX/
    │   └── highlevel_uiux.md
    ├── PHASE_0_1_COMPLETE.md
    ├── PHASE_0_2_TESTING.md
    ├── PHASE_0_3_SETUP.md
    ├── PROJECT_STATUS.md
    └── REMOVE_DEFAULT_COUNTRY_SUMMARY.md
```

**Backend API:**
- ✅ Next.js 15 + TypeScript
- ✅ Supabase database with Pool + References architecture
- ✅ Complete REST API (15 endpoints)
- ✅ Zod validation & error handling
- ✅ CORS for extension

## Quick Start

### Run the Extension

```bash
cd extension
pnpm install
pnpm run dev
```

Then load `extension/build/chrome-mv3-dev` in Chrome at `chrome://extensions/`

See [extension/README.md](./extension/README.md) for detailed instructions.

## Documentation

All design documents are in the `artifacts/` folder:

1. **[Problem Exploration](./artifacts/problem_exploration.md)** - The core problem we're solving
2. **[System Design Specification](./artifacts/system_design_specification.md)** - Complete technical architecture
3. **[High-Level UI/UX Design](./artifacts/UIUX/highlevel_uiux.md)** - Detailed UI wireframes and design system

# 🎓 Complete System Overview: Nuts to Bolts to Architecture

This section provides a comprehensive end-to-end explanation of how the Travel Companion system works, from the lowest implementation details to the highest architectural concepts.

## 🎯 **High-Level Purpose**

This is a **Chrome Extension + Backend system** that lets you capture travel recommendations from anywhere on the web (Reddit, blogs, articles) via right-click, and automatically transforms them into organized trip itineraries with AI-enriched location data.

---

## 🏗️ **Architecture Layers**

Let's walk through the system from **bottom to top**:

### **Layer 1: Database (Supabase PostgreSQL)**

**Architecture Pattern:** Pool + References

The database uses a clever "pool and references" architecture:

```
Core Tables:
├─ users          - User accounts (UUID-based)
├─ countries      - Pre-populated country data (🇯🇵 Japan, 🇺🇸 USA, etc.)
├─ locations      - The POOL (master copy of each location)
├─ trips          - Trip itineraries
└─ trip_locations - JOIN table (many-to-many)
```

**Key Design Decision:** Locations live in a shared pool grouped by country. When you add a location to a trip, you're creating a **reference**, not a copy. Same location can be in multiple trips with different scheduling (different days, times, notes).

**Example:**
- "Senso-ji Temple" exists once in the `locations` table
- Your "Tokyo 2025" trip references it for Day 1, 10 AM
- Your "Japan Week" trip references it for Day 3, afternoon
- Edit the location → changes everywhere it's referenced

### **Layer 2: Backend API (Next.js 15)**

**Tech Stack:** Next.js 15 App Router + TypeScript + Zod validation

**API Endpoints (15 total):**

```typescript
Health:
  GET  /api/health           - Server status

Countries:
  GET  /api/countries        - List all countries

Locations:
  POST   /api/locations      - Create location (triggers AI job)
  GET    /api/locations      - List locations (with filters)
  GET    /api/locations/:id  - Get single location
  PATCH  /api/locations/:id  - Update location
  DELETE /api/locations/:id  - Delete location

Trips:
  POST   /api/trips              - Create trip
  GET    /api/trips              - List user's trips
  GET    /api/trips/:id          - Get single trip
  PATCH  /api/trips/:id          - Update trip
  DELETE /api/trips/:id          - Delete trip
  GET    /api/trips/:id/locations - Get trip's locations
  GET    /api/trips/:id/map-data  - Optimized map data

Trip-Location Links:
  POST   /api/trip-locations    - Link location to trip
  DELETE /api/trip-locations    - Remove from trip

Users:
  DELETE /api/users/:id/data   - Nuclear delete (all data)
```

**Key Features:**
- Zod validation on all inputs
- CORS configured for extension origin
- Comprehensive error handling
- No authentication (MVP - single user, trusted UUID)

### **Layer 3: AI Processing Pipeline (Inngest + OpenAI + Google Places)**

**Architecture:** Async job queue with retry logic

**The Flow:**

```
1. User right-clicks text
2. Extension captures:
   ├─ Selected text
   ├─ Screenshot (JPEG, 70% quality)
   ├─ URL and page title
   └─ User settings
3. POST to /api/locations
   ├─ Creates placeholder in DB (status: 'pending')
   ├─ Enqueues Inngest job
   └─ Returns locationId immediately
4. Extension starts polling GET /api/locations/:id
5. Inngest job processes asynchronously:
   ├─ Step 0: Extract Global Context (city, country, coordinates)
   ├─ Step 1: Count locations (1 or many?)
   ├─ Step 2a: If 1 → Multi-attempt extraction
   │   ├─ Generate 3 search query variations
   │   ├─ Try Google Places with each
   │   └─ Update placeholder with best match
   └─ Step 2b: If many → Extract array
       ├─ Create separate locations
       └─ Link all to trip if specified
6. Extension detects status change
7. UI updates with rich data
```

**AI Components:**

1. **Global Context Extraction** (Phase 0.3+)
   - Uses GPT-4o with vision to determine city/country
   - Extracts approximate coordinates
   - Example: "Qingdao, Shandong Province, China (36.067, 120.383)"

2. **Location Variations** (Smart multi-attempt)
   - Generates 3 search queries from most to least specific
   - Example:
     ```
     1. "Bar Raval, College Street, Toronto" (high)
     2. "Bar Raval Toronto" (medium)
     3. "Bar Raval" (low)
     ```
   - Tries Google Places until one succeeds

3. **Multiple Location Extraction**
   - Detects itineraries with many locations
   - Extracts as JSON array
   - Smart filtering (removes country names that got extracted as locations)
   - Deduplication (by place_id and name)

**Fallback Strategy:**
- If Google Places fails but AI extracted coordinates → use those
- If no coordinates → save with name only, mark `location_verified: false`
- Never lose user's data

### **Layer 4: Chrome Extension (Plasmo + React + TypeScript)**

**Architecture:** Manifest V3 with 3 main components

#### **A. Background Service Worker** (`background/index.ts`)

**Responsibilities:**
- Manages context menu ("⭐ Save to Tokyo 2025")
- Handles right-click events
- Captures screenshots
- Makes API calls
- Displays toast notifications

**Key Flow:**

```typescript
chrome.contextMenus.onClicked → 
  1. Get user settings
  2. Capture screenshot (chrome.tabs.captureVisibleTab)
  3. POST /api/locations with screenshot
  4. If saving to trip → POST /api/trip-locations
  5. Show toast notification
  6. Notify popup to refresh
```

**Dynamic Menu Updates:**
- Listens for `SETTINGS_UPDATED` messages
- Updates context menu title when active trip changes
- Example: "⭐ Save to Tokyo 2025" → "⭐ Save to Japan Week"

#### **B. Content Script** (`contents/index.tsx`)

**Simplified in Phase 0.3:** Only handles toast notifications

**Why:** Screenshots provide all context, no need for DOM extraction

**Toast Styling:**
```css
- Green background (#10B981)
- White text, rounded corners
- Appears top-right with slide-in animation
- Auto-dismisses after 3 seconds
```

#### **C. Popup UI** (`popup.tsx` + views)

**Architecture:** Single-page app with view state machine

```typescript
ViewType = 
  | 'locationList'    // Country-grouped library
  | 'countryDetail'   // Locations in one country
  | 'tripList'        // All trips
  | 'tripDetail'      // Trip with day filters
  | 'createTrip'      // Create trip form
  | 'settings'        // Settings panel
```

**UI Components:**

1. **Tabs** (Main navigation)
   ```
   ┌──────────────┬──────────────┐  [🔄][⚙️]
   │ My Locations │  My Trips ⭐ │
   └──────────────┴──────────────┘
   ```

2. **Location Card** (Pokemon-style)
   ```
   ┌────────────────────────────┐
   │ [Photo 280×160px]          │
   ├────────────────────────────┤
   │ 🍷 Ichiran Ramen      [⚙️] │
   │ 📍 1-22-7 Jinnan, Shibuya  │
   │ 🏷️ Restaurant · Ramen · $$│
   │ ⭐ 4.5 Google rating        │
   │ ──────────────────────────│
   │ 💡 Tips                    │
   │ • Go before 11am...        │
   │ • Order tonkotsu...        │
   │ ──────────────────────────│
   │ 🔴 reddit.com →            │
   │ Saved 2 hours ago          │
   └────────────────────────────┘
   ```

3. **Trip Card**
   ```
   ┌────────────────────────────┐
   │ 🇯🇵 Tokyo 2025      12 saved│
   │ Active · 3 days · Mar 20-27│
   └────────────────────────────┘
   ```

4. **Day Filters** (in Trip Detail)
   ```
   [All] [D1] [D2] [D3] [Unscheduled]
    ·12  ·4   ·5   ·3      ·0
   ```

5. **Time Estimate**
   ```
   ⏱️ 6h 30m total
   4h activity + 2h 30m travel
                    😊 Comfortable
   ```

**Performance Optimization - Caching Strategy:**

```typescript
// Layer 1: Chrome local storage (instant)
Cache.getTrips() → Check timestamp
  If < 5 min old → Return cached data
  If > 5 min old → Mark stale

// Layer 2: Show UI immediately with cached data
setTrips(cachedData)
setLoading(false)  // UI shows in < 100ms!

// Layer 3: Fetch fresh data in background
const freshData = await api.getTrips(userId)

// Layer 4: Seamlessly update UI
setTrips(freshData)
Cache.setTrips(freshData)
```

**Result:** Popup opens in < 100ms, feels instant

---

## 🔄 **Complete User Flow (End-to-End)**

### **Scenario:** User saves "Bar Raval has amazing vermouth" from Reddit

```
1. USER ACTION
   ├─ Browses r/Toronto on Reddit
   ├─ Highlights text: "Bar Raval near AGO has amazing vermouth"
   └─ Right-clicks → "⭐ Save to Tokyo 2025"

2. BACKGROUND WORKER
   ├─ Captures screenshot (JPEG, 70% quality)
   ├─ Gets userId, settings from chrome.storage
   └─ POST /api/locations {
       userId: "uuid-123",
       selectedText: "Bar Raval near AGO...",
       screenshot: "data:image/jpeg;base64,...",
       sourceUrl: "reddit.com/r/toronto/...",
       pageTitle: "Best bars near AGO?",
       tripId: "trip-uuid-456"
     }

3. BACKEND API (Immediate Response)
   ├─ Validates request with Zod
   ├─ Detects country from text (optional)
   ├─ INSERT INTO locations (..., status='pending')
   ├─ Enqueue Inngest job 'location/created'
   └─ RESPONSE { locationId: "loc-789", status: "pending" }

4. TOAST NOTIFICATION
   └─ "✓ Tokyo 2025" (green, 3 seconds)

5. POPUP (if open)
   ├─ Receives CAPTURES_UPDATED message
   ├─ Invalidates cache
   └─ Reloads data (shows new location with processing banner)

6. INNGEST JOB (Async, 10-15 seconds)
   
   ├─ Step 0: Extract Global Context
   │   └─ GPT-4o + vision → "Toronto, Ontario, Canada"
   
   ├─ Step 1: Count Locations
   │   └─ GPT-4o → 1 location detected
   
   ├─ Step 2: Generate 3 Variations
   │   ├─ "Bar Raval, College Street, Toronto"
   │   ├─ "Bar Raval Toronto"
   │   └─ "Bar Raval"
   
   ├─ Step 3: Try Google Places
   │   ├─ Attempt 1 → MATCH! ✅
   │   ├─ place_id: "ChIJ..."
   │   ├─ coordinates: 43.6551, -79.4103
   │   ├─ address: "505 College St, Toronto"
   │   ├─ photos: [url1, url2, url3]
   │   └─ rating: 4.5
   
   └─ Step 4: Update Database
       └─ UPDATE locations SET
           name = "Bar Raval",
           address = "505 College St...",
           lat = 43.6551,
           lng = -79.4103,
           photos = [...],
           place_id = "ChIJ...",
           location_verified = true,
           processing_status = 'complete'

7. POPUP POLLING (Every 2 seconds)
   ├─ GET /api/locations/loc-789
   ├─ Detects status = 'complete'
   ├─ Updates UI with rich data
   └─ Removes processing banner

8. FINAL RESULT
   ├─ Beautiful card with photo
   ├─ Verified address and coordinates
   ├─ Google rating
   ├─ Tips extracted and formatted
   └─ Linked to "Tokyo 2025" trip, Day 1
```

---

## 📦 **Data Models**

### **Location (Full Schema)**

```typescript
interface Location {
  id: string
  user_id: string
  country_id: string
  
  // Basic
  name: string
  place_id?: string           // Google Places ID
  address?: string
  lat?: number
  lng?: number
  category?: string           // restaurant, temple, etc.
  subcategory?: string
  
  // Rich content (from AI)
  summary?: string
  tips: string[]              // ["Tip 1", "Tip 2"]
  photos: string[]            // Photo URLs
  
  // User overrides
  user_notes?: string
  user_rating?: number        // 1-5 stars
  is_favorite: boolean
  
  // Source tracking
  original_text: string       // What user highlighted
  source_url: string
  page_title?: string
  
  // Processing metadata
  processing_status: 'pending' | 'processing' | 'complete' | 'error'
  location_verified: boolean
  confidence_score?: number   // 0.0-1.0
  
  // Timestamps
  created_at: string
  processed_at?: string
}
```

### **Trip (Full Schema)**

```typescript
interface Trip {
  id: string
  user_id: string
  country_id: string          // Primary country
  
  // Basic
  name: string
  description?: string
  
  // Dates
  start_date?: string
  end_date?: string
  duration_days?: number
  
  // Organization
  is_active: boolean          // Default for quick-saves
  is_archived: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}
```

### **TripLocation (Join Table)**

```typescript
interface TripLocation {
  id: string
  trip_id: string
  location_id: string
  
  // Trip-specific scheduling
  day_number?: number         // null = unscheduled
  display_order: number       // Order within day
  time_of_day?: string        // "morning", "afternoon", "evening"
  suggested_time?: string     // "10:00 AM"
  estimated_duration_minutes?: number
  
  // Trip-specific overrides
  notes?: string
  priority: 'must_see' | 'normal' | 'optional'
  status: 'planned' | 'visited' | 'skipped'
}
```

---

## 🎨 **UI/UX Design System**

**Design Principles:**
1. **Speed** - Every interaction < 300ms
2. **Consistency** - 4px spacing grid, unified colors
3. **Clarity** - Clear visual hierarchy
4. **Pokemon-style** - Collectible, visual location cards

**Key Measurements:**
```
Colors:
  Primary: #3B82F6 (blue)
  Success: #10B981 (green)
  Error:   #EF4444 (red)
  
Spacing:
  Card padding:     16px (p-4)
  Between cards:    24px (space-y-6)
  Section gaps:     12px (space-y-3)
  
Typography:
  Location names:   20px (text-xl)
  Trip names:       20px (text-xl)
  Body text:        14px (text-sm)
  Emoji size:       20-36px
  
Dimensions:
  Popup:            360 × 500px
  Location card:    280px wide
  Photo:            280 × 160px
```

---

## 🚀 **Performance Characteristics**

**Extension:**
- Popup opens: < 100ms (cached)
- Context menu appears: < 50ms
- Screenshot capture: < 500ms
- API request sent: < 1s total

**Backend:**
- GET requests: < 200ms
- POST /api/locations: < 500ms (just stores + enqueues)
- AI processing: 10-15 seconds (async, doesn't block)

**Database:**
- All queries indexed
- Country-based filtering
- Supports 1000s of locations per user

---

## 💰 **Cost Structure**

**Current (Phase 0.2):**
- Supabase: Free tier
- Vercel: Free tier
- **Total: $0/month**

**With AI (Phase 0.3):**
- OpenAI: ~$1.50/month (1000 saves)
- Google Places: ~$5/month (1000 lookups)
- Inngest: Free tier
- **Total: ~$6.50/month for heavy use**

---

## 🔧 **Key Technical Decisions**

1. **Pool + References** - Locations are master copies, trips reference them
2. **No Authentication (MVP)** - Trusted UUID, reduces complexity
3. **Screenshots over DOM parsing** - More reliable, works everywhere
4. **Async AI processing** - Don't block user, poll for updates
5. **Caching strategy** - Show stale data instantly, refresh in background
6. **React Portals** - Proper modal positioning
7. **Server-side sorting** - Scales to 1000s of locations
8. **Multi-attempt search** - Try 3 queries before giving up
9. **Coordinate fallback** - AI-estimated coords if Google fails
10. **Save everything** - Even unverified locations have value

---

## 📊 **Current Status**

**Phase 0.1-0.3:** ✅ COMPLETE (Code ready)
- Chrome extension with full UI
- Backend API (15 endpoints)
- Database schema (future-proof)
- AI processing pipeline (needs API keys)

**Lines of Code:** ~6,500 lines TypeScript
**Documentation:** 2,500+ lines across 15 docs
**Time to Build:** ~10 hours

**Future Phases:**
- Phase 0.4: Bulk import (whole blog articles)
- Phase 0.5: Smart merging (duplicate detection)
- Phase 1.0: Map view + production deploy

---

## 🎯 **Why This Architecture?**

**Problems Solved:**
1. ✅ Manual travel planning is tedious
2. ✅ Recommendations get lost (Reddit, blogs)
3. ✅ Hard to organize by geography
4. ✅ Copy-paste doesn't scale
5. ✅ Need rich data (photos, addresses)

**Design Strengths:**
1. **Capture workflow validated** - Right-click is muscle memory
2. **AI accuracy** - Multi-attempt + fallbacks ensure success
3. **Scalable architecture** - Handles 1000s of locations
4. **Production-quality** - Proper error handling, caching, validation
5. **Future-proof** - Database supports maps, sharing, collaboration

---

## 🔍 **Message Passing Architecture**

**Background ↔ Extension Communication:**

```typescript
// Background → Popup
chrome.runtime.sendMessage({
  type: 'CAPTURES_UPDATED'
})

// Background → Content Script
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_TOAST',
  payload: { message: '✓ Saved', duration: 3000 }
})

// Popup → Background
chrome.runtime.sendMessage({
  type: 'SETTINGS_UPDATED'
})
```

**Storage Architecture:**

```typescript
// Chrome Local Storage
{
  userId: "uuid-v4",
  settings: {
    defaultView: 'trips',
    rememberLastTab: false,
    defaultTripId: "trip-uuid",
    defaultCountryId: "country-uuid"
  },
  cache: {
    countries: { data: [...], timestamp: 1234567890 },
    trips: { data: [...], timestamp: 1234567890 },
    locations: { data: [...], timestamp: 1234567890 },
    lastTab: 'trips'
  }
}
```

---

## 🧩 **Component Hierarchy**

```
popup.tsx (Root)
├─ Tabs
│  ├─ Tab buttons
│  ├─ Refresh button
│  └─ Settings button
│
├─ Views (conditional rendering)
│  ├─ LocationsView
│  │  └─ CountryCard (multiple)
│  │
│  ├─ CountryDetail
│  │  └─ LocationCard (multiple)
│  │     └─ GearMenu (portal)
│  │        └─ ConfirmDialog (portal)
│  │
│  ├─ TripsView
│  │  ├─ Active trip dropdown
│  │  ├─ TripCard (multiple)
│  │  └─ CreateTripModal button
│  │
│  ├─ TripDetail
│  │  ├─ DayFilter
│  │  ├─ TimeEstimate
│  │  └─ LocationCard (multiple)
│  │
│  ├─ CreateTripView
│  │  ├─ Country selector
│  │  └─ Form fields
│  │
│  └─ Settings
│     ├─ Country dropdown
│     ├─ Trip dropdown
│     └─ Preferences
│
└─ AddToTripModal (portal)
```

---

## 🎬 **Lifecycle Hooks**

**Extension Startup:**
```typescript
chrome.runtime.onInstalled →
  1. Generate userId (if new)
  2. Initialize default settings
  3. Create context menus
```

**Popup Opens:**
```typescript
useEffect([], ...) →
  1. Check cache (< 5 min old?)
  2. Show cached data immediately
  3. Fetch fresh data in background
  4. Update UI when fresh data arrives
```

**Save Action:**
```typescript
chrome.contextMenus.onClicked →
  1. Capture screenshot
  2. POST /api/locations
  3. Show toast
  4. Notify popup (if open)
```

**AI Processing:**
```typescript
Inngest 'location/created' →
  1. Extract global context
  2. Count locations
  3. Generate variations
  4. Search Google Places
  5. Update database
  (Extension polls for updates)
```

---

## 📈 **Scalability Considerations**

**Current Capacity:**
- ✅ 1000s of locations per user
- ✅ 100s of trips
- ✅ Efficient country-based filtering
- ✅ Indexed queries (< 200ms)

**Future Optimizations:**
- Pagination for large lists
- Virtual scrolling for 100+ cards
- Search/filter within popup
- Background sync for offline saves

---

## 🛡️ **Error Handling Strategy**

**Extension Level:**
```typescript
try {
  const location = await api.saveLocation(...)
  showToast('✓ Saved')
} catch (error) {
  console.error('Save failed:', error)
  showToast('❌ Failed to save')
}
```

**Backend Level:**
```typescript
// Zod validation
const schema = z.object({...})
const validated = schema.parse(request)

// Database errors
try {
  await supabase.from('locations').insert(...)
} catch (error) {
  return Response.json({ error: 'Database error' }, { status: 500 })
}
```

**AI Level:**
```typescript
// Inngest retries
retries: 3,  // Auto-retry failed jobs

// Fallbacks
if (!place) {
  // Use AI-estimated coordinates
  // Or save with name only
  // Never lose user's data
}
```

---

This comprehensive overview should help anyone understand exactly how the Travel Companion system works from the ground up! 🚀

## License

Private project - All rights reserved

---

**Built by Rehan Vishwanath**  
**Last Updated**: October 11, 2025
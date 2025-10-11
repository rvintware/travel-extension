# System Design Specification: Travel Companion Chrome Extension

**Version:** 1.0 MVP  
**Last Updated:** October 11, 2025  
**Status:** Architecture Approved

---

## Executive Summary

A Chrome extension that captures travel recommendations from web pages (Reddit, blogs, etc.) via right-click, processes them through AI to extract structured location data, and organizes them into trip-based folders. The system prioritizes capture workflow validation and AI accuracy over advanced features.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────┐
│  Chrome Extension (Plasmo + TypeScript)          │
│  - Context menu (right-click on selected text)   │
│  - Content script (captures screenshot)          │
│  - Popup UI (React-based)                        │
│  - Local storage (userId, activeTripId)          │
└─────────────────┬────────────────────────────────┘
                  │ HTTPS/REST API
                  ▼
┌──────────────────────────────────────────────────┐
│  Next.js API Routes (Vercel)                     │
│  - POST /api/capture → store + enqueue job       │
│  - GET /api/locations/:id → poll for status      │
│  - GET/POST/PATCH/DELETE /api/trips              │
│  - GET /api/trips/:tripId/locations              │
└─────────────────┬────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Inngest     │    │  Supabase    │
│  Queue       │    │              │
│              │    │  - Postgres  │
│  Job Steps:  │    │    Database  │
│  1. Extract  │───▶│              │
│  2. Places   │    │  Tables:     │
│  3. Synth    │    │  - users     │
│  4. Update   │    │  - trips     │
│              │    │  - locations │
└──────┬───────┘    └──────────────┘
       │
       ├──────▶ OpenAI API (GPT-4o-mini with vision)
       └──────▶ Google Places API
```

---

## Technology Stack

### Frontend (Chrome Extension)
- **Framework:** Plasmo (Manifest V3)
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **Storage:** chrome.storage.local
- **Build Tool:** Plasmo's built-in bundler

### Backend
- **Framework:** Next.js 14+ (App Router)
- **Runtime:** Node.js 18+
- **Hosting:** Vercel (Hobby tier)
- **Language:** TypeScript

### Infrastructure
- **Database:** Supabase (PostgreSQL)
- **Job Queue:** Inngest (free tier)
- **AI:** OpenAI GPT-4o-mini
- **Location Data:** Google Places API

### Development Tools
- **Package Manager:** pnpm
- **Version Control:** Git
- **API Testing:** Postman/Thunder Client
- **Environment:** .env.local

---

## Key Architectural Decisions

### Decision 1: Screenshot Storage
**Decision:** Do NOT store screenshots permanently  
**Rationale:**
- Screenshots only used for AI processing (OCR + context)
- Saves database storage costs (500KB-2MB per capture)
- Reduces complexity (no CDN/storage service needed)
- Can still debug via original_text + url if needed

**Implementation:**
- Extension captures screenshot as base64
- Sends to backend API in request body
- AI processes screenshot inline
- Screenshot discarded after processing completes

---

### Decision 2: Function Timeout Strategy
**Decision:** Accept 10-second Vercel timeout for MVP  
**Rationale:**
- Vercel Hobby tier has 10-second function timeout
- Most AI processing should complete in 5-8 seconds
- If timeout occurs, Inngest will retry automatically
- Can upgrade to Vercel Pro ($20/mo, 60s timeout) post-MVP if needed

**Implications:**
- Jobs that timeout will be marked as 'error' status
- Extension will show "Processing..." then error message
- User can manually retry (delete + re-capture)

---

### Decision 3: Async Job Processing
**Decision:** Use Inngest for job queue  
**Rationale:**
- Vercel functions are stateless and time-limited
- Inngest provides reliable async processing
- Free tier: 50,000 function runs/month (plenty for MVP)
- Built-in retry logic and monitoring
- No need for separate Redis/worker infrastructure

**Flow:**
1. API receives capture → stores in DB (status='pending')
2. Enqueues Inngest job
3. Returns locationId to extension immediately
4. Inngest worker processes job asynchronously
5. Extension polls `/api/locations/:id` every 2 seconds
6. When status='complete', displays in UI

---

### Decision 4: Authentication
**Decision:** No authentication for MVP; trust userId from extension  
**Rationale:**
- Single-user MVP (developer only)
- Reduces complexity (no OAuth, no session management)
- Extension generates UUID on first install
- API trusts this userId in requests

**Security Implications:**
- Anyone with userId could access that user's data
- Acceptable for MVP since it's personal use
- POST-MVP: Add Google OAuth via chrome.identity API

**Implementation:**
```typescript
// Extension: Generate on install
chrome.runtime.onInstalled.addListener(async () => {
  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ userId });
});

// API: Trust the userId from request
const { userId } = await request.json();
```

---

### Decision 5: Failed Location Handling
**Decision:** Store data even if Google Places returns no results  
**Rationale:**
- User's captured text and tips are still valuable
- Location might be too new/obscure for Google
- User can manually add location later
- Better to have partial data than nothing

**Implementation:**
- If Places API returns 0 results:
  - Set `place_id = null`
  - Set `lat/lng = null`
  - Set `address = null`
  - Keep `name` from AI extraction
  - Keep `summary` and `tips` from original text
  - Set flag: `location_verified = false`
- Extension UI shows warning badge: "Location not verified"
- Future: Allow manual geocoding or edit

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  last_active TIMESTAMP DEFAULT now()
);
```

### Trips Table
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_trips_user_active ON trips(user_id, is_active);
CREATE INDEX idx_trips_user_order ON trips(user_id, display_order);
```

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Original captured data
  original_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  page_title TEXT,
  html_context TEXT, -- Context around selected text (optional)
  
  -- Processed/structured data
  name TEXT,
  place_id TEXT, -- Google Places ID (null if not found)
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  category TEXT, -- restaurant, bar, sight, activity, hotel
  summary TEXT,
  tips JSONB DEFAULT '[]', -- ["tip 1", "tip 2"]
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs from Places API
  
  -- Processing metadata
  processing_status TEXT DEFAULT 'pending', -- pending, processing, complete, error
  location_verified BOOLEAN DEFAULT false, -- true if Google Places found it
  error_message TEXT,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00 (AI confidence)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (processing_status IN ('pending', 'processing', 'complete', 'error'))
);

CREATE INDEX idx_locations_user_trip ON locations(user_id, trip_id);
CREATE INDEX idx_locations_status ON locations(processing_status);
CREATE INDEX idx_locations_place_id ON locations(place_id);
CREATE INDEX idx_locations_trip_created ON locations(trip_id, created_at DESC);

-- Optional: Prevent duplicate place_id within same trip
CREATE UNIQUE INDEX idx_unique_place_per_trip 
  ON locations(trip_id, place_id) 
  WHERE place_id IS NOT NULL;
```

---

## API Specification

### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://your-app.vercel.app`

### Authentication
- **Type:** None (MVP)
- **Header:** `X-User-Id: {userId}` (optional header, or in body)

---

### Endpoints

#### 1. POST /api/capture
**Purpose:** Capture a new location from selected text

**Request:**
```json
{
  "userId": "uuid-v4",
  "tripId": "uuid-v4",
  "text": "Bar Raval near AGO has amazing vermouth, go at 5pm to avoid crowds",
  "url": "https://reddit.com/r/toronto/comments/...",
  "pageTitle": "Best speakeasies near AGO?",
  "screenshot": "data:image/png;base64,iVBORw0KGgo...", // base64 image
  "htmlContext": "<p>Previous comment...</p><p>Selected text</p><p>Next comment...</p>"
}
```

**Response (200 OK):**
```json
{
  "locationId": "uuid-v4",
  "status": "pending",
  "message": "Processing your capture..."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required field: text"
}
```

---

#### 2. GET /api/locations/:id
**Purpose:** Get location details and processing status (for polling)

**Response (200 OK - Pending):**
```json
{
  "id": "uuid-v4",
  "status": "processing",
  "message": "Extracting location data..."
}
```

**Response (200 OK - Complete):**
```json
{
  "id": "uuid-v4",
  "status": "complete",
  "location": {
    "name": "Bar Raval",
    "address": "505 College St, Toronto, ON",
    "coordinates": { "lat": 43.6551, "lng": -79.4103 },
    "category": "bar",
    "summary": "Spanish-style bar known for its vermouth selection and tapas",
    "tips": [
      "Go at 5pm to avoid crowds",
      "Amazing vermouth selection",
      "Try the pintxos"
    ],
    "photos": [
      "https://maps.googleapis.com/maps/api/place/photo?..."
    ],
    "verified": true,
    "placeId": "ChIJ...",
    "sourceUrl": "https://reddit.com/...",
    "originalText": "Bar Raval near AGO has...",
    "createdAt": "2025-10-11T10:30:00Z"
  }
}
```

**Response (200 OK - Error):**
```json
{
  "id": "uuid-v4",
  "status": "error",
  "error": "AI extraction failed: Rate limit exceeded"
}
```

---

#### 3. GET /api/users/:userId/trips
**Purpose:** Get all trips for a user

**Response (200 OK):**
```json
{
  "trips": [
    {
      "id": "uuid-v4",
      "name": "Toronto",
      "isActive": true,
      "locationCount": 12,
      "createdAt": "2025-10-01T10:00:00Z"
    },
    {
      "id": "uuid-v4",
      "name": "Japan",
      "isActive": false,
      "locationCount": 8,
      "createdAt": "2025-09-15T10:00:00Z"
    }
  ]
}
```

---

#### 4. POST /api/trips
**Purpose:** Create a new trip

**Request:**
```json
{
  "userId": "uuid-v4",
  "name": "Singapore 2026",
  "setActive": true
}
```

**Response (201 Created):**
```json
{
  "tripId": "uuid-v4",
  "name": "Singapore 2026",
  "isActive": true
}
```

---

#### 5. PATCH /api/trips/:id
**Purpose:** Update trip (rename or set as active)

**Request:**
```json
{
  "name": "Singapore Trip",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "tripId": "uuid-v4",
  "name": "Singapore Trip",
  "isActive": true
}
```

---

#### 6. DELETE /api/trips/:id
**Purpose:** Delete a trip (cascades to locations)

**Response (204 No Content)**

---

#### 7. GET /api/trips/:tripId/locations
**Purpose:** Get all locations in a trip

**Response (200 OK):**
```json
{
  "tripId": "uuid-v4",
  "tripName": "Toronto",
  "locations": [
    {
      "id": "uuid-v4",
      "name": "Bar Raval",
      "address": "505 College St",
      "category": "bar",
      "summary": "Spanish-style bar...",
      "tips": ["Go at 5pm", "Try vermouth"],
      "photos": ["url1"],
      "verified": true,
      "createdAt": "2025-10-11T10:30:00Z"
    }
  ]
}
```

---

#### 8. DELETE /api/locations/:id
**Purpose:** Delete a location

**Response (204 No Content)**

---

## AI Processing Pipeline

### Inngest Function: `process-location`

**Trigger:** Enqueued by POST /api/capture

**Steps:**

#### Step 1: AI Extraction (GPT-4o-mini with Vision)
**Purpose:** Extract structured data from screenshot + text

**System Prompt:**
```
You are a travel location extractor. Analyze the provided screenshot and highlighted text to extract:
- Location name (restaurant, bar, attraction, etc.)
- City and neighborhood
- Key tips and recommendations
- Category (restaurant, bar, sight, activity, hotel)

The user highlighted text from a web page (likely Reddit or a blog).
Use the screenshot for additional context (upvotes, surrounding comments, etc.).

Output as JSON only.
```

**Input:**
- `screenshot` (base64 image)
- `text` (highlighted text)
- `url` (source URL)
- `pageTitle` (page title)

**API Call:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: `Highlighted text: "${text}"\n\nPage: ${pageTitle}\nURL: ${url}` },
        { type: "image_url", image_url: { url: screenshot } }
      ]
    }
  ],
  response_format: { type: "json_object" }
});
```

**Expected Output:**
```json
{
  "locationName": "Bar Raval",
  "city": "Toronto",
  "neighborhood": "near AGO",
  "category": "bar",
  "tips": [
    "Go at 5pm to avoid crowds",
    "Amazing vermouth selection"
  ],
  "confidence": 0.95
}
```

---

#### Step 2: Google Places Search
**Purpose:** Find official location data

**API Call:**
```typescript
const searchResults = await googlePlaces.textSearch({
  query: `${locationName} ${neighborhood} ${city}`,
  fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos']
});

const place = searchResults.results[0]; // Take top result

if (place) {
  const details = await googlePlaces.placeDetails({
    place_id: place.place_id,
    fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating']
  });
}
```

**Handling No Results:**
- If `results.length === 0`:
  - Set `place_id = null`
  - Set `location_verified = false`
  - Continue to Step 3 with AI-extracted data only

---

#### Step 3: AI Synthesis
**Purpose:** Create clean summary and formatted tips

**System Prompt:**
```
You are creating a concise travel guide entry. Given:
- User's highlighted comment
- Official location data from Google (if available)
- Extracted tips

Create:
1. A 1-2 sentence summary (compelling but concise)
2. A bulleted list of actionable tips (pull quotes from original comment)
3. Category confirmation

Be helpful and specific. Preserve the user's voice in tips.
```

**Input:**
- `originalText` (user's highlighted text)
- `extractedData` (from Step 1)
- `placeData` (from Step 2, or null)

**Expected Output:**
```json
{
  "summary": "Spanish-inspired bar on College Street known for its impressive vermouth selection and authentic pintxos. Intimate space with standing room only.",
  "formattedTips": [
    "Arrive at 5pm to snag a spot before the rush",
    "Don't miss the vermouth flight",
    "Try the house-made pintxos"
  ],
  "category": "bar"
}
```

---

#### Step 4: Update Database
**Purpose:** Store processed data

```typescript
await supabase
  .from('locations')
  .update({
    name: place?.name || extractedData.locationName,
    place_id: place?.place_id || null,
    address: place?.formatted_address || null,
    lat: place?.geometry.location.lat || null,
    lng: place?.geometry.location.lng || null,
    category: synthesized.category,
    summary: synthesized.summary,
    tips: synthesized.formattedTips,
    photos: place?.photos.map(p => getPhotoUrl(p)) || [],
    location_verified: !!place,
    confidence_score: extractedData.confidence,
    processing_status: 'complete',
    processed_at: new Date().toISOString()
  })
  .eq('id', locationId);
```

**Error Handling:**
- If any step fails, update status to 'error' with error message
- Inngest will retry up to 3 times with exponential backoff

---

## Data Flow Diagram

### Capture Flow
```
User highlights text on Reddit
         ↓
Right-click → "Save to Toronto Trip"
         ↓
Content script captures:
  - Selected text
  - Current URL
  - Page title
  - Screenshot (captureVisibleTab)
         ↓
Send to background service worker
         ↓
POST /api/capture
  - Store in DB (status=pending)
  - Enqueue Inngest job
  - Return locationId
         ↓
Extension starts polling GET /api/locations/:id
         ↓
Show "Processing..." in popup
```

### Processing Flow (Inngest)
```
Inngest job triggered
         ↓
Step 1: AI Extraction (5-8s)
  - GPT-4o-mini analyzes screenshot + text
         ↓
Step 2: Google Places Search (1-2s)
  - Search for official location
  - Get coordinates, photos
         ↓
Step 3: AI Synthesis (3-5s)
  - Create summary and tips
         ↓
Step 4: Update DB (1s)
  - Set status=complete
         ↓
Extension polling detects completion
         ↓
Show location in popup UI
```

---

## Chrome Extension Architecture

### Directory Structure
```
extension/
├── manifest.json
├── background/
│   └── index.ts          # Service worker (context menu, messaging)
├── contents/
│   └── capture.ts        # Content script (screenshot capture)
├── popup/
│   ├── index.tsx         # Main popup component
│   ├── components/
│   │   ├── TripList.tsx
│   │   ├── TripDetail.tsx
│   │   └── LocationCard.tsx
│   └── index.html
├── lib/
│   ├── api.ts            # Backend API client
│   ├── storage.ts        # Chrome storage helpers
│   └── types.ts          # TypeScript interfaces
└── assets/
    └── icon.png
```

### Key Components

#### 1. Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "Travel Companion",
  "version": "1.0.0",
  "permissions": [
    "contextMenus",
    "activeTab",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background/index.js"
  },
  "action": {
    "default_popup": "popup/index.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["contents/capture.js"]
    }
  ]
}
```

#### 2. Context Menu (background/index.ts)
```typescript
chrome.runtime.onInstalled.addListener(async () => {
  // Generate user ID
  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ userId });
  
  // Create context menu
  chrome.contextMenus.create({
    id: "save-to-trip",
    title: "Save to Toronto Trip ⭐",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-trip") {
    // Send message to content script to capture
    chrome.tabs.sendMessage(tab.id, {
      action: "capture",
      text: info.selectionText
    });
  }
});
```

#### 3. Content Script (contents/capture.ts)
```typescript
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "capture") {
    // Capture screenshot
    const screenshot = await chrome.tabs.captureVisibleTab();
    
    // Get context around selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const contextHTML = range.commonAncestorContainer.parentElement?.outerHTML;
    
    // Send to background for API call
    chrome.runtime.sendMessage({
      action: "save-capture",
      data: {
        text: message.text,
        url: window.location.href,
        pageTitle: document.title,
        screenshot: screenshot,
        htmlContext: contextHTML
      }
    });
  }
});
```

#### 4. Popup UI (popup/index.tsx)
- React-based interface
- Lists trips and locations
- Polls for processing updates every 2 seconds
- Shows loading states and errors
- Delete functionality

---

## Environment Variables

### Backend (.env.local)
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI
OPENAI_API_KEY=sk-...

# Google
GOOGLE_PLACES_API_KEY=AIza...

# Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Extension
```typescript
// config.ts
export const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://your-app.vercel.app'
    : 'http://localhost:3000';
```

---

## Performance Targets

### Extension
- Context menu appears: < 50ms
- Screenshot capture: < 500ms
- API request sent: < 1s total
- Popup opens: < 300ms
- Polling interval: 2 seconds

### Backend
- POST /api/capture response: < 500ms (just stores + enqueues)
- GET /api/locations/:id: < 200ms
- GET /api/trips/:tripId/locations: < 500ms

### Processing
- AI extraction: 5-8 seconds
- Google Places search: 1-2 seconds
- AI synthesis: 3-5 seconds
- **Total processing time: 9-15 seconds**

---

## Error Handling

### Extension Errors
- **No text selected:** Show error notification
- **Network failure:** Show retry button
- **API error:** Display error message from backend

### API Errors
- **Invalid request:** 400 with error message
- **Database error:** 500, log to monitoring
- **Rate limit:** 429, queue for retry

### Processing Errors
- **AI timeout:** Retry up to 3 times
- **Places API no results:** Store with verified=false
- **AI hallucination:** Store with low confidence score

---

## Security Considerations

### MVP (Current)
- ✅ HTTPS only for API calls
- ✅ CORS configured for extension origin
- ✅ No sensitive data in localStorage
- ❌ No authentication (single user)
- ❌ userId is trusted (not verified)

### Post-MVP
- Add Google OAuth
- Add API key authentication
- Rate limiting per user
- Input sanitization
- CSP headers

---

## Monitoring & Observability

### Metrics to Track
- Captures per day
- Processing success rate
- Average processing time
- AI confidence scores
- Google Places match rate
- Extension installs/active users

### Tools
- Vercel Analytics (built-in)
- Inngest dashboard (job monitoring)
- Supabase dashboard (database queries)
- OpenAI usage dashboard

---

## Future Enhancements (Post-MVP)

### Phase 2
- Map visualization (Google Maps JS API)
- Edit location details
- Keyboard shortcuts
- Bulk operations

### Phase 3
- Duplicate detection
- Confidence scoring UI
- Manual review queue
- Trip sharing

### Phase 4
- Mobile app (React Native)
- Instagram integration
- Collaborative planning
- Export to other platforms

---

## Cost Projections

### MVP (100 captures/month)
- OpenAI: $5
- Google Places: $0 (free tier)
- Vercel: $0 (free tier)
- Supabase: $0 (free tier)
- Inngest: $0 (free tier)
- **Total: ~$5/month**

### Scale (1,000 captures/month)
- OpenAI: $50
- Google Places: $20 (over free tier)
- Vercel: $20 (Pro for timeouts)
- Supabase: $0 (still within free tier)
- Inngest: $0 (still within free tier)
- **Total: ~$90/month**

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI accuracy < 80% | High | Iterate on prompts, add confidence scores |
| Vercel timeout (10s) | Medium | Use Inngest, optimize API calls |
| Google Places rate limits | Medium | Cache results, upgrade plan |
| Extension not used daily | High | Focus on UX, reduce friction |
| Database storage costs | Low | Auto-delete old data after 90 days |

---

## Success Criteria

**MVP is successful if:**
1. Can capture 10 Reddit recommendations in < 5 minutes
2. AI accuracy > 80% on manual validation
3. Processing completes in < 15 seconds average
4. Personal usage: 20+ captures in first week
5. Zero data loss (all captures stored successfully)

**Ready to proceed if:**
- Extension feels natural to use (muscle memory)
- Would feel anxious browsing Reddit without it
- Maps view provides clear value (Phase 2)

---

## Appendix

### TypeScript Interfaces

```typescript
// Shared types

interface User {
  id: string;
  createdAt: string;
  lastActive: string;
}

interface Trip {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  userId: string;
  tripId: string;
  
  // Original
  originalText: string;
  sourceUrl: string;
  pageTitle: string;
  htmlContext?: string;
  
  // Processed
  name: string;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
  category: string;
  summary: string;
  tips: string[];
  photos: string[];
  
  // Meta
  processingStatus: 'pending' | 'processing' | 'complete' | 'error';
  locationVerified: boolean;
  errorMessage?: string;
  confidenceScore?: number;
  
  createdAt: string;
  processedAt?: string;
}

interface CaptureRequest {
  userId: string;
  tripId: string;
  text: string;
  url: string;
  pageTitle: string;
  screenshot: string; // base64
  htmlContext?: string;
}

interface CaptureResponse {
  locationId: string;
  status: 'pending';
  message: string;
}

interface LocationResponse {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  location?: Location;
  error?: string;
}
```

---

**End of System Design Specification**


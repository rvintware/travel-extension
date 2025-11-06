# Enhanced Location Cards - Product Requirements Document

**Version:** 1.0  
**Created:** October 25, 2025  
**Status:** Approved for Implementation  
**Epic:** Location Card Improvements

---

## 📋 Executive Summary

This PRD defines enhancements to location cards that improve data quality, reduce duplication, and provide more actionable content to users. The core improvements are:

1. **Intelligent Deduplication** - One location per place, using Google Places ID
2. **Tiered Content Hierarchy** - Replace AI summaries with source-tagged bullet points
3. **Enhanced Interactions** - Richer clickable elements and gear menu options

**Impact:**
- Eliminates duplicate locations in user's library
- Provides more authentic, actionable tips (user's words + reviews)
- Enables trip-specific customization while maintaining data integrity

---

## 🎯 Goals & Success Metrics

### Primary Goals
1. **Zero Duplicates** - Each physical place exists once in the location pool
2. **Authentic Content** - Replace generic AI summaries with actual tips from sources
3. **Flexible Organization** - Same location can be in multiple trips with different schedules

---

## 🏗️ Feature 1: Intelligent Deduplication

### Current Problem
Users can save the same location multiple times:
- Different Reddit threads about "Bar Raval" → 3 separate locations
- Same blog mentioned twice → duplicates
- Wastes storage, confuses organization

### Solution: Database-Level Deduplication

**How It Works:**

When a user saves a location, the system:

```
1. AI extracts location → Google Places search → get place_id
2. Check database: "Does this place_id already exist for this user?"
3. If YES:
   a. Merge new tips into existing location
   b. Update sources array (track all URLs)
   c. Link to trip if specified
   d. Show toast: "✓ Added tips to existing Bar Raval"
4. If NO:
   a. Create new location with place_id
   b. Link to trip if specified
   c. Show toast: "✓ Saved Bar Raval"
```

**Database Level Explanation:**

The `locations` table has:
```sql
place_id TEXT,  -- Google's unique identifier (e.g., "ChIJ...")
UNIQUE INDEX idx_locations_user_place ON locations(user_id, place_id) 
  WHERE place_id IS NOT NULL;
```

This **UNIQUE constraint** prevents two locations with the same `place_id` for the same `user_id`.

**Architecture Fit:**

This matches the existing **Pool + References** model:
```
locations (pool) - ONE record per physical place
    ↓
trip_locations (references) - MANY links to trips
    ↓
trips - Different schedules per trip
```

**Example:**

```
User saves "Bar Raval" from Reddit → Creates location_123 (place_id: "ChIJ...")
User saves "Bar Raval" from blog → Detects existing location_123
  → Merges new tips
  → No duplicate created

User adds location_123 to "Toronto 2025" trip:
  trip_locations: { location_id: 123, trip_id: 456, day_number: 1, time: "5pm" }

User adds location_123 to "Weekend Trip" trip:
  trip_locations: { location_id: 123, trip_id: 789, day_number: 2, time: "7pm" }

Result: ONE location, TWO trip references with different times ✅
```

**Edge Cases:**

1. **No place_id** (Google Places not found):
   - Use normalized name matching as fallback
   - If name matches → merge
   - Otherwise → create new (allow duplicates for unverified locations)

2. **Different users, same place**:
   - Each user has their own location record (user_id in UNIQUE constraint)
   - Users don't see each other's tips/notes

3. **Place permanently closed**:
   - Keep in database with flag
   - Show warning in UI
   - Allow user to archive

---

## 🎨 Feature 2: Tiered Content Hierarchy

### Current Problem
- AI-generated summaries feel generic: "Spanish-inspired bar known for..."
- Users want authentic content from sources they trust
- Can't tell what's from their highlight vs what AI made up

### Solution: Source-Tagged Bullet Points

**Content Hierarchy (Priority Order):**

```
Priority 1: Highlighted Text (what user selected)
  ├─ Source: User's direct selection
  ├─ Icon: 📝
  ├─ Example: "Go at 5pm to avoid crowds"
  └─ Always shown first

Priority 2: Context/Paragraph (surrounding text)
  ├─ Source: Text around user's selection
  ├─ Icon: 📄
  ├─ Example: "Try their house vermouth"
  └─ Shown if different from Priority 1

Priority 3: Page Content (from screenshot)
  ├─ Source: Other visible text/comments on page
  ├─ Icon: 🌐
  ├─ Example: "Cash only, no reservations"
  └─ Extracted during AI processing

Priority 4: Google Reviews (fallback)
  ├─ Source: Top-rated Google reviews
  ├─ Icon: ⭐
  ├─ Example: "Amazing cocktails" (from 5-star review)
  └─ Used to fill up to 3 total tips
```

**Rules:**

- **Maximum 3 tips** per location card
- **Tag each tip** with source icon
- **Prioritize user content** over Google content
- **Example with 1 user tip:**
  ```
  💡 Tips
  📝 "Go before 11am to avoid wait" (from your highlight)
  ⭐ "Amazing cocktails" (from Google reviews)
  ⭐ "Try the pintxos" (from Google reviews)
  ```

**Data Structure:**

```typescript
// Database: tips column (JSONB)
tips: [
  {
    text: "Go at 5pm to avoid crowds",
    source: "highlight",  // highlight | context | page | google_reviews
    priority: 1,
    confidence: 0.95
  },
  {
    text: "Try the house vermouth",
    source: "context",
    priority: 2,
    confidence: 0.85
  },
  {
    text: "Amazing cocktails",
    source: "google_reviews",
    priority: 4,
    confidence: 1.0,
    review_rating: 5
  }
]
```

**AI Extraction Process:**

1. **Parse highlighted text** (GPT-4o):
   - Prompt: "Extract 1-3 actionable tips from this highlighted text"
   - Focus: Timing, recommendations, insider knowledge
   - Exclude: Obvious facts (location name, basic category)

2. **Parse context/paragraph** (GPT-4o):
   - Prompt: "Extract additional tips not in highlighted text"
   - Focus: Related recommendations, warnings, best practices
   - Dedupe: Don't repeat tips from highlight

3. **Parse screenshot** (GPT-4o with vision):
   - Prompt: "Extract tips from visible comments/text on page"
   - Focus: Highly upvoted comments, repeated mentions
   - Dedupe: Don't repeat tips from highlight or context

4. **Format Google Reviews** (post-processing):
   - Fetch top 5-star reviews
   - Extract key phrases using GPT: "Summarize this review in one actionable phrase"
   - Example: "The atmosphere is amazing and the food is incredible" → "Amazing atmosphere"
   - Store with source tag

5. **Prioritize & Limit**:
   - Sort by priority (1-4)
   - Take top 3 tips
   - Ensure at least 1 tip from user content if available

**Screenshot Handling:**

- Screenshot **not stored** in database (cost savings)
- Extract all content during initial AI processing job
- Discard screenshot after job completes
- If re-processing needed later, only have highlight + context + Google reviews

---

## 🖱️ Feature 3: Enhanced Interactions

### 3A. Clickable Image → Google Maps

**Current:** Image opens photo URL  
**New:** Image opens Google Maps location

**Implementation:**

```tsx
<a 
  href={`https://www.google.com/maps/place/?q=place_id:${location.place_id}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <img src={location.photos[0]} />
</a>
```

**Fallback:** If no `place_id`, link to coordinates or don't make image clickable.

**Future (Phase 1.0):** Open embedded map view within extension.

---

### 3B. Enhanced Gear Menu

**Current Menu:**
```
➕ Add to Trip
🗑️ Remove from Trip
```

**New Menu:**

**In Library Context:**
```
➕ Add to Trip
✏️ Rename Location
📝 Edit Notes
────────────────
🗑️ Delete Forever
```

**In Trip Context:**
```
🔗 Move to Day X
🕐 Set Time
✏️ Rename Location
📝 Edit Notes
────────────────
🗑️ Remove from Trip
🗑️ Delete Forever
```

**Key Features:**

1. **Rename Location** (Context: Library or Trip)
   - Opens modal with input field
   - Updates `display_name` column
   - Original `name` preserved from Google Places
   - UI shows: `display_name || name`

2. **Set Time** (Context: Trip ONLY)
   - Opens modal with time picker + duration
   - Updates `trip_locations.suggested_time`
   - Updates `trip_locations.estimated_duration_minutes`
   - **Trip-specific**: Different time per trip reference
   - Example: "Bar Raval" → 5pm in Trip A, 7pm in Trip B

3. **Edit Notes** (Context: Library or Trip)
   - In Library: Updates `locations.user_notes` (global)
   - In Trip: Updates `trip_locations.notes` (trip-specific)
   - Both can exist simultaneously

4. **Move to Day X** (Context: Trip ONLY)
   - Shows dropdown of available days
   - Updates `trip_locations.day_number`

5. **Remove from Trip** vs **Delete Forever**
   - Remove: Deletes `trip_locations` record (stays in library)
   - Delete: Deletes `locations` record (gone everywhere)
   - Show different confirmation dialogs

---

## 📦 Database Schema Changes

### New Columns

```sql
-- locations table
ALTER TABLE locations 
ADD COLUMN display_name TEXT,  -- User's custom name override
ADD COLUMN sources JSONB DEFAULT '[]'::jsonb,  -- Track all source URLs
ADD COLUMN google_reviews JSONB DEFAULT '[]'::jsonb;  -- Cached reviews

-- Update tips structure (already JSONB, just documenting new format)
-- tips: [{ text, source, priority, confidence, review_rating? }]

-- Add constraint
ALTER TABLE locations
ADD CONSTRAINT unique_user_place_id UNIQUE (user_id, place_id)
  WHERE place_id IS NOT NULL;

-- New indexes
CREATE INDEX idx_locations_display_name ON locations(display_name) 
  WHERE display_name IS NOT NULL;

CREATE INDEX idx_locations_sources ON locations USING GIN(sources);
```

### Updated trip_locations Columns

```sql
-- trip_locations table (already have these, documenting for clarity)
-- These are TRIP-SPECIFIC values:
suggested_time TEXT,              -- "5:00 PM"
estimated_duration_minutes INT,   -- 120
notes TEXT,                        -- Trip-specific notes
day_number INT,                    -- Which day in trip
display_order INT,                 -- Order within day
```

### Migration Plan

```sql
-- Migration: enhanced_location_cards.sql
BEGIN;

-- 1. Add new columns
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS google_reviews JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing tips to new format (if needed)
UPDATE locations
SET tips = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'text', tip::text,
      'source', 'unknown',
      'priority', 5,
      'confidence', 0.5
    )
  )
  FROM jsonb_array_elements_text(tips) AS tip
)
WHERE jsonb_typeof(tips) = 'array' 
  AND tips::text NOT LIKE '%"source"%';

-- 3. Add unique constraint (will fail if duplicates exist)
-- Run deduplication script first if needed
ALTER TABLE locations
ADD CONSTRAINT unique_user_place_id UNIQUE (user_id, place_id)
  WHERE place_id IS NOT NULL;

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_locations_display_name 
  ON locations(display_name) 
  WHERE display_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_locations_sources 
  ON locations USING GIN(sources);

COMMIT;
```

---

## 🔧 API Changes

### POST /api/locations (Enhanced)

**New Deduplication Logic:**

```typescript
export async function POST(request: Request) {
  const validated = createLocationSchema.parse(body)
  
  // After AI processing gets place_id...
  
  // 🆕 CHECK FOR DUPLICATE
  if (place_id) {
    const { data: existing } = await supabase
      .from('locations')
      .select('id, name, tips, sources')
      .eq('user_id', validated.userId)
      .eq('place_id', place_id)
      .maybeSingle()
    
    if (existing) {
      // MERGE: Add new tips + source
      const mergedTips = mergeTips(existing.tips, newTips)
      const mergedSources = [...existing.sources, validated.sourceUrl]
      
      await supabase
        .from('locations')
        .update({
          tips: mergedTips,
          sources: mergedSources,
          updated_at: new Date()
        })
        .eq('id', existing.id)
      
      // Link to trip if specified
      if (tripId) {
        await linkLocationToTrip(existing.id, tripId)
      }
      
      return { 
        location: existing, 
        merged: true,
        message: 'Added tips to existing location'
      }
    }
  }
  
  // Otherwise, create new location...
}
```

### PATCH /api/locations/:id (Enhanced)

**New Fields:**

```typescript
{
  display_name?: string,  // Custom name
  user_notes?: string,    // Global notes
  // ... existing fields
}
```

### New: PATCH /api/trip-locations/:id

**Purpose:** Update trip-specific data

```typescript
// PATCH /api/trip-locations/:tripLocationId
{
  suggested_time?: string,              // "5:00 PM"
  estimated_duration_minutes?: number,  // 120
  notes?: string,                       // Trip-specific notes
  day_number?: number,
  display_order?: number
}
```

---

## 🤖 AI Pipeline Updates

### Enhanced process-location Job

**Current Steps:**
1. Extract global context
2. Count locations
3. Generate variations
4. Google Places search
5. Update database

**New Steps:**

```typescript
export const processLocation = inngest.createFunction(
  { id: 'process-location', retries: 3 },
  { event: 'location/created' },
  async ({ event, step }) => {
    // ... existing steps 0-3 ...
    
    // STEP 4: Google Places Search (Enhanced)
    const placeResult = await step.run('google-places-search', async () => {
      const place = await searchGooglePlaces(query)
      
      // 🆕 Fetch reviews
      if (place?.place_id) {
        const reviews = await fetchGoogleReviews(place.place_id)
        return { ...place, reviews }
      }
      
      return place
    })
    
    // 🆕 STEP 5: Extract Tiered Tips
    const tips = await step.run('extract-tiered-tips', async () => {
      const tipsFromHighlight = await extractTips(selectedText, 'highlight')
      const tipsFromContext = await extractTips(htmlContext, 'context')
      const tipsFromScreenshot = await extractTips(screenshot, 'page')
      const tipsFromReviews = await formatReviewTips(placeResult.reviews)
      
      // Combine and prioritize
      const allTips = [
        ...tipsFromHighlight.map(t => ({ ...t, priority: 1 })),
        ...tipsFromContext.map(t => ({ ...t, priority: 2 })),
        ...tipsFromScreenshot.map(t => ({ ...t, priority: 3 })),
        ...tipsFromReviews.map(t => ({ ...t, priority: 4 }))
      ]
      
      // Deduplicate by semantic similarity
      const uniqueTips = await deduplicateTips(allTips)
      
      // Take top 3
      return uniqueTips
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)
    })
    
    // 🆕 STEP 6: Check for Duplicate
    if (placeResult.place_id) {
      const existing = await checkDuplicate(userId, placeResult.place_id)
      
      if (existing) {
        // Merge tips and sources
        await mergeTips(existing.id, tips, sourceUrl)
        return { 
          merged: true, 
          locationId: existing.id 
        }
      }
    }
    
    // STEP 7: Update/Create Location
    await updateLocation(locationId, {
      ...placeResult,
      tips,
      sources: [sourceUrl],
      google_reviews: placeResult.reviews
    })
  }
)
```

### New AI Prompts

**1. Extract Tips from Highlight:**

```typescript
const EXTRACT_HIGHLIGHT_TIPS_PROMPT = `
Extract 1-3 actionable tips from this highlighted text.

Text: "${selectedText}"

Focus on:
- Timing recommendations (when to visit)
- Ordering suggestions (what to try)
- Insider knowledge (how to get best experience)
- Warnings or considerations

Exclude:
- Location name or basic facts
- Generic descriptions

Return as JSON:
{
  "tips": [
    { "text": "Go at 5pm to avoid crowds", "confidence": 0.95 }
  ]
}
`
```

**2. Format Review Tips:**

```typescript
const FORMAT_REVIEW_TIP_PROMPT = `
Summarize this Google review into one short, actionable phrase.

Review (${rating} stars): "${text}"

Examples:
- "The atmosphere is amazing and food incredible" → "Amazing atmosphere and food"
- "Best ramen I've had, get there early" → "Best ramen, arrive early"
- "Staff was very friendly" → "Friendly staff"

Return just the phrase, no quotes.
`
```

**3. Deduplicate Tips:**

```typescript
const DEDUPLICATE_TIPS_PROMPT = `
Remove duplicate tips from this list. Consider tips duplicates if they convey the same information.

Tips:
1. "Go at 5pm to avoid crowds"
2. "Arrive before 5:30 to beat the rush"
3. "Try the vermouth"
4. "Amazing cocktails"

Duplicates: 1 and 2 (same timing advice)
Keep: Tip 1 (more specific)

Return deduplicated list with original indices.
`
```

---

## 🎨 UI Component Updates

### LocationCard Component

**New Props:**

```typescript
interface LocationCardProps {
  location: Location | LocationWithTripData
  context: 'library' | 'trip'
  days?: number[]  // Available days in trip
  tripId?: string  // Current trip ID
  onAction: (action: GearAction, data?: any) => void
}
```

**Enhanced Rendering:**

```tsx
export function LocationCard({ location, context, days, tripId, onAction }) {
  // Display name override
  const displayName = location.display_name || location.name
  const showGoogleName = location.display_name && location.name
  
  // Structured tips with source tags
  const tips = Array.isArray(location.tips) 
    ? location.tips.slice(0, 3)
    : []
  
  return (
    <div className="location-card">
      {/* Image → Google Maps */}
      {location.photos?.[0] && location.place_id && (
        <a 
          href={`https://www.google.com/maps/place/?q=place_id:${location.place_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={location.photos[0]} 
            alt={displayName}
            className="w-full h-40 object-cover hover:opacity-90 cursor-pointer"
          />
        </a>
      )}
      
      {/* Name with override indicator */}
      <div className="p-4">
        <h3 className="text-xl font-semibold">
          {displayName}
        </h3>
        {showGoogleName && (
          <p className="text-xs text-gray-500 mt-0.5">
            Google: {location.name}
          </p>
        )}
        
        {/* Metadata... */}
        
        {/* Tips with source tags */}
        {tips.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="text-sm font-semibold mb-2">💡 Tips</div>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="flex-shrink-0">
                    {getSourceIcon(tip.source)}
                  </span>
                  <span>"{tip.text}"</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Source footer... */}
        
        {/* Enhanced Gear Menu */}
        <GearMenu
          context={context}
          days={days}
          tripId={tripId}
          onAction={onAction}
        />
      </div>
    </div>
  )
}

function getSourceIcon(source: string): string {
  switch (source) {
    case 'highlight': return '📝'
    case 'context': return '📄'
    case 'page': return '🌐'
    case 'google_reviews': return '⭐'
    default: return '💡'
  }
}
```

### Enhanced GearMenu Component

```tsx
export function GearMenu({ context, days, tripId, onAction }) {
  return (
    <DropdownMenu>
      {/* Library Context */}
      {context === 'library' && (
        <>
          <MenuItem onClick={() => onAction('addToTrip')}>
            ➕ Add to Trip
          </MenuItem>
          <MenuItem onClick={() => onAction('rename')}>
            ✏️ Rename Location
          </MenuItem>
          <MenuItem onClick={() => onAction('editNotes')}>
            📝 Edit Notes
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => onAction('delete')} danger>
            🗑️ Delete Forever
          </MenuItem>
        </>
      )}
      
      {/* Trip Context */}
      {context === 'trip' && (
        <>
          <MenuItem onClick={() => onAction('moveToDay')}>
            🔗 Move to Day
          </MenuItem>
          <MenuItem onClick={() => onAction('setTime')}>
            🕐 Set Time
          </MenuItem>
          <MenuItem onClick={() => onAction('rename')}>
            ✏️ Rename Location
          </MenuItem>
          <MenuItem onClick={() => onAction('editNotes')}>
            📝 Edit Notes
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => onAction('removeFromTrip')} danger>
            🗑️ Remove from Trip
          </MenuItem>
          <MenuItem onClick={() => onAction('delete')} danger>
            🗑️ Delete Forever
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  )
}
```

### New Modals

**1. Rename Location Modal:**

```tsx
<Modal title="Rename Location">
  <p className="text-sm text-gray-600 mb-4">
    Choose a custom name for this location. The original Google Places name 
    will be preserved.
  </p>
  
  <label className="block text-sm font-semibold mb-2">
    Display Name
  </label>
  <input 
    type="text"
    value={displayName}
    placeholder={location.name}
    className="w-full px-3 py-2 border rounded-lg"
  />
  
  <div className="text-xs text-gray-500 mt-2">
    Google Places: {location.name}
  </div>
  
  <div className="flex gap-3 mt-6">
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </div>
</Modal>
```

**2. Set Time Modal:**

```tsx
<Modal title="Set Time">
  <p className="text-sm text-gray-600 mb-4">
    Set when you'd like to visit this location in this trip.
  </p>
  
  <label className="block text-sm font-semibold mb-2">
    Time
  </label>
  <input 
    type="time"
    value={suggestedTime}
    className="w-full px-3 py-2 border rounded-lg mb-4"
  />
  
  <label className="block text-sm font-semibold mb-2">
    Duration (optional)
  </label>
  <div className="flex gap-2">
    <input 
      type="number"
      placeholder="Hours"
      className="w-20 px-3 py-2 border rounded-lg"
    />
    <input 
      type="number"
      placeholder="Minutes"
      className="w-20 px-3 py-2 border rounded-lg"
    />
  </div>
  
  <div className="flex gap-3 mt-6">
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </div>
</Modal>
```

---

## 📊 Implementation Phases

### Phase 1: Deduplication (Week 1)
**Goal:** Eliminate duplicate locations

**Tasks:**
1. Add `unique_user_place_id` constraint to database
2. Run deduplication script on existing data
3. Update POST /api/locations to check for duplicates
4. Implement merge logic (tips + sources)
5. Update toast messages ("Added tips to existing...")
6. Test with 20 real examples

**Deliverables:**
- Migration script
- Updated API endpoint
- Test suite (duplicate detection)

**Success Criteria:**
- No new duplicates created
- Existing duplicates merged correctly
- User receives clear feedback

---

### Phase 2: Tiered Tips (Week 2)
**Goal:** Replace AI summaries with source-tagged tips

**Tasks:**
1. Add `sources` and `google_reviews` columns
2. Update tips JSONB structure
3. Create new AI prompts (highlight, context, page, reviews)
4. Update Inngest job with tip extraction steps
5. Implement semantic deduplication
6. Update LocationCard to show source icons
7. Test tip quality on 50 locations

**Deliverables:**
- Migration script for tips structure
- Updated AI prompts
- Enhanced Inngest job
- Updated LocationCard component

**Success Criteria:**
- 95%+ locations have 1-3 tips
- Tips are actionable (not generic descriptions)
- Source attribution is clear

---

### Phase 3: Enhanced Interactions (Week 3)
**Goal:** Rich editing and customization

**Tasks:**
1. Add `display_name` column
2. Update image link to Google Maps
3. Implement Rename modal + API
4. Implement Set Time modal + API (trip context only)
5. Implement Edit Notes modal + API
6. Update GearMenu for context-aware options
7. Add confirmation dialogs (remove vs delete)

**Deliverables:**
- Migration script for display_name
- New API endpoint: PATCH /api/trip-locations/:id
- 3 new modals (Rename, Set Time, Edit Notes)
- Updated GearMenu component

**Success Criteria:**
- Users can customize location names
- Trip-specific times work correctly
- Gear menu shows correct options per context

---

### Phase 4: Polish & Edge Cases (Week 4)
**Goal:** Production-ready quality

**Tasks:**
1. Loading states for all gear menu actions
2. Error handling and retry logic
3. Offline detection (queue actions)
4. Keyboard shortcuts (Cmd+E to edit)
5. Bulk operations (select multiple → set time)
6. Performance optimization (render large lists)
7. Accessibility audit (screen readers, keyboard nav)

**Deliverables:**
- Loading skeletons
- Error boundaries
- Keyboard shortcut guide
- Performance benchmarks

**Success Criteria:**
- All actions complete < 500ms
- Zero runtime errors
- Full keyboard navigation

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('Deduplication', () => {
  it('merges tips when place_id matches', async () => {
    const location1 = await createLocation({ place_id: 'ChIJ123' })
    const location2 = await createLocation({ place_id: 'ChIJ123' })
    
    expect(location2.id).toBe(location1.id)
    expect(location2.tips.length).toBeGreaterThan(location1.tips.length)
  })
  
  it('creates new location when place_id differs', async () => {
    const location1 = await createLocation({ place_id: 'ChIJ123' })
    const location2 = await createLocation({ place_id: 'ChIJ456' })
    
    expect(location2.id).not.toBe(location1.id)
  })
})

describe('Tiered Tips', () => {
  it('prioritizes highlight tips over reviews', async () => {
    const tips = await extractTips({
      highlight: 'Go at 5pm',
      reviews: ['Amazing place', 'Great service']
    })
    
    expect(tips[0].source).toBe('highlight')
    expect(tips[0].text).toBe('Go at 5pm')
  })
  
  it('fills with reviews when only 1 user tip', async () => {
    const tips = await extractTips({
      highlight: 'Cash only',
      reviews: ['Great food', 'Nice atmosphere']
    })
    
    expect(tips).toHaveLength(3)
    expect(tips[0].source).toBe('highlight')
    expect(tips[1].source).toBe('google_reviews')
    expect(tips[2].source).toBe('google_reviews')
  })
})

describe('Trip-Specific Times', () => {
  it('allows different times in different trips', async () => {
    const location = await createLocation()
    
    await addToTrip(location.id, 'trip1', { time: '5pm' })
    await addToTrip(location.id, 'trip2', { time: '7pm' })
    
    const trip1Loc = await getTripLocation('trip1', location.id)
    const trip2Loc = await getTripLocation('trip2', location.id)
    
    expect(trip1Loc.suggested_time).toBe('5pm')
    expect(trip2Loc.suggested_time).toBe('7pm')
  })
})
```

### Integration Tests

```typescript
describe('End-to-End', () => {
  it('saves location, merges duplicate, links to trip', async () => {
    // Save from Reddit
    const loc1 = await saveFromReddit({ text: 'Bar Raval is great' })
    expect(loc1.place_id).toBe('ChIJ123')
    
    // Save same place from blog
    const loc2 = await saveFromBlog({ text: 'Try Bar Raval vermouth' })
    expect(loc2.id).toBe(loc1.id)
    expect(loc2.tips).toHaveLength(2)
    
    // Add to trip with time
    await addToTrip(loc2.id, 'trip1', { time: '5pm' })
    
    const tripLoc = await getTripLocation('trip1', loc2.id)
    expect(tripLoc.suggested_time).toBe('5pm')
  })
})
```

### Manual Testing Checklist

- [ ] Save same location twice → merges correctly
- [ ] Save to multiple trips → different times work
- [ ] Rename location → display name shows, Google name preserved
- [ ] Set time in trip → persists correctly
- [ ] Remove from trip → stays in library
- [ ] Delete forever → removed everywhere
- [ ] Click image → opens Google Maps
- [ ] Tips show correct source icons
- [ ] Gear menu shows correct options per context

---

## 📈 Success Metrics & Monitoring

### Key Metrics

**Deduplication:**
```sql
-- % of locations with duplicate place_ids
SELECT 
  COUNT(*) FILTER (WHERE place_id IN (
    SELECT place_id 
    FROM locations 
    GROUP BY user_id, place_id 
    HAVING COUNT(*) > 1
  )) * 100.0 / COUNT(*) as duplicate_rate
FROM locations;

Target: < 1%
```

**Content Quality:**
```sql
-- % of locations with 1-3 tips
SELECT 
  COUNT(*) FILTER (
    WHERE jsonb_array_length(tips) BETWEEN 1 AND 3
  ) * 100.0 / COUNT(*) as tips_coverage
FROM locations
WHERE processing_status = 'complete';

Target: > 95%
```

**Multi-Trip Usage:**
```sql
-- % of locations in multiple trips
SELECT 
  COUNT(DISTINCT location_id) FILTER (
    WHERE trip_count > 1
  ) * 100.0 / COUNT(DISTINCT location_id) as multi_trip_rate
FROM (
  SELECT location_id, COUNT(*) as trip_count
  FROM trip_locations
  GROUP BY location_id
) subquery;

Target: > 50%
```

**User Engagement:**
```sql
-- % of locations customized
SELECT 
  COUNT(*) FILTER (
    WHERE display_name IS NOT NULL 
       OR user_notes IS NOT NULL
  ) * 100.0 / COUNT(*) as customization_rate
FROM locations;

Target: > 30%
```

### Dashboards

**Admin Dashboard:**
- Deduplication rate (daily)
- Tip extraction success rate
- Average tips per location
- Merge vs create ratio
- Google Maps click-through rate

**Alerts:**
- Duplicate rate > 5% → investigate extraction logic
- Tip coverage < 90% → check AI prompts
- Merge failures > 1% → check database constraints

---

## 🚨 Edge Cases & Considerations

### Edge Case 1: Place Closed/Moved
**Scenario:** Google Places returns "permanently_closed"

**Solution:**
- Store flag in database
- Show warning badge on card
- Allow user to archive or mark as "check later"

### Edge Case 2: Multiple Places Same Name
**Scenario:** "Starbucks" with different place_ids

**Solution:**
- Rely on place_id (different place_ids = different locations)
- Show address to differentiate
- User can manually merge if truly duplicate

### Edge Case 3: Zero Tips Extracted
**Scenario:** User highlights just "Great place!"

**Solution:**
- Still save location with minimal data
- Show placeholder: "No specific tips yet"
- Encourage user to add notes

### Edge Case 4: Conflicting Edits
**Scenario:** User renames location, then saves from another source

**Solution:**
- Preserve display_name (user override)
- Merge tips but don't overwrite display_name
- Log in sources array for transparency

### Edge Case 5: Google API Quota
**Scenario:** Hit Google Places daily quota

**Solution:**
- Queue reviews fetch for later
- Save location without reviews
- Retry next day via cron job
- Show "Reviews pending" state

---

## 🎓 Learning & Documentation

### User Documentation

**Help Text in UI:**
- Hover on source icons → tooltip explaining what each means
- First time saving duplicate → onboarding tooltip
- Set time modal → explain trip-specific nature

**FAQ Section:**
```
Q: Why does my location have multiple source icons?
A: Each icon shows where we found that tip - from your highlight 📝, 
   the page context 📄, or Google reviews ⭐

Q: Can I have different times for the same location in different trips?
A: Yes! Times are trip-specific. "Bar Raval" can be at 5pm in one trip 
   and 7pm in another.

Q: What happens if I rename a location?
A: Your custom name is displayed, but the original Google Places name 
   is preserved. This helps with deduplication.
```

### Developer Documentation

**Code Comments:**
```typescript
/**
 * Merges tips from new capture into existing location
 * 
 * Rules:
 * 1. Deduplicate by semantic similarity (not exact text match)
 * 2. Preserve source tags
 * 3. Re-prioritize combined list
 * 4. Keep top 3
 * 
 * @param existingTips - Current tips in database
 * @param newTips - Tips from new capture
 * @returns Merged and deduplicated tips
 */
function mergeTips(existingTips, newTips) {
  // Implementation...
}
```

---

## 🔄 Future Enhancements (Post-V1)

### V2 Features
- **Bulk operations**: Select 5 locations → set same time for all
- **Smart suggestions**: "Bar Raval at 5pm? You have reservations at 6pm nearby"
- **Tip voting**: Users can upvote helpful tips
- **Photo carousel**: Swipe through multiple photos
- **Offline queue**: Save actions while offline, sync later

### V3 Features
- **Collaborative tips**: See tips from other users (opt-in)
- **AI recommendations**: "People who liked Bar Raval also liked..."
- **Calendar integration**: Export trip schedule to Google Calendar
- **Voice input**: "Add Bar Raval to my Tokyo trip at 5pm"

---

## ✅ Definition of Done

**Feature is complete when:**
- [ ] All unit tests pass (>95% coverage)
- [ ] Integration tests pass
- [ ] Manual testing checklist complete
- [ ] Database migration runs successfully
- [ ] API documentation updated
- [ ] UI components match design specs
- [ ] Performance benchmarks met (<500ms actions)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] User documentation written
- [ ] Monitoring dashboards created
- [ ] Deployed to staging and tested
- [ ] Code review approved
- [ ] Product owner sign-off

---

## 📚 References

- **Existing Docs:**
  - [Database Schema](./database_schema.sql)
  - [System Design Spec](./system_design_specification.md)
  - [UI Spec](./UIUX/complete_ui_specification.md)

- **External APIs:**
  - [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
  - [Inngest Documentation](https://www.inngest.com/docs)

- **Design Assets:**
  - Figma: (link to mockups)
  - Icons: Emoji standard

---

**Approved By:** [Product Owner]  
**Start Date:** TBD  
**Expected Completion:** 4 weeks  
**Priority:** High



# Database Design Decisions

**Version:** 1.0  
**Last Updated:** October 11, 2025  
**Status:** Approved for Implementation

---

## Architecture Overview

### Core Principle: Pool + References

The database uses a **many-to-many** architecture where:
- **Locations** exist in country-grouped pools
- **Trips** reference locations (no duplication)
- Same location can appear in multiple trips with different schedules

This mirrors how users actually think: "I have a pool of Japan places, let me create different trip variations from them."

---

## Key Design Decisions

### Decision 1: Location Pool vs. Trip Ownership

**Problem:** Should locations be owned by trips or exist independently?

**Option A (Rejected): Hierarchical Ownership**
```sql
trips → locations (one-to-many)
```
- ❌ Location duplicated if in multiple trips
- ❌ Can't reuse locations
- ❌ Doesn't match user discovery workflow

**Option B (Chosen): Pool + References**
```sql
locations ← trip_locations → trips (many-to-many)
```
- ✅ No duplication
- ✅ Locations can be in multiple trips
- ✅ Matches "save first, organize later" workflow

**Rationale:** Users discover locations over time, then organize them into trips. They want flexibility to create multiple trip variations from the same pool of locations.

---

### Decision 2: Country-Level Grouping

**Problem:** How do we organize the location pool?

**Chosen Approach:**
```sql
countries → locations
```

**Why Country, Not City?**
- Users think in countries: "My Japan places"
- Cities are too granular (multiple cities per trip)
- Country aligns with travel planning units
- Easy to filter: "Show me all my Japan locations"

**Example User Flow:**
1. User saves 30 Japan locations over 2 weeks
2. Later: "Create trip from Japan pool"
3. Selects 12 locations for "3-day Tokyo trip"
4. Same 30 locations available for "7-day Japan trip"

---

### Decision 3: Trip-Specific Scheduling (Issue 1)

**Problem:** Same location in different trips needs different schedules

**Solution:** `trip_locations` table stores trip-specific metadata

```sql
trip_locations (
  trip_id,
  location_id,
  day_number,      -- Day 1 in this trip
  suggested_time,  -- 10:00 AM in this trip
  notes            -- Trip-specific notes
)
```

**Example:**
```
Location: Senso-ji Temple

Trip A "3 Days Tokyo":
  Day 1, 10:00 AM, "Start of day"

Trip B "Week in Japan":
  Day 3, 2:00 PM, "After lunch"

Trip C "Japan Highlights":
  Day 1, 9:00 AM, "Beat the crowds"
```

**Why This Works:**
- Location data (name, address, photos) shared across trips
- Schedule (day, time, notes) unique per trip
- Edit location name → updates in all trips ✅
- Edit schedule → only affects one trip ✅

---

### Decision 4: Editing Shared Locations (Issue 2)

**Problem:** User fixes a typo in a location name. Should it update everywhere?

**Chosen:** Option A - Yes, update everywhere

**Rationale:**
- Locations are **entities** (like contacts in your phone)
- If you learn new info about a place, you want it everywhere
- Alternative (copy-on-write) creates fragmentation

**Implementation:**
```sql
-- User edits "Senso-ji Tempel" → "Senso-ji Temple"
UPDATE locations SET name = 'Senso-ji Temple' WHERE id = ?;

-- Now correct in all trips that reference it
```

**What's Trip-Specific:**
- Notes: "Remember to arrive early" (trip-specific)
- Day/time: Different in each trip
- Status: "visited" in past trips, "planned" in future

**What's Shared:**
- Name, address, photos (global attributes)
- Category, price level (objective facts)
- AI-generated summary (shared knowledge)

---

### Decision 5: Deleting Locations (Issue 3)

**Problem:** User wants to delete a location that's in multiple trips

**Chosen:** Two-level delete with clear UI

**Option A: Remove from specific trip**
```sql
DELETE FROM trip_locations 
WHERE trip_id = ? AND location_id = ?;
```
- Location remains in pool
- Available for other trips

**Option B: Delete from pool (permanent)**
```sql
DELETE FROM locations WHERE id = ?;
-- CASCADE deletes all trip_locations entries
```
- Removed from all trips
- Gone from pool

**UI Design:**
```
Right-click location in trip view:
├─ Remove from this trip
└─ Delete permanently (⚠️ removes from all trips)
```

**Why Two Options:**
- Users might want location gone from one trip but not others
- "Delete permanently" is dangerous → needs confirmation
- Most common: Remove from trip (cleanup)
- Less common: Delete from pool (mistake/bad info)

---

### Decision 6: Flags for Source Tracking

**Problem:** How do we distinguish manually saved vs. imported locations?

**Chosen:** Two boolean flags

```sql
locations:
  is_from_itinerary BOOLEAN  -- Was this imported in bulk?
  source_type TEXT           -- 'single_save' | 'bulk_import'

trips:
  is_itinerary BOOLEAN       -- Was this trip created from import?
```

**Use Cases:**

**For Locations:**
- UI: Show badge "From blog import"
- Filtering: "Show only my manual saves"
- Trust score: Imported locations might be more reliable
- Batch operations: "Delete all imports from this blog"

**For Trips:**
- UI: "Imported from [blog name]"
- Behavior: Maybe make imported trips read-only initially
- Re-import: "Update trip from source URL"
- Analytics: Compare success of manual vs. imported trips

**Example:**
```
Japan Pool (25 locations):
  ├── Senso-ji Temple (manual save from Reddit)
  ├── Ramen shop (manual save from Reddit)
  ├── Mt. Fuji day trip (imported from blog) 🏷️
  ├── Tokyo Tower (imported from blog) 🏷️
  └── ...

Trips:
  ├── "3 Days in Tokyo" (imported) 🏷️
  └── "My Japan Adventure" (manual)
```

---

## Table Relationships

### Entity Relationship Diagram

```
users
  ├─── locations (user's location pool)
  │      └─── countries (grouped by country)
  │
  └─── trips (user's itineraries)
         └─── trip_locations (links trips to locations)
                ├─── location_id → locations
                └─── day_number, time, notes (trip-specific)
```

### Key Relationships

**One User → Many Countries → Many Locations**
```sql
users (1) → (∞) locations
locations (∞) → (1) countries
```

**One User → Many Trips**
```sql
users (1) → (∞) trips
```

**Many Trips ↔ Many Locations (via trip_locations)**
```sql
trips (∞) ← trip_locations → (∞) locations
```

**Same Location in Multiple Trips:**
```sql
Location: Senso-ji Temple (id: L1)

trip_locations:
  (trip: T1, location: L1, day: 1)
  (trip: T2, location: L1, day: 3)
  (trip: T3, location: L1, day: 1)
```

---

## Query Patterns

### Common Queries

**1. Get all locations in country pool for user**
```sql
SELECT * FROM locations 
WHERE user_id = ? AND country_id = ? 
ORDER BY created_at DESC;
```

**2. Get trip with scheduled locations**
```sql
SELECT 
  l.*,
  tl.day_number,
  tl.display_order,
  tl.suggested_time,
  tl.notes
FROM locations l
JOIN trip_locations tl ON l.id = tl.location_id
WHERE tl.trip_id = ?
ORDER BY tl.day_number, tl.display_order;
```

**3. Get unscheduled locations in trip (someday bucket)**
```sql
SELECT l.* 
FROM locations l
JOIN trip_locations tl ON l.id = tl.location_id
WHERE tl.trip_id = ? AND tl.day_number IS NULL;
```

**4. Find which trips use a location**
```sql
SELECT t.* 
FROM trips t
JOIN trip_locations tl ON t.id = tl.trip_id
WHERE tl.location_id = ?;
```

**5. Calculate day's total time (with travel)**
```sql
SELECT 
  SUM(tl.estimated_duration_minutes) as activity_time,
  SUM(ld.duration_seconds) / 60 as travel_time,
  (SUM(tl.estimated_duration_minutes) + SUM(ld.duration_seconds) / 60) as total_time
FROM trip_locations tl
LEFT JOIN location_distances ld 
  ON ld.from_location_id = tl.location_id
WHERE tl.trip_id = ? AND tl.day_number = ?;
```

---

## Extensibility & Future Features

### Phase 1.0: Current Schema Supports

✅ Single location saves  
✅ Bulk itinerary imports  
✅ Multiple trips from same pool  
✅ Trip-specific scheduling  
✅ Distance caching  
✅ Route optimization data  

### Phase 2.0: Schema Ready For

✅ **Collaboration:** `trip_collaborators` table already defined  
✅ **Sharing:** `trips.share_token` field ready  
✅ **Public trips:** `trips.is_public` flag ready  
✅ **User ratings:** `locations.user_rating` field ready  
✅ **Favorites:** `locations.is_favorite` field ready  

### Future Extensions (Schema Changes Needed)

**AI-Suggested Trips:**
```sql
suggested_trips (
  id, user_id, name, reasoning, locations[], created_at
)
```

**Location Reviews:**
```sql
location_reviews (
  id, location_id, user_id, rating, review_text, visited_date
)
```

**Budget Tracking:**
```sql
trip_expenses (
  id, trip_id, location_id, category, amount, currency, notes
)
```

**Transport Bookings:**
```sql
trip_transport (
  id, trip_id, type, from_location, to_location, 
  booking_reference, cost, departure_time
)
```

---

## Performance Considerations

### Indexes

**Critical for Performance:**
- `idx_locations_user_country` - Filtering pool by country
- `idx_trip_locations_trip` - Loading trip view
- `idx_locations_place_id` - Deduplication via Google Places

**Query Optimization:**
- Use `JOIN` instead of multiple queries
- Cache distance calculations
- Paginate location pools (don't load 1000s at once)

### Expected Data Volumes (per user)

**Casual User (1 trip/year):**
- 50 locations
- 3 trips
- 150 trip_locations records
- Query time: < 50ms

**Power User (10 trips/year):**
- 500 locations
- 30 trips
- 2,000 trip_locations records
- Query time: < 100ms

**Very Active User (travel blogger):**
- 5,000 locations
- 200 trips
- 25,000 trip_locations records
- Query time: < 500ms (needs pagination)

---

## Migration Path

### Phase 0.1 → Phase 0.2

**Existing Data (chrome.storage.local):**
```javascript
{
  captures: [
    {
      id: "abc-123",
      text: "Senso-ji Temple is amazing",
      url: "reddit.com/...",
      pageTitle: "Tokyo recommendations",
      timestamp: 1234567890
    }
  ]
}
```

**Migration Steps:**

1. **Create default country (if not exists)**
```sql
INSERT INTO countries (name, code) 
VALUES ('Unknown', 'XX')
ON CONFLICT DO NOTHING;
```

2. **Import locations**
```sql
INSERT INTO locations (
  user_id, country_id, name, original_text, 
  source_url, page_title, created_at
)
SELECT 
  ?, 
  (SELECT id FROM countries WHERE code = 'XX'),
  'Saved location',
  capture.text,
  capture.url,
  capture.pageTitle,
  to_timestamp(capture.timestamp / 1000)
FROM chrome_captures;
```

3. **Create default trip**
```sql
INSERT INTO trips (user_id, country_id, name, is_active)
VALUES (?, ?, 'My Trips', true);
```

4. **Link all locations to default trip**
```sql
INSERT INTO trip_locations (trip_id, location_id)
SELECT ?, id FROM locations WHERE user_id = ?;
```

5. **User can then organize into countries/trips**

---

## Testing Strategy

### Unit Tests

- CRUD operations on each table
- Constraint validation (unique, check)
- Cascade deletes work correctly
- Triggers update timestamps

### Integration Tests

- Create trip, add locations, schedule days
- Same location in multiple trips
- Delete location from one trip (remains in others)
- Delete location permanently (removed from all trips)
- Calculate distances between locations
- Import bulk itinerary, create trip + locations

### Performance Tests

- Load trip with 50 locations (< 100ms)
- Query country pool of 500 locations (< 200ms)
- Calculate distances for 10 locations (< 1s)

---

## Security Considerations

### Row-Level Security (RLS)

For Supabase, enable RLS policies:

```sql
-- Users can only see their own locations
CREATE POLICY "Users see own locations"
ON locations FOR ALL
USING (user_id = auth.uid());

-- Users can only see their own trips
CREATE POLICY "Users see own trips"
ON trips FOR ALL
USING (user_id = auth.uid());

-- Users can manage trip_locations for their trips
CREATE POLICY "Users manage own trip_locations"
ON trip_locations FOR ALL
USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);
```

### Data Privacy

- Location data is personal (reveals travel plans)
- `is_public` flag for opt-in sharing only
- `share_token` for anonymous sharing (no auth required)
- Never expose user email/personal info in public trips

---

## Monitoring & Analytics

### Metrics to Track

**User Engagement:**
- Locations saved per user
- Trips created per user
- Locations per trip (avg)
- Active users (saved in last 30 days)

**Import Success:**
- Bulk imports attempted
- Bulk imports succeeded
- Locations per bulk import (avg)
- Time to process bulk import

**Feature Usage:**
- Single saves vs. bulk imports
- Manual trips vs. imported trips
- Locations moved between trips
- Locations deleted from trips

---

## Conclusion

This schema is designed to:

1. ✅ Match user mental model (pool → trips)
2. ✅ Support both single saves and bulk imports
3. ✅ Enable location reuse without duplication
4. ✅ Allow trip-specific scheduling
5. ✅ Prepare for future features (sharing, collaboration)

The key insight: **Locations are entities, trips are playlists.**

---

**Ready for Implementation:** Phase 0.2  
**Reference:** `artifacts/database_schema.sql`  
**Next Step:** Build backend API with this schema


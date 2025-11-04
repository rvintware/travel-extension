# Travel Companion: Complete Demo Walkthrough Script

## Demo Structure Overview

**Total Duration:** ~30-45 minutes

**Style:** Technical deep-dive with wow moments

**Audience:** Developers, investors, potential users

---

## ACT 1: THE PROBLEM (5-7 minutes)

### Opening Hook (30 seconds)

**Screen:** Show chaotic state of travel planning

- 20+ browser tabs open (Pinterest, Reddit, blogs, Airbnbs)
- Messy Excel spreadsheet with broken links
- Notes app with "Tokyo recommendations" scattered everywhere
- Instagram saved folders with 47 folders named "Travel" or misspelled country names

**Voiceover:** "This is how most people plan travel today. Chaotic. Overwhelming. Broken."

### The Instagram Folders Analogy (2 minutes)

**Screen:** Open Instagram, show saved folders

- Scroll through infinite list of travel folders
- Try to save a new post - only see top 3 folders
- Demonstrate the pain:
        - Can't find "Barcelona 2024" because it's buried
        - Create new folder, accidentally type "Barselona" (misspelling)
        - Now have 2 Barcelona folders
        - No organization, no categories, no auto-sorting

**Voiceover:** "Instagram folders are a disaster for travel junkies. Infinite scroll, no search, no organization. Sound familiar?"

### The Gmail Extension Insight (2 minutes)

**Screen:** Show old Gmail extension popup vs Gmail web app

**SCRIPT - YOUR STORY (space to fill in):**

```
[YOUR NARRATIVE HERE - The genesis story]

The idea came from observing two things:

1. The old-school Gmail Chrome extension popup - people LOVED it. 
   Used it more than the full Gmail web app even though the web app 
   had more features and a bigger screen. Why?
   
   → Snappiness
   → Quick access
   → Ease of use
   → Smaller, less intimidating
   → Checking email became a quick side task
   → Perfect for multitasking
   
   Users didn't want a full-screen experience for every action.
   They wanted focused, fast, contextual.

2. Instagram's folder chaos - as a travel enthusiast, you accumulate
   hundreds of saved posts. But finding them? Organizing them? 
   Impossible.
   
   → Infinite scroll through dozens of folders
   → Only top 3 visible when saving
   → Easy to misspell folder names when rushing
   → No auto-categorization
   → No way to know WHY you saved something 6 months later
   
   What if Instagram had automatic organization? What if it could
   detect "this is a restaurant in Tokyo" and file it appropriately?
   
   That's what we built.
```

### The Core Problem Statement (1 minute)

**Screen:** Simple slide or screen with text

**THE PROBLEM:**

```
Travel discovery is amazing - Pinterest, blogs, Reddit, TikTok
Travel saving is broken - where did I save that? What was it? Why?
Travel organization is impossible - Excel? Notes app? Bookmarks?

Result: Analysis paralysis. Fear of losing information.
        People stop saving or create unusable messes.
```

**THE SOLUTION:**

```
Save anywhere, organized automatically.
One click. Context preserved. Searchable. Trip-aware.
Zero cognitive overhead.
```

---

## ACT 2: THE SOLUTION - HIGH LEVEL (5 minutes)

### The One-Sentence Pitch (15 seconds)

**Screen:** Extension popup showing organized countries and locations

**Voiceover:** "Travel Companion: Save travel discoveries from anywhere on the web, automatically organized by country, with AI-extracted context and zero manual effort."

### The User Experience (2 minutes)

**Screen:** Live demo of saving flow

**Demo Sequence:**

1. **Browse Reddit:** Find post "Best ramen in Tokyo - Ichiran Shibuya at 5pm"
2. **Highlight text:** Select the location mention
3. **Right-click → Save to Library:** One click
4. **Toast appears:** "✓ Saved"
5. **Open extension popup:** Navigate to Japan → See Ichiran Shibuya
6. **Location card shows:**

            - Hero photo from Google Places
            - Address, category, rating
            - 3 actionable tips with source icons:
                    - 📝 "Go at 5pm to avoid crowds" (from your highlight)
                    - 📄 "Try the tonkotsu broth" (from surrounding context)
                    - ⭐ "Best ramen in Tokyo" (from Google reviews)
            - Source link back to Reddit post

**Voiceover:** "From discovery to organized, searchable library - in 2 seconds."

### The Architecture Teaser (2 minutes)

**Screen:** High-level diagram

**Architecture Overview:**

```
Browser Extension (Plasmo/React)
        ↓ screenshot + text
Backend API (Next.js 15)
        ↓ trigger job
AI Processing (Inngest + GPT-4o Vision)
        ↓ enrich + verify
Google Places API
        ↓ store
Database (Supabase PostgreSQL)
        ↓ sync
Extension Popup (real-time updates)
```

**Key Insights:**

- **Async by design:** Save is instant, processing happens in background
- **AI Vision:** Screenshot captures context that HTML can't
- **Pool + References:** One location, many trips (data integrity)
- **Deduplication:** Never save the same place twice
- **Type-safe:** TypeScript end-to-end

---

## ACT 3: ARCHITECTURE DEEP-DIVE (8-10 minutes)

### The Stack (1 minute)

**Screen:** Tech stack diagram

**Frontend:**

- Plasmo Framework (Chrome Extension boilerplate)
- React 19 + TypeScript
- Tailwind CSS
- Chrome APIs (context menus, tabs, storage)

**Backend:**

- Next.js 15 (App Router)
- TypeScript + Zod validation
- Supabase PostgreSQL
- Row-Level Security (RLS)

**AI/Processing:**

- Inngest (job orchestration)
- OpenAI GPT-4o (vision + extraction)
- Google Places API (enrichment)

**Why This Stack:**

- Modern, type-safe, fast
- Serverless-friendly (easy deployment)
- AI-native (GPT-4 vision for screenshots)
- Developer experience (hot reload, TypeScript)

### Database Schema: Pool + References (3 minutes)

**Screen:** Database schema diagram

**The Architecture Decision:**

**WRONG Approach (naive):**

```
trips
  ├─ trip_locations (owns location data)
  └─ duplicates everywhere
```

Problem: Same restaurant in 3 trips = 3 copies, data drift

**RIGHT Approach (Pool + References):**

```
locations (POOL - one source of truth)
  ├─ id, name, place_id, photos, tips, etc.
  └─ One record per physical place per user

trip_locations (REFERENCES - many-to-many)
  ├─ trip_id, location_id
  ├─ day_number, suggested_time (trip-specific)
  └─ Can have different schedules per trip

trips
  ├─ id, name, dates
  └─ Links to locations via references
```

**Benefits:**

- Single source of truth
- Update once, reflects everywhere
- Trip-specific data (time, day) in join table
- Deduplication built-in

**Show in Supabase:**

- Open Supabase table editor
- Show locations table
- Show trip_locations join table
- Demonstrate one location linked to multiple trips

### The Inngest Pipeline (5 minutes)

**Screen:** Inngest dashboard + architecture diagram

**Why Inngest?**

- **Problem:** AI processing takes 5-10 seconds (too slow for user-facing)
- **Solution:** Async job queue with retries, observability, step functions

**The Job Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ USER SAVES LOCATION                                          │
│ Extension → Backend API → Creates placeholder → Returns ID  │
│ Total time: <500ms                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Triggers Inngest Job
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ INNGEST JOB: process-location                               │
│ (Runs async, user doesn't wait)                            │
└─────────────────────────────────────────────────────────────┘

STEP 0: Extract Global Context (AI Vision)
  Input: Screenshot, selected text, URL
  AI: "This is a Reddit post about Japan, specifically Tokyo area"
  Output: {country: "Japan", city: "Tokyo", confidence: 0.95}

STEP 1: Mark as Processing
  Update DB: processing_status = 'processing'

STEP 2: Count Locations
  AI: "How many locations in this text?"
  Output: 1 (single location) or N (itinerary)

STEP 3: Extract Location Variations
  AI: Generate 3 search queries with different specificity:
    High:   "Ichiran Ramen Shibuya Tokyo Japan"
    Medium: "Ichiran Ramen Tokyo"
    Low:    "Ichiran Tokyo"
  Reason: Google Places might not find super-specific queries

STEP 4: Google Places Multi-Attempt
  Try variation 1 → Not found
  Try variation 2 → Found! ✓
  Get: place_id, name, address, lat/lng, photos, rating

STEP 5: Fetch Google Reviews (PHASE 2)
  Input: place_id
  Output: Top 5 reviews sorted by rating

STEP 6: Extract Tiered Tips (PHASE 2)
  Input: Screenshot + selected text + reviews
  AI Prompt: "Extract 3 actionable tips, prioritize user content"
  Output:
    [
      {text: "Go at 5pm...", source: "highlight", confidence: 0.95},
      {text: "Try the broth", source: "context", confidence: 0.85},
      {text: "Best ramen", source: "google_reviews", confidence: 1.0}
    ]

STEP 7: Check for Duplicate (PHASE 1)
  Query: "Do we already have this place_id for this user?"
  If YES → Merge tips, add source URL, link to trip, delete placeholder
  If NO → Continue

STEP 8: Update Database
  Write enriched data:
 - Google Places info (verified location)
 - Tiered tips with sources
 - Processing status: 'complete'
    
STEP 9: Link to Trip (if specified)
  Create trip_locations record

Total time: 5-10 seconds
User experience: Instant save, gradual enrichment
```

**Show Live:**

1. **Inngest Dashboard:** Show job running with steps
2. **Backend Logs:** Show step-by-step execution
3. **Database:** Watch record update from pending → processing → complete

**Why This Design:**

- **Resilient:** Each step retries independently
- **Observable:** See exactly where failures happen
- **Flexible:** Can re-run individual steps
- **Scalable:** Handles 100s of saves concurrently

---

## ACT 4: KEY FEATURES DEMO (10-12 minutes)

### Feature 1: Smart Location Extraction (2 minutes)

**Demo Scenario:** Show different highlight styles

**Test Cases:**

1. **Full sentence:** "We loved Ichiran Ramen in Shibuya at 5pm"

→ Extracts: Ichiran Ramen, tips about timing

2. **Partial highlight:** User selects just "Ichiran"

→ AI uses screenshot context to get full name + location

3. **Vague reference:** "this place was amazing"

→ AI reads screenshot to identify "this place" = specific restaurant

4. **Multiple locations:** Highlight paragraph with 3 restaurants

→ Creates 3 separate locations automatically

**Show in Inngest logs:** How AI interprets each case

### Feature 2: Deduplication (PHASE 1) (3 minutes)

**Demo Scenario:** Save same place from different sources

**Steps:**

1. **Save from Reddit:** "Ichiran Shibuya is great at 5pm"

            - Creates location with tip about timing
            - place_id: ChIJ123...

2. **Save from blog:** "Ichiran Shibuya - try the garlic sauce"

            - Detects duplicate place_id
            - Merges tips into existing location
            - Adds blog URL to sources array
            - Shows in database: sources: [reddit.com, blog.com]

3. **Show in UI:** Only ONE location card exists

            - Has tips from BOTH sources
            - Sources tracked for transparency

**Database View:**

```sql
SELECT 
  name, 
  place_id,
  tips,
  sources,
  jsonb_array_length(sources) as source_count
FROM locations
WHERE name LIKE '%Ichiran%';
```

**Why This Matters:**

- No duplicate clutter
- All information consolidated
- Data integrity maintained

### Feature 3: Tiered Content Hierarchy (PHASE 2) (3 minutes)

**Demo Scenario:** Show tip priority system

**Save location with rich context:**

- **Highlighted text:** "Go at 5pm to avoid lines"
- **Surrounding paragraph:** "The tonkotsu broth is incredible"
- **Visible comment:** "Cash only, no credit cards"
- **Google review:** "Best ramen in Tokyo, worth the wait"

**Show resulting tips:**

```
💡 Tips
📝 "Go at 5pm to avoid lines"        (Priority 1: Your highlight)
📄 "The tonkotsu broth is incredible" (Priority 2: Context)
🌐 "Cash only, no credit cards"       (Priority 3: Page content)
```

**Why not the Google review?**

- Only 3 tips max
- User content prioritized over generic reviews
- Reviews used only if <3 user tips found

**Show AI prompt:**

- Open `extract-tips.ts`
- Show tiered extraction logic
- Explain deduplication ("go at 5pm" vs "arrive before 5:30pm" = same tip)

**Cost optimization:**

- Single GPT-4 vision call (not 4 separate)
- `detail: 'low'` for screenshot (50% cheaper)
- Total: ~$0.027 per location

### Feature 4: Trip Organization (2 minutes)

**Demo Scenario:** Multi-trip workflow

**Steps:**

1. **Create trips:**

            - "Tokyo 2024" (7 days)
            - "Quick Tokyo Weekend"

2. **Save location to Trip 1:**

            - Set time: 5:00 PM
            - Set day: Day 3
            - Add trip-specific note: "Dinner after teamLab"

3. **Add SAME location to Trip 2:**

            - Set time: 7:00 PM (different!)
            - Set day: Day 1
            - Different note: "Late dinner"

4. **Show database:**
   ```sql
   -- One location in pool
   SELECT * FROM locations WHERE name = 'Ichiran Shibuya';
   
   -- Two trip references with different times
   SELECT 
     t.name as trip_name,
     tl.suggested_time,
     tl.day_number,
     tl.notes
   FROM trip_locations tl
   JOIN trips t ON t.id = tl.trip_id
   WHERE tl.location_id = '{location_id}';
   ```


**Why This Design:**

- Same place, different contexts
- Update location once (photos, tips) → reflects in all trips
- Trip-specific data (time, notes) stays separate

### Feature 5: Real-time Sync (1 minute)

**Demo:** Show bi-directional updates

1. **Save in browser:** Watch popup update
2. **Update in database:** Watch popup reflect changes
3. **Add to trip in popup:** Watch database update

**Technology:**

- Chrome message passing (`chrome.runtime.sendMessage`)
- Cache invalidation on mutations
- Optimistic UI updates

---

## ACT 5: PROBLEMS & SOLUTIONS (5-7 minutes)

### Problem 1: The Empty Variations Bug

**Symptom:** AI returned 0 variations, job crashed

**Root Cause:** Prompt said "return empty array if no location"

→ AI interpreted vague text as "no location"

**Solution:**

- Always return 3 variations (even low confidence)
- Multi-attempt with specificity levels
- Fallback to original text as last resort

**Show:** EMPTY_VARIATIONS_FIX.md document

### Problem 2: Duplicate Locations Before Constraint

**Symptom:** Users had multiple "Ichiran Shibuya" records

**Root Cause:** No database constraint on place_id before Phase 1

**Solution:**

- Created cleanup migration (merged duplicates)
- Added unique constraint: `(user_id, place_id)`
- Partial index (only WHERE place_id IS NOT NULL)
- Allowed unverified locations to duplicate

**Show:**

- Migration SQL
- Database constraint
- Test script results

### Problem 3: Extension Crash on Phase 2 Tips

**Symptom:** React error "Objects are not valid as a React child"

**Root Cause:**

- Backend changed tips from `string[]` to `TipObject[]`
- Frontend tried to render `{tip}` instead of `{tip.text}`

**Solution:**

- Updated TypeScript types
- Fixed LocationCard rendering
- Added source icons (bonus!)

**Show:**

- Error screenshot
- Type changes
- Fixed component

### Problem 4: Missing Context for Vague Highlights

**Symptom:** User highlights "this place" → AI doesn't know which place

**Solution: Context-First Architecture**

- Step 0: Extract global context (city, country, coordinates)
- AI sees ENTIRE screenshot (not just highlight)
- Uses surrounding text as context clues
- Coordinate fallback if Google Places fails

**Show:**

- extractGlobalContext() function
- Prompt that analyzes full screenshot
- Example: "this temple" → AI knows it's in Kyoto from context

### Problem 5: Performance - Slow Saves

**Symptom:** Users waited 10+ seconds for save confirmation

**Solution: Async Everything**

- API creates placeholder immediately (<500ms)
- Returns success instantly
- Inngest processes in background
- UI shows "Processing..." badge
- Updates when complete

**Show:**

- Network tab: Fast API response
- Inngest dashboard: Async job
- UI: Gradual enrichment

---

## ACT 6: EDGE CASES & WOW MOMENTS (5-7 minutes)

### Wow Moment 1: The "This Place" Highlight

**Demo:**

1. Go to Reddit travel thread
2. User comments: "We also went here, this place was amazing!"
3. Highlight just "this place"
4. AI figures out from screenshot context what "here" refers to
5. Extracts correct restaurant name + location

**Why it works:** GPT-4 vision reads entire screenshot, understands conversational context

### Wow Moment 2: Partial Highlight Intelligence

**Demo:**

1. Sentence: "Ichiran Ramen in Shibuya at 5pm is the best"
2. User highlights only: "Ichiran"
3. AI extracts:

            - Full name: "Ichiran Ramen"
            - Location: "Shibuya, Tokyo, Japan"
            - Tip: "Go at 5pm"

**Why it works:** AI doesn't just use highlight, reads surrounding context from screenshot

### Wow Moment 3: Itinerary Detection

**Demo:**

1. Highlight paragraph with 5 locations
2. AI counts: "5 locations detected"
3. Creates 5 separate location cards
4. All linked to same trip
5. All with individual Google Places data

**Why it works:** Two-phase detection (count, then extract)

### Wow Moment 4: Coordinate Fallback

**Demo:**

1. Save obscure location: "Small ramen stand near Yoyogi Park"
2. Google Places: Not found
3. AI detects: Tokyo, Yoyogi Park area
4. Uses park coordinates as fallback
5. Location saved with estimated position
6. Marked as `location_verified: false`

**Why it works:** Global context extraction + coordinate estimation

### Wow Moment 5: Cross-Source Intelligence

**Demo:**

1. **Source 1 (Reddit):** "Ichiran at 5pm"

            - Tip: "Go at 5pm to avoid crowds"

2. **Source 2 (Blog):** "Ichiran Shibuya review"

            - Tip: "Try the extra garlic sauce"

3. **Merged result:**

            - 📝 "Go at 5pm to avoid crowds" (from Reddit)
            - 📄 "Try the extra garlic sauce" (from blog)
            - ⭐ "Best ramen in Tokyo" (from Google)

**Why it works:** Deduplication + source tracking + tip merging

### Edge Case 1: Null place_id Locations

**Scenario:** What if Google can't find it?

**Behavior:**

- Still saves location
- Uses AI-extracted name
- Uses coordinate fallback if available
- Marked as unverified
- Can be duplicated (no place_id to dedupe on)

**Show:** Database query for unverified locations

### Edge Case 2: Same Place, Different Users

**Scenario:** Two users save "Ichiran Shibuya"

**Behavior:**

- Each gets their own location record
- Unique constraint: `(user_id, place_id)`
- Privacy maintained
- No data sharing

**Show:** Database with multi-user records

### Edge Case 3: Trip-Specific Times

**Scenario:** Same location in 2 trips at different times

**Behavior:**

- One location in pool
- Two trip_locations records
- Different `suggested_time` per trip
- Location update (photos, tips) reflects everywhere
- Time stays trip-specific

**Show:** Database join query

---

## ACT 7: THE TECHNICAL HIGHLIGHTS (3-5 minutes)

### Highlight 1: Type Safety End-to-End

**Show:**

- Shared types between backend/frontend
- Zod validation on API boundaries
- TypeScript catches errors at compile-time
- Example: Change Location interface → compiler errors everywhere

### Highlight 2: AI Vision Strategy

**Why screenshots vs HTML parsing?**

**Screenshot Captures:**

- Rendered layout (upvoted comments, visual hierarchy)
- Images and context
- Reddit/Pinterest card layouts
- Works on any site (no site-specific scraping)

**HTML Parsing Misses:**

- Visual context
- Comment scores
- Rendered layout
- Dynamic content

**Show:** Screenshot vs page HTML, highlight differences

### Highlight 3: Cost Optimization

**Per Location Saved:**

- Google Places search: $0.017
- Google Places reviews: $0.017
- GPT-4o vision (low detail): ~$0.01
- Total: ~$0.044 per save

**Optimizations:**

- Single vision call (not 4)
- `detail: 'low'` setting
- Cache reviews in DB
- Batch processing possible

**Scale estimate:**

- 1,000 saves = $44
- 10,000 saves = $440
- Reasonable for MVP

### Highlight 4: Developer Experience

**Show:**

- Hot reload in extension (`pnpm dev`)
- Inngest local dev server
- TypeScript auto-complete
- Debugging tools (React DevTools, Network tab)
- Database GUI (Supabase)
- Git history of implementation

---

## ACT 8: FUTURE VISION (2-3 minutes)

### Phase 3: Enhanced UX (Planned)

- ✅ Tiered tips with source icons (done!)
- 🔜 Clickable images → Google Maps
- 🔜 Enhanced gear menu:
        - Rename locations (display_name override)
        - Set time (trip-specific modal)
        - Move to different day
        - Edit trip-specific notes
- 🔜 Drag-and-drop trip planning

### Phase 4: Collaboration

- Share trips with friends
- Collaborative editing
- Comments on locations
- Vote on must-see places

### Phase 5: Smart Recommendations

- "People who liked X also saved Y"
- AI-suggested itineraries
- Budget estimation
- Season-aware recommendations

### Phase 6: Mobile

- Mobile app (React Native)
- Same backend, different frontend
- Offline support
- Camera integration (take photo → save location)

### Long-term Vision

**The Instagram Folders Problem, Solved:**

- Auto-categorization ✓
- Searchable by any field ✓
- Context preserved ✓
- Trip-aware organization ✓
- No cognitive overhead ✓

**The Gmail Extension Insight, Applied:**

- Fast, snappy popup ✓
- Contextual actions ✓
- Minimal, focused UI ✓
- Side-task friendly ✓

---

## ACT 9: CLOSING (2 minutes)

### The Demo Summary

**What We Built:**

- Chrome extension for frictionless saving
- AI-powered extraction and enrichment
- Intelligent deduplication
- Trip-aware organization
- Source-attributed tips
- Type-safe, modern stack

**Why It Matters:**

- Empowers discovery without fear
- Zero manual organization
- Preserves context automatically
- Scales from weekend trip to world tour

### The Technical Achievement

**In 2 months we built:**

- Full-stack Chrome extension
- AI vision pipeline
- Async job orchestration
- Smart deduplication
- Multi-trip management
- Production-ready MVP

**Stack mastered:**

- Plasmo + React + TypeScript
- Next.js 15 + Supabase
- Inngest + OpenAI
- Chrome Extension APIs

### The Call to Action

**Try it yourself:**

1. Load extension (chrome://extensions)
2. Browse travel content
3. Highlight and save
4. Watch the magic

**Next steps:**

- User testing
- Performance optimization
- Phase 3 features
- Public beta

---

## APPENDIX: Demo Checklist

### Pre-Demo Setup

- [ ] Backend running (pnpm dev)
- [ ] Inngest dev server running
- [ ] Extension loaded and active
- [ ] Database has sample data
- [ ] Supabase dashboard open
- [ ] Inngest dashboard open
- [ ] Browser DevTools ready
- [ ] Screen recording software configured
- [ ] Test URLs bookmarked (Reddit, Pinterest, blogs)

### Demo Locations

1. **Reddit:** r/JapanTravel post about Ichiran
2. **Pinterest:** Tokyo restaurant pins
3. **Blog:** Travel blog with itinerary
4. **Complex case:** Paragraph with multiple locations

### Screenshots to Prepare

- Architecture diagrams
- Database schema
- Inngest job flow
- Error screenshots (for problem section)
- Before/after comparisons

### Code to Show

- `backend/lib/jobs/process-location.ts` (Inngest job)
- `backend/lib/ai/extract.ts` (AI functions)
- `backend/lib/ai/prompts/extract-tips.ts` (Prompt)
- `extension/components/LocationCard.tsx` (UI)
- Database migrations (deduplication)

### Queries to Run Live

```sql
-- Show location with sources
SELECT name, sources, tips FROM locations WHERE id = '...';

-- Show trip_locations join
SELECT t.name, tl.suggested_time FROM trip_locations tl
JOIN trips t ON t.id = tl.trip_id WHERE location_id = '...';

-- Show deduplication stats
SELECT place_id, COUNT(*) FROM locations 
WHERE place_id IS NOT NULL GROUP BY place_id;
```

---

## TIMING GUIDE

| Section | Duration | Running Total |

|---------|----------|---------------|

| Act 1: Problem | 5-7 min | 0:07 |

| Act 2: Solution High-Level | 5 min | 0:12 |

| Act 3: Architecture Deep-Dive | 8-10 min | 0:22 |

| Act 4: Feature Demos | 10-12 min | 0:34 |

| Act 5: Problems & Solutions | 5-7 min | 0:41 |

| Act 6: Wow Moments | 5-7 min | 0:48 |

| Act 7: Technical Highlights | 3-5 min | 0:53 |

| Act 8: Future Vision | 2-3 min | 0:56 |

| Act 9: Closing | 2 min | 0:58 |

**Target:** 45-60 minutes for complete walkthrough

**Can be shortened:** Skip some wow moments or technical details for 30-minute version
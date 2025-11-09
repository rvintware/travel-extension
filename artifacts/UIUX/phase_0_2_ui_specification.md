# Phase 0.2 UI Specification - FINAL

**Version:** 2.0  
**Last Updated:** October 12, 2025  
**Status:** Approved for Implementation

---

## Core Principles

1. **Speed First**: Every interaction < 2 seconds
2. **Quality Over Features**: Simple, clean, functional
3. **No Color Coding**: Consistent theme throughout
4. **Maximum 3 Bullet Points**: Per location (avoid overwhelm)
5. **Trust Through Quotes**: Pull quotes from original sources

---

## Navigation Structure

### Two-Tab Layout

```
[My Locations] [My Trips] ⭐
```

**Default View:** My Trips (validates trip planning use case)

**User Preference (in settings):**
- Always open to My Trips (default)
- Always open to My Locations
- Remember last opened tab

---

## Tab 1: My Trips

### Main View - Trip List

```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐   [⚙️] │
│  │ My Locations │  My Trips ⭐ │        │
│  └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│                                         │
│  Active Trip                            │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Tokyo 2025 ▼         [⭐]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Your Trips · 3                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Tokyo 2025           12 saved │ │
│  │    Active · 3 days · Mar 20-27    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan Week           18 saved │ │
│  │    7 days · Jun 1-8               │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🇫🇷 Paris Summer          8 saved │ │
│  │    5 days                         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │        + New Trip                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💡 Tip: Right-click any text to save! │
└─────────────────────────────────────────┘
```

**Features:**
- Active trip dropdown
- Trip cards with: country emoji, name, location count, duration, dates
- Create new trip button
- Helpful tip at bottom

---

### Trip Detail View

```
┌─────────────────────────────────────────┐
│  ← Tokyo 2025                      [🔄] │
├─────────────────────────────────────────┤
│  Tokyo 2025                             │
│  5 Countries · 12 locations             │
│  🗺️ Map View                            │
│                         📤 Export        │
│                                         │
│  ┌─────┬─────┬─────┬─────┬──────────┐ │
│  │ All │ D1  │ D2  │ D3  │Unscheduled│ │
│  │ ·12 │ ·4  │ ·5  │ ·3  │    ·0    │ │
│  └─────┴─────┴─────┴─────┴──────────┘ │
│  ▔▔▔▔▔                                  │
│                                         │
│  Day 1 (4 locations)                    │
│  ⏱️ 6h 30m total (4h activity + 2h 30m  │
│     travel) · 😊 Comfortable            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍷 Senso-ji Temple           [⚙️] │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ [Photo of temple]                 │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ 📍 Asakusa · 🏷️ Temple           │ │
│  │ 🕐 10:00 AM · ⏱️ 2 hours         │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ "Visit before 10am to avoid       │ │
│  │  crowds" - u/traveler123          │ │
│  │ "The photo spot is on the left"   │ │
│  │ "Don't miss the garden"           │ │ <- Max 3 tips
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ reddit.com · 2 days ago           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🚶 15 min walk (1.2 km) ↓              │ <- Travel time
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍜 Ichiran Ramen             [⚙️] │ │
│  │ ...                               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Header Updates:**
- No country flag displayed
- Countries count dynamically calculated from unique countries in trip locations
- Cleaner, more scalable for multi-country trips
- Stacked layout: Map View and Export on separate lines for better touch targets
- Export button right-aligned on second line

**Day Summary Formula:**
```
⏱️ Xh Xm total (Xh activity + Xh Xm travel) · [Comfort]

Comfort levels:
- 😊 Comfortable (< 8 hours)
- 😅 Packed (8-10 hours)
- 😰 Exhausting (> 10 hours)
```

**Gear Menu (in trip):**
```
┌─────────────────────┐
│ 🕐 Set time         │
│ 📅 Move to Day 2    │
│ 📅 Move to Day 3    │
│ 📋 Unschedule       │
├─────────────────────┤
│ 🗑️ Remove from trip │
└─────────────────────┘
```

---

## Tab 2: My Locations

### Country List View

```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐   [⚙️] │
│  │ My Locations⭐  My Trips    │        │
│  └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│                                         │
│  📚 Location Library                    │
│  42 locations across 4 countries        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan           18 locations  │ │ <- Click to drill in
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🇺🇸 USA             12 locations  │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🇫🇷 France           8 locations  │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🇮🇹 Italy            4 locations  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💡 Click a country to view locations  │
└─────────────────────────────────────────┘
```

**Empty state:**
```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐   [⚙️] │
│  │ My Locations⭐  My Trips    │        │
│  └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│                                         │
│              📚                         │
│                                         │
│        No locations yet                 │
│                                         │
│  Start saving by highlighting text on   │
│  any webpage and right-clicking!        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Try Reddit or travel blogs      │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### Country Detail View - Pokemon Style Cards

```
┌─────────────────────────────────────────┐
│  ← Japan                           [⚙️] │
├─────────────────────────────────────────┤
│  🇯🇵 Japan · 18 locations               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍷 Senso-ji Temple           [⚙️] │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │                                   │ │
│  │ [Photo: Temple at sunset]         │ │
│  │                                   │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ 📍 Asakusa, Tokyo                 │ │
│  │ 🏷️ Temple                         │ │
│  │ ⭐ In 2 trips                     │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ "Visit before 10am to avoid       │ │ <- Quoted tips
│  │  the crowds" - reddit             │ │
│  │ "The photo spot is on the left    │ │
│  │  side of the entrance"            │ │
│  │ "Don't miss the five-story        │ │
│  │  pagoda"                           │ │ <- Max 3 tips
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ reddit.com/r/JapanTravel          │ │
│  │ Saved 2 days ago                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍜 Ichiran Ramen             [⚙️] │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ [Photo: Ramen bowl close-up]      │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ 📍 Shibuya, Tokyo                 │ │
│  │ 🏷️ Restaurant                     │ │
│  │ Not in any trip                   │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ "Go before 11am for no wait"      │ │
│  │ "Order the tonkotsu ramen"        │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ nomadlist.com/tokyo               │ │
│  │ Saved 5 hours ago                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Gear Menu (in library):**
```
┌─────────────────────┐
│ ➕ Add to Trip      │
│ ✏️ Edit             │
│ 🗑️ Delete          │
└─────────────────────┘
```

**Click "Add to Trip":**
```
Modal:
┌─────────────────────────────┐
│  Add to Trip                │
├─────────────────────────────┤
│  Which trip?                │
│  ○ Tokyo 2025               │
│  ○ Japan Week               │
│  ○ + Create new trip        │
│                             │
│  Assign to day? (optional)  │
│  [ Select day ▼ ]           │
│  □ Leave unscheduled        │
│                             │
│  [Cancel]     [Add]         │
└─────────────────────────────┘
```

---

## Right-Click Context Menu

### Standard Case (Has Default Trip)

```
Browser page with highlighted text:

Right-click:
├─ Copy
├─ Search Google for "..."
├─────────────────────────────
│  Travel Companion           │
├─────────────────────────────
├─ ⭐ Save to Tokyo 2025       │ <- Default trip (pool + link)
└─ 🇯🇵 Save to Japan Library  │ <- Default pool only
```

### No Default Trip Set

```
Right-click:
├─ Copy
├─ Search Google for "..."
├─────────────────────────────
│  Travel Companion           │
├─────────────────────────────
└─ 🇯🇵 Save to Japan Library  │ <- Only option
```

**Super simple! Only 1-2 options max.**

---

## Location Cards (Pokemon Style)

### Card Layout Specification

```
┌───────────────────────────────────┐
│ [ICON] Location Name         [⚙️] │ <- Header (18px bold)
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ <- Divider (1px)
│                                   │
│ [Photo - 280x120px]               │ <- Image (2.33:1 ratio)
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                   │
│ 📍 Neighborhood, City             │ <- Location (14px)
│ 🏷️ Category                       │ <- Category (14px)
│ ⭐ Status badge                   │ <- In X trips / Not in trips
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                   │
│ "Quote from source text"          │ <- Tip 1 (14px italic)
│ "Second quote if available"       │ <- Tip 2
│ "Third quote if available"        │ <- Tip 3 (max 3!)
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ source.com · X time ago           │ <- Footer (12px gray)
└───────────────────────────────────┘
```

**In Trip View (with schedule):**
```
┌───────────────────────────────────┐
│ 🍷 Senso-ji Temple           [⚙️] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Photo]                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 📍 Asakusa · 🏷️ Temple           │
│ 🕐 10:00 AM · ⏱️ 2 hours         │ <- NEW: Time + duration
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ "Visit before 10am to avoid       │
│  crowds" - reddit                 │
│ "Beautiful photo spot by the      │
│  pagoda"                           │
│ "Entry is free"                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ reddit.com · 2 days ago           │
└───────────────────────────────────┘
```

**Design Details:**
- Card width: 100% (with 16px padding)
- Card spacing: 12px between cards
- Border: 1px solid #e5e7eb
- Border radius: 8px
- Shadow: subtle (0 1px 3px rgba(0,0,0,0.1))
- Padding: 16px
- Font: Same as Phase 0.1 (system font)

**No color coding** - Keep consistent gray/blue theme

---

## Toast Notifications (Simple & Clean)

### Saved to Trip
```
┌──────────────────────────┐
│  ✓ Tokyo 2025            │
└──────────────────────────┘
```

### Saved to Library
```
┌──────────────────────────┐
│  ✓ Japan Library         │
└──────────────────────────┘
```

### Error
```
┌──────────────────────────┐
│  ❌ Failed to save       │
│  Check connection        │
└──────────────────────────┘
```

**That's it! No extra details.**

---

## Settings Panel

```
┌─────────────────────────────────────────┐
│  ← Settings                             │
├─────────────────────────────────────────┤
│                                         │
│  Default Country                        │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan ▼                       │ │
│  └───────────────────────────────────┘ │
│  Used when country can't be detected    │
│                                         │
│  Default Trip                           │
│  ┌───────────────────────────────────┐ │
│  │ Tokyo 2025 ▼                      │ │
│  │ □ None (save to library only)     │ │ <- Can unset
│  └───────────────────────────────────┘ │
│  Quick-save destinations here           │
│                                         │
│  Popup Behavior                         │
│  ● Always open to My Trips              │ <- Default
│  ○ Always open to My Locations          │
│  ○ Remember last opened tab             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │        Save Settings              │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Save to Default Trip

```
User highlights text on Reddit
  ↓
Right-click → "⭐ Save to Tokyo 2025"
  ↓
Extension:
  1. Get userId, defaultCountryId, defaultTripId
  2. Extract name from text (simple)
  3. POST /api/locations (creates in Japan pool)
  4. POST /api/trip-locations (links to Tokyo 2025, unscheduled)
  5. Toast: "✓ Tokyo 2025"
  ↓
Backend:
  1. Creates location with processing_status='pending'
  2. Links to trip with day_number=NULL (unscheduled)
  3. Returns success
  ↓
User continues browsing (< 2 seconds total)
```

### Save to Library Only

```
User highlights text during discovery phase
  ↓
Right-click → "🇯🇵 Save to Japan Library"
  ↓
Extension:
  1. POST /api/locations (creates in Japan pool)
  2. NO trip link
  3. Toast: "✓ Japan Library"
  ↓
User continues browsing
  ↓
Later: User organizes library → trips
```

### View Trip

```
User opens extension
  ↓
Default: My Trips tab shown
  ↓
Clicks "Tokyo 2025"
  ↓
Extension:
  GET /api/trips/TRIP_ID/locations
  ↓
Shows locations grouped by:
  - All (12)
  - Day 1 (4)
  - Day 2 (5)
  - Day 3 (3)
  - Unscheduled (0)
  ↓
Shows Day 1 by default with time estimate
```

### Move Location Between Days

```
User in trip detail (Day 1)
  ↓
Clicks gear on location
  ↓
"Move to Day 2"
  ↓
Extension:
  PATCH /api/trip-locations/:id
  { dayNumber: 2 }
  ↓
Location moves to Day 2
  ↓
Time estimates recalculate
```

---

## Component Specifications

### New Components Needed

```
components/
├── Tabs.tsx                  - Tab navigation
├── CountryCard.tsx           - Japan (18 locations)
├── LocationCard.tsx          - Pokemon-style (enhanced)
├── TripCard.tsx              - Trip list item (enhanced)
├── DayFilter.tsx             - Day 1, 2, 3 tab filters
├── TimeEstimate.tsx          - "6h 30m · 😊 Comfortable"
├── GearMenu.tsx              - Dropdown action menu
├── Settings.tsx              - Settings panel
└── AddToTripModal.tsx        - Add location to trip
```

### Updated Components

```
components/
├── EmptyState.tsx            - Update for tabs
└── Button.tsx                - Keep as is
```

---

## State Management

### Extension Storage
```typescript
{
  userId: string,
  
  settings: {
    defaultCountryId: string,      // From settings
    defaultTripId?: string,         // Active trip (optional)
    defaultView: 'trips',           // Default to trips
    rememberLastTab: false
  },
  
  // UI state (ephemeral)
  currentTab: 'trips' | 'locations',
  selectedTrip: string | null,
  selectedCountry: string | null
}
```

### API Cache (for performance)
```typescript
{
  countries: Country[],          // Fetch once on load
  trips: Trip[],                 // Refresh when tab opens
  locations: Location[],         // By country
  lastFetch: number
}
```

---

## Interaction Patterns

### Quick Save (< 2 seconds)
```
Highlight → Right-click → Click option → Toast → Continue
```

### Organize in Extension (< 30 seconds for 10 locations)
```
Open extension → My Locations → Japan → 
  Click location → Gear → Add to Trip → 
  Select trip → Assign to Day 2 → Done
```

### Review Trip (< 1 minute)
```
Open extension → My Trips → Tokyo 2025 →
  Day 1 tab → Review 4 locations →
  See time: 6h 30m comfortable →
  Day 2 tab → See it's packed (10h) →
  Move 1 location to Day 3 →
  Now balanced!
```

---

## Success Criteria

### UX
- ✅ Save workflow: < 2 seconds
- ✅ Tab switch: < 200ms
- ✅ Drill-down: < 300ms per level
- ✅ Clear information hierarchy
- ✅ No overwhelming UI

### Visual
- ✅ Pokemon-card style feels professional
- ✅ Max 3 tips keeps it scannable
- ✅ Quoted tips build trust
- ✅ Consistent spacing and typography
- ✅ No unnecessary colors

### Functionality
- ✅ Can save to trip or library
- ✅ Can organize library → trips
- ✅ Can move between days
- ✅ Time estimates help planning
- ✅ Settings give control

---

## What Changed from Phase 0.1

### Added
- ✅ Two-tab navigation
- ✅ Country grouping
- ✅ Trip organization
- ✅ Day-by-day scheduling
- ✅ Time estimates
- ✅ Pokemon-style cards
- ✅ Gear menus
- ✅ Settings panel
- ✅ Default trip/country

### Removed
- ❌ Complex right-click menus (simplified!)
- ❌ Color coding (keep it simple)
- ❌ Optimization suggestions (focus on core)

### Kept
- ✅ Fast right-click save
- ✅ Clean popup UI
- ✅ Delete functionality
- ✅ Toast notifications

---

## Estimated Implementation Time

### Phase 0.2.1: Core Integration (3-4 hours)
- Tab navigation
- API client (lib/api.ts)
- Update background script
- Basic trip/location list from API
- Simple right-click (2 options)
- Settings panel

### Phase 0.2.2: Enhanced UI (3-4 hours)
- Pokemon-style location cards
- Country drill-down
- Day filters
- Time estimates
- Gear menus

### Phase 0.2.3: Organization (2-3 hours)
- Add to trip from library
- Move between days
- Remove vs delete
- Polish interactions

**Total: 8-11 hours**

---

**End of Phase 0.2 UI Specification**

This document is the source of truth for UI implementation.
All design decisions are locked in and approved.


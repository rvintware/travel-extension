# Trip Export - Format Specification

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Implementation:** `backend/lib/export/format-trip.ts`

This document defines the exact format of exported trip files and provides a reference for making modifications.

---

## Complete Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKYO WINTER 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

December 15 - December 22, 2024 (7 days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


DAY 1 - December 15
────────────────────────────────────────────────────────

▸ Senso-ji Temple
  📍 2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan
  🏷 Temple · ⭐ 4.5

  Tips:
  • Go early morning (7-8am) to avoid crowds and see monks
  • Don't miss the incense burner for good luck
  • Try the street food on Nakamise Shopping Street

  Trip Notes: Visit before lunch, quieter in morning

  Sources:
  → https://reddit.com/r/JapanTravel/comments/abc123
  → https://tokyocheapo.com/temples/sensoji-guide


▸ Ichiran Ramen Shibuya
  📍 1-22-7 Jinnan, Shibuya City, Tokyo 150-0041, Japan
  🏷 Restaurant · Ramen · $$ · ⭐ 4.7
  🕐 5:00 PM (2 hours)

  Tips:
  • Go at 5pm to avoid dinner rush lines
  • Try the house tonkotsu broth with extra garlic
  • Cash only, no credit cards accepted

  Trip Notes: Dinner with Sarah - meet at station

  Sources:
  → https://reddit.com/r/ramen/comments/def456
  → https://pinterest.com/pin/789012345


DAY 2 - December 16
────────────────────────────────────────────────────────

▸ TeamLab Borderless
  📍 1-3-8 Aomi, Koto City, Tokyo 135-0064, Japan
  🏷 Museum · Art · $$$ · ⭐ 4.8
  🕐 10:00 AM (3 hours)

  Tips:
  • Book tickets 2 weeks in advance (sells out fast)
  • Wear comfortable shoes - lots of walking
  • Best photo spots are in the Forest section

  Sources:
  → https://thewanderingwanderlust.com/teamlab-guide


▸ Shinjuku Gyoen National Garden
  📍 11 Naitomachi, Shinjuku City, Tokyo 160-0014, Japan
  🏷 Park · Garden · $ · ⭐ 4.6
  🕐 2:00 PM (1.5 hours)

  Tips:
  • Closes at 4pm in winter - arrive early afternoon
  • Beautiful winter illuminations in December
  • Small entry fee but worth it

  Notes: Good spot for photos

  Sources:
  → https://reddit.com/r/Tokyo/comments/ghi789


DAY 3 - December 17
────────────────────────────────────────────────────────

(No locations scheduled)


UNSCHEDULED
────────────────────────────────────────────────────────

▸ Tsukiji Outer Market
  📍 5-2-1 Tsukiji, Chuo City, Tokyo 104-0045, Japan
  🏷 Market · Food · $$ · ⭐ 4.4

  Tips:
  • Best breakfast spot - arrive by 8am
  • Try the fresh sushi and grilled seafood
  • Bring cash - most vendors don't take cards

  Sources:
  → https://instagram.com/p/xyz789
  → https://youtube.com/watch?v=abc123


▸ Akihabara Electric Town
  📍 Akihabara, Taito City, Tokyo, Japan
  🏷 District · Shopping · ⭐ 4.5

  Tips:
  • Yodobashi Camera has best electronics deals
  • Explore the retro game shops on backstreets
  • Check out the maid cafes for unique experience

  Sources:
  → https://japantravel.com/akihabara-guide


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIP SUMMARY

Total Locations: 7
Scheduled: 5 locations
Unscheduled: 2 locations

Exported: November 5, 2024 at 3:45 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Section-by-Section Breakdown

### 1. Header Section

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKYO WINTER 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

December 15 - December 22, 2024 (7 days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Data Sources:**
- Line 2: `trips.name` (transformed: uppercase)
- Line 4: `trips.start_date` + `trips.end_date` (formatted: "Month DD, YYYY")
- Line 4: `trips.duration_days` (formatted: "(X days)")
- Dividers: Unicode character `━` (U+2501) repeated 60 times

**Code Location:** `backend/lib/export/format-trip.ts:formatHeader()`

**If field is null:**
- No dates: Shows "Dates not set"
- No duration: Omits "(X days)" part

---

### 2. Day Section

```
DAY 1 - December 15
────────────────────────────────────────────────────────
```

**Data Sources:**
- Day number: `trip_locations.day_number`
- Date: Calculated from `trips.start_date + (day_number - 1)`

**Code Location:** `backend/lib/export/format-trip.ts:formatDayHeader()`

**Logic:**
- Days sorted ascending (1, 2, 3, ...)
- Date calculated: start_date + (day_number - 1) days
- If no start_date: Shows "DAY X" without date
- Divider: Unicode `─` (U+2500) repeated 60 times

---

### 3. Location Block

```
▸ Ichiran Ramen Shibuya
  📍 1-22-7 Jinnan, Shibuya City, Tokyo
  🏷 Restaurant · Ramen · $$ · ⭐ 4.7
  🕐 5:00 PM (2 hours)

  Tips:
  • Go at 5pm to avoid crowds
  • Try the tonkotsu broth

  Trip Notes: Dinner with Sarah

  Notes: Great atmosphere

  Sources:
  → https://reddit.com/...
```

**Data Sources (line by line):**

| Line | Field | Table | Transform | Required |
|------|-------|-------|-----------|----------|
| 1 | `name` | locations | prefix: "▸ " | Yes |
| 2 | `address` | locations | prefix: "  📍 " | No |
| 3 | `category`, `subcategory`, `price_level`, `user_rating` | locations | formatCategory() | No |
| 4 | `suggested_time`, `estimated_duration_minutes` | trip_locations | formatTime() + formatDuration() | No |
| 6+ | `tips[].text` | locations | bullet: "  • " | No |
| N | `notes` | trip_locations | "  Trip Notes: " | No |
| N | `user_notes` | locations | "  Notes: " | No |
| N | `sources[]` or `source_url` | locations | arrow: "  → " | Yes (always show) |

**Code Location:** `backend/lib/export/format-trip.ts:formatLocation()`

**Subsection Rules:**
1. **Name** - Always shown (required)
2. **Address** - Only if not null
3. **Category line** - Only if category exists, combines all metadata
4. **Time** - Only if suggested_time set
5. **Blank line** - After metadata section
6. **Tips** - Only if tips array has items, shows section header + bullets
7. **Trip Notes** - Only if trip_locations.notes is set
8. **User Notes** - Only if locations.user_notes is set
9. **Sources** - Always shown, uses sources array or falls back to source_url

**Spacing:**
- 2 blank lines between locations
- 1 blank line after subsections (Tips, Notes)

---

### 4. Unscheduled Section

```
UNSCHEDULED
────────────────────────────────────────────────────────

▸ Location Name
  [same format as scheduled, but no time/day info]
```

**Data Sources:**
- All locations where `trip_locations.day_number` is NULL
- Same location block format as day sections
- No time/duration shown (trip-specific scheduling)

**Code Location:** Main export function checks for `locationsByDay.unscheduled`

---

### 5. Footer Section

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIP SUMMARY

Total Locations: 7
Scheduled: 5 locations
Unscheduled: 2 locations

Exported: November 5, 2024 at 3:45 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Data Sources:**
- Total: Count of `trip_locations` records
- Scheduled: Count where `day_number IS NOT NULL`
- Unscheduled: Count where `day_number IS NULL`
- Timestamp: Current date/time when export generated

**Code Location:** Main `formatTripExport()` function, summary section

---

## Data Source Mapping Table

| Export Element | Database Field | Table | Function | Optional | Default |
|----------------|----------------|-------|----------|----------|---------|
| **Trip Metadata** |
| Trip Name (header) | `name` | trips | uppercase | No | - |
| Start Date | `start_date` | trips | formatDate() | Yes | "Dates not set" |
| End Date | `end_date` | trips | formatDate() | Yes | "Dates not set" |
| Duration | `duration_days` | trips | "(X days)" | Yes | (omitted) |
| **Scheduling** |
| Day Number | `day_number` | trip_locations | "DAY X" | Yes | "UNSCHEDULED" |
| Display Order | `display_order` | trip_locations | (sorting) | No | 0 |
| Suggested Time | `suggested_time` | trip_locations | formatTime() | Yes | (omitted) |
| Duration | `estimated_duration_minutes` | trip_locations | formatDuration() | Yes | (omitted) |
| Trip Notes | `notes` | trip_locations | "Trip Notes: X" | Yes | (omitted) |
| **Location Details** |
| Location Name | `name` | locations | none | No | - |
| Address | `address` | locations | none | Yes | (omitted) |
| Category | `category` | locations | capitalize | Yes | (omitted) |
| Subcategory | `subcategory` | locations | capitalize | Yes | (omitted) |
| Price Level | `price_level` | locations | formatPriceLevel() | Yes | (omitted) |
| Rating | `user_rating` | locations | round(1) | Yes | (omitted) |
| Tips | `tips[].text` | locations | bullet list | Yes | (omitted) |
| User Notes | `user_notes` | locations | "Notes: X" | Yes | (omitted) |
| Sources | `sources[]` | locations | arrow list | No | falls back to `source_url` |

---

## Formatting Functions Reference

### Date & Time Functions

**`formatDate(dateStr: string): string`**
- **Input:** `"2024-12-15"`
- **Output:** `"December 15, 2024"`
- **Implementation:** JavaScript `toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })`
- **Location:** `format-trip.ts` line ~240

**`formatTime(timeStr: string): string`**
- **Input:** `"17:00"` or `"17:00:00"`
- **Output:** `"5:00 PM"`
- **Implementation:** Converts 24-hour to 12-hour with AM/PM
- **Location:** `format-trip.ts` line ~250

**`formatDuration(minutes: number): string`**
- **Input:** `120`, `90`, `45`
- **Output:** `"(2 hours)"`, `"(1.5 hours)"`, `"(45 min)"`
- **Implementation:** Converts minutes to hours if ≥60
- **Location:** `format-trip.ts` line ~260

**`formatDateRange(start, end, days): string`**
- **Input:** `"2024-12-15"`, `"2024-12-22"`, `7`
- **Output:** `"December 15 - December 22, 2024 (7 days)"`
- **Implementation:** Combines formatDate() for start/end
- **Location:** `format-trip.ts` line ~275

### Display Functions

**`formatPriceLevel(level: number): string`**
- **Input:** `1`, `2`, `3`, `4`
- **Output:** `"$"`, `"$$"`, `"$$$"`, `"$$$$"`
- **Implementation:** Repeats `$` character
- **Location:** `format-trip.ts` line ~290

**`formatCategory(...): string`**
- **Input:** `category="restaurant"`, `subcategory="ramen"`, `priceLevel=2`, `rating=4.7`
- **Output:** `"🏷 Restaurant · Ramen · $$ · ⭐ 4.7"`
- **Implementation:** Capitalizes, joins with " · ", adds emojis
- **Location:** `format-trip.ts` line ~295

### Structure Functions

**`formatHeader(tripName: string): string`**
- **Output:** Trip name in thick box
- **Location:** `format-trip.ts` line ~325

**`formatDayHeader(dayNum, date): string`**
- **Output:** `"DAY 1 - December 15"`
- **Location:** `format-trip.ts` line ~335

**`formatLocation(location, tripData): string`**
- **Output:** Complete location block (see example above)
- **Location:** `format-trip.ts` line ~165

**`makeThickDivider(): string`**
- **Output:** `━` repeated 60 times
- **Location:** `format-trip.ts` line ~345

**`makeThinDivider(): string`**
- **Output:** `─` repeated 60 times
- **Location:** `format-trip.ts` line ~350

### Utility Functions

**`sanitizeFilename(tripName: string): string`**
- **Input:** `"Tokyo & Kyoto!"`
- **Output:** `"tokyo-kyoto-export-2024-11-05.txt"`
- **Implementation:** Lowercase, replace special chars with `-`, append date
- **Location:** `format-trip.ts` line ~370

**`calculateDayDate(startDate, dayNum): string`**
- **Input:** `"2024-12-15"`, `2`
- **Output:** `"December 16"` (start date + 1 day)
- **Location:** `format-trip.ts` line ~155

---

## Modification Guide

### How to Change Date Format

**Current Format:** "December 15, 2024" (long month name)

**To change to short format ("Dec 15, 2024"):**

1. Open `backend/lib/export/format-trip.ts`
2. Find `formatDate()` function (line ~240)
3. Change:
   ```typescript
   // FROM:
   month: 'long'
   
   // TO:
   month: 'short'
   ```

**To change to numeric ("12/15/2024"):**
```typescript
// FROM:
return date.toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
})

// TO:
return date.toLocaleDateString('en-US', {
  year: 'numeric', month: 'numeric', day: 'numeric'
})
```

---

### How to Change Time Format

**Current Format:** "5:00 PM" (12-hour with AM/PM)

**To change to 24-hour format ("17:00"):**

1. Open `backend/lib/export/format-trip.ts`
2. Find `formatTime()` function (line ~250)
3. Replace entire function:
   ```typescript
   function formatTime(timeStr: string): string {
     return timeStr  // Return as-is (already 24-hour)
   }
   ```

---

### How to Add New Field to Location Block

**Example:** Add opening hours after address

**Step 1:** Ensure field exists in database
- Check `artifacts/database_schema.sql`
- If missing, create migration to add `opening_hours` column

**Step 2:** Update API query
- Open `backend/app/api/trips/[id]/export/route.ts`
- Add field to select statement (line ~35):
  ```typescript
  location:locations (
    name,
    address,
    opening_hours,  // NEW
    // ... other fields
  )
  ```

**Step 3:** Update TypeScript interface
- Open `backend/lib/export/format-trip.ts`
- Add to `LocationData` interface:
  ```typescript
  interface LocationData {
    // ... existing fields
    opening_hours: string | null  // NEW
  }
  ```

**Step 4:** Add to formatter
- In `formatLocation()` function (line ~165)
- Add after address section:
  ```typescript
  if (location.opening_hours) {
    lines.push(`  🕒 ${location.opening_hours}`)
  }
  ```

**Step 5:** Update this specification document
- Add opening hours to data mapping table
- Add example to complete output

---

### How to Change Emoji Icons

**Current Icons:**
- 📍 = Address
- 🏷 = Category
- ⭐ = Rating
- 🕐 = Time
- • = Bullet points
- → = Sources

**To change:**

1. Open `backend/lib/export/format-trip.ts`
2. Find the line with the emoji
3. Replace with new emoji

**Examples:**
```typescript
// Address icon - FROM 📍 TO 🗺️
lines.push(`  🗺️ ${location.address}`)

// Category icon - FROM 🏷 TO 🏪
return parts.length > 0 ? `🏪 ${parts.join(' · ')}` : ''

// Tips bullets - FROM • TO ▸
location.tips.forEach(tip => {
  lines.push(`  ▸ ${tip.text}`)
})
```

---

### How to Reorder Location Subsections

**Current Order:**
1. Name
2. Address
3. Category (with price & rating)
4. Time
5. Blank line
6. Tips
7. Trip Notes
8. User Notes
9. Sources

**To change (example: put tips before metadata):**

1. Open `backend/lib/export/format-trip.ts`
2. Find `formatLocation()` function (line ~165)
3. Cut the tips section code block
4. Paste it before the metadata section
5. Adjust blank line spacing

**Code structure:**
```typescript
function formatLocation(location, tripData) {
  const lines = []
  
  // Name - always first
  lines.push(`▸ ${location.name}`)
  
  // [Move tips section here for different order]
  
  // Address
  // Category
  // Time
  // [Original tips location]
  // Notes
  // Sources
  
  return lines.join('\n')
}
```

---

### How to Change Divider Styles

**Current:**
- Thick divider: `━` (60 chars) for header/footer
- Thin divider: `─` (60 chars) for day sections

**To change width:**
```typescript
// FROM:
return '━'.repeat(60)

// TO:
return '━'.repeat(80)  // Wider
```

**To change character:**
```typescript
// FROM:
return '━'.repeat(60)

// TO:
return '═'.repeat(60)  // Double line
return '─'.repeat(60)  // Single line
return '*'.repeat(60)  // Asterisks
```

---

### How to Customize Category Separator

**Current:** Items joined with " · "

**To change separator:**

1. Open `backend/lib/export/format-trip.ts`
2. Find `formatCategory()` (line ~295)
3. Change:
   ```typescript
   // FROM:
   return `🏷 ${parts.join(' · ')}`
   
   // TO:
   return `🏷 ${parts.join(' | ')}`  // Pipe separator
   return `🏷 ${parts.join(', ')}`   // Comma separator
   return `🏷 ${parts.join(' / ')}`  // Slash separator
   ```

---

## Code Organization

### File Structure
```
backend/lib/export/
  └─ format-trip.ts
      ├─ Interfaces (lines 1-50)
      ├─ Main Export Function (lines 55-145)
      ├─ Helper: groupByDay() (lines 150-160)
      ├─ Helper: calculateDayDate() (lines 163-171)
      ├─ Core: formatLocation() (lines 174-235)
      ├─ Formatters: Date/Time (lines 240-285)
      ├─ Formatters: Display (lines 290-320)
      ├─ Formatters: Structure (lines 325-355)
      └─ Utilities (lines 360-385)
```

### Function Dependencies

```
formatTripExport()
  ├─ formatHeader() → makeThickDivider()
  ├─ formatDateRange() → formatDate()
  ├─ groupByDay()
  ├─ formatDayHeader() → calculateDayDate() → formatDate()
  ├─ formatLocation()
  │   ├─ formatCategory() → formatPriceLevel()
  │   ├─ formatTime()
  │   └─ formatDuration()
  └─ sanitizeFilename()
```

---

## Unicode Characters Used

| Character | Code | Purpose |
|-----------|------|---------|
| ━ | U+2501 | Thick horizontal divider |
| ─ | U+2500 | Thin horizontal divider |
| ▸ | U+25B8 | Location bullet |
| • | U+2022 | Tip bullet |
| → | U+2192 | Source arrow |
| 📍 | U+1F4CD | Address icon |
| 🏷️ | U+1F3F7 | Category icon |
| ⭐ | U+2B50 | Rating star |
| 🕐 | U+1F550 | Clock icon |

**Note:** All characters are part of Unicode standard and render in Google Docs, Apple Notes, Notion, and most text editors.

---

## Common Issues & Solutions

### Issue: Emojis don't render

**Solution:** Ensure UTF-8 encoding in blob creation:
```typescript
const blob = new Blob([exportText], { 
  type: 'text/plain;charset=utf-8'  // UTF-8 is critical
})
```

### Issue: Line breaks lost when pasting

**Solution:** Use `\n` for line breaks (already implemented). If issues persist, check target app's paste settings.

### Issue: Dates show as "Invalid Date"

**Cause:** Database has null dates or invalid format

**Solution:** Check for null before formatting:
```typescript
if (!start || !end) return 'Dates not set'
```

### Issue: Very long trip names break filename

**Solution:** Already handled with 50-char limit in `sanitizeFilename()`

---

## Future Enhancements

### Potential Additions
1. **Day headers with weather:** "DAY 1 - December 15 (☀️ Sunny, 15°C)"
2. **Budget estimates:** "Total estimated cost: $250"
3. **Map links:** Include Google Maps link per location
4. **Travel time between locations:** "→ 15 min by train"
5. **Accommodation info:** Separate section for hotels

### Alternative Formats
1. **Markdown export** - For GitHub/developers
2. **CSV export** - For spreadsheets
3. **JSON export** - For programmatic use
4. **PDF export** - For printing

All would use the same data source, just different formatters.

---

## Testing Reference

**Manual test:**
1. Export trip with all field types populated
2. Copy exported text
3. Paste into:
   - Google Docs (check: emojis, line breaks, structure)
   - Apple Notes (check: formatting preserved)
   - Notion (check: paste as plain text)
   - VS Code (check: Unicode characters)

**Expected:** All formatting preserved in all target applications.

---

This specification serves as the single source of truth for the export format. When making changes, update both the code and this document to keep them in sync.


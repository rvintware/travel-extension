# Trip Export - Functional Requirements & Specification

## Feature Overview

Enable users to export a trip as a structured, copy-paste friendly text file with one click. File downloads immediately to user's machine.

## User Story

As a user, I want to export my trip details so that I can:

- Share with travel companions in Google Docs
- Keep a backup in Apple Notes
- Print for offline reference
- Collaborate with friends who don't use the extension

## Core Requirements

### REQ-1: Export Button

- Location: Trip detail view header, next to "View Map" button
- Label: "Export" with 📤 icon
- Behavior: Single click triggers immediate file download
- No modal, no dropdown, no format selection

### REQ-2: File Output

- Format: Plain text (.txt file)
- Filename: `{trip-name}-export-{date}.txt`
- Example: `tokyo-winter-2024-export-2024-11-03.txt`
- Encoding: UTF-8 (supports emojis)

### REQ-3: Data Source

All data must come directly from database:

- Trip metadata (name, dates, duration)
- Locations (name, address, category, rating, price)
- Trip-specific scheduling (day, time, duration)
- Tips with source attribution
- Trip-specific notes
- Multiple sources per location

### REQ-4: Export Structure

**Section 1: Trip Header**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIP NAME (UPPERCASE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Month DD - Month DD, YYYY (X days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Section 2: Day-by-Day Schedule**

```
DAY 1 - Month DD
────────────────────────────────────────────────────────

▸ Location Name
  📍 Full Address
  🏷 Category · Subcategory · $$ · ⭐ Rating
  🕐 Time (Duration)

  Tips:
  • Tip 1 text
  • Tip 2 text
  • Tip 3 text

  Trip Notes: User's trip-specific notes

  Sources:
  → https://source1.com
  → https://source2.com


▸ Next Location
  [same format]
```

**Section 3: Unscheduled Locations**

```
UNSCHEDULED
────────────────────────────────────────────────────────

▸ Location Name
  [same format as scheduled, but no time/day]
```

**Section 4: Trip Summary**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIP SUMMARY

Total Locations: X
Scheduled: X locations
Unscheduled: X locations

Exported: Month DD, YYYY at HH:MM AM/PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Data Field Specifications

### Trip Fields (from `trips` table)

- `name` → Header (uppercase)
- `start_date` → Formatted "Month DD, YYYY"
- `end_date` → Formatted "Month DD, YYYY"
- `duration_days` → "(X days)" if available
- ~~`description`~~ → NOT INCLUDED

### Location Fields (from `locations` table)

- `name` → Location heading
- `address` → 📍 Full address
- `category` → 🏷 Category
- `subcategory` → Append after category with " · "
- `price_level` → $, $$, $$$, $$$$ (if available)
- `user_rating` → ⭐ Rating (if available)
- `tips` → Bullet list (max 3)
- `sources` → List of URLs with → prefix
- `user_notes` → Show as "Notes: {text}" (if available)

### Trip-Specific Fields (from `trip_locations` table)

- `day_number` → Groups locations into "DAY X" sections
- `day_number = NULL` → "UNSCHEDULED" section
- `display_order` → Sorting within day
- `suggested_time` → "🕐 HH:MM AM/PM"
- `estimated_duration_minutes` → Duration in parentheses
- `notes` → "Trip Notes: {text}" (trip-specific notes)

## Field Formatting Rules

### Date Format

- Input: `"2024-12-15"`
- Output: `"December 15, 2024"`
- No date: `"Dates not set"`

### Time Format

- Input: `"17:00"` or `"17:00:00"`
- Output: `"5:00 PM"`
- 24-hour to 12-hour conversion

### Duration Format

- 120 minutes → "(2 hours)"
- 90 minutes → "(1.5 hours)"
- 45 minutes → "(45 min)"
- NULL → (don't show)

### Price Level

- 1 → "$", 2 → "$$", 3 → "$$$", 4 → "$$$$"
- NULL → (don't show)

### Rating

- Round to 1 decimal place
- Format: "⭐ 4.7"
- NULL → (don't show)

### Category Display

- Both available: "Restaurant · Ramen"
- Only category: "Temple"
- Both NULL: (don't show category line)

### Tips Format

- Extract `text` field from TipObject
- Plain bullets: "• {text}"
- No source icons in export (keep it clean)
- Skip entire Tips section if no tips

### Sources Format

- Use `sources` array (from Phase 1)
- Fallback to `source_url` if sources empty/null
- Format: "→ {url}" one per line
- Skip if no sources

### Trip Notes vs User Notes

- `trip_locations.notes` → "Trip Notes: {text}"
- `locations.user_notes` → "Notes: {text}"
- Both can appear if both exist
- Skip if empty/null

## Filename Sanitization Rules

**Transform:**

- Lowercase: "Tokyo Winter" → "tokyo winter"
- Replace spaces with hyphens: "tokyo winter" → "tokyo-winter"
- Remove special chars: "Tokyo & Kyoto!" → "tokyo-kyoto"
- Truncate to 50 chars max
- Append date: "tokyo-winter-2024-export-2024-11-03.txt"

**Regex:**

```
trip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
```

## Edge Cases

### EC-1: Empty Trip

- Export header and dates
- Message: "No locations added to this trip yet"
- Summary shows 0 locations

### EC-2: No Scheduled Locations

- Skip all "DAY X" sections
- Show only "UNSCHEDULED" section

### EC-3: No Dates Set

- Show: "Dates not set" instead of date range
- Duration: (skip if null)

### EC-4: Location Missing Fields

- No address → Skip 📍 line
- No category → Skip 🏷 line
- No rating → Skip from 🏷 line
- No tips → Skip Tips section
- No sources → Skip Sources section

### EC-5: Very Long Trip (50+ locations)

- No pagination, export all
- File may be large but text is lightweight

### EC-6: Special Characters in Location Names

- Keep as-is (don't sanitize content, only filename)
- Unicode support enabled

## Copy-Paste Compatibility

Must work in:

- ✓ Google Docs (preserves line breaks, emojis)
- ✓ Apple Notes (preserves formatting)
- ✓ Notion (supports plain text paste)
- ✓ Word (plain text mode)
- ✓ Slack/Discord (code block format)

## User Feedback

**On Click:**

- Immediate download starts
- No loading state needed (should be <1s)

**After Download:**

- Toast notification: "✓ Trip exported"
- Toast duration: 2 seconds

**On Error:**

- Toast notification: "❌ Export failed"
- Log error to console
- Don't block UI

## Success Metrics

**Functional:**

- Export completes in <1 second
- File downloads with correct name
- All database data included
- Zero data loss or corruption

**User Experience:**

- One-click operation
- No configuration needed
- Works on first try
- Copy-paste preserves structure

**Quality:**

- Clean, professional formatting
- Scannable hierarchy
- High information density
- Minimal but functional emojis

## Scope

**In Scope:**

- Single trip export
- Full detail text format only
- Download to user's machine
- All data from database

**Out of Scope (Future):**

- Multiple format options (Markdown, CSV, etc.)
- Multiple trip export
- Print layout
- PDF generation
- Email/share functionality
- Custom field selection
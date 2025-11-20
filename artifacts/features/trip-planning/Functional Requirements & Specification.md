# Trip Planning - Functional Requirements & Specification

**Feature:** Trip Planning with Dates, Duration, and Day Assignment  
**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [UI/UX Specifications](#uiux-specifications)
5. [Data Model](#data-model)
6. [API Requirements](#api-requirements)
7. [Edge Cases & Validation](#edge-cases--validation)
8. [Success Criteria](#success-criteria)

---

## Overview

### Problem Statement
Users need to plan their trips with specific dates and organize their saved locations into a day-by-day itinerary. Currently, users can save locations to trips but cannot:
- Set trip start and end dates
- Specify trip duration
- Assign locations to specific days
- Easily add locations to trips from the library view
- Remove locations from trips with a simple action

### Solution
Implement a comprehensive trip planning system that allows users to:
1. Set start date, end date, and duration when creating or editing trips
2. Automatically calculate related fields (e.g., duration from dates, end date from start + duration)
3. Assign locations to specific days within a trip
4. Quickly add locations to trips from the library view
5. Delete locations with an inline confirmation UI
6. Drag and drop to reorder locations within a day

### Goals
- **Usability:** Make trip planning intuitive and fast
- **Flexibility:** Support multiple planning workflows (dates-first, duration-first, or mixed)
- **Organization:** Enable day-by-day itinerary planning
- **Efficiency:** Reduce friction in adding/removing locations

---

## User Stories

### Epic 1: Trip Dates & Duration

**US-1.1: Set Dates When Creating Trip**
> As a user, I want to set start and end dates when creating a trip, so I can plan trips for specific dates.

**US-1.2: Set Duration When Creating Trip**
> As a user, I want to set the trip duration in days when creating a trip, so I can plan without specific dates.

**US-1.3: Edit Trip Details**
> As a user, I want to edit trip dates and duration after creation, so I can adjust my plans as they change.

**US-1.4: Auto-Calculate Related Fields**
> As a user, I want the system to automatically calculate duration from dates (or vice versa), so I don't have to do math manually.

### Epic 2: Day Assignment

**US-2.1: Assign Location to Day**
> As a user, I want to assign a saved location to a specific day in my trip, so I can build a day-by-day itinerary.

**US-2.2: View Locations by Day**
> As a user, I want to filter locations by day in the trip detail view, so I can see what's planned for each day.

**US-2.3: Reorder Locations Within Day**
> As a user, I want to drag and drop locations to reorder them within a day, so I can optimize my daily itinerary.

**US-2.4: Unschedule Location**
> As a user, I want to move a location back to unscheduled, so I can keep it in the trip but without a specific day assignment.

### Epic 3: Quick Add to Trip

**US-3.1: Add to Trip from Library**
> As a user, I want a prominent "Add to Trip" button on location cards in the library view, so I can quickly add locations to trips.

**US-3.2: Select Trip in Modal**
> As a user, I want to select which trip to add a location to from a scrollable list, so I can add to the right trip.

**US-3.3: Success Feedback**
> As a user, I want immediate feedback when adding a location to a trip, so I know the action succeeded.

### Epic 4: Delete Locations

**US-4.1: Quick Delete with Inline Confirmation**
> As a user, I want to click a bin icon that transforms into Yes/No options, so I can delete locations without modal dialogs.

**US-4.2: Delete from Trip vs Library**
> As a user, I want separate delete actions for removing from a trip vs deleting permanently, so I don't accidentally lose data.

---

## Functional Requirements

### FR-1: Trip Creation with Dates & Duration

#### FR-1.1: Create Trip Form Fields
The Create Trip view SHALL include the following fields (in order):
1. **Trip Name** (required) - Text input
2. **Start Date** (optional) - Date picker
3. **End Date** (optional) - Date picker
4. **Duration Days** (optional) - Number input
5. **Set as Active** (optional, default: true) - Checkbox
6. **Countries** (optional) - Multi-select checkboxes

#### FR-1.2: Date-Duration Relationships

**Scenario 1: User sets Start Date + End Date**
- WHEN user selects both start and end dates
- THEN system SHALL calculate `duration_days = (end_date - start_date) + 1`
- AND system SHALL lock the duration field (read-only)
- AND system SHALL display the calculated duration

**Scenario 2: User sets Start Date + Duration**
- WHEN user selects start date and enters duration
- THEN system SHALL calculate `end_date = start_date + (duration_days - 1)`
- AND system SHALL display the calculated end date

**Scenario 3: User sets End Date + Duration**
- WHEN user selects end date and enters duration
- THEN system SHALL calculate `start_date = end_date - (duration_days - 1)`
- AND system SHALL display the calculated start date

**Scenario 4: User edits locked Duration**
- WHEN user has start and end dates set (duration is locked)
- AND user edits the duration field
- THEN system SHALL unlock the duration field
- AND system SHALL recalculate `end_date = start_date + (duration_days - 1)`
- AND system SHALL keep start date fixed

**Scenario 5: Validation**
- WHEN user tries to save
- THEN system SHALL validate:
  - Start date must be before or equal to end date
  - Duration must be positive integer >= 1
  - If dates are provided, duration must match date range

#### FR-1.3: Date Input UI
- SHALL use a mini calendar picker for date selection
- SHALL display dates in DD/MM/YYYY format
- SHALL allow past dates (for completed trips)
- SHALL show current date as default when picker opens

#### FR-1.4: Default Duration
- WHEN user creates a trip without setting start_date, end_date, or duration_days
- THEN system SHALL set `duration_days = 5` as default
- WHEN user manually sets duration to 0 or clears the field
- THEN system SHALL set `duration_days = null`
- AND system SHALL disable day assignment features for that trip

### FR-2: Edit Trip Settings

#### FR-2.1: Settings Modal
- SHALL provide a pencil (✏️) icon near the trip name in trip detail view
- Icon SHALL indicate editing trip details
- SHALL open a modal when pencil icon is clicked
- SHALL allow editing:
  - Trip name
  - Description
  - Start date
  - End date
  - Duration days
  - Active status
  - Countries (add/remove)

#### FR-2.2: Settings Modal UI
- SHALL have explicit "Save" and "Cancel" buttons
- SHALL follow same date-duration relationship rules as create trip
- SHALL show validation errors inline
- SHALL close modal on successful save
- SHALL revert changes on cancel

#### FR-2.3: Reducing Trip Days Warning
- WHEN user reduces trip duration (e.g., from 7 days to 5 days)
- AND locations are assigned to days that will no longer exist (e.g., Day 6, Day 7)
- THEN system SHALL show a warning dialog BEFORE saving:
  - "Reducing days will unschedule X locations on days 6-7. Continue?"
  - [Cancel] [Continue] buttons
- WHEN user clicks Continue
- THEN system SHALL unschedule affected locations (set day_number to null)
- AND system SHALL save the trip with new duration

### FR-3: Day Assignment

#### FR-3.1: Assign Day from Kebab Menu
- SHALL show a kebab menu (⋮) on each location card in trip detail view
- SHALL show "Assign to Day" option in kebab menu
- SHALL show submenu with day options (Day 1, Day 2, ..., Day N)
- SHALL show "Unassigned" option to unschedule
- SHALL update location's `day_number` field when day is selected

#### FR-3.2: Day Assignment Availability
- WHEN trip has `duration_days` set (not null, not 0)
- THEN system SHALL show day assignment options (Day 1 through Day N)
- WHEN trip has `duration_days = null` or `duration_days = 0`
- THEN system SHALL disable day assignment features
- AND system SHALL show message: "Set trip duration to assign days"

#### FR-3.3: Day Filter in Trip Detail
- SHALL show horizontal scrollable day filter at top of trip detail view
- SHALL show tabs for: All, Day 1, Day 2, ..., Day N, Unscheduled
- SHALL show location count for each day (e.g., "Day 1 • 4")
- SHALL filter locations when day tab is clicked
- SHALL highlight active tab

#### FR-3.4: Day Badge on Location Cards
- WHEN viewing "All" tab in trip detail view
- THEN each location card SHALL show a day badge if assigned (e.g., "Day 3")
- Badge SHALL appear in top-right area of card
- Badge SHALL use primary color background with white text
- Badge SHALL be small pill shape (px-2 py-1, rounded-full, text-xs)

#### FR-3.5: Locations Sorted by Day
- WHEN "All" tab is selected
- THEN locations SHALL be sorted by:
  1. Day number (ascending: Day 1, Day 2, ..., Day N)
  2. Display order within each day
  3. Unscheduled locations at the end

#### FR-3.6: Show All Days in Filter
- Day filter SHALL show ALL days from 1 to `duration_days`
- SHALL show count of 0 for days with no locations
- Allows user to see structure of entire trip at a glance

#### FR-3.7: Drag and Drop Reordering
- WHEN viewing a specific day (not "All" tab)
- THEN user SHALL be able to drag location cards to reorder them
- SHALL update `display_order` field for affected locations
- SHALL provide visual feedback during drag (shadow, opacity change)
- SHALL save new order to database immediately
- SHALL use optimistic UI updates for smooth experience

### FR-4: Quick Add to Trip

#### FR-4.1: Add to Trip Button
- SHALL show prominent "Add to Trip" button on each location card in library view (country detail)
- SHALL replace gear menu in library view
- Button SHALL be styled as primary action (bg-primary, text-white)
- Button SHALL be positioned in card footer area
- Button SHALL show text "Add to Trip" (not just icon)

#### FR-4.2: Add to Trip Modal
- SHALL open modal when "Add to Trip" button is clicked
- SHALL show scrollable list of user's trips
- SHALL show up to 3 most recently edited trips before scrolling is needed
- SHALL display only trip name (no additional metadata)
- SHALL be sized as "tiny little pop-up" (max-w-xs, compact padding)

#### FR-4.3: Trip Selection
- SHALL show each trip as a clickable row
- SHALL highlight row on hover (bg-gray-100)
- SHALL add location to trip when row is clicked
- SHALL NOT show day assignment option in this modal
- SHALL default location to unscheduled (day_number = null)

#### FR-4.4: Success & Error Feedback
- WHEN location is successfully added to trip
- THEN modal SHALL close automatically
- AND system SHALL show green toast: "Added to [Trip Name]"
- WHEN location is already in the selected trip
- THEN modal SHALL close automatically
- AND system SHALL show orange toast: "Already in that trip"

#### FR-4.5: Library View Gear Menu Removal
- SHALL remove gear menu (⚙️) from location cards in library view
- SHALL keep "Delete" button (bin icon) in library view
- Day assignment and other trip-specific actions are only available in trip detail view

### FR-5: Delete Locations

#### FR-5.1: Bin Icon Placement
- SHALL show bin icon (🗑️) in bottom-right corner of location card
- SHALL be visible in both:
  - Library view (country detail) - permanently deletes location
  - Trip view (trip detail) - removes from trip only

#### FR-5.2: Inline Delete Confirmation
- WHEN user hovers over bin icon
- THEN icon SHALL turn red
- WHEN user clicks bin icon
- THEN bin icon SHALL transform into Yes/No pill
- Pill SHALL show ✅ and ❌ emojis
- Pill SHALL be horizontal (both options visible simultaneously)
- Pill SHALL take up same space as original bin icon area
- Pill SHALL have snappy animation (200ms ease)

#### FR-5.3: Yes/No Pill Behavior
- ✅ emoji SHALL show green background on hover (bg-success)
- ❌ emoji SHALL show red background on hover (bg-error)
- WHEN user clicks ✅
- THEN system SHALL delete the location (or remove from trip)
- AND pill SHALL disappear
- WHEN user clicks ❌
- THEN pill SHALL transform back to bin icon
- WHEN user clicks outside the pill
- THEN pill SHALL transform back to bin icon

#### FR-5.4: Delete Actions
- **Library View (Country Detail):**
  - SHALL permanently delete location from database
  - SHALL remove from all trips
  - SHALL show optimistic UI update (immediate removal from list)
  - SHALL invalidate caches

- **Trip View (Trip Detail):**
  - SHALL remove location from trip only
  - SHALL keep location in library
  - SHALL show optimistic UI update
  - SHALL invalidate trip caches

#### FR-5.5: Replace ConfirmDialog
- SHALL remove existing `ConfirmDialog` modal for delete actions
- SHALL use inline Yes/No pill approach exclusively
- More intuitive and faster than modal dialogs

### FR-6: Kebab Menu for Trip Context

#### FR-6.1: Kebab Menu Icon
- SHALL show kebab menu (⋮) icon on location cards in trip detail view
- SHALL replace gear icon (⚙️) in trip context
- SHALL be positioned in top-right of card header

#### FR-6.2: Kebab Menu Options
- SHALL show these options:
  1. **Assign to Day** - submenu with Day 1, Day 2, ..., Day N, Unassigned
  2. **Edit Notes** - opens notes editor for trip-specific notes

#### FR-6.3: Removed Options
- SHALL NOT show "Set Time" (deferred to future release)
- SHALL NOT show "Remove from Trip" (replaced by bin icon)
- SHALL NOT show "Priority" (not needed for MVP)

#### FR-6.4: Pencil Icon for Trip Editing
- SHALL use pencil icon (✏️) in trip detail header
- Pencil icon SHALL open trip settings modal
- Distinguishes trip-level editing from app-level settings (gear icon)
- Settings icon (⚙️) reserved exclusively for app settings

---

## UI/UX Specifications

### 1. Create Trip View - With Date Fields

```
┌─────────────────────────────────────┐
│ ← Back                        🔄    │ ← p-4, border-b
│ Create Trip                         │    text-lg, semibold
├─────────────────────────────────────┤
│ (p-4, space-y-6) ← 24px sections    │
│                                     │
│ Trip Name *                         │ ← text-sm, semibold
│ ┌─────────────────────────────────┐ │
│ │ 🌏 Southeast Asia 2025_________ │ │ ← px-3 py-2
│ └─────────────────────────────────┘ │    border-gray-300
│ Emoji allowed! (e.g., 🗾 🌏 ✈️)     │ ← text-xs, gray-500
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Start Date    End Date          │ │
│ │ ┌──────────┐  ┌──────────┐     │ │
│ │ │15/03/2025│  │22/03/2025│     │ │ ← Date pickers
│ │ └──────────┘  └──────────┘     │ │    Opens calendar
│ │ [📅 Select]   [📅 Select]      │ │    DD/MM/YYYY
│ └─────────────────────────────────┘ │
│                                     │
│ Duration                            │
│ ┌────┐ days                        │
│ │ 7🔒│ ← Calculated & locked      │ ← w-20, px-3 py-2
│ └────┘    (from dates above)       │    bg-gray-100
│ Click to unlock and adjust          │ ← text-xs, gray-500
│                                     │
│ ☑ Set as active trip                │ ← Checkbox
│   Quick-saves will go to this trip  │    text-xs, gray-500
│                                     │
│ Countries (optional)                │
│ Select countries to include         │
│ ┌─────────────────────────────────┐ │
│ │ ☐ 🇯🇵 Japan                     │ │ ← max-h-40, scroll
│ │ ☑ 🇹🇭 Thailand                  │ │    p-2, space-y-1
│ │ ☐ 🇸🇬 Singapore                 │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [  Cancel  ]  [ Create Trip ]      │ ← p-4, border-t
└─────────────────────────────────────┘    flex gap-3

INTERACTIONS:
─────────────────────────────────────────
Set Start + End Date:
  → Duration auto-calculated: 7 days
  → Duration field locked (read-only)
  → Lock icon shown: 🔒

Set Start Date + Duration:
  → End date auto-calculated: 22/03/2025
  → End date field updated automatically

Click Locked Duration:
  → Field unlocked
  → Lock icon removed
  → User can edit duration
  → End date recalculated when changed

Validation:
  → Start date ≤ End date
  → Duration ≥ 1
  → Trip name required (not empty)
```

### 2. Create Trip View - Duration First Workflow

```
┌─────────────────────────────────────┐
│ ← Back                        🔄    │
│ Create Trip                         │
├─────────────────────────────────────┤
│                                     │
│ Trip Name *                         │
│ ┌─────────────────────────────────┐ │
│ │ Weekend Getaway________________ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Start Date    End Date          │ │
│ │ ┌──────────┐  ┌──────────┐     │ │
│ │ │ (empty)  │  │ (empty)  │     │ │
│ │ └──────────┘  └──────────┘     │ │
│ │ [📅 Select]   [📅 Select]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Duration                            │
│ ┌────┐ days                        │
│ │ 5  │ ← Default value (editable) │
│ └────┘                              │
│ Set dates or duration to plan trip  │ ← Help text
│                                     │
│ ☑ Set as active trip                │
│   Quick-saves will go to this trip  │
│                                     │
│ Countries (optional)                │
│ (Empty list - no locations saved)   │
│ ┌─────────────────────────────────┐ │
│ │         📍                      │ │
│ │ No locations saved yet          │ │
│ │ Save some locations first,      │ │
│ │ then they'll appear here!       │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [  Cancel  ]  [ Create Trip ]      │
└─────────────────────────────────────┘

WORKFLOW:
─────────────────────────────────────────
User sets Duration = 3
  → Start/End dates remain empty
  → Trip created with duration_days = 3
  → No specific dates set
  → Day assignment available (Days 1-3)

User sets Start Date = 15/03/2025
User sets Duration = 3
  → End date auto-calculated: 17/03/2025
  → All fields populated
  → Trip has specific dates + duration
```

### 3. Trip Detail Header - With Edit Button

```
┌─────────────────────────────────────┐
│ ← Back                   ✏️    🔄   │ ← Flex justify-between
│                                     │    Pencil icon for editing
│  ┌───────────────────────────────┐ │
│  │ Southeast Asia 2025  Nov 1-5  │ │ ← Line 1: justify-between
│  │ (text-lg semibold) (text-sm)  │ │
│  │                               │ │
│  │ 3 Countries                   │ │ ← Line 2: left-aligned
│  │                               │ │
│  │ 18 locations        📤 Export │ │ ← Line 3: justify-between
│  └───────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
│                                     │
├─────────────────────────────────────┤
│ (Day Filters...)                    │
└─────────────────────────────────────┘

EDIT BUTTON (PENCIL ICON):
─────────────────────────────────────────
Position: Near trip name, in header
Icon: ✏️ (pencil emoji)
Size: text-xl (20px emoji)
Color: gray-600 → primary on hover
Tooltip: "Edit trip"
Action: Opens trip settings modal
Rationale: Pencil icon indicates editing, distinguishes from app settings (⚙️)
```

### 4. Trip Settings Modal

```
[MODAL OVERLAY - bg-black/50, z-50]

     ┌───────────────────────────┐
     │ Edit Trip Details         │ ← text-lg, semibold
     │ (p-6, max-w-md)           │
     │                           │
     │ Trip Name *               │
     │ ┌───────────────────────┐ │
     │ │ Southeast Asia 2025__ │ │
     │ └───────────────────────┘ │
     │                           │
     │ Description (optional)    │
     │ ┌───────────────────────┐ │
     │ │ Multi-line textarea__ │ │
     │ │ _____________________│ │
     │ └───────────────────────┘ │
     │                           │
     │ ┌─────────────────────┐   │
     │ │ Start    End        │   │
     │ │ 15/03    22/03      │   │
     │ │ [📅]     [📅]       │   │
     │ └─────────────────────┘   │
     │                           │
     │ Duration                  │
     │ ┌────┐ days              │
     │ │ 7🔒│ ← Locked          │
     │ └────┘                    │
     │                           │
     │ ☑ Set as active trip      │
     │                           │
     │ Countries                 │
     │ ┌───────────────────────┐ │
     │ │ ☑ 🇹🇭 Thailand        │ │
     │ │ ☑ 🇸🇬 Singapore       │ │
     │ │ ☑ 🇲🇾 Malaysia        │ │
     │ └───────────────────────┘ │
     │                           │
     │ ┌─────────┐ ┌───────────┐│
     │ │ Cancel  │ │   Save    ││
     │ └─────────┘ └───────────┘│
     └───────────────────────────┘

VALIDATION WARNINGS:
─────────────────────────────────────────
If user reduces duration from 7 to 5:
And locations exist on Days 6-7:

     ┌───────────────────────────┐
     │ ⚠️ Warning                │
     │                           │
     │ Reducing to 5 days will   │
     │ unschedule 4 locations on │
     │ days 6-7. Continue?       │
     │                           │
     │ ┌─────────┐ ┌───────────┐│
     │ │ Cancel  │ │ Continue  ││
     │ └─────────┘ └───────────┘│
     └───────────────────────────┘
```

### 5. Trip Detail - Day Filter with All Days

```
┌─────────────────────────────────────┐
│ ← Back              ⚙️  🔄          │
│ Southeast Asia 2025                 │
│ 3 Countries · 18 locations          │
├─────────────────────────────────────┤
│ (bg-gray-50, py-2, px-4)            │
│ ← → (Horizontal scroll indicators)  │
│                                     │
│ [All][D1][D2][D3][D4][D5][D6][D7][Un]│ ← Scrollable
│  ·18 ·4  ·5  ·3  ·2  ·0  ·0  ·0  ·4│
│  ▔▔▔▔                               │ ← Active (All)
│ (px-3 py-1.5, rounded, text-sm)     │
│                                     │
├─────────────────────────────────────┤
│ (p-4, space-y-6)                    │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Day 3] ← Badge               │  │ ← When "All" selected
│ │ Chatuchak Market        ⋮     │  │    Show day badges
│ │ 📍 Bangkok                    │  │
│ │ ...                           │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Day 1]                       │  │
│ │ Grand Palace            ⋮     │  │
│ │ 📍 Bangkok                    │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘

DAY BADGE:
─────────────────────────────────────────
Position: Top-right of card
Style: px-2 py-1, rounded-full
Background: bg-primary
Text: text-white, text-xs
Content: "Day 3"

SORTING:
─────────────────────────────────────────
When "All" selected:
  1. Day 1 locations (by display_order)
  2. Day 2 locations (by display_order)
  3. ...
  4. Day N locations (by display_order)
  5. Unscheduled locations (by added_at)

ALL DAYS SHOWN:
─────────────────────────────────────────
Even if Day 5, 6, 7 have 0 locations
  → Still show in filter
  → Count shows ·0
  → Clicking shows empty state
  → Helps user see full trip structure
```

### 6. Location Card - Kebab Menu in Trip View

```
┌─────────────────────────────────────┐
│ [Day 3] ← Badge (if in "All" view)  │
│ ┌───────────────────────────────┐  │
│ │ [Photo 280×160px]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ Chatuchak Market            ⋮       │ ← Kebab (trip view)
│ (text-xl, semibold)      (text-base)│
│                                     │
│ 📍 Kamphaeng Phet 2 Rd, Bangkok    │
│ 🏷️ Market · Shopping · $           │
│ ⭐ 4.6 Google rating                │
│                                     │
│ ─────────────────────────────────  │
│ 💡 Tips                             │
│ • "Go early, opens 6am"             │
│ • "Bring cash"                      │
│                                     │
│ ─────────────────────────────────  │
│ 🔴 reddit.com →                     │
│ Saved 3 days ago                    │
│                              🗑️     │ ← Bin icon
└─────────────────────────────────────┘   bottom-right

KEBAB MENU DROPDOWN (Portal):
─────────────────────────────────────────
┌──────────────────────────┐
│ 📅 Assign to Day       > │ ← Submenu arrow
│ 📝 Edit Notes            │
└──────────────────────────┘

SUBMENU (when hovering "Assign to Day"):
┌──────────────────────────┐
│ Day 1                    │
│ Day 2                    │
│ Day 3        ✓           │ ← Currently assigned
│ Day 4                    │
│ Day 5                    │
│ Day 6                    │
│ Day 7                    │
│ ─────────────────────    │
│ Unassigned               │
└──────────────────────────┘

Specs:
├─ Position: fixed (portal)
├─ Background: white
├─ Border: 1px gray-300, rounded-lg
├─ Shadow: 0 4px 12px rgba(0,0,0,0.1)
├─ Min-width: 180px
├─ Padding: py-1
├─ Items: px-4 py-2, hover:bg-gray-100
├─ Current day: checkmark indicator
└─ Submenu: appears on hover, offset right
```

### 7. Location Card - Library View (Country Detail)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐  │
│ │ [Photo 280×160px]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ Jim Thompson House                  │ ← No gear menu!
│ (text-xl, semibold)                 │
│                                     │
│ 📍 6 Soi Kasem San 2, Bangkok      │
│ 🏷️ Museum · Culture · $$           │
│ ⭐ 4.8 Google rating                │
│                                     │
│ ─────────────────────────────────  │
│ 💡 Tips                             │
│ • "Guided tours every 30min"        │
│ • "Beautiful silk collection"       │
│                                     │
│ ─────────────────────────────────  │
│ 🔴 tripadvisor.com →                │
│ Saved yesterday                     │
│ ┌─────────────────┐          🗑️    │ ← Bin & Button
│ │ Add to Trip     │                │    bottom area
│ └─────────────────┘                │
└─────────────────────────────────────┘

ADD TO TRIP BUTTON:
─────────────────────────────────────────
Position: Card footer, left side
Style: bg-primary, text-white
Padding: px-4 py-2
Radius: rounded-lg
Font: text-base, font-medium
Hover: bg-primary-dark, translateY(-1px)
Width: Auto (not full width)

BIN ICON:
─────────────────────────────────────────
Position: Bottom-right corner
Size: text-xl (20px)
Color: gray-400 → error on hover
Transition: colors 200ms
```

### 8. Add to Trip Modal

```
[MODAL OVERLAY - bg-black/50]

         ┌─────────────────┐
         │ Add to Trip     │ ← text-lg, semibold
         │ (p-4, max-w-xs) │    Compact!
         │                 │
         │ Select a trip:  │ ← text-sm, gray-600
         │                 │
         │ ┌─────────────┐ │
         │ │ Asia 2026   │ │ ← Hover: bg-gray-100
         │ ├─────────────┤ │    Click: add to trip
         │ │ Weekend SG  │ │
         │ ├─────────────┤ │
         │ │ Tokyo 2025  │ │
         │ ├─────────────┤ │ ← 3 trips visible
         │ │ ...scroll   │ │    Then scroll
         │ └─────────────┘ │
         │ max-h-48, scroll│
         └─────────────────┘

Specs:
├─ Background: white, rounded-lg
├─ Padding: p-4 (compact)
├─ Max-width: max-w-xs (320px)
├─ Max-height for list: max-h-48 (12rem)
├─ Trip rows: px-3 py-2, text-sm
├─ Hover: bg-gray-100, cursor-pointer
├─ No borders between rows
└─ Clean, minimal design

INTERACTIONS:
─────────────────────────────────────────
Click trip row:
  → Add location to trip (unscheduled)
  → Close modal
  → Show green toast: "Added to [Trip]"

If already in trip:
  → Close modal
  → Show orange toast: "Already in that trip"

Click outside modal:
  → Close without action

NO DAY SELECTION IN THIS MODAL
Day assignment only in trip detail view
```

### 9. Inline Delete Confirmation (Bin → Yes/No)

```
INITIAL STATE (Hover):
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ ...                                 │
│ Saved yesterday                     │
│                              🗑️    │ ← Gray → Red on hover
└─────────────────────────────────────┘

AFTER CLICK (Transform):
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ ...                                 │
│ Saved yesterday                     │
│                       [✅][❌]      │ ← Pill replaces bin
└─────────────────────────────────────┘   Snappy 200ms

HOVER STATES:
─────────────────────────────────────────
Hover ✅:
  → Background: bg-success
  → Text: white
  → Border-radius: left side only

Hover ❌:
  → Background: bg-error
  → Text: white
  → Border-radius: right side only

PILL SPECS:
─────────────────────────────────────────
Display: flex
Border: 1px solid gray-300
Border-radius: rounded-full
Overflow: hidden

Each button:
├─ Padding: px-3 py-1
├─ Font: text-base (emoji)
├─ Cursor: pointer
├─ Transition: 150ms ease
└─ No gap between buttons (seamless pill)

ACTIONS:
─────────────────────────────────────────
Click ✅:
  → Delete location (or remove from trip)
  → Optimistic UI update
  → No modal confirmation needed

Click ❌:
  → Transform back to bin icon
  → Cancel action

Click outside:
  → Transform back to bin icon
  → Cancel action

ANIMATION:
─────────────────────────────────────────
@keyframes binToPill {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}

@keyframes pillFadeIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

Duration: 200ms ease-out
```

### 10. Drag and Drop Reordering

```
DAY 3 VIEW (Specific day selected):
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ Day 3 (5 locations)                 │
│ (p-4, space-y-6)                    │
│                                     │
│ ┌─────────────────────────────────┐│ ← Drag handle
│ ║≡≡ Chatuchak Market        ⋮    ││    shown on hover
│ │  📍 Bangkok                     ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ ║≡≡ Jim Thompson House       ⋮    ││ ← Currently dragging
│ │  📍 Bangkok                     ││    opacity: 0.5
│ └─────────────────────────────────┘│    shadow: large
│                                     │
│ ─────────────────────────────────  │ ← Drop indicator
│                                     │    2px dashed primary
│ ┌─────────────────────────────────┐│
│ ║≡≡ Wat Arun                 ⋮    ││
│ │  📍 Bangkok                     ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ ║≡≡ Khao San Road            ⋮    ││
│ │  📍 Bangkok                     ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘

DRAG HANDLE:
─────────────────────────────────────────
Icon: ≡≡ (two vertical lines)
Position: Left side of card, vertically centered
Visibility: Hidden by default, show on card hover
Cursor: grab (idle), grabbing (dragging)
Color: gray-400

DRAGGING STATE:
─────────────────────────────────────────
Card being dragged:
├─ Opacity: 0.5
├─ Shadow: 0 10px 25px rgba(0,0,0,0.3)
├─ Z-index: 100
├─ Cursor: grabbing
└─ Transform: rotate(-2deg)

Drop zone indicator:
├─ Border: 2px dashed primary
├─ Height: 4px
├─ Margin: 12px 0
├─ Animation: pulse (subtle)
└─ Position: Between cards

DROP BEHAVIOR:
─────────────────────────────────────────
On drop:
  1. Calculate new display_order
  2. Update database immediately
  3. Optimistic UI reorder (instant)
  4. Background refresh to verify
  5. Smooth animation (200ms ease)

Only available when viewing specific day
Disabled in "All" and "Unscheduled" tabs
```

### 11. Trip Card - With Dates Display

```
┌─────────────────────────────────────┐
│ Southeast Asia 2025          18    │ ← No emoji prefix
│ (text-xl, semibold)      (text-lg) │    Shows count
│                                     │
│ Active · 3 countries · 7 days       │ ← text-sm, gray-600
│ 15 Mar - 22 Mar                     │    DD MMM format
└─────────────────────────────────────┘

DISPLAY LOGIC:
─────────────────────────────────────────
Show duration if duration_days set:
  "7 days"

Show dates if start_date and end_date set:
  "15 Mar - 22 Mar"
  Format: DD MMM (short month name)

Show both if available:
  "7 days · 15 Mar - 22 Mar"

Show country count:
  "3 countries" (from unique countries in trip_countries)

Show active status:
  "Active" badge in primary color
```

### 12. Empty States

```
NO TRIP DURATION SET:
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ [All] [Unscheduled]                 │ ← Only these tabs
│  ·18   ·18                          │    No day tabs
│  ▔▔▔▔                               │
│                                     │
│ (Locations shown...)                │
│                                     │
│ 💡 Set trip duration in settings    │
│    to assign locations to days      │
└─────────────────────────────────────┘

EMPTY DAY:
─────────────────────────────────────────
┌─────────────────────────────────────┐
│ [All][D1][D2][D3][D4][D5]           │
│  ·12 ·4  ·5  ·0  ·3                 │
│          ▔▔▔▔                       │ ← Day 3 selected
│                                     │
│                                     │
│           📅                        │
│                                     │
│    No locations on Day 3 yet       │ ← text-sm, gray-600
│                                     │
│    Assign locations from the        │
│    All tab or add new locations     │
│                                     │
└─────────────────────────────────────┘
```

---

## Data Model

### Database Schema Updates

#### Trips Table
```sql
-- Already exists, no changes needed
trips:
  start_date         DATE NULL          -- Optional trip start
  end_date           DATE NULL          -- Optional trip end
  duration_days      INTEGER NULL       -- Optional duration
  
CONSTRAINT check_dates:
  start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  
CONSTRAINT check_duration:
  duration_days IS NULL OR duration_days >= 1
```

#### Trip Locations Table
```sql
-- Already exists, no changes needed
trip_locations:
  day_number         INTEGER NULL       -- Day assignment (1-N, or NULL)
  display_order      INTEGER            -- Order within day
  notes              TEXT NULL          -- Trip-specific notes
  
CONSTRAINT check_day:
  day_number IS NULL OR day_number >= 1

INDEX idx_trip_day:
  (trip_id, day_number, display_order)
```

### TypeScript Interfaces

```typescript
// extension/lib/types.ts

interface Trip {
  id: string
  user_id: string
  country_id: string | null
  name: string
  description?: string | null
  start_date?: string | null        // ISO date string
  end_date?: string | null          // ISO date string
  duration_days?: number | null     // Integer, 1+
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Populated from joins
  country?: Country
  countries?: Country[]              // Multi-country support
  locationCount?: number
  countryCount?: number
}

interface TripLocation {
  id: string
  trip_id: string
  location_id: string
  day_number?: number | null        // 1-N or null (unscheduled)
  display_order: number             // Order within day
  notes?: string | null             // Trip-specific notes
  priority: 'must_see' | 'normal' | 'optional'
  status: 'planned' | 'visited' | 'skipped'
  added_at: string
  updated_at: string
}

interface LocationWithTripData extends Location {
  // Trip context fields
  tripLocationId?: string
  dayNumber?: number | null
  displayOrder?: number
  tripNotes?: string | null
  priority?: string
}
```

---

## API Requirements

### API Endpoints

#### 1. Update Trip (PATCH /api/trips/:id)
**Request Body:**
```json
{
  "name": "Southeast Asia 2025",
  "description": "Multi-country adventure",
  "startDate": "2025-03-15",
  "endDate": "2025-03-22",
  "durationDays": 7,
  "isActive": true
}
```

**Response:**
```json
{
  "trip": {
    "id": "...",
    "name": "Southeast Asia 2025",
    "start_date": "2025-03-15",
    "end_date": "2025-03-22",
    "duration_days": 7,
    "is_active": true,
    "updated_at": "2025-11-17T10:30:00Z"
  }
}
```

**Validation:**
- start_date ≤ end_date (if both provided)
- duration_days ≥ 1 (if provided)
- Warn if reducing duration and locations exist on removed days

#### 2. Get Trip Locations (GET /api/trips/:id/locations)
**Already exists, update response:**
```json
{
  "locations": [...],  // Array of LocationWithTripData
  "byDay": {
    "1": [...],        // Day 1 locations
    "2": [...],        // Day 2 locations
    "unscheduled": [...]
  }
}
```

**Enhancement:**
- Include empty day arrays for all days 1 to duration_days
- Even if day has 0 locations, include: `"5": []`

#### 3. Link Location to Trip (POST /api/trip-locations)
**Request Body:**
```json
{
  "tripId": "...",
  "locationId": "...",
  "dayNumber": 3        // Optional, can be null
}
```

**Business Logic:**
- If dayNumber provided, validate: 1 ≤ dayNumber ≤ trip.duration_days
- If dayNumber is null, set to unscheduled
- Calculate appropriate display_order (max + 1 within day)
- Check for duplicates (location already in trip)

#### 4. Update Trip Location (PATCH /api/trip-locations/:id)
**Request Body:**
```json
{
  "dayNumber": 5,       // Move to Day 5
  "displayOrder": 2,    // Reorder within day
  "notes": "Visit in morning"
}
```

#### 5. Reorder Locations (POST /api/trip-locations/reorder)
**New endpoint for drag-and-drop:**
```json
{
  "tripId": "...",
  "dayNumber": 3,
  "locationIds": ["id1", "id2", "id3"]  // New order
}
```

**Backend:**
- Update display_order for each location
- display_order = array index + 1
- Transaction to ensure atomicity

#### 6. Unschedule Locations (POST /api/trips/:id/unschedule-days)
**New endpoint for reducing trip duration:**
```json
{
  "tripId": "...",
  "affectedDays": [6, 7]  // Days being removed
}
```

**Response:**
```json
{
  "unscheduledCount": 4,
  "unscheduledLocationIds": ["...", "...", "...", "..."]
}
```

---

## Edge Cases & Validation

### Date and Duration Validation

**EC-1: Invalid Date Range**
- **Scenario:** User sets start_date > end_date
- **Handling:** Show inline error: "End date must be after start date"
- **Prevention:** Disable "Save" button until corrected

**EC-2: Duration Mismatch**
- **Scenario:** Dates show 5 days, user manually enters 7 days
- **Handling:** Adjust end_date to match new duration (start + 7 days)
- **User Feedback:** Show message: "End date adjusted to match duration"

**EC-3: Locked Field Editing**
- **Scenario:** User clicks locked duration field
- **Handling:** Unlock field, remove lock icon, allow editing
- **Recalculation:** Auto-adjust end_date when duration changes

**EC-4: Past Dates**
- **Scenario:** User creates trip with past dates
- **Handling:** Allow (for documenting past trips)
- **No validation error** for past dates

**EC-5: Empty Dates with Duration**
- **Scenario:** User sets duration = 5, but no dates
- **Handling:** Allow (for planning without specific dates)
- **Day assignment:** Still available (Days 1-5)

**EC-6: Clearing All Fields**
- **Scenario:** User clears duration, start_date, end_date
- **Handling:** Set duration_days = null
- **Result:** Day assignment disabled for this trip

### Day Assignment Validation

**EC-7: Assigning to Non-Existent Day**
- **Scenario:** Trip has 5 days, user tries to assign to Day 7
- **Handling:** API returns 400 error: "Invalid day number"
- **Frontend:** Prevent in UI (only show valid days)

**EC-8: No Duration Set**
- **Scenario:** Trip has duration_days = null
- **Handling:** Hide day assignment options in kebab menu
- **Show message:** "Set trip duration to assign days"

**EC-9: Reducing Trip Days**
- **Scenario:** Trip has 7 days, locations on days 6-7, user changes to 5 days
- **Handling:** 
  1. Show warning modal with affected locations count
  2. If user confirms, unschedule locations on days 6-7
  3. Update trip with new duration
- **Transaction:** Ensure atomicity (both updates or neither)

**EC-10: Unscheduling Location**
- **Scenario:** User selects "Unassigned" from kebab menu
- **Handling:** Set day_number = null
- **Display:** Location appears in "Unscheduled" tab

### Add to Trip Validation

**EC-11: Location Already in Trip**
- **Scenario:** User adds location that's already in selected trip
- **Handling:** Close modal, show orange toast: "Already in that trip"
- **No error:** Treated as successful (idempotent)

**EC-12: No Trips Exist**
- **Scenario:** User clicks "Add to Trip" but has 0 trips
- **Handling:** Show empty state in modal: "Create a trip first"
- **Action button:** Close (no trips to add to)

**EC-13: Multi-Select (Future)**
- **Current:** Single location add
- **Future:** Batch add multiple locations
- **Note:** Not in MVP scope

### Delete Validation

**EC-14: Delete from Library**
- **Scenario:** User deletes location from country detail view
- **Handling:** 
  1. Permanently delete from database
  2. Remove from all trips
  3. Cascade delete trip_locations entries
- **Irreversible:** No undo (consider adding in future)

**EC-15: Delete from Trip**
- **Scenario:** User deletes location from trip detail view
- **Handling:** 
  1. Delete trip_locations entry only
  2. Keep location in library
  3. Location still visible in country detail
- **Reversible:** Can re-add location to trip

**EC-16: Accidental Click Outside**
- **Scenario:** User clicks bin, then clicks outside Yes/No pill
- **Handling:** Cancel delete, transform back to bin icon
- **Safe:** Prevents accidental deletes

### Drag and Drop Validation

**EC-17: Drag Across Days**
- **Scenario:** User tries to drag from Day 1 to Day 2
- **Handling:** Prevent cross-day dragging
- **Reason:** Different day = different context, use kebab menu instead

**EC-18: Drag in "All" View**
- **Scenario:** User tries to drag in "All" tab
- **Handling:** Disable dragging
- **Reason:** Ambiguous (which day to reorder within?)

**EC-19: Network Failure During Reorder**
- **Scenario:** User reorders, API call fails
- **Handling:** 
  1. Optimistic update (immediate UI change)
  2. On failure, revert to previous order
  3. Show error toast: "Failed to save order"
- **Retry:** User can try again

---

## Success Criteria

### Functional Completeness
- ✅ User can set start date, end date, and duration when creating trips
- ✅ User can edit trip details via settings modal
- ✅ System auto-calculates related date/duration fields correctly
- ✅ User can assign locations to specific days (1 to N)
- ✅ User can view locations filtered by day
- ✅ User can drag-and-drop to reorder locations within a day
- ✅ User can unschedule locations (move to unassigned)
- ✅ User can add locations to trips from library view
- ✅ User can delete locations with inline confirmation
- ✅ System warns before unscheduling locations when reducing trip days

### Performance
- ⚡ Date calculations happen instantly (<50ms)
- ⚡ Day filter switching is immediate (<100ms)
- ⚡ Drag-and-drop feels smooth (60fps, no jank)
- ⚡ Add to trip modal opens in <200ms
- ⚡ Optimistic UI updates before API responses

### Usability
- 🎯 Date pickers are intuitive (calendar UI, not text input)
- 🎯 Duration auto-calculation is obvious (lock icon shown)
- 🎯 Day assignment is discoverable (kebab menu)
- 🎯 "Add to Trip" button is prominent (primary color, clear text)
- 🎯 Delete confirmation is fast (no modal, inline Yes/No)
- 🎯 Drag handles appear on hover (discoverability)
- 🎯 Empty states are helpful (guide user to next action)

### Reliability
- 🛡️ All date validations work correctly
- 🛡️ Cannot assign to days beyond trip duration
- 🛡️ Cannot create invalid date ranges
- 🛡️ Optimistic updates revert on API failure
- 🛡️ No data loss during network errors
- 🛡️ Transaction safety for reducing trip days

### UI Consistency
- 🎨 All spacing follows 4px grid system
- 🎨 All date displays use DD/MM/YYYY format
- 🎨 All modals have consistent padding and shadow
- 🎨 All buttons follow design system variants
- 🎨 All animations use 200ms ease timing
- 🎨 All colors match design tokens

### Accessibility
- ♿ All interactive elements are keyboard accessible
- ♿ Tab order is logical (top to bottom, left to right)
- ♿ Escape key closes modals
- ♿ Enter key confirms actions
- ♿ Focus states are visible (ring-2 ring-primary)
- ♿ Screen reader labels for icon-only buttons

---

## Implementation Notes

### Phase 1: Backend & Data Model
1. Update trip validation schema (start_date, end_date validation)
2. Add trip update endpoint with date/duration logic
3. Add reorder endpoint for drag-and-drop
4. Add unschedule endpoint for reducing days
5. Update getTripLocations to include empty day arrays

### Phase 2: Create Trip Flow
1. Update CreateTripModal with date pickers
2. Implement date-duration auto-calculation logic
3. Add locked/unlocked duration field state
4. Add date validation and error messages
5. Update API client to send new fields

### Phase 3: Edit Trip Flow
1. Create TripSettingsModal component
2. Add pencil icon (✏️) to trip detail header for editing
3. Implement same date-duration logic as create
4. Add warning dialog for reducing days
5. Wire up save/cancel actions

### Phase 4: Day Assignment
1. Add day filter tabs to trip detail header
2. Implement day filtering logic
3. Add day badges to location cards (in "All" view)
4. Update kebab menu with day assignment submenu
5. Implement assign/unassign API calls
6. Add "Edit Notes" option to kebab menu

### Phase 5: Quick Add to Trip
1. Add "Add to Trip" button to location cards (library view)
2. Create AddToTripModal component (compact version)
3. Remove gear menu from library view
4. Implement trip selection and add logic
5. Add success/error toasts

### Phase 6: Inline Delete
1. Add bin icon to location cards (both views)
2. Implement bin → Yes/No pill transformation
3. Add hover states (red bin, green/red pills)
4. Wire up delete actions (library vs trip)
5. Remove ConfirmDialog for delete actions
6. Add optimistic UI updates

### Phase 7: Drag and Drop
1. Add drag handle to location cards (specific day view only)
2. Implement drag start/end handlers
3. Show drop zone indicator
4. Calculate new display_order on drop
5. Call reorder API endpoint
6. Add smooth animations

### Phase 8: Polish & Edge Cases
1. Add all empty states
2. Implement all validation rules
3. Add loading states
4. Handle all error scenarios
5. Test date calculations exhaustively
6. Test drag-and-drop edge cases
7. Performance optimization (virtualization if needed)

---

## Future Enhancements (Out of Scope)

### Time-Based Planning
- Set specific times for locations (e.g., "10:00 AM")
- Calculate travel times between locations
- Optimize daily schedule based on times
- Show timeline view for each day

### Priority Levels
- Mark locations as must-see, normal, optional
- Filter by priority
- Use priority in optimization algorithms

### Notes & Collaboration
- Rich text notes for locations
- Share trip with other users
- Collaborative editing
- Comments and suggestions

### Advanced Features
- Auto-suggest optimal day assignments
- Import itineraries from external sources
- Export to Google Calendar
- Budget tracking per day
- Weather integration

---

**End of Document**


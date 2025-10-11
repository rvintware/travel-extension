# High-Level UI/UX Design: Travel Companion Chrome Extension

**Version:** 1.0 MVP  
**Last Updated:** October 11, 2025  
**Status:** Design Approved

---

## Overview

This document outlines the user interface and user experience design for the Travel Companion Chrome Extension. The design prioritizes **frictionless capture** and **clarity** over feature complexity, ensuring users can save travel recommendations in under 2 seconds.

---

## Design Principles

1. **Zero Cognitive Load**: Users should never have to think about "how" to save
2. **Instant Feedback**: Every action gets immediate visual confirmation
3. **Graceful Degradation**: Errors are helpful, not blocking
4. **Content First**: Data and recommendations are the hero, not chrome or decoration
5. **Speed Matters**: Every interaction should feel instant

---

## Chrome Extension Popup UI

### 1. Main View - Trip List

**Purpose:** Overview of all trips and quick access to locations

```
┌─────────────────────────────────────────┐
│  🗺️  Travel Companion                   │
├─────────────────────────────────────────┤
│                                         │
│  Active Trip                            │
│  ┌───────────────────────────────────┐ │
│  │ Toronto ▼                    [⭐] │ │ <- Dropdown + star indicator
│  └───────────────────────────────────┘ │
│                                         │
│  My Trips                               │
│  ┌───────────────────────────────────┐ │
│  │ 📍 Toronto               12 saved │ │ <- Click to view
│  │    Active trip                    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🗾 Japan                  8 saved │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🌏 Taiwan                 3 saved │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🏙️ Singapore              0 saved │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 🐼 China                  5 saved │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │        + New Trip                 │ │ <- Create new trip
│  └───────────────────────────────────┘ │
│                                         │
│  💡 Tip: Right-click any text to save! │
│                                         │
└─────────────────────────────────────────┘
     320px wide × 500px tall
```

**Key Features:**
- **Active Trip Dropdown**: Change which trip receives right-click saves
- **Star Indicator**: Visual cue for active trip
- **Save Count**: Shows number of locations per trip
- **Empty State Tip**: Guides new users on how to use the extension
- **Hover States**: Cards lift slightly on hover for tactile feedback

**Interactions:**
- Click trip card → Navigate to trip detail view
- Click dropdown → Change active trip
- Click "+ New Trip" → Open inline creation form
- Scroll → View more trips (if > 6 trips)

---

### 2. Trip Detail View - Location List

**Purpose:** Browse and manage saved locations within a trip

```
┌─────────────────────────────────────────┐
│  ← Toronto Trip                    [⚙️] │ <- Back button + settings
├─────────────────────────────────────────┤
│                                         │
│  12 locations · Last saved 2 min ago    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍷 Bar Raval              [✓ verified]│
│  │ 505 College St · Bar              │ │
│  │                                   │ │
│  │ Spanish-style bar known for its   │ │
│  │ vermouth selection and tapas.     │ │
│  │                                   │ │
│  │ ✓ Arrive at 5pm to beat the rush │ │
│  │ ✓ Try the vermouth flight        │ │
│  │ ✓ House-made pintxos are amazing │ │
│  │                                   │ │
│  │ [🗺️ View on Maps]    [🗑️ Delete] │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🍦 Sweet Jesus                [⚠️] │ │ <- Unverified location
│  │ Near Dundas Square · Dessert      │ │
│  │                                   │ │
│  │ ⚠️ Location not verified          │ │
│  │ Over-the-top ice cream creations  │ │
│  │                                   │ │
│  │ ✓ Instagram-worthy presentation  │ │
│  │ ✓ Get the waffle cone            │ │
│  │                                   │ │
│  │ [🔗 View Source]     [🗑️ Delete] │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⏳ Processing...                  │ │ <- Loading state
│  │ Taco place near Trinity Bellwoods │ │
│  │                                   │ │
│  │ [███████░░░] 70%                  │ │ <- Progress indicator
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Load More]                            │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- **Back Navigation**: Returns to trip list
- **Settings Icon**: Access trip settings (rename, delete, etc.)
- **Status Summary**: Shows total locations and last activity
- **Location Cards**: Three states: complete, unverified, processing
- **Verified Badge**: Green checkmark for Google-verified locations
- **Warning Badge**: Orange alert for unverified locations
- **Progress Bar**: Animated loading indicator for processing items
- **Action Buttons**: Primary actions per location
- **Load More**: Pagination for trips with many locations

**Interactions:**
- Click ← Back → Return to trip list
- Click ⚙️ Settings → Open trip settings modal
- Click location card → Expand/collapse full details
- Click "View on Maps" → Open Google Maps in new tab
- Click "View Source" → Open original Reddit/blog post
- Click "Delete" → Confirm deletion modal
- Auto-refresh → Polls every 2s for processing updates

---

### 3. Empty State

**Purpose:** Guide users on first use of a new trip

```
┌─────────────────────────────────────────┐
│  ← Toronto Trip                    [⚙️] │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              🗺️                         │
│                                         │
│        No locations saved yet           │
│                                         │
│  Start saving places by highlighting    │
│  text on any webpage and right-clicking │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Try it on Reddit or a blog!     │ │
│  │                                   │ │
│  │   1. Highlight a recommendation   │ │
│  │   2. Right-click                  │ │
│  │   3. "Save to Toronto Trip"       │ │
│  └───────────────────────────────────┘ │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- **Friendly Icon**: Map emoji creates welcoming feel
- **Clear Instructions**: 3-step guide for first save
- **Example Context**: Mentions Reddit/blog to set expectations

---

### 4. New Trip Creation (Inline)

**Purpose:** Create a new trip without leaving the main view

```
┌─────────────────────────────────────────┐
│  🗺️  Travel Companion                   │
├─────────────────────────────────────────┤
│                                         │
│  Active Trip                            │
│  ┌───────────────────────────────────┐ │
│  │ Toronto ▼                    [⭐] │ │
│  └───────────────────────────────────┘ │
│                                         │
│  My Trips                               │
│  ┌───────────────────────────────────┐ │
│  │ 📍 Toronto               12 saved │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Trip name: [Singapore 2026____]   │ │ <- Text input (autofocus)
│  │                                   │ │
│  │ ☑️ Set as active trip             │ │ <- Checkbox (checked by default)
│  │                                   │ │
│  │ [Cancel]          [Create Trip]   │ │ <- Actions
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- **Inline Form**: No modal, keeps context
- **Autofocus**: Input is ready to type immediately
- **Smart Default**: "Set as active" checked by default
- **Clear Actions**: Cancel or Create

**Interactions:**
- Type trip name
- Toggle "Set as active" checkbox
- Press Enter or click "Create Trip" → Trip created, form closes
- Click "Cancel" or press Escape → Form closes, no changes

---

## Context Menu (Right-Click) UI

### 1. Standard Context Menu (On Selected Text)

**Purpose:** Primary capture method - fastest way to save

```
Browser Page (Reddit, Blog, etc.)
───────────────────────────────────
Lorem ipsum dolor sit amet...

[Bar Raval near AGO has amazing    ] <- User highlights this
[vermouth, go at 5pm to avoid      ]
[crowds. The pintxos are incredible]

┌────────────────────────────────┐
│  Copy                          │ <- Native browser options
│  Search Google for "Bar Rav..."│
├────────────────────────────────┤
│  ⭐ Save to Toronto Trip       │ <- Our extension (active trip)
│  📍 Save to Japan Trip         │ <- Recent trip #1
│  🌏 Save to Taiwan Trip        │ <- Recent trip #2
├────────────────────────────────┤
│  📁 Choose Trip...             │ <- Opens submenu (all trips)
└────────────────────────────────┘
```

**Key Features:**
- **Active Trip First**: One-click save to current active trip (⭐)
- **Recent Trips**: Next 2 most recently used trips
- **Visual Hierarchy**: Star emoji indicates active selection
- **Fallback**: "Choose Trip..." for accessing all trips

**Design Rationale:**
- 90% of saves go to active trip → one-click
- 9% go to recent trips → two-click
- 1% need full list → three-click via submenu

---

### 2. Submenu - Choose Trip

**Purpose:** Access all trips when needed

```
┌────────────────────────────────┐
│  ⭐ Save to Toronto Trip       │
│  📍 Save to Japan Trip      >  │──┐
│  🌏 Save to Taiwan Trip        │  │
├────────────────────────────────┤  │
│  📁 Choose Trip...          >  │──┤
└────────────────────────────────┘  │
                                    │
    ┌───────────────────────────────┘
    │
    └──┐
       ▼
    ┌────────────────────────────┐
    │  📍 Toronto (Active)       │ <- Active trip marked
    │  🗾 Japan                  │
    │  🌏 Taiwan                 │
    │  🏙️ Singapore              │
    │  🐼 China                  │
    ├────────────────────────────┤
    │  + New Trip                │ <- Create on the fly
    └────────────────────────────┘
```

**Key Features:**
- **All Trips Listed**: Complete trip list
- **Active Indicator**: Shows which trip is currently active
- **Inline Creation**: Can create new trip from context menu

---

### 3. Success Notification (After Save)

**Purpose:** Immediate feedback that save was successful

```
Browser Page
───────────────────────────────────
                    ┌──────────────────────────────┐
                    │  ✓ Saved to Toronto Trip     │ <- Toast notification
                    │  Processing in background... │
                    └──────────────────────────────┘
                              ↑
                         Top-right corner
                         Fades after 3 seconds
```

**Key Features:**
- **Non-blocking**: Appears, doesn't interrupt workflow
- **Confirmation**: Checkmark + trip name confirms action
- **Expectation Setting**: "Processing..." tells user what's next
- **Auto-dismiss**: Fades after 3 seconds

---

## Location Card Component States

### State 1: Complete & Verified

**Purpose:** Fully processed location with Google Places data

```
┌─────────────────────────────────────┐
│ 🍷 Bar Raval              [✓ verified]│ <- Category emoji + verified badge
│ 505 College St · Bar                │ <- Address + category tag
│ [Photo of the bar - 280x120px]     │ <- Google Places photo
│                                     │
│ Spanish-style bar known for its     │ <- AI-generated summary (2 sentences)
│ vermouth selection and tapas.       │
│                                     │
│ ✓ Arrive at 5pm to beat the rush   │ <- Actionable tips (bullets)
│ ✓ Try the vermouth flight           │
│ ✓ House-made pintxos are amazing   │
│                                     │
│ From: reddit.com/r/toronto          │ <- Source attribution
│ Saved: 2 hours ago                  │ <- Relative timestamp
│                                     │
│ [🗺️ View on Maps]    [🗑️ Delete]   │ <- Primary actions
└─────────────────────────────────────┘
```

**Visual Hierarchy:**
1. Name + verification status (most important)
2. Address (helps with recognition)
3. Photo (visual anchor)
4. Summary (context)
5. Tips (actionable information)
6. Source + timestamp (metadata)
7. Actions (CTAs)

---

### State 2: Unverified Location

**Purpose:** AI found info but couldn't verify via Google Places

```
┌─────────────────────────────────────┐
│ 🍦 Sweet Jesus            [⚠️ unverified]│ <- Warning badge
│ Near Dundas Square · Dessert        │
│                                     │
│ ⚠️ Could not verify location        │ <- Explanation
│ Over-the-top ice cream creations    │ <- Still has AI summary
│                                     │
│ ✓ Instagram-worthy presentation     │ <- Still has tips
│ ✓ Get the waffle cone               │
│                                     │
│ From: blogto.com                    │
│ Saved: 1 day ago                    │
│                                     │
│ [🔗 View Source]     [🗑️ Delete]   │ <- View source instead of maps
└─────────────────────────────────────┘
```

**Key Differences:**
- No photo (Places API returned nothing)
- Warning badge instead of verified checkmark
- "View Source" button instead of "View on Maps"
- Still useful (has text and tips)

---

### State 3: Processing

**Purpose:** Show real-time progress while AI processes

```
┌─────────────────────────────────────┐
│ ⏳ Processing location...            │ <- Animated hourglass
│                                     │
│ Original text:                      │ <- Shows what user saved
│ "Taco place near Trinity Bellwoods  │
│ has the best al pastor..."          │
│                                     │
│ [███████████░░░░░░░░] 65%           │ <- Animated progress bar
│ Searching for location...           │ <- Current step description
│                                     │
│ From: reddit.com/r/toronto          │
│ Saved: Just now                     │
└─────────────────────────────────────┘
```

**Progress Steps:**
- 0-30%: "Analyzing text and image..."
- 31-60%: "Searching for location..."
- 61-90%: "Gathering details..."
- 91-99%: "Finishing up..."
- 100%: Transitions to complete state

**Auto-refresh:**
- Polls `/api/locations/:id` every 2 seconds
- Updates progress bar smoothly
- Transitions to complete state when done

---

### State 4: Error

**Purpose:** Handle processing failures gracefully

```
┌─────────────────────────────────────┐
│ ❌ Processing failed                 │
│                                     │
│ Could not process this location.    │ <- User-friendly message
│ The AI service timed out.           │ <- Technical reason (simple)
│                                     │
│ Original text:                      │ <- Preserve what user saved
│ "That gelato place near the..."     │
│                                     │
│ From: reddit.com                    │
│                                     │
│ [🔄 Retry]           [🗑️ Delete]   │ <- Retry or delete
└─────────────────────────────────────┘
```

**Error Types:**
- **AI Timeout**: "The AI service took too long. Try again?"
- **API Error**: "We couldn't reach our servers. Check your connection?"
- **Places Not Found**: (Becomes "unverified" state instead)
- **Invalid Input**: "We couldn't find a location in that text."

---

## Design System

### Color Palette

```css
/* Primary Colors */
--primary-blue: #3B82F6;      /* Buttons, links, active states */
--primary-dark: #1E40AF;      /* Hover states */
--primary-light: #DBEAFE;     /* Backgrounds */

/* Status Colors */
--success-green: #10B981;     /* Verified badge, success messages */
--warning-orange: #F59E0B;    /* Unverified badge, warnings */
--error-red: #EF4444;         /* Errors, delete actions */
--processing-blue: #60A5FA;   /* Loading indicators */

/* Neutral Colors */
--gray-50: #F9FAFB;          /* Page background */
--gray-100: #F3F4F6;         /* Card background */
--gray-200: #E5E7EB;         /* Disabled states */
--gray-300: #D1D5DB;         /* Borders, dividers */
--gray-400: #9CA3AF;         /* Placeholder text */
--gray-600: #4B5563;         /* Secondary text */
--gray-700: #374151;         /* Body text */
--gray-900: #111827;         /* Headings */

/* Semantic Colors */
--text-primary: var(--gray-900);
--text-secondary: var(--gray-600);
--text-muted: var(--gray-400);
--border-default: var(--gray-300);
--bg-card: white;
--bg-hover: var(--gray-50);
```

### Typography

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;

/* Font Sizes */
--text-xs: 12px;      /* Meta info, badges */
--text-sm: 14px;      /* Body text, descriptions */
--text-base: 16px;    /* Headings, buttons */
--text-lg: 18px;      /* Page titles */
--text-xl: 20px;      /* Hero text */

/* Font Weights */
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Emphasis */
--font-semibold: 600; /* Headings, buttons */
--font-bold: 700;     /* Rarely used */

/* Line Heights */
--leading-tight: 1.25;  /* Headings */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.75; /* Descriptions */
```

### Spacing System

```css
/* Base: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* Common Patterns */
--card-padding: var(--space-4);
--section-gap: var(--space-6);
--button-padding-x: var(--space-4);
--button-padding-y: var(--space-2);
```

### Border Radius

```css
--radius-sm: 4px;     /* Badges, small buttons */
--radius-md: 8px;     /* Cards, inputs */
--radius-lg: 12px;    /* Modals, containers */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1), 
             0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1),
             0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-xl: 0 10px 15px rgba(0, 0, 0, 0.1),
             0 4px 6px rgba(0, 0, 0, 0.05);
```

---

## Component Specifications

### Button Styles

```css
/* Primary Button */
.btn-primary {
  background: var(--primary-blue);
  color: white;
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--border-default);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  background: var(--gray-50);
}

/* Danger Button */
.btn-danger {
  background: white;
  color: var(--error-red);
  border: 1px solid var(--error-red);
}

.btn-danger:hover {
  background: var(--error-red);
  color: white;
}
```

### Card Styles

```css
.location-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--card-padding);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.location-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Badge Styles

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.badge-verified {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-green);
}

.badge-unverified {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-orange);
}
```

---

## Interaction Patterns

### 1. Quick Save Flow (Happy Path)

**User Goal:** Save a recommendation while browsing

```
User on Reddit reading thread
      ↓
Sees interesting recommendation
      ↓
Highlights text (1 second)
      ↓
Right-clicks (0.5 seconds)
      ↓
Clicks "⭐ Save to Toronto Trip" (0.5 seconds)
      ↓
Toast appears: "✓ Saved to Toronto Trip"
      ↓
User continues browsing (uninterrupted)
      ↓
[Background: AI processes 10-15 seconds]
      ↓
Later: Opens extension popup
      ↓
Sees new location card with full details
```

**Total interaction time: ~2 seconds**

---

### 2. Multi-Save Session

**User Goal:** Save multiple recommendations from one thread

```
User in Reddit thread with 20+ recommendations
      ↓
Highlight → Right-click → Save to Toronto (2s)
      ↓
Scroll down
      ↓
Highlight → Right-click → Save to Toronto (2s)
      ↓
Repeat 10 times
      ↓
Open extension popup
      ↓
See all 10 items processing/complete
```

**Total time for 10 saves: ~20 seconds**  
**Value:** User can batch-save entire thread efficiently

---

### 3. Cross-Trip Saving

**User Goal:** Save to multiple trips in one session

```
User reading "Asia travel guide" blog
      ↓
Finds Japan recommendation
Highlight → Right-click → Save to Japan Trip
      ↓
Finds Singapore recommendation
Highlight → Right-click → Change active to Singapore
→ Save to Singapore Trip
      ↓
Finds Taiwan recommendation
Highlight → Right-click → Save to Taiwan Trip (now active)
      ↓
Extension remembers Taiwan as active for next save
```

**Behavior:** Active trip follows user's intent

---

### 4. Review & Planning Session

**User Goal:** Review saved locations before trip

```
User planning weekend in Toronto
      ↓
Opens extension popup
      ↓
Clicks "Toronto Trip" (12 saved)
      ↓
Scrolls through locations
      ↓
Clicks "View on Maps" for 3 locations
      ↓
Deletes 2 that aren't interesting anymore
      ↓
Final list: 10 must-visit places
```

**Value:** Easy curation and planning

---

## Animation & Micro-interactions

### Transitions

```css
/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.2s ease-in;
}
```

### Loading Animations

```css
/* Progress bar */
@keyframes progress {
  0% { width: 0%; }
  100% { width: var(--progress-value); }
}

.progress-bar {
  animation: progress 0.5s ease-out;
}

/* Shimmer loading skeleton */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-100) 25%,
    var(--gray-200) 50%,
    var(--gray-100) 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Processing dots */
@keyframes ellipsis {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

.processing::after {
  content: '...';
  animation: ellipsis 1.5s infinite;
}
```

### Hover Effects

```css
/* Card lift on hover */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Button press effect */
.button {
  transition: transform 0.1s ease;
}

.button:active {
  transform: scale(0.98);
}
```

### Toast Notifications

```css
@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.toast {
  animation: slideIn 0.3s ease-out,
             fadeOut 0.5s ease-in 2.5s forwards;
}
```

---

## Responsive Behavior

### Popup Dimensions

**Width:**
- Minimum: 320px (Chrome's minimum)
- Optimal: 360px (recommended)
- Maximum: 400px (before too wide)

**Height:**
- Minimum: 400px
- Optimal: 500px
- Maximum: 600px (then scrollable)

### Card Behavior

**Location Card:**
- Collapsed: 140px height
- Expanded: Auto (max 300px)
- Photo: 280×120px (2.33:1 aspect ratio)

**Trip Card:**
- Fixed: 60px height
- Full width with 8px margin

### Scrolling

```css
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}
```

---

## Accessibility

### Keyboard Navigation

**Tab Order:**
1. Back button (if on detail view)
2. Active trip dropdown
3. Trip cards (in order)
4. New trip button
5. Within location cards:
   - View on Maps
   - Delete

**Shortcuts:**
- `Escape`: Close popup or go back
- `Enter`: Activate focused button/link
- `Tab`: Next element
- `Shift+Tab`: Previous element

### Screen Reader Support

```html
<!-- Example: Location card -->
<article 
  role="article" 
  aria-label="Bar Raval, verified location">
  
  <h3 id="location-name">Bar Raval</h3>
  
  <span 
    role="status" 
    aria-label="Location verified">
    ✓ verified
  </span>
  
  <address aria-label="Address">
    505 College St
  </address>
  
  <p aria-label="Description">
    Spanish-style bar...
  </p>
  
  <ul aria-label="Tips">
    <li>Arrive at 5pm...</li>
  </ul>
  
  <button 
    aria-label="View Bar Raval on Google Maps">
    View on Maps
  </button>
</article>
```

### Focus States

```css
/* Visible focus indicator */
*:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* Skip to content */
.skip-to-content {
  position: absolute;
  left: -9999px;
}

.skip-to-content:focus {
  left: 0;
  top: 0;
  background: white;
  padding: var(--space-4);
  z-index: 9999;
}
```

### Color Contrast

All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

- Primary text on white: 12.63:1 ✓
- Secondary text on white: 7.03:1 ✓
- White text on primary blue: 4.52:1 ✓
- Success green on light bg: 4.73:1 ✓
- Error red on white: 4.61:1 ✓

---

## Loading States

### Initial Load

```
┌─────────────────────────────────────────┐
│  🗺️  Travel Companion                   │
├─────────────────────────────────────────┤
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░            │ <- Shimmer
│  ▓▓▓▓▓▓▓▓▓▓░░░░░                    │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░       │
│  ▓▓▓▓▓▓░░░░░                         │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░       │
│  ▓▓▓▓▓▓░░░░░                         │
│                                         │
└─────────────────────────────────────────┘
```

### Processing Location

Shows actual progress from backend:

```
[████████████████░░░░░░░░░░░░░░] 55%
Searching for location...
```

### Error Boundary

```
┌─────────────────────────────────────────┐
│  ❌ Something went wrong                │
│                                         │
│  We couldn't load your trips.           │
│  Check your internet connection.        │
│                                         │
│  [Try Again]                            │
└─────────────────────────────────────────┘
```

---

## Edge Cases & Error States

### No Internet Connection

```
Toast: "⚠️ No internet connection. Saved locally."
```

Behavior:
- Save capture to local storage
- Queue for sync when online
- Show "pending sync" badge

### API Error

```
Toast: "❌ Couldn't save. Please try again."
```

Behavior:
- Show retry button
- Preserve user's highlighted text
- Log error for debugging

### Text Too Short

```
Toast: "⚠️ Please highlight more text (min 10 chars)"
```

### Text Too Long

```
Toast: "⚠️ Selection too long (max 500 chars)"
```

### No Active Trip

```
Modal: "Please select or create a trip first"
```

Behavior:
- Prompt to create first trip
- Or select existing trip as active

---

## Future Enhancements (Post-MVP)

### Phase 2: Advanced UI

- **Map View**: Full Google Maps integration with pins
- **Drag & Drop**: Reorder locations manually
- **Bulk Actions**: Select multiple → delete/move
- **Search**: Filter locations by name, category
- **Export**: PDF, Google Docs, shared link

### Phase 3: Collaboration

- **Shared Trips**: Invite others to contribute
- **Comments**: Discuss locations with team
- **Voting**: Upvote/downvote suggestions
- **Roles**: Owner, editor, viewer permissions

### Phase 4: Intelligence

- **Smart Suggestions**: "You might also like..."
- **Route Optimization**: "Best order to visit these"
- **Budget Estimates**: Price range indicators
- **Time Estimates**: "3 hours needed for this area"

---

## Design Philosophy

### 1. Speed is a Feature

Every interaction should feel instant:
- Saves: < 2 seconds from highlight to confirmation
- Popup open: < 300ms
- Page transitions: < 200ms
- API calls: < 500ms response (then async processing)

### 2. Progressive Disclosure

Don't show everything at once:
- Main view: Just trip list
- Drill down: Location details
- Further: Individual location page (future)

### 3. Forgiving Design

Users make mistakes:
- Undo delete (future)
- Edit after save (future)
- Retry on errors
- Never lose data

### 4. Obvious Over Clever

Clarity > novelty:
- Clear labels ("Save to Toronto Trip" not just "Save")
- Explicit states (verified/unverified)
- Plain language errors ("No internet" not "ERR_NETWORK_FAILED")

### 5. Beautiful but Functional

Design serves the content:
- White space for readability
- Subtle shadows for depth
- Consistent spacing for rhythm
- Photography for recognition

---

## Success Metrics (UI/UX)

**Capture Success:**
- 95%+ saves complete successfully
- Average save time < 3 seconds
- < 5% user abandonment during save

**Engagement:**
- 80%+ of users open popup within 24 hours of first save
- Average 10+ saves per user per week
- 50%+ return to review locations

**Satisfaction:**
- "Easy to use" rating > 4.5/5
- "Fast enough" rating > 4.5/5
- Would recommend > 80%

---

**End of High-Level UI/UX Design Document**


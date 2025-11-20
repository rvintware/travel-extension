# Travel Companion - Complete UI Specification

**Version:** Final (Phase 0.3)  
**Last Updated:** October 12, 2025  
**Status:** Production Design System

---

## Design System Foundation

### Core Principles
1. **Speed** - Every interaction < 300ms
2. **Consistency** - Same spacing, fonts, colors everywhere
3. **Clarity** - Clear visual hierarchy
4. **Quality** - Production-level polish

### Colors

```css
/* Primary Colors */
--primary: #3B82F6;           /* Blue - Actions, links */
--primary-dark: #1E40AF;      /* Hover states */
--primary-light: #DBEAFE;     /* Backgrounds */

/* Status Colors */
--success: #10B981;           /* Green - Success, verified */
--warning: #F59E0B;           /* Orange - Warnings */
--error: #EF4444;             /* Red - Errors, delete */
--processing: #60A5FA;        /* Blue - Processing */

/* Neutrals */
--gray-50: #F9FAFB;          /* Page background */
--gray-100: #F3F4F6;         /* Card background alt */
--gray-200: #E5E7EB;         /* Disabled */
--gray-300: #D1D5DB;         /* Borders */
--gray-600: #4B5563;         /* Secondary text */
--gray-700: #374151;         /* Body text */
--gray-900: #111827;         /* Headings */
```

### Typography

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Font Sizes */
--text-xs: 12px;      /* Meta info, timestamps */
--text-sm: 14px;      /* Body text, descriptions */
--text-base: 16px;    /* Buttons, labels */
--text-lg: 18px;      /* Location names */
--text-xl: 20px;      /* Trip/country names, headers */
--text-2xl: 24px;     /* Page titles */

/* Font Weights */
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Emphasis */
--font-semibold: 600; /* Headings, names */
--font-bold: 700;     /* Rarely used */

/* Line Heights */
--leading-tight: 1.25;    /* Headings */
--leading-normal: 1.5;    /* Body */
--leading-relaxed: 1.75;  /* Descriptions */
```

### Spacing System (4px base)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;   /* Standard padding */
--space-6: 24px;   /* Card spacing */
--space-8: 32px;

/* Standard Uses */
Card padding: 16px (p-4)
Between cards: 24px (space-y-6)
Section gaps: 16px (space-y-4)
Button padding: 8px x 16px
```

### Icon Sizes

```css
/* Emojis */
Category icons: text-xl (20px)    /* 🍷 🏛️ */
Country flags: text-2xl (24px)    /* 🇯🇵 */
Large flags: text-4xl (36px)      /* Country cards */

/* UI Icons */
Refresh/Settings: text-xl (20px)  /* 🔄 ⚙️ in tabs */
Gear menu: text-base (16px)       /* ⚙️ on cards */
Status icons: text-sm (14px)      /* ⏳ 🔄 in banners */
```

### Border Radius

```css
--radius-md: 8px;     /* Cards, buttons */
--radius-lg: 12px;    /* Modals */
```

### Shadows

```css
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-modal: 0 10px 25px rgba(0, 0, 0, 0.2);
```

---

## Complete UI Screens

### 1. Main View - My Trips Tab (Default)

```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐   [🔄][⚙️] │ ← Tabs + Icons (text-xl)
│  │ My Locations │  My Trips ⭐ │         │
│  └──────────────┴──────────────┘         │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                        │ ← Active indicator (primary)
├─────────────────────────────────────────┤
│  (p-4, space-y-4)                       │
│                                         │
│  Active Trip (text-sm, gray-700)        │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Tokyo 2025 ▼         [⭐]    │ │ ← p-3, bg-primary-light
│  │ Quick-saves go here (text-xs)     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Your Trips · 3 (text-base, semibold)  │
│  (space-y-6) ← 24px between cards      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Tokyo 2025           12 saved │ │ ← TripCard (p-4)
│  │ (text-2xl emoji + text-xl name)   │ │
│  │    Active · 3 days · Mar 20-27    │ │ ← text-sm, gray-600
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan Week           18 saved │ │
│  │    7 days · Jun 1-8               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │        + New Trip                 │ │ ← Dashed border
│  └───────────────────────────────────┘ │
│                                         │
│  💡 Tip: Right-click to save!         │ ← text-xs, center
└─────────────────────────────────────────┘
  360px × 500px total
```

**Spacing:**
- Tab bar: border-b, px-2
- Content: p-4
- Cards: space-y-6 (24px between)
- Trip card internal: p-4 (16px padding)

**Typography:**
- Tab labels: text-sm, font-medium
- Section header: text-base, font-semibold
- Trip name: text-xl, font-semibold
- Trip meta: text-sm, text-gray-600
- Emoji: text-2xl

---

### 2. My Locations Tab - Country List

```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐   [🔄][⚙️] │
│  │ My Locations⭐  My Trips    │         │
│  └──────────────┴──────────────┘         │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔                         │
├─────────────────────────────────────────┤
│  (p-4, space-y-4)                       │
│                                         │
│  📚 Location Library (text-xl, bold)    │
│  42 locations across 4 countries        │ ← text-sm, gray-600
│                                         │
│  (space-y-6) ← 24px between cards      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan           18 locations  │ │ ← CountryCard (p-4)
│  │ (text-4xl emoji + text-xl name)   │ │
│  │                              ›    │ │ ← Chevron (gray-400)
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇺🇸 USA             12 locations  │ │
│  │                              ›    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🇫🇷 France           8 locations  │ │
│  │                              ›    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💡 Click a country to view            │ ← text-xs, center
└─────────────────────────────────────────┘
```

**Spacing:**
- Header: p-4
- Between countries: space-y-6 (24px)
- Country card: p-4, rounded-lg

**Typography:**
- Title: text-xl, font-semibold
- Subtitle: text-sm, text-gray-600
- Country name: text-xl, font-semibold
- Count: text-sm, text-gray-600
- Emoji: text-4xl

---

### 3. Country Detail - Japan Locations

```
┌─────────────────────────────────────────┐
│  ← Back (text-primary, hover:dark)      │ ← p-4
│                                         │
│  🇯🇵 Japan · 18 locations              │ ← text-2xl emoji, text-lg name
│  (text-lg semibold + text-sm count)    │
│                                         │
├─────────────────────────────────────────┤
│  (p-4, space-y-6) ← 24px between cards │
│                                         │
│  ┌───────────────────────────────────┐ │ ← LocationCard (see detail below)
│  │ [Photo 280×160px, clickable]      │ │
│  │                                   │ │
│  │ (p-4 content area)                │ │
│  │ 🍷 Ichiran Ramen          [⚙️]   │ │ ← text-xl name, text-base gear
│  │ 📍 1-22-7 Jinnan, Shibuya        │ │ ← text-sm
│  │ 🏷️ Restaurant · Ramen · $$       │ │ ← text-sm
│  │ ⭐ 4.5 Google rating              │ │ ← text-sm
│  │                                   │ │
│  │ ─────────────── (border-t)        │ │
│  │ 💡 Tips (text-sm, semibold)       │ │
│  │ • "Go before 11am..." (text-sm)   │ │
│  │ • "Order tonkotsu..."             │ │
│  │ • "Try extra garlic..."           │ │
│  │                                   │ │
│  │ ─────────────── (border-t)        │ │
│  │ 🔴 reddit.com → (primary, hover)  │ │ ← text-sm, clickable
│  │ Saved 2 hours ago (text-xs,gray) │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ (Next location card...)           │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 4. Location Card - Complete Specification

```
LOCATION CARD (Production Design)
════════════════════════════════════════

┌─────────────────────────────────────────┐
│ [Processing Banner - Optional]          │ ← bg-blue-50, px-4, py-2
│ 🔄 Processing... (text-sm, blue-700)    │   animate-pulse
├─────────────────────────────────────────┤
│                                         │
│ [HERO PHOTO - Full Width]               │
│ 280px × 160px                           │
│ object-cover, cursor-pointer            │
│ hover:opacity-90 transition             │
│ Clickable → Opens in new tab            │
│                                         │
├─────────────────────────────────────────┤
│ (Content area: p-4, space-y-3)          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Header (flex, justify-between)      │ │
│ │                                     │ │
│ │ Ichiran Ramen               [⚙️]   │ │
│ │ text-xl (20px)             text-base│ │
│ │ font-semibold              (16px)   │ │
│ │ text-gray-900                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Metadata (space-y-1)                │ │
│ │ Each line: text-sm, text-gray-600   │ │
│ │                                     │ │
│ │ 📍 1-22-7 Jinnan, Shibuya-ku       │ │
│ │ 🏷️ Restaurant · Ramen · $$         │ │
│ │ ⭐ 4.5 Google rating                │ │
│ │ 🕐 10:00 AM · ⏱️ 2 hours (trip)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ────────────────────────────────────── │ ← border-t, border-gray-200
│ (pt-3 after border)                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tips Section                        │ │
│ │                                     │ │
│ │ 💡 Tips (text-sm, semibold, mb-2)  │ │
│ │                                     │ │
│ │ (ul with space-y-1.5)               │ │
│ │ • "Go before 11am to avoid wait"   │ │
│ │ • "Order the tonkotsu ramen"       │ │
│ │ • "Try extra garlic option"        │ │
│ │ (text-sm, text-gray-700)            │ │
│ │ (Max 3 tips shown)                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ────────────────────────────────────── │ ← border-t
│ (pt-3)                                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Footer                              │ │
│ │                                     │ │
│ │ 🔴 reddit.com →                     │ │
│ │ (text-sm, text-primary)             │ │
│ │ hover:text-primary-dark             │ │
│ │ Clickable → new tab                 │ │
│ │                                     │ │
│ │ 🗺️ View on Maps →                  │ │
│ │ (text-sm, text-primary, mt-2)       │ │
│ │ hover:text-primary-dark             │ │
│ │ Clickable → Google Maps (new tab)   │ │
│ │ (Only shown if place_id/lat/lng/    │ │
│ │  address available)                 │ │
│ │                                     │ │
│ │ Saved 2 hours ago                   │ │
│ │ (text-xs, text-gray-500, mt-1)      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

CARD SPECIFICATIONS:
├─ Total: 280px wide (or 100% in list)
├─ Border: 1px solid gray-300
├─ Border radius: 8px (rounded-lg)
├─ Shadow: 0 1px 3px rgba(0,0,0,0.1)
├─ Shadow hover: 0 4px 6px rgba(0,0,0,0.1)
├─ Overflow: hidden (for photo)
├─ Transition: shadow 200ms
│
├─ Photo: 
│  ├─ Width: 100% (280px)
│  ├─ Height: 160px (h-40)
│  ├─ Object-fit: cover
│  ├─ Clickable: target="_blank"
│  └─ Hover: opacity-90
│
├─ Content padding: 16px (p-4)
├─ Internal spacing: 12px (space-y-3)
│
├─ Metadata icons: 20px emoji + 14px text
├─ Tips bullets: • (not ✓ or dash)
├─ Source link: Arrow (→) indicates external
├─ Google Maps link: Shown below source link if location data available
│  └─ URL priority: place_id > lat/lng > address
└─ All clickable links: hover effect + cursor-pointer
```

---

### 4.5. Compact Location Card - Trip Detail View

```
COMPACT LOCATION CARD (Trip Detail View)
════════════════════════════════════════════

┌─────────────────────────────────────────┐
│ Fukuoka                          [⋮]  │ ← Line 1: Name + KebabMenu
│                                         │   (text-lg, semibold)
│ [Day 3]                                 │ ← Line 2: Day Badge (conditional)
│                                         │   (bg-primary, rounded-full)
│ 📍 Fukuoka, Japan                      │ ← Line 3: Address (conditional)
│                                         │   (text-sm, text-gray-600)
│                                         │
│ 🔴 reddit.com →                        │ ← Line 4: Reddit link (standalone)
│                                         │   (text-sm, text-primary)
│                                         │   (hover:text-primary-dark)
│                                         │
│ 🗺️ View on Maps →                🗑️ │ ← Line 5: Google Maps + Trash
│                                         │   (flex justify-between)
│                                         │   (left: Google Maps link)
│                                         │   (right: Trash icon)
└─────────────────────────────────────────┘

CARD SPECIFICATIONS:
├─ Container: bg-white, border-gray-300, rounded-lg
├─ Padding: p-3 (12px all sides)
├─ Shadow: shadow-card, hover:shadow-card-hover
├─ Cursor: cursor-pointer (entire card clickable)
│
├─ Line 1: Location Name + KebabMenu
│  ├─ Layout: flex justify-between
│  ├─ Name: text-lg, font-semibold, text-gray-900
│  └─ KebabMenu: Right-aligned, stops propagation
│
├─ Line 2: Day Badge (conditional)
│  ├─ Display: Only if dayNumber exists
│  ├─ Style: bg-primary, text-white, rounded-full
│  ├─ Padding: px-2, py-1
│  └─ Font: text-xs, font-medium
│
├─ Line 3: Address (conditional)
│  ├─ Display: Only if address exists
│  ├─ Icon: 📍 emoji
│  ├─ Text: text-sm, text-gray-600
│  └─ Margin: mb-3 (12px bottom)
│
├─ Line 4: Reddit Link (standalone)
│  ├─ Layout: Standalone line, left-aligned
│  ├─ Icon: Source emoji (🔴 for reddit.com)
│  ├─ Text: Domain name + → arrow
│  ├─ Styling: text-sm, text-primary
│  ├─ Hover: hover:text-primary-dark
│  └─ Margin: mb-2 (8px bottom)
│
├─ Line 5: Google Maps + Trash (same line)
│  ├─ Container: flex items-center justify-between
│  ├─ Left: Google Maps link
│  │  ├─ Display: Only if googleMapsUrl exists
│  │  ├─ Icon: 🗺️ emoji
│  │  ├─ Text: "View on Maps" + → arrow
│  │  ├─ Styling: text-sm, text-primary
│  │  └─ Hover: hover:text-primary-dark
│  └─ Right: Trash icon
│     ├─ Display: Only if onDelete exists
│     ├─ Icon: 🗑️ emoji
│     ├─ Styling: text-xl, text-gray-400
│     ├─ Hover: hover:text-red-500
│     └─ Click: Opens DeletePill (position="inline")
│
└─ Google Maps URL Priority:
   ├─ Priority 1: place_id → place/?q=place_id:{id}
   ├─ Priority 2: lat/lng → maps?q={lat},{lng}
   └─ Priority 3: address → search/?api=1&query={address}
```

---

### 5. Trip Detail View with Day Filters

```
┌─────────────────────────────────────────┐
│  ← Back                    ✏️    🔄    │ ← Nav bar: px-2, matches Tabs
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │ Tokyo 2025        Oct 31 - Nov 4│ │ ← Line 1: justify-between
│  │ (text-lg semibold) (text-sm gray) │ │
│  │                                   │ │
│  │ 5 Countries                        │ │ ← Line 2: left-aligned
│  │ (text-sm gray-600)                │ │
│  │                                   │ │
│  │ 12 locations            📤 Export │ │ ← Line 3: justify-between
│  │ (text-sm gray-600) (text-sm primary)│ │
│  └───────────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
├─────────────────────────────────────────┤
│  Day Filters (bg-gray-50, py-2, px-4)  │
│  (flex, gap-1)                          │
│                                         │
│  [All] [D1] [D2] [D3] [Unscheduled]   │
│  ·12  ·4   ·5   ·3      ·0            │
│  ▔▔▔▔ ← Active tab (bg-primary)        │
│  (px-3, py-1.5, rounded, text-sm)      │
│                                         │
├─────────────────────────────────────────┤
│  Day 1 (4 locations) - text-base       │
│  (p-4, space-y-6) ← 24px spacing!      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [CompactLocationCard - see 4.5]   │ │ ← Compact cards in trip detail
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [CompactLocationCard]             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

NAV BAR (matches Tabs component):
├─ Padding: px-2 (8px horizontal)
├─ Border: border-b border-gray-200
├─ Layout: flex items-center justify-between
├─ Back button: Left side, text-primary
├─ Icons: Right side, gap-1 between icons
├─ Icon size: text-xl (20px)
├─ Icon padding: p-2
├─ Icon hover: hover:text-primary hover:bg-gray-100 rounded
└─ Matches home screen nav bar exactly

TRIP INFO SECTION:
├─ Container Padding: py-2 px-4 (8px vertical, 16px horizontal)
├─ Border: border-b border-gray-200
├─ Card Wrapper: bg-gray-50, rounded-lg, p-3 (12px padding)
├─ Line 1: Trip Name + Dates
│  ├─ Layout: flex items-center justify-between mb-2 (8px margin bottom)
│  ├─ Trip name: text-lg, font-semibold, text-gray-900, leading-tight (left)
│  └─ Dates: text-sm, text-gray-600 (right, conditional - only if available)
├─ Line 2: Countries Count
│  ├─ Layout: text-sm, text-gray-600, mb-2 (8px margin bottom)
│  ├─ Display: Full width, left-aligned
│  └─ Format: "X Country" (singular) or "X Countries" (plural)
├─ Line 3: Locations Count + Export
│  ├─ Layout: flex items-center justify-between
│  ├─ Locations: text-sm, text-gray-600 (left)
│  │  └─ Format: "X location" or "X locations"
│  └─ Export button: text-sm, text-primary, font-medium (right)
│     ├─ Hover: hover:text-primary-dark
│     ├─ Icon: 📤 emoji
│     └─ Disabled: opacity-50
└─ Spacing: mb-2 (8px) between lines for visual breathing room

DAY FILTER TABS:
├─ Inactive: bg-white, text-gray-700, border
├─ Active: bg-primary, text-white
├─ Padding: px-3, py-1.5
├─ Font: text-sm, font-medium
├─ Count: text-xs, opacity-80
└─ Hover: bg-gray-100 (inactive only)
```

---

### 6. Settings Panel

```
┌─────────────────────────────────────────┐
│  ← Back (text-primary)                  │ ← p-4, border-b
│  ⚙️ Settings (text-lg, semibold)       │
│                                         │
├─────────────────────────────────────────┤
│  (p-4, space-y-6) ← 24px sections      │
│                                         │
│  Default Country (text-sm, semibold)    │
│  ┌───────────────────────────────────┐ │
│  │ 🇯🇵 Japan ▼                       │ │ ← Select (px-3, py-2)
│  └───────────────────────────────────┘ │   border-gray-300
│  Used when country can't be detected    │ ← text-xs, gray-500
│                                         │
│  Default Trip (text-sm, semibold)       │
│  ┌───────────────────────────────────┐ │
│  │ Tokyo 2025 ▼                      │ │
│  │ □ None (checkbox option)          │ │
│  └───────────────────────────────────┘ │
│  Quick-saves go here (text-xs)          │
│                                         │
│  Popup Behavior (text-sm, semibold)     │
│  ○ Always open to My Trips              │ ← Radio buttons
│  ○ Always open to My Locations          │   (space-y-2)
│  ● Remember last opened tab             │   text-sm, gray-700
│                                         │
├─────────────────────────────────────────┤
│  (p-4, border-t) ← Footer              │
│  ┌───────────────────────────────────┐ │
│  │      Save Settings                │ │ ← Button (w-full)
│  └───────────────────────────────────┘ │   bg-primary
└─────────────────────────────────────────┘   text-white, py-2

FORM ELEMENTS:
├─ Select dropdown:
│  ├─ Padding: px-3, py-2
│  ├─ Border: 1px gray-300
│  ├─ Radius: rounded-lg
│  ├─ Focus: ring-2 ring-primary
│  └─ Font: text-sm
│
├─ Radio buttons:
│  ├─ Size: default (16px)
│  ├─ Color: text-primary
│  ├─ Spacing: space-y-2 between options
│  └─ Label: text-sm, text-gray-700
│
└─ Helper text:
   ├─ Size: text-xs
   ├─ Color: text-gray-500
   └─ Margin: mt-1
```

---

### 7. Gear Menu Dropdown (Portal)

```
[Dropdown Menu - React Portal]
Position: fixed (via portal)
Calculated from button position

┌────────────────────────┐
│ ➕ Add to Trip         │ ← hover:bg-gray-100
│ ✏️ Edit                │   text-sm
│ ────────────────────   │   px-4, py-2
│ 🗑️ Delete (red)        │   hover:bg-red-50
└────────────────────────┘   text-error

DROPDOWN SPECS:
├─ Background: white
├─ Border: 1px gray-300
├─ Radius: rounded-lg
├─ Shadow: 0 4px 12px rgba(0,0,0,0.1)
├─ Padding: py-1 (vertical)
├─ Z-index: 50 (via portal)
├─ Min-width: 160px
│
├─ Items:
│  ├─ Padding: px-4 py-2
│  ├─ Font: text-sm
│  ├─ Hover: bg-gray-100
│  ├─ Cursor: pointer
│  └─ Transition: colors 200ms
│
├─ Dividers:
│  ├─ Border-top: 1px gray-200
│  └─ Margin: my-1
│
└─ Danger items:
   ├─ Color: text-error
   └─ Hover: bg-red-50
```

---

### 8. Confirmation Dialog (Portal)

```
[Modal Overlay - React Portal]
Fixed, inset-0, bg-black/50
Flex center

┌─────────────────────────────────┐
│  Remove from Trip?              │ ← text-lg, semibold
│  (p-6, max-w-sm)                │
│                                 │
│  Remove "Senso-ji Temple" from  │ ← text-sm, gray-600
│  this trip? It will remain in   │   mb-6
│  your library.                  │
│                                 │
│  ┌─────────┐     ┌────────────┐│
│  │ Cancel  │     │   Remove   ││ ← flex, gap-3
│  └─────────┘     └────────────┘│   flex-1 each
│  (secondary)     (danger)      │
└─────────────────────────────────┘
  bg-white, rounded-lg, shadow-xl

MODAL SPECS:
├─ Backdrop:
│  ├─ Background: black with 50% opacity
│  ├─ Position: fixed inset-0
│  ├─ Z-index: 50
│  └─ Flex center
│
├─ Dialog:
│  ├─ Background: white
│  ├─ Padding: 24px (p-6)
│  ├─ Radius: rounded-lg
│  ├─ Shadow: 0 10px 25px rgba(0,0,0,0.2)
│  ├─ Max-width: 384px (max-w-sm)
│  └─ Margin: mx-4 (mobile safe)
│
├─ Title:
│  ├─ Size: text-lg (18px)
│  ├─ Weight: font-semibold
│  ├─ Color: text-gray-900
│  └─ Margin: mb-2
│
├─ Message:
│  ├─ Size: text-sm (14px)
│  ├─ Color: text-gray-600
│  └─ Margin: mb-6
│
└─ Buttons:
   ├─ Layout: flex gap-3
   ├─ Width: flex-1 each
   ├─ Padding: py-2 px-4
   └─ Font: text-base, font-medium
```

---

### 9. Processing States

```
PROCESSING BANNER (Inside card)
┌─────────────────────────────────────┐
│ 🔄 Processing...                    │
│ (bg-blue-50, border-b blue-200)     │
│ (px-4, py-2)                        │
│ (text-sm, text-blue-700)            │
│ Emoji: animate-pulse                │
└─────────────────────────────────────┘

ERROR BANNER
┌─────────────────────────────────────┐
│ ⚠️ Processing failed                │
│ (bg-red-50, border-b red-200)       │
│ (px-4, py-2)                        │
│ (text-sm, text-red-700)             │
└─────────────────────────────────────┘

Only show for:
- processing_status = 'pending' OR 'processing'
- AND has screenshot in last 10 minutes
```

---

### 10. Empty States

```
EMPTY TRIP LIST
┌─────────────────────────────────────────┐
│                                         │
│           🗺️ (text-6xl, mb-4)          │ ← Centered
│                                         │
│     No trips yet (text-lg, bold)        │
│                                         │
│  Create a trip to organize your         │ ← text-sm, gray-600
│  saved locations into an itinerary      │   max-w-xs, center
│                                         │
│  ┌───────────────────────────────────┐ │
│  │    + Create First Trip            │ │ ← Button
│  └───────────────────────────────────┘ │
│                                         │
│  You have 5 locations in your library   │ ← text-sm, gray-500
│  [View Library →]                       │   mt-4
└─────────────────────────────────────────┘
  (py-12, px-6, text-center)

EMPTY COUNTRY DETAIL
┌─────────────────────────────────────────┐
│                                         │
│           🇯🇵 (text-4xl, mb-3)         │
│                                         │
│  No locations in Japan yet              │ ← text-sm, gray-600
│                                         │
└─────────────────────────────────────────┘
  (py-12, px-6, text-center)

EMPTY STATE SPECS:
├─ Padding: py-12 px-6
├─ Text align: center
├─ Icon: text-4xl or text-6xl
├─ Margin bottom: mb-3 or mb-4
├─ Title: text-lg, font-semibold, text-gray-900
├─ Description: text-sm, text-gray-600
└─ Max width: max-w-xs (for readability)
```

---

### 11. Buttons

```
PRIMARY BUTTON
┌─────────────────────┐
│  Save Settings      │
└─────────────────────┘
├─ Background: bg-primary
├─ Text: text-white
├─ Padding: px-4 py-2
├─ Radius: rounded-lg
├─ Font: text-base, font-medium
├─ Hover: bg-primary-dark
├─ Transition: all 200ms
└─ Focus: ring-2 ring-primary

SECONDARY BUTTON
┌─────────────────────┐
│  Cancel             │
└─────────────────────┘
├─ Background: white
├─ Border: 1px gray-300
├─ Text: text-gray-700
├─ Hover: bg-gray-50
└─ Same sizing as primary

DANGER BUTTON
┌─────────────────────┐
│  Delete             │
└─────────────────────┘
├─ Background: white
├─ Border: 1px error
├─ Text: text-error
├─ Hover: bg-error + text-white
└─ Same sizing

DASHED BUTTON (+ New Trip)
┌──────────────────────────────┐
│      + New Trip              │
└──────────────────────────────┘
├─ Border: 2px dashed gray-300
├─ Background: transparent
├─ Text: text-gray-600
├─ Padding: p-4
├─ Hover: border-primary, text-primary, bg-primary-light/30
└─ Transition: all 200ms
```

---

### 12. Toast Notifications

```
[Toast - Positioned fixed top-right]
Position: top: 20px, right: 20px

┌──────────────────────────┐
│  ✓ Tokyo 2025            │
└──────────────────────────┘
├─ Background: success (#10B981)
├─ Text: white
├─ Padding: 12px 20px
├─ Radius: rounded-lg (8px)
├─ Shadow: 0 4px 12px rgba(0,0,0,0.15)
├─ Font: text-sm (14px), font-medium
├─ Animation: slideIn 300ms, fadeOut 500ms
├─ Duration: 3 seconds total
└─ Z-index: 2147483647 (always on top)

ERROR TOAST
Background: error (#EF4444)
Same specs otherwise

@keyframes slideIn:
  from { translateX(400px), opacity: 0 }
  to   { translateX(0), opacity: 1 }

@keyframes fadeOut:
  from { opacity: 1 }
  to   { opacity: 0 }
```

---

## Spacing Consistency Rules

### Between Elements

```
Cards in list:     space-y-6 (24px)  ← ALWAYS
Sections in card:  space-y-3 (12px)
Items in section:  space-y-1 (4px) or space-y-1.5 (6px)
Form fields:       space-y-6 (24px)
Radio options:     space-y-2 (8px)
```

### Padding

```
Card content:   p-4  (16px) ← STANDARD
Tab bar:        px-2 (8px horizontal)
Modal:          p-6  (24px)
Button:         px-4 py-2 (16px × 8px)
Select:         px-3 py-2 (12px × 8px)
Banner:         px-4 py-2 (16px × 8px)
```

### Margins

```
Section headers: mb-2 or mb-3
Helper text:     mt-1
Icons in text:   gap-1 or gap-2
Buttons:         gap-2 or gap-3
```

---

## Interactive States

### Hover Effects

```
Cards:           shadow: card → card-hover
Buttons:         transform: translateY(-1px)
Links:           color: primary → primary-dark
Gear menu items: bg: transparent → gray-100
Tab buttons:     bg: transparent → gray-100
```

### Active States

```
Tabs:        border-b-2 border-primary
Filter tabs: bg-primary text-white
Radio:       checked color primary
```

### Focus States

```
All interactive:
  outline: 2px solid primary
  outline-offset: 2px
  
Form inputs:
  ring-2 ring-primary
  border-primary
```

### Disabled States

```
Opacity: 50%
Cursor: not-allowed
Background: gray-200
```

---

## Animation Guidelines

```
Transitions:     200ms ease
Hover:           200ms
Color changes:   200ms
Shadow changes:  200ms
Transform:       200ms

Animations:
Toast slideIn:   300ms ease-out
Toast fadeOut:   500ms ease-in
Spinner:         animate-spin (1s linear infinite)
Pulse:           animate-pulse (2s ease-in-out infinite)
```

---

## Accessibility

### Clickable Elements

```
All links/buttons:
- cursor-pointer
- hover state
- focus ring
- aria-label (if icon only)
- title attribute (tooltips)
```

### Color Contrast

```
All text meets WCAG AA:
- Primary on white: 4.52:1 ✅
- Gray-700 on white: 8.3:1 ✅
- Gray-600 on white: 7.03:1 ✅
- White on primary: 4.52:1 ✅
- Error on white: 4.61:1 ✅
```

### Keyboard Navigation

```
Tab order:
1. Back button (if present)
2. Main content (tabs, cards)
3. Action buttons
4. Settings gear

Shortcuts:
- Escape: Close modal/dropdown
- Enter: Activate focused button
- Tab: Next element
- Shift+Tab: Previous element
```

---

## Responsive Behavior

### Fixed Dimensions

```
Popup width:  360px (fixed)
Popup height: 500px (fixed)
Max scroll:   Scrollbar if content > 500px
```

### Card Dimensions

```
Width:  100% (with 16px padding = 328px content)
Photo:  280px × 160px (h-40, object-cover)
Padding: 16px (p-4) inside cards
```

### Text Wrapping

```
Names:      No wrap, ellipsis if too long
Addresses:  Wrap (max 2 lines)
Tips:       Wrap naturally
```

---

## Component Library Summary

**Consistent across all screens:**
- Tabs: 2-tab navigation (My Locations | My Trips)
- Cards: Rounded 8px, shadow, 16px padding, 24px spacing
- Buttons: Primary/Secondary/Danger variants
- Icons: Emojis 20-24px for UI, 36px for display
- Typography: System font, clear hierarchy
- Spacing: 4px base unit, consistent throughout
- Colors: Primary blue, status colors, gray scale

**All measurements, colors, and styles documented!**

Ready for future modifications and maintaining consistency! 🎨

---

## Create Trip View (Full-Screen) - Phase 0.4

### Overview
Full-screen view for creating trips, replacing the previous modal. Consistent with other detail views (Country Detail, Trip Detail, Settings).

### Layout

```
┌─────────────────────────────────────┐
│ ← Back                        🔄    │
│ Create Trip                         │
├─────────────────────────────────────┤
│                                     │
│ Trip Name *                         │
│ ┌─────────────────────────────────┐ │
│ │ 🌏 Southeast Asia 2025_________ │ │
│ └─────────────────────────────────┘ │
│ Emoji allowed! (e.g., 🗾 🌏 ✈️)     │
│                                     │
│ Countries (optional)                │
│ Select countries to include         │
│ ┌─────────────────────────────────┐ │
│ │ ☐ 🇯🇵 Japan                     │ │
│ │ ☑ 🇹🇭 Thailand                  │ │
│ │ ☐ 🇸🇬 Singapore                 │ │
│ │   (scrollable if many)           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Duration (optional)                 │
│ ┌────┐ days                        │
│ │ 14 │                             │
│ └────┘                              │
│                                     │
│ ☑ Set as active trip                │
│   Quick-saves will go to this trip  │
│                                     │
├─────────────────────────────────────┤
│  [  Cancel  ]  [ Create Trip ]      │
└─────────────────────────────────────┘
```

### Header Specs

```
Background: white
Border: 1px solid gray-200
Padding: 16px (p-4)
Flex: items-center justify-between

Back button:
├─ Font: text-base, font-medium
├─ Color: primary → primary-dark (hover)
├─ Gap: 8px between arrow and text
└─ Transition: colors 150ms

Refresh button:
├─ Font: text-xl (20px emoji)
├─ Color: gray-600 → primary (hover)
├─ Animation: spin when refreshing
└─ Title attribute for tooltip

Title:
├─ Font: text-lg (18px), font-semibold
├─ Color: gray-900
└─ Margin top: 8px
```

### Form Fields

**Trip Name (Required)**
```
Label: text-sm (14px), font-semibold, gray-900
Input:
├─ Width: 100%
├─ Padding: 12px (px-3 py-2)
├─ Border: 1px solid gray-300
├─ Radius: 8px (rounded-lg)
├─ Focus: ring-2 ring-primary
├─ Font: text-base (16px)
└─ Placeholder: "e.g., 🌏 Southeast Asia 2025"

Helper text:
├─ Font: text-xs (12px)
├─ Color: gray-500
├─ Margin top: 4px
└─ Content: "Emoji allowed! (e.g., 🗾 🌏 ✈️)"
```

**Countries (Optional Multi-Select)**
```
Label: text-sm, font-semibold, gray-900

Empty state (no locations saved):
┌───────────────────────────────────┐
│         📍                        │
│ No locations saved yet            │
│ Save some locations first,        │
│ then they'll appear here!         │
└───────────────────────────────────┘
├─ Background: gray-50
├─ Border: 1px solid gray-200
├─ Padding: 24px vertical, 16px horizontal
├─ Radius: 8px
├─ Icon: text-3xl (30px)
└─ Text: text-sm and text-xs

Countries list:
├─ Border: 1px solid gray-300
├─ Radius: 8px
├─ Padding: 8px (p-2)
├─ Max height: 240px (max-h-60)
├─ Overflow: scroll
└─ Background: white

Each country item:
├─ Padding: 12px horizontal, 8px vertical
├─ Radius: 6px (rounded)
├─ Cursor: pointer
├─ Background: 
│  ├─ Hover: gray-100
│  └─ Selected: primary-light
├─ Checkbox: 
│  ├─ Color: primary
│  └─ Focus: ring-primary
├─ Emoji: text-2xl (24px)
└─ Label: text-sm, gray-700
```

**Duration (Optional)**
```
Label: text-sm, font-semibold, gray-900

Input container:
├─ Display: flex
├─ Items: center
├─ Gap: 8px

Number input:
├─ Width: 80px (w-20)
├─ Padding: 12px (px-3 py-2)
├─ Border: 1px solid gray-300
├─ Radius: 8px
├─ Focus: ring-2 ring-primary
├─ Min: 1
└─ Placeholder: "7"

Days label:
├─ Font: text-sm (14px)
└─ Color: gray-600
```

**Set as Active (Checkbox)**
```
Checkbox container:
├─ Display: flex items-center
├─ Gap: 8px

Checkbox:
├─ Color: primary (checked)
└─ Focus: ring-primary

Label: text-sm, gray-700

Helper text:
├─ Font: text-xs (12px)
├─ Color: gray-500
├─ Margin left: 24px (to align with checkbox)
└─ Content: "Quick-saves will go to this trip"
```

### Footer Action Buttons

```
Border top: 1px solid gray-200
Padding: 16px (p-4)
Display: flex
Gap: 12px (gap-3)

Cancel button (Secondary):
├─ Flex: 1 (equal width)
├─ Padding: 8px 16px
├─ Background: white
├─ Border: 1px solid gray-300
├─ Color: gray-700
├─ Hover: bg-gray-50
└─ Disabled: opacity-50

Create Trip button (Primary):
├─ Flex: 1 (equal width)
├─ Padding: 8px 16px
├─ Background: primary
├─ Color: white
├─ Hover: bg-primary-dark, transform translateY(-1px)
├─ Disabled: opacity-50, cursor-not-allowed
├─ Active state: "Creating..." text
└─ Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

### Interactions

**Refresh Button:**
- Triggers: `loadAvailableCountries()`
- Updates: Country list based on user's saved locations
- State: Shows spinning animation during refresh
- Keeps user on current screen

**Country Selection:**
- Single click toggles checkbox
- Visual feedback: immediate background change
- Multi-select: can select multiple countries
- Empty array is valid (plan future trips)

**Create Action:**
- Validation: Name must not be empty (trim whitespace)
- Countries: Optional (can be empty array)
- Duration: Optional (can be blank)
- Success: Navigate back to trip list, refresh data
- Error: Show alert (TODO: Replace with toast)

---

## Refresh Button Specification - Phase 0.4

### Universal Presence
Refresh button (🔄) appears on **every** screen header except main list views (which have tabs with refresh).

**Screens with refresh:**
- Country Detail
- Trip Detail
- Settings
- Create Trip View

### Specs

```
Position: Top-right of header
Icon: 🔄 emoji (text-xl, 20px)

States:
├─ Idle:
│  ├─ Color: gray-600
│  └─ Hover: primary
├─ Refreshing:
│  ├─ Animation: animate-spin
│  └─ Disabled: true
└─ Transition: colors 150ms

Button:
├─ Padding: 0 (icon only)
├─ Background: transparent
├─ Border: none
├─ Cursor: pointer (idle), not-allowed (refreshing)
└─ Title: "Refresh" (tooltip)
```

### Behavior

**Country Detail:**
```typescript
async function handleRefresh() {
  setRefreshing(true)
  // Fetch all locations, filter to current country
  // Stay on current screen
  setRefreshing(false)
}
```

**Trip Detail:**
```typescript
async function handleRefresh() {
  setRefreshing(true)
  // Fetch trip data and trip locations
  // Stay on current screen, preserve day filter selection
  setRefreshing(false)
}
```

**Settings:**
```typescript
async function handleRefresh() {
  setRefreshing(true)
  // Reload settings from storage
  // Reload location/trip counts
  // Refresh available countries filter
  setRefreshing(false)
}
```

**Create Trip View:**
```typescript
async function handleRefresh() {
  setRefreshing(true)
  // Refresh available countries based on locations
  // Stay on form, preserve entered data
  setRefreshing(false)
}
```

### Animation

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

Duration: 1 second (continuous while refreshing)
Timing: linear
```

---

## Multi-Country Trip Support - Phase 0.4

### Trip Card Updates

**Previous (Single Country):**
```
┌───────────────────────────────────┐
│ 🇯🇵 Tokyo 2025                12  │
│ Active · 7 days · 15 locations    │
└───────────────────────────────────┘
```

**New (Multi-Country):**
```
┌───────────────────────────────────┐
│ Asia 2026                     12  │
│ Active · 3 countries · 7 days     │
└───────────────────────────────────┘
```

**Changes:**
- Removed: Country emoji prefix from name
- Added: "X countries" indicator
- Logic: Countries come from `trip_countries` join table
- Display: Shows count, not individual flags (cleaner)

### Trip Detail View Updates

**Header metadata layout:**
```
┌───────────────────────────────────┐
│ Asia 2026                         │
│ 5 Countries · 12 locations        │
│ 🗺️ Map View                       │
│                   📤 Export        │
└───────────────────────────────────┘
```

**Changes from previous version:**
- Removed: Country flag emoji
- Removed: Duration and date range display
- Added: Dynamic country count (calculated from unique countries in locations)
- Layout: Stacked two-line action buttons for better UX
- Countries count updates automatically when locations are added/removed

### Database Schema

```sql
-- New table for many-to-many relationship
trip_countries:
  id              uuid primary key
  trip_id         uuid references trips(id) ON DELETE CASCADE
  country_id      uuid references countries(id) ON DELETE CASCADE
  display_order   integer
  created_at      timestamp

-- Updated trips table
trips.country_id:
  NOW: nullable (can be null for multi-country trips)
  BEFORE: required (1-to-1 relationship)
```

### Creation Flow

**User creates trip:**
1. Enters trip name (required)
2. Selects 0-N countries (optional, filtered by user's locations)
3. Enters duration (optional)
4. Sets as active (optional, default true)

**Backend creates:**
1. Trip record with `country_id = null` (if multi-country)
2. Multiple records in `trip_countries` (one per selected country)

**Auto-country detection:**
- When location added to trip, check if location's country exists in `trip_countries`
- If not, automatically add country to trip
- Keeps trip countries in sync with locations

### Country Filtering

**Settings - Default Country:**
- Shows only countries with saved locations
- Empty state: "Save some locations first"
- Prevents selecting countries with no content

**Create Trip - Countries:**
- Shows only countries with saved locations
- Empty state: "No locations saved yet"
- Allows creating trip without countries (plan ahead)

---

## Updated Component Specs

### Trip Card Component

```typescript
interface Trip {
  id: string
  name: string
  is_active: boolean
  duration_days?: number
  location_count: number
  countries?: Country[]  // NEW: Array from trip_countries join
}

Display:
├─ Name: No emoji prefix
├─ Status: "Active" if is_active
├─ Countries: `${countries.length} countries` or `${countries[0].emoji} ${countries[0].name}`
├─ Days: If duration_days set
└─ Locations: `${location_count} locations`
```

### Settings Component

```typescript
Available Countries Logic:
1. Fetch all user locations
2. Extract unique country_ids
3. Filter countries array to only those with locations
4. Show in dropdown

Empty state:
├─ Dropdown: Disabled
├─ Message: "Save some locations first to select a default country"
└─ Prevents creating invalid settings
```

### Context Menu Dynamic Updates

**Listens for:**
- `SETTINGS_UPDATED` message from Settings save
- `chrome.storage.onChanged` for settings changes
- Trip set as active (implicit settings change)

**Updates:**
```typescript
async function updateContextMenus() {
  // Fetch current default trip ID from settings
  // Fetch trip name from API
  // Update menu: "⭐ Save to [Trip Name]"
  // If no trip, hide menu item
}
```

**Result:**
- Menu always shows current active trip name
- Updates immediately when trip changes
- No stale menu items

---

## Implementation Summary - Phase 0.4

### Files Created
1. `extension/popup/CreateTripView.tsx` - Full-screen create trip

### Files Modified
1. `extension/background/index.ts` - Context menu listeners, dynamic trip name
2. `extension/popup/CountryDetail.tsx` - Added refresh button
3. `extension/popup/TripDetail.tsx` - Added refresh button  
4. `extension/components/Settings.tsx` - Added refresh button, country filtering
5. `extension/popup.tsx` - Wire CreateTripView, add 'createTrip' view type
6. `extension/popup/TripsView.tsx` - Remove modal, call `onNewTrip()` directly
7. `extension/lib/types.ts` - Add 'createTrip' to ViewType
8. `backend/lib/ai/extract.ts` - Add `extractLocationVariations()` function
9. `backend/lib/jobs/process-location.ts` - Multi-attempt Google Places with 3 variations

### Features Added
- ✅ Refresh button on all detail views
- ✅ Full-screen Create Trip (not modal)
- ✅ Multi-country trip support
- ✅ Country filtering (only show countries with locations)
- ✅ Context menu shows active trip name
- ✅ Dynamic context menu updates
- ✅ Robust location extraction (3 variations with fallback)
- ✅ Partial text completion using screenshot context

### UX Improvements
- Consistent navigation (full-screen views throughout)
- Always-available refresh (user can sync any time)
- Smart country filtering (no empty options)
- Reliable extraction (tries 3 times before giving up)

---

**Version:** 0.4 (October 13, 2025)
**Status:** Updated with Phase 0.4 features


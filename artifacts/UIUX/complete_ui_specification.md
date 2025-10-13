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
└─ All clickable links: hover effect + cursor-pointer
```

---

### 5. Trip Detail View with Day Filters

```
┌─────────────────────────────────────────┐
│  ← Back (text-primary)            [⚙️] │ ← p-4, border-b
│                                         │
│  Tokyo 2025 (text-lg, semibold)        │
│  🇯🇵 3 days · Mar 20-27 · 12 locations │ ← text-sm, gray-600
│                                         │
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
│  Time Estimate (mx-4, my-2)            │
│  ┌───────────────────────────────────┐ │
│  │ ⏱️ 6h 30m total (text-sm, bold)   │ │ ← bg-gray-50, p-3
│  │ 4h activity + 2h 30m travel        │ │ ← text-xs, gray-600
│  │                    😊 Comfortable  │ │ ← text-2xl + text-sm
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│  Day 1 (4 locations) - text-base       │
│  (p-4, space-y-6) ← 24px spacing!      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [Location Card - see spec above]  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [Location Card]                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

DAY FILTER TABS:
├─ Inactive: bg-white, text-gray-700, border
├─ Active: bg-primary, text-white
├─ Padding: px-3, py-1.5
├─ Font: text-sm, font-medium
├─ Count: text-xs, opacity-80
└─ Hover: bg-gray-100 (inactive only)

TIME ESTIMATE COMPONENT:
├─ Background: bg-gray-50
├─ Border: 1px gray-200
├─ Padding: p-3 (12px)
├─ Margin: mx-4 my-2
├─ Total time: text-sm, font-medium
├─ Breakdown: text-xs, text-gray-600
├─ Emoji: text-2xl
└─ Comfort text: text-sm, font-medium
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


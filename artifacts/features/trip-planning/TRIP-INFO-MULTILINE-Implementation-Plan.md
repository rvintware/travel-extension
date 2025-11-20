# Trip Info Section Multiline Layout - Implementation Plan

## Objective
Redesign the trip info section to use a three-line layout that prevents bunching when dynamic values change (dates, counts, etc.) while maintaining clear visual hierarchy.

## Problem Statement

**Current Issue:**
- All metadata (countries, locations, dates, export) is on a single line
- Dynamic values (dates, counts) cause elements to bunch up
- Poor readability when values change
- Visual hierarchy is compromised when content is cramped

**User Requirements:**
- Line 1: Trip name (left) + Dates (right) - `justify-between`
- Line 2: Countries count (left-aligned, full width)
- Line 3: Locations count (left) + Export button (right) - `justify-between`
- Maintain visual hierarchy
- Prevent bunching with dynamic values

## Target Design

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                                    ✏️    🔄     │ ← Nav bar: px-2
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  SEA 2025                    Oct 31 - Nov 4        │ │ ← Line 1: justify-between
│  │  (text-lg semibold)          (text-sm gray-600)   │ │
│  │                                                     │ │
│  │  1 Country                                          │ │ ← Line 2: left-aligned
│  │  (text-sm gray-600)                                │ │
│  │                                                     │ │
│  │  10 locations                            📤 Export │ │ ← Line 3: justify-between
│  │  (text-sm gray-600)          (text-sm primary)     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
├─────────────────────────────────────────────────────────┤
│  [Day Filters...]                                       │
└─────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Update TripDetail Component

**File**: `extension/popup/TripDetail.tsx`

**Current Structure** (lines 574-613):
- Single flex row with all metadata inline
- Dates and export button causing bunching

**New Structure**:
- Line 1: Trip name + Dates (flex justify-between)
- Line 2: Countries count (full width, left-aligned)
- Line 3: Locations count + Export (flex justify-between)

**Changes**:
1. Split metadata into three separate lines
2. Line 1: `flex items-center justify-between mb-2`
   - Trip name: `text-lg font-semibold text-gray-900 leading-tight`
   - Dates: `text-sm text-gray-600` (conditional, right-aligned)
3. Line 2: `text-sm text-gray-600 mb-2`
   - Countries count: Full width, left-aligned
4. Line 3: `flex items-center justify-between`
   - Locations count: `text-sm text-gray-600` (left)
   - Export button: `text-sm text-primary font-medium` (right)

**Before**:
```tsx
<div className="bg-gray-50 rounded-lg p-3">
  <h1 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
    {currentTrip.name}
  </h1>
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>{uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'Country' : 'Countries'}</span>
      <span>·</span>
      <span>{locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
      {currentTrip.start_date && currentTrip.end_date && (
        <>
          <span>·</span>
          <span>{/* dates */}</span>
        </>
      )}
    </div>
    <button>{/* Export */}</button>
  </div>
</div>
```

**After**:
```tsx
<div className="bg-gray-50 rounded-lg p-3">
  {/* Line 1: Trip Name + Dates */}
  <div className="flex items-center justify-between mb-2">
    <h1 className="text-lg font-semibold text-gray-900 leading-tight">
      {currentTrip.name}
    </h1>
    {currentTrip.start_date && currentTrip.end_date && (
      <span className="text-sm text-gray-600">
        {new Date(currentTrip.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(currentTrip.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
      </span>
    )}
  </div>
  
  {/* Line 2: Countries Count */}
  <div className="text-sm text-gray-600 mb-2">
    {uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'Country' : 'Countries'}
  </div>
  
  {/* Line 3: Locations Count + Export */}
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">
      {locations.length} {locations.length === 1 ? 'location' : 'locations'}
    </span>
    <button
      onClick={handleExport}
      disabled={exporting}
      className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
      title="Export trip"
    >
      <span>📤</span>
      <span>{exporting ? 'Exporting...' : 'Export'}</span>
    </button>
  </div>
</div>
```

### Step 2: Update Complete UI Specification

**File**: `artifacts/UIUX/complete_ui_specification.md`

**Location**: Section "5. Trip Detail View with Day Filters" (around line 360)

**Changes**:
1. Update ASCII diagram to show three-line layout
2. Update "TRIP INFO SECTION" specifications with new line-by-line structure

**Before**:
```
│  ┌───────────────────────────────────┐ │
│  │ Tokyo 2025                        │ │ ← text-lg, semibold, mb-1
│  │ 5 Countries · 12 · Oct 31-Nov 4📤 │ │ ← text-sm, gray-600, inline
│  └───────────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
```

**After**:
```
│  ┌───────────────────────────────────┐ │
│  │ Tokyo 2025        Oct 31 - Nov 4   │ │ ← Line 1: justify-between
│  │ (text-lg semibold) (text-sm gray)  │ │
│  │                                     │ │
│  │ 5 Countries                         │ │ ← Line 2: left-aligned
│  │ (text-sm gray-600)                 │ │
│  │                                     │ │
│  │ 12 locations            📤 Export │ │ ← Line 3: justify-between
│  │ (text-sm gray-600) (text-sm primary)│ │
│  └───────────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
```

**Specifications Update**:
```
TRIP INFO SECTION:
├─ Container Padding: py-2 px-4 (8px vertical, 16px horizontal)
├─ Border: border-b border-gray-200
├─ Card Wrapper: bg-gray-50, rounded-lg, p-3 (12px padding)
├─ Line 1: Trip Name + Dates
│  ├─ Layout: flex items-center justify-between mb-2
│  ├─ Trip name: text-lg, font-semibold, text-gray-900, leading-tight (left)
│  └─ Dates: text-sm, text-gray-600 (right, conditional)
├─ Line 2: Countries Count
│  ├─ Layout: text-sm, text-gray-600, mb-2 (full width, left-aligned)
│  └─ Display: "X Country" or "X Countries"
├─ Line 3: Locations Count + Export
│  ├─ Layout: flex items-center justify-between
│  ├─ Locations: text-sm, text-gray-600 (left)
│  └─ Export button: text-sm, text-primary, font-medium (right)
└─ Spacing: mb-2 (8px) between lines for visual breathing room
```

### Step 3: Update Functional Requirements & Specification

**File**: `artifacts/features/trip-planning/Functional Requirements & Specification.md`

**Location**: Section "3. Trip Detail Header - With Edit Button" (around line 476)

**Changes**:
1. Update ASCII diagram to show three-line layout

**Before**:
```
│  ┌───────────────────────────────┐ │
│  │ Southeast Asia 2025            │ │ ← text-lg, semibold, mb-1
│  │ 3 Countries · 18 · Nov 1-5  📤 │ │ ← text-sm, gray-600, inline
│  └───────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
```

**After**:
```
│  ┌───────────────────────────────┐ │
│  │ Southeast Asia 2025  Nov 1-5 │ │ ← Line 1: justify-between
│  │ (text-lg semibold) (text-sm)  │ │
│  │                               │ │
│  │ 3 Countries                   │ │ ← Line 2: left-aligned
│  │                               │ │
│  │ 18 locations        📤 Export │ │ ← Line 3: justify-between
│  └───────────────────────────────┘ │ ← bg-gray-50, rounded-lg, p-3
```

### Step 4: Update UI Changes Visual Guide

**File**: `artifacts/features/trip-planning/UI-Changes-Visual-Guide.md`

**Location**: Section "2. Trip Detail Header" (around line 51)

**Changes**:
1. Update "AFTER" diagram to show three-line layout
2. Add notes about preventing bunching with dynamic values

**Before**:
```
### AFTER (New - Compact Card Style)
```
┌─────────────────────────────────────┐
│ ← Back               ✏️  🔄         │ ← Pencil icon for editing!
│  ┌───────────────────────────────┐ │
│  │ Southeast Asia 2025            │ │ ← text-lg, semibold
│  │ 3 Countries · 18 · Nov 1-5  📤 │ │ ← Compact inline layout
│  └───────────────────────────────┘ │ ← bg-gray-50, rounded-lg
```

**After**:
```
### AFTER (New - Multiline Layout)
```
┌─────────────────────────────────────┐
│ ← Back               ✏️  🔄         │ ← Pencil icon for editing!
│  ┌───────────────────────────────┐ │
│  │ Southeast Asia 2025  Nov 1-5  │ │ ← Line 1: name + dates
│  │                               │ │
│  │ 3 Countries                   │ │ ← Line 2: countries count
│  │                               │ │
│  │ 18 locations        📤 Export │ │ ← Line 3: locations + export
│  └───────────────────────────────┘ │ ← bg-gray-50, rounded-lg
```

**Key Changes**:
- ✨ Three-line layout prevents bunching with dynamic values
- ✨ Each element has dedicated space
- ✨ Clear visual hierarchy maintained
- ✨ Better readability when dates/counts change
- ✨ Export button always properly aligned

## Spacing Specifications

### Line Spacing
- Between Line 1 and Line 2: `mb-2` (8px)
- Between Line 2 and Line 3: `mb-2` (8px)
- Total vertical spacing: ~24px between lines

### Horizontal Spacing
- Line 1: `justify-between` ensures trip name and dates are at opposite ends
- Line 3: `justify-between` ensures locations count and export button are at opposite ends
- Line 2: Full width, left-aligned (no right-side content)

## Dynamic Value Handling

### Long Trip Names
- Trip name can wrap if extremely long
- Dates remain right-aligned regardless of name length
- `justify-between` maintains separation

### Long Date Ranges
- Dates stay right-aligned
- Trip name remains left-aligned
- No bunching occurs

### Large Numbers
- Countries count: Full width, no wrapping issues
- Locations count: Left-aligned, export button stays right
- Numbers don't affect layout structure

## Testing Checklist

- [ ] Trip name displays correctly on left
- [ ] Dates display correctly on right (when available)
- [ ] Dates don't display when not available
- [ ] Countries count displays on its own line
- [ ] Locations count displays on left of third line
- [ ] Export button displays on right of third line
- [ ] Spacing between lines is consistent (mb-2)
- [ ] Long trip names don't break layout
- [ ] Long date ranges don't break layout
- [ ] Large numbers don't cause bunching
- [ ] Export button hover states work correctly
- [ ] Export button disabled state works correctly
- [ ] Visual hierarchy is clear
- [ ] No elements bunch together
- [ ] Card background and styling maintained

## Files to Modify

1. `extension/popup/TripDetail.tsx` - Update component structure
2. `artifacts/UIUX/complete_ui_specification.md` - Update ASCII diagram and specs
3. `artifacts/features/trip-planning/Functional Requirements & Specification.md` - Update ASCII diagram
4. `artifacts/features/trip-planning/UI-Changes-Visual-Guide.md` - Update visual guide

## Notes

- This change improves readability by separating elements into distinct lines
- Prevents bunching issues when dynamic values change
- Maintains visual hierarchy with proper spacing
- Each line has a clear purpose and dedicated space
- Export button remains prominent and accessible


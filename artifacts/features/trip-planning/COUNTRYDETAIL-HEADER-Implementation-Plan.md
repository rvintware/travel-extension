# CountryDetail Header Redesign - Implementation Plan

## Objective
Redesign the `CountryDetail` header to match the navigation bar structure used in `Tabs` component and `TripDetail` component, ensuring consistent spacing, sizing, and layout across all detail views.

## Current State Analysis

### Current CountryDetail Header Structure
- Single header section with `p-4` padding
- Back button and refresh button in a flex container with `mb-2` margin
- Country info (emoji, name, location count) below buttons in the same section

### Target Structure (matching TripDetail)
- **Nav Bar**: `px-2` padding, `border-b border-gray-200`
  - Back button on the left
  - Refresh icon on the right with `gap-1` spacing
- **Country Info Section**: `p-4` padding, `border-b border-gray-200`
  - Country emoji, name, and location count

## Reference Components

### Tabs Component Structure
```tsx
<div className="bg-white border-b border-gray-200 flex items-center justify-between px-2">
  {/* Tabs on left */}
  <div className="flex items-center gap-1">
    {/* Refresh and Settings icons */}
  </div>
</div>
```

### TripDetail Component Structure (Current Implementation)
```tsx
{/* Nav Bar - matches Tabs component structure */}
<div className="bg-white border-b border-gray-200 flex items-center justify-between px-2">
  <button onClick={onBack}>← Back</button>
  <div className="flex items-center gap-1">
    <button onClick={handleSettings}>✏️</button>
    <button onClick={handleRefresh}>🔄</button>
  </div>
</div>

{/* Trip Info Section */}
<div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
  {/* Trip name, metadata, dates, export button */}
</div>
```

## Implementation Steps

### Step 1: Restructure Header into Two Sections

**File**: `extension/popup/CountryDetail.tsx`

**Changes**:
1. Split the current single header div into two separate sections:
   - **Nav Bar**: Navigation controls (back button, refresh icon)
   - **Country Info Section**: Country-specific information

**Before**:
```tsx
<div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
  <div className="flex items-center justify-between mb-2">
    {/* Back button and refresh button */}
  </div>
  <div className="flex items-center gap-2">
    {/* Country emoji, name, location count */}
  </div>
</div>
```

**After**:
```tsx
{/* Nav Bar - matches Tabs component structure */}
<div className="bg-white border-b border-gray-200 flex items-center justify-between px-2">
  <button onClick={onBack}>← Back</button>
  <div className="flex items-center gap-1">
    <button onClick={handleRefresh}>🔄</button>
  </div>
</div>

{/* Country Info Section */}
<div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
  <div className="flex items-center gap-2">
    {/* Country emoji, name, location count */}
  </div>
</div>
```

### Step 2: Update Nav Bar Styling

**Changes**:
1. Change padding from `p-4` to `px-2` (matches Tabs)
2. Remove `mb-2` margin from button container
3. Wrap refresh button in a `div` with `flex items-center gap-1` (matches Tabs structure)
4. Ensure refresh button styling matches Tabs component:
   - `p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors`
   - `text-xl` on the span
   - `title="Refresh data"` and `aria-label="Refresh"`

### Step 3: Update Country Info Section

**Changes**:
1. Move country info to separate section with `p-4` padding
2. Add `border-b border-gray-200` to maintain visual separation
3. Add `flex-shrink-0` to prevent section from shrinking
4. Keep existing country info layout (emoji, name, location count)

### Step 4: Verify Consistency

**Checklist**:
- [ ] Nav bar padding matches Tabs (`px-2`)
- [ ] Nav bar border matches Tabs (`border-b border-gray-200`)
- [ ] Refresh button styling matches Tabs exactly
- [ ] Refresh button spacing matches Tabs (`gap-1`)
- [ ] Country info section has proper padding (`p-4`)
- [ ] Country info section has border (`border-b border-gray-200`)
- [ ] Back button styling matches TripDetail
- [ ] Overall structure matches TripDetail pattern

## Expected Result

### Visual Structure
```
┌─────────────────────────────────────────┐
│ ← Back                    🔄            │  ← Nav Bar (px-2)
├─────────────────────────────────────────┤
│ 🇯🇵 Japan                                │  ← Country Info (p-4)
│    11 locations                         │
├─────────────────────────────────────────┤
│                                         │
│  [Location Cards]                       │
│                                         │
└─────────────────────────────────────────┘
```

### Spacing Consistency
- Nav bar: `px-2` horizontal padding (matches Tabs)
- Country info: `p-4` padding (matches TripDetail info section)
- Refresh button: Same size, hover effects, and spacing as Tabs
- Back button: Same styling as TripDetail

## Files to Modify

1. `extension/popup/CountryDetail.tsx`
   - Restructure header into nav bar and info section
   - Update padding and spacing
   - Ensure button styling matches reference components

## Testing Checklist

- [ ] Nav bar displays correctly with `px-2` padding
- [ ] Back button is positioned on the left
- [ ] Refresh button is positioned on the right with correct spacing
- [ ] Refresh button has correct hover effects
- [ ] Country info section displays below nav bar
- [ ] Country emoji, name, and location count display correctly
- [ ] Borders and spacing match TripDetail
- [ ] No visual regressions in layout
- [ ] Responsive behavior maintained

## Notes

- This change ensures visual consistency across all detail views (CountryDetail, TripDetail)
- The structure now matches the Tabs component navigation pattern
- No functional changes, only structural/visual improvements
- All existing functionality (refresh, back navigation) remains unchanged


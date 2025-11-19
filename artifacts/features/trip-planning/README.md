# Trip Planning Feature

**Status:** Ready for Implementation  
**Version:** 1.0  
**Last Updated:** November 17, 2025

---

## Quick Summary

This feature enables users to plan their trips with specific dates and organize saved locations into day-by-day itineraries.

### Key Capabilities

1. **Trip Dates & Duration**
   - Set start date, end date, and duration when creating/editing trips
   - Auto-calculate related fields (duration from dates, dates from duration)
   - Support flexible planning (dates-first, duration-first, or mixed)

2. **Day Assignment**
   - Assign locations to specific days (Day 1, Day 2, ..., Day N)
   - Filter locations by day in trip detail view
   - Drag-and-drop to reorder locations within a day
   - Move locations to "Unassigned" status

3. **Quick Add to Trip**
   - Prominent "Add to Trip" button on location cards in library view
   - Scrollable trip selection modal
   - Instant success/error feedback

4. **Inline Delete Confirmation**
   - Bin icon transforms into Yes/No emoji pill on click
   - No modal dialogs, faster workflow
   - Delete from library (permanent) or from trip (keeps in library)

5. **Drag and Drop**
   - Reorder locations within a day
   - Visual feedback during drag
   - Smooth animations

---

## Documents

- **[Functional Requirements & Specification](./Functional%20Requirements%20%26%20Specification.md)** - Complete specification with ASCII mockups
- **Implementation Phases:**
  1. Backend & Data Model
  2. Create Trip Flow
  3. Edit Trip Flow
  4. Day Assignment
  5. Quick Add to Trip
  6. Inline Delete
  7. Drag and Drop
  8. Polish & Edge Cases

---

## Design Highlights

### Date-Duration Auto-Calculation
```
Set Start + End Date → Duration auto-calculated & locked
Set Start + Duration → End date auto-calculated
Set End + Duration → Start date auto-calculated
Edit locked Duration → Unlocks & recalculates end date
```

### Inline Delete UX
```
Hover bin → Turns red
Click bin → Transforms to [✅][❌] pill
Click ✅ → Delete (no modal!)
Click ❌ or outside → Cancel
```

### Day Assignment
```
Kebab menu (⋮) → Assign to Day → Submenu (Day 1-N, Unassigned)
Filter by day in trip detail view
Drag-and-drop to reorder within day
Day badges shown in "All" view
```

---

## Success Metrics

- ✅ All functional requirements implemented
- ⚡ Date calculations < 50ms
- ⚡ Day filter switching < 100ms  
- ⚡ Drag-and-drop at 60fps
- 🎯 Intuitive date pickers
- 🎯 Prominent "Add to Trip" button
- 🎯 Fast inline delete confirmation
- 🛡️ Robust validation (19 edge cases handled)
- 🎨 Consistent with design system

---

## Out of Scope (Future)

- Time-based planning (specific times for locations)
- Priority levels (must-see, optional)
- Collaboration (shared trips)
- Auto-optimization of daily schedules
- Budget tracking per day
- Weather integration

---

**See full specification for detailed requirements, UI mockups, API specs, and implementation plan.**


# Refresh Strategy - Functional Requirements & Specification

**Version:** 1.0  
**Created:** December 2024  
**Status:** Draft - Pending Approval  
**Feature:** Automatic UI Refresh After User Actions

---

## Executive Summary

Currently, the extension requires manual refresh button clicks to see updated data after user actions. This document specifies a comprehensive refresh strategy that automatically updates the UI whenever any user action or server event occurs, ensuring users always see the most current state without manual intervention.

**Key Benefits:**
- **Instant Feedback:** UI updates immediately with optimistic updates (0ms blocking)
- **Automatic Updates:** UI refreshes automatically after any user action
- **Consistent State:** Users always see current data without manual refresh
- **Snappy Feel:** Zero blocking time, feels instant and responsive
- **Smart Refresh:** Only refreshes what's necessary, not everything
- **Maintainable:** Clear refresh patterns that are easy to extend

**Current Problem:**
- Manual refresh button exists but users don't always remember to use it
- Some actions refresh UI, others don't (inconsistent)
- Child views (TripDetail, CountryDetail) refresh themselves but parent views don't know
- Cache invalidation happens but UI doesn't always update

---

## User Story

**As a user**, I want the extension UI to automatically update after I perform any action so that:
- I always see the latest data without clicking refresh
- Changes I make are immediately visible
- I don't have to remember to manually refresh
- The UI feels responsive and up-to-date

**As a developer**, I want a clear refresh strategy so that:
- It's obvious when and what to refresh
- Adding new actions doesn't require remembering refresh logic
- Refresh behavior is consistent across the extension
- The system is maintainable and extensible

---

## Current State Analysis

### 1. Data Stores in Extension

The extension maintains multiple independent data stores:

#### Global Data (in `popup.tsx`)
- `countries: Country[]` - List of all countries
- `trips: Trip[]` - List of all user trips
- `locations: Location[]` - List of all user locations
- `locationsByCountry: Record<string, number>` - Count of locations per country

#### View-Specific Data
- **TripDetail**: `locations: LocationWithTripData[]`, `byDay: Record<string, LocationWithTripData[]>`
- **CountryDetail**: `locations: Location[]` (filtered by country)
- **Settings**: `locationCount: number`, `tripCount: number`

### 2. Current Refresh Mechanisms

#### Working Refresh Points ✅
1. **Background Script → Popup**: When location saved via context menu
   - Background script sends `CAPTURES_UPDATED` message
   - Popup listens and calls `loadDataWithCache()`
   - Works correctly

2. **Polling for Processing**: TripDetail and CountryDetail poll every 3 seconds
   - Checks for `processing_status === 'pending' || 'processing'`
   - Automatically refreshes when locations are being processed
   - Works correctly

3. **Some Callbacks**: 
   - `handleAddToTripSuccess()` → calls `loadDataWithCache()`
   - `handleDeleteLocation()` → calls `loadDataWithCache()`
   - `handleCreateTripSuccess()` → calls `loadDataWithCache()`

#### Missing Refresh Points ❌
1. **After Creating Trip**: `CreateTripView.handleCreate()` → No refresh of parent
2. **After Updating Trip**: No refresh mechanism
3. **After Linking Location to Trip**: `linkLocationToTrip()` → Only refreshes TripDetail, not parent
4. **After Removing from Trip**: `removeFromTrip()` → Only refreshes TripDetail, not parent
5. **After Moving Location to Day**: Only refreshes TripDetail, not parent trips list
6. **After Updating Location**: No refresh mechanism
7. **After Deleting Trip**: No refresh mechanism
8. **After Settings Changes**: Some refresh, but inconsistent

### 3. Current Refresh Flow Example

**Scenario:** User moves location to Day 1 in TripDetail

```
1. User clicks "Move to Day 1"
2. TripDetail.handleAction() called
3. api.linkLocationToTrip() succeeds
4. Cache.invalidateTrips() called
5. Cache.invalidateLocations() called
6. loadTripLocations() called → TripDetail refreshes ✅
7. User clicks "Back" to trips list
8. Trips list shows OLD data ❌ (parent wasn't refreshed)
```

**Problem:** Child view refreshes itself, but parent view doesn't know about the change.

### 4. Cache Invalidation vs UI Refresh

**Current Pattern:**
```typescript
// Many actions do this:
await Cache.invalidateTrips()
await Cache.invalidateLocations()
await loadTripLocations() // Only refreshes current view
```

**Issue:** Cache is invalidated, but UI doesn't refresh unless you're on that specific view.

---

## Functional Requirements

### FR-1: Automatic Refresh After User Actions

**Requirement:** After any user action that modifies data on the server, the UI must automatically refresh to show the updated state.

**User Actions That Must Trigger Refresh:**
1. Create trip
2. Update trip (name, dates, duration, etc.)
3. Delete trip
4. Create location (via context menu - already works)
5. Update location (name, category, notes, rating, etc.)
6. Delete location
7. Link location to trip
8. Remove location from trip
9. Move location to different day
10. Unschedule location (move to unscheduled)
11. Update location time/schedule
12. Save settings (API key, default view, etc.)

**Acceptance Criteria:**
- No manual refresh button click required
- UI updates immediately (0ms blocking time) via optimistic updates
- User sees instant visual feedback that action succeeded
- Background sync ensures correctness
- No stale data visible after action

### FR-2: Smart Refresh Scope

**Requirement:** Only refresh the data that was affected by the action, not everything.

**Refresh Rules:**
- **Trip Created/Updated/Deleted** → Refresh trips list, refresh trip detail if open
- **Location Created** → Refresh locations list, refresh country detail if open, refresh trip detail if location was added to trip
- **Location Updated** → Refresh location detail if open, refresh lists if visible
- **Location Deleted** → Refresh all views (affects counts everywhere)
- **Location Linked to Trip** → Refresh trip detail if open, refresh trips list (counts changed)
- **Location Removed from Trip** → Refresh trip detail if open, refresh trips list
- **Location Moved to Day** → Refresh trip detail (day organization changed)
- **Settings Changed** → Refresh settings view, refresh context menu in background

**Acceptance Criteria:**
- No unnecessary API calls
- Only affected views refresh
- Performance remains good (< 500ms for refresh)

### FR-3: Refresh Coordination Between Views

**Requirement:** When a child view (TripDetail, CountryDetail) makes changes, parent views must also refresh if they're affected.

**Scenarios:**
1. User in TripDetail moves location → TripDetail refreshes + trips list refreshes (if user goes back)
2. User in CountryDetail deletes location → CountryDetail refreshes + locations list refreshes
3. User creates trip → Trips list refreshes immediately

**Acceptance Criteria:**
- Parent views always show current data
- No stale data when navigating between views
- Cache invalidation happens before refresh

### FR-4: Background Refresh for Processing Locations

**Requirement:** Continue polling for locations that are being processed (pending/processing status).

**Current Behavior:** ✅ Already works
- TripDetail polls every 3 seconds when locations are processing
- CountryDetail polls every 3 seconds when locations are processing

**Acceptance Criteria:**
- Polling continues until all locations are complete
- Polling stops when no locations are processing
- No performance impact when not processing

### FR-5: Error Handling During Refresh

**Requirement:** If refresh fails, user should be notified and stale data should remain visible (don't clear UI).

**Acceptance Criteria:**
- Error toast/notification shown
- Current UI state preserved
- User can retry refresh manually
- No blank screens or loading states that never resolve

### FR-6: Refresh Performance and Optimistic Updates

**Requirement:** UI must feel instant with zero blocking time. Use optimistic updates for immediate feedback, then sync with server in background.

**Performance Targets:**
- **Zero blocking time:** UI updates immediately (0ms) via optimistic updates
- **Background sync:** API calls happen non-blocking in background
- **No loading spinners:** User actions feel instant, no waiting indicators
- **Background refresh:** Verify correctness in background (< 500ms)
- Can use cached data while fetching fresh data

**Acceptance Criteria:**
- No UI freezing during user actions
- No loading spinners for user actions (optimistic updates)
- Background refresh doesn't block user actions
- Errors handled gracefully with revert to server state

---

## Functional Specifications

### FS-1: Optimistic Updates with Callbacks and Events

**Specification:** Implement optimistic updates for instant feedback, using callbacks for parent-child communication and events only for background script communication.

**Architecture Decision:**
- **Optimistic Updates:** Update UI immediately using backend response data (0ms blocking)
- **Callbacks:** Direct function calls for parent-child communication (fastest, ~0ms overhead)
- **Events:** Chrome message passing only for background script → popup communication (necessary for cross-boundary communication)

#### Communication Patterns

**Pattern 1: Parent-Child Communication (Callbacks)**
- **Use Case:** Child view (TripDetail, CountryDetail) needs to notify parent (popup.tsx)
- **Method:** Direct callback props (`onLocationMoved`, `onLocationDeleted`, etc.)
- **Speed:** ~0ms overhead (direct function call)
- **Type Safety:** Full TypeScript support
- **Example:** TripDetail → popup.tsx via `props.onLocationMoved()`

**Pattern 2: Background Script Communication (Events)**
- **Use Case:** Background script (context menu saves) needs to notify popup
- **Method:** Chrome message passing (`chrome.runtime.sendMessage`)
- **Speed:** ~1-5ms overhead (message queue)
- **Type Safety:** String event types
- **Example:** Background script → popup.tsx via `CAPTURES_UPDATED` event

#### Event Types (Background Script Only)

```typescript
type RefreshEvent =
  | 'CAPTURES_UPDATED'  // Location saved via context menu
  | 'SETTINGS_UPDATED'   // Settings changed (affects background context menu)
```

#### Callback Types (Parent-Child)

```typescript
// Callback props passed from parent to child
interface TripDetailProps {
  trip: Trip
  onBack: () => void
  onLocationMoved?: () => void      // Notify parent when location moved
  onLocationRemoved?: () => void    // Notify parent when location removed
  onLocationLinked?: () => void     // Notify parent when location linked
}

interface CountryDetailProps {
  country: Country
  onBack: () => void
  onAddToTrip: (location: Location) => void
  onDelete: (location: Location) => void  // Notify parent when location deleted
}
```

### FS-2: Refresh Logic by Action Type

#### TRIP_CREATED
- **Optimistic Update:** Add trip to trips list immediately
- **Callback:** `onTripCreated()` → Update trips list in parent
- **Background Refresh:** Fetch fresh trips list
- **Cache:** Invalidate trips cache
- **Views Affected:** TripsView

#### TRIP_UPDATED
- **Optimistic Update:** Update trip in trips list immediately
- **Callback:** `onTripUpdated()` → Update trips list + TripDetail if open
- **Background Refresh:** Fetch fresh trips list
- **Cache:** Invalidate trips cache
- **Views Affected:** TripsView, TripDetail

#### TRIP_DELETED
- **Optimistic Update:** Remove trip from trips list immediately
- **Callback:** `onTripDeleted()` → Update trips list, navigate away if deleted trip was open
- **Background Refresh:** Fetch fresh trips list
- **Cache:** Invalidate trips cache, locations cache (counts changed)
- **Views Affected:** TripsView, TripDetail (close if deleted)

#### LOCATION_CREATED
- **Optimistic Update:** Add location to appropriate lists immediately
- **Event:** `CAPTURES_UPDATED` (from background script)
- **Background Refresh:** Fetch fresh locations list
- **Cache:** Invalidate locations cache, trips cache (counts changed)
- **Views Affected:** LocationsView, CountryDetail, TripDetail

#### LOCATION_UPDATED
- **Optimistic Update:** Update location in lists immediately
- **Callback:** `onLocationUpdated()` → Update location detail if open, lists if visible
- **Background Refresh:** Fetch fresh locations list
- **Cache:** Invalidate locations cache
- **Views Affected:** CountryDetail, TripDetail, LocationsView

#### LOCATION_DELETED
- **Optimistic Update:** Remove location from lists immediately
- **Callback:** `onLocationDeleted()` → Update all views (affects counts)
- **Background Refresh:** Fetch fresh data for all views
- **Cache:** Invalidate locations cache, trips cache
- **Views Affected:** All views

#### LOCATION_LINKED_TO_TRIP
- **Optimistic Update:** Add location to trip detail immediately
- **Callback:** `onLocationLinked()` → Update TripDetail + trips list (counts)
- **Background Refresh:** Fetch fresh trip locations + trips list
- **Cache:** Invalidate trips cache, locations cache
- **Views Affected:** TripDetail, TripsView

#### LOCATION_REMOVED_FROM_TRIP
- **Optimistic Update:** Remove location from trip detail immediately
- **Callback:** `onLocationRemoved()` → Update TripDetail + trips list (counts)
- **Background Refresh:** Fetch fresh trip locations + trips list
- **Cache:** Invalidate trips cache, locations cache
- **Views Affected:** TripDetail, TripsView

#### LOCATION_MOVED_TO_DAY
- **Optimistic Update:** Move location to new day immediately
- **Callback:** `onLocationMoved()` → Update TripDetail (day organization)
- **Background Refresh:** Fetch fresh trip locations
- **Cache:** Invalidate trips cache, locations cache
- **Views Affected:** TripDetail

#### LOCATION_UNSCHEDULED
- **Optimistic Update:** Move location to unscheduled immediately
- **Callback:** `onLocationUnscheduled()` → Update TripDetail (day organization)
- **Background Refresh:** Fetch fresh trip locations
- **Cache:** Invalidate trips cache, locations cache
- **Views Affected:** TripDetail

#### SETTINGS_UPDATED
- **Optimistic Update:** Update settings state immediately
- **Event:** `SETTINGS_UPDATED` → Update background script context menu
- **Background Refresh:** Fetch fresh settings (if needed)
- **Cache:** No cache invalidation needed
- **Views Affected:** Settings

### FS-3: Optimistic Update Implementation Pattern

#### Pattern for Actions (Optimistic Updates)

```typescript
// Standard pattern for all actions with optimistic updates:
async function handleAction() {
  try {
    // STEP 1: Perform API call (get backend response)
    const result = await api.someAction(...)
    
    // STEP 2: OPTIMISTIC UPDATE - Update UI immediately (0ms blocking)
    // Use backend response data to update state optimistically
    setLocations(prev => prev.map(loc => 
      loc.id === result.locationId
        ? { ...loc, dayNumber: result.dayNumber }  // Use backend response!
        : loc
    ))
    
    // STEP 3: Invalidate relevant caches
    await Cache.invalidateTrips() // if trips affected
    await Cache.invalidateLocations() // if locations affected
    
    // STEP 4: Notify parent via callback (instant, ~0ms)
    props.onLocationMoved?.()
    
    // STEP 5: Background refresh to verify (non-blocking)
    loadTripLocations().catch(error => {
      // On error, revert optimistic update by refreshing from server
      console.error('Refresh failed:', error)
      loadTripLocations()  // Get real state from server
    })
    
  } catch (error) {
    // Handle error - revert optimistic update if needed
    loadTripLocations()  // Get real state from server
  }
}
```

#### Pattern for Parent Callbacks

```typescript
// In popup.tsx - Define callback handlers
const handleLocationMoved = () => {
  // OPTIMISTIC UPDATE - Update parent state immediately
  setTrips(prev => prev.map(trip => 
    trip.id === selectedTrip.id
      ? { ...trip, locationCount: trip.locationCount + 1 }  // Optimistic
      : trip
  ))
  
  // Background refresh to verify (non-blocking)
  loadDataWithCache().catch(error => {
    console.error('Refresh failed:', error)
    // Keep optimistic update, will refresh on next action
  })
}

// Pass callback to child
<TripDetail 
  trip={selectedTrip}
  onBack={handleBackToList}
  onLocationMoved={handleLocationMoved}  // ← Callback prop
/>
```

#### Pattern for Event Listeners (Background Script Only)

```typescript
// In popup.tsx - Listen for background script events
useEffect(() => {
  const handleMessage = async (message: any) => {
    if (message.type === 'CAPTURES_UPDATED') {
      // Invalidate cache
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // Refresh in background (non-blocking)
      loadDataWithCache()
    }
  }
  
  chrome.runtime.onMessage.addListener(handleMessage)
  return () => chrome.runtime.onMessage.removeListener(handleMessage)
}, [])
```

### FS-4: Cache Invalidation Strategy

**Rule:** Always invalidate cache AFTER optimistic update, BEFORE background refresh.

**Cache Invalidation Pattern:**
1. Optimistic update happens first (instant)
2. Invalidate cache (ensures next fetch gets fresh data)
3. Background refresh fetches fresh data (non-blocking)

**Cache Invalidation by Action:**
- Trip actions → Invalidate trips cache
- Location actions → Invalidate locations cache
- Actions affecting counts → Invalidate both caches

**Rationale:** Cache invalidation ensures background refresh gets fresh data from server, correcting any optimistic update discrepancies.

### FS-5: View Refresh Functions

Each view should have a refresh function that:
1. Fetches fresh data from API (respecting cache invalidation)
2. Updates React state
3. Handles loading states
4. Handles errors gracefully

**Refresh Functions:**
- `popup.tsx`: `loadDataWithCache()` - Already exists ✅
- `TripDetail.tsx`: `loadTripLocations()` - Already exists ✅
- `CountryDetail.tsx`: `loadLocations()` - Already exists ✅
- `Settings.tsx`: `loadCounts()`, `loadSettings()` - Already exist ✅

### FS-6: Current View Detection

**Requirement:** Only refresh views that are currently visible or might be navigated to.

**Implementation:**
- Track current view in `popup.tsx` state (`view: ViewType`)
- Only refresh views that are:
  - Currently visible
  - Parent views (user might navigate back)
  - Affected by the action

**Example:**
- User in TripDetail moves location → Refresh TripDetail + TripsView (parent)
- User in CountryDetail deletes location → Refresh CountryDetail + LocationsView (parent)

### FS-7: Debouncing and Batching

**Requirement:** If multiple refresh events fire quickly, batch them to avoid excessive API calls.

**Implementation:**
- Debounce refresh events by 100ms
- If multiple events fire within 100ms, refresh once with all changes
- Use a refresh queue to batch events

**Example:**
- User moves 3 locations quickly → Only refresh once after all moves complete

---

## Proposed Solutions

### Solution 1: Optimistic Updates with Callbacks (Recommended)

**Approach:** Use optimistic updates for instant feedback, callbacks for parent-child communication, events only for background script.

**Pros:**
- Zero blocking time (instant UI updates)
- Fastest communication (~0ms for callbacks)
- Type-safe (TypeScript callbacks)
- Simple and maintainable
- Feels snappy and responsive

**Cons:**
- Requires passing callback props
- Need to handle error reverts

**Implementation Complexity:** Low-Medium

### Solution 2: Event-Driven System

**Approach:** Use Chrome message passing for all communication.

**Pros:**
- Decoupled components
- Works for background script
- Easy to add listeners

**Cons:**
- Slower (~1-5ms overhead per event)
- Less type-safe (string event types)
- More complex debugging

**Implementation Complexity:** Medium

### Solution 3: Hybrid (Optimistic + Callbacks + Events)

**Approach:** Optimistic updates with callbacks for parent-child, events for background script.

**Pros:**
- Best performance (callbacks where possible)
- Works for all scenarios (events where needed)
- Optimistic updates for instant feedback
- Type-safe where possible

**Cons:**
- Two communication patterns to maintain
- Need to decide which pattern to use

**Implementation Complexity:** Medium

### Recommended: Solution 3 (Hybrid - Optimistic + Callbacks + Events)

**Rationale:**
- Optimistic updates provide instant feedback (zero blocking)
- Callbacks are fastest for parent-child (~0ms)
- Events necessary for background script (no direct callback possible)
- Best balance of speed, simplicity, and functionality

---

## Implementation Approach

### Phase 1: Implement Optimistic Updates

1. **Update Action Handlers**
   - Modify all action handlers to use optimistic updates
   - Update UI immediately using backend response data
   - Move API calls to background (non-blocking)

2. **Add Callback Props**
   - Add callback props to child components (TripDetail, CountryDetail)
   - Define callback handlers in parent (popup.tsx)
   - Pass callbacks as props

3. **Implement Background Refresh**
   - Add background refresh after optimistic updates
   - Handle errors by reverting to server state
   - Ensure non-blocking behavior

### Phase 2: Add Event Listeners (Background Script Only)

1. **Extend Background Script Events**
   - Keep existing `CAPTURES_UPDATED` event
   - Add `SETTINGS_UPDATED` event if needed

2. **Add Event Listeners**
   - Add message listeners in `popup.tsx` for background script events
   - Keep listeners minimal (only for background script communication)

3. **Test Background Script Flow**
   - Verify context menu saves trigger refresh
   - Ensure popup updates when background script saves location

### Phase 3: Testing and Refinement

1. **Test Each Action**
   - Verify refresh happens after each action
   - Verify correct views refresh
   - Verify no unnecessary refreshes

2. **Performance Testing**
   - Ensure refresh completes quickly
   - Ensure no UI blocking
   - Ensure no excessive API calls

3. **Edge Cases**
   - Test rapid actions (debouncing)
   - Test errors during refresh
   - Test navigation during refresh

### Phase 4: Remove Manual Refresh (Optional)

1. **Evaluate Usage**
   - Monitor if manual refresh button is still used
   - Gather user feedback

2. **Remove or Keep**
   - If not used, remove manual refresh button
   - If still useful, keep as fallback

---

## Refresh vs Database Refresh

### Clarification

**We are NOT refreshing the database.** The database is the source of truth and doesn't need refreshing.

**We ARE refreshing:**
- React component state
- Cache in `chrome.storage.local`
- UI display

### What "Refresh" Means

1. **Invalidate Cache**: Mark cached data as stale
2. **Fetch Fresh Data**: Call API to get latest data from database
3. **Update State**: Update React state with fresh data
4. **Re-render UI**: React automatically re-renders with new state

### Database State

- Database is always current (it's where changes are saved)
- We refresh the UI to match database state
- Cache is intermediate storage to speed up UI

---

## Success Metrics

### Functional Metrics
- ✅ All user actions trigger automatic refresh
- ✅ UI updates within 1 second of action
- ✅ No stale data visible after actions
- ✅ Zero manual refresh button clicks needed

### Performance Metrics
- ✅ Zero blocking time (0ms) for user actions
- ✅ Optimistic updates feel instant
- ✅ Background refresh completes in < 500ms
- ✅ No UI blocking during refresh
- ✅ No excessive API calls (< 2 per action)

### User Experience Metrics
- ✅ Users see immediate feedback
- ✅ No confusion about data state
- ✅ Smooth transitions between views

---

## Open Questions

1. **Should we keep manual refresh button?**
   - Pro: Useful for debugging, force refresh
   - Con: Shouldn't be needed if automatic refresh works
   - **Recommendation:** Keep initially, remove later if unused

2. **Should we show loading states during refresh?**
   - Pro: User knows something is happening
   - Con: Might be distracting for quick refreshes
   - **Recommendation:** Show subtle loading indicator, not full-screen loader

3. **Should we refresh on popup open?**
   - Current: Uses cache, refreshes if stale
   - **Recommendation:** Keep current behavior (fast, uses cache)

4. **Should we refresh when user switches tabs?**
   - Current: No refresh on tab switch
   - **Recommendation:** No refresh needed (data is fresh from cache)

5. **How to handle refresh failures?**
   - **Recommendation:** Show error toast, keep current UI state, allow retry

---

## Dependencies

### Existing Systems Used
- Chrome Extension Message Passing API (`chrome.runtime.sendMessage`)
- Cache system (`lib/cache.ts`)
- API client (`lib/api.ts`)
- React state management

### No New Dependencies Required
- Uses existing Chrome APIs
- Uses existing React patterns
- No new libraries needed

---

## Risks and Mitigations

### Risk 1: Excessive API Calls
**Mitigation:** Implement debouncing and batching

### Risk 2: Performance Degradation
**Mitigation:** Use cache-first approach, only refresh when necessary

### Risk 3: Race Conditions
**Mitigation:** Ensure cache invalidation happens before refresh

### Risk 4: Missing Refresh Points
**Mitigation:** Comprehensive testing, checklist of all actions

### Risk 5: User Confusion During Refresh
**Mitigation:** Subtle loading indicators, preserve UI state during refresh

---

## Future Enhancements

### Potential Improvements
1. **WebSocket Updates**: Real-time updates from server (if backend supports)
2. **Refresh Queue**: Queue refresh events and batch them
3. **Smart Refresh**: Only refresh visible elements, not entire views
4. **Refresh Analytics**: Track refresh frequency and performance
5. **Optimistic Update Batching**: Batch multiple optimistic updates together

### Not in Scope
- WebSocket real-time updates (backend doesn't support)
- Complex state management library (overkill)
- Server-sent events (not needed)

---

## Appendix

### A. Current Refresh Points Map

| Action | Current Refresh | Should Refresh |
|--------|----------------|----------------|
| Create Trip | ❌ None | ✅ Trips list |
| Update Trip | ❌ None | ✅ Trips list, TripDetail |
| Delete Trip | ❌ None | ✅ Trips list |
| Create Location | ✅ Popup (via message) | ✅ Popup, CountryDetail, TripDetail |
| Update Location | ❌ None | ✅ Location detail, lists |
| Delete Location | ✅ Popup | ✅ All views |
| Link to Trip | ✅ TripDetail only | ✅ TripDetail, Trips list |
| Remove from Trip | ✅ TripDetail only | ✅ TripDetail, Trips list |
| Move to Day | ✅ TripDetail only | ✅ TripDetail |
| Unschedule | ✅ TripDetail only | ✅ TripDetail |
| Save Settings | ❌ Partial | ✅ Settings, background |

### B. Optimistic Update Flow Diagram

```
User Action (e.g., Move Location to Day 1)
    ↓
[0ms] OPTIMISTIC UPDATE - Update UI immediately using backend response
    ↓
[0ms] Callback to Parent - props.onLocationMoved() (direct function call)
    ↓
[0ms] Parent Optimistic Update - Update trips list immediately
    ↓
[Background] API Call - Non-blocking, happens in background
    ↓
[Background] Invalidate Cache - Ensure fresh data on next fetch
    ↓
[Background] Refresh to Verify - Fetch fresh data (non-blocking)
    ↓
[Background] Update React State - If different from optimistic update
    ↓
UI Re-renders (if state changed)
```

**Key Points:**
- User sees instant feedback (0ms blocking)
- All API calls happen in background (non-blocking)
- Background refresh ensures correctness
- Errors handled by reverting to server state

### C. Refresh Decision Tree

```
Action Completed
    ↓
What changed?
    ├─ Trip? → Refresh trips list + trip detail if open
    ├─ Location? → Refresh locations list + detail if open
    ├─ Trip-Location link? → Refresh trip detail + trips list
    └─ Settings? → Refresh settings view
    ↓
Is current view affected?
    ├─ Yes → Refresh immediately
    └─ No → Refresh in background (if user navigates)
```

---

---

## Design Decision: Events vs Callbacks

### The Question

When a child component (TripDetail) performs an action that affects parent state (popup.tsx), how should the child notify the parent? Two approaches were considered:

1. **Events**: Child emits event, parent listens
2. **Callbacks**: Child calls parent's callback function directly

### Initial Consideration: Event-Driven System

**Initial Approach:** Use Chrome message passing (events) for all communication.

**Reasoning:**
- Decoupled components (child doesn't need to know about parent)
- Works for background script communication
- Easy to add new listeners
- Consistent pattern across extension

**Implementation:**
```typescript
// Child emits event
chrome.runtime.sendMessage({ type: 'LOCATION_MOVED' })

// Parent listens
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LOCATION_MOVED') {
    loadDataWithCache()
  }
})
```

### The Speed Optimization Question

**Key Requirement:** Zero blocking time, instant feedback, snappy feel.

**Analysis:**
- Events use Chrome message queue (~1-5ms overhead)
- Callbacks are direct function calls (~0ms overhead)
- For speed optimization, callbacks are faster

**Question Raised:** "Why can't we just use the backend response and update optimistically? Why do we need events at all?"

### The Realization: Optimistic Updates

**Insight:** Backend already returns the data we need. We can:
1. Update UI immediately using backend response (optimistic update)
2. Notify parent via callback (instant)
3. Refresh in background to verify (non-blocking)

User clicks button
    ↓
React calls handleAction() function (not a hook)
    ↓
handleAction calls api.linkLocationToTrip()
    ↓
api.linkLocationToTrip() makes HTTP POST request
    ↓
Backend receives request (Next.js route handler)
    ↓
Backend queries database (Supabase)
    ↓
Backend updates database (INSERT into trip_locations)
    ↓
Backend returns JSON response { tripLocation: {...} } // found out about this here when I asked it it explain the flow all the way to the nuts and bolts level and dug deeper.
    ↓
Extension receives response
    ↓
Extension invalidates cache (chrome.storage.local)
    ↓
Extension emits Chrome message { type: 'LOCATION_MOVED_TO_DAY' }
    ↓
Event listeners receive message (useEffect hooks)
    ↓
Listeners call loadDataWithCache()
    ↓
loadDataWithCache() makes HTTP GET request to backend
    ↓
Backend queries database
    ↓
Backend returns fresh data
    ↓
Extension calls setTrips(freshData) - updates React state
    ↓
React detects state changed
    ↓
React automatically re-renders component
    ↓
UI updates (user sees updated trip)

**This eliminates:**
- Waiting for API calls (optimistic update)
- Waiting for refresh (background)
- Blocking UI (zero blocking time)

### The Solution: Hybrid Approach

**Decision:** Use both patterns, optimized for speed:

1. **Callbacks for Parent-Child** (Fastest)
   - Direct function calls (~0ms overhead)
   - Type-safe (TypeScript)
   - Used when child needs to notify parent

2. **Events for Background Script** (Necessary)
   - Chrome message passing (~1-5ms overhead)
   - Only used when direct callback not possible
   - Used for background script → popup communication

3. **Optimistic Updates** (Instant Feedback)
   - Update UI immediately using backend response
   - Background sync ensures correctness
   - Zero blocking time

### Why Callbacks Are Better for Speed

**Performance Comparison:**

**Callbacks:**
```
Child calls props.onLocationMoved()
    ↓
[0ms] Direct function call
    ↓
Parent updates state immediately
Total: ~0ms overhead
```

**Events:**
```
Child sends chrome.runtime.sendMessage()
    ↓
[1-5ms] Message queue processing
    ↓
Parent receives message
    ↓
Parent updates state
Total: ~1-5ms overhead
```

**Verdict:** Callbacks are faster (~0ms vs ~1-5ms), making them better for speed optimization.

### Why Events Are Still Needed

**Limitation:** Background script cannot pass callbacks to popup.

**Scenario:** User right-clicks text → saves location via context menu
- Background script runs in separate context
- Cannot pass callback props
- Must use Chrome message passing (events)

**Solution:** Use events only where callbacks are impossible.

### Final Architecture

**Parent-Child Communication:**
- Use callbacks (fastest, type-safe)
- Direct function calls
- Optimistic updates for instant feedback

**Background Script Communication:**
- Use events (necessary, only option)
- Chrome message passing
- Minimal overhead acceptable

**Result:**
- Zero blocking time for user actions
- Instant visual feedback
- Fastest possible communication where callbacks work
- Events only where necessary

### Key Takeaway

**Optimization Goal:** Speed and instant feedback.

**Best Approach:** Optimistic updates + callbacks (where possible) + events (where necessary).

**Why:** Callbacks provide fastest communication (~0ms), optimistic updates provide instant feedback (0ms blocking), events only used when callbacks aren't possible.

---

**Document Status:** Draft - Ready for Review  
**Next Steps:** 
1. Review and approve requirements
2. Implement Phase 1 (optimistic updates with callbacks)
3. Test and iterate
4. Complete remaining phases
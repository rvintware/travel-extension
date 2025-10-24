# Map Popup Window - PATH FIX COMPLETE ✅

## Issue Found

The map popup window was showing **"ERR_FILE_NOT_FOUND"** because the code was trying to access `map.html` at the root level, but Plasmo builds tab pages in a subdirectory structure.

**Error:**
```
chrome-extension://gcaaceinamidkhnohkcokbkamdlccl/map.html?tripId=38ec...
❌ Your file couldn't be accessed
ERR_FILE_NOT_FOUND
```

**Root Cause:**
```typescript
// WRONG PATH ❌
chrome.runtime.getURL(`map.html?tripId=${trip.id}`)
```

Plasmo builds tab pages in:
```
build/chrome-mv3-dev/tabs/map.html  ← Actual location
```

## Fix Applied

### Changed in `extension/popup/TripDetail.tsx` (line 113):

```typescript
// BEFORE ❌
url: chrome.runtime.getURL(`map.html?tripId=${trip.id}`),

// AFTER ✅
url: chrome.runtime.getURL(`tabs/map.html?tripId=${trip.id}`),
```

## Build Status

```bash
✅ Extension rebuilt successfully in 2660ms
✅ No TypeScript errors
✅ No linter errors
✅ File path corrected: tabs/map.html
```

## File Structure (Verified)

```
extension/build/chrome-mv3-dev/
├── popup.html
├── manifest.json
└── tabs/
    ├── map.html          ← EXISTS HERE!
    └── map.4d9735ef.js
```

## Testing Instructions

### 1. Reload Extension
```
1. Go to chrome://extensions
2. Click reload button on "Travel Companion"
3. Or load unpacked from:
   /Users/rehanvishwanath/Desktop/Chrome Extension/extension/build/chrome-mv3-dev/
```

### 2. Test Map Popup
```
1. Open extension popup
2. Go to any trip (e.g., "SEA+A")
3. Click "🗺️ Map View" button
4. Expected:
   ✅ Popup window opens (600×700px)
   ✅ Centered on screen
   ✅ Shows trip name in header
   ✅ No ERR_FILE_NOT_FOUND error
```

### 3. Verify Map Loads
```
1. In popup window, open DevTools (F12)
2. Check Console tab
3. Expected logs:
   ✅ [TripMapView] Map data loaded: { ... }
   ✅ [GoogleMaps] API loaded successfully
   ❌ NO "Refused to load" CSP errors
```

### 4. Test Map Features
```
1. Verify markers appear on map
2. Click a marker
3. Expected:
   ✅ Info window opens
   ✅ Shows location name
   ✅ Shows address
   ✅ Shows day/time (if scheduled)
```

### 5. Test Close Button
```
1. Click "✕ Close" button in header
2. Expected:
   ✅ Popup window closes
   ✅ Extension popup still works
```

## What Should Work Now

| Feature | Status |
|---------|--------|
| Popup window opens | ✅ Should work |
| Correct file path | ✅ Fixed |
| Window size (600×700) | ✅ Should work |
| Window positioning (centered) | ✅ Should work |
| Trip data loads | ✅ Should work |
| Google Maps loads | ⚠️ Test needed |
| Markers display | ⚠️ Test needed |
| Info windows work | ⚠️ Test needed |
| Close button | ✅ Should work |

## Troubleshooting

### If window still doesn't open:
- Check DevTools → Console for errors
- Verify file exists: `build/chrome-mv3-dev/tabs/map.html`
- Ensure extension was reloaded

### If map doesn't load in window:
- Check `.env.local` has `PLASMO_PUBLIC_GOOGLE_PLACES_API_KEY`
- Open window DevTools → Console
- Look for Google Maps API errors

### If markers don't appear:
- Verify trip has locations with lat/lng coordinates
- Check API: `GET /api/trips/:id/map-data`
- Check console for "[TripMapView] Map data loaded"

## Implementation Summary

### Files Modified
```
extension/popup/TripDetail.tsx  ← Fixed path (1 line change)
```

### Files Created (Previous Implementation)
```
extension/tabs/map.tsx                   ← Tab page
extension/components/map/TripMapView.tsx ← Updated props
extension/lib/map/googleMaps.ts          ← Map utilities
extension/lib/map/markerUtils.ts         ← Marker utilities
```

### Backend (Already Working)
```
backend/app/api/trips/[id]/map-data/route.ts  ← Map data API
backend/app/api/trips/[id]/route.ts           ← Trip data API
```

## Next Steps

1. **Test immediately** - Click "Map View" button
2. **Share results** - Let me know if:
   - ✅ Window opens without file error
   - ✅ Google Maps loads
   - ✅ Markers appear
   - ❌ Any new errors

3. **If it works** - Ready for Phase 2:
   - Day filters
   - Marker clustering
   - Route visualization
   - List view toggle

## Success Criteria

- [x] Path corrected to `tabs/map.html`
- [x] Extension rebuilt successfully
- [ ] Window opens without ERR_FILE_NOT_FOUND
- [ ] Google Maps loads without CSP errors
- [ ] Markers display for all locations
- [ ] Info windows work on click
- [ ] Close button closes window

---

**Status:** ✅ **PATH FIX APPLIED - READY TO TEST**

**Time to Fix:** 2 minutes  
**Files Changed:** 1 file (1 line)  
**Build Status:** ✅ Success

**Try it now!** The file path is corrected. Click "🗺️ Map View" and it should open the popup window! 🗺️✨


# Phase 0.2 Testing Guide

**Status:** Ready to Test! 🚀  
**Last Updated:** October 12, 2025

---

## Prerequisites

✅ Supabase database set up and running  
✅ Backend API built and tested  
✅ Extension built successfully  

---

## Quick Start (5 minutes)

### 1. Start Backend API

```bash
cd backend
export PATH=~/.npm-global/bin:$PATH
pnpm run dev
```

**Verify:** Go to http://localhost:3000/api/health  
**Expected:** `{"status":"ok","database":"connected"}`

---

### 2. Start Extension Dev Mode

```bash
cd extension
export PATH=~/.npm-global/bin:$PATH
pnpm run dev
```

**Verify:** Build completes, creates `build/chrome-mv3-dev/`

---

### 3. Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/build/chrome-mv3-dev`
5. Pin the extension to toolbar

---

### 4. Initial Configuration

1. **Click extension icon**
2. **Click ⚙️ (Settings)**
3. **Set Default Country:** Japan
4. **Click "Save Settings"**

You're now ready to test!

---

## Test Scenarios

### Test 1: Save to Library (No Trip Yet)

**Steps:**
1. Go to any Reddit travel thread
2. Highlight a recommendation (e.g., "This ramen shop is amazing")
3. Right-click
4. Should see: "🇯🇵 Save to Japan Library" (only option)
5. Click it
6. Toast appears: "✓ Japan Library"

**Verify:**
- Open extension
- Click "My Locations" tab
- Should see "Japan (1 location)"
- Click Japan
- See your saved location (Pokemon-style card)

---

### Test 2: Create a Trip

**Steps:**
1. Click "My Trips" tab
2. Click "+ New Trip" button
3. ...wait, we need to add this! 😅

**Workaround for MVP:**
Use the backend API directly:
```bash
curl -X POST http://localhost:3000/api/trips \
  --header "Content-Type: application/json" \
  --data '{"userId":"YOUR_USER_ID","countryId":"43fa693a-e0aa-442f-88b5-bf539a980f61","name":"Tokyo 2025","durationDays":3}'
```

Get your userId from extension console:
```javascript
chrome.storage.local.get('userId', console.log)
```

---

### Test 3: Save to Default Trip

**Steps:**
1. Go to Settings
2. Set "Default Trip" to the trip you created
3. Save settings
4. Go to Reddit
5. Highlight text
6. Right-click
7. Should now see TWO options:
   - "⭐ Save to Tokyo 2025"
   - "🇯🇵 Save to Japan Library"
8. Click "Save to Tokyo 2025"
9. Toast: "✓ Tokyo 2025"

**Verify:**
- My Trips → Tokyo 2025
- Should see the location (under "All" or "Unscheduled")

---

### Test 4: Organize by Days

**Steps:**
1. In trip detail, click gear on a location
2. Select "Move to Day 1"
3. Location moves to Day 1
4. Click "Day 1" filter
5. See time estimate: "Xh Xm total · 😊 Comfortable"

**Verify:**
- Location appears under Day 1
- Can move to Day 2, Day 3
- Can move to Unscheduled

---

### Test 5: Add from Library to Trip

**Steps:**
1. Save a few locations to library only
2. My Locations → Japan
3. Click gear → "Add to Trip"
4. Select trip and day
5. Click "Add"

**Verify:**
- Location now in trip
- Still in library (not removed)
- Can be in multiple trips

---

### Test 6: Remove vs Delete

**In Trip:**
1. Gear → "Remove from Trip"
2. Confirm
3. Location removed from trip
4. Still in library ✅

**In Library:**
1. Gear → "Delete"
2. Confirm warning
3. Location deleted from everywhere
4. Removed from all trips ✅

---

## Debugging

### Extension Console

```javascript
// Check if API is reachable
fetch('http://localhost:3000/api/health').then(r => r.json()).then(console.log)

// Check user ID
chrome.storage.local.get('userId', console.log)

// Check settings
chrome.storage.local.get('settings', console.log)

// Clear settings (reset)
chrome.storage.local.remove('settings')
```

### Backend Logs

Check the terminal where `pnpm run dev` is running.

Errors will show:
- Missing environment variables
- Database connection issues
- API validation errors

### Common Issues

**"Failed to save" toast:**
- Backend not running → Start `pnpm run dev`
- CORS error → Check middleware.ts exists
- Validation error → Check console logs

**No context menu options:**
- Settings not configured → Set default country
- Extension not loaded → Reload extension
- Page not refreshed → Refresh page after install

**Empty trip/library:**
- Data not saved → Check backend logs
- Wrong userId → Check extension console
- API error → Check network tab

---

## Success Criteria

✅ **Phase 0.2 is successful when:**

1. Can save locations via right-click (trip or library)
2. Toast notifications work
3. Can view trips and locations in extension
4. Can navigate between views smoothly
5. Can organize locations by day
6. Time estimates show correctly
7. Settings persist
8. No console errors
9. All data persists in Supabase

---

## What to Test

**Critical:**
- [ ] Right-click save to trip
- [ ] Right-click save to library
- [ ] View trips list
- [ ] View library by country
- [ ] Navigate into trip detail
- [ ] Filter by day
- [ ] Move location between days

**Important:**
- [ ] Settings persistence
- [ ] Remove from trip (not delete)
- [ ] Delete permanently
- [ ] Add to trip from library
- [ ] Time estimates
- [ ] Empty states

**Nice to Have:**
- [ ] Comfort level accuracy
- [ ] Toast messages correct
- [ ] UI feels smooth
- [ ] No visual bugs

---

## Next Phase Preview

### Phase 0.3: AI Processing

Once Phase 0.2 is validated:

**What we'll add:**
1. AI extraction of proper location names
2. Google Places for addresses, photos, coords
3. AI synthesis of tips from highlighted text
4. Processing status indicators
5. Automatic enrichment of saved locations

**Impact on UI:**
- Location cards will have real photos
- Addresses will be geocoded
- Tips will be properly formatted quotes
- Names will be clean ("Senso-ji Temple" not "this temple is...")

**Estimated time:** 4-5 hours

---

**Happy Testing! 🎉**

If you find bugs or have questions, check the artifacts folder for specs:
- `artifacts/UIUX/phase_0_2_ui_specification.md` - UI design
- `artifacts/database_schema.sql` - Database structure
- `artifacts/system_design_specification.md` - Full architecture


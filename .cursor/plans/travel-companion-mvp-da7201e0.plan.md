<!-- da7201e0-e4ef-4fa3-a920-5745a30a761e 360920fb-dc14-4344-a4f3-a05ade83f721 -->
# Phase 0.1: Local Chrome Extension Build Plan

## Goal

Build a working Chrome extension that captures highlighted text via right-click and displays it in a popup, using only local storage. This validates the UX before adding backend complexity.

## Project Structure (Future-Ready)

```
/Chrome Extension/
├── extension/              ← Plasmo Chrome extension
│   ├── background/         ← Service worker (context menu)
│   ├── popup/              ← Popup UI components
│   ├── contents/           ← Content scripts (future: screenshots)
│   ├── components/         ← Shared React components
│   ├── lib/                ← Utilities, types, storage helpers
│   ├── assets/             ← Icons, images
│   └── package.json
│
├── backend/                ← Next.js API (Phase 0.2+)
│   └── [empty for now]
│
├── artifacts/              ← Design docs (already exists)
│   ├── problem_exploration.md
│   ├── system_design_specification.md
│   └── UIUX/
│       └── highlevel_uiux.md
│
└── README.md
```

## Phase 0.1 Feature Scope

### ✅ What We're Building

**Core Features:**

1. **Context Menu**: Right-click on selected text → "Save to My Trips"
2. **Text Capture**: Save highlighted text + URL + page title
3. **Local Storage**: Store in chrome.storage.local (no backend)
4. **Popup UI**: Display saved items in a clean list
5. **Delete**: Remove saved items
6. **Default Trip**: Single trip called "My Trips" (hardcoded)

**UI Components:**

- Popup main view: List of saved captures
- Capture card: Text snippet + URL + timestamp + delete button
- Empty state: Friendly prompt to get started
- Toast notification: Confirmation after save

### ❌ What We're NOT Building (Yet)

- Multiple trips/folders
- Screenshots
- Backend API
- AI processing
- Google Places integration
- Photo thumbnails
- Verified/unverified badges
- Edit functionality
- Map view
- Active trip dropdown

### Architecture Decisions for Phase 0.1

**Technology Stack:**

- Framework: Plasmo (Chrome Extension framework)
- Language: TypeScript
- UI: React + Tailwind CSS
- Storage: chrome.storage.local
- Package Manager: pnpm

**Why Plasmo?**

- Handles Manifest V3 complexity
- Hot reload during development
- TypeScript support out of the box
- React integration
- Easy to extend to backend later

**Data Model (Local Storage):**

```typescript
interface SavedCapture {
  id: string;              // UUID
  text: string;            // Highlighted text
  url: string;             // Source URL
  pageTitle: string;       // Page title
  timestamp: number;       // Unix timestamp
  tripId: string;          // Hardcoded "default" for Phase 0.1
}

interface StorageData {
  captures: SavedCapture[];
  userId: string;          // Generated on install (for future)
}
```

## Implementation Steps

### Step 1: Initialize Plasmo Extension

**Tasks:**

- Install pnpm (if needed)
- Run `pnpm create plasmo` to generate extension
- Configure TypeScript
- Add Tailwind CSS
- Test basic popup loads

**Files Created:**

- `extension/package.json`
- `extension/tsconfig.json`
- `extension/tailwind.config.js`
- `extension/popup.tsx` (basic)

**Validation:**

- Extension loads in Chrome
- Popup opens and shows "Hello World"

---

### Step 2: Set Up Project Structure

**Tasks:**

- Create folder structure (background, components, lib)
- Create shared TypeScript types
- Create storage helper utilities
- Create basic UI components (Card, Button, EmptyState)

**Files Created:**

- `extension/lib/types.ts` - TypeScript interfaces
- `extension/lib/storage.ts` - chrome.storage helpers
- `extension/lib/utils.ts` - Utility functions (UUID, date formatting)
- `extension/components/CaptureCard.tsx` - Card component
- `extension/components/EmptyState.tsx` - Empty state component
- `extension/components/Toast.tsx` - Toast notification

**Validation:**

- TypeScript compiles without errors
- Can import types and utilities

---

### Step 3: Implement Context Menu (Background Script)

**Tasks:**

- Create background service worker
- Register context menu on install
- Listen for context menu clicks
- Generate user ID on first install
- Send capture data to content script
- Show toast notification on save

**Files Created:**

- `extension/background/index.ts` - Main service worker
- `extension/background/contextMenu.ts` - Context menu logic

**API Used:**

- `chrome.contextMenus.create()`
- `chrome.contextMenus.onClicked`
- `chrome.runtime.onInstalled`
- `chrome.storage.local.set()`
- `chrome.tabs.sendMessage()`

**Validation:**

- Right-click on selected text shows menu item
- Clicking menu item triggers handler
- User ID is generated on install

---

### Step 4: Implement Capture Logic

**Tasks:**

- Create content script (for future screenshot capture)
- Capture: text, URL, page title
- Generate capture ID (UUID)
- Save to chrome.storage.local
- Broadcast update to popup (if open)

**Files Created:**

- `extension/contents/capture.ts` (minimal for Phase 0.1)

**Storage Logic:**

```typescript
// Save capture
const capture: SavedCapture = {
  id: crypto.randomUUID(),
  text: selectedText,
  url: window.location.href,
  pageTitle: document.title,
  timestamp: Date.now(),
  tripId: "default"
};

// Get existing captures
const { captures = [] } = await chrome.storage.local.get('captures');

// Add new capture
captures.unshift(capture); // Add to beginning

// Save back
await chrome.storage.local.set({ captures });
```

**Validation:**

- Can save multiple captures
- Data persists after browser restart
- Captures stored in chronological order

---

### Step 5: Build Popup UI

**Tasks:**

- Create main popup component
- Fetch captures from storage on load
- Display list of capture cards
- Show empty state if no captures
- Handle delete action
- Auto-refresh when new capture added
- Style with Tailwind CSS

**Files Created:**

- `extension/popup/index.tsx` - Main popup (refactor existing)
- `extension/popup/CaptureList.tsx` - List component
- `extension/components/CaptureCard.tsx` - Individual card

**UI Layout:**

```tsx
<Popup>
  <Header>
    <Title>My Trips</Title>
    <Count>{captures.length} saved</Count>
  </Header>
  
  {captures.length === 0 ? (
    <EmptyState />
  ) : (
    <CaptureList>
      {captures.map(capture => (
        <CaptureCard 
          key={capture.id}
          capture={capture}
          onDelete={handleDelete}
        />
      ))}
    </CaptureList>
  )}
</Popup>
```

**Validation:**

- Popup displays saved captures
- Delete removes item from list
- Empty state shows when no captures
- Scrollable if many captures

---

### Step 6: Implement Delete Functionality

**Tasks:**

- Add delete button to capture cards
- Remove from storage
- Update UI optimistically
- Add confirmation (optional for MVP)

**Logic:**

```typescript
const handleDelete = async (captureId: string) => {
  const { captures = [] } = await chrome.storage.local.get('captures');
  const updated = captures.filter(c => c.id !== captureId);
  await chrome.storage.local.set({ captures: updated });
  // UI updates automatically via React state
};
```

**Validation:**

- Delete removes item immediately
- Data removed from storage
- No errors in console

---

### Step 7: Add Toast Notifications

**Tasks:**

- Create toast component
- Show toast after successful save
- Auto-dismiss after 3 seconds
- Position in top-right of page

**Files Created:**

- `extension/components/Toast.tsx`
- `extension/contents/toast.ts` - Inject toast into page

**Implementation:**

```typescript
// In background script, after save
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_TOAST',
  message: '✓ Saved to My Trips'
});

// In content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_TOAST') {
    showToast(message.message);
  }
});
```

**Validation:**

- Toast appears after save
- Toast auto-dismisses
- Toast doesn't break page layout

---

### Step 8: Polish & Test

**Tasks:**

- Add loading states
- Add error handling (storage quota exceeded)
- Improve styling (colors, spacing, shadows)
- Add hover effects
- Test on various websites (Reddit, blogs, etc.)
- Test edge cases (very long text, special characters)
- Add keyboard shortcuts (optional)

**Polish Items:**

- Smooth animations (fade in/out)
- Proper spacing using design system
- Color scheme from UIUX doc
- Responsive to different popup sizes
- Proper focus states for accessibility

**Validation:**

- Works on Reddit, Hacker News, blogs
- Handles long text gracefully
- No console errors
- Feels smooth and fast

---

### Step 9: Create README & Documentation

**Tasks:**

- Write installation instructions
- Document how to use
- Add screenshots
- Document development setup
- Create troubleshooting guide

**Files Created:**

- `extension/README.md`
- `extension/DEVELOPMENT.md`

**Validation:**

- Someone can follow README to install
- Development setup is clear

---

## Testing Checklist

### Functional Testing

- [ ] Can install extension in Chrome
- [ ] Context menu appears on text selection
- [ ] Clicking menu saves capture
- [ ] Toast notification appears
- [ ] Popup displays saved captures
- [ ] Can delete captures
- [ ] Data persists after browser restart
- [ ] Works on multiple websites

### Edge Cases

- [ ] Very long text (1000+ chars)
- [ ] Special characters (emoji, unicode)
- [ ] No text selected (should not show menu)
- [ ] Storage limit (test with 100+ captures)
- [ ] Multiple saves in quick succession

### Browser Testing

- [ ] Chrome (primary)
- [ ] Edge (Chromium-based, should work)

### Performance

- [ ] Popup opens in < 300ms
- [ ] Save completes in < 500ms
- [ ] No memory leaks

---

## Migration Path to Phase 0.2

When ready to add backend, changes needed:

1. **Replace storage layer:**

   - `storage.ts` calls API instead of chrome.storage
   - Keep chrome.storage as cache

2. **Add API client:**

   - `lib/api.ts` with fetch calls
   - Handle auth (userId header)

3. **Add processing states:**

   - Update CaptureCard to show "processing" state
   - Poll API for updates

4. **Minimal changes to UI:**

   - Most React components stay the same
   - Just change data source

**Estimated migration time: 2-3 hours**

---

## Success Criteria for Phase 0.1

✅ **Phase 0.1 is complete when:**

1. Can save 10 Reddit recommendations in < 2 minutes
2. Popup opens instantly (< 300ms)
3. Data persists across browser restarts
4. Delete works reliably
5. UI feels smooth and polished
6. You personally use it for 1 full day
7. Zero console errors during normal use

✅ **Personal validation:**

- Does it feel faster than copy-paste to Google Docs?
- Would you be frustrated if it stopped working?
- Do you reach for it instinctively after 10 saves?

If YES to all → Ready for Phase 0.2 (backend)!

---

## Estimated Timeline

- **Step 1-2** (Setup): 30-45 minutes
- **Step 3** (Context menu): 30 minutes  
- **Step 4** (Capture): 30 minutes
- **Step 5** (Popup UI): 1-2 hours
- **Step 6** (Delete): 20 minutes
- **Step 7** (Toasts): 30 minutes
- **Step 8** (Polish): 1-2 hours
- **Step 9** (Docs): 30 minutes

**Total: 5-7 hours** (can split across 2-3 sessions)

---

## Development Workflow

### Session 1: Setup & Basic Functionality (2-3 hours)

- Steps 1-4
- **Goal:** Right-click saves to storage

### Session 2: UI & Polish (2-3 hours)

- Steps 5-7
- **Goal:** Beautiful popup with delete

### Session 3: Testing & Docs (1 hour)

- Steps 8-9
- **Goal:** Production-ready Phase 0.1

---

## Key Files to Create

```
extension/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── manifest.json (auto-generated by Plasmo)
│
├── background/
│   ├── index.ts           ← Main entry
│   └── contextMenu.ts     ← Context menu logic
│
├── popup/
│   ├── index.tsx          ← Main popup
│   └── CaptureList.tsx    ← List component
│
├── contents/
│   ├── capture.ts         ← (Minimal for now)
│   └── toast.ts           ← Toast injection
│
├── components/
│   ├── CaptureCard.tsx    ← Card component
│   ├── EmptyState.tsx     ← Empty state
│   ├── Toast.tsx          ← Toast component
│   └── Button.tsx         ← Button component
│
├── lib/
│   ├── types.ts           ← TypeScript interfaces
│   ├── storage.ts         ← Storage helpers
│   └── utils.ts           ← Utilities
│
└── assets/
    └── icon.png
```

**Total: ~15-20 files for complete Phase 0.1**

---

## Next Steps After Phase 0.1

Once you've validated the UX:

1. **Phase 0.2**: Add backend (Next.js + Supabase)
2. **Phase 0.3**: Add AI processing (OpenAI + Google Places + Inngest)
3. **Phase 1.0**: Polish and release

Each phase builds on the previous, so the work isn't wasted!

### To-dos

- [ ] Initialize Plasmo extension project with TypeScript and Tailwind CSS
- [ ] Create project folder structure and shared TypeScript types, utilities, and UI components
- [ ] Implement background service worker with context menu registration and user ID generation
- [ ] Implement capture logic to save text + URL + title to chrome.storage.local
- [ ] Create popup UI with capture list, cards, and empty state using React + Tailwind
- [ ] Add delete functionality to remove captures from storage and update UI
- [ ] Create toast notification system to show save confirmations on web pages
- [ ] Polish UI styling, add animations, test on various websites, and handle edge cases
- [ ] Write README with installation and usage instructions, add screenshots
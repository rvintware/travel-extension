# Travel Companion - Full Stack Project

A Chrome extension and backend system for capturing, organizing, and planning travel recommendations from across the web.

## Project Structure

```
/Chrome Extension/
├── extension/              ← Chrome extension (Phase 0.1 COMPLETE)
│   ├── popup.tsx
│   ├── components/
│   ├── background/
│   ├── contents/
│   └── lib/
│
├── backend/                ← Next.js API (Phase 0.2 - Coming soon)
│   └── [empty for now]
│
└── artifacts/              ← Design documentation
    ├── problem_exploration.md
    ├── system_design_specification.md
    └── UIUX/
        └── highlevel_uiux.md
```

## Current Status: Phase 0.1 ✅

The Chrome extension is complete and working with local storage:

- ✅ Context menu (right-click to save)
- ✅ Local storage (chrome.storage.local)
- ✅ Popup UI with list view
- ✅ Delete functionality
- ✅ Toast notifications
- ✅ TypeScript + React + Tailwind CSS

## Quick Start

### Run the Extension

```bash
cd extension
pnpm install
pnpm run dev
```

Then load `extension/build/chrome-mv3-dev` in Chrome at `chrome://extensions/`

See [extension/README.md](./extension/README.md) for detailed instructions.

## Documentation

All design documents are in the `artifacts/` folder:

1. **[Problem Exploration](./artifacts/problem_exploration.md)** - The core problem we're solving
2. **[System Design Specification](./artifacts/system_design_specification.md)** - Complete technical architecture
3. **[High-Level UI/UX Design](./artifacts/UIUX/highlevel_uiux.md)** - Detailed UI wireframes and design system

## Development Phases

### Phase 0.1: Local Extension ✅ COMPLETE
**Status**: Working and ready to use!

**Features**:
- Chrome extension with local storage
- Right-click to capture text
- Popup UI to view/delete captures
- Toast notifications

**Try it out**: See extension/README.md

---

### Phase 0.2: Backend Integration (Next)
**Status**: Not started

**What we'll add**:
- Next.js backend API
- Supabase database
- User authentication
- Cloud sync

**Estimated time**: 2-3 hours

---

### Phase 0.3: AI Processing
**Status**: Not started

**What we'll add**:
- OpenAI GPT-4 for extraction & synthesis
- Google Places API for location data
- Inngest for job queue
- Processing states in UI

**Estimated time**: 3-4 hours

---

### Phase 1.0: Map Visualization
**Status**: Not started

**What we'll add**:
- Google Maps integration with pins
- Trip organization (multiple folders)
- Sharing and collaboration
- Export functionality

**Estimated time**: 1-2 weeks

## Testing Phase 0.1

1. **Install the extension** (see extension/README.md)

2. **Test on Reddit**:
   - Go to r/travel or r/JapanTravel
   - Find a comment with a recommendation
   - Highlight the text
   - Right-click → "⭐ Save to My Trips"
   - See the green toast appear

3. **View your saves**:
   - Click the extension icon
   - See your saved captures
   - Click "View Source" to go back to Reddit
   - Click "Delete" to remove

4. **Success criteria**:
   - Can save 10 recommendations in < 2 minutes
   - Data persists after browser restart
   - UI feels smooth and fast

## Next Steps

Once you've validated Phase 0.1:

1. Use it personally for 1-2 days
2. Collect 20+ real travel recommendations
3. Decide if it's worth adding backend + AI
4. If yes → Build Phase 0.2

## Tech Stack

**Current (Phase 0.1)**:
- Plasmo (Chrome Extension framework)
- React + TypeScript
- Tailwind CSS
- chrome.storage.local

**Future (Phase 0.2+)**:
- Next.js 14 (Backend)
- Supabase (Database)
- OpenAI GPT-4o-mini (AI)
- Google Places API (Location data)
- Inngest (Job queue)
- Vercel (Hosting)

## Contributing

This is a personal project. Phase 0.1 is complete and ready for personal use.

## License

Private project - All rights reserved

---

**Built by Rehan Vishwanath**  
**Last Updated**: October 11, 2025


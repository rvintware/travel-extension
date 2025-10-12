# Travel Companion - Chrome Extension

A Chrome extension that helps you capture and organize travel recommendations from across the web.

## Features

- 🎯 **One-Click Capture**: Right-click any highlighted text to save it
- 📍 **Organized Storage**: All your saves in one place
- 🗑️ **Easy Management**: View and delete captures
- ⚡ **Fast & Local**: All data stored locally on your device

## Installation

### Development Mode

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Build the Extension**
   ```bash
   pnpm run build
   ```
   This creates a `build/chrome-mv3-prod` folder.

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` folder

4. **Development Mode (with hot reload)**
   ```bash
   pnpm run dev
   ```
   Then load the `build/chrome-mv3-dev` folder instead.

## How to Use

### Saving a Location

1. Browse any website (Reddit, blog, etc.)
2. Find a travel recommendation you like
3. **Highlight the text** (e.g., "Bar Raval near AGO has amazing vermouth")
4. **Right-click** and select **"⭐ Save to My Trips"**
5. A green toast notification confirms the save

### Viewing Your Saves

1. Click the Travel Companion icon in your Chrome toolbar
2. Browse your saved locations
3. Click **"🔗 View Source"** to revisit the original page
4. Click **"🗑️ Delete"** to remove a save

## Project Structure

```
extension/
├── popup.tsx              # Main popup UI
├── components/            # Reusable React components
│   ├── CaptureCard.tsx   # Individual location card
│   ├── EmptyState.tsx    # Empty state UI
│   └── Button.tsx        # Button component
├── background/            # Background service worker
│   └── index.ts          # Context menu & capture logic
├── contents/              # Content scripts
│   └── index.tsx         # Toast notifications
├── lib/                   # Utilities
│   ├── types.ts          # TypeScript types
│   ├── storage.ts        # Chrome storage helpers
│   └── utils.ts          # Utility functions
├── assets/                # Images and icons
│   └── icon.png
└── style.css             # Tailwind CSS styles
```

## Tech Stack

- **Framework**: [Plasmo](https://www.plasmo.com/) (Chrome Extension framework)
- **UI**: React + TypeScript
- **Styling**: Tailwind CSS
- **Storage**: chrome.storage.local
- **Build Tool**: Plasmo's built-in bundler

## Development

### Commands

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run package` - Package extension for distribution

### Tips

- The extension automatically reloads when you save files in dev mode
- Check the console in `chrome://extensions/` for background script logs
- Use Chrome DevTools on the popup by right-clicking and selecting "Inspect"

## Phase 0.1 - Current Features

This is the MVP (Phase 0.1) with local storage only:

✅ Context menu integration  
✅ Text capture (highlight + right-click)  
✅ Local storage (chrome.storage.local)  
✅ Popup UI with list view  
✅ Delete functionality  
✅ Toast notifications

## Future Phases

- **Phase 0.2**: Backend API + Database (Supabase)
- **Phase 0.3**: AI processing (OpenAI + Google Places)
- **Phase 1.0**: Map visualization, multiple trips, sharing

## Troubleshooting

### Extension not showing in toolbar
- Make sure you pinned it: Click the puzzle icon → Pin Travel Companion

### Right-click menu not appearing
- Refresh the page after installing the extension
- Make sure you've selected/highlighted text first

### Popup not opening
- Check if the extension is enabled in `chrome://extensions/`
- Try refreshing the extension (click the refresh icon)

### Data not persisting
- Chrome extensions have a storage limit (10MB for local storage)
- Check browser console for errors

## License

Private project - All rights reserved

## Contact

For questions or issues, contact Rehan Vishwanath

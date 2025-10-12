# 🚀 Quick Start Guide - Travel Companion

Get up and running in under 5 minutes!

## Step 1: Build the Extension

```bash
cd extension
export PATH=~/.npm-global/bin:$PATH
pnpm install
pnpm run build
```

Wait for the build to complete (~20 seconds first time, then < 2 seconds).

## Step 2: Load in Chrome

1. Open Chrome and go to: **`chrome://extensions/`**

2. **Enable "Developer mode"** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Navigate to and select:
   ```
   /Users/rehanvishwanath/Desktop/Chrome Extension/extension/build/chrome-mv3-prod
   ```

5. The extension appears! 🎉

6. **Pin it to your toolbar**:
   - Click the puzzle icon (🧩) in Chrome toolbar
   - Find "Travel Companion"
   - Click the pin icon

## Step 3: Test It Out

### Save Your First Location

1. Go to **reddit.com/r/JapanTravel**

2. Find a comment with a recommendation, like:
   > "The ramen shop near Shibuya Station is incredible, get there before 11am"

3. **Highlight that text**

4. **Right-click** → Select **"⭐ Save to My Trips"**

5. See the green toast: **"✓ Saved to My Trips"**

### View Your Saves

1. Click the **🗺️ Travel Companion** icon in your toolbar

2. See your saved location!

3. Try:
   - Click **"🔗 View Source"** to go back to Reddit
   - Click **"🗑️ Delete"** to remove it

### Save More

Go save 5-10 more recommendations from:
- Reddit: r/travel, r/solotravel
- Any travel blog
- Hacker News travel threads

## Development Mode (Optional)

For development with hot reload:

```bash
cd extension
pnpm run dev
```

Then load `extension/build/chrome-mv3-dev` instead.

Changes to popup files reload automatically!

## Troubleshooting

### "pnpm: command not found"
```bash
export PATH=~/.npm-global/bin:$PATH
```

### Extension not showing in toolbar
- Click the puzzle icon (🧩)
- Pin "Travel Companion"

### Right-click menu not appearing
- Refresh the webpage
- Make sure text is highlighted first

### Build failing
```bash
cd extension
rm -rf node_modules
pnpm install
pnpm run build
```

## What's Next?

Once you've used it for a day and saved 20+ locations:

1. **Phase 0.2**: Add backend (Supabase + Next.js)
2. **Phase 0.3**: Add AI (OpenAI + Google Places)
3. **Phase 1.0**: Add map visualization

## Documentation

- **[Main README](./README.md)** - Project overview
- **[Extension README](./extension/README.md)** - Detailed extension docs
- **[Development Guide](./extension/DEVELOPMENT.md)** - For developers
- **[System Design](./artifacts/system_design_specification.md)** - Full technical spec
- **[UI/UX Design](./artifacts/UIUX/highlevel_uiux.md)** - Design system

## Success! 🎉

You now have a working travel companion extension. Start saving recommendations and enjoy never losing travel tips again!

**Next step**: Go browse some travel subreddits and save 10 recommendations. Then come back tomorrow and see if you actually use the extension naturally. If yes, Phase 0.2 is worth building!


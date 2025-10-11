# MVP Exploration: Travel Companion Chrome Extension

## Core User Flow

1. User browses Reddit thread about Toronto speakeasies
2. Highlights: "Bar Raval near AGO has amazing vermouth, go at 5pm to avoid crowds"
3. Right-clicks → "Save to [Toronto Trip]" (or keyboard shortcut)
4. Extension captures:
   - Highlighted text
   - URL + page title
   - Screenshot of visible area (REQUIRED)
   - HTML context around selection
5. Background: AI processing pipeline runs automatically
6. Result: Structured location data appears in extension popup under "Toronto" folder
7. User can view all saved locations, organized by trip
8. User can delete locations if needed

## Extension UI Components

### Popup UI (Click Extension Icon)
```
┌─────────────────────────────┐
│  Travel Companion           │
├─────────────────────────────┤
│  Active Trip: [Toronto ▼]   │
│                             │
│  My Trips:                  │
│  • Toronto        (12)      │
│  • Japan          (8)       │
│  • Taiwan         (3)       │
│  • Singapore      (0)       │
│  • China          (5)       │
│                             │
│  [+ New Trip]               │
└─────────────────────────────┘
```

When viewing a trip's locations:
```
┌─────────────────────────────┐
│  ← Toronto Trip (12)        │
├─────────────────────────────┤
│  ┌──────────────────────┐  │
│  │ Bar Raval            │  │
│  │ 505 College St       │  │
│  │ • Try vermouth       │  │
│  │ • Visit at 5pm       │  │
│  │ [Delete]             │  │
│  └──────────────────────┘  │
│                             │
│  ┌──────────────────────┐  │
│  │ Next Location...     │  │
│  └──────────────────────┘  │
└─────────────────────────────┘
```

### Context Menu (Right-Click on Selected Text)
Shows top 3 trips + active trip:
```
Right-click on selected text:
├─── Save to Toronto Trip ⭐
├─── Save to Japan Trip
├─── Save to Taiwan Trip
└─── Choose folder...
```

## Backend Processing Pipeline

```
1. Receive capture event from extension
   POST /api/capture
   {
     "text": "highlighted text",
     "url": "source URL",
     "pageTitle": "page title",
     "screenshot": "base64 image data",
     "tripId": "toronto-2024",
     "userId": "unique_user_id"
   }

2. Queue the processing job (don't block response)
   - Return jobId immediately
   - Process asynchronously

3. AI Extraction (LLM Call #1)
   - Extract location name
   - Extract city/neighborhood
   - Extract tips and recommendations
   - Determine category (restaurant, bar, sight, etc.)

4. Google Places API Search
   - Search for official location
   - Get place_id, coordinates, address
   - Fetch photos from Places API
   - Get business details

5. AI Synthesis (LLM Call #2)
   - Create concise description
   - Format tips as bullet points
   - Pull relevant quotes from original comment
   - Structure all data

6. Store in database
   - Save to locations table
   - Link to user and trip

7. Return structured data to extension
   {
     "status": "complete",
     "location": {
       "name": "Bar Raval",
       "address": "505 College St, Toronto",
       "coordinates": { "lat": 43.655, "lng": -79.410 },
       "photos": ["url1", "url2"],
       "summary": "Spanish-style bar known for vermouth",
       "tips": ["Visit at 5pm to avoid crowds", "Try the vermouth"],
       "category": "bar",
       "source": "reddit.com/...",
       "originalText": "Bar Raval near AGO..."
     }
   }
```

## What We're NOT Building in MVP

### Phase 1 MVP Exclusions:
- ❌ **No map view** - Focus on validating capture workflow only
- ❌ **No editing locations** - Can only delete, not edit details
- ❌ **No manual review/approval** - Everything auto-processes
- ❌ **No confidence scoring** - Trust AI output for now
- ❌ **No duplicate detection** - May save same location twice
- ❌ **No sharing/collaboration** - Single user only
- ❌ **No mobile app** - Chrome extension only
- ❌ **No Instagram integration** - Reddit/web pages only
- ❌ **No bulk import** - One capture at a time
- ❌ **No export** - Data lives in extension/backend only
- ❌ **No offline mode** - Requires internet connection
- ❌ **No keyboard shortcuts** - Right-click only for MVP
- ❌ **No settings/preferences** - Defaults only

### Future Phases (Post-MVP):
- Map visualization with pins
- Edit location details
- Confidence scoring and manual review queue
- Duplicate detection by place_id
- Trip sharing and collaboration
- Mobile companion app
- Instagram screenshot processing
- Bulk import from saved content
- Export to Google Maps/other formats
- Offline support
- Keyboard shortcuts and productivity features
- Customizable AI prompts
- Analytics (most saved cities, categories, etc.)

## MVP Success Criteria

The MVP is successful if:

1. **Capture Works Seamlessly**
   - Right-click workflow feels natural
   - User doesn't need to think about it
   - Becomes muscle memory within 10 saves

2. **Accuracy is High**
   - 80%+ of locations are correctly identified
   - Tips are relevant and well-formatted
   - Photos are appropriate

3. **User Gains Peace of Mind**
   - Can browse Reddit without anxiety about losing information
   - Trusts that highlights are captured and structured
   - Doesn't feel need to copy-paste to Google Docs anymore

4. **Daily Usage**
   - User naturally reaches for it during research sessions
   - Checks saved locations regularly
   - Builds up content in multiple trip folders

## Technical Architecture

### Chrome Extension Stack
- **Framework**: Plasmo (Manifest V3)
- **Language**: TypeScript
- **Storage**: chrome.storage.local (user ID, settings)
- **APIs Used**: 
  - chrome.contextMenus (right-click)
  - chrome.tabs (capture screenshot)
  - chrome.runtime (messaging)

### Backend Stack
- **Framework**: Next.js API routes
- **Host**: Vercel
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Maps**: Google Places API
- **Queue**: Simple async processing (no queue system for MVP)

### Database Schema
```sql
-- Users (simple ID, no auth yet)
users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP
)

-- Trips/Folders
trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP
)

-- Saved Locations
locations (
  id UUID PRIMARY KEY,
  user_id UUID,
  trip_id UUID REFERENCES trips(id),
  
  -- Original capture
  original_text TEXT,
  source_url TEXT,
  page_title TEXT,
  screenshot_url TEXT,
  
  -- Processed data
  name TEXT,
  place_id TEXT,
  address TEXT,
  lat DECIMAL,
  lng DECIMAL,
  category TEXT,
  summary TEXT,
  tips JSONB,
  photos TEXT[],
  
  -- Metadata
  confidence DECIMAL,
  processing_status TEXT,
  created_at TIMESTAMP
)
```

## Cost Estimates (100 saves/month)

- **OpenAI API**: ~$3-5/month
  - Extraction call: $0.01 per save
  - Synthesis call: $0.01 per save
  - Screenshots to vision: $0.01 per save
  
- **Google Places API**: Free
  - Text Search: 100 requests/month free
  - Place Details: 100 requests/month free
  
- **Hosting**: Free
  - Vercel: Hobby plan (free)
  - Supabase: Free tier (500MB)

**Total: ~$5/month for MVP testing**

## Key Risks

1. **Google Places API Accuracy**
   - Vague descriptions may return wrong location
   - Mitigation: Include screenshot context for AI

2. **Screenshot Quality**
   - Compressed or low-res screenshots may lose details
   - Mitigation: Capture at reasonable resolution (1280px wide)

3. **AI Hallucinations**
   - May make up details not in original text
   - Mitigation: Always include original text in output

4. **User Doesn't Actually Use It**
   - Habit formation is hard
   - Mitigation: Keep friction as low as possible

5. **Extension Gets Slow**
   - Screenshot capture can be heavy
   - Mitigation: Compress before sending to backend

## Development Phases

### Phase 1A: Capture Only (Week 1)
- Build extension with right-click capture
- Send data to backend
- Backend just stores raw data
- Extension shows list of raw captures
- **Goal**: Validate capture workflow UX

### Phase 1B: AI Processing (Week 2)
- Implement AI extraction pipeline
- Add Google Places integration
- Return structured data
- Extension displays formatted locations
- **Goal**: Validate AI accuracy

### Phase 1C: Polish (Week 3)
- Add delete functionality
- Improve error handling
- Add loading states
- Improve UI styling
- **Goal**: Make it feel polished

### Phase 2: Map View (Week 4+)
- Build web app with Google Maps
- Display pins by trip
- Click pin for details
- **Goal**: Spatial visualization value

## Next Steps

1. Set up development environment
2. Create Chrome extension boilerplate with Plasmo
3. Build backend API structure
4. Implement capture workflow (no AI)
5. Test with real Reddit threads
6. Add AI processing layer
7. Iterate on accuracy
8. Use it for 2 weeks personally
9. Decide if it's worth continuing


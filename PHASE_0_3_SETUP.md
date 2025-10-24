# Phase 0.3 Setup Guide

**Status:** In Progress  
**Next Steps:** Get API keys before testing

---

## API Keys Needed

Before testing Phase 0.3, you'll need these API keys:

### 1. OpenAI API Key
- **Get from:** https://platform.openai.com/api-keys
- **Model:** GPT-4o-mini
- **Cost:** ~$0.0015 per location save
- **Add to:** `backend/.env.local` as `OPENAI_API_KEY=sk-...`

### 2. Google Places API Key
- **Get from:** https://console.cloud.google.com
- **Enable APIs:** Places API, Places API (New), Geocoding API
- **Free tier:** 1000 requests/month
- **Add to:** `backend/.env.local` as `GOOGLE_PLACES_API_KEY=AIza...`

### 3. Inngest Account
- **Get from:** https://www.inngest.com/
- **Plan:** Free tier (50k jobs/month)
- **Setup:** Create app, get event key and signing key
- **Add to:** `backend/.env.local`:
  ```bash
  INNGEST_EVENT_KEY=...
  INNGEST_SIGNING_KEY=...
  ```

---

## Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Add column for storing rich context
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS original_context JSONB;

-- Add index for full-text search
CREATE INDEX IF NOT EXISTS idx_locations_name_gin 
ON locations USING gin(to_tsvector('english', name));

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locations' AND column_name = 'original_context';
```

---

## Local Development Setup

### Terminal 1: Backend
```bash
cd backend
pnpm run dev
```

### Terminal 2: Inngest Dev Server
```bash
npx inngest-cli@latest dev
```

### Terminal 3: Extension
```bash
cd extension
pnpm run dev
```

Then reload extension in Chrome.

---

## Testing Phase 0.3

Once API keys are set up:

1. Save a location from Reddit
2. Check Inngest dashboard (`http://localhost:8288`)
3. See job processing
4. Watch location card update from "Processing..." to complete
5. Verify photos, address, formatted tips appear

---

**Current Status:** Building context capture system (doesn't need API keys yet)


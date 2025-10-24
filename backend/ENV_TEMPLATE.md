# Environment Variables Setup

Create a `.env.local` file in the backend directory with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Phase 0.3: AI Processing
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_PLACES_API_KEY=AIza-your-google-places-key-here
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

## Getting API Keys

### OpenAI (Required for AI extraction)
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and paste as `OPENAI_API_KEY`

### Google Places (Required for location enrichment)
1. Go to https://console.cloud.google.com
2. Create/select project
3. Enable "Places API" and "Geocoding API"
4. Create API key under Credentials
5. Copy and paste as `GOOGLE_PLACES_API_KEY`

### Inngest (Required for async job processing)
1. Go to https://www.inngest.com/
2. Create account (free)
3. Create new app
4. Copy Event Key and Signing Key
5. Paste as `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

Replace all placeholder values with your actual credentials.


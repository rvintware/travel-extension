# Travel Companion Backend API

Next.js API backend for the Travel Companion Chrome Extension (Phase 0.2).

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the backend directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Get these values from your Supabase project dashboard:
1. Go to Settings → API
2. Copy Project URL → `SUPABASE_URL`
3. Copy anon/public key → `SUPABASE_ANON_KEY`
4. Copy service_role key → `SUPABASE_SERVICE_KEY` (keep this secret!)

### 3. Start Development Server

```bash
pnpm run dev
```

The API will be available at http://localhost:3000

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# Get countries
curl http://localhost:3000/api/countries
```

## API Endpoints

### Health Check

**GET** `/api/health`

Returns API status and database connectivity.

```json
{
  "status": "ok",
  "timestamp": "2025-10-11T...",
  "database": "connected",
  "version": "0.2.0"
}
```

### Countries

**GET** `/api/countries`

Get list of all countries.

```json
{
  "countries": [
    { "id": "...", "name": "Japan", "code": "JP", "emoji": "🇯🇵" }
  ]
}
```

### Locations

**POST** `/api/locations`

Create a new location.

Request body:
```json
{
  "userId": "user-uuid",
  "countryId": "country-uuid",
  "name": "Location name",
  "originalText": "Highlighted text from source",
  "sourceUrl": "https://reddit.com/...",
  "pageTitle": "Page title",
  "category": "restaurant"
}
```

**GET** `/api/locations?userId=xxx&countryId=xxx`

Get locations for a user, optionally filtered by country.

**GET** `/api/locations/:id`

Get a single location.

**PATCH** `/api/locations/:id`

Update a location.

**DELETE** `/api/locations/:id`

Delete a location permanently (cascades from all trips).

### Trips

**POST** `/api/trips`

Create a new trip.

Request body:
```json
{
  "userId": "user-uuid",
  "countryId": "country-uuid",
  "name": "Tokyo 2025",
  "description": "Spring trip to Tokyo",
  "startDate": "2025-03-20",
  "durationDays": 7
}
```

**GET** `/api/trips?userId=xxx`

Get all trips for a user.

**GET** `/api/trips/:id`

Get a single trip.

**GET** `/api/trips/:id/locations`

Get all locations in a trip, organized by day.

```json
{
  "tripId": "...",
  "locations": [...],
  "byDay": {
    "1": [...],
    "2": [...],
    "unscheduled": [...]
  },
  "count": 12
}
```

**PATCH** `/api/trips/:id`

Update a trip.

**DELETE** `/api/trips/:id`

Delete a trip (locations remain in pool).

### Trip-Location Linking

**POST** `/api/trip-locations`

Link a location to a trip.

Request body:
```json
{
  "tripId": "trip-uuid",
  "locationId": "location-uuid",
  "dayNumber": 1,
  "displayOrder": 0,
  "timeOfDay": "morning",
  "suggestedTime": "10:00 AM",
  "notes": "Visit early to avoid crowds",
  "priority": "must_see"
}
```

**DELETE** `/api/trip-locations?tripId=xxx&locationId=xxx`

Remove a location from a trip (doesn't delete location from pool).

## Architecture

### Database Schema

The API uses a **Pool + References** architecture:
- **Locations** exist in country-grouped pools
- **Trips** reference locations via `trip_locations` (many-to-many)
- Same location can be in multiple trips with different schedules

See `../artifacts/database_schema.sql` for the complete schema.

### Error Handling

All errors are handled consistently:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

Status codes:
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

### CORS

CORS is enabled for all API routes via middleware to allow Chrome extension requests.

## Development

### Project Structure

```
backend/
├── app/api/
│   ├── health/          # Health check
│   ├── countries/       # Countries list
│   ├── locations/       # Location CRUD
│   ├── trips/           # Trip CRUD
│   └── trip-locations/  # Linking
├── lib/
│   ├── supabase.ts      # Database client
│   ├── types.ts         # TypeScript types
│   ├── validation.ts    # Zod schemas
│   └── errors.ts        # Error handling
└── middleware.ts        # CORS configuration
```

### Testing

Test with curl:

```bash
# Create a location
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "countryId": "japan-id",
    "name": "Test Location",
    "originalText": "This place is amazing",
    "sourceUrl": "https://example.com"
  }'

# Get locations
curl "http://localhost:3000/api/locations?userId=test-user-123"

# Create a trip
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "countryId": "japan-id",
    "name": "Tokyo Trip"
  }'

# Link location to trip
curl -X POST http://localhost:3000/api/trip-locations \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "trip-id",
    "locationId": "location-id",
    "dayNumber": 1
  }'
```

## Deployment

### Vercel

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `NEXT_PUBLIC_API_URL`

### Update Extension

After deploying, update the extension's API URL:

```typescript
// extension/lib/api.ts
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-app.vercel.app'
  : 'http://localhost:3000'
```

## Phase 0.3: AI Processing

This API is designed to support AI processing in Phase 0.3:

- `processing_status` field tracks AI processing state
- Can add Inngest job trigger in POST /api/locations
- AI enrichment happens asynchronously
- Extension polls for completion

## Troubleshooting

### Can't connect to database

- Check `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_KEY` is correct (not anon key)
- Verify Supabase project is running
- Check database schema is set up

### CORS errors from extension

- Make sure middleware.ts is in place
- Check extension is using correct API URL
- Verify request headers are correct

### Validation errors

- Check request body matches schema
- All UUIDs must be valid UUID format
- Required fields: check validation.ts

## Links

- [System Design Specification](../artifacts/system_design_specification.md)
- [Database Schema](../artifacts/database_schema.sql)
- [Database Design Decisions](../artifacts/database_design_decisions.md)
- [Extension README](../extension/README.md)

---

**Phase 0.2 Complete!** Ready for Phase 0.3 (AI Processing).

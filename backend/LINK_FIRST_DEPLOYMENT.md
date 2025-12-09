# Link-First Processing Architecture - Deployment Guide

## Overview

This guide covers deploying the Link-First Processing Architecture feature to production, including database migrations, dependency installation, and deployment verification.

## Prerequisites

- Access to production Supabase database
- Production backend deployment access (Vercel/hosting)
- Chrome Web Store developer account (for extension)
- Environment variables configured

## Phase 1: Database Migration

### Migration File
- **File:** `backend/migrations/add_link_url_column.sql`
- **Purpose:** Adds `link_url` column to `locations` table

### Pre-Migration Checklist
- [ ] Backup production database
- [ ] Verify migration file syntax
- [ ] Test migration on staging database first
- [ ] Schedule maintenance window if needed (migration is non-blocking)

### Migration Steps

#### Option 1: Supabase SQL Editor
1. Log into Supabase dashboard
2. Navigate to SQL Editor
3. Copy contents of `backend/migrations/add_link_url_column.sql`
4. Paste and execute
5. Verify success message

#### Option 2: Command Line (psql)
```bash
psql -h <supabase-host> -U postgres -d postgres -f backend/migrations/add_link_url_column.sql
```

### Post-Migration Verification
```sql
-- Verify column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'locations' AND column_name = 'link_url';

-- Verify index created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'locations' AND indexname = 'idx_locations_link_url';

-- Expected result: column should exist, index should exist
```

### Rollback (if needed)
```sql
DROP INDEX idx_locations_link_url;
ALTER TABLE locations DROP COLUMN link_url;
```

## Phase 2: Backend Dependencies

### New Dependency
- **Package:** `axios` (version ^1.6.0)
- **Purpose:** URL expansion for shortened Google Maps links
- **File:** `backend/package.json`

### Installation
```bash
cd backend
pnpm install
# or
npm install
```

### Verification
```bash
# Check axios is installed
pnpm list axios

# Expected: axios@^1.6.0
```

## Phase 3: Environment Variables

### No New Variables Required
The Link-First feature uses existing environment variables:
- `GOOGLE_PLACES_API_KEY` (already required)
- `SUPABASE_URL` (already required)
- `SUPABASE_SERVICE_KEY` (already required)

### Verification
Ensure all required variables are set in production environment:
```bash
# Check environment variables (varies by hosting)
# Vercel: Dashboard → Settings → Environment Variables
# Other: Check hosting provider documentation
```

## Phase 4: Backend Deployment

### Build and Deploy
```bash
cd backend
pnpm run build
# Deploy to your hosting provider
# Vercel: vercel --prod
# Other: Follow hosting provider instructions
```

### Post-Deployment Verification
1. **Health Check:**
   ```bash
   curl https://your-api.vercel.app/api/health
   ```

2. **Test Link Processing:**
   - Send test POST request with `linkUrl` field
   - Verify response includes location with `link_url` populated
   - Check Inngest dashboard for job execution

3. **Check Logs:**
   - Verify no errors in deployment logs
   - Check for `[API] Has linkUrl: true` in logs

## Phase 5: Extension Deployment

### Build Extension
```bash
cd extension
pnpm install
pnpm run build
```

### Chrome Web Store Upload
1. Zip the `extension/build/chrome-mv3-prod` directory
2. Go to Chrome Web Store Developer Dashboard
3. Upload new version
4. Update release notes to mention link-saving feature
5. Submit for review

### Post-Deployment Verification
1. Install extension from Chrome Web Store
2. Test right-click on Google Maps link
3. Verify location saved successfully
4. Check `link_url` populated in database

## Phase 6: Monitoring

### Key Metrics to Monitor

1. **Inngest Job Success Rate**
   - Check Inngest dashboard for failed jobs
   - Monitor Step 0 and Step 0.5 completion rates
   - Alert on >5% failure rate

2. **Link Processing Metrics**
   - Count of locations saved via link vs text
   - URL expansion success rate
   - Place ID extraction success rate

3. **Database Metrics**
   - Count of locations with `link_url` populated
   - Verify no NULL constraint violations

4. **Error Monitoring**
   - Monitor backend logs for link parsing errors
   - Check for axios timeout errors
   - Monitor Google Places API quota usage

### Monitoring Queries

```sql
-- Link usage statistics
SELECT 
  COUNT(*) as total_locations,
  COUNT(link_url) as with_link,
  COUNT(*) FILTER (WHERE link_url IS NOT NULL) / COUNT(*)::float * 100 as link_percentage
FROM locations
WHERE created_at > NOW() - INTERVAL '7 days';

-- Link processing errors
SELECT 
  processing_status,
  COUNT(*) as count
FROM locations
WHERE link_url IS NOT NULL
  AND processing_status = 'error'
GROUP BY processing_status;
```

## Troubleshooting

### Migration Issues
- **Column already exists:** Migration is idempotent, safe to re-run
- **Permission denied:** Ensure using service role key, not anon key
- **Connection timeout:** Check network connectivity to Supabase

### Deployment Issues
- **Build fails:** Check for TypeScript errors, verify all dependencies installed
- **Runtime errors:** Check environment variables, verify API keys valid
- **Extension not working:** Verify API URL in extension matches production backend

## Rollback Plan

If critical issues detected:

1. **Extension Rollback:**
   - Revert to previous Chrome Web Store version
   - Users will continue using old version

2. **Backend Rollback:**
   - Revert to previous backend deployment
   - Link processing will fail gracefully (falls back to text)

3. **Database Rollback (if needed):**
   ```sql
   DROP INDEX idx_locations_link_url;
   ALTER TABLE locations DROP COLUMN link_url;
   ```
   - Note: This will lose `link_url` data for existing locations
   - Only do this if absolutely necessary

## Success Criteria

- [ ] Database migration completed successfully
- [ ] Backend deployed without errors
- [ ] Extension uploaded to Chrome Web Store
- [ ] Test location saved via link works correctly
- [ ] No increase in error rates
- [ ] Monitoring shows link processing working

## Support

For issues or questions:
- Check `DEBUGGING_GUIDE.md` for troubleshooting
- Review Inngest dashboard for job failures
- Check backend logs for detailed error messages


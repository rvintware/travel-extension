# Bring Your Own API Key (BYOK) - Functional Requirements & Specification

**Version:** 1.0  
**Created:** November 5, 2025  
**Status:** Approved for Implementation  
**Feature:** BYOK - OpenAI API Key Management

---

## Executive Summary

Enable users to optionally provide their own OpenAI API key for AI processing, giving them control over costs while maintaining seamless functionality for users who prefer to use the server's key. All users will use GPT-4o-mini for consistent, cost-effective experience.

**Key Benefits:**
- **Cost Control:** Power users control their AI expenses
- **Transparency:** Users see exactly what they're paying for
- **Privacy:** Keys never stored on our servers (transient use only)
- **Seamless:** Works out-of-box with server key, BYOK is optional
- **Quicker GTM:** Can go-to-market quickly as we don't have to setup and manage own OpenAI Org API key


---

## User Story

**As a user**, I want to provide my own OpenAI API key so that:
- I can control and optimize my AI processing costs
- I have transparency into AI usage
- I can use the extension without worrying about server quotas
- I maintain privacy (my key, my account)

**As a free user**, I want the extension to work immediately without setup so that:
- I can start using the extension right away
- I don't need to create an OpenAI account
- I don't worry about API keys or technical details

---

## Model Strategy

### Current State
- **Model in use:** `gpt-4o` 
- **Cost per save:** ~$0.044
- **Vision support:** Yes

### New State (All Users)
- **Model:** `gpt-4o-mini`
- **Cost per save:** ~$0.007 (85% cheaper)
- **Vision support:** Yes (multimodal)
- **Quality:** Sufficient for location extraction and tip formatting
- **Speed:** Faster than gpt-4o

**Decision:** Switch ALL users (server key and BYOK users) to `gpt-4o-mini` for:
- Consistent experience
- Significant cost reduction
- Maintained quality
- No user configuration needed

**No model selector** - We choose the best model for the use case.

---

## Architecture: Transient Server-Side

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER'S MACHINE (Extension)                                  │
├─────────────────────────────────────────────────────────────┤
│ Settings:                                                   │
│   └─ OpenAI API key: sk-proj-****abc (masked)             │
│                                                             │
│ User saves location:                                        │
│   └─ Extension reads key from storage                     │
│   └─ Adds to request header: X-User-OpenAI-Key            │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Next.js API)                                       │
├─────────────────────────────────────────────────────────────┤
│ POST /api/locations receives request                       │
│   └─ Reads header: X-User-OpenAI-Key                      │
│   └─ Passes to Inngest event (in-memory only)             │
│                                                             │
│ Inngest Job (process-location):                           │
│   └─ Creates OpenAI client with user's key OR server key  │
│   └─ Makes AI calls (context, variations, tips)           │
│   └─ Job completes                                         │
│   └─ Key discarded (garbage collected)                    │
│                                                             │
│ ❌ NEVER: Log key, store in DB, persist anywhere          │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Principles:**
- ✅ Key exists in backend memory ONLY during job execution
- ✅ Never written to disk, database, or logs
- ✅ Transmitted via HTTPS only
- ✅ Used for single job, then discarded
- ✅ Zero persistence on server

---

## Core Requirements and Specifications

### REQ-1: Settings UI

**Location:** Settings panel (always visible, not hidden)

**UI Elements:**

1. **Toggle Switch**
   - Label: "Use my own OpenAI API key"
   - Default: OFF (uses server key)
   - Help text below: "Optional: Provide your own API key to control costs. We never store your key on our servers."

2. **API Key Input Field** (shown when toggle is ON)
   - Type: Password input
   - Label: "OpenAI API Key"
   - Placeholder: "sk-proj-..."
   - Validation: Must start with "sk-"
   - Display: Masked as "sk-proj-****abc" when saved

3. **Save Button**
   - Label: "Save & Validate"
   - Action: Validates key with real OpenAI call
   - Spinner: Shows while validating
   - Disabled while validating

4. **Status Indicator**
   - Success: ✅ "Valid API key"
   - Error: ❌ "Invalid API key. Please check and try again."

5. **Link**
   - Text: "Get API key from OpenAI"
   - URL: https://platform.openai.com/api-keys
   - Opens in new tab

### REQ-2: Key Validation Flow

**Trigger:** User clicks "Save & Validate" button

**Process:**
1. Frontend validates format (starts with "sk-")
2. Shows spinner: "Validating API key..."
3. Calls backend: `POST /api/validate-openai-key`
4. Backend makes test OpenAI API call (simple completion)
5. Response within 2-3 seconds:
   - Success: Key works → Save to Chrome storage → Show ✅
   - Error: Key invalid → Show error message → Don't save
6. Spinner hides, show result

**Validation Test Call:**
```typescript
// Simple, cheap test call
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{role: 'user', content: 'test'}],
  max_tokens: 5
})
```

**Cost:** ~$0.0001 per validation (negligible)

### REQ-3: Key Storage

**Storage:**
- Platform: Chrome local storage (chrome.storage.local)
- Format: Plain text
- Scope: Local to user's machine
- Persistence: Survives browser restart
- Deletion: User can clear anytime
- Security: Protected by Chrome's sandbox (other extensions/websites cannot access)

**Storage Specification:**
```typescript
// Store directly
await chrome.storage.local.set({ 
  openaiApiKey: plainKey,
  useOwnApiKey: true 
})

// Read directly
const { openaiApiKey } = await chrome.storage.local.get('openaiApiKey')
```

**Display in UI:**
- Never show full key
- Mask as: "sk-proj-****abc" (first 9 + last 3 chars)
- Password input type (dots while typing)

### REQ-4: Backend Integration

**API Endpoint Changes:**

**All location-related endpoints accept optional key:**
```
POST /api/locations
Header: X-User-OpenAI-Key: sk-proj-... (optional)
```

**New validation endpoint:**
```
POST /api/validate-openai-key
Body: { apiKey: "sk-proj-..." }
Response: { valid: true } or { valid: false, error: "message" }
```

**Inngest Job Changes:**
- Receives `userApiKey` in event data
- Creates OpenAI client with user key OR server key
- Uses client for all AI calls (6 total)
- Key discarded after job completes

**Logging Rules:**
- ❌ NEVER log the API key
- ❌ NEVER log request headers containing key
- ✅ DO log: "Using user-provided key: true/false"
- ✅ DO log errors WITHOUT key details

### REQ-5: Fallback Strategy

**Scenario A: User hasn't provided key**
- **Behavior:** Use server key
- **UX:** Works seamlessly, user doesn't know
- **Cost:** Borne by us

**Scenario B: User provided key (opted in)**
- **Behavior:** Use user's key exclusively
- **On error:** Show error message, DON'T fall back to server key
- **Why:** User should know if their key has issues

**Scenario C: User disables BYOK toggle**
- **Behavior:** Delete encrypted key from storage
- **Fallback:** Use server key
- **UX:** Immediate, no confirmation needed

---

## Error Messages Specification

### Error: Invalid API Key Format
- **Trigger:** Key doesn't start with "sk-"
- **Message:** "Invalid API key format. OpenAI keys start with 'sk-'"
- **Action:** Don't call backend, show immediately

### Error: Invalid API Key (OpenAI rejects)
- **Trigger:** Validation call fails with 401
- **Message:** "Invalid API key. Please check your OpenAI dashboard."
- **Action:** Don't save key, let user retry

### Error: Out of Credits
- **Trigger:** OpenAI returns quota error
- **Message:** "Out of API credits. Check your OpenAI dashboard."
- **Action:** Don't process location, show error toast

### Error: Rate Limited
- **Trigger:** OpenAI returns 429 rate limit
- **Message:** "API rate limit reached. Try again in a few minutes."
- **Action:** Show error, Inngest will retry

### Error: Network Failure
- **Trigger:** Request timeout or network error
- **Message:** "Validation failed. Check your connection."
- **Action:** Let user retry

### Error: Server Key Failed (Fallback scenario)
- **Trigger:** User has no key AND server key fails
- **Message:** "Processing temporarily unavailable. Try again later."
- **Action:** Save location as pending, retry later

---

## Validation Endpoint Specification

### Endpoint: POST /api/validate-openai-key

**Purpose:** Test if user's API key works with OpenAI

**Request:**
```typescript
{
  apiKey: string  // User's OpenAI key
}
```

**Response (Success):**
```typescript
{
  valid: true,
  model: "gpt-4o-mini",
  message: "API key validated successfully"
}
```

**Response (Error):**
```typescript
{
  valid: false,
  error: "Invalid API key",
  code: "invalid_api_key"  // or "insufficient_quota", "rate_limit", etc.
}
```

**Rate Limiting:**
- Max 5 validation attempts per minute per IP
- HTTP 429 if exceeded: "Too many validation attempts. Try again in 1 minute."

**Security:**
- Validates key format server-side (starts with "sk-")
- Makes simple test call to OpenAI
- Never logs the key
- Returns generic error messages

**Test Call Specification:**
```typescript
// Minimal, cheap call to verify key works
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'test' }],
  max_tokens: 5
})
```

**Cost:** ~$0.0001 per validation (negligible)

---

## Key Transmission Specification

### HTTP Header Format

**Header Name:** `X-User-OpenAI-Key`

**Header Value:** Plain text key (encrypted in transit via HTTPS)

**Example:**
```
X-User-OpenAI-Key: sk-proj-abc123xyz...
```

**Applied to endpoints:**
- POST /api/locations
- Any endpoint that triggers AI processing

**Not applied to:**
- GET endpoints (no AI processing)
- DELETE endpoints
- Settings/config endpoints

### Backend Header Reading

```typescript
// In API route
const userApiKey = request.headers.get('X-User-OpenAI-Key')

// Validation
if (userApiKey && !userApiKey.startsWith('sk-')) {
  return NextResponse.json(
    { error: 'Invalid API key format' },
    { status: 400 }
  )
}

// Pass to Inngest
await inngest.send({
  name: 'location/created',
  data: {
    // ... existing data
    userApiKey: userApiKey || null
  }
})
```

---

## Privacy & Security Specification

### Privacy Notice (in Settings UI)

**Display prominently:**
```
🔒 Privacy & Security

Your API key is stored locally on your device in Chrome's secure storage. 
When you save a location, your key is sent to our backend ONLY during AI 
processing and is immediately discarded after use. We never store your key 
in our database or logs.

You can delete your key at any time by toggling this setting off.
```

### Security Measures

**Client-side (Extension):**
1. ✅ Stored in chrome.storage.local (sandboxed, isolated from other extensions)
2. ✅ Only read when making API request
3. ✅ Never log key to console
4. ✅ Mask in UI (show first 9 + last 3 chars only)
5. ✅ Clear from memory after request sent

**Server-side (Backend):**
1. ✅ Read from header only (never from body/query params)
2. ✅ Use in-memory during job execution
3. ✅ Never write to database
4. ✅ Never write to log files
5. ✅ Never include in error messages
6. ✅ Garbage collected after job completes

**Transport:**
1. ✅ HTTPS only (encrypted in transit)
2. ✅ Custom header (not URL)
3. ✅ No caching of requests with keys

### Data Flow Security

```
User enters key → Chrome storage (plain text, sandboxed)
                       ↓
User saves → Read from storage (memory) → HTTPS header
                       ↓
Backend receives → In-memory variable → OpenAI client
                       ↓
Job completes → Variable cleared → Garbage collected
```

**Zero Persistence Points:**
- Not in Chrome sync (local only)
- Not in request logs
- Not in Supabase database
- Not in error logs
- Not in Inngest dashboard
- Not in file system

---

## Settings UI Specification

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│ Settings                                     [Close]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ... other settings ...                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ OpenAI API Configuration                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Toggle] Use my own OpenAI API key                  │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Optional: Provide your own API key to control   ││
│ │ costs. We never store your key on our servers.  ││
│ │ Estimated: ~$0.007 per location save            ││
│ │                                                  ││
│ │ Get API key from OpenAI →                       ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ OpenAI API Key                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ sk-proj-****abc                           │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ [Button: Save & Validate]                          │
│                                                     │
│ Status: ✅ Valid API key                            │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🔒 Privacy & Security                           ││
│ │                                                  ││
│ │ Your API key is stored locally on your device   ││
│ │ and encrypted. When you save a location, your   ││
│ │ key is sent to our backend ONLY during AI       ││
│ │ processing and is immediately discarded after   ││
│ │ use. We never store your key in our database    ││
│ │ or logs.                                         ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

### UI States

**State 1: Toggle OFF (Default)**
- Toggle switch: OFF
- API key input: Hidden
- Save button: Hidden
- Help text: Visible
- Status: Hidden
- Behavior: Uses server key

**State 2: Toggle ON, No Key Saved**
- Toggle switch: ON
- API key input: Visible, empty
- Save button: Visible, enabled
- Help text: Visible
- Status: Hidden
- Behavior: Waiting for key input

**State 3: Validating**
- Toggle switch: ON, disabled
- API key input: Visible, disabled
- Save button: Disabled, shows spinner
- Help text: Visible
- Status: "Validating API key..."
- Behavior: Backend testing key

**State 4: Valid Key Saved**
- Toggle switch: ON
- API key input: Visible, shows masked key "sk-proj-****abc"
- Save button: Visible, enabled (can update)
- Help text: Visible
- Status: ✅ "Valid API key"
- Behavior: Using user's key

**State 5: Invalid Key Error**
- Toggle switch: ON
- API key input: Visible, shows entered key
- Save button: Visible, enabled (can retry)
- Help text: Visible
- Status: ❌ "Invalid API key. Please check and try again."
- Behavior: Still using server key

---

## Functional Requirements

### FR-1: API Key Management

**FR-1.1: Toggle Enable/Disable**
- User can enable BYOK with toggle switch
- When enabled: Shows API key input
- When disabled: Hides input, deletes stored key, falls back to server key
- Change takes effect immediately

**FR-1.2: Key Input**
- Accepts OpenAI API keys (format: "sk-proj-..." or "sk-...")
- Password field (masked while typing)
- No character limit (OpenAI keys ~100 chars)
- Trimmed automatically (remove whitespace)

**FR-1.3: Key Validation**
- Triggered by "Save & Validate" button click
- Makes real OpenAI API call to verify key works
- Test call uses gpt-4o-mini model
- Validates within 2-3 seconds
- Rate limited: 5 attempts per minute

**FR-1.4: Key Storage**
- Stored in chrome.storage.local (not sync)
- Plain text (protected by Chrome's sandbox)
- Persists across browser restarts
- Deleted when toggle disabled

**FR-1.5: Key Display**
- Never shows full key once saved
- Masked format: "sk-proj-****abc"
- Shows first 9 characters + last 3 characters
- User can clear and re-enter

### FR-2: Backend Processing

**FR-2.1: Header Acceptance**
- All location creation endpoints accept `X-User-OpenAI-Key` header
- Header is optional
- If present: Use user's key
- If absent: Use server key

**FR-2.2: Key Handling**
- Extract from header: `request.headers.get('X-User-OpenAI-Key')`
- Pass to Inngest event data
- Never log the key value
- Never persist to database

**FR-2.3: OpenAI Client Creation**
- Create client per-job (not global)
- Use user key if provided, otherwise server key
- Client scoped to job execution
- Discarded after job completes

**FR-2.4: Model Consistency**
- ALL calls use `gpt-4o-mini` (server key and user keys)
- No model selection
- Hardcoded in all AI functions

### FR-3: Error Handling

**FR-3.1: Validation Errors**
- Invalid format: Show immediately (client-side)
- Invalid key: Show after backend test (401 error)
- Network error: "Validation failed. Check your connection."
- Rate limit: "Too many validation attempts. Try again in 1 minute."

**FR-3.2: Processing Errors**
- Out of credits: "Out of API credits. Check your OpenAI dashboard."
- Rate limited: "API rate limit reached. Try again in a few minutes."
- Invalid key during save: "API key error. Check your OpenAI dashboard."
- Generic error: "AI processing failed. Location saved with minimal data."

**FR-3.3: Error Display**
- Validation errors: In Settings panel (below button)
- Processing errors: Toast notification in browser
- All errors: Logged to console (without key)

### FR-4: User Experience

**FR-4.1: First-Time User (No Key)**
- Extension works immediately
- Uses server key transparently
- No setup required
- Settings show BYOK as optional feature

**FR-4.2: Power User (Provides Key)**
- Enters key in Settings
- Validates successfully
- All future saves use their key
- Can monitor usage in OpenAI dashboard

**FR-4.3: Key Update**
- User can update key anytime
- Must validate new key before saving
- Old key replaced only if new key valid

**FR-4.4: Key Removal**
- Toggle switch OFF → Confirms → Key deleted
- Immediate fallback to server key
- No data loss, seamless transition

---

## Non-Functional Requirements

### NFR-1: Security

**NFR-1.1: Storage Security**
- Stored in chrome.storage.local (sandboxed per extension)
- Other extensions cannot access
- Websites cannot access
- Protected by Chrome's security model

**NFR-1.2: Transmission**
- HTTPS only (enforced)
- Custom header (not URL parameter)
- No caching of requests with keys
- TLS 1.2+ required

**NFR-1.3: Server-Side**
- In-memory only (never disk)
- No logging of key values
- No database persistence
- Garbage collected after use

**NFR-1.4: Validation**
- Server validates format (starts with "sk-")
- Makes actual OpenAI call to verify
- Returns generic errors (no key exposure)

### NFR-2: Performance

**NFR-2.1: Validation Speed**
- Validation completes in < 3 seconds
- Shows spinner immediately
- Non-blocking (UI remains responsive)

**NFR-2.2: Save Flow Impact**
- Adding key to header: < 10ms overhead
- No impact on save speed
- Inngest job speed unchanged

**NFR-2.3: Storage Performance**
- Chrome storage read: < 10ms
- No impact on popup open time

### NFR-3: Reliability

**NFR-3.1: Graceful Degradation**
- User key fails → Show error (don't silently fall back)
- Server key fails → Show generic error
- Always preserve user's original text (never lose data)

**NFR-3.2: Retry Logic**
- Inngest retries on transient errors (3 attempts)
- Rate limit errors: Exponential backoff
- Quota errors: Don't retry (user needs to fix)

### NFR-4: Privacy

**NFR-4.1: Data Minimization**
- Only collect API key if user opts in
- Don't track which users use BYOK
- Don't track API usage patterns per user

**NFR-4.2: Transparency**
- Clear privacy notice in UI
- Explain transient server-side usage
- No hidden key transmission

**NFR-4.3: User Control**
- User can delete key anytime
- User can disable BYOK anytime
- No lock-in

---

## Edge Cases

### EC-1: User Changes Key Mid-Processing

**Scenario:** User saves location, then immediately changes API key

**Behavior:**
- In-flight job uses old key (already passed to Inngest)
- Next save uses new key
- No conflict, no error

### EC-2: Key Expires During Usage

**Scenario:** User's key works initially, then OpenAI revokes it

**Behavior:**
- Next location save fails with "Invalid API key"
- Toast shows error message
- User must update key in settings
- Don't fall back to server key (user opted in)

### EC-3: Multiple Browser Instances

**Scenario:** User has extension open in 2 browsers with same profile

**Behavior:**
- Chrome storage syncs (if chrome.storage.sync used)
- Recommendation: Use chrome.storage.local (no sync)
- Each browser instance independent

### EC-4: Very Long API Key

**Scenario:** OpenAI keys are ~100 characters

**Behavior:**
- Input accepts full length
- Display masks middle part
- No truncation in storage or transmission

### EC-5: User Provides Server Key

**Scenario:** User accidentally enters our server key

**Behavior:**
- Still works (it's a valid key)
- User pays for their own usage on our account (fine)
- No detection needed

### EC-6: Key Format Changes

**Scenario:** OpenAI changes key prefix from "sk-" to something else

**Behavior:**
- Validation would fail
- Need to update format check in code
- Migration: Notify users to update

---

## Model Migration Specification

### Current State
- All AI calls use: `model: 'gpt-4o'`
- 6 function calls in `backend/lib/ai/extract.ts`

### Target State
- All AI calls use: `model: 'gpt-4o-mini'`
- Same 6 functions
- No other changes needed

### Migration Steps
1. Update all 6 `openai.chat.completions.create()` calls
2. Change `model: 'gpt-4o'` → `model: 'gpt-4o-mini'`
3. Test with sample saves
4. Monitor quality (compare tips/extraction quality)
5. If quality degrades: Can switch back easily

### Quality Assurance
- A/B test 20 location saves before full rollout
- Compare extraction accuracy
- Compare tip quality
- If < 95% quality: Revert to gpt-4o

---

## Testing Specification

### Test Cases

**TC-1: First-Time User (No Key)**
- User installs extension
- Saves location without entering key
- Expected: Uses server key, works seamlessly

**TC-2: User Provides Valid Key**
- User opens Settings
- Enables BYOK toggle
- Enters valid OpenAI key
- Clicks "Save & Validate"
- Expected: Shows spinner → ✅ Valid key → Key saved

**TC-3: User Provides Invalid Key**
- User enters random string
- Clicks "Save & Validate"
- Expected: ❌ Error message, key not saved

**TC-4: Save with User Key**
- User has valid key configured
- Saves location
- Expected: Inngest uses user's key, processes successfully

**TC-5: User Disables BYOK**
- User has key saved
- Toggles BYOK off
- Expected: Key deleted, falls back to server key

**TC-6: Key Runs Out of Credits**
- User's key hits quota limit
- Saves location
- Expected: Toast shows "Out of API credits. Check your OpenAI dashboard."

**TC-7: Rate Limit Validation**
- User clicks "Save & Validate" 6 times rapidly
- Expected: 5 succeed, 6th shows "Too many attempts"

**TC-8: Key Masked in UI**
- User has key "sk-proj-abcdefghijklmnopqrstuvwxyz123"
- Expected display: "sk-proj-****123"

**TC-9: Backend Never Logs Key**
- User saves with key
- Check server logs
- Expected: No key value in any log line

**TC-10: Key Deleted on Toggle Off**
- User disables toggle
- Check Chrome storage
- Expected: openaiApiKey field removed

---

## Success Criteria

**Functional:**
- [ ] Settings UI shows BYOK option
- [ ] User can enter and validate key
- [ ] Validation makes real OpenAI call
- [ ] Valid keys save successfully
- [ ] Invalid keys show clear error
- [ ] Extension sends key in header
- [ ] Backend uses user key for AI calls
- [ ] Model switched to gpt-4o-mini for all users
- [ ] Server key fallback works

**Security:**
- [ ] Keys stored in Chrome's sandboxed storage
- [ ] Keys never logged anywhere
- [ ] Keys never persisted in database
- [ ] Keys transmitted via HTTPS only
- [ ] Privacy notice displayed clearly

**User Experience:**
- [ ] Works without key (server key fallback)
- [ ] Validation completes in < 3 seconds
- [ ] Clear error messages for all failure cases
- [ ] No setup required for casual users
- [ ] Power users have full control

**Quality:**
- [ ] gpt-4o-mini extraction quality ≥ 95% vs gpt-4o
- [ ] Tip quality maintained
- [ ] No regression in location accuracy

---

## Out of Scope (Future)

**Not included in this release:**
- Multiple provider support (Anthropic, Google, etc.)
- Model selection (we choose the model)
- Cost calculator/usage dashboard
- API usage analytics
- Batch key validation
- Key rotation
- Organization key support
- Multiple keys per user

---

## Cost Impact Analysis

### Server Cost Reduction
- **Current (gpt-4o):** $0.044 per save × 1000 saves/month = $44/month
- **New (gpt-4o-mini):** $0.007 per save × 1000 saves/month = $7/month
- **Savings:** $37/month (84% reduction)

### User Cost (if BYOK)
- **Per save:** ~$0.007
- **Heavy user (100 saves/month):** ~$0.70
- **Light user (20 saves/month):** ~$0.14
- **Negligible for most users**

### Development Cost
- Implementation: 6-8 hours
- Testing: 2-3 hours
- Total: ~10 hours

**ROI:** Saves server costs immediately, enables future subscription model

---

## Privacy Considerations

### What We Collect
- ✅ User opted into BYOK: true/false (anonymous)
- ✅ Validation success/failure (anonymous)
- ❌ NOT the actual API key
- ❌ NOT usage per user
- ❌ NOT API call details

### What Users Control
- ✅ Whether to provide key
- ✅ When to change key
- ✅ When to revoke key
- ✅ See all AI processing in OpenAI dashboard (their account)

### Transparency
- Clear explanation in settings
- Link to OpenAI's privacy policy
- Our privacy stance documented
- No hidden usage of their key

---

## Regulatory Compliance

### GDPR Considerations
- API key is personal data
- Stored on user's device (not our database)
- User has full control (can delete)
- Transient processing (not stored)
- Compliant with data minimization

### User Consent
- Explicit opt-in (toggle + save)
- Clear explanation before opting in
- Can revoke consent anytime
- No dark patterns

---

## Future Enhancements (v2.0)

1. **Usage Dashboard**
   - Show user's monthly OpenAI spend
   - Breakdown by feature (extraction, tips, etc.)
   - Cost trends over time

2. **Multiple Providers**
   - Anthropic Claude (vision support)
   - Google Gemini
   - OpenRouter (aggregator)

3. **Cost Optimization**
   - Caching for common queries
   - Batch processing
   - Model selection per task type

4. **Advanced Features**
   - API key rotation
   - Organization keys (team accounts)
   - Budget alerts

---

This specification serves as the single source of truth for BYOK feature implementation. All implementation decisions should reference this document.


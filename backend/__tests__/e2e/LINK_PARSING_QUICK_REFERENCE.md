# Link Parsing Quick Reference

## Log Patterns

### Successful Link Processing
```
[Job] Step 0: Link Pre-Parsing
[Job] Found 1 Google Maps links
[Job] Step 0.5: Process Google Maps Links
[Job]   ✅ Found via Place ID: Location Name
[Job] Link processing complete: 1/1 places found
```

### URL Expansion
```
[Job]   Expanding shortened URL: https://maps.app.goo.gl/...
[Job]   Expanded to: https://www.google.com/maps/place/...
```

### Fallback Chain
```
[Job]   Attempting Place ID lookup: ChIJ...
[Job]   ❌ Place ID lookup failed
[Job]   Attempting coordinate search: 35.7148, 139.7967
[Job]   ✅ Found via coordinates: Location Name
```

## Common Issues

| Issue | Log Pattern | Solution |
|-------|-------------|----------|
| URL not recognized | `[Job] Found 0 Google Maps links` | Check `isGoogleMapsUrl()` logic |
| Expansion failed | No "Expanded to" log | Check network, verify URL accessible |
| Place ID not found | `❌ Place ID lookup failed` | Verify API key, check Place ID format |
| All methods failed | `❌ Failed to find place` | Falls back to text processing |

## Confidence Levels

- **High**: Place ID extracted → Direct lookup
- **Medium**: CID/Coordinates extracted → Nearby search
- **Low**: Query only → Text search fallback

## Test URLs

- Place ID: `https://maps.google.com/maps?place_id=ChIJ...`
- Coordinates: `https://maps.google.com/maps/@35.7148,139.7967,17z`
- Shortened: `https://maps.app.goo.gl/NmAhzAmvd8x8MbdS6`
- Query: `https://maps.google.com/maps/place/Senso-ji+Temple/`


-- Add Uncategorized country for AI detection failures
-- This provides a fallback when AI cannot determine the country from context

INSERT INTO countries (id, name, code, emoji, region)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Uncategorized',
  'XX',
  '🌍',
  'Unknown'
)
ON CONFLICT (code) DO NOTHING;

-- Note: Run this migration via Supabase Dashboard SQL Editor


-- Mark Phase 0.2 locations as complete
-- They don't have original_context and will never be AI processed

UPDATE locations 
SET processing_status = 'complete'
WHERE processing_status IN ('pending', 'processing')
  AND original_context IS NULL;

-- Verify the update
SELECT 
  processing_status,
  COUNT(*) as count,
  COUNT(CASE WHEN original_context IS NOT NULL THEN 1 END) as with_context
FROM locations 
GROUP BY processing_status
ORDER BY processing_status;

-- Should show:
-- processing_status | count | with_context
-- -----------------|-------|-------------
-- complete         |  XX   |   0
-- pending          |  YY   |   YY  (all have context)


import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { processLocation } from '@/lib/jobs/process-location'

// Serve Inngest functions
// This endpoint is called by Inngest to execute background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processLocation,
  ],
})


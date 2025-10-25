import { Inngest } from 'inngest'

// Create Inngest client for event-driven background jobs
export const inngest = new Inngest({ 
  id: 'travel-companion',
  // Remove eventKey for local development - events will route to local dev server
  // In production, set eventKey via environment variable to use Inngest Cloud
  // eventKey: process.env.INNGEST_EVENT_KEY,
})


import { Inngest } from 'inngest'

// Create Inngest client for event-driven background jobs
export const inngest = new Inngest({ 
  id: 'travel-companion',
  eventKey: process.env.INNGEST_EVENT_KEY,
})


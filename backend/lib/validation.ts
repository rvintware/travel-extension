import { z } from 'zod'

// Location validation schemas
export const createLocationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  countryId: z.string().uuid('Invalid country ID format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  originalText: z.string().min(1, 'Original text is required'),
  sourceUrl: z.string().url('Invalid source URL'),
  pageTitle: z.string().optional(),
  category: z.string().optional(),
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().optional(),
  summary: z.string().optional(),
  userNotes: z.string().optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  isFavorite: z.boolean().optional(),
})

// Trip validation schemas
export const createTripSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  countryId: z.string().uuid('Invalid country ID format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  durationDays: z.number().int().min(1).optional(),
})

export const updateTripSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  durationDays: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})

// Trip location linking validation schema
export const linkLocationToTripSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
  locationId: z.string().uuid('Invalid location ID format'),
  dayNumber: z.number().int().min(1).optional(),
  displayOrder: z.number().int().min(0).default(0),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  suggestedTime: z.string().optional(),
  estimatedDurationMinutes: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  priority: z.enum(['must_see', 'normal', 'optional']).default('normal'),
})

export const updateTripLocationSchema = z.object({
  dayNumber: z.number().int().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  suggestedTime: z.string().optional(),
  estimatedDurationMinutes: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  priority: z.enum(['must_see', 'normal', 'optional']).optional(),
  status: z.enum(['planned', 'visited', 'skipped']).optional(),
})


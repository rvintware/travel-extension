import { describe, it, expect } from '@jest/globals'
import { createTripSchema, updateTripSchema } from '../../lib/validation'

describe('Trip Date Validation', () => {
  describe('createTripSchema', () => {
    it('should accept valid date range', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        startDate: '2025-03-15',
        endDate: '2025-03-22',
        durationDays: 8
      })
      expect(result.success).toBe(true)
    })
    
    it('should reject end date before start date', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        startDate: '2025-03-22',
        endDate: '2025-03-15'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Start date must be before or equal to end date')
      }
    })
    
    it('should accept start date equal to end date', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        startDate: '2025-03-15',
        endDate: '2025-03-15',
        durationDays: 1
      })
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid date format', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        startDate: 'invalid-date',
        endDate: '2025-03-22'
      })
      expect(result.success).toBe(false)
    })
    
    it('should accept trip without dates', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        durationDays: 7
      })
      expect(result.success).toBe(true)
    })
    
    it('should accept trip with only start date', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        startDate: '2025-03-15',
        durationDays: 7
      })
      expect(result.success).toBe(true)
    })
    
    it('should reject negative duration', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        durationDays: -1
      })
      expect(result.success).toBe(false)
    })
    
    it('should reject zero duration', () => {
      const result = createTripSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Trip',
        durationDays: 0
      })
      expect(result.success).toBe(false)
    })
  })
  
  describe('updateTripSchema', () => {
    it('should accept valid date range update', () => {
      const result = updateTripSchema.safeParse({
        startDate: '2025-03-15',
        endDate: '2025-03-22',
        durationDays: 8
      })
      expect(result.success).toBe(true)
    })
    
    it('should reject end date before start date', () => {
      const result = updateTripSchema.safeParse({
        startDate: '2025-03-22',
        endDate: '2025-03-15'
      })
      expect(result.success).toBe(false)
    })
    
    it('should accept partial update with only duration', () => {
      const result = updateTripSchema.safeParse({
        durationDays: 10
      })
      expect(result.success).toBe(true)
    })
    
    it('should accept partial update with only name', () => {
      const result = updateTripSchema.safeParse({
        name: 'Updated Trip Name'
      })
      expect(result.success).toBe(true)
    })
  })
})


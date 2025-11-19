import { describe, it, expect } from '@jest/globals'
import { 
  calculateDuration, 
  calculateEndDate, 
  calculateStartDate,
  formatDateForDisplay,
  formatDateForAPI
} from '../lib/dateUtils'

describe('Date Utilities', () => {
  describe('calculateDuration', () => {
    it('should calculate duration correctly for multi-day trips', () => {
      const start = new Date('2025-03-15')
      const end = new Date('2025-03-22')
      expect(calculateDuration(start, end)).toBe(8)
    })
    
    it('should return 1 for same-day trips', () => {
      const start = new Date('2025-03-15')
      const end = new Date('2025-03-15')
      expect(calculateDuration(start, end)).toBe(1)
    })
    
    it('should handle month boundaries', () => {
      const start = new Date('2025-03-29')
      const end = new Date('2025-04-02')
      expect(calculateDuration(start, end)).toBe(5)
    })
  })
  
  describe('calculateEndDate', () => {
    it('should calculate end date from start + duration', () => {
      const start = new Date('2025-03-15')
      const end = calculateEndDate(start, 7)
      expect(end.toISOString().split('T')[0]).toBe('2025-03-21')
    })
    
    it('should handle single day duration', () => {
      const start = new Date('2025-03-15')
      const end = calculateEndDate(start, 1)
      expect(end.toISOString().split('T')[0]).toBe('2025-03-15')
    })
    
    it('should handle month boundaries', () => {
      const start = new Date('2025-03-29')
      const end = calculateEndDate(start, 5)
      expect(end.toISOString().split('T')[0]).toBe('2025-04-02')
    })
  })
  
  describe('calculateStartDate', () => {
    it('should calculate start date from end + duration', () => {
      const end = new Date('2025-03-22')
      const start = calculateStartDate(end, 7)
      expect(start.toISOString().split('T')[0]).toBe('2025-03-16')
    })
    
    it('should handle single day duration', () => {
      const end = new Date('2025-03-22')
      const start = calculateStartDate(end, 1)
      expect(start.toISOString().split('T')[0]).toBe('2025-03-22')
    })
    
    it('should handle month boundaries', () => {
      const end = new Date('2025-04-02')
      const start = calculateStartDate(end, 5)
      expect(start.toISOString().split('T')[0]).toBe('2025-03-29')
    })
  })
  
  describe('formatDateForDisplay', () => {
    it('should format date as DD/MM/YYYY', () => {
      const date = new Date('2025-03-15')
      expect(formatDateForDisplay(date)).toBe('15/03/2025')
    })
    
    it('should handle single digit days and months', () => {
      const date = new Date('2025-01-05')
      expect(formatDateForDisplay(date)).toBe('05/01/2025')
    })
  })
  
  describe('formatDateForAPI', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-03-15')
      expect(formatDateForAPI(date)).toBe('2025-03-15')
    })
    
    it('should handle single digit days and months', () => {
      const date = new Date('2025-01-05')
      expect(formatDateForAPI(date)).toBe('2025-01-05')
    })
  })
  
  describe('Integration tests', () => {
    it('should correctly round-trip start → duration → end → start', () => {
      const originalStart = new Date('2025-03-15')
      const duration = 7
      
      const calculatedEnd = calculateEndDate(originalStart, duration)
      const calculatedDuration = calculateDuration(originalStart, calculatedEnd)
      const calculatedStart = calculateStartDate(calculatedEnd, duration)
      
      expect(calculatedDuration).toBe(duration)
      expect(calculatedStart.toISOString().split('T')[0])
        .toBe(originalStart.toISOString().split('T')[0])
    })
  })
})


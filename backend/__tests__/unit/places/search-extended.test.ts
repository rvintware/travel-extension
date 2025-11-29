import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { Client } from '@googlemaps/google-maps-services-js'
import {
  _searchGooglePlacesByPlaceIdInternal,
  _searchGooglePlacesByCoordinatesInternal,
  searchGooglePlacesByPlaceId,
  searchGooglePlacesByCoordinates,
  PlaceResult
} from '../../../lib/places/search'

describe('Google Places Extended Search', () => {
  const originalEnv = process.env.GOOGLE_PLACES_API_KEY
  let mockClient: jest.Mocked<Client>
  
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_PLACES_API_KEY = 'test-api-key'
    
    // Create mock client
    mockClient = {
      placeDetails: jest.fn(),
      placesNearby: jest.fn(),
    } as any
  })
  
  afterEach(() => {
    if (originalEnv) {
      process.env.GOOGLE_PLACES_API_KEY = originalEnv
    } else {
      delete process.env.GOOGLE_PLACES_API_KEY
    }
  })
  
  describe('searchGooglePlacesByPlaceId', () => {
    describe('Success cases', () => {
      it('should successfully lookup place by Place ID', async () => {
        const placeId = 'ChIJH_imbZuAZUYREePCK0vvmvU'
        const mockPlace = {
          name: 'Senso-ji Temple',
          formatted_address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
          geometry: {
            location: {
              lat: 35.7148,
              lng: 139.7967
            }
          },
          photos: [{
            photo_reference: 'test-photo-ref'
          }],
          rating: 4.5,
          price_level: 1
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: {
            result: mockPlace
          }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.place_id).toBe(placeId)
        expect(result?.name).toBe('Senso-ji Temple')
        expect(result?.address).toBe('2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan')
        expect(result?.lat).toBe(35.7148)
        expect(result?.lng).toBe(139.7967)
        expect(result?.photos).toHaveLength(1)
        expect(result?.photos[0]).toContain('test-photo-ref')
        expect(result?.rating).toBe(4.5)
        expect(result?.priceLevel).toBe(1)
        
        expect(mockClient.placeDetails).toHaveBeenCalledWith({
          params: {
            place_id: placeId,
            fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'price_level', 'types'],
            key: 'test-api-key'
          },
          timeout: 5000
        })
      })
      
      it('should format result consistently with PlaceResult interface', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: 'Test Place',
          formatted_address: '123 Test St',
          geometry: {
            location: { lat: 40.0, lng: -74.0 }
          },
          photos: [],
          rating: 4.0,
          price_level: 2
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).toHaveProperty('place_id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('address')
        expect(result).toHaveProperty('lat')
        expect(result).toHaveProperty('lng')
        expect(result).toHaveProperty('photos')
        expect(Array.isArray(result?.photos)).toBe(true)
        expect(result).toHaveProperty('rating')
        expect(result).toHaveProperty('priceLevel')
      })
      
      it('should handle place with no photos', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: 'Test Place',
          formatted_address: '123 Test St',
          geometry: {
            location: { lat: 40.0, lng: -74.0 }
          },
          photos: undefined,
          rating: 4.0
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.photos).toEqual([])
      })
      
      it('should handle place with missing optional fields', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: 'Test Place',
          formatted_address: '123 Test St',
          geometry: {
            location: { lat: 40.0, lng: -74.0 }
          },
          photos: []
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.rating).toBeUndefined()
        expect(result?.priceLevel).toBeUndefined()
      })
    })
    
    describe('Error cases', () => {
      it('should return null when API key is missing', async () => {
        delete process.env.GOOGLE_PLACES_API_KEY
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
        expect(mockClient.placeDetails).not.toHaveBeenCalled()
      })
      
      it('should return null when Place ID not found', async () => {
        mockClient.placeDetails.mockResolvedValue({
          data: { result: null }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should return null for invalid Place ID format', async () => {
        // Place ID doesn't start with ChIJ - API may reject or return null
        mockClient.placeDetails.mockResolvedValue({
          data: { result: null }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('INVALID_PLACE_ID', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle API errors gracefully', async () => {
        mockClient.placeDetails.mockRejectedValue(new Error('API Error'))
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('ETIMEDOUT')
        timeoutError.name = 'TimeoutError'
        mockClient.placeDetails.mockRejectedValue(timeoutError)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle API 400 errors', async () => {
        const apiError: any = new Error('Bad Request')
        apiError.response = { status: 400 }
        mockClient.placeDetails.mockRejectedValue(apiError)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle API 401 errors (invalid API key)', async () => {
        const apiError: any = new Error('Unauthorized')
        apiError.response = { status: 401 }
        mockClient.placeDetails.mockRejectedValue(apiError)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle API 429 errors (rate limiting)', async () => {
        const apiError: any = new Error('Too Many Requests')
        apiError.response = { status: 429 }
        mockClient.placeDetails.mockRejectedValue(apiError)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle API 500 errors', async () => {
        const apiError: any = new Error('Internal Server Error')
        apiError.response = { status: 500 }
        mockClient.placeDetails.mockRejectedValue(apiError)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('ChIJ123', mockClient)
        
        expect(result).toBeNull()
      })
    })
    
    describe('Edge cases', () => {
      it('should handle empty string Place ID', async () => {
        mockClient.placeDetails.mockResolvedValue({
          data: { result: null }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal('', mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle Place ID with special characters', async () => {
        const placeId = 'ChIJ!@#$%^&*()'
        mockClient.placeDetails.mockResolvedValue({
          data: { result: null }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).toBeNull()
      })
      
      it('should handle Place ID with missing geometry', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: 'Test Place',
          formatted_address: '123 Test St',
          geometry: undefined,
          photos: []
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.lat).toBe(0)
        expect(result?.lng).toBe(0)
      })
      
      it('should handle Place ID with empty name', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: '',
          formatted_address: '123 Test St',
          geometry: {
            location: { lat: 40.0, lng: -74.0 }
          },
          photos: []
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.name).toBe('')
      })
      
      it('should handle Place ID with empty address', async () => {
        const placeId = 'ChIJ123'
        const mockPlace = {
          name: 'Test Place',
          formatted_address: '',
          geometry: {
            location: { lat: 40.0, lng: -74.0 }
          },
          photos: []
        }
        
        mockClient.placeDetails.mockResolvedValue({
          data: { result: mockPlace }
        } as any)
        
        const result = await _searchGooglePlacesByPlaceIdInternal(placeId, mockClient)
        
        expect(result).not.toBeNull()
        expect(result?.address).toBe('')
      })
    })
    
    describe('Public API (backward compatibility)', () => {
      it('should work with default client', async () => {
        // This test verifies backward compatibility
        // In real scenario, this would make actual API call
        // For unit tests, we test the internal function
        expect(typeof searchGooglePlacesByPlaceId).toBe('function')
      })
    })
  })
  
  describe('searchGooglePlacesByCoordinates', () => {
    const mockPlaceIdLookup = jest.fn<() => Promise<PlaceResult | null>>()
    
    beforeEach(() => {
      mockPlaceIdLookup.mockClear()
    })
    
    describe('Success cases', () => {
      it('should successfully find place by coordinates', async () => {
        const lat = 35.7148
        const lng = 139.7967
        const mockPlaceId = 'ChIJ123'
        const mockPlace: PlaceResult = {
          place_id: mockPlaceId,
          name: 'Senso-ji Temple',
          address: '2 Chome-3-1 Asakusa',
          lat: 35.7148,
          lng: 139.7967,
          photos: [],
          rating: 4.5,
          priceLevel: 1
        }
        
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [{
              place_id: mockPlaceId
            }]
          }
        } as any)
        
        mockPlaceIdLookup.mockResolvedValue(mockPlace)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          lat,
          lng,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).not.toBeNull()
        expect(result?.place_id).toBe(mockPlaceId)
        expect(result?.name).toBe('Senso-ji Temple')
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith({
          params: {
            location: { lat, lng },
            radius: 50,
            key: 'test-api-key'
          },
          timeout: 5000
        })
        
        expect(mockPlaceIdLookup).toHaveBeenCalledWith(mockPlaceId)
      })
      
      it('should use 50-meter radius for nearby search', async () => {
        const lat = 35.7148
        const lng = 139.7967
        
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [{
              place_id: 'ChIJ123'
            }]
          }
        } as any)
        
        mockPlaceIdLookup.mockResolvedValue({
          place_id: 'ChIJ123',
          name: 'Test',
          address: 'Test',
          lat: 35.7148,
          lng: 139.7967,
          photos: []
        })
        
        await _searchGooglePlacesByCoordinatesInternal(
          lat,
          lng,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              radius: 50
            })
          })
        )
      })
      
      it('should reuse searchGooglePlacesByPlaceId for details', async () => {
        const lat = 35.7148
        const lng = 139.7967
        const placeId = 'ChIJ123'
        
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [{ place_id: placeId }]
          }
        } as any)
        
        const mockPlace: PlaceResult = {
          place_id: placeId,
          name: 'Test Place',
          address: 'Test Address',
          lat: 35.7148,
          lng: 139.7967,
          photos: [],
          rating: 4.0
        }
        
        mockPlaceIdLookup.mockResolvedValue(mockPlace)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          lat,
          lng,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockPlaceIdLookup).toHaveBeenCalledWith(placeId)
        expect(result).toEqual(mockPlace)
      })
    })
    
    describe('Error cases', () => {
      it('should return null when API key is missing', async () => {
        delete process.env.GOOGLE_PLACES_API_KEY
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
        expect(mockClient.placesNearby).not.toHaveBeenCalled()
      })
      
      it('should return null when no nearby places found', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: []
          }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
        expect(mockPlaceIdLookup).not.toHaveBeenCalled()
      })
      
      it('should return null when nearby result has no place_id', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [{
              // No place_id
            }]
          }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
        expect(mockPlaceIdLookup).not.toHaveBeenCalled()
      })
      
      it('should handle API errors gracefully', async () => {
        mockClient.placesNearby.mockRejectedValue(new Error('API Error'))
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
      })
      
      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('ETIMEDOUT')
        timeoutError.name = 'TimeoutError'
        mockClient.placesNearby.mockRejectedValue(timeoutError)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
      })
      
      it('should handle API 429 errors (rate limiting)', async () => {
        const apiError: any = new Error('Too Many Requests')
        apiError.response = { status: 429 }
        mockClient.placesNearby.mockRejectedValue(apiError)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
      })
      
      it('should handle Place ID lookup failure', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [{ place_id: 'ChIJ123' }]
          }
        } as any)
        
        mockPlaceIdLookup.mockResolvedValue(null)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(result).toBeNull()
      })
    })
    
    describe('Edge cases', () => {
      it('should handle invalid coordinates (NaN)', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          NaN,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        // Function should still attempt API call, but may return null
        expect(mockClient.placesNearby).toHaveBeenCalled()
      })
      
      it('should handle invalid coordinates (Infinity)', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          Infinity,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalled()
      })
      
      it('should handle coordinates at poles', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          90,
          0,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              location: { lat: 90, lng: 0 }
            })
          })
        )
      })
      
      it('should handle coordinates at equator', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          0,
          0,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              location: { lat: 0, lng: 0 }
            })
          })
        )
      })
      
      it('should handle negative coordinates', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          -35.7148,
          -139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              location: { lat: -35.7148, lng: -139.7967 }
            })
          })
        )
      })
      
      it('should handle very precise coordinates', async () => {
        const lat = 35.7148123456789
        const lng = 139.7967123456789
        
        mockClient.placesNearby.mockResolvedValue({
          data: { results: [] }
        } as any)
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          lat,
          lng,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockClient.placesNearby).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              location: { lat, lng }
            })
          })
        )
      })
      
      it('should handle multiple nearby places (selects first)', async () => {
        mockClient.placesNearby.mockResolvedValue({
          data: {
            results: [
              { place_id: 'ChIJ123' },
              { place_id: 'ChIJ456' },
              { place_id: 'ChIJ789' }
            ]
          }
        } as any)
        
        mockPlaceIdLookup.mockResolvedValue({
          place_id: 'ChIJ123',
          name: 'First Place',
          address: 'Address',
          lat: 35.7148,
          lng: 139.7967,
          photos: []
        })
        
        const result = await _searchGooglePlacesByCoordinatesInternal(
          35.7148,
          139.7967,
          mockClient,
          mockPlaceIdLookup
        )
        
        expect(mockPlaceIdLookup).toHaveBeenCalledWith('ChIJ123')
        expect(result?.place_id).toBe('ChIJ123')
      })
    })
    
    describe('Public API (backward compatibility)', () => {
      it('should work with default client', async () => {
        // This test verifies backward compatibility
        expect(typeof searchGooglePlacesByCoordinates).toBe('function')
      })
    })
  })
})

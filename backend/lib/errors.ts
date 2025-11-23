import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Centralized error handler
 * Converts various error types into appropriate HTTP responses
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message,
        details: error.details
      },
      { status: error.statusCode }
    )
  }
  
  // Handle Zod validation errors
  // ZodError uses 'issues' internally; 'errors' is an alias that may not work after serialization
  if (error instanceof ZodError) {
    const zodError = error as any
    const errors = zodError.issues || zodError.errors || []
    
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: errors.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message || 'Invalid value'
        }))
      },
      { status: 400 }
    )
  }
  
  // Fallback: Check for ZodError structure in Error instances (for serialized/wrapped errors)
  if (error && typeof error === 'object' && error instanceof Error) {
    const errorObj = error as any
    // Check for 'issues' property (ZodError's internal property)
    if (errorObj.issues && Array.isArray(errorObj.issues)) {
      const errors = errorObj.issues
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
            message: e.message || 'Invalid value'
          }))
        },
        { status: 400 }
      )
    }
  }
  
  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any
    
    // Duplicate key violation
    if (dbError.code === '23505') {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      )
    }
    
    // Foreign key violation
    if (dbError.code === '23503') {
      return NextResponse.json(
        { error: 'Referenced resource not found' },
        { status: 404 }
      )
    }
    
    // Not found
    if (dbError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  // Fallback for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

/**
 * Helper to throw 400 Bad Request
 */
export function badRequest(message: string, details?: any): never {
  throw new ApiError(400, message, details)
}

/**
 * Helper to throw 404 Not Found
 */
export function notFound(message: string = 'Resource not found'): never {
  throw new ApiError(404, message)
}

/**
 * Helper to throw 409 Conflict
 */
export function conflict(message: string): never {
  throw new ApiError(409, message)
}

/**
 * Helper to throw 500 Internal Server Error
 */
export function internalError(message: string): never {
  throw new ApiError(500, message)
}


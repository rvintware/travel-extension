import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns API status and database connectivity
 */
export async function GET() {
  try {
    // Test database connection by querying countries table
    const { data, error } = await supabase
      .from('countries')
      .select('count')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '0.2.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}


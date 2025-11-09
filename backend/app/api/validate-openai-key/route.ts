import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { handleError } from '@/lib/errors'

// Simple rate limiter (in-memory, per IP)
const rateLimiter = new Map<string, number[]>()

/**
 * Validate user's OpenAI API key
 * POST /api/validate-openai-key
 * 
 * Body: { apiKey: string }
 * Response: { valid: boolean, error?: string }
 */
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    // Rate limiting: 5 per minute per IP
    const attempts = rateLimiter.get(ip) || []
    const recentAttempts = attempts.filter(t => now - t < 60000)
    
    if (recentAttempts.length >= 5) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Too many validation attempts. Try again in 1 minute.',
          code: 'rate_limited'
        },
        { status: 429 }
      )
    }
    
    // Update rate limiter
    rateLimiter.set(ip, [...recentAttempts, now])
    
    // Get API key from body
    const body = await request.json()
    const apiKey = body.apiKey
    
    // Validate format
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key format. OpenAI keys start with "sk-"',
        code: 'invalid_format'
      })
    }
    
    console.log('[Validate] Testing OpenAI key...')  // Don't log the key!
    
    // Test key with OpenAI
    const openai = new OpenAI({ apiKey })
    
    await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    })
    
    console.log('[Validate] ✅ API key valid')
    
    // If we got here, key is valid
    return NextResponse.json({
      valid: true,
      model: 'gpt-4o-mini',
      message: 'API key validated successfully'
    })
    
  } catch (error: any) {
    console.error('[Validate] ❌ Validation failed:', error.message)  // Don't log full error (might contain key)
    
    // OpenAI specific errors
    if (error.status === 401) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid API key',
        code: 'invalid_api_key'
      })
    }
    
    if (error.status === 429) {
      return NextResponse.json({
        valid: false,
        error: 'API rate limit reached',
        code: 'rate_limit'
      })
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json({
        valid: false,
        error: 'Insufficient quota',
        code: 'insufficient_quota'
      })
    }
    
    // Generic error
    return handleError(error)
  }
}


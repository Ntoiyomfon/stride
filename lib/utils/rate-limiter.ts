import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  private getClientId(request: NextRequest): string {
    // Get client identifier (IP + User Agent for better uniqueness)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create a hash of IP + User Agent for privacy
    return `${ip}:${userAgent.substring(0, 50)}`
  }

  async isAllowed(request: NextRequest): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const clientId = this.getClientId(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Initialize or get existing record
    if (!store[clientId] || store[clientId].resetTime < now) {
      store[clientId] = {
        count: 0,
        resetTime: now + this.config.windowMs
      }
    }

    const record = store[clientId]

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      }
    }

    // Increment counter
    record.count++

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  async recordRequest(request: NextRequest, success: boolean = true): Promise<void> {
    if (this.config.skipSuccessfulRequests && success) return
    if (this.config.skipFailedRequests && !success) return

    // Request is already recorded in isAllowed, so this is a no-op
    // But can be extended for more complex scenarios
  }
}

// Pre-configured rate limiters for different endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
})

export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
})

export const otpRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 OTP attempts per 5 minutes
})

// Utility function to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await rateLimiter.isAllowed(request)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        }
      }
    )
  }

  try {
    const response = await handler()
    await rateLimiter.recordRequest(request, response.ok)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', rateLimiter['config'].maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
    
    return response
  } catch (error) {
    await rateLimiter.recordRequest(request, false)
    throw error
  }
}
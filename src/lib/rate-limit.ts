/**
 * Rate Limiting Utility
 * 
 * Production-ready rate limiting with in-memory fallback.
 * For production, consider using Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  keyPrefix?: string    // Prefix for the rate limit key
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config
  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  const remaining = Math.max(0, maxRequests - entry.count)
  
  if (entry.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    }
  }
  
  return {
    success: true,
    remaining,
    resetAt: entry.resetAt
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyPrefix: 'auth'
  },
  
  // Message sending - moderate limits
  messages: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'msg'
  },
  
  // Offer creation - strict to prevent spam
  offers: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyPrefix: 'offer'
  },
  
  // Listing creation - moderate limits
  listings: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'listing'
  },
  
  // Transaction creation - strict limits
  transactions: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'txn'
  },
  
  // Report creation - moderate limits
  reports: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10,
    keyPrefix: 'report'
  },
  
  // General API - lenient limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'api'
  },
  
  // Upload - strict limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyPrefix: 'upload'
  }
} as const

/**
 * Get client identifier from request
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetAt.toString())
  
  if (!result.success && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString())
  }
  
  return headers
}

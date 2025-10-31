import { NextRequest, NextResponse } from "next/server"

// Fallback rate limiting when Redis is not available
class MemoryRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  get limit() {
    return this.maxRequests
  }

  async checkLimit(identifier: string) {
    const now = Date.now()
    const key = identifier
    const current = this.requests.get(key)

    // Clean up expired entries
    if (current && now > current.resetTime) {
      this.requests.delete(key)
    }

    const entry = this.requests.get(key) || { count: 0, resetTime: now + this.windowMs }
    
    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    entry.count++
    this.requests.set(key, entry)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }
}

// Production-optimized rate limiters with sliding window
const memoryLimits = {
  api: new MemoryRateLimit(300, 60 * 1000), // 300 requests per minute for general API
  auth: new MemoryRateLimit(15, 60 * 1000), // 15 auth requests per minute
  upload: new MemoryRateLimit(30, 60 * 1000), // 30 uploads per minute
  payment: new MemoryRateLimit(10, 60 * 1000), // 10 payment requests per minute
  chat: new MemoryRateLimit(100, 60 * 1000), // 100 chat messages per minute
  search: new MemoryRateLimit(150, 60 * 1000), // 150 search requests per minute
  admin: new MemoryRateLimit(500, 60 * 1000), // 500 admin requests per minute
  webhook: new MemoryRateLimit(1000, 60 * 1000), // 1000 webhook requests per minute
}

export async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1"

  // Skip rate limiting for health checks, static files, and optimized read operations
  if (
    pathname === "/api/health" || 
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/webhooks/") || // Webhooks need higher limits
    (pathname === "/api/categories" && request.method === "GET") || // Fast category listing
    (pathname === "/api/announcements" && request.method === "GET") // Fast announcement fetching
  ) {
    return null
  }

  // Determine rate limit type with granular controls
  let limiter = memoryLimits.api
  let rateLimitType = "api"
  
  if (pathname.includes("/auth/") || pathname.includes("/login") || pathname.includes("/signup")) {
    limiter = memoryLimits.auth
    rateLimitType = "auth"
  } else if (pathname.includes("/upload")) {
    limiter = memoryLimits.upload
    rateLimitType = "upload"
  } else if (pathname.includes("/payment") || pathname.includes("/transactions")) {
    limiter = memoryLimits.payment
    rateLimitType = "payment"
  } else if (pathname.includes("/webhook")) {
    limiter = memoryLimits.webhook
    rateLimitType = "webhook"
  } else if (pathname.includes("/messages") || pathname.includes("/chats")) {
    limiter = memoryLimits.chat
    rateLimitType = "chat"
  } else if (pathname.includes("/admin/")) {
    limiter = memoryLimits.admin
    rateLimitType = "admin"
  } else if (pathname.includes("search") || pathname.includes("/listings")) {
    limiter = memoryLimits.search
    rateLimitType = "search"
  }

  try {
    // Try Upstash Redis first if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Ratelimit } = await import("@upstash/ratelimit")
      const { Redis } = await import("@upstash/redis")

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      const rateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limiter.limit, "1 m"),
        analytics: true,
      })

      const { success, limit, reset, remaining } = await rateLimit.limit(ip)

      if (!success) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": new Date(reset).toISOString(),
            },
          }
        )
      }
    } else {
      // Fallback to memory-based rate limiting
      const result = await limiter.checkLimit(ip)

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": new Date(result.reset).toISOString(),
            },
          }
        )
      }
    }

    return null // Continue processing
  } catch (error) {
    console.error("Rate limiting error:", error)
    return null // Continue without rate limiting on error
  }
}
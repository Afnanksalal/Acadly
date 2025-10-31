import { NextRequest, NextResponse } from "next/server"
import { applyRateLimit } from "./lib/middleware/rate-limit"
import { applyCorsHeaders, handlePreflight } from "./lib/middleware/cors"
import { applySecurityHeaders } from "./lib/middleware/security"

// Circuit breaker for critical services
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  threshold: 5,
  timeout: 30000, // 30 seconds
  
  isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailure) < this.timeout
  },
  
  recordFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
  },
  
  recordSuccess(): void {
    this.failures = 0
  }
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  
  try {
    // Handle preflight requests first
    const preflightResponse = handlePreflight(request)
    if (preflightResponse) {
      return preflightResponse
    }

    // Circuit breaker check for critical API routes
    if (pathname.startsWith("/api/") && circuitBreaker.isOpen()) {
      console.warn(`Circuit breaker open for ${pathname}`)
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "SERVICE_UNAVAILABLE", 
            message: "Service temporarily unavailable" 
          } 
        },
        { status: 503 }
      )
    }

    // Apply rate limiting to API routes
    if (pathname.startsWith("/api/")) {
      const rateLimitResponse = await applyRateLimit(request)
      if (rateLimitResponse) {
        return rateLimitResponse
      }
    }

    // Create response and apply headers
    const response = NextResponse.next()

    // Apply CORS headers for API routes
    if (pathname.startsWith("/api/")) {
      applyCorsHeaders(request, response)
    }

    // Apply security headers to all routes
    applySecurityHeaders(response)

    // Add performance headers
    const duration = Date.now() - startTime
    response.headers.set('X-Response-Time', `${duration}ms`)
    
    // Record success for circuit breaker
    if (pathname.startsWith("/api/")) {
      circuitBreaker.recordSuccess()
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    
    // Record failure for circuit breaker
    if (pathname.startsWith("/api/")) {
      circuitBreaker.recordFailure()
    }
    
    // Return graceful error response
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "MIDDLEWARE_ERROR", 
          message: "Request processing failed" 
        } 
      },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
}
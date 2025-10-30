import { NextRequest, NextResponse } from "next/server"
import { applyRateLimit } from "./lib/middleware/rate-limit"
import { applyCorsHeaders, handlePreflight } from "./lib/middleware/cors"
import { applySecurityHeaders } from "./lib/middleware/security"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle preflight requests
  const preflightResponse = handlePreflight(request)
  if (preflightResponse) {
    return preflightResponse
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

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
}

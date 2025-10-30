import { NextRequest, NextResponse } from "next/server"

export function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin")
  
  // Allow all origins in development, specific origins in production
  const allowedOrigins = process.env.NODE_ENV === "production" 
    ? [
        "https://acadly.in",
        "https://www.acadly.in",
        "https://acadlyy.vercel.app",
        // Add your Vercel preview URLs pattern
        /https:\/\/.*\.vercel\.app$/,
      ]
    : ["http://localhost:3000", "http://127.0.0.1:3000"]

  const isAllowedOrigin = allowedOrigins.some(allowed => {
    if (typeof allowed === "string") {
      return origin === allowed
    }
    return allowed.test(origin || "")
  })

  if (isAllowedOrigin || !origin) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Max-Age", "86400")

  return response
}

export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 })
    return applyCorsHeaders(request, response)
  }
  return null
}
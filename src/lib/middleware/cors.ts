import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  "https://acadly.in",
  "https://www.acadly.in",
  "https://acadlyy.vercel.app",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : [])
]

export function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin")
    const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin)

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowedOrigin ? (origin || "*") : "null",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Request-ID",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    })
  }
  return null
}

export function applyCorsHeaders(request: NextRequest, response: NextResponse): void {
  const origin = request.headers.get("origin")
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin)

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Expose-Headers", "X-Request-ID, X-Response-Time")
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Request-ID")
}
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors gracefully in middleware
            console.warn(`Failed to set cookie ${name} in middleware:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value: "", ...options, maxAge: 0 })
            response.cookies.set({ name, value: "", ...options, maxAge: 0 })
          } catch (error) {
            // Handle cookie removal errors gracefully in middleware
            console.warn(`Failed to remove cookie ${name} in middleware:`, error)
          }
        },
      },
    }
  )
}
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createRouteHandlerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // In route handlers, we can't always set cookies
            // This is expected behavior in some contexts
            console.debug(`Cookie ${name} not set in route handler context`)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 })
          } catch (error) {
            // In route handlers, we can't always remove cookies
            // This is expected behavior in some contexts
            console.debug(`Cookie ${name} not removed in route handler context`)
          }
        },
      },
    }
  )
}
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
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
          } catch {
            // Silently ignore cookie setting errors in Server Components
            // Cookies can only be modified in Server Actions or Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 })
          } catch {
            // Silently ignore cookie removal errors in Server Components
            // Cookies can only be modified in Server Actions or Route Handlers
          }
        },
      },
    }
  )
}

// For backward compatibility
export function supabaseServer() {
  return createServerSupabaseClient()
}

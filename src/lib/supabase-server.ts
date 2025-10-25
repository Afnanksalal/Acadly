import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function supabaseServer() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}

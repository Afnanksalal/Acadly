import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = createRouteHandlerSupabaseClient()
  await supabase.auth.signOut()
  return successResponse({ ok: true })
}
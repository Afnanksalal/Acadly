import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse } from "@/lib/api-response"

export async function POST() {
  const supabase = createRouteHandlerSupabaseClient()
  await supabase.auth.signOut()
  return successResponse({ ok: true })
}
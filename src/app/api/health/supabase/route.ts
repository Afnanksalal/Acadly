import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Supabase health check error:", error)
      return errorResponse(new Error("Supabase connection failed"), 500)
    }

    return successResponse({
      message: "Supabase connection healthy",
      timestamp: new Date().toISOString(),
      hasSession: !!data.session
    })
  } catch (error) {
    console.error("Supabase health check exception:", error)
    return errorResponse(error, 500)
  }
}
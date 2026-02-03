import { NextRequest } from "next/server"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/api-response"
import { createOrder } from "@/lib/razorpay"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    // Validate environment
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured")
      return errorResponse(new Error("Payment system not configured"), 500)
    }

    const body = await req.json()
    
    // Validate input
    if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
      return validationErrorResponse("Valid amount required")
    }

    try {
      const order = await createOrder({
        amount: Number(body.amount),
        receipt: body.receipt ?? `receipt_${Date.now()}`,
        notes: body.notes
      })
      
      return successResponse(order)
    } catch (error) {
      console.error("Payment order creation error:", error)
      return errorResponse(error, 500)
    }
  } catch (error) {
    console.error("Payment order creation error:", error)
    return errorResponse(error, 500)
  }
}

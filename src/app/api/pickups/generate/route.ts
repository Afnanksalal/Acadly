import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    const { transactionId } = await req.json()
    
    if (!transactionId) {
      return validationErrorResponse("Transaction ID required")
    }

    // Get transaction and verify user is the buyer
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true }
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    if (transaction.buyerId !== user.id) {
      return forbiddenResponse("Only buyer can generate pickup code")
    }

    if (transaction.status !== "PAID") {
      return validationErrorResponse("Transaction must be paid")
    }

    // Check if pickup code already exists
    const existingPickup = await prisma.pickup.findUnique({
      where: { transactionId }
    })

    if (existingPickup) {
      return successResponse({ pickup: existingPickup })
    }

    // Generate 6-digit pickup code
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString()

    const pickup = await prisma.pickup.create({
      data: {
        transactionId,
        pickupCode,
        status: "GENERATED"
      }
    })

    return successResponse({ pickup }, 201)

  } catch (error) {
    console.error("Generate pickup error:", error)
    return errorResponse(error, 500)
  }
}
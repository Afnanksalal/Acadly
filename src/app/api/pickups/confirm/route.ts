import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"
import { z } from "zod"
import { checkRateLimit, RATE_LIMITS, getClientIdentifier } from "@/lib/rate-limit"
import { notifyPickupConfirmed } from "@/lib/notifications"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const confirmPickupSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  pickupCode: z.string().length(6, "Pickup code must be 6 digits").regex(/^\d{6}$/, "Pickup code must be 6 digits")
})

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(clientId, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      keyPrefix: 'pickup-confirm'
    })
    
    if (!rateLimitResult.success) {
      return validationErrorResponse(
        `Too many attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
      )
    }

    const body = await request.json()
    const parsed = confirmPickupSchema.safeParse(body)
    
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.errors[0].message)
    }
    
    const { transactionId, pickupCode } = parsed.data

    // Get transaction with pickup
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        pickup: true,
        listing: true,
        buyer: {
          select: { id: true, email: true, username: true }
        },
        seller: {
          select: { id: true, email: true, username: true }
        }
      }
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    // Only seller can confirm pickup
    if (transaction.sellerId !== user.id) {
      return validationErrorResponse("Only the seller can confirm pickup")
    }

    // Check transaction status
    if (transaction.status !== "PAID") {
      return validationErrorResponse("Transaction must be paid before confirming pickup")
    }

    // Check if pickup exists
    if (!transaction.pickup) {
      return validationErrorResponse("Pickup code not generated yet")
    }

    // Check if already confirmed
    if (transaction.pickup.status === "CONFIRMED") {
      return validationErrorResponse("Pickup has already been confirmed")
    }

    // Verify pickup code (timing-safe comparison)
    const codeMatch = timingSafeEqual(pickupCode, transaction.pickup.pickupCode)
    
    if (!codeMatch) {
      // Log failed attempt for security monitoring
      console.warn(`[SECURITY] Failed pickup code attempt for transaction ${transactionId} by user ${user.id}`)
      return validationErrorResponse("Invalid pickup code")
    }

    // Confirm pickup in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update pickup status
      const updatedPickup = await tx.pickup.update({
        where: { transactionId },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date()
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PICKUP_CONFIRMED",
          resource: "TRANSACTION",
          resourceId: transactionId,
          metadata: {
            buyerId: transaction.buyerId,
            sellerId: transaction.sellerId,
            listingId: transaction.listingId,
            amount: transaction.amount.toString()
          }
        }
      })

      return updatedPickup
    })

    // Send notification to buyer (non-blocking)
    try {
      await notifyPickupConfirmed(transactionId)
    } catch (notificationError) {
      console.error("Failed to send pickup confirmation notification:", notificationError)
    }

    console.log(`[PICKUP] Confirmed for transaction ${transactionId} by seller ${user.id}`)

    return successResponse({
      pickup: result,
      message: "Pickup confirmed successfully! Transaction complete."
    })

  } catch (error) {
    console.error("Pickup confirmation error:", error)
    return errorResponse(error, 500)
  }
})

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

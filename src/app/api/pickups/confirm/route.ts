import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { validateAndSanitizeBody } from "@/lib/validation"
import { z } from "zod"

const confirmPickupSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  pickupCode: z.string().length(6, "Pickup code must be 6 digits").regex(/^\d+$/, "Pickup code must contain only numbers")
})

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(confirmPickupSchema)(body)

    // Get transaction with pickup details
    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        pickup: true,
        listing: true,
        buyer: true,
        seller: true
      }
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    // Check if user is the seller (only seller can confirm pickup)
    if (transaction.sellerId !== user.id) {
      return validationErrorResponse("Only the seller can confirm pickup")
    }

    // Check if transaction is paid
    if (transaction.status !== "PAID") {
      return validationErrorResponse("Transaction must be paid to confirm pickup")
    }

    // Check if pickup exists
    if (!transaction.pickup) {
      return validationErrorResponse("No pickup code found for this transaction")
    }

    // Check if already confirmed
    if (transaction.pickup.status === "CONFIRMED") {
      return validationErrorResponse("Pickup already confirmed")
    }

    // Verify pickup code
    if (transaction.pickup.pickupCode !== data.pickupCode) {
      return validationErrorResponse("Invalid pickup code")
    }

    // Confirm pickup in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update pickup status
      const updatedPickup = await tx.pickup.update({
        where: { id: transaction.pickup!.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date()
        }
      })

      // Mark listing as sold
      await tx.listing.update({
        where: { id: transaction.listingId },
        data: { isActive: false }
      })

      return updatedPickup
    })

    return successResponse({
      pickup: result,
      message: "Pickup confirmed successfully"
    })

  } catch (error) {
    console.error("Error confirming pickup:", error)
    return errorResponse(error, 500)
  }
})
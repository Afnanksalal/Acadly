import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { isValidUUID } from "@/lib/uuid-validation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const transactionId = url.pathname.split("/")[3]

    if (!transactionId) {
      return validationErrorResponse("Transaction ID is required")
    }

    if (!isValidUUID(transactionId)) {
      return validationErrorResponse("Invalid transaction ID format")
    }

    // Get transaction with relations
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
        buyer: true,
        seller: true,
        pickup: true,
      },
    })

    if (!transaction) {
      return notFoundResponse("Transaction not found")
    }

    // Check if user can generate pickup code (seller or admin)
    if (transaction.sellerId !== user.id && user.role !== "ADMIN") {
      return validationErrorResponse("Only the seller can generate pickup codes")
    }

    // Check if transaction is paid
    if (transaction.status !== "PAID") {
      return validationErrorResponse("Pickup code can only be generated for paid transactions")
    }

    // Check if pickup code already exists
    if (transaction.pickup) {
      return validationErrorResponse("Pickup code already exists for this transaction")
    }

    // Generate pickup code
    const pickup = await prisma.pickup.create({
      data: {
        transactionId: transaction.id,
        pickupCode: Math.floor(100000 + Math.random() * 900000).toString(),
        status: "GENERATED",
      },
    })

    // Mark listing as sold if not already
    if (transaction.listing.isActive) {
      await prisma.listing.update({
        where: { id: transaction.listingId },
        data: { isActive: false },
      })
    }

    return successResponse({
      pickup,
      message: "Pickup code generated successfully",
    })
  } catch (error) {
    console.error("Error generating pickup code:", error)
    return errorResponse(error, 500)
  }
})
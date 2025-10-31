import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { refundCancelledTransaction } from "@/lib/refund"
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

    // Check if user can cancel this transaction
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id && user.role !== "ADMIN") {
      return validationErrorResponse("You can only cancel your own transactions")
    }

    // Check if transaction can be cancelled
    if (transaction.status === "CANCELLED") {
      return validationErrorResponse("Transaction is already cancelled")
    }

    if (transaction.status === "REFUNDED") {
      return validationErrorResponse("Transaction has already been refunded")
    }

    if (transaction.pickup?.status === "CONFIRMED") {
      return validationErrorResponse("Cannot cancel transaction after pickup confirmation")
    }

    // Process refund if payment was made
    let refundResult = null
    if (transaction.status === "PAID" && transaction.razorpayPaymentId) {
      refundResult = await refundCancelledTransaction(transactionId)
      
      if (!refundResult.success) {
        return errorResponse(new Error(`Refund failed: ${refundResult.error}`), 500)
      }
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "CANCELLED",
      },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        pickup: true,
      },
    })

    // Reactivate the listing
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: {
        isActive: true,
      },
    })

    return successResponse({
      transaction: updatedTransaction,
      refund: refundResult,
      message: "Transaction cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling transaction:", error)
    return errorResponse(error, 500)
  }
})
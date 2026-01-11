import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validateAndSanitizeBody } from "@/lib/validation"
import { z } from "zod"
import { verifyPaymentSignature } from "@/lib/razorpay"
import { notifyPaymentReceived, notifyPickupCodeGenerated } from "@/lib/notifications"
import crypto from "crypto"

// Force dynamic - this handles payment verification
export const dynamic = 'force-dynamic'

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  transactionId: z.string().uuid("Invalid transaction ID")
})

/**
 * POST /api/webhooks/razorpay/verify
 * 
 * Verifies payment signature from Razorpay Checkout callback.
 * This is called from the client after successful payment.
 */
export const POST = async (request: NextRequest) => {
  const requestId = `verify_${Date.now()}`
  
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(verifyPaymentSchema)(body)

    console.log(`[${requestId}] Verifying payment:`, {
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      transactionId: data.transactionId
    })

    // Verify signature using production-ready utility
    const isValid = verifyPaymentSignature({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature
    })

    if (!isValid) {
      console.error(`[${requestId}] Invalid payment signature`)
      return validationErrorResponse("Invalid payment signature. Payment verification failed.")
    }

    console.log(`[${requestId}] Signature verified successfully`)

    // Update transaction status and deactivate listing atomically
    const result = await prisma.$transaction(async (tx) => {
      // First, verify the transaction exists and matches the order
      const existingTransaction = await tx.transaction.findUnique({
        where: { id: data.transactionId },
        include: { listing: true, pickup: true }
      })

      if (!existingTransaction) {
        throw new Error("TRANSACTION_NOT_FOUND")
      }

      if (existingTransaction.razorpayOrderId !== data.razorpay_order_id) {
        throw new Error("ORDER_MISMATCH")
      }

      if (existingTransaction.status === "PAID") {
        // Already processed - idempotent response
        console.log(`[${requestId}] Transaction already paid, returning existing data`)
        return { ...existingTransaction, alreadyPaid: true }
      }

      // Update transaction to PAID
      const transaction = await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          status: "PAID",
          razorpayPaymentId: data.razorpay_payment_id
        },
        include: {
          listing: true,
          buyer: { select: { id: true, email: true, username: true, name: true } },
          seller: { select: { id: true, email: true, username: true, name: true } },
          pickup: true
        }
      })

      // Immediately deactivate listing to prevent double purchases
      if (transaction.listing.isActive) {
        await tx.listing.update({
          where: { id: transaction.listingId },
          data: { isActive: false }
        })
        console.log(`[${requestId}] Listing ${transaction.listingId} marked as sold`)
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: transaction.buyerId,
          action: "PAYMENT_VERIFIED",
          resource: "TRANSACTION",
          resourceId: transaction.id,
          metadata: {
            razorpayOrderId: data.razorpay_order_id,
            razorpayPaymentId: data.razorpay_payment_id,
            amount: transaction.amount.toString(),
            sellerId: transaction.sellerId,
            listingId: transaction.listingId
          }
        }
      })

      return { ...transaction, alreadyPaid: false }
    })

    // Generate pickup code if not exists (outside main transaction for non-critical operation)
    let pickupCode: string | null = null
    if (!result.pickup && !result.alreadyPaid) {
      try {
        // Generate cryptographically secure 6-digit code
        const code = crypto.randomInt(100000, 999999).toString()
        
        const pickup = await prisma.pickup.create({
          data: {
            transactionId: result.id,
            pickupCode: code,
            status: "GENERATED"
          }
        })
        
        pickupCode = pickup.pickupCode
        console.log(`[${requestId}] Pickup code generated for transaction ${result.id}`)
        
        // Notify buyer about pickup code
        try {
          await notifyPickupCodeGenerated(result.id)
        } catch (notifyError) {
          console.error(`[${requestId}] Failed to send pickup code notification:`, notifyError)
        }
      } catch (pickupError) {
        console.error(`[${requestId}] Error generating pickup code:`, pickupError)
        // Don't fail - pickup code can be generated later
      }
    }

    // Send payment received notification (non-blocking)
    try {
      await notifyPaymentReceived(result.id)
    } catch (notifyError) {
      console.error(`[${requestId}] Failed to send payment notification:`, notifyError)
    }

    console.log(`[${requestId}] Payment verification complete:`, {
      transactionId: result.id,
      status: result.status,
      amount: result.amount.toString()
    })

    return successResponse({
      transaction: {
        id: result.id,
        status: result.status,
        amount: result.amount,
        razorpayPaymentId: result.razorpayPaymentId
      },
      pickupCode,
      message: "Payment verified successfully"
    })

  } catch (error) {
    console.error(`[${requestId}] Payment verification error:`, error)
    
    if (error instanceof Error) {
      switch (error.message) {
        case "TRANSACTION_NOT_FOUND":
          return validationErrorResponse("Transaction not found")
        case "ORDER_MISMATCH":
          return validationErrorResponse("Order ID does not match transaction")
      }
    }
    
    return errorResponse(error, 500)
  }
}

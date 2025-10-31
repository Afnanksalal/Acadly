import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validateAndSanitizeBody } from "@/lib/validation"
import { z } from "zod"
import crypto from "crypto"

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  transactionId: z.string().uuid("Invalid transaction ID")
})

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const data = validateAndSanitizeBody(verifyPaymentSchema)(body)

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return errorResponse(new Error("Razorpay secret not configured"), 500)
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== data.razorpay_signature) {
      return validationErrorResponse("Invalid payment signature")
    }

    // Update transaction status
    const transaction = await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: "PAID",
        razorpayPaymentId: data.razorpay_payment_id
      },
      include: {
        listing: true,
        buyer: true,
        seller: true
      }
    })

    if (!transaction) {
      return validationErrorResponse("Transaction not found")
    }

    return successResponse({
      transaction,
      message: "Payment verified successfully"
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    return errorResponse(error, 500)
  }
}
import Razorpay from "razorpay"
import { prisma } from "./prisma"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface RefundResult {
  success: boolean
  refundId?: string
  amount?: number
  error?: string
}

export async function processRefund(
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> {
  try {
    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    if (!transaction.razorpayPaymentId) {
      return { success: false, error: "No payment ID found for refund" }
    }

    if (transaction.status === "REFUNDED") {
      return { success: false, error: "Transaction already refunded" }
    }

    // Calculate refund amount (default to full amount)
    const transactionAmount = Number(transaction.amount)
    const refundAmount = amount ? Math.min(amount * 100, transactionAmount * 100) : transactionAmount * 100

    // Validate refund amount
    if (refundAmount <= 0) {
      return { success: false, error: "Invalid refund amount" }
    }

    try {
      // Process refund with Razorpay
      const refund = await razorpay.payments.refund(transaction.razorpayPaymentId, {
        amount: Math.round(refundAmount), // Ensure integer
        notes: {
          reason: reason || "Dispute resolution",
          transaction_id: transactionId,
        },
      })

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "REFUNDED",
        },
      })

      // Reactivate listing if it was marked as sold
      await prisma.listing.update({
        where: { id: transaction.listingId },
        data: {
          isActive: true,
        },
      })

      const refundAmountInRupees = Math.round((refund.amount || 0) / 100)

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmountInRupees,
      }
    } catch (razorpayError: any) {
      console.error("Razorpay refund error:", razorpayError)
      return {
        success: false,
        error: razorpayError?.error?.description || razorpayError?.message || "Refund processing failed",
      }
    }
  } catch (error) {
    console.error("Refund processing error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal error processing refund",
    }
  }
}

export async function processPartialRefund(
  transactionId: string,
  refundPercentage: number,
  reason?: string
): Promise<RefundResult> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  })

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  const refundAmount = Math.floor(Number(transaction.amount) * refundPercentage * 100) // Convert to paise
  return processRefund(transactionId, refundAmount, reason)
}

// Automatic refund for cancelled transactions
export async function refundCancelledTransaction(transactionId: string): Promise<RefundResult> {
  return processRefund(transactionId, undefined, "Transaction cancelled by user")
}

// Dispute-based refund
export async function refundForDispute(
  disputeId: string,
  refundPercentage: number = 1.0
): Promise<RefundResult> {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: true,
      },
    })

    if (!dispute) {
      return { success: false, error: "Dispute not found" }
    }

    const result = await processPartialRefund(
      dispute.transactionId,
      refundPercentage,
      `Dispute resolution: ${dispute.subject}`
    )

    if (result.success) {
      // Update dispute with refund information
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          refundAmount: result.amount,
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      })
    }

    return result
  } catch (error) {
    console.error("Dispute refund error:", error)
    return {
      success: false,
      error: "Error processing dispute refund",
    }
  }
}
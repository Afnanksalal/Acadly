import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { processRefund, processPartialRefund } from "@/lib/refund"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'
import { isValidUUID } from "@/lib/uuid-validation"

const refundSchema = z.object({
  amount: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid amount")
      }
      return num
    })
  ]).optional(),
  percentage: z.union([
    z.number().min(0).max(1),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num < 0 || num > 1) {
        throw new Error("Invalid percentage")
      }
      return num
    })
  ]).optional(),
  reason: z.string().max(500).optional(),
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const transactionId = url.pathname.split("/")[3]

    if (!transactionId) {
      return validationErrorResponse("Transaction ID is required")
    }

    if (!isValidUUID(transactionId)) {
      return validationErrorResponse("Invalid transaction ID format")
    }

    const body = await request.json()
    const parsed = refundSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid refund data", parsed.error.errors)
    }

    const { amount, percentage, reason } = parsed.data

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
      return notFoundResponse("Transaction not found")
    }

    if (transaction.status === "REFUNDED") {
      return validationErrorResponse("Transaction has already been refunded")
    }

    if (transaction.status !== "PAID") {
      return validationErrorResponse("Only paid transactions can be refunded")
    }

    // Process refund
    let refundResult
    if (percentage !== undefined) {
      refundResult = await processPartialRefund(transactionId, percentage, reason)
    } else {
      refundResult = await processRefund(transactionId, amount, reason)
    }

    if (!refundResult.success) {
      return errorResponse(new Error(refundResult.error), 500)
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        disputeId: body.disputeId || null, // If refund is part of dispute resolution
        adminId: user.id,
        action: `Processed refund: ${refundResult.amount} INR. Reason: ${reason || "Admin refund"}`,
      },
    })

    return successResponse({
      refund: refundResult,
      message: "Refund processed successfully",
    })
  } catch (error) {
    console.error("Error processing refund:", error)
    return errorResponse(error, 500)
  }
})
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { refundForDispute } from "@/lib/refund"
import { z } from "zod"

const resolveDisputeSchema = z.object({
  resolution: z.string().min(10, "Resolution must be at least 10 characters").max(1000, "Resolution too long"),
  action: z.enum(["RESOLVED", "REJECTED"]),
  refundPercentage: z.union([
    z.number().min(0).max(1),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num < 0 || num > 1) {
        throw new Error("Invalid refund percentage")
      }
      return num
    })
  ]).optional(), // 0 to 1 (0% to 100%)
  refundAmount: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid refund amount")
      }
      return num
    })
  ]).optional(), // Specific amount in rupees
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const disputeId = url.pathname.split("/")[4] // /api/admin/disputes/[id]/resolve

    if (!disputeId) {
      return validationErrorResponse("Dispute ID is required")
    }

    const body = await request.json()
    const parsed = resolveDisputeSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid input data", parsed.error.errors)
    }

    const { resolution, action, refundPercentage, refundAmount } = parsed.data

    // Get dispute with transaction details
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: {
          include: {
            buyer: true,
            seller: true,
            listing: true,
          },
        },
      },
    })

    if (!dispute) {
      return notFoundResponse("Dispute not found")
    }

    if (dispute.status !== "OPEN" && dispute.status !== "IN_REVIEW") {
      return validationErrorResponse("Dispute has already been resolved")
    }

    let refundResult = null

    // Process refund if resolving in favor of buyer
    if (action === "RESOLVED" && (refundPercentage !== undefined || refundAmount !== undefined)) {
      if (dispute.transaction.status !== "PAID") {
        return validationErrorResponse("Cannot refund unpaid transaction")
      }

      if (refundPercentage !== undefined) {
        refundResult = await refundForDispute(disputeId, refundPercentage)
      } else if (refundAmount !== undefined) {
        const transactionAmount = Number(dispute.transaction.amount)
        const percentage = Math.min(refundAmount / transactionAmount, 1)
        refundResult = await refundForDispute(disputeId, percentage)
      }

      if (refundResult && !refundResult.success) {
        return errorResponse(new Error(`Refund failed: ${refundResult.error}`), 500)
      }
    }

    // Update dispute status
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: action,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: user.id,
        refundAmount: refundResult?.amount || null,
      },
      include: {
        transaction: {
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            seller: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            listing: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
              },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        disputeId,
        adminId: user.id,
        action: `${action}: ${resolution}${refundResult ? ` | Refund: ₹${refundResult.amount}` : ""}`,
      },
    })

    return successResponse({
      dispute: updatedDispute,
      refund: refundResult,
      message: `Dispute ${action.toLowerCase()} successfully${refundResult ? " with refund processed" : ""}`,
    })
  } catch (error) {
    console.error("Error resolving dispute:", error)
    return errorResponse(error, 500)
  }
})

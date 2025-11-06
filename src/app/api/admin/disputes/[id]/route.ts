import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { isValidUUID } from "@/lib/uuid-validation"

export const dynamic = 'force-dynamic'

// Update dispute status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(async (req: NextRequest, user) => {
    try {
      const disputeId = params.id

      if (!isValidUUID(disputeId)) {
        return validationErrorResponse("Invalid dispute ID format")
      }

      const body = await req.json()
      const { status, resolution } = body

      if (!status || !['RESOLVED', 'REJECTED', 'IN_REVIEW'].includes(status)) {
        return validationErrorResponse("Invalid status")
      }

      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId }
      })

      if (!dispute) {
        return notFoundResponse("Dispute not found")
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          resolution: resolution || undefined,
          resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date() : undefined,
          resolvedBy: user.id
        },
        include: {
          transaction: {
            include: {
              listing: true,
              buyer: true,
              seller: true
            }
          }
        }
      })

      // Create admin action log
      await prisma.adminAction.create({
        data: {
          disputeId: disputeId,
          adminId: user.id,
          action: `Updated dispute status to ${status}. Resolution: ${resolution || 'N/A'}`
        }
      })

      return successResponse({
        dispute: updatedDispute,
        message: "Dispute updated successfully"
      })
    } catch (error) {
      console.error("Error updating dispute:", error)
      return errorResponse(error, 500)
    }
  })(request)
}

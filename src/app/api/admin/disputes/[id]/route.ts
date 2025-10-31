import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"
import { isValidUUID } from "@/lib/uuid-validation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const updateDisputeSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  notes: z.string().max(500).optional(),
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin dispute detail access for security audit
  console.log(`Admin dispute detail accessed by user: ${user.id} (${user.email})`)
  try {
    const url = new URL(request.url)
    const disputeId = url.pathname.split("/")[4] // /api/admin/disputes/[id]

    if (!disputeId) {
      return validationErrorResponse("Dispute ID is required")
    }

    if (!isValidUUID(disputeId)) {
      return validationErrorResponse("Invalid dispute ID format")
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
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
                category: true,
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
        actions: {
          include: {
            admin: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!dispute) {
      return notFoundResponse("Dispute not found")
    }

    return successResponse(dispute)
  } catch (error) {
    console.error("Error fetching dispute:", error)
    return errorResponse(error, 500)
  }
})

export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const disputeId = url.pathname.split("/")[4] // /api/admin/disputes/[id]

    if (!disputeId) {
      return validationErrorResponse("Dispute ID is required")
    }

    const body = await request.json()
    const parsed = updateDisputeSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid input data", parsed.error.errors)
    }

    const { status, priority, notes } = parsed.data

    // Check if dispute exists
    const existingDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    })

    if (!existingDispute) {
      return notFoundResponse("Dispute not found")
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        updatedAt: new Date(),
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

    // Log admin action if there are changes
    const changes = []
    if (status && status !== existingDispute.status) {
      changes.push(`Status: ${existingDispute.status} → ${status}`)
    }
    if (priority && priority !== existingDispute.priority) {
      changes.push(`Priority: ${existingDispute.priority} → ${priority}`)
    }

    if (changes.length > 0 || notes) {
      await prisma.adminAction.create({
        data: {
          disputeId,
          adminId: user.id,
          action: `Updated dispute: ${changes.join(", ")}${notes ? ` | Notes: ${notes}` : ""}`,
        },
      })
    }

    return successResponse({
      dispute: updatedDispute,
      message: "Dispute updated successfully",
    })
  } catch (error) {
    console.error("Error updating dispute:", error)
    return errorResponse(error, 500)
  }
})
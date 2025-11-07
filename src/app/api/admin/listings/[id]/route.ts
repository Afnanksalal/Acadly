import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { isValidUUID } from "@/lib/uuid-validation"

export const dynamic = 'force-dynamic'

// Delete listing (Admin only)
export const DELETE = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const listingId = url.pathname.split("/")[4]

    if (!listingId) {
      return validationErrorResponse("Listing ID is required")
    }

    if (!isValidUUID(listingId)) {
      return validationErrorResponse("Invalid listing ID format")
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        transactions: {
          where: {
            status: {
              in: ['INITIATED', 'PAID']
            }
          }
        },
        chats: true
      }
    })

    if (!listing) {
      return notFoundResponse("Listing not found")
    }

    // Check if there are active transactions
    if (listing.transactions.length > 0) {
      return validationErrorResponse(
        "Cannot delete listing with active transactions. Please resolve or cancel transactions first."
      )
    }

    // Delete related data first (chats, messages, offers)
    await prisma.$transaction(async (tx) => {
      // Delete offers in chats
      await tx.offer.deleteMany({
        where: {
          chat: {
            listingId: listingId
          }
        }
      })

      // Delete messages in chats
      await tx.message.deleteMany({
        where: {
          chat: {
            listingId: listingId
          }
        }
      })

      // Delete chats
      await tx.chat.deleteMany({
        where: { listingId: listingId }
      })

      // Finally delete the listing
      await tx.listing.delete({
        where: { id: listingId }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resource: 'LISTING',
          resourceId: listingId,
          oldValues: {
            title: listing.title,
            price: listing.price.toString(),
            userId: listing.userId
          },
          newValues: {},
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
          metadata: {
            reason: 'Admin deletion',
            adminId: user.id
          }
        }
      })
    })

    return successResponse({
      message: "Listing deleted successfully",
      listingId
    })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return errorResponse(error, 500)
  }
})

// Update listing (Admin only - for moderation)
export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url)
    const listingId = url.pathname.split("/")[4]

    if (!listingId) {
      return validationErrorResponse("Listing ID is required")
    }

    if (!isValidUUID(listingId)) {
      return validationErrorResponse("Invalid listing ID format")
    }

    const body = await request.json()
    const { isActive, requiresApproval } = body

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing) {
      return notFoundResponse("Listing not found")
    }

    // Update listing
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof requiresApproval === 'boolean' && { requiresApproval })
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        resource: 'LISTING',
        resourceId: listingId,
        oldValues: {
          isActive: listing.isActive,
          requiresApproval: listing.requiresApproval
        },
        newValues: {
          isActive: updated.isActive,
          requiresApproval: updated.requiresApproval
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'Admin moderation',
          adminId: user.id
        }
      }
    })

    return successResponse({
      listing: updated,
      message: "Listing updated successfully"
    })
  } catch (error) {
    console.error('Error updating listing:', error)
    return errorResponse(error, 500)
  }
})

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { z } from "zod"
import { createNotification } from "@/lib/notifications"

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/listings
 * Get all listings with filtering and pagination
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20")
    })

    const search = searchParams.get("search")
    const status = searchParams.get("status") // active, inactive, all
    const type = searchParams.get("type") // PRODUCT, SERVICE
    const categoryId = searchParams.get("categoryId")
    const userId = searchParams.get("userId")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const requiresApproval = searchParams.get("requiresApproval")

    // Build where clause
    const where: {
      title?: { contains: string; mode: 'insensitive' }
      isActive?: boolean
      type?: 'PRODUCT' | 'SERVICE'
      categoryId?: string
      userId?: string
      requiresApproval?: boolean
    } = {}

    if (search) {
      where.title = { contains: search, mode: "insensitive" }
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    if (type && (type === "PRODUCT" || type === "SERVICE")) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (userId) {
      where.userId = userId
    }

    if (requiresApproval === "true") {
      where.requiresApproval = true
    }

    // Build orderBy
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    if (["createdAt", "updatedAt", "price", "title"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc"
    } else {
      orderBy.createdAt = "desc"
    }

    const [listings, total, stats] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              verified: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              transactions: true,
              chats: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.listing.count({ where }),
      // Get stats
      Promise.all([
        prisma.listing.count(),
        prisma.listing.count({ where: { isActive: true } }),
        prisma.listing.count({ where: { requiresApproval: true } }),
        prisma.listing.groupBy({
          by: ['type'],
          _count: true
        })
      ])
    ])

    const [totalListings, activeListings, pendingApproval, byType] = stats

    return successResponse({
      listings,
      stats: {
        total: totalListings,
        active: activeListings,
        inactive: totalListings - activeListings,
        pendingApproval,
        byType: byType.map(t => ({ type: t.type, count: t._count }))
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching admin listings:", error)
    return errorResponse(error, 500)
  }
})

const updateListingSchema = z.object({
  listingId: z.string().uuid(),
  action: z.enum(["activate", "deactivate", "approve", "reject", "feature", "unfeature"]),
  reason: z.string().max(500).optional()
})

/**
 * PUT /api/admin/listings
 * Update listing status (activate, deactivate, approve, reject)
 */
export const PUT = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const body = await request.json()
    const parsed = updateListingSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid request data", parsed.error.errors)
    }

    const { listingId, action, reason } = parsed.data

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: { select: { id: true, email: true } } }
    })

    if (!listing) {
      return validationErrorResponse("Listing not found")
    }

    let updateData: { isActive?: boolean; requiresApproval?: boolean } = {}
    let notificationTitle = ""
    let notificationMessage = ""
    let notificationPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"

    switch (action) {
      case "activate":
        updateData = { isActive: true }
        notificationTitle = "Listing Activated"
        notificationMessage = `Your listing "${listing.title}" has been activated.`
        break

      case "deactivate":
        updateData = { isActive: false }
        notificationTitle = "Listing Deactivated"
        notificationMessage = reason 
          ? `Your listing "${listing.title}" was deactivated: ${reason}`
          : `Your listing "${listing.title}" has been deactivated by admin.`
        notificationPriority = "HIGH"
        break

      case "approve":
        updateData = { isActive: true, requiresApproval: false }
        notificationTitle = "Listing Approved"
        notificationMessage = `Your listing "${listing.title}" has been approved and is now live!`
        break

      case "reject":
        updateData = { isActive: false, requiresApproval: false }
        notificationTitle = "Listing Rejected"
        notificationMessage = reason 
          ? `Your listing "${listing.title}" was rejected: ${reason}`
          : `Your listing "${listing.title}" was rejected. Please review our guidelines.`
        notificationPriority = "HIGH"
        break

      default:
        return validationErrorResponse("Invalid action")
    }

    // Update listing and log action
    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: updateData
      })

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: `LISTING_${action.toUpperCase()}`,
          resource: "LISTING",
          resourceId: listingId,
          metadata: {
            listingTitle: listing.title,
            ownerId: listing.userId,
            reason
          }
        }
      })
    })

    // Send notification to listing owner
    await createNotification({
      userId: listing.userId,
      type: "ADMIN",
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: `/listings/${listingId}`,
      priority: notificationPriority
    })

    return successResponse({
      success: true,
      listingId,
      action,
      message: `Listing ${action}d successfully`
    })
  } catch (error) {
    console.error("Error updating listing:", error)
    return errorResponse(error, 500)
  }
})

/**
 * DELETE /api/admin/listings
 * Delete a listing
 */
export const DELETE = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get("id")
    const reason = searchParams.get("reason")

    if (!listingId) {
      return validationErrorResponse("Listing ID required")
    }

    // Get listing before deletion
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, userId: true }
    })

    if (!listing) {
      return validationErrorResponse("Listing not found")
    }

    // Delete listing and log action
    await prisma.$transaction(async (tx) => {
      await tx.listing.delete({
        where: { id: listingId }
      })

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "LISTING_DELETED",
          resource: "LISTING",
          resourceId: listingId,
          metadata: {
            listingTitle: listing.title,
            ownerId: listing.userId,
            reason
          }
        }
      })
    })

    // Notify owner
    await createNotification({
      userId: listing.userId,
      type: "ADMIN",
      title: "Listing Removed",
      message: reason 
        ? `Your listing "${listing.title}" was removed: ${reason}`
        : `Your listing "${listing.title}" has been removed for policy violations.`,
      priority: "HIGH"
    })

    return successResponse({
      success: true,
      message: "Listing deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting listing:", error)
    return errorResponse(error, 500)
  }
})

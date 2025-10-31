import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional()
}).refine(data => data.notificationIds || data.markAll, {
  message: "Either notificationIds or markAll must be provided"
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    const type = searchParams.get("type")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    // Build where clause
    const where: any = { userId: user.id }
    if (type) where.type = type
    if (unreadOnly) where.isRead = false

    // Check for expired notifications and clean them up
    const now = new Date()
    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: now }
      }
    })

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          isRead: true,
          priority: true,
          createdAt: true,
          expiresAt: true
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ],
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { 
          userId: user.id, 
          isRead: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ]
        } 
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return successResponse(
      { notifications, unreadCount },
      200,
      { page, limit, total, totalPages }
    )
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return errorResponse(error, 500)
  }
})

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = markReadSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid request data", parsed.error.errors)
    }

    const { notificationIds, markAll } = parsed.data

    if (markAll) {
      // Mark all notifications as read
      const updated = await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return successResponse({ 
        message: "All notifications marked as read",
        updatedCount: updated.count 
      })
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const updated = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return successResponse({ 
        message: "Notifications marked as read",
        updatedCount: updated.count 
      })
    }

    return validationErrorResponse("No valid action specified")
  } catch (error) {
    console.error("Error updating notifications:", error)
    return errorResponse(error, 500)
  }
})

// Delete notifications
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      // Delete all read notifications older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const deleted = await prisma.notification.deleteMany({
        where: {
          userId: user.id,
          isRead: true,
          createdAt: { lt: thirtyDaysAgo }
        }
      })

      return successResponse({ 
        message: "Old notifications deleted",
        deletedCount: deleted.count 
      })
    } else if (notificationId) {
      // Delete specific notification
      const deleted = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: user.id
        }
      })

      if (deleted.count === 0) {
        return validationErrorResponse("Notification not found or not owned by user")
      }

      return successResponse({ message: "Notification deleted" })
    }

    return validationErrorResponse("No valid action specified")
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return errorResponse(error, 500)
  }
})
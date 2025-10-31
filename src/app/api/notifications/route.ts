import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth, withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

// GET /api/notifications - Get user notifications
export const GET = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = { userId: user.id }
    if (type) where.type = type
    if (unreadOnly) where.isRead = false

    // Get notifications from database
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    })

    const total = await prisma.notification.count({ where })

    const unreadCount = await prisma.notification.count({
      where: { 
        userId: user.id,
        isRead: false
      }
    })

    return successResponse({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      unreadCount
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/notifications - Create notification (admin only)
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { targetUsers, type, title, message, priority, data } = body

    // Create notifications
    if (targetUsers && Array.isArray(targetUsers)) {
      await prisma.notification.createMany({
        data: targetUsers.map((userId: string) => ({
          userId,
          type: type || "GENERAL",
          title,
          message,
          priority: priority || "NORMAL",
          data: data || null
        }))
      })

      return successResponse({
        message: `Notifications sent to ${targetUsers.length} users`,
        count: targetUsers.length
      })
    }

    return errorResponse("Invalid target users", 400)
  } catch (error) {
    console.error("Error creating notifications:", error)
    return errorResponse(error, 500)
  }
})

// PUT /api/notifications - Mark notifications as read
export const PUT = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: { isRead: true }
      })

      return successResponse({ message: "All notifications marked as read" })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: { isRead: true }
      })

      return successResponse({ 
        message: `${notificationIds.length} notifications marked as read`,
        count: notificationIds.length
      })
    }

    return errorResponse("Invalid request", 400)
  } catch (error) {
    console.error("Error updating notifications:", error)
    return errorResponse(error, 500)
  }
})
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from "@/lib/api-response"
import { z } from "zod"
import { notifySystemMaintenance, notifyAccountVerified, notifySecurityAlert } from "@/lib/notifications"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const sendNotificationSchema = z.object({
  type: z.enum(["SYSTEM", "SECURITY", "MARKETING"]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetUsers: z.enum(["ALL", "VERIFIED", "UNVERIFIED", "ADMINS"]).default("ALL"),
  expiresAt: z.string().datetime().optional()
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (profile?.role !== "ADMIN") {
      return forbiddenResponse("Admin access required")
    }

    const body = await request.json()
    const parsed = sendNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid notification data", parsed.error.errors)
    }

    const { type, title, message, priority, targetUsers, expiresAt } = parsed.data

    // Get target user IDs based on criteria
    let userIds: string[] = []
    
    switch (targetUsers) {
      case "ALL":
        const allUsers = await prisma.profile.findMany({
          select: { id: true }
        })
        userIds = allUsers.map(u => u.id)
        break
        
      case "VERIFIED":
        const verifiedUsers = await prisma.profile.findMany({
          where: { verified: true },
          select: { id: true }
        })
        userIds = verifiedUsers.map(u => u.id)
        break
        
      case "UNVERIFIED":
        const unverifiedUsers = await prisma.profile.findMany({
          where: { verified: false },
          select: { id: true }
        })
        userIds = unverifiedUsers.map(u => u.id)
        break
        
      case "ADMINS":
        const adminUsers = await prisma.profile.findMany({
          where: { role: "ADMIN" },
          select: { id: true }
        })
        userIds = adminUsers.map(u => u.id)
        break
    }

    if (userIds.length === 0) {
      return validationErrorResponse("No users found matching the target criteria")
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            priority,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
          }
        })
      )
    )

    return successResponse({
      message: `Notification sent to ${notifications.length} users`,
      notificationCount: notifications.length,
      targetUsers
    })

  } catch (error) {
    console.error("Error sending admin notification:", error)
    return errorResponse(error, 500)
  }
})

// GET - Get notification statistics
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (profile?.role !== "ADMIN") {
      return forbiddenResponse("Admin access required")
    }

    // Get notification statistics
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentNotifications
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        _count: { priority: true },
        orderBy: { _count: { priority: 'desc' } }
      }),
      prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      })
    ])

    return successResponse({
      statistics: {
        total: totalNotifications,
        unread: unreadNotifications,
        byType: notificationsByType,
        byPriority: notificationsByPriority
      },
      recentNotifications
    })

  } catch (error) {
    console.error("Error fetching notification statistics:", error)
    return errorResponse(error, 500)
  }
})
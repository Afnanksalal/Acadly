import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const settingsUpdateSchema = z.object({
  category: z.enum(["PLATFORM", "SECURITY", "PAYMENTS", "NOTIFICATIONS", "MODERATION", "FEATURES"]),
  settings: z.record(z.any())
})

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  allowedRoles: z.array(z.string()).optional()
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: "VIEW_ADMIN_SETTINGS",
    request
  })

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    // System settings would come from a settings table when implemented
    // For now, return empty settings structure
    const groupedSettings = {
      PLATFORM: {},
      SECURITY: {},
      PAYMENTS: {},
      NOTIFICATIONS: {},
      MODERATION: {},
      FEATURES: {}
    }

    // Get platform statistics for context
    const platformStats = await Promise.all([
      // Total users
      prisma.profile.count(),
      
      // Active listings
      prisma.listing.count({ where: { isActive: true } }),
      
      // Total transactions
      prisma.transaction.count(),
      
      // System uptime - would come from monitoring service
      Promise.resolve("N/A"),
      
      // Storage usage - would come from system monitoring
      Promise.resolve({
        used: "N/A",
        total: "N/A",
        percentage: 0
      })
    ])

    // Get recent admin activities from audit logs
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        action: { contains: "ADMIN" }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Get system health metrics
    const healthMetrics = await Promise.all([
      // Database connections from active sessions
      prisma.userSession.count({
        where: { isActive: true }
      }).then(count => [{ connections: count }]),
      
      // Error rate (last 24h) from audit logs
      prisma.auditLog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      
      // API response times - would come from monitoring service
      Promise.resolve({
        average: "N/A",
        p95: "N/A",
        p99: "N/A"
      })
    ])

    return successResponse({
      settings: groupedSettings,
      platformStats: {
        totalUsers: platformStats[0],
        activeListings: platformStats[1],
        totalTransactions: platformStats[2],
        uptime: platformStats[3],
        storage: platformStats[4]
      },
      recentActivities,
      health: {
        database: healthMetrics[0],
        errorRate: healthMetrics[1],
        performance: healthMetrics[2]
      }
    })
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return errorResponse(error, 500)
  }
})

// PUT /api/admin/settings/advanced - Update system settings
export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = settingsUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid settings data")
    }

    const { category, settings } = parsed.data
    const results = []
    const errors = []

    // Update each setting - would update actual settings table when implemented
    for (const [key, value] of Object.entries(settings)) {
      try {
        // TODO: Implement actual settings storage
        results.push({ key, success: true, value })

        // Log the setting change
        await logAdminAction({
          adminId: user.id,
          action: "SETTING_UPDATED",
          targetType: "SETTING",
          targetId: key,
          details: { category, key, newValue: value },
          request
        })
      } catch (error) {
        errors.push({ key, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return successResponse({
      results,
      errors,
      summary: {
        total: Object.keys(settings).length,
        successful: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error updating admin settings:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/admin/settings/advanced/maintenance - Maintenance mode
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = maintenanceSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid maintenance mode data")
    }

    const { enabled, message, scheduledStart, scheduledEnd, allowedRoles } = parsed.data

    // Update maintenance mode settings - would update actual settings when implemented
    const maintenanceConfig = {
      enabled,
      message: message || "System is under maintenance. Please try again later.",
      scheduledStart,
      scheduledEnd,
      allowedRoles: allowedRoles || ["ADMIN"],
      enabledBy: user.id,
      enabledAt: new Date()
    }

    // Log the maintenance mode change
    await logAdminAction({
      adminId: user.id,
      action: enabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
      details: { message, scheduledStart, scheduledEnd },
      request
    })

    // Send notification to all admins
    const admins = await prisma.profile.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })
    
    // Create notifications for all admins
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: "ADMIN",
        title: `Maintenance Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        message: enabled 
          ? `Maintenance mode has been enabled: ${message}`
          : "Maintenance mode has been disabled",
        priority: "HIGH"
      }))
    })

    return successResponse({
      maintenanceMode: {
        enabled,
        message,
        scheduledStart,
        scheduledEnd,
        allowedRoles,
        enabledBy: user.id,
        enabledAt: new Date()
      }
    })
  } catch (error) {
    console.error("Error updating maintenance mode:", error)
    return errorResponse(error, 500)
  }
})
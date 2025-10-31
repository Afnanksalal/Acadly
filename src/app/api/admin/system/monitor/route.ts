import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logAdminAction } from "@/lib/admin-logger"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: "VIEW_SYSTEM_MONITOR",
    request
  })

  try {
    const now = new Date()
    const last5min = new Date(now.getTime() - 5 * 60 * 1000)
    const last1hour = new Date(now.getTime() - 60 * 60 * 1000)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Real application metrics only - no fake database performance data
    const appMetrics = await Promise.all([
      // Active user sessions
      prisma.userSession.count({
        where: { isActive: true }
      }),

      // Recent activity
      prisma.auditLog.count({
        where: {
          createdAt: { gte: last24h }
        }
      }),

      // Error count from audit logs
      prisma.auditLog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: last24h }
        }
      })
    ])

    // API performance metrics from audit logs
    const apiMetrics = await Promise.all([
      // Recent API errors from audit logs
      prisma.auditLog.findMany({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: last24h }
        },
        select: {
          action: true,
          resource: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      
      // Request volume by resource type
      prisma.auditLog.groupBy({
        by: ["resource"],
        _count: true,
        where: {
          createdAt: { gte: last24h }
        }
      }).then(results => results.sort((a, b) => b._count - a._count))
    ])

    // User session analytics
    const sessionMetrics = await Promise.all([
      // Active sessions by device type
      prisma.userSession.findMany({
        where: {
          isActive: true,
          device: { not: {} as any }
        },
        select: { device: true }
      }).then(sessions => {
        const deviceMap = new Map()
        sessions.forEach(session => {
          if (session.device && typeof session.device === 'object') {
            const device = session.device as any
            const deviceType = device.type || 'unknown'
            deviceMap.set(deviceType, (deviceMap.get(deviceType) || 0) + 1)
          }
        })
        return Array.from(deviceMap.entries()).map(([device_type, session_count]) => ({
          device_type,
          session_count
        })).sort((a, b) => b.session_count - a.session_count)
      }),

      // Session duration distribution
      prisma.userSession.findMany({
        where: { createdAt: { gte: last24h } },
        select: { createdAt: true, lastActivity: true }
      }).then(sessions => {
        const durationMap = new Map()
        sessions.forEach(session => {
          const duration = (session.lastActivity.getTime() - session.createdAt.getTime()) / 1000
          let bucket: string
          if (duration < 300) bucket = '0-5min'
          else if (duration < 1800) bucket = '5-30min'
          else if (duration < 3600) bucket = '30-60min'
          else bucket = '60min+'

          durationMap.set(bucket, (durationMap.get(bucket) || 0) + 1)
        })
        return Array.from(durationMap.entries()).map(([duration_bucket, session_count]) => ({
          duration_bucket,
          session_count
        })).sort((a, b) => b.session_count - a.session_count)
      }),

      // Geographic distribution of active sessions
      prisma.userSession.findMany({
        where: {
          isActive: true,
          location: { not: {} as any }
        },
        select: { location: true }
      }).then(sessions => {
        const countryMap = new Map()
        sessions.forEach(session => {
          if (session.location && typeof session.location === 'object') {
            const location = session.location as any
            const country = location.country || 'Unknown'
            countryMap.set(country, (countryMap.get(country) || 0) + 1)
          }
        })
        return Array.from(countryMap.entries()).map(([country, active_sessions]) => ({
          country,
          active_sessions
        })).sort((a, b) => b.active_sessions - a.active_sessions).slice(0, 10)
      })
    ])

    // Remove system resource metrics - these require external monitoring tools

    // Error tracking from audit logs
    const errorMetrics = await Promise.all([
      // Error rate by type
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: last24h }
        }
      }),
      
      // Recent critical errors
      prisma.auditLog.findMany({
        where: {
          action: { contains: "CRITICAL" },
          createdAt: { gte: last24h }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ])

    // Security metrics from audit logs
    const securityMetrics = await Promise.all([
      // Failed login attempts
      prisma.auditLog.count({
        where: {
          action: "LOGIN_FAILED",
          createdAt: { gte: last24h }
        }
      }),
      
      // Suspicious activities
      prisma.auditLog.findMany({
        where: {
          action: { in: ["SUSPICIOUS_ACTIVITY", "SECURITY_VIOLATION"] },
          createdAt: { gte: last24h }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      
      // IP-based activity
      prisma.auditLog.groupBy({
        by: ["ipAddress"],
        _count: true,
        where: {
          createdAt: { gte: last24h },
          ipAddress: { not: null }
        }
      }).then(results => results.sort((a, b) => b._count - a._count).slice(0, 10))
    ])

    const monitoring = {
      timestamp: now,
      application: {
        activeSessions: appMetrics[0],
        recentActivity: appMetrics[1],
        errorCount: appMetrics[2]
      },
      api: {
        errors: apiMetrics[0],
        requestVolume: apiMetrics[1]
      },
      sessions: {
        byDevice: sessionMetrics[0],
        durationDistribution: sessionMetrics[1],
        geographic: sessionMetrics[2]
      },
      errors: {
        byType: errorMetrics[0],
        critical: errorMetrics[1]
      },
      security: {
        failedLogins: securityMetrics[0],
        suspiciousActivities: securityMetrics[1],
        topIPs: securityMetrics[2]
      }
    }

    return successResponse(monitoring)
  } catch (error) {
    console.error("Error fetching system monitoring data:", error)
    return errorResponse(error, 500)
  }
})
import { NextRequest } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { monitor } from "@/lib/monitoring"
import { getErrorStats } from "@/lib/error-handler"

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get("timeWindow") || "3600000") // Default 1 hour

    // Get performance metrics
    const performanceMetrics = monitor.getPerformanceSummary(timeWindow)
    const businessMetrics = monitor.getMetricsSummary()
    const errorStats = getErrorStats()

    // Database health metrics
    const dbStart = Date.now()
    const [
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalTransactions,
      recentTransactions,
      pendingDisputes,
      unreadNotifications
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.listing.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - timeWindow)
          }
        }
      }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.notification.count({ where: { isRead: false } })
    ])
    const dbResponseTime = Date.now() - dbStart

    // System health indicators
    const systemHealth = {
      database: {
        responseTime: dbResponseTime,
        status: dbResponseTime < 500 ? "healthy" : dbResponseTime < 2000 ? "slow" : "critical"
      },
      api: {
        ...performanceMetrics,
        status: performanceMetrics.successRate > 95 ? "healthy" : 
                performanceMetrics.successRate > 90 ? "degraded" : "critical"
      },
      errors: {
        ...errorStats,
        status: errorStats.totalErrors < 10 ? "healthy" : 
                errorStats.totalErrors < 50 ? "warning" : "critical"
      }
    }

    // Business metrics
    const businessHealth = {
      users: {
        total: totalUsers,
        active: activeUsers,
        activityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      listings: {
        total: totalListings,
        active: activeListings,
        activeRate: totalListings > 0 ? Math.round((activeListings / totalListings) * 100) : 0
      },
      transactions: {
        total: totalTransactions,
        recent: recentTransactions,
        recentRate: Math.round((recentTransactions / Math.max(1, timeWindow / (24 * 60 * 60 * 1000))) * 100) / 100
      },
      support: {
        pendingDisputes,
        unreadNotifications,
        disputeRate: totalTransactions > 0 ? Math.round((pendingDisputes / totalTransactions) * 10000) / 100 : 0
      }
    }

    // Overall system status
    const criticalIssues = [
      systemHealth.database.status === "critical",
      systemHealth.api.status === "critical", 
      systemHealth.errors.status === "critical"
    ].filter(Boolean).length

    const overallStatus = criticalIssues > 0 ? "critical" :
                         Object.values(systemHealth).some(s => s.status === "degraded" || s.status === "warning") ? "degraded" :
                         "healthy"

    const monitoringData = {
      timestamp: new Date().toISOString(),
      timeWindow,
      overallStatus,
      systemHealth,
      businessHealth,
      businessMetrics,
      alerts: generateAlerts(systemHealth, businessHealth),
      recommendations: generateRecommendations(systemHealth, businessHealth)
    }

    return successResponse(monitoringData)
  } catch (error) {
    console.error("Error fetching system monitoring data:", error)
    return errorResponse(error, 500)
  }
})

function generateAlerts(systemHealth: any, businessHealth: any): string[] {
  const alerts: string[] = []

  if (systemHealth.database.status === "critical") {
    alerts.push("🔴 Database response time is critically slow")
  }
  
  if (systemHealth.api.successRate < 90) {
    alerts.push("🔴 API success rate is below 90%")
  }
  
  if (systemHealth.errors.totalErrors > 50) {
    alerts.push("🔴 High error rate detected")
  }
  
  if (businessHealth.support.pendingDisputes > 10) {
    alerts.push("⚠️ High number of pending disputes")
  }
  
  if (businessHealth.users.activityRate < 10) {
    alerts.push("⚠️ Low user activity rate")
  }

  return alerts
}

function generateRecommendations(systemHealth: any, businessHealth: any): string[] {
  const recommendations: string[] = []

  if (systemHealth.database.responseTime > 1000) {
    recommendations.push("Consider optimizing database queries or upgrading database resources")
  }
  
  if (systemHealth.api.averageResponseTime > 2000) {
    recommendations.push("API response times are slow - consider caching or performance optimization")
  }
  
  if (businessHealth.listings.activeRate < 50) {
    recommendations.push("Low active listing rate - consider user engagement campaigns")
  }
  
  if (businessHealth.support.disputeRate > 5) {
    recommendations.push("High dispute rate - review transaction and user verification processes")
  }

  return recommendations
}
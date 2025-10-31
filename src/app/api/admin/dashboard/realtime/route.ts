import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: ADMIN_ACTIONS.VIEW_DASHBOARD,
    request
  })

  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Real-time system health
    const systemHealth = await Promise.all([
      // Active users (last 15 minutes)
      prisma.userSession.count({
        where: {
          isActive: true,
          lastActivity: {
            gte: new Date(now.getTime() - 15 * 60 * 1000)
          }
        }
      }),
      
      // Pending transactions
      prisma.transaction.count({
        where: {
          status: "INITIATED",
          createdAt: {
            gte: new Date(now.getTime() - 30 * 60 * 1000) // Last 30 minutes
          }
        }
      }),
      
      // Open disputes
      prisma.dispute.count({
        where: {
          status: { in: ["OPEN", "IN_REVIEW"] }
        }
      }),
      
      // Unread reports
      prisma.report.count({
        where: {
          status: "PENDING"
        }
      }),
      
      // System errors (last hour) - get from audit logs
      prisma.auditLog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: {
            gte: new Date(now.getTime() - 60 * 60 * 1000)
          }
        }
      })
    ])

    // Critical alerts
    const criticalAlerts = await Promise.all([
      // High priority disputes
      prisma.dispute.findMany({
        where: {
          status: "OPEN",
          priority: { in: ["HIGH", "URGENT"] }
        },
        include: {
          transaction: {
            include: {
              listing: {
                select: { title: true }
              }
            }
          }
        },
        take: 5,
        orderBy: { createdAt: "desc" }
      }),
      
      // Critical reports
      prisma.report.findMany({
        where: {
          status: "PENDING",
          priority: { in: ["HIGH", "CRITICAL"] }
        },
        include: {
          reporter: {
            select: { name: true, email: true }
          }
        },
        take: 5,
        orderBy: { createdAt: "desc" }
      }),
      
      // Failed transactions (last hour)
      prisma.transaction.findMany({
        where: {
          status: "CANCELLED",
          createdAt: {
            gte: new Date(now.getTime() - 60 * 60 * 1000)
          }
        },
        include: {
          listing: {
            select: { title: true }
          },
          buyer: {
            select: { email: true, name: true }
          }
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      })
    ])

    // Performance metrics
    const performanceMetrics = await Promise.all([
      // Revenue trends (last 24h by hour)
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: last24h }
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }).then(transactions => {
        const hourMap = new Map()
        transactions.forEach(transaction => {
          const hour = new Date(transaction.createdAt)
          hour.setMinutes(0, 0, 0)
          const hourKey = hour.toISOString()
          const existing = hourMap.get(hourKey) || { revenue: 0, transactions: 0 }
          existing.revenue += Number(transaction.amount)
          existing.transactions += 1
          hourMap.set(hourKey, existing)
        })
        return Array.from(hourMap.entries()).map(([hour, data]) => ({ hour, ...data }))
      }),
      
      // User activity trends
      prisma.userSession.findMany({
        where: { lastActivity: { gte: last24h } },
        select: { userId: true, lastActivity: true },
        orderBy: { lastActivity: 'asc' }
      }).then(sessions => {
        const hourMap = new Map()
        sessions.forEach(session => {
          const hour = new Date(session.lastActivity)
          hour.setMinutes(0, 0, 0)
          const hourKey = hour.toISOString()
          const existing = hourMap.get(hourKey) || new Set()
          existing.add(session.userId)
          hourMap.set(hourKey, existing)
        })
        return Array.from(hourMap.entries()).map(([hour, userSet]) => ({
          hour,
          active_users: userSet.size
        }))
      }),
      
      // Top performing listings
      prisma.listing.findMany({
        select: {
          id: true,
          title: true,
          price: true,
          _count: {
            select: {
              transactions: {
                where: {
                  status: "PAID",
                  createdAt: { gte: last7d }
                }
              },
              chats: {
                where: {
                  createdAt: { gte: last7d }
                }
              }
            }
          }
        },
        where: {
          createdAt: { gte: last30d }
        },
        orderBy: {
          transactions: {
            _count: "desc"
          }
        },
        take: 10
      })
    ])

    // User engagement metrics
    const engagementMetrics = await Promise.all([
      // New user registrations (last 24h)
      prisma.profile.count({
        where: {
          createdAt: { gte: last24h }
        }
      }),
      
      // Messages sent (last 24h)
      prisma.message.count({
        where: {
          createdAt: { gte: last24h }
        }
      }),
      
      // Listings created (last 24h)
      prisma.listing.count({
        where: {
          createdAt: { gte: last24h }
        }
      }),
      
      // Reviews submitted (last 24h)
      prisma.review.count({
        where: {
          createdAt: { gte: last24h }
        }
      })
    ])

    // Geographic distribution
    const geographicData = await prisma.userSession.findMany({
      where: {
        location: { not: {} as any },
        createdAt: { gte: last7d }
      },
      select: { location: true }
    }).then(sessions => {
      const locationMap = new Map()
      sessions.forEach(session => {
        if (session.location && typeof session.location === 'object') {
          const location = session.location as any
          const key = `${location.country || 'Unknown'}-${location.city || 'Unknown'}`
          locationMap.set(key, (locationMap.get(key) || 0) + 1)
        }
      })
      return Array.from(locationMap.entries())
        .map(([key, user_count]) => {
          const [country, city] = key.split('-')
          return { country, city, user_count }
        })
        .sort((a, b) => b.user_count - a.user_count)
        .slice(0, 20)
    })

    // Platform statistics
    const platformStats = await Promise.all([
      prisma.profile.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.transaction.count({ where: { status: "PAID" } }),
      prisma.review.count(),
      prisma.dispute.count(),
      prisma.event.count({ where: { isActive: true } })
    ])

    const dashboard = {
      timestamp: now,
      systemHealth: {
        activeUsers: systemHealth[0],
        pendingTransactions: systemHealth[1],
        openDisputes: systemHealth[2],
        unreadReports: systemHealth[3],
        systemErrors: systemHealth[4],
        status: systemHealth[4] > 10 ? "warning" : systemHealth[2] > 20 ? "caution" : "healthy"
      },
      criticalAlerts: {
        disputes: criticalAlerts[0],
        reports: criticalAlerts[1],
        failedTransactions: criticalAlerts[2]
      },
      performance: {
        revenueByHour: performanceMetrics[0],
        activeUsersByHour: performanceMetrics[1],
        topListings: performanceMetrics[2]
      },
      engagement: {
        newUsers24h: engagementMetrics[0],
        messages24h: engagementMetrics[1],
        listings24h: engagementMetrics[2],
        reviews24h: engagementMetrics[3]
      },
      geographic: geographicData,
      platformStats: {
        totalUsers: platformStats[0],
        activeListings: platformStats[1],
        completedTransactions: platformStats[2],
        totalReviews: platformStats[3],
        totalDisputes: platformStats[4],
        activeEvents: platformStats[5]
      }
    }

    return successResponse(dashboard)
  } catch (error) {
    console.error("Error fetching realtime dashboard:", error)
    return errorResponse(error, 500)
  }
})
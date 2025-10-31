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

    // Key Performance Indicators
    const kpis = await Promise.all([
      // Revenue (last 30 days)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "PAID",
          createdAt: { gte: last30d }
        }
      }),
      
      // Active users (last 24h)
      prisma.userSession.findMany({
        where: {
          lastActivity: { gte: last24h }
        },
        select: { userId: true },
        distinct: ['userId']
      }).then(sessions => sessions.length),
      
      // New registrations (last 7 days)
      prisma.profile.count({
        where: {
          createdAt: { gte: last7d }
        }
      }),
      
      // Active listings
      prisma.listing.count({
        where: { isActive: true }
      })
    ])

    // Critical alerts and issues
    const alerts = await Promise.all([
      // Open disputes
      prisma.dispute.count({
        where: {
          status: { in: ["OPEN", "IN_REVIEW"] }
        }
      }),
      
      // Pending reports
      prisma.report.count({
        where: { status: "PENDING" }
      }),
      
      // Cancelled transactions (last 24h)
      prisma.transaction.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: last24h }
        }
      }),
      
      // System errors (last 24h)
      prisma.auditLog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: last24h }
        }
      })
    ])

    // Growth trends
    const trends = await Promise.all([
      // User growth (last 30 days by day)
      prisma.profile.findMany({
        where: { createdAt: { gte: last30d } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }).then(profiles => {
        const dayMap = new Map()
        profiles.forEach(profile => {
          const day = profile.createdAt.toISOString().split('T')[0]
          dayMap.set(day, (dayMap.get(day) || 0) + 1)
        })
        return Array.from(dayMap.entries()).map(([date, new_users]) => ({ date, new_users }))
      }),
      
      // Revenue trend (last 30 days by day)
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: last30d }
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }).then(transactions => {
        const dayMap = new Map()
        transactions.forEach(transaction => {
          const day = transaction.createdAt.toISOString().split('T')[0]
          const existing = dayMap.get(day) || { revenue: 0, transactions: 0 }
          existing.revenue += Number(transaction.amount)
          existing.transactions += 1
          dayMap.set(day, existing)
        })
        return Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }))
      }),
      
      // Listing activity (last 30 days by day)
      prisma.listing.findMany({
        where: { createdAt: { gte: last30d } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }).then(listings => {
        const dayMap = new Map()
        listings.forEach(listing => {
          const day = listing.createdAt.toISOString().split('T')[0]
          dayMap.set(day, (dayMap.get(day) || 0) + 1)
        })
        return Array.from(dayMap.entries()).map(([date, new_listings]) => ({ date, new_listings }))
      })
    ])

    // Top performers
    const topPerformers = await Promise.all([
      // Top selling categories
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: last30d }
        },
        include: {
          listing: {
            include: { category: true }
          }
        }
      }).then(transactions => {
        const categoryMap = new Map()
        transactions.forEach(transaction => {
          const categoryName = transaction.listing.category.name
          const existing = categoryMap.get(categoryName) || { sales: 0, revenue: 0 }
          existing.sales += 1
          existing.revenue += Number(transaction.amount)
          categoryMap.set(categoryName, existing)
        })
        return Array.from(categoryMap.entries())
          .map(([category, data]) => ({ category, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      }),
      
      // Top sellers
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: last30d }
        },
        include: {
          listing: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      }).then(transactions => {
        const sellerMap = new Map()
        transactions.forEach(transaction => {
          const seller = transaction.listing.user
          const existing = sellerMap.get(seller.id) || {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            sales: 0,
            revenue: 0
          }
          existing.sales += 1
          existing.revenue += Number(transaction.amount)
          sellerMap.set(seller.id, existing)
        })
        return Array.from(sellerMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      }),
      
      // Most active users
      prisma.userSession.findMany({
        where: { createdAt: { gte: last7d } },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }).then(sessions => {
        const userMap = new Map()
        sessions.forEach(session => {
          const user = session.user
          const existing = userMap.get(user.id) || {
            id: user.id,
            name: user.name,
            email: user.email,
            sessions: 0,
            last_seen: session.lastActivity
          }
          existing.sessions += 1
          if (session.lastActivity > existing.last_seen) {
            existing.last_seen = session.lastActivity
          }
          userMap.set(user.id, existing)
        })
        return Array.from(userMap.values())
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5)
      })
    ])

    // System health overview
    const systemHealth = await Promise.all([
      // Database performance from active sessions
      prisma.userSession.count({
        where: { isActive: true }
      }).then(count => [{ active_connections: count }]),
      
      // Recent API errors from audit logs
      prisma.auditLog.count({
        where: {
          action: { contains: "ERROR" },
          createdAt: { gte: last24h }
        }
      })
    ])

    // Recent activities
    const recentActivities = await Promise.all([
      // Recent admin actions from audit logs
      prisma.auditLog.findMany({
        where: {
          action: { contains: "ADMIN" },
          createdAt: { gte: last24h }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      
      // Recent user registrations
      prisma.profile.findMany({
        where: {
          createdAt: { gte: last24h }
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          verified: true
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      
      // Recent high-value transactions
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          amount: { gte: 1000 }, // High value threshold
          createdAt: { gte: last7d }
        },
        include: {
          listing: {
            select: { title: true, category: true }
          },
          buyer: {
            select: { name: true, email: true }
          }
        },
        orderBy: { amount: "desc" },
        take: 5
      })
    ])

    // Calculate health score
    const totalAlerts = alerts.reduce((sum: number, count: number) => sum + count, 0)
    const errorRate = systemHealth[1]
    const healthScore = Math.max(0, 100 - (totalAlerts * 5) - (errorRate * 2))

    const dashboardSummary = {
      timestamp: now,
      kpis: {
        revenue30d: {
          total: kpis[0]._sum.amount || 0,
          transactions: kpis[0]._count,
          average: kpis[0]._count > 0 ? Number(kpis[0]._sum.amount || 0) / kpis[0]._count : 0
        },
        activeUsers24h: kpis[1],
        newUsers7d: kpis[2],
        activeListings: kpis[3]
      },
      alerts: {
        total: totalAlerts,
        openDisputes: alerts[0],
        pendingReports: alerts[1],
        failedTransactions24h: alerts[2],
        systemErrors24h: alerts[3],
        severity: totalAlerts > 20 ? "HIGH" : totalAlerts > 10 ? "MEDIUM" : "LOW"
      },
      trends: {
        userGrowth: trends[0],
        revenueGrowth: trends[1],
        listingActivity: trends[2]
      },
      topPerformers: {
        categories: topPerformers[0],
        sellers: topPerformers[1],
        activeUsers: topPerformers[2]
      },
      systemHealth: {
        score: healthScore,
        status: healthScore > 90 ? "EXCELLENT" : healthScore > 70 ? "GOOD" : healthScore > 50 ? "FAIR" : "POOR",
        dbConnections: systemHealth[0],
        recentErrors: systemHealth[1]
      },
      recentActivities: {
        adminActions: recentActivities[0],
        newUsers: recentActivities[1],
        highValueTransactions: recentActivities[2]
      },
      quickActions: [
        {
          title: "View Pending Reports",
          description: `${alerts[1]} reports need review`,
          url: "/admin/reports",
          priority: alerts[1] > 5 ? "HIGH" : "NORMAL"
        },
        {
          title: "Review Open Disputes",
          description: `${alerts[0]} disputes require attention`,
          url: "/admin/disputes",
          priority: alerts[0] > 3 ? "HIGH" : "NORMAL"
        },
        {
          title: "System Monitoring",
          description: "Check system performance",
          url: "/admin/system/monitor",
          priority: "NORMAL"
        },
        {
          title: "User Management",
          description: "Manage user accounts",
          url: "/admin/users",
          priority: "NORMAL"
        }
      ]
    }

    return successResponse(dashboardSummary)
  } catch (error) {
    console.error("Error fetching dashboard summary:", error)
    return errorResponse(error, 500)
  }
})
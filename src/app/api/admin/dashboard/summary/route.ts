import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get basic overview data using proper Prisma queries
    const [
      totalUsers,
      totalListings,
      totalTransactions,
      newUsers7d,
      activeListings,
      openDisputes,
      pendingReports,
      cancelledTransactions24h,
      recentTransactions,
      recentListings,
      recentMessages
    ] = await Promise.all([
      // Basic counts
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      
      // New users in last 7 days
      prisma.profile.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      
      // Active listings
      prisma.listing.count({
        where: { isActive: true }
      }),
      
      // Open disputes
      prisma.dispute.count({
        where: { status: { in: ["OPEN", "IN_REVIEW"] } }
      }),
      
      // Pending reports
      prisma.report.count({
        where: { status: "PENDING" }
      }),
      
      // Cancelled transactions in last 24 hours
      prisma.transaction.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: twentyFourHoursAgo }
        }
      }),

      // Get recent activity for active users calculation
      prisma.transaction.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        select: { buyerId: true, sellerId: true }
      }),

      prisma.listing.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        select: { userId: true }
      }),

      prisma.message.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        select: { senderId: true }
      })
    ])

    // Calculate active users from recent activity
    const activeUserIds = new Set<string>()
    recentTransactions.forEach(t => {
      if (t.buyerId) activeUserIds.add(t.buyerId)
      if (t.sellerId) activeUserIds.add(t.sellerId)
    })
    recentListings.forEach(l => activeUserIds.add(l.userId))
    recentMessages.forEach(m => activeUserIds.add(m.senderId))
    
    const activeUsersCount = activeUserIds.size

    // Get additional data for comprehensive dashboard
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const [
      revenueTransactions,
      topCategories,
      topSellers,
      recentUsers
    ] = await Promise.all([
      // Revenue data for last 30 days
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          amount: true,
          createdAt: true
        }
      }),

      // Top categories by listing count
      prisma.listing.groupBy({
        by: ['categoryId'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: {
          categoryId: true
        },
        orderBy: {
          _count: {
            categoryId: 'desc'
          }
        },
        take: 5
      }),

      // Top sellers by transaction count
      prisma.transaction.groupBy({
        by: ['sellerId'],
        where: {
          status: "PAID",
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: {
          sellerId: true
        },
        _sum: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      }),

      // Most active users
      prisma.profile.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      })
    ])

    // Calculate revenue metrics
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const averageTransaction = revenueTransactions.length > 0 ? totalRevenue / revenueTransactions.length : 0

    // Generate actual trend data from database
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const [dayUsers, dayRevenue, dayListings] = await Promise.all([
        prisma.profile.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } }
        }),
        prisma.transaction.findMany({
          where: {
            status: "PAID",
            createdAt: { gte: dayStart, lt: dayEnd }
          },
          select: { amount: true }
        }),
        prisma.listing.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } }
        })
      ])
      
      const dayRevenueTotal = dayRevenue.reduce((sum, t) => sum + Number(t.amount), 0)
      
      trendData.push({
        date: dayStart.toISOString().split('T')[0],
        new_users: dayUsers,
        revenue: dayRevenueTotal,
        transactions: dayRevenue.length,
        new_listings: dayListings
      })
    }

    // Calculate system health score
    const systemHealthScore = Math.min(100, Math.max(0, 
      100 - (openDisputes * 5) - (pendingReports * 3) - (cancelledTransactions24h * 2)
    ))

    // Comprehensive dashboard data
    const dashboardData = {
      kpis: {
        revenue30d: {
          total: totalRevenue,
          transactions: revenueTransactions.length,
          average: averageTransaction
        },
        activeUsers24h: activeUsersCount,
        newUsers7d: newUsers7d,
        activeListings: activeListings
      },
      alerts: {
        total: openDisputes + pendingReports + cancelledTransactions24h,
        openDisputes,
        pendingReports,
        cancelledTransactions24h,
        systemErrors24h: 0,
        severity: (openDisputes > 10 ? 'HIGH' : openDisputes > 5 ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH'
      },
      trends: {
        userGrowth: trendData.map(d => ({ date: d.date, new_users: d.new_users })),
        revenueGrowth: trendData.map(d => ({ date: d.date, revenue: d.revenue, transactions: d.transactions })),
        listingActivity: trendData.map(d => ({ date: d.date, new_listings: d.new_listings }))
      },
      topPerformers: {
        categories: await Promise.all(topCategories.map(async (c) => {
          const category = await prisma.category.findUnique({
            where: { id: c.categoryId },
            select: { name: true }
          })
          const categoryRevenue = await prisma.transaction.aggregate({
            where: {
              status: "PAID",
              listing: { categoryId: c.categoryId },
              createdAt: { gte: thirtyDaysAgo }
            },
            _sum: { amount: true }
          })
          return {
            category: category?.name || 'Unknown',
            sales: c._count.categoryId,
            revenue: Number(categoryRevenue._sum.amount || 0)
          }
        })),
        sellers: await Promise.all(topSellers.map(async (s) => {
          const seller = await prisma.profile.findUnique({
            where: { id: s.sellerId },
            select: { name: true, email: true }
          })
          return {
            id: s.sellerId,
            name: seller?.name || 'Unknown',
            email: seller?.email || 'unknown@example.com',
            sales: s._count.sellerId,
            revenue: Number(s._sum.amount || 0)
          }
        })),
        activeUsers: await Promise.all(recentUsers.map(async (u) => {
          const sessionCount = await prisma.userSession.count({
            where: {
              userId: u.id,
              createdAt: { gte: sevenDaysAgo }
            }
          })
          const lastSession = await prisma.userSession.findFirst({
            where: { userId: u.id },
            orderBy: { lastActivity: 'desc' },
            select: { lastActivity: true }
          })
          return {
            id: u.id,
            name: u.name || 'Unknown',
            email: u.email,
            sessions: sessionCount,
            last_seen: lastSession?.lastActivity || u.createdAt
          }
        }))
      },
      systemHealth: {
        score: systemHealthScore,
        status: systemHealthScore >= 90 ? 'Excellent' : 
                systemHealthScore >= 70 ? 'Good' : 
                systemHealthScore >= 50 ? 'Fair' : 'Poor'
      },
      quickActions: [
        {
          title: 'Review Disputes',
          description: `${openDisputes} open disputes need attention`,
          url: '/dashboard?tab=content',
          priority: openDisputes > 5 ? 'HIGH' : 'NORMAL'
        },
        {
          title: 'Verify Users',
          description: 'Review pending user verifications',
          url: '/dashboard?tab=users',
          priority: 'NORMAL'
        },
        {
          title: 'View Analytics',
          description: 'Check user engagement and growth trends',
          url: '/dashboard?tab=analytics',
          priority: 'LOW'
        },
        {
          title: 'Financial Reports',
          description: 'Review revenue and transaction data',
          url: '/dashboard?tab=financial',
          priority: 'LOW'
        }
      ]
    }

    return successResponse(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard summary:", error)
    return errorResponse(error, 500)
  }
})
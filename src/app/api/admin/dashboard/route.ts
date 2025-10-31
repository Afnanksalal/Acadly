import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin dashboard access
  await logAdminAction({
    adminId: user.id,
    action: ADMIN_ACTIONS.VIEW_DASHBOARD,
    request
  })
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30" // days
    const days = parseInt(timeframe)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get comprehensive dashboard data
    const [
      // Basic counts
      totalUsers,
      totalListings,
      totalTransactions,
      totalDisputes,
      totalEvents,
      
      // Active counts
      activeListings,
      verifiedUsers,
      pendingDisputes,
      
      // Recent activity
      recentUsers,
      recentListings,
      recentTransactions,
      recentDisputes,
      
      // Revenue data
      totalRevenue,
      recentRevenue,
      
      // User statistics
      usersByDepartment,
      usersByYear,
      
      // Transaction statistics
      transactionsByStatus,
      
      // Top performers
      topSellers,
      topBuyers,
      
      // Category performance
      categoryStats,
      
      // Recent admin actions
      recentAdminActions,
      
      // System health
      systemStats,
    ] = await Promise.all([
      // Basic counts
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      prisma.dispute.count(),
      prisma.event.count(),
      
      // Active counts
      prisma.listing.count({ where: { isActive: true } }),
      prisma.profile.count({ where: { verified: true } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
      
      // Recent activity
      prisma.profile.count({ where: { createdAt: { gte: startDate } } }),
      prisma.listing.count({ where: { createdAt: { gte: startDate } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startDate } } }),
      prisma.dispute.count({ where: { createdAt: { gte: startDate } } }),
      
      // Revenue data
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { 
          status: "PAID",
          createdAt: { gte: startDate },
        },
      }),
      
      // User statistics
      prisma.profile.groupBy({
        by: ["department"],
        _count: true,
        where: { department: { not: null } },
        orderBy: { _count: { department: "desc" } },
        take: 10,
      }),
      prisma.profile.groupBy({
        by: ["year"],
        _count: true,
        where: { year: { not: null } },
        orderBy: { _count: { year: "desc" } },
        take: 10,
      }),
      
      // Transaction statistics
      prisma.transaction.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      
      // Top performers
      prisma.profile.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
          ratingAvg: true,
          ratingCount: true,
          _count: {
            select: {
              sales: { where: { status: "PAID" } },
            },
          },
        },
        orderBy: {
          sales: { _count: "desc" },
        },
        take: 10,
      }),
      prisma.profile.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
          _count: {
            select: {
              purchases: { where: { status: "PAID" } },
            },
          },
        },
        orderBy: {
          purchases: { _count: "desc" },
        },
        take: 10,
      }),
      
      // Category performance
      prisma.listing.groupBy({
        by: ["categoryId"],
        _count: true,
        where: { isActive: true },
        orderBy: { _count: { categoryId: "desc" } },
        take: 10,
      }),
      
      // Recent admin actions
      prisma.adminAction.findMany({
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
          dispute: {
            select: {
              id: true,
              subject: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      
      // System health metrics - using individual queries for better type safety
      Promise.all([
        prisma.transaction.aggregate({
          _count: true,
          _max: { createdAt: true },
        }).then(result => ({
          table_name: "transactions",
          count: result._count,
          last_activity: result._max.createdAt,
        })),
        prisma.listing.aggregate({
          _count: true,
          _max: { createdAt: true },
        }).then(result => ({
          table_name: "listings", 
          count: result._count,
          last_activity: result._max.createdAt,
        })),
        prisma.profile.aggregate({
          _count: true,
          _max: { createdAt: true },
        }).then(result => ({
          table_name: "profiles",
          count: result._count,
          last_activity: result._max.createdAt,
        })),
      ]),
    ])

    // Get category names for category stats
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryStats.map(c => c.categoryId) },
      },
      select: { id: true, name: true },
    })

    const categoryStatsWithNames = categoryStats.map(stat => ({
      ...stat,
      categoryName: categories.find(c => c.id === stat.categoryId)?.name || "Unknown",
    }))

    // Calculate growth rates
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2))
    previousPeriodStart.setDate(previousPeriodStart.getDate() + days)

    const [
      previousUsers,
      previousListings,
      previousTransactions,
    ] = await Promise.all([
      prisma.profile.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const dashboard = {
      overview: {
        totalUsers,
        totalListings,
        totalTransactions,
        totalDisputes,
        totalEvents,
        activeListings,
        verifiedUsers,
        pendingDisputes,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      },
      
      recentActivity: {
        timeframe: `${days} days`,
        users: recentUsers,
        listings: recentListings,
        transactions: recentTransactions,
        disputes: recentDisputes,
        growth: {
          users: calculateGrowth(recentUsers, previousUsers),
          listings: calculateGrowth(recentListings, previousListings),
          transactions: calculateGrowth(recentTransactions, previousTransactions),
        },
      },
      
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        recent: Number(recentRevenue._sum.amount || 0),
        timeframe: `${days} days`,
      },
      
      users: {
        byDepartment: usersByDepartment.map(item => ({
          department: item.department,
          count: item._count,
        })),
        byYear: usersByYear.map(item => ({
          year: item.year,
          count: item._count,
        })),
      },
      
      transactions: {
        byStatus: transactionsByStatus.map(item => ({
          status: item.status,
          count: item._count,
          totalAmount: Number(item._sum.amount || 0),
        })),
      },
      
      topPerformers: {
        sellers: topSellers.map(seller => ({
          ...seller,
          salesCount: seller._count.sales,
        })),
        buyers: topBuyers.map(buyer => ({
          ...buyer,
          purchaseCount: buyer._count.purchases,
        })),
      },
      
      categories: categoryStatsWithNames
        .sort((a, b) => b._count - a._count)
        .slice(0, 10),
      
      recentActions: recentAdminActions.slice(0, 10),
      
      systemHealth: {
        tables: systemStats.map(stat => ({
          name: stat.table_name,
          count: stat.count,
          lastActivity: stat.last_activity,
        })),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    }

    return successResponse(dashboard)
  } catch (error) {
    console.error("Error fetching admin dashboard:", error)
    return errorResponse(error, 500)
  }
})
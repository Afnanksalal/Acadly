import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin access for security audit
  console.log(`Admin analytics accessed by user: ${user.id} (${user.email})`)
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get overall statistics
    const [
      totalUsers,
      totalListings,
      totalTransactions,
      totalDisputes,
      activeListings,
      verifiedUsers,
      recentUsers,
      recentListings,
      recentTransactions,
      transactionStats,
      disputeStats,
      categoryStats,
      revenueStats,
    ] = await Promise.all([
      // Total counts
      prisma.profile.count(),
      prisma.listing.count(),
      prisma.transaction.count(),
      prisma.dispute.count(),
      
      // Active counts
      prisma.listing.count({ where: { isActive: true } }),
      prisma.profile.count({ where: { verified: true } }),
      
      // Recent activity (last N days)
      prisma.profile.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.listing.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.transaction.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // Transaction statistics
      prisma.transaction.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      
      // Dispute statistics
      prisma.dispute.groupBy({
        by: ["status", "reason"],
        _count: true,
      }),
      
      // Category statistics
      prisma.listing.groupBy({
        by: ["categoryId"],
        _count: true,
        where: { isActive: true },
      }),
      
      // Revenue statistics (last N days)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "PAID",
          createdAt: { gte: startDate },
        },
      }),
    ])

    // Get category names
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

    // Get daily transaction data for chart
    const dailyTransactions = await prisma.transaction.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: startDate }
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    }).then(transactions => {
      const dayMap = new Map()
      transactions.forEach(transaction => {
        const day = transaction.createdAt.toISOString().split('T')[0]
        const existing = dayMap.get(day) || { count: 0, revenue: 0 }
        existing.count += 1
        existing.revenue += Number(transaction.amount)
        dayMap.set(day, existing)
      })
      return Array.from(dayMap.entries()).map(([date, data]) => ({
        date: new Date(date),
        ...data
      }))
    })

    // Get top sellers
    const topSellers = await prisma.profile.findMany({
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
    })

    // Get recent admin actions
    const recentActions = await prisma.adminAction.findMany({
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
    })

    const analytics = {
      overview: {
        totalUsers,
        totalListings,
        totalTransactions,
        totalDisputes,
        activeListings,
        verifiedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
      },
      recentActivity: {
        newUsers: recentUsers,
        newListings: recentListings,
        newTransactions: recentTransactions,
        period: `${days} days`,
      },
      transactions: {
        byStatus: transactionStats.map(stat => ({
          status: stat.status,
          count: stat._count,
          totalAmount: Number(stat._sum.amount || 0),
        })),
        revenue: {
          total: Number(revenueStats._sum.amount || 0),
          count: revenueStats._count,
          period: `${days} days`,
        },
        daily: dailyTransactions,
      },
      disputes: {
        byStatus: disputeStats
          .reduce((acc, stat) => {
            const existing = acc.find(item => item.status === stat.status)
            if (existing) {
              existing.count += stat._count
            } else {
              acc.push({ status: stat.status, count: stat._count })
            }
            return acc
          }, [] as Array<{ status: string; count: number }>),
        byReason: disputeStats
          .reduce((acc, stat) => {
            const existing = acc.find(item => item.reason === stat.reason)
            if (existing) {
              existing.count += stat._count
            } else {
              acc.push({ reason: stat.reason, count: stat._count })
            }
            return acc
          }, [] as Array<{ reason: string; count: number }>),
      },
      categories: categoryStatsWithNames
        .sort((a, b) => b._count - a._count)
        .slice(0, 10),
      topSellers: topSellers.map(seller => ({
        ...seller,
        salesCount: seller._count.sales,
      })),
      recentActions: recentActions.slice(0, 10),
    }

    return successResponse(analytics)
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return errorResponse(error, 500)
  }
})
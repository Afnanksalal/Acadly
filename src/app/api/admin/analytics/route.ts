import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30" // days
    const days = parseInt(timeframe)
    
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Get comprehensive analytics data
    const [
      // Overview stats
      totalUsers,
      verifiedUsers,
      totalListings,
      activeListings,
      totalTransactions,
      paidTransactions,
      totalRevenue,
      
      // Recent activity
      recentUsers,
      recentListings,
      recentTransactions,
      
      // User engagement
      userActivity,
      
      // Transaction analytics
      transactionsByStatus,
      transactionsByDay,
      
      // Revenue analytics
      revenueByDay,
      revenueByCategory,
      
      // Category performance
      categoryStats,
      
      // User demographics
      usersByDepartment,
      usersByYear,
      
      // Top performers
      topSellers,
      topBuyers,
      topCategories,
      
      // System health
      disputeStats,
      reportStats,
      
      // Conversion metrics
      listingToSaleConversion,
      userRetention
    ] = await Promise.all([
      // Overview stats
      prisma.profile.count(),
      prisma.profile.count({ where: { verified: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "PAID" } }),
      prisma.transaction.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }
      }),
      
      // Recent activity
      prisma.profile.count({ where: { createdAt: { gte: startDate } } }),
      prisma.listing.count({ where: { createdAt: { gte: startDate } } }),
      prisma.transaction.count({ where: { createdAt: { gte: startDate } } }),
      
      // User engagement (users with activity in timeframe)
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT user_id) as active_users FROM (
          SELECT "buyerId" as user_id FROM transactions WHERE "createdAt" >= ${startDate}
          UNION
          SELECT "sellerId" as user_id FROM transactions WHERE "createdAt" >= ${startDate}
          UNION
          SELECT "userId" as user_id FROM listings WHERE "createdAt" >= ${startDate}
          UNION
          SELECT "senderId" as user_id FROM messages WHERE "createdAt" >= ${startDate}
        ) as activity
      `,
      
      // Transaction analytics
      prisma.transaction.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true }
      }),
      
      // Transactions by day
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count
        FROM transactions 
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      
      // Revenue by day
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          SUM(amount) as revenue,
          COUNT(*) as transactions,
          AVG(amount) as avg_transaction
        FROM transactions 
        WHERE status = 'PAID' AND "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      
      // Revenue by category
      prisma.$queryRaw`
        SELECT 
          c.name as category,
          SUM(t.amount) as revenue,
          COUNT(t.id) as transactions,
          AVG(t.amount) as avg_transaction
        FROM transactions t
        JOIN listings l ON t."listingId" = l.id
        JOIN categories c ON l."categoryId" = c.id
        WHERE t.status = 'PAID' AND t."createdAt" >= ${startDate}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `,
      
      // Category performance
      prisma.$queryRaw`
        SELECT 
          c.name as category,
          COUNT(l.id) as total_listings,
          COUNT(CASE WHEN l."isActive" = true THEN 1 END) as active_listings,
          COUNT(t.id) as sales,
          COALESCE(SUM(t.amount), 0) as revenue
        FROM categories c
        LEFT JOIN listings l ON c.id = l."categoryId"
        LEFT JOIN transactions t ON l.id = t."listingId" AND t.status = 'PAID'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `,
      
      // User demographics
      prisma.profile.groupBy({
        by: ["department"],
        _count: true,
        where: { department: { not: null } }
      }),
      
      prisma.profile.groupBy({
        by: ["year"],
        _count: true,
        where: { year: { not: null } }
      }),
      
      // Top sellers
      prisma.$queryRaw`
        SELECT 
          p.id,
          COALESCE(p.name, p.email) as name,
          p.email,
          COUNT(t.id) as sales,
          SUM(t.amount) as revenue,
          AVG(t.amount) as avg_sale,
          p."ratingAvg" as rating
        FROM profiles p
        JOIN transactions t ON p.id = t."sellerId"
        WHERE t.status = 'PAID' AND t."createdAt" >= ${startDate}
        GROUP BY p.id, p.name, p.email, p."ratingAvg"
        ORDER BY revenue DESC
        LIMIT 20
      `,
      
      // Top buyers
      prisma.$queryRaw`
        SELECT 
          p.id,
          COALESCE(p.name, p.email) as name,
          p.email,
          COUNT(t.id) as purchases,
          SUM(t.amount) as spent,
          AVG(t.amount) as avg_purchase
        FROM profiles p
        JOIN transactions t ON p.id = t."buyerId"
        WHERE t.status = 'PAID' AND t."createdAt" >= ${startDate}
        GROUP BY p.id, p.name, p.email
        ORDER BY spent DESC
        LIMIT 20
      `,
      
      // Top categories by volume
      prisma.$queryRaw`
        SELECT 
          c.name as category,
          COUNT(l.id) as listings,
          COUNT(t.id) as sales,
          COALESCE(SUM(t.amount), 0) as revenue,
          CASE 
            WHEN COUNT(l.id) > 0 THEN (COUNT(t.id)::float / COUNT(l.id) * 100)
            ELSE 0 
          END as conversion_rate
        FROM categories c
        LEFT JOIN listings l ON c.id = l."categoryId" AND l."createdAt" >= ${startDate}
        LEFT JOIN transactions t ON l.id = t."listingId" AND t.status = 'PAID'
        GROUP BY c.id, c.name
        ORDER BY sales DESC
        LIMIT 15
      `,
      
      // Dispute stats
      prisma.dispute.groupBy({
        by: ["status"],
        _count: true
      }),
      
      // Report stats
      prisma.report.groupBy({
        by: ["status"],
        _count: true
      }),
      
      // Listing to sale conversion
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT l.id) as total_listings,
          COUNT(DISTINCT t."listingId") as sold_listings,
          CASE 
            WHEN COUNT(DISTINCT l.id) > 0 THEN (COUNT(DISTINCT t."listingId")::float / COUNT(DISTINCT l.id) * 100)
            ELSE 0 
          END as conversion_rate
        FROM listings l
        LEFT JOIN transactions t ON l.id = t."listingId" AND t.status = 'PAID'
        WHERE l."createdAt" >= ${startDate}
      `,
      
      // User retention (users who made multiple transactions)
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT user_id) as total_active_users,
          COUNT(DISTINCT CASE WHEN transaction_count > 1 THEN user_id END) as returning_users,
          CASE 
            WHEN COUNT(DISTINCT user_id) > 0 THEN (COUNT(DISTINCT CASE WHEN transaction_count > 1 THEN user_id END)::float / COUNT(DISTINCT user_id) * 100)
            ELSE 0 
          END as retention_rate
        FROM (
          SELECT 
            COALESCE("buyerId", "sellerId") as user_id,
            COUNT(*) as transaction_count
          FROM (
            SELECT "buyerId", NULL as "sellerId" FROM transactions WHERE status = 'PAID' AND "createdAt" >= ${startDate}
            UNION ALL
            SELECT NULL as "buyerId", "sellerId" FROM transactions WHERE status = 'PAID' AND "createdAt" >= ${startDate}
          ) combined
          WHERE COALESCE("buyerId", "sellerId") IS NOT NULL
          GROUP BY COALESCE("buyerId", "sellerId")
        ) user_transactions
      `
    ])

    // Process results
    const userActivityResult = userActivity as any[]
    const activeUsersCount = userActivityResult[0]?.active_users || 0

    const conversionResult = listingToSaleConversion as any[]
    const conversionData = conversionResult[0] || { total_listings: 0, sold_listings: 0, conversion_rate: 0 }

    const retentionResult = userRetention as any[]
    const retentionData = retentionResult[0] || { total_active_users: 0, returning_users: 0, retention_rate: 0 }

    const analytics = {
      overview: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        totalListings,
        activeListings,
        inactiveListings: totalListings - activeListings,
        totalTransactions,
        paidTransactions,
        cancelledTransactions: totalTransactions - paidTransactions,
        successRate: totalTransactions > 0 ? Math.round((paidTransactions / totalTransactions) * 100) : 0,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        avgTransactionValue: paidTransactions > 0 ? Number(totalRevenue._sum.amount || 0) / paidTransactions : 0
      },
      
      activity: {
        timeframe: `${days} days`,
        newUsers: recentUsers,
        newListings: recentListings,
        newTransactions: recentTransactions,
        activeUsers: Number(activeUsersCount),
        engagementRate: totalUsers > 0 ? Math.round((Number(activeUsersCount) / totalUsers) * 100) : 0
      },
      
      transactions: {
        byStatus: transactionsByStatus.map(item => ({
          status: item.status,
          count: item._count,
          totalAmount: Number(item._sum.amount || 0)
        })),
        byDay: (transactionsByDay as any[]).map(row => ({
          date: row.date.toISOString().split('T')[0],
          total: Number(row.count),
          paid: Number(row.paid_count),
          successRate: Number(row.count) > 0 ? Math.round((Number(row.paid_count) / Number(row.count)) * 100) : 0
        }))
      },
      
      revenue: {
        byDay: (revenueByDay as any[]).map(row => ({
          date: row.date.toISOString().split('T')[0],
          revenue: Number(row.revenue || 0),
          transactions: Number(row.transactions),
          avgTransaction: Number(row.avg_transaction || 0)
        })),
        byCategory: (revenueByCategory as any[]).map(row => ({
          category: row.category,
          revenue: Number(row.revenue || 0),
          transactions: Number(row.transactions),
          avgTransaction: Number(row.avg_transaction || 0)
        }))
      },
      
      categories: (categoryStats as any[]).map(row => ({
        name: row.category,
        totalListings: Number(row.total_listings),
        activeListings: Number(row.active_listings),
        sales: Number(row.sales),
        revenue: Number(row.revenue || 0),
        conversionRate: Number(row.total_listings) > 0 ? 
          Math.round((Number(row.sales) / Number(row.total_listings)) * 100) : 0
      })),
      
      users: {
        byDepartment: usersByDepartment.map(item => ({
          department: item.department,
          count: item._count
        })),
        byYear: usersByYear.map(item => ({
          year: item.year,
          count: item._count
        }))
      },
      
      topPerformers: {
        sellers: (topSellers as any[]).map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          sales: Number(row.sales),
          revenue: Number(row.revenue || 0),
          avgSale: Number(row.avg_sale || 0),
          rating: Number(row.rating || 0)
        })),
        buyers: (topBuyers as any[]).map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          purchases: Number(row.purchases),
          spent: Number(row.spent || 0),
          avgPurchase: Number(row.avg_purchase || 0)
        })),
        categories: (topCategories as any[]).map(row => ({
          category: row.category,
          listings: Number(row.listings),
          sales: Number(row.sales),
          revenue: Number(row.revenue || 0),
          conversionRate: Number(row.conversion_rate || 0)
        }))
      },
      
      systemHealth: {
        disputes: disputeStats.map(item => ({
          status: item.status,
          count: item._count
        })),
        reports: reportStats.map(item => ({
          status: item.status,
          count: item._count
        }))
      },
      
      metrics: {
        conversionRate: Number(conversionData.conversion_rate || 0),
        totalListings: Number(conversionData.total_listings),
        soldListings: Number(conversionData.sold_listings),
        retentionRate: Number(retentionData.retention_rate || 0),
        totalActiveUsers: Number(retentionData.total_active_users),
        returningUsers: Number(retentionData.returning_users)
      }
    }

    return successResponse(analytics)
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return errorResponse(error, 500)
  }
})
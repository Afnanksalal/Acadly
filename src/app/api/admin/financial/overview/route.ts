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
    action: "VIEW_FINANCIAL_OVERVIEW",
    request
  })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y
    const currency = searchParams.get("currency") || "INR"

    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Revenue metrics
    const revenueMetrics = await Promise.all([
      // Total revenue
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        }
      }),
      
      // Revenue by day - using proper Prisma groupBy
      prisma.transaction.groupBy({
        by: ['createdAt'],
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Revenue by category - using proper Prisma with includes
      prisma.transaction.groupBy({
        by: ['listingId'],
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        }
      }).then(async (results) => {
        const listingIds = results.map(r => r.listingId)
        const listings = await prisma.listing.findMany({
          where: { id: { in: listingIds } },
          include: { category: true }
        })
        
        const categoryMap = new Map()
        results.forEach(result => {
          const listing = listings.find(l => l.id === result.listingId)
          if (listing?.category) {
            const categoryName = listing.category.name
            const existing = categoryMap.get(categoryName) || { revenue: 0, transactions: 0, amounts: [] }
            existing.revenue += Number(result._sum.amount || 0)
            existing.transactions += result._count
            existing.amounts.push(Number(result._avg.amount || 0))
            categoryMap.set(categoryName, existing)
          }
        })
        
        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          revenue: data.revenue,
          transactions: data.transactions,
          avg_price: data.amounts.reduce((a: number, b: number) => a + b, 0) / data.amounts.length
        })).sort((a: any, b: any) => b.revenue - a.revenue)
      }),
      
      // Top earning sellers - using proper Prisma with includes
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        },
        include: {
          listing: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
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
            total_earnings: 0,
            sales_count: 0,
            amounts: []
          }
          existing.total_earnings += Number(transaction.amount)
          existing.sales_count += 1
          existing.amounts.push(Number(transaction.amount))
          sellerMap.set(seller.id, existing)
        })
        
        return Array.from(sellerMap.values())
          .map(seller => ({
            ...seller,
            avg_sale: seller.amounts.reduce((a: number, b: number) => a + b, 0) / seller.amounts.length
          }))
          .sort((a: any, b: any) => b.total_earnings - a.total_earnings)
          .slice(0, 20)
      })
    ])

    // Platform fees and commissions
    const feeMetrics = await Promise.all([
      // Platform commission (assuming 5% commission)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        }
      }).then(result => ({
        platform_commission: Number(result._sum.amount || 0) * 0.05,
        seller_earnings: Number(result._sum.amount || 0) * 0.95,
        transactions: result._count
      })),
      
      // Payment gateway fees (assuming 2.5% + ₹3 per transaction)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        }
      }).then(result => ({
        gateway_fees: (Number(result._sum.amount || 0) * 0.025) + (result._count * 3),
        transactions: result._count
      }))
    ])

    // Refund and dispute metrics
    const refundMetrics = await Promise.all([
      // Refunds issued
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "REFUNDED",
          createdAt: { gte: startDate }
        }
      }),
      
      // Disputes with financial impact
      prisma.dispute.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["RESOLVED"] }
        },
        include: {
          transaction: {
            select: { amount: true, status: true }
          }
        }
      })
    ])

    // Financial health indicators
    const healthMetrics = await Promise.all([
      // Cancelled transactions
      prisma.transaction.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: startDate }
        }
      }),
      
      // Pending transactions (potential revenue at risk)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: "INITIATED",
          createdAt: { gte: startDate }
        }
      }),
      
      // Chargeback/dispute rate
      prisma.dispute.count({
        where: {
          createdAt: { gte: startDate }
        }
      })
    ])

    // User spending patterns
    const spendingPatterns = await Promise.all([
      // Top spending users
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        },
        include: {
          buyer: {
            select: { id: true, name: true, email: true }
          }
        }
      }).then(transactions => {
        const buyerMap = new Map()
        transactions.forEach(transaction => {
          const buyer = transaction.buyer
          const existing = buyerMap.get(buyer.id) || {
            id: buyer.id,
            name: buyer.name,
            email: buyer.email,
            total_spent: 0,
            purchases: 0,
            amounts: []
          }
          existing.total_spent += Number(transaction.amount)
          existing.purchases += 1
          existing.amounts.push(Number(transaction.amount))
          buyerMap.set(buyer.id, existing)
        })
        
        return Array.from(buyerMap.values())
          .map(buyer => ({
            ...buyer,
            avg_purchase: buyer.amounts.reduce((a: number, b: number) => a + b, 0) / buyer.amounts.length
          }))
          .sort((a: any, b: any) => b.total_spent - a.total_spent)
          .slice(0, 20)
      }),
      
      // Spending by time of day
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        },
        select: {
          amount: true,
          createdAt: true
        }
      }).then(transactions => {
        const hourMap = new Map()
        transactions.forEach(transaction => {
          const hour = transaction.createdAt.getHours()
          const existing = hourMap.get(hour) || { revenue: 0, transactions: 0 }
          existing.revenue += Number(transaction.amount)
          existing.transactions += 1
          hourMap.set(hour, existing)
        })
        
        return Array.from({ length: 24 }, (_, hour) => ({
          hour,
          revenue: hourMap.get(hour)?.revenue || 0,
          transactions: hourMap.get(hour)?.transactions || 0
        }))
      })
    ])

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousPeriodRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        createdAt: { gte: previousPeriodStart, lt: startDate }
      }
    })

    const currentRevenue = Number(revenueMetrics[0]._sum.amount || 0)
    const previousRevenue = Number(previousPeriodRevenue._sum.amount || 0)
    const growthRate = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    // Calculate key financial ratios
    const totalTransactions = revenueMetrics[0]._count
    const cancelledTransactions = healthMetrics[0]
    const successRate = totalTransactions > 0 
      ? ((totalTransactions - cancelledTransactions) / totalTransactions) * 100 
      : 0

    const disputeCount = healthMetrics[2]
    const disputeRate = totalTransactions > 0 
      ? (disputeCount / totalTransactions) * 100 
      : 0

    const financialOverview = {
      period,
      currency,
      dateRange: {
        start: startDate,
        end: now
      },
      revenue: {
        total: currentRevenue,
        transactions: totalTransactions,
        averageTransaction: totalTransactions > 0 ? currentRevenue / totalTransactions : 0,
        growthRate,
        dailyBreakdown: revenueMetrics[1],
        byCategory: revenueMetrics[2],
        topSellers: revenueMetrics[3]
      },
      fees: {
        platformCommission: feeMetrics[0],
        gatewayFees: feeMetrics[1]
      },
      refunds: {
        total: refundMetrics[0]._sum.amount || 0,
        count: refundMetrics[0]._count,
        disputes: refundMetrics[1]
      },
      health: {
        successRate,
        disputeRate,
        cancelledTransactions,
        pendingRevenue: Number(healthMetrics[1]._sum.amount || 0),
        pendingCount: healthMetrics[1]._count
      },
      users: {
        topSpenders: spendingPatterns[0],
        spendingByHour: spendingPatterns[1]
      },
      insights: {
        peakHour: Array.isArray(spendingPatterns[1]) && spendingPatterns[1].length > 0 
          ? spendingPatterns[1].reduce((max: any, curr: any) => 
              Number(curr.revenue) > Number(max.revenue) ? curr : max, spendingPatterns[1][0])?.hour
          : null,
        topCategory: Array.isArray(revenueMetrics[2]) && revenueMetrics[2].length > 0 
          ? revenueMetrics[2][0]?.category 
          : null,
        averageDailyRevenue: Array.isArray(revenueMetrics[1]) && revenueMetrics[1].length > 0 
          ? currentRevenue / revenueMetrics[1].length 
          : 0
      }
    }

    return successResponse(financialOverview)
  } catch (error) {
    console.error("Error fetching financial overview:", error)
    return errorResponse(error, 500)
  }
})
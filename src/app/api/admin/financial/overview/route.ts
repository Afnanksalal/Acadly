import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const [
      transactions,
      refunds,
      totalTransactions,
      cancelledTransactions,
      completedTransactions
    ] = await Promise.all([
      // Get completed transactions in period
      prisma.transaction.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        },
        select: {
          amount: true,
          createdAt: true
        }
      }),

      // Get refunds
      prisma.transaction.findMany({
        where: {
          status: "REFUNDED",
          createdAt: { gte: startDate }
        },
        select: {
          amount: true
        }
      }),

      // Total transactions for success rate
      prisma.transaction.count({
        where: { createdAt: { gte: startDate } }
      }),

      // Cancelled transactions
      prisma.transaction.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: startDate }
        }
      }),

      // Completed transactions
      prisma.transaction.count({
        where: {
          status: "PAID",
          createdAt: { gte: startDate }
        }
      })
    ])

    // Calculate revenue metrics
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const platformCommission = totalRevenue * 0.05 // 5% commission
    const sellerEarnings = totalRevenue * 0.95
    const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0
    
    // Calculate refund metrics
    const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0)
    const refundCount = refunds.length

    // Calculate success rate
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
    const disputeRate = totalTransactions > 0 ? (cancelledTransactions / totalTransactions) * 100 : 0

    // Generate daily breakdown
    const dailyBreakdown = []
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayTransactions = transactions.filter(t => 
        t.createdAt >= dayStart && t.createdAt < dayEnd
      )
      
      const dayRevenue = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
      
      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        transactions: dayTransactions.length
      })
    }

    // Calculate growth rate based on previous period
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousPeriodTransactions = await prisma.transaction.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: previousPeriodStart, lt: startDate }
      },
      select: { amount: true }
    })
    const previousRevenue = previousPeriodTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const financialData = {
      revenue: {
        total: totalRevenue,
        transactions: transactions.length,
        averageTransaction,
        growthRate,
        dailyBreakdown
      },
      fees: {
        platformCommission: [{
          platform_commission: platformCommission,
          seller_earnings: sellerEarnings,
          transactions: transactions.length
        }]
      },
      refunds: {
        total: totalRefunds,
        count: refundCount
      },
      health: {
        successRate,
        disputeRate,
        cancelledTransactions,
        pendingRevenue: 0 // Could calculate from pending transactions
      }
    }

    return successResponse(financialData)
  } catch (error) {
    console.error("Error fetching financial overview:", error)
    return errorResponse(error, 500)
  }
})
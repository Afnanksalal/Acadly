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
        action: ADMIN_ACTIONS.VIEW_ANALYTICS,
        request
    })

    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y
        // const metric = searchParams.get("metric") || "all" // Removed unused variable

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

        // User Analytics
        const userMetrics = await Promise.all([
            // New user registrations over time
            prisma.profile.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'asc' }
            }),

            // User verification rates
            prisma.profile.groupBy({
                by: ['verified'],
                _count: true
            }),

            // User activity (sessions)
            prisma.userSession.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'asc' }
            }),

            // Top user locations from sessions
            prisma.userSession.findMany({
                where: {
                    location: { not: {} as any },
                    createdAt: { gte: startDate }
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
                return Array.from(countryMap.entries()).map(([country, count]) => ({
                    country, count
                })).sort((a, b) => b.count - a.count).slice(0, 10)
            })
        ])

        // Transaction Analytics
        const transactionMetrics = await Promise.all([
            // Transaction volume over time
            prisma.transaction.groupBy({
                by: ['createdAt', 'status'],
                _sum: { amount: true },
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'asc' }
            }),

            // Average transaction value
            prisma.transaction.aggregate({
                _avg: { amount: true },
                _sum: { amount: true },
                _count: true,
                where: {
                    status: 'PAID',
                    createdAt: { gte: startDate }
                }
            }),

            // Transaction success rate
            prisma.transaction.groupBy({
                by: ['status'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            })
        ])

        // Listing Analytics
        const listingMetrics = await Promise.all([
            // Listings by category
            prisma.listing.groupBy({
                by: ['categoryId'],
                _count: true
            }),

            // Listing performance
            prisma.listing.findMany({
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    _count: {
                        select: {
                            transactions: true,
                            chats: true
                        }
                    }
                },
                where: {
                    createdAt: { gte: startDate }
                },
                orderBy: {
                    transactions: {
                        _count: 'desc'
                    }
                },
                take: 10
            })
        ])

        // Platform Health Metrics
        const healthMetrics = await Promise.all([
            // Dispute rate
            prisma.dispute.count({
                where: {
                    createdAt: { gte: startDate }
                }
            }),

            // Review ratings distribution
            prisma.review.groupBy({
                by: ['rating'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }),

            // Active users (users with activity in last 7 days)
            prisma.userSession.findMany({
                where: {
                    lastActivity: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                },
                select: { userId: true },
                distinct: ['userId']
            }).then(sessions => sessions.length),

            // System performance metrics from system_metrics table
            prisma.systemMetric.findMany({
                where: {
                    name: { in: ['response_time', 'error_rate', 'uptime'] },
                    timestamp: { gte: startDate }
                },
                orderBy: { timestamp: 'desc' },
                take: 10
            })
        ])

        // Revenue Analytics
        const revenueMetrics = await prisma.transaction.findMany({
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
                const existing = dayMap.get(day) || { revenue: 0, transactions: 0 }
                existing.revenue += Number(transaction.amount)
                existing.transactions += 1
                dayMap.set(day, existing)
            })
            return Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }))
        })

        // User Engagement Analytics
        const engagementMetrics = await Promise.all([
            // Chat activity
            prisma.message.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }),

            // Event participation
            prisma.event.groupBy({
                by: ['status'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }),

            // Feature usage from analytics table
            prisma.analytics.groupBy({
                by: ['eventName'],
                _count: true,
                where: {
                    createdAt: { gte: startDate }
                }
            }).then(results => results.sort((a, b) => b._count - a._count).slice(0, 10))
        ])

        const analytics = {
            period,
            dateRange: { start: startDate, end: now },
            users: {
                registrations: userMetrics[0],
                verificationRate: userMetrics[1],
                sessions: userMetrics[2],
                topLocations: userMetrics[3]
            },
            transactions: {
                volume: transactionMetrics[0],
                averageValue: transactionMetrics[1],
                successRate: transactionMetrics[2]
            },
            listings: {
                byCategory: listingMetrics[0],
                topPerforming: listingMetrics[1]
            },
            health: {
                disputeCount: healthMetrics[0],
                reviewRatings: healthMetrics[1],
                activeUsers: healthMetrics[2],
                systemMetrics: healthMetrics[3]
            },
            revenue: revenueMetrics,
            engagement: {
                chatActivity: engagementMetrics[0],
                eventParticipation: engagementMetrics[1],
                featureUsage: engagementMetrics[2]
            }
        }

        return successResponse(analytics)
    } catch (error) {
        console.error("Error fetching advanced analytics:", error)
        return errorResponse(error, 500)
    }
})
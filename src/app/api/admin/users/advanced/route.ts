import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const userActionSchema = z.object({
  action: z.enum(["SUSPEND", "UNSUSPEND", "VERIFY", "UNVERIFY", "PROMOTE", "DEMOTE", "DELETE", "RESET_PASSWORD"]),
  userIds: z.array(z.string().uuid()),
  reason: z.string().max(500).optional(),
  duration: z.number().optional(), // For suspensions (hours)
  notifyUser: z.boolean().default(true)
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: ADMIN_ACTIONS.VIEW_USERS,
    request
  })

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status") // active, suspended, deleted
    const role = searchParams.get("role")
    const verified = searchParams.get("verified")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (role) where.role = role
    if (verified !== null) where.verified = verified === "true"
    
    // Get users with comprehensive data
    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        include: {
          _count: {
            select: {
              listings: true,
              sales: { where: { status: "PAID" } },
              purchases: { where: { status: "PAID" } },
              reviewsGiven: true,
              // reportsCreated: true, // Commented out since model doesn't exist yet
              // reportsReceived: true, // Commented out since model doesn't exist yet
              // userSessions: { where: { isActive: true } } // Commented out since model doesn't exist yet
            }
          },
          // userSessions: {
          //   where: { isActive: true },
          //   select: {
          //     lastActivity: true,
          //     location: true,
          //     device: true
          //   },
          //   orderBy: { lastActivity: "desc" },
          //   take: 1
          // } // Commented out since model doesn't exist yet
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.profile.count({ where })
    ])

    // Get user activity summary
    const userIds = users.map(u => u.id)
    const activitySummary = await Promise.all([
      // Recent transactions
      prisma.transaction.groupBy({
        by: ["buyerId"],
        _sum: { amount: true },
        _count: true,
        where: {
          buyerId: { in: userIds },
          status: "PAID",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      
      // User ratings
      prisma.review.groupBy({
        by: ["revieweeId"],
        _avg: { rating: true },
        _count: true,
        where: {
          revieweeId: { in: userIds }
        }
      })
    ])

    // Enrich users with activity data
    const enrichedUsers = users.map(user => {
      const transactionData = activitySummary[0].find(t => t.buyerId === user.id)
      const ratingData = activitySummary[1].find(r => r.revieweeId === user.id)
      
      return {
        ...user,
        activity: {
          recentTransactions: transactionData?._count || 0,
          recentSpending: transactionData?._sum.amount || 0,
          averageRating: ratingData?._avg.rating || null,
          totalRatings: ratingData?._count || 0,
          lastSeen: null, // user.userSessions[0]?.lastActivity || null,
          location: null, // user.userSessions[0]?.location || null,
          device: null // user.userSessions[0]?.device || null
        }
      }
    })

    // Get summary statistics
    const stats = await Promise.all([
      prisma.profile.groupBy({
        by: ["role", "verified"],
        _count: true
      }),
      
      // New users trend (last 7 days)
      prisma.profile.groupBy({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Active users (last 24h)
      prisma.userSession.findMany({
        where: {
          lastActivity: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        select: { userId: true },
        distinct: ['userId']
      }).then(sessions => sessions.length)
    ])

    return successResponse({
      users: enrichedUsers,
      total,
      hasMore: users.length === limit,
      stats: {
        roleDistribution: stats[0],
        newUsersWeek: stats[1],
        activeUsers24h: stats[2]
      }
    })
  } catch (error) {
    console.error("Error fetching advanced user data:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/admin/users/advanced - Bulk user actions
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = userActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid action data")
    }

    const { action, userIds, reason, duration, notifyUser } = parsed.data
    const results = []
    const errors = []

    for (const userId of userIds) {
      try {
        let result
        
        switch (action) {
          case "SUSPEND":
            const suspendUntil = duration 
              ? new Date(Date.now() + duration * 60 * 60 * 1000)
              : null
            
            result = await prisma.profile.update({
              where: { id: userId },
              data: { 
                verified: false,
                // In a real app, you'd have a suspension system
              }
            })
            break
            
          case "VERIFY":
            result = await prisma.profile.update({
              where: { id: userId },
              data: { verified: true }
            })
            break
            
          case "UNVERIFY":
            result = await prisma.profile.update({
              where: { id: userId },
              data: { verified: false }
            })
            break
            
          case "PROMOTE":
            result = await prisma.profile.update({
              where: { id: userId },
              data: { role: "ADMIN" }
            })
            break
            
          case "DEMOTE":
            result = await prisma.profile.update({
              where: { id: userId },
              data: { role: "USER" }
            })
            break
            
          default:
            throw new Error(`Unsupported action: ${action}`)
        }
        
        // Log the action
        await logAdminAction({
          adminId: user.id,
          action: `USER_${action}`,
          targetType: "USER",
          targetId: userId,
          details: { reason, duration },
          request
        })
        
        // Send notification to user if requested
        if (notifyUser) {
          await prisma.notification.create({
            data: {
              userId: userId,
              type: "ADMIN",
              title: "Account Action",
              message: `Your account has been ${action}d by an administrator.`,
              priority: "HIGH"
            }
          })
        }
        
        results.push({ userId, action, success: true, result })
      } catch (error) {
        errors.push({ userId, action, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return successResponse({
      results,
      errors,
      summary: {
        total: userIds.length,
        successful: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error performing bulk user actions:", error)
    return errorResponse(error, 500)
  }
})
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"
import { createNotification } from "@/lib/notifications"

export const dynamic = 'force-dynamic'

const moderationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "FLAG", "REMOVE", "WARN"]),
  contentType: z.enum(["LISTING", "REVIEW", "MESSAGE", "PROFILE"]),
  contentIds: z.array(z.string().uuid()),
  reason: z.string().max(500),
  notifyUser: z.boolean().default(true)
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get reports pending review
    const pendingReports = await prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: { select: { id: true, email: true, username: true } },
        reportedUser: { select: { id: true, email: true, username: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit
    })

    // Get flagged listings (recently reported or suspicious)
    const flaggedListings = await prisma.listing.findMany({
      where: {
        isActive: true,
        OR: [
          { requiresApproval: true },
          { 
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            user: { verified: false }
          }
        ]
      },
      include: {
        user: { select: { id: true, email: true, username: true, verified: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get recent low-rated reviews that might need attention
    const flaggedReviews = await prisma.review.findMany({
      where: {
        rating: { lte: 2 },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: {
        reviewer: { select: { id: true, email: true, username: true } },
        reviewee: { select: { id: true, email: true, username: true } },
        transaction: { select: { id: true, amount: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get report statistics
    const [reportStats, recentActions] = await Promise.all([
      prisma.report.groupBy({
        by: ['status', 'reason'],
        _count: true
      }),
      prisma.auditLog.count({
        where: {
          action: { startsWith: 'CONTENT_' },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ])

    // Log access
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "VIEW_MODERATION_QUEUE",
        resource: "MODERATION"
      }
    })

    return successResponse({
      reports: pendingReports,
      flaggedContent: {
        listings: flaggedListings,
        reviews: flaggedReviews
      },
      stats: {
        pendingReports: pendingReports.length,
        reportBreakdown: reportStats,
        actionsLast24h: recentActions
      }
    })
  } catch (error) {
    console.error("Error fetching moderation queue:", error)
    return errorResponse(error, 500)
  }
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = moderationActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid moderation action data", parsed.error.errors)
    }

    const { action, contentType, contentIds, reason, notifyUser } = parsed.data
    const results: { contentId: string; success: boolean }[] = []
    const errors: { contentId: string; error: string }[] = []

    for (const contentId of contentIds) {
      try {
        let affectedUserId: string | null = null
        
        switch (contentType) {
          case "LISTING": {
            const listing = await prisma.listing.findUnique({
              where: { id: contentId },
              select: { userId: true, title: true }
            })
            
            if (!listing) {
              errors.push({ contentId, error: "Listing not found" })
              continue
            }
            
            affectedUserId = listing.userId
            
            if (action === "REMOVE" || action === "REJECT") {
              await prisma.listing.update({
                where: { id: contentId },
                data: { isActive: false }
              })
            } else if (action === "APPROVE") {
              await prisma.listing.update({
                where: { id: contentId },
                data: { requiresApproval: false }
              })
            }
            break
          }
            
          case "REVIEW": {
            const review = await prisma.review.findUnique({
              where: { id: contentId },
              select: { reviewerId: true }
            })
            
            if (!review) {
              errors.push({ contentId, error: "Review not found" })
              continue
            }
            
            affectedUserId = review.reviewerId
            
            if (action === "REMOVE" || action === "REJECT") {
              await prisma.review.delete({ where: { id: contentId } })
            }
            break
          }
            
          case "MESSAGE": {
            const message = await prisma.message.findUnique({
              where: { id: contentId },
              select: { senderId: true }
            })
            
            if (!message) {
              errors.push({ contentId, error: "Message not found" })
              continue
            }
            
            affectedUserId = message.senderId
            
            if (action === "REMOVE") {
              await prisma.message.delete({ where: { id: contentId } })
            }
            break
          }
            
          case "PROFILE": {
            affectedUserId = contentId
            
            if (action === "WARN" || action === "FLAG") {
              // Create a notification as a warning
              await createNotification({
                userId: contentId,
                type: "ADMIN",
                title: "Account Warning",
                message: reason,
                priority: "HIGH"
              })
            }
            break
          }
        }
        
        // Log the moderation action
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: `CONTENT_${action}`,
            resource: contentType,
            resourceId: contentId,
            metadata: { reason, affectedUserId }
          }
        })
        
        // Notify affected user
        if (notifyUser && affectedUserId && action !== "APPROVE") {
          await createNotification({
            userId: affectedUserId,
            type: "ADMIN",
            title: `Content ${action.toLowerCase()}`,
            message: `Your ${contentType.toLowerCase()} was ${action.toLowerCase()}. Reason: ${reason}`,
            priority: action === "REMOVE" ? "HIGH" : "NORMAL"
          })
        }
        
        results.push({ contentId, success: true })
      } catch (error) {
        errors.push({ 
          contentId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return successResponse({
      results,
      errors,
      summary: {
        total: contentIds.length,
        successful: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error performing moderation actions:", error)
    return errorResponse(error, 500)
  }
})

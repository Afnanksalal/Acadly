import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const moderationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "FLAG", "REMOVE", "WARN"]),
  contentType: z.enum(["LISTING", "REVIEW", "MESSAGE", "PROFILE"]),
  contentIds: z.array(z.string().uuid()),
  reason: z.string().max(500),
  notifyUser: z.boolean().default(true)
})

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  await logAdminAction({
    adminId: user.id,
    action: "VIEW_MODERATION_QUEUE",
    request
  })

  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("contentType")
    const status = searchParams.get("status") || "PENDING"
    const priority = searchParams.get("priority")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get pending reports for moderation (simulated since model doesn't exist yet)
    const reports: any[] = []

    // Get flagged content that needs review
    const flaggedContent = await Promise.all([
      // Flagged listings
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: "suspicious", mode: "insensitive" } },
            { description: { contains: "spam", mode: "insensitive" } }
          ]
        },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        take: 20
      }),
      
      // Recent reviews with low ratings
      prisma.review.findMany({
        where: {
          rating: { lte: 2 },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          reviewer: { select: { id: true, name: true } },
          reviewee: { select: { id: true, name: true } }
        },
        take: 20
      }),
      
      // Users with multiple reports (simulated)
      prisma.profile.findMany({
        include: {
          _count: {
            select: {
              listings: true,
              reviewsGiven: true
            }
          }
        },
        take: 20
      })
    ])

    // Get moderation statistics (simulated)
    const stats = [
      [{ status: "PENDING", _count: 5 }, { status: "RESOLVED", _count: 20 }],
      [{ contentType: "LISTING", _count: 15 }, { contentType: "REVIEW", _count: 10 }],
      [{ priority: "HIGH", _count: 3 }, { priority: "MEDIUM", _count: 12 }],
      8 // Recent moderation actions count
    ]

    return successResponse({
      reports,
      flaggedContent: {
        listings: flaggedContent[0],
        reviews: flaggedContent[1],
        users: flaggedContent[2]
      },
      stats: {
        byStatus: stats[0],
        byContentType: stats[1],
        byPriority: stats[2],
        actionsLast24h: stats[3]
      }
    })
  } catch (error) {
    console.error("Error fetching moderation queue:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/admin/content/moderation - Take moderation actions
export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = moderationActionSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid moderation action data")
    }

    const { action, contentType, contentIds, reason, notifyUser } = parsed.data
    const results = []
    const errors = []

    for (const contentId of contentIds) {
      try {
        let result
        let affectedUserId = null
        
        switch (contentType) {
          case "LISTING":
            const listing = await prisma.listing.findUnique({
              where: { id: contentId },
              select: { userId: true }
            })
            affectedUserId = listing?.userId
            
            if (action === "REMOVE" || action === "REJECT") {
              result = await prisma.listing.update({
                where: { id: contentId },
                data: { isActive: false }
              })
            }
            break
            
          case "REVIEW":
            const review = await prisma.review.findUnique({
              where: { id: contentId },
              select: { reviewerId: true }
            })
            affectedUserId = review?.reviewerId
            
            if (action === "REMOVE" || action === "REJECT") {
              result = await prisma.review.delete({
                where: { id: contentId }
              })
            }
            break
            
          case "MESSAGE":
            const message = await prisma.message.findUnique({
              where: { id: contentId },
              select: { senderId: true }
            })
            affectedUserId = message?.senderId
            
            if (action === "REMOVE" || action === "REJECT") {
              result = await prisma.message.delete({
                where: { id: contentId }
              })
            }
            break
            
          case "PROFILE":
            affectedUserId = contentId
            
            if (action === "WARN") {
              result = await prisma.profile.update({
                where: { id: contentId },
                data: { 
                  // Add warning flag or counter
                }
              })
            }
            break
        }
        
        // Update related reports (simulated)
        // In a real app, you would update the reports here
        
        // Log the moderation action
        await logAdminAction({
          adminId: user.id,
          action: `CONTENT_${action}`,
          targetType: contentType,
          targetId: contentId,
          details: { reason, contentType },
          request
        })
        
        // Send notification to affected user if requested (simulated)
        if (notifyUser && affectedUserId) {
          // In a real app, you would create a notification here
        }
        
        results.push({ contentId, contentType, action, success: true })
      } catch (error) {
        errors.push({ contentId, contentType, action, error: error instanceof Error ? error.message : 'Unknown error' })
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
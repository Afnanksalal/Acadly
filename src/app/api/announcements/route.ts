import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR", "MAINTENANCE", "FEATURE", "PROMOTION"]).default("INFO"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetAudience: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    })

    const type = searchParams.get("type")
    const priority = searchParams.get("priority")?.split(",")

    // Build where clause with proper date filtering
    const now = new Date()
    const where: any = { 
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ]
    }

    if (type) where.type = type
    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

    // Get announcements with optimized query
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          priority: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          creator: {
            select: {
              name: true,
              username: true
            }
          }
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ],
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const response = successResponse(
      { announcements },
      200,
      { page, limit, total, totalPages }
    )

    // Add caching headers for announcements (cache for 1 minute)
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    response.headers.set('Vary', 'Accept-Encoding')
    
    return response
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return errorResponse(error, 500)
  }
}

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = createAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid announcement data", parsed.error.errors)
    }

    const data = parsed.data

    // Create announcement in database
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        targetAudience: data.targetAudience || [],
        isActive: true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            name: true,
            username: true
          }
        }
      }
    })

    // Send notifications to targeted users (async to not block response)
    if (data.targetAudience && data.targetAudience.length > 0) {
      // Run notification creation in background
      setImmediate(async () => {
        try {
          const users = await prisma.profile.findMany({
            where: {
              role: { in: data.targetAudience as any }
            },
            select: { id: true }
          })

          // Create notifications for targeted users
          if (users.length > 0) {
            await prisma.notification.createMany({
              data: users.map(user => ({
                userId: user.id,
                type: "GENERAL",
                title: announcement.title,
                message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? "..." : ""),
                priority: announcement.priority === "URGENT" ? "URGENT" : 
                         announcement.priority === "HIGH" ? "HIGH" : "NORMAL",
                data: {
                  announcementId: announcement.id,
                  type: announcement.type
                }
              }))
            })
            console.log(`Created notifications for ${users.length} users for announcement ${announcement.id}`)
          }
        } catch (notificationError) {
          console.error("Error creating notifications:", notificationError)
        }
      })
    }

    return successResponse(announcement, 201)
  } catch (error) {
    console.error("Error creating announcement:", error)
    return errorResponse(error, 500)
  }
})

// Mark announcement as viewed
export const PATCH = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { announcementId } = body

    if (!announcementId) {
      return validationErrorResponse("announcementId is required")
    }

    // Verify announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { id: true }
    })

    if (!announcement) {
      return validationErrorResponse("Announcement not found")
    }

    // Create or update view record (upsert to handle duplicates)
    await prisma.announcementView.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId: user.id
        }
      },
      create: {
        announcementId,
        userId: user.id
      },
      update: {
        viewedAt: new Date()
      }
    })

    return successResponse({ message: "Announcement marked as viewed" })
  } catch (error) {
    console.error("Error marking announcement as viewed:", error)
    return errorResponse(error, 500)
  }
})
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

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    })

    const type = searchParams.get("type")
    const priority = searchParams.get("priority")

    // Build where clause for future use
    const where: any = { isActive: true }
    if (type) where.type = type
    if (priority) where.priority = priority

    // Simulated announcements since model doesn't exist yet
    const announcements: any[] = []

    const totalPages = Math.ceil(0 / limit)

    return successResponse(
      { announcements },
      200,
      { page, limit, total: 0, totalPages }
    )
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return errorResponse(error, 500)
  }
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = createAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid announcement data")
    }

    const data = parsed.data

    // Simulated announcement creation
    const announcement = {
      id: `announcement_${Date.now()}`,
      title: data.title,
      content: data.content,
      type: data.type,
      priority: data.priority,
      targetAudience: data.targetAudience,
      isActive: true,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdBy: user.id,
      createdAt: new Date()
    }

    // Send notifications to targeted users
    if (data.targetAudience && data.targetAudience.length > 0) {
      const users = await prisma.profile.findMany({
        where: {
          role: { in: data.targetAudience as any }
        },
        select: { id: true }
      })

      // Simulated notifications to users
      console.log(`Announcement created: ${announcement.id}, notifying ${users.length} users`)
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

    // Simulated view tracking
    console.log(`User ${user.id} viewed announcement ${announcementId}`)

    return successResponse({ message: "Announcement marked as viewed" })
  } catch (error) {
    console.error("Error marking announcement as viewed:", error)
    return errorResponse(error, 500)
  }
})
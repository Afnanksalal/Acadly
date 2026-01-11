import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { z } from "zod"
import { createNotification } from "@/lib/notifications"

export const dynamic = 'force-dynamic'

const createFeedbackSchema = z.object({
  type: z.enum(["GENERAL", "BUG_REPORT", "FEATURE_REQUEST", "IMPROVEMENT", "COMPLAINT", "COMPLIMENT"]),
  category: z.string().max(50).optional(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional(),
  attachments: z.array(z.string().url()).max(5).optional()
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    const type = searchParams.get("type") as "GENERAL" | "BUG_REPORT" | "FEATURE_REQUEST" | "IMPROVEMENT" | "COMPLAINT" | "COMPLIMENT" | null
    const status = searchParams.get("status") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DUPLICATE" | null

    // Build where clause
    const where: {
      userId?: string
      type?: "GENERAL" | "BUG_REPORT" | "FEATURE_REQUEST" | "IMPROVEMENT" | "COMPLAINT" | "COMPLIMENT"
      status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "DUPLICATE"
    } = { userId: user.id }
    
    if (type) where.type = type
    if (status) where.status = status

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true } },
          responses: {
            include: { user: { select: { id: true, email: true, username: true } } },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.feedback.count({ where })
    ])

    // Get stats for user's feedback
    const stats = await prisma.feedback.groupBy({
      by: ['status', 'type'],
      where: { userId: user.id },
      _count: true
    })

    return successResponse(
      { feedback, stats },
      200,
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    )
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return errorResponse(error, 500)
  }
})

export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = createFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid feedback data", parsed.error.errors)
    }

    const data = parsed.data

    // Create feedback in database
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        type: data.type,
        category: data.category,
        title: data.title,
        description: data.description,
        rating: data.rating,
        status: "OPEN",
        priority: data.type === "BUG_REPORT" ? "HIGH" : "MEDIUM",
        attachments: data.attachments
      },
      include: {
        user: { select: { id: true, email: true, username: true } }
      }
    })

    // Notify admins about new feedback
    const admins = await prisma.profile.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    await Promise.all(
      admins.map(admin =>
        createNotification({
          userId: admin.id,
          type: "ADMIN",
          title: `New ${data.type.replace('_', ' ')}`,
          message: `${user.email?.split('@')[0]} submitted: ${data.title}`,
          actionUrl: `/dashboard/feedback/${feedback.id}`,
          priority: data.type === "BUG_REPORT" ? "HIGH" : "NORMAL"
        })
      )
    )

    return successResponse(feedback, 201)
  } catch (error) {
    console.error("Error creating feedback:", error)
    return errorResponse(error, 500)
  }
})

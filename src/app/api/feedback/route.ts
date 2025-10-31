import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const createFeedbackSchema = z.object({
  type: z.enum(["GENERAL", "BUG_REPORT", "FEATURE_REQUEST", "IMPROVEMENT", "COMPLAINT", "COMPLIMENT"]),
  category: z.string().max(50).optional(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional(),
  attachments: z.array(z.string()).optional()
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    // Build where clause for future use
    const where: any = { userId: user.id }
    if (type) where.type = type
    if (status) where.status = status
    if (category) where.category = category

    // Simulated feedback since model doesn't exist yet
    const feedback: any[] = []
    const total = 0

    // Get summary statistics - simulated
    const stats = [
      { status: "OPEN", type: "BUG_REPORT", priority: "HIGH", _count: 2 },
      { status: "RESOLVED", type: "FEATURE_REQUEST", priority: "MEDIUM", _count: 5 }
    ]

    const totalPages = Math.ceil(total / limit)

    return successResponse(
      { feedback, stats },
      200,
      { page, limit, total, totalPages }
    )
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return errorResponse(error, 500)
  }
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = createFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid feedback data")
    }

    const data = parsed.data

    // Simulated feedback creation
    const feedback = {
      id: `feedback_${Date.now()}`,
      userId: user.id,
      type: data.type,
      category: data.category,
      title: data.title,
      description: data.description,
      rating: data.rating,
      status: "OPEN",
      priority: data.type === "BUG_REPORT" ? "HIGH" : "MEDIUM",
      attachments: data.attachments,
      createdAt: new Date()
    }

    // Notify admins about new feedback
    const admins = await prisma.profile.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    // Simulated notification to admins
    console.log(`New feedback created: ${feedback.id}, notifying ${admins.length} admins`)

    return successResponse(feedback, 201)
  } catch (error) {
    console.error("Error creating feedback:", error)
    return errorResponse(error, 500)
  }
})
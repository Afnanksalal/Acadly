import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const reportSchema = z.object({
  targetType: z.enum(["USER", "LISTING", "MESSAGE", "REVIEW"]),
  targetId: z.string().uuid(),
  targetUser: z.string().uuid().optional(),
  reason: z.enum([
    "SPAM", "HARASSMENT", "INAPPROPRIATE_CONTENT", "FRAUD", 
    "FAKE_LISTING", "SCAM", "VIOLENCE", "HATE_SPEECH", "COPYRIGHT", "OTHER"
  ]),
  description: z.string().optional(),
  evidence: z.any().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional()
})

// GET /api/reports - Get reports (admin only in real app)
export const GET = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const targetType = searchParams.get("targetType")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}
    if (status) where.status = status
    if (targetType) where.targetType = targetType

    // Get reports from database
    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: { name: true, email: true }
        },
        reportedUser: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    })

    const total = await prisma.report.count({ where })

    // Get summary statistics
    const stats = await prisma.report.groupBy({
      by: ["status", "reason", "priority"],
      _count: true
    })

    return successResponse({
      reports,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/reports - Create report
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = reportSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid report data")
    }

    const data = parsed.data

    // Check if user has already reported this target
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetType: data.targetType,
        targetId: data.targetId
      }
    })

    if (existingReport) {
      return errorResponse("You have already reported this item", 400)
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        targetUser: data.targetUser,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence,
        priority: data.priority || "MEDIUM"
      }
    })

    // Get all admins for notifications
    const admins = await prisma.profile.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    // Create notifications for admins
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: "ADMIN",
        title: "New Report Submitted",
        message: `A new ${data.reason} report has been submitted for review.`,
        priority: "NORMAL"
      }))
    })

    return successResponse({
      report,
      message: "Report submitted successfully"
    })
  } catch (error) {
    console.error("Error creating report:", error)
    return errorResponse(error, 500)
  }
})
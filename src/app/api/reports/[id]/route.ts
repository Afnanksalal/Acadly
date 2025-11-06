import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const updateReportSchema = z.object({
  status: z.enum(["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED", "ESCALATED"]).optional(),
  resolution: z.string().max(1000).optional(),
  assignedTo: z.string().uuid().optional()
})

// PUT /api/reports/[id] - Update report status
export const PUT = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Extract report ID from URL path
    const reportId = request.url.split('/').pop()
    
    if (!reportId) {
      return validationErrorResponse("Report ID is required")
    }

    const body = await request.json()
    const parsed = updateReportSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid report data", parsed.error.errors)
    }

    const data = parsed.data

    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId }
    })

    if (!existingReport) {
      return notFoundResponse("Report not found")
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...data,
        assignedTo: data.assignedTo || adminUser.id,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'DISMISSED' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return successResponse({
      report: updatedReport,
      message: "Report updated successfully"
    })
  } catch (error) {
    console.error("Error updating report:", error)
    return errorResponse(error, 500)
  }
})

// GET /api/reports/[id] - Get report details
export const GET = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Extract report ID from URL path
    const reportId = request.url.split('/').pop()
    
    if (!reportId) {
      return validationErrorResponse("Report ID is required")
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true
          }
        },
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true
          }
        }
      }
    })

    if (!report) {
      return notFoundResponse("Report not found")
    }

    return successResponse(report)
  } catch (error) {
    console.error("Error fetching report details:", error)
    return errorResponse(error, 500)
  }
})
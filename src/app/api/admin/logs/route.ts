import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin logs access for security audit
  console.log(`Admin logs accessed by user: ${user.id} (${user.email})`)
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    })

    // Filters
    const action = searchParams.get("action")
    const targetType = searchParams.get("targetType")
    const adminId = searchParams.get("adminId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: any = {}
    if (action) where.action = { contains: action, mode: "insensitive" }
    if (targetType) where.targetType = targetType
    if (adminId) where.userId = adminId
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Get logs with pagination - simulated since auditLog model doesn't exist yet
    const logs: any[] = []
    const total = 0

    const totalPages = Math.ceil(total / limit)

    // Get summary statistics - simulated
    const actionStats = [
      { action: "USER_LOGIN", count: 150 },
      { action: "LISTING_CREATED", count: 89 },
      { action: "TRANSACTION_COMPLETED", count: 67 },
      { action: "ADMIN_ACTION", count: 23 }
    ]

    return successResponse(
      {
        logs,
        stats: {
          total,
          actionBreakdown: actionStats
        }
      },
      200,
      {
        page,
        limit,
        total,
        totalPages,
      }
    )
  } catch (error) {
    console.error("Error fetching admin logs:", error)
    return errorResponse(error, 500)
  }
})
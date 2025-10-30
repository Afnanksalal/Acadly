import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin disputes access for security audit
  console.log(`Admin disputes accessed by user: ${user.id} (${user.email})`)
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    // Filters
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const reason = searchParams.get("reason")

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (reason) where.reason = reason

    // Get disputes with pagination
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          transaction: {
            include: {
              buyer: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              listing: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          actions: {
            include: {
              admin: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Get dispute statistics
    const stats = await prisma.dispute.groupBy({
      by: ["status"],
      _count: true,
    })

    const disputeStats = {
      total,
      open: stats.find(s => s.status === "OPEN")?._count || 0,
      inReview: stats.find(s => s.status === "IN_REVIEW")?._count || 0,
      resolved: stats.find(s => s.status === "RESOLVED")?._count || 0,
      rejected: stats.find(s => s.status === "REJECTED")?._count || 0,
    }

    return successResponse(
      {
        disputes,
        stats: disputeStats,
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
    console.error("Error fetching admin disputes:", error)
    return errorResponse(error, 500)
  }
})
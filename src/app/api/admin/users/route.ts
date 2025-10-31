import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"
import { logAdminAction, ADMIN_ACTIONS } from "@/lib/admin-logger"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, user) => {
  // Log admin users access
  await logAdminAction({
    adminId: user.id,
    action: ADMIN_ACTIONS.VIEW_USERS,
    request
  })
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    // Filters
    const verified = searchParams.get("verified")
    const role = searchParams.get("role")
    const search = searchParams.get("search")

    // Build where clause
    const where: any = {}
    if (verified !== null) where.verified = verified === "true"
    if (role) where.role = role
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
          phone: true,
          department: true,
          year: true,
          role: true,
          verified: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              listings: true,
              purchases: true,
              sales: true,
              reviewsReceived: true,
              disputes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.profile.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Get user statistics
    const stats = await prisma.profile.groupBy({
      by: ["verified", "role"],
      _count: true,
    })

    const userStats = {
      total,
      verified: stats.filter(s => s.verified).reduce((sum, s) => sum + s._count, 0),
      unverified: stats.filter(s => !s.verified).reduce((sum, s) => sum + s._count, 0),
      admins: stats.filter(s => s.role === "ADMIN").reduce((sum, s) => sum + s._count, 0),
      users: stats.filter(s => s.role === "USER").reduce((sum, s) => sum + s._count, 0),
    }

    return successResponse(
      {
        users,
        stats: userStats,
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
    console.error("Error fetching admin users:", error)
    return errorResponse(error, 500)
  }
})
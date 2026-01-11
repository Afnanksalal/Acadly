import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"
import { validatePagination } from "@/lib/validation"

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const { page, limit, skip } = validatePagination({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    })

    const action = searchParams.get("action")
    const resource = searchParams.get("resource")
    const userId = searchParams.get("userId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: {
      action?: { contains: string; mode: 'insensitive' }
      resource?: string
      userId?: string
      createdAt?: { gte?: Date; lte?: Date }
    } = {}
    
    if (action) where.action = { contains: action, mode: "insensitive" }
    if (resource) where.resource = resource
    if (userId) where.userId = userId
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    // Get action breakdown stats
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10
    })

    // Get resource breakdown
    const resourceStats = await prisma.auditLog.groupBy({
      by: ['resource'],
      _count: true,
      orderBy: { _count: { resource: 'desc' } }
    })

    return successResponse(
      {
        logs,
        stats: {
          total,
          actionBreakdown: actionStats.map(s => ({ action: s.action, count: s._count })),
          resourceBreakdown: resourceStats.map(s => ({ resource: s.resource, count: s._count }))
        }
      },
      200,
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    )
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return errorResponse(error, 500)
  }
})

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

// GET all disputes (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        reporter: {
          select: { name: true, email: true }
        },
        transaction: {
          include: {
            listing: {
              select: { title: true, price: true }
            },
            buyer: {
              select: { name: true, email: true }
            },
            seller: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    const total = await prisma.dispute.count({ where })

    return successResponse({
      disputes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching disputes:", error)
    return errorResponse(error, 500)
  }
})

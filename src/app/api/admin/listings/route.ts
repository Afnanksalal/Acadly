import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            transactions: true,
            chats: true
          }
        }
      },
      take: 100 // Limit to recent 100 listings
    })

    return successResponse({ listings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return errorResponse(error, 500)
  }
})

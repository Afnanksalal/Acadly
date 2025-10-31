import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response"

// GET /api/profile/[username] - Get public profile by username
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        department: true,
        year: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            sales: true
          }
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true
              }
            },
            transaction: {
              include: {
                listing: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!profile) {
      return notFoundResponse("Profile not found")
    }

    return successResponse({ profile })

  } catch (error) {
    console.error("Get public profile error:", error)
    return errorResponse(error, 500)
  }
}

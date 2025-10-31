import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const trophySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["ACADEMIC", "SPORTS", "CULTURAL", "TECHNICAL", "LEADERSHIP", "COMMUNITY", "OTHER"]),
  awardedBy: z.string().max(200).optional(),
  awardedAt: z.string().datetime(),
  imageUrl: z.string().url().optional(),
})

// GET /api/profile/trophies - Get user's trophies
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    
    const where = userId ? { userId } : {}
    
    const trophies = await prisma.trophy.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: { awardedAt: "desc" }
    })

    return successResponse({ trophies })
  } catch (error) {
    console.error("Get trophies error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/profile/trophies - Add new trophy
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = trophySchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid trophy data")
    }

    const data = parsed.data

    const trophy = await prisma.trophy.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        awardedBy: data.awardedBy,
        awardedAt: new Date(data.awardedAt),
        imageUrl: data.imageUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    })

    return successResponse({ trophy }, 201)
  } catch (error) {
    console.error("Create trophy error:", error)
    return errorResponse(error, 500)
  }
})
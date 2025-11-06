import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const badgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable().transform(val => val || null),
  type: z.enum(["ACHIEVEMENT", "SKILL", "PARTICIPATION", "MILESTONE", "SPECIAL"]),
  iconUrl: z.string().url().optional().nullable().or(z.literal("")).transform(val => val || null),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default("#3B82F6"),
  isVisible: z.boolean().default(true),
})

// GET /api/profile/badges - Get user's badges
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    
    const where: any = userId ? { userId } : {}
    if (type) where.type = type
    
    const badges = await prisma.badge.findMany({
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
      orderBy: { earnedAt: "desc" }
    })

    return successResponse({ badges })
  } catch (error) {
    console.error("Get badges error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/profile/badges - Add new badge
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = badgeSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid badge data")
    }

    const data = parsed.data

    const badge = await prisma.badge.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        type: data.type,
        iconUrl: data.iconUrl,
        color: data.color || "#3B82F6",
        isVisible: data.isVisible,
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

    return successResponse({ badge }, 201)
  } catch (error) {
    console.error("Create badge error:", error)
    return errorResponse(error, 500)
  }
})
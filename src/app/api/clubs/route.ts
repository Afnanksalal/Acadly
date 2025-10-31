import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const clubSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: z.enum(["ACADEMIC", "TECHNICAL", "CULTURAL", "SPORTS", "SOCIAL", "PROFESSIONAL", "HOBBY"]),
  logoUrl: z.string().url().optional(),
})

const membershipSchema = z.object({
  clubId: z.string().uuid(),
  role: z.enum(["MEMBER", "COORDINATOR", "SECRETARY", "TREASURER", "VICE_PRESIDENT", "PRESIDENT", "ADVISOR"]).default("MEMBER"),
  position: z.string().max(100).optional(),
})

// GET /api/clubs - Get all clubs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const userId = searchParams.get("userId") // Get clubs for specific user
    
    if (userId) {
      // Get user's club memberships
      const memberships = await prisma.clubMembership.findMany({
        where: { 
          userId,
          isActive: true 
        },
        include: {
          club: true
        },
        orderBy: { joinedAt: "desc" }
      })
      
      return successResponse({ memberships })
    }
    
    const where: any = { isActive: true }
    if (category) where.category = category
    
    const clubs = await prisma.club.findMany({
      where,
      include: {
        members: {
          where: { isActive: true },
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
        },
        _count: {
          select: {
            members: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return successResponse({ clubs })
  } catch (error) {
    console.error("Get clubs error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/clubs - Create new club
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = clubSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid club data")
    }

    const data = parsed.data

    // Check if club name already exists
    const existingClub = await prisma.club.findUnique({
      where: { name: data.name }
    })

    if (existingClub) {
      return validationErrorResponse("A club with this name already exists")
    }

    const club = await prisma.club.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl,
      }
    })

    // Make the creator the president
    await prisma.clubMembership.create({
      data: {
        userId: user.id,
        clubId: club.id,
        role: "PRESIDENT",
        position: "Founder & President"
      }
    })

    return successResponse({ club }, 201)
  } catch (error) {
    console.error("Create club error:", error)
    return errorResponse(error, 500)
  }
})

// POST /api/clubs/join - Join a club
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = membershipSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid membership data")
    }

    // This would need auth, but keeping it simple for now
    // In real implementation, you'd use withVerifiedAuth

    return successResponse({ message: "Membership updated" })
  } catch (error) {
    console.error("Update membership error:", error)
    return errorResponse(error, 500)
  }
}
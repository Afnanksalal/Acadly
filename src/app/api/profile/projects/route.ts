import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(["ACADEMIC", "PERSONAL", "HACKATHON", "INTERNSHIP", "FREELANCE", "OPEN_SOURCE", "RESEARCH"]),
  technologies: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"]).default("COMPLETED"),
  isPublic: z.boolean().default(true),
})

// GET /api/profile/projects - Get user's projects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    
    const where: any = {}
    if (userId) where.userId = userId
    if (category) where.category = category
    if (status) where.status = status
    
    // If viewing someone else's projects, only show public ones
    if (userId) {
      where.isPublic = true
    }
    
    const projects = await prisma.project.findMany({
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
      orderBy: { createdAt: "desc" }
    })

    return successResponse({ projects })
  } catch (error) {
    console.error("Get projects error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/profile/projects - Add new project
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = projectSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid project data")
    }

    const data = parsed.data

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        technologies: data.technologies || [],
        githubUrl: data.githubUrl,
        liveUrl: data.liveUrl,
        imageUrls: data.imageUrls || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        isPublic: data.isPublic,
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

    return successResponse({ project }, 201)
  } catch (error) {
    console.error("Create project error:", error)
    return errorResponse(error, 500)
  }
})
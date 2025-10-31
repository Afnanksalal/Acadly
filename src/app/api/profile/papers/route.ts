import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withVerifiedAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { z } from "zod"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const paperSchema = z.object({
  title: z.string().min(1).max(300),
  abstract: z.string().max(2000).optional(),
  authors: z.array(z.string()),
  journal: z.string().max(200).optional(),
  conference: z.string().max(200).optional(),
  publishedAt: z.string().datetime().optional(),
  doi: z.string().max(100).optional(),
  pdfUrl: z.string().url().optional(),
  category: z.enum(["RESEARCH", "REVIEW", "CONFERENCE", "JOURNAL", "THESIS", "DISSERTATION"]),
  keywords: z.array(z.string()).optional(),
  citations: z.number().int().min(0).default(0),
})

// GET /api/profile/papers - Get user's papers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")
    
    const where: any = {}
    if (userId) where.userId = userId
    if (category) where.category = category
    
    const papers = await prisma.paper.findMany({
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
      orderBy: { publishedAt: "desc" }
    })

    return successResponse({ papers })
  } catch (error) {
    console.error("Get papers error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/profile/papers - Add new paper
export const POST = withVerifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const parsed = paperSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid paper data")
    }

    const data = parsed.data

    const paper = await prisma.paper.create({
      data: {
        userId: user.id,
        title: data.title,
        abstract: data.abstract,
        authors: data.authors,
        journal: data.journal,
        conference: data.conference,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        doi: data.doi,
        pdfUrl: data.pdfUrl,
        category: data.category,
        keywords: data.keywords || [],
        citations: data.citations,
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

    return successResponse({ paper }, 201)
  } catch (error) {
    console.error("Create paper error:", error)
    return errorResponse(error, 500)
  }
})
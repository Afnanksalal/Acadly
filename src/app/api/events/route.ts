import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { z } from "zod"
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

// GET /api/events - Get all events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const upcoming = searchParams.get("upcoming") === "true"
    const creatorId = searchParams.get("creatorId")
    
    const where: any = { isActive: true }
    
    if (status) {
      where.status = status
    }
    
    if (upcoming) {
      where.startTime = { gte: new Date() }
      where.status = { in: ["UPCOMING", "ONGOING"] }
    }
    
    if (creatorId) {
      where.creatorId = creatorId
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { startTime: "asc" }
    })
    
    // Auto-update event status based on time
    const now = new Date()
    for (const event of events) {
      let newStatus = event.status
      
      if (event.status === "UPCOMING" && event.startTime <= now) {
        newStatus = event.endTime && event.endTime <= now ? "COMPLETED" : "ONGOING"
      } else if (event.status === "ONGOING" && event.endTime && event.endTime <= now) {
        newStatus = "COMPLETED"
      }
      
      if (newStatus !== event.status) {
        await prisma.event.update({
          where: { id: event.id },
          data: { status: newStatus }
        })
      }
    }
    
    return successResponse({ events })
    
  } catch (error) {
    console.error("Get events error:", error)
    return errorResponse(error, 500)
  }
}

// POST /api/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }
    
    // Check if user is verified
    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile || !profile.verified) {
      return forbiddenResponse("Please verify your account to create events")
    }
    
    const schema = z.object({
      title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
      description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
      imageUrl: z.string().url("Invalid image URL").optional().nullable(),
      venue: z.string().min(3, "Venue is required").max(200, "Venue too long"),
      hostType: z.enum(["CLUB", "DEPARTMENT", "STUDENT_GROUP", "COLLEGE", "OTHER"]),
      hostName: z.string().min(2, "Host name is required").max(100, "Host name too long"),
      startTime: z.string().datetime("Invalid start time"),
      endTime: z.string().datetime("Invalid end time").optional().nullable()
    })
    
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return validationErrorResponse(firstError.message)
    }
    
    const data = parsed.data
    const startTime = new Date(data.startTime)
    const endTime = data.endTime ? new Date(data.endTime) : null
    
    // Validate times
    if (startTime < new Date()) {
      return validationErrorResponse("Event start time must be in the future")
    }
    
    if (endTime && endTime <= startTime) {
      return validationErrorResponse("Event end time must be after start time")
    }
    
    const event = await prisma.event.create({
      data: {
        creatorId: user.id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        venue: data.venue,
        hostType: data.hostType,
        hostName: data.hostName,
        startTime,
        endTime,
        status: "UPCOMING"
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    })
    
    console.log('Event created:', { id: event.id, title: event.title, creator: user.id })
    
    return successResponse({ 
      event,
      message: "Event created successfully" 
    }, 201)
    
  } catch (error) {
    console.error("Create event error:", error)
    return errorResponse(error, 500)
  }
}
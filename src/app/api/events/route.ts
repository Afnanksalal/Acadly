import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

// GET /api/events - Get all events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const upcoming = searchParams.get("upcoming") === "true"
    
    const where: any = { isActive: true }
    
    if (status) {
      where.status = status
    }
    
    if (upcoming) {
      where.startTime = { gte: new Date() }
      where.status = { in: ["UPCOMING", "ONGOING"] }
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
    
    return NextResponse.json({ events })
    
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to fetch events" } 
    }, { status: 500 })
  }
}

// POST /api/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }
    
    // Check if user is verified
    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile || !profile.verified) {
      return NextResponse.json({ 
        error: { code: "NOT_VERIFIED", message: "Please verify your account to create events" } 
      }, { status: 403 })
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
      return NextResponse.json({ 
        error: { 
          code: "INVALID_INPUT", 
          message: firstError.message,
          details: parsed.error.flatten() 
        } 
      }, { status: 400 })
    }
    
    const data = parsed.data
    const startTime = new Date(data.startTime)
    const endTime = data.endTime ? new Date(data.endTime) : null
    
    // Validate times
    if (startTime < new Date()) {
      return NextResponse.json({ 
        error: { code: "INVALID_TIME", message: "Event start time must be in the future" } 
      }, { status: 400 })
    }
    
    if (endTime && endTime <= startTime) {
      return NextResponse.json({ 
        error: { code: "INVALID_TIME", message: "Event end time must be after start time" } 
      }, { status: 400 })
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
    
    return NextResponse.json({ 
      event,
      message: "Event created successfully" 
    }, { status: 201 })
    
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ 
      error: { 
        code: "SERVER_ERROR", 
        message: "Failed to create event. Please try again." 
      } 
    }, { status: 500 })
  }
}

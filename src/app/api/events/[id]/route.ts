import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

// GET /api/events/[id] - Get single event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
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
      }
    })
    
    if (!event) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Event not found" } 
      }, { status: 404 })
    }
    
    // Auto-update status
    const now = new Date()
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
      event.status = newStatus as any
    }
    
    return NextResponse.json({ event })
    
  } catch (error) {
    console.error("Get event error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to fetch event" } 
    }, { status: 500 })
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }
    
    const event = await prisma.event.findUnique({ where: { id: params.id } })
    
    if (!event) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Event not found" } 
      }, { status: 404 })
    }
    
    if (event.creatorId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only event creator can update this event" } 
      }, { status: 403 })
    }
    
    const schema = z.object({
      title: z.string().min(5).max(200).optional(),
      description: z.string().min(20).max(5000).optional(),
      imageUrl: z.string().url().optional().nullable(),
      venue: z.string().min(3).max(200).optional(),
      hostType: z.enum(["CLUB", "DEPARTMENT", "STUDENT_GROUP", "COLLEGE", "OTHER"]).optional(),
      hostName: z.string().min(2).max(100).optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional().nullable(),
      status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional()
    })
    
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json({ 
        error: { 
          code: "INVALID_INPUT", 
          message: firstError.message 
        } 
      }, { status: 400 })
    }
    
    const data = parsed.data
    const updateData: any = {}
    
    if (data.title) updateData.title = data.title
    if (data.description) updateData.description = data.description
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.venue) updateData.venue = data.venue
    if (data.hostType) updateData.hostType = data.hostType
    if (data.hostName) updateData.hostName = data.hostName
    if (data.status) updateData.status = data.status
    
    if (data.startTime) {
      const startTime = new Date(data.startTime)
      if (startTime < new Date() && event.status === "UPCOMING") {
        return NextResponse.json({ 
          error: { code: "INVALID_TIME", message: "Cannot reschedule to past time" } 
        }, { status: 400 })
      }
      updateData.startTime = startTime
      if (data.status !== "CANCELLED") {
        updateData.status = "RESCHEDULED"
      }
    }
    
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime ? new Date(data.endTime) : null
    }
    
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
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
    
    console.log('Event updated:', { id: updatedEvent.id, changes: Object.keys(updateData) })
    
    return NextResponse.json({ 
      event: updatedEvent,
      message: "Event updated successfully" 
    })
    
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to update event" } 
    }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Delete/Cancel event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }
    
    const event = await prisma.event.findUnique({ where: { id: params.id } })
    
    if (!event) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Event not found" } 
      }, { status: 404 })
    }
    
    if (event.creatorId !== user.id) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Only event creator can cancel this event" } 
      }, { status: 403 })
    }
    
    // Soft delete - mark as cancelled and inactive
    const cancelledEvent = await prisma.event.update({
      where: { id: params.id },
      data: { 
        status: "CANCELLED",
        isActive: false
      }
    })
    
    console.log('Event cancelled:', { id: cancelledEvent.id })
    
    return NextResponse.json({ 
      message: "Event cancelled successfully" 
    })
    
  } catch (error) {
    console.error("Cancel event error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to cancel event" } 
    }, { status: 500 })
  }
}

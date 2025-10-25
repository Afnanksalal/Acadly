import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { z } from "zod"

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reviewsReceived: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Profile not found" } 
      }, { status: 404 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Failed to fetch profile" } 
    }, { status: 500 })
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json({ 
        error: { code: "INVALID_JSON", message: "Invalid request body" } 
      }, { status: 400 })
    }

    // Validation schema
    const schema = z.object({
      name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
      username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username is too long")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .optional(),
      phone: z.string()
        .regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits")
        .optional()
        .nullable(),
      department: z.string().max(100, "Department name is too long").optional().nullable(),
      year: z.string().max(20, "Year is too long").optional().nullable(),
      class: z.string().max(50, "Class name is too long").optional().nullable(),
      bio: z.string().max(500, "Bio is too long (max 500 characters)").optional().nullable(),
      avatarUrl: z.string().url("Invalid image URL").optional().nullable()
    })

    const parsed = schema.safeParse(body)
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

    // Check if username is already taken (if username is being updated)
    if (data.username) {
      const existingUser = await prisma.profile.findUnique({
        where: { username: data.username }
      })
      
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ 
          error: { code: "USERNAME_TAKEN", message: "Username is already taken" } 
        }, { status: 400 })
      }
    }

    // Update profile
    const profile = await prisma.profile.update({
      where: { id: user.id },
      data,
      include: {
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reviewsReceived: true
          }
        }
      }
    })

    console.log('Profile updated successfully:', { userId: user.id, fields: Object.keys(data) })

    return NextResponse.json({ 
      profile,
      message: "Profile updated successfully" 
    }, { status: 200 })

  } catch (error) {
    console.error("Update profile error:", error)
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: { code: "DUPLICATE", message: "This value is already in use" } 
        }, { status: 400 })
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ 
          error: { code: "NOT_FOUND", message: "Profile not found" } 
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: { 
        code: "SERVER_ERROR", 
        message: error instanceof Error ? error.message : "Failed to update profile" 
      } 
    }, { status: 500 })
  }
}

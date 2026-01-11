import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { z } from "zod"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { isCollegeEmail, getEmailVerificationStatus } from "@/lib/college-domains"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    // Check if profile exists, create if not
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            listings: true,
            sales: true,
            purchases: true
          }
        }
      }
    })

    // Auto-create profile if doesn't exist
    if (!profile) {
      const email = user.email || ''
      const verificationStatus = getEmailVerificationStatus(email)
      
      // Check admin list
      const adminList = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      
      const isAdmin = adminList.includes(email.toLowerCase()) || verificationStatus.isAdmin
      
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: email,
          verified: verificationStatus.shouldAutoVerify || isAdmin,
          role: isAdmin ? 'ADMIN' : 'USER'
        },
        include: {
          _count: {
            select: {
              listings: true,
              sales: true,
              purchases: true
            }
          }
        }
      })
      
      console.log(`[PROFILE] Created profile for ${email}:`, {
        verified: profile.verified,
        role: profile.role,
        reason: verificationStatus.reason
      })
    }

    // Check if profile should be auto-verified (for existing unverified profiles)
    if (!profile.verified && profile.email) {
      const verificationStatus = getEmailVerificationStatus(profile.email)
      
      if (verificationStatus.shouldAutoVerify) {
        profile = await prisma.profile.update({
          where: { id: user.id },
          data: { 
            verified: true,
            role: verificationStatus.isAdmin ? 'ADMIN' : profile.role
          },
          include: {
            _count: {
              select: {
                listings: true,
                sales: true,
                purchases: true
              }
            }
          }
        })
        
        console.log(`[PROFILE] Auto-verified ${profile.email}: ${verificationStatus.reason}`)
      }
    }

    return successResponse({ profile })

  } catch (error) {
    console.error("Get profile error:", error)
    return errorResponse(error, 500)
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("JSON parsing error:", error)
      return validationErrorResponse("Invalid request body")
    }

    const schema = z.object({
      username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
      name: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      department: z.string().max(100).optional(),
      year: z.enum(["1", "2", "3", "4", "Graduate", "Faculty"]).optional(),
      avatarUrl: z.string().url().optional().nullable(),
      phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional().nullable(),
      location: z.string().max(100).optional().nullable(),
      socialLinks: z.object({
        instagram: z.string().url().optional().nullable(),
        linkedin: z.string().url().optional().nullable(),
        twitter: z.string().url().optional().nullable()
      }).optional()
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return validationErrorResponse(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    const data = parsed.data

    // Check username uniqueness if provided
    if (data.username) {
      const existingUser = await prisma.profile.findUnique({
        where: { username: data.username }
      })
      
      if (existingUser && existingUser.id !== user.id) {
        return validationErrorResponse("Username is already taken")
      }
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data,
      include: {
        _count: {
          select: {
            listings: true,
            sales: true,
            purchases: true
          }
        }
      }
    })

    console.log('Profile updated successfully:', { userId: user.id, fields: Object.keys(data) })

    return successResponse({ 
      profile,
      message: "Profile updated successfully" 
    })

  } catch (error) {
    console.error("Update profile error:", error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return validationErrorResponse("This value is already in use")
      }
      if (error.code === 'P2025') {
        return notFoundResponse("Profile not found")
      }
    }
    
    return errorResponse(error, 500)
  }
}
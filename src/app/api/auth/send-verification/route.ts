import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { supabaseServer } from "@/lib/supabase-server"

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Check if user is already verified
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    })

    if (!profile) {
      return validationErrorResponse("Profile not found")
    }

    if (profile.verified) {
      return validationErrorResponse("Email is already verified")
    }

    // Send verification email using Supabase
    const supabase = supabaseServer()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: profile.email,
    })

    if (error) {
      console.error("Error sending verification email:", error)
      return errorResponse(new Error("Failed to send verification email"), 500)
    }

    return successResponse({
      message: "Verification email sent successfully",
      email: profile.email,
    })
  } catch (error) {
    console.error("Error sending verification email:", error)
    return errorResponse(error, 500)
  }
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Check verification status
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        verified: true,
      },
    })

    if (!profile) {
      return validationErrorResponse("Profile not found")
    }

    return successResponse({
      verified: profile.verified,
      email: profile.email,
    })
  } catch (error) {
    console.error("Error checking verification status:", error)
    return errorResponse(error, 500)
  }
})
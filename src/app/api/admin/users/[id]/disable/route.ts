import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { validateUUIDForAPI } from "@/lib/uuid-validation"
import { successResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, validationErrorResponse } from "@/lib/api-response"
import { createNotification } from "@/lib/notifications"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Validate UUID format
  const validation = validateUUIDForAPI(params.id, "user")
  if (!validation.isValid) {
    return validation.response
  }

  const supabase = createRouteHandlerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse("Login required")
  
  const admin = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!admin || admin.role !== "ADMIN") return forbiddenResponse("Admin only")

  const targetId = params.id
  
  // Prevent self-disable
  if (targetId === user.id) {
    return validationErrorResponse("Cannot disable your own account")
  }

  const target = await prisma.profile.findUnique({ where: { id: targetId } })
  if (!target) return notFoundResponse("User not found")

  // Prevent disabling other admins
  if (target.role === "ADMIN") {
    return validationErrorResponse("Cannot disable admin accounts")
  }

  // Get reason from request body if provided
  let reason = "Account disabled by administrator"
  try {
    const body = await request.json()
    if (body.reason) reason = body.reason
  } catch {
    // No body provided, use default reason
  }

  // Disable user and log action
  await prisma.$transaction(async (tx) => {
    // Disable user
    await tx.profile.update({ 
      where: { id: targetId }, 
      data: { verified: false } 
    })

    // Deactivate all user's listings
    await tx.listing.updateMany({
      where: { userId: targetId },
      data: { isActive: false }
    })

    // Log the action
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: "USER_DISABLED",
        resource: "USER",
        resourceId: targetId,
        metadata: {
          targetEmail: target.email,
          reason,
          listingsDeactivated: true
        }
      }
    })
  })

  // Notify the user
  await createNotification({
    userId: targetId,
    type: "ADMIN",
    title: "Account Disabled",
    message: reason,
    priority: "URGENT"
  })

  return successResponse({ 
    success: true,
    message: `User ${target.email} has been disabled`
  })
}

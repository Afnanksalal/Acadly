import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/auth"
import { successResponse, validationErrorResponse, notFoundResponse } from "@/lib/api-response"
import { createNotification, notifyAccountVerified } from "@/lib/notifications"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const verifySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  action: z.enum(["verify", "unverify"]).default("verify"),
  reason: z.string().max(500).optional()
})

const bulkVerifySchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(["verify", "unverify"]),
  reason: z.string().max(500).optional()
})

/**
 * POST /api/admin/verify
 * Verify or unverify a user account
 */
export const POST = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const contentType = request.headers.get("content-type") || ""
    let data: z.infer<typeof verifySchema>

    // Handle form data (for simple form submissions)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData()
      const userId = form.get("userId")?.toString()
      
      if (!userId) {
        return validationErrorResponse("userId required")
      }

      // Simple form submission - verify and redirect
      const user = await prisma.profile.findUnique({ where: { id: userId } })
      if (!user) {
        return notFoundResponse("User not found")
      }

      await prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { id: userId },
          data: { verified: true }
        })

        await tx.auditLog.create({
          data: {
            userId: admin.id,
            action: "USER_VERIFIED",
            resource: "USER",
            resourceId: userId,
            metadata: { targetEmail: user.email }
          }
        })
      })

      // Send notification
      await notifyAccountVerified(userId)

      // Redirect back to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Handle JSON API request
    const body = await request.json()
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid request data", parsed.error.errors)
    }

    data = parsed.data
    const { userId, action, reason } = data

    // Find user
    const user = await prisma.profile.findUnique({ where: { id: userId } })
    if (!user) {
      return notFoundResponse("User not found")
    }

    // Prevent unverifying admins
    if (action === "unverify" && user.role === "ADMIN") {
      return validationErrorResponse("Cannot unverify admin accounts")
    }

    // Update user and log action
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: userId },
        data: { verified: action === "verify" }
      })

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: action === "verify" ? "USER_VERIFIED" : "USER_UNVERIFIED",
          resource: "USER",
          resourceId: userId,
          metadata: {
            targetEmail: user.email,
            reason
          }
        }
      })
    })

    // Send notification
    if (action === "verify") {
      await notifyAccountVerified(userId)
    } else {
      await createNotification({
        userId,
        type: "ADMIN",
        title: "Account Verification Revoked",
        message: reason || "Your account verification has been revoked. Please contact support.",
        priority: "HIGH"
      })
    }

    return successResponse({
      success: true,
      userId,
      verified: action === "verify",
      message: `User ${user.email} has been ${action === "verify" ? "verified" : "unverified"}`
    })
  } catch (error) {
    console.error("Error verifying user:", error)
    return validationErrorResponse("Failed to update user verification status")
  }
})

/**
 * PUT /api/admin/verify
 * Bulk verify/unverify users
 */
export const PUT = withAdminAuth(async (request: NextRequest, admin) => {
  try {
    const body = await request.json()
    const parsed = bulkVerifySchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse("Invalid request data", parsed.error.errors)
    }

    const { userIds, action, reason } = parsed.data

    // Get users
    const users = await prisma.profile.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, role: true }
    })

    if (users.length === 0) {
      return notFoundResponse("No users found")
    }

    // Filter out admins if unverifying
    const targetUsers = action === "unverify"
      ? users.filter(u => u.role !== "ADMIN")
      : users

    const targetIds = targetUsers.map(u => u.id)

    // Update users and log action
    await prisma.$transaction(async (tx) => {
      await tx.profile.updateMany({
        where: { id: { in: targetIds } },
        data: { verified: action === "verify" }
      })

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: action === "verify" ? "BULK_USER_VERIFIED" : "BULK_USER_UNVERIFIED",
          resource: "USER",
          metadata: {
            userCount: targetIds.length,
            userIds: targetIds,
            reason
          }
        }
      })
    })

    // Send notifications
    const notificationPromises = targetUsers.map(user => {
      if (action === "verify") {
        return notifyAccountVerified(user.id)
      } else {
        return createNotification({
          userId: user.id,
          type: "ADMIN",
          title: "Account Verification Revoked",
          message: reason || "Your account verification has been revoked.",
          priority: "HIGH"
        })
      }
    })

    await Promise.allSettled(notificationPromises)

    return successResponse({
      success: true,
      processed: targetIds.length,
      skipped: users.length - targetIds.length,
      action,
      message: `${targetIds.length} users have been ${action === "verify" ? "verified" : "unverified"}`
    })
  } catch (error) {
    console.error("Error bulk verifying users:", error)
    return validationErrorResponse("Failed to update user verification status")
  }
})

/**
 * GET /api/admin/verify
 * Get pending verification requests
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [pendingUsers, total] = await Promise.all([
      prisma.profile.findMany({
        where: { verified: false },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          department: true,
          year: true,
          createdAt: true,
          _count: {
            select: { listings: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.profile.count({ where: { verified: false } })
    ])

    return successResponse({
      users: pendingUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching pending verifications:", error)
    return validationErrorResponse("Failed to fetch pending verifications")
  }
})
